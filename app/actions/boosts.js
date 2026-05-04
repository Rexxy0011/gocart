'use server'
import { randomUUID } from 'crypto'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { initializeTransaction } from '@/lib/paystack'
import { BOOST_CATALOG } from '@/lib/boosts'

// Derive the public origin from the actual request — works on localhost,
// preview deploys, and prod without needing NEXT_PUBLIC_SITE_URL to be
// set correctly per-environment. Falls back to the env var, then localhost.
const resolveSiteUrl = async () => {
    try {
        const h = await headers()
        const host = h.get('x-forwarded-host') || h.get('host')
        const proto = h.get('x-forwarded-proto') || (host?.startsWith('localhost') ? 'http' : 'https')
        if (host) return `${proto}://${host}`
    } catch {}
    return (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')
}

// Initiates a boost purchase. Inserts a pending boost_orders row, asks
// Paystack for an authorization URL, and returns it. The CLIENT then
// does window.location.assign(url) — Next.js server-action redirect() to
// a cross-origin URL is unreliable in 15.x and silently no-ops.
// On payment completion Paystack returns the user to /api/paystack/callback,
// which verifies + applies the boost.
export async function initBoostPayment({ listingId, boostKey }) {
    const boost = BOOST_CATALOG[boostKey]
    if (!boost) return { error: 'Invalid boost' }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'You need to be signed in to boost a listing.' }
    if (!user.email) return { error: 'Your account has no email — Paystack needs one.' }

    // Verify the listing belongs to the user. RLS would do this in a tight
    // setup; until we wire it, check explicitly.
    const { data: listing } = await supabase
        .from('products')
        .select('id, store:stores!inner(user_id)')
        .eq('id', listingId)
        .maybeSingle()
    if (!listing) return { error: 'Listing not found.' }
    if (listing.store.user_id !== user.id) return { error: 'You can only boost your own listings.' }

    // Generate a reference — short, prefixed, includes the boost key for
    // grep-ability in the Paystack dashboard.
    const reference = `gc_${boostKey}_${randomUUID().replace(/-/g, '').slice(0, 16)}`
    const amountKobo = boost.price * 100

    const { error: insertErr } = await supabase
        .from('boost_orders')
        .insert({
            user_id: user.id,
            listing_id: listingId,
            boost_key: boostKey,
            amount_kobo: amountKobo,
            reference,
            status: 'pending',
            metadata: { duration_days: boost.durationDays },
        })
    if (insertErr) return { error: insertErr.message }

    try {
        const siteUrl = await resolveSiteUrl()
        const callbackUrl = `${siteUrl}/api/paystack/callback`
        console.log('[boost] init', { reference, boostKey, callbackUrl })
        const data = await initializeTransaction({
            email: user.email,
            amountKobo,
            reference,
            callbackUrl,
            metadata: {
                listing_id: listingId,
                boost_key: boostKey,
                user_id: user.id,
            },
        })
        return { url: data.authorization_url }
    } catch (err) {
        // Mark the order failed so we don't leave a phantom pending row.
        await supabase.from('boost_orders')
            .update({ status: 'failed' })
            .eq('reference', reference)
        return { error: err.message || 'Could not start payment.' }
    }
}
