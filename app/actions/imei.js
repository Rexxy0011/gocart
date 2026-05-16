'use server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { decodeImei, isImeiShape } from '@/lib/imei/lookup'

const REFRESH_AFTER_DAYS = 90

// Free IMEI check — runs at submit time when the seller types an IMEI
// AND the listing's condition warrants it (used / refurbished). New
// sealed phones don't run this; nothing to verify against and the seller
// shouldn't be forced to break the seal to read the IMEI sticker.
//
// Returns { ok: true, report: { decoded, lastCheckedAt, fromCache } }
// or { error }.
export async function runImeiCheck({ imei }) {
    const cleaned = (imei || '').replace(/\D/g, '')
    if (!isImeiShape(cleaned)) return { error: 'IMEI must be exactly 15 digits.' }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Sign in first.' }

    const admin = createAdminClient()

    const { data: cached } = await admin
        .from('imei_reports')
        .select('imei, decoded, last_checked_at')
        .eq('imei', cleaned)
        .maybeSingle()

    const isFresh = cached && (
        Date.now() - new Date(cached.last_checked_at).getTime()
        < REFRESH_AFTER_DAYS * 24 * 60 * 60 * 1000
    )
    if (isFresh) {
        return {
            ok: true,
            report: {
                decoded: cached.decoded,
                lastCheckedAt: cached.last_checked_at,
                fromCache: true,
            },
        }
    }

    let decoded
    try {
        decoded = await decodeImei(cleaned)
    } catch (e) {
        return { error: e?.message || 'IMEI check failed.' }
    }

    if (!decoded.luhnValid) {
        return { error: 'IMEI checksum failed — double-check the digits you entered.' }
    }

    const { error: upsertErr } = await admin
        .from('imei_reports')
        .upsert({
            imei: cleaned,
            decoded,
            last_checked_at: new Date().toISOString(),
        })
    if (upsertErr) return { error: upsertErr.message }

    return {
        ok: true,
        report: {
            decoded,
            lastCheckedAt: new Date().toISOString(),
            fromCache: false,
        },
    }
}

// Append-only history log. Mirrors recordVehicleHistory — same IMEI listed
// multiple times surfaces a re-listing audit trail on the product page.
export async function recordPhoneHistory({ imei, listingId, claimedCondition }) {
    const cleaned = (imei || '').replace(/\D/g, '')
    if (!isImeiShape(cleaned)) return { error: 'Invalid IMEI.' }

    const admin = createAdminClient()
    const { error } = await admin
        .from('phone_history')
        .insert({
            imei: cleaned,
            listing_id: listingId || null,
            claimed_condition: claimedCondition || null,
        })
    if (error) return { error: error.message }
    return { ok: true }
}
