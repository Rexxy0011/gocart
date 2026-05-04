import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyTransaction } from '@/lib/paystack'
import { BOOST_CATALOG } from '@/lib/boosts'

// Derive the redirect base from the actual request URL so we always
// land back on the same origin Paystack just sent the user from.
const baseFrom = (request) => new URL(request.url).origin
const back = (request, status) =>
    NextResponse.redirect(`${baseFrom(request)}/store/manage-product?boost=${status}`)

// Compute which *_until columns to set on the listing for a given boost.
// Returns a partial update object — callers spread it into a single
// .update() call so we never write half a boost.
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
            // Featured + Urgent + 3 daily Bumps. For now apply Featured +
            // Urgent expiries; the daily-bump piece kicks in once the cron
            // exists.
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

// Paystack returns the user here after they pay. URL has ?reference=…
// We verify with Paystack (so a forged URL can't fake a payment), then
// flip the boost_orders row + apply the boost expiry to the listing.
export async function GET(request) {
    const { searchParams } = new URL(request.url)
    const reference = searchParams.get('reference') || searchParams.get('trxref')
    console.log('[paystack callback] hit', { reference, url: request.url })

    if (!reference) return back(request, 'missing')

    const supabase = await createClient()

    // 1. Find the local order row (created at /transaction/initialize time)
    const { data: order, error: orderErr } = await supabase
        .from('boost_orders')
        .select('id, listing_id, boost_key, amount_kobo, status, metadata')
        .eq('reference', reference)
        .maybeSingle()

    if (orderErr) console.log('[paystack callback] order lookup error', orderErr)
    if (!order) {
        console.log('[paystack callback] no order for reference', reference)
        return back(request, 'unknown')
    }
    if (order.status === 'paid') {
        // Idempotent — Paystack might bounce the user here twice (refresh,
        // back button, webhook delay). Just take them to the dashboard.
        return back(request, 'ok')
    }

    // 2. Verify with Paystack — never trust the redirect alone.
    let pay
    try {
        pay = await verifyTransaction(reference)
    } catch (err) {
        console.log('[paystack callback] verify failed', err?.message)
        await supabase.from('boost_orders')
            .update({ status: 'failed' })
            .eq('reference', reference)
        return back(request, 'verify-failed')
    }

    if (pay.status !== 'success') {
        console.log('[paystack callback] pay not success', pay.status)
        await supabase.from('boost_orders')
            .update({ status: pay.status === 'abandoned' ? 'abandoned' : 'failed' })
            .eq('reference', reference)
        return back(request, 'failed')
    }

    // 3. Sanity-check the amount paid matches what we charged. Paystack
    // shouldn't lie about this but defensive coding is cheap.
    if (pay.amount !== order.amount_kobo) {
        console.log('[paystack callback] amount mismatch', { paid: pay.amount, expected: order.amount_kobo })
        await supabase.from('boost_orders')
            .update({ status: 'failed', metadata: { ...order.metadata, mismatch: pay.amount } })
            .eq('reference', reference)
        return back(request, 'mismatch')
    }

    // 4. Apply the boost — single update so the timestamp set is atomic.
    const durationDays = order.metadata?.duration_days || BOOST_CATALOG[order.boost_key]?.durationDays || 7
    const listingUpdate = buildListingUpdate(order.boost_key, durationDays)

    const { error: applyErr } = await supabase
        .from('products')
        .update(listingUpdate)
        .eq('id', order.listing_id)

    if (applyErr) {
        // Money taken, boost not applied — this is the bad path. Mark the
        // order paid anyway (Paystack confirmed) and flag the apply error
        // for manual review. With a real ops setup we'd alert here.
        console.log('[paystack callback] apply failed', applyErr)
        await supabase.from('boost_orders')
            .update({ status: 'paid', paid_at: new Date().toISOString(), metadata: { ...order.metadata, apply_error: applyErr.message } })
            .eq('reference', reference)
        return back(request, 'apply-failed')
    }

    await supabase.from('boost_orders')
        .update({ status: 'paid', paid_at: new Date().toISOString() })
        .eq('reference', reference)

    console.log('[paystack callback] applied', { reference, boostKey: order.boost_key, listingId: order.listing_id })
    return back(request, 'ok')
}
