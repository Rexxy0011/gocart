// SERVER-ONLY. Shared boost-fulfilment logic - turning a successful
// Paystack charge into an applied boost on the listing.
//
// Two independent paths call this with the same reference:
//   1. /api/paystack/callback - the browser redirect after payment
//   2. /api/paystack/webhook  - Paystack's server-to-server charge.success
// Either can win the race; the function is idempotent (an order already
// marked 'paid' short-circuits), so the loser is a harmless no-op.
//
// It uses the service-role admin client, NOT the user's session client.
// The callback used to run on the buyer's cookie - if that cookie was
// missing or expired (paid on another device, slow flow) RLS silently
// rejected the writes and money was taken with no boost applied. The
// webhook has no cookie at all. Service-role sidesteps both.

import { createAdminClient } from '@/lib/supabase/admin'
import { verifyTransaction } from '@/lib/paystack'
import { BOOST_CATALOG } from '@/lib/boosts'

// Compute which *_until columns to set on the listing for a given boost.
// Returns a partial update object - spread into a single .update() call so
// a boost is never half-written.
const buildListingUpdate = (boostKey, durationDays) => {
    const now = new Date()
    const until = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000).toISOString()
    const nowIso = now.toISOString()

    switch (boostKey) {
        case 'bump':
            return { bumped_at: nowIso, bumped_until: until }
        case 'featured':
            return { featured: true, featured_until: until }
        case 'urgent':
            return { urgent: true, urgent_until: until }
        case 'bulk_sale':
            return { bulk_sale: true, bulk_sale_until: until }
        case 'bundle': {
            // Featured + Urgent + Bump, all sharing the bundle duration.
            const bundleUntil = new Date(now.getTime() + BOOST_CATALOG.bundle.durationDays * 24 * 60 * 60 * 1000).toISOString()
            return {
                featured: true, featured_until: bundleUntil,
                urgent: true,   urgent_until: bundleUntil,
                bumped_at: nowIso, bumped_until: bundleUntil,
            }
        }
        default:
            return {}
    }
}

// Verify a Paystack reference and apply the boost it paid for.
// Returns { status } where status is one of:
//   'ok'           - boost applied (or was already applied)
//   'unknown'      - no boost_orders row for this reference
//   'verify-failed'- Paystack /verify call threw
//   'failed'       - charge not successful (failed / abandoned)
//   'mismatch'     - amount paid != amount charged
//   'apply-failed' - charge good but the listing update errored (money
//                    taken, boost not applied - needs manual review)
export async function fulfilBoostOrder(reference) {
    if (!reference) return { status: 'unknown' }

    const admin = createAdminClient()

    // 1. Find the local order row (created at /transaction/initialize time).
    const { data: order } = await admin
        .from('boost_orders')
        .select('id, listing_id, boost_key, amount_kobo, status, metadata')
        .eq('reference', reference)
        .maybeSingle()

    if (!order) {
        console.log('[boost fulfil] no order for reference', reference)
        return { status: 'unknown' }
    }

    // Idempotent - callback + webbook may both arrive. Whoever marked it
    // 'paid' already did the work.
    if (order.status === 'paid') return { status: 'ok' }

    // 2. Verify with Paystack - never trust the caller alone.
    let pay
    try {
        pay = await verifyTransaction(reference)
    } catch (err) {
        console.log('[boost fulfil] verify failed', err?.message)
        await admin.from('boost_orders')
            .update({ status: 'failed' })
            .eq('reference', reference)
        return { status: 'verify-failed' }
    }

    if (pay.status !== 'success') {
        console.log('[boost fulfil] pay not success', pay.status)
        await admin.from('boost_orders')
            .update({ status: pay.status === 'abandoned' ? 'abandoned' : 'failed' })
            .eq('reference', reference)
        return { status: 'failed' }
    }

    // 3. Sanity-check the amount paid matches what we charged. We only
    // reach here after pay.status === 'success' - so the money WAS
    // captured. Record it with a distinct 'mismatch' status (not 'failed',
    // which implies no charge) + paid_at, so it surfaces clearly in any
    // reconciliation / refund pass.
    if (pay.amount !== order.amount_kobo) {
        console.log('[boost fulfil] amount mismatch', { paid: pay.amount, expected: order.amount_kobo })
        await admin.from('boost_orders')
            .update({
                status: 'mismatch',
                paid_at: new Date().toISOString(),
                metadata: { ...order.metadata, mismatch: pay.amount },
            })
            .eq('reference', reference)
        return { status: 'mismatch' }
    }

    // 4. Apply the boost - single update so the timestamp set is atomic.
    const durationDays = order.metadata?.duration_days || BOOST_CATALOG[order.boost_key]?.durationDays || 7
    const listingUpdate = buildListingUpdate(order.boost_key, durationDays)

    const { error: applyErr } = await admin
        .from('products')
        .update(listingUpdate)
        .eq('id', order.listing_id)

    if (applyErr) {
        // Money taken, boost not applied - the bad path. Mark the order
        // paid anyway (Paystack confirmed it) and flag the apply error for
        // manual review.
        console.log('[boost fulfil] apply failed', applyErr)
        await admin.from('boost_orders')
            .update({ status: 'paid', paid_at: new Date().toISOString(), metadata: { ...order.metadata, apply_error: applyErr.message } })
            .eq('reference', reference)
        return { status: 'apply-failed' }
    }

    await admin.from('boost_orders')
        .update({ status: 'paid', paid_at: new Date().toISOString() })
        .eq('reference', reference)

    console.log('[boost fulfil] applied', { reference, boostKey: order.boost_key, listingId: order.listing_id })
    return { status: 'ok' }
}
