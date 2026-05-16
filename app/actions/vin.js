'use server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { decodeVin, fetchRecalls, isValidVin } from '@/lib/vin/nhtsa'

const REFRESH_AFTER_DAYS = 30

// Run the free VIN check from the listing form. Decodes via NHTSA,
// pulls recalls, caches the result. Idempotent - re-running the same
// VIN inside 30 days returns the cached row instead of hammering NHTSA.
//
// Returns:
//   { ok: true, report: { decoded, recalls, lastCheckedAt } } on success
//   { error: string } on failure
//
// Caller is the (signed-in) seller filling out /store/add-product. We
// don't require a particular role - the action only writes to public
// caches, no PII.
export async function runVinCheck({ vin }) {
    const upper = (vin || '').toUpperCase().trim()
    if (!isValidVin(upper)) return { error: 'VIN must be 17 characters (no I, O, Q).' }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Sign in first.' }

    const admin = createAdminClient()

    // Check cache first - saves an NHTSA round-trip on re-listings.
    const { data: cached } = await admin
        .from('vin_reports')
        .select('vin, decoded, recalls, last_checked_at')
        .eq('vin', upper)
        .maybeSingle()

    const isFresh = cached && (
        Date.now() - new Date(cached.last_checked_at).getTime()
        < REFRESH_AFTER_DAYS * 24 * 60 * 60 * 1000
    )
    if (isFresh) {
        return {
            ok: true,
            report: {
                decoded:        cached.decoded,
                recalls:        cached.recalls,
                lastCheckedAt:  cached.last_checked_at,
                fromCache:      true,
            },
        }
    }

    // Cache miss / stale - call NHTSA.
    let decoded
    try {
        decoded = await decodeVin(upper)
    } catch (e) {
        return { error: e?.message || 'VIN decode failed.' }
    }

    // ErrorCode 1 = "Check Digit (9th position) does not calculate properly".
    // Code 6 = "Incomplete VIN" etc. Anything other than 0 means the decode
    // is partial - still useful, but we tell the seller.
    if (decoded.errorCode && decoded.errorCode !== 0 && !decoded.make) {
        return { error: decoded.errorText || 'NHTSA couldn\'t decode this VIN.' }
    }

    const recalls = await fetchRecalls({
        make:      decoded.make,
        model:     decoded.model,
        modelYear: decoded.modelYear,
    })

    // Upsert into the cache. Service role bypasses RLS - sellers can't
    // forge a "0 recalls" row directly because RLS denies their writes.
    const { error: upsertErr } = await admin
        .from('vin_reports')
        .upsert({
            vin:             upper,
            decoded,
            recalls,
            last_checked_at: new Date().toISOString(),
        })

    if (upsertErr) return { error: upsertErr.message }

    return {
        ok: true,
        report: {
            decoded,
            recalls,
            lastCheckedAt:  new Date().toISOString(),
            fromCache:      false,
        },
    }
}

// Recorded at product-creation time. Append-only log of "this VIN was
// listed for sale on this date with this declared mileage". Future
// listings can compare against the log to flag mileage rollbacks.
export async function recordVehicleHistory({ vin, listingId, mileageMiles }) {
    const upper = (vin || '').toUpperCase().trim()
    if (!isValidVin(upper)) return { error: 'Invalid VIN.' }

    const admin = createAdminClient()
    const { error } = await admin
        .from('vehicle_history')
        .insert({
            vin:           upper,
            listing_id:    listingId || null,
            mileage_miles: mileageMiles ?? null,
        })
    if (error) return { error: error.message }
    return { ok: true }
}
