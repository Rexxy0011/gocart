'use server'
import { randomUUID } from 'crypto'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { initializeTransaction } from '@/lib/paystack'
import { BOOST_CATALOG } from '@/lib/boosts'

const SITE_URL = () => (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')

// Initiates a boost purchase. Inserts a pending boost_orders row, asks
// Paystack for an authorization URL, then redirects the user to it.
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

    let authorizationUrl
    try {
        const data = await initializeTransaction({
            email: user.email,
            amountKobo,
            reference,
            callbackUrl: `${SITE_URL()}/api/paystack/callback`,
            metadata: {
                listing_id: listingId,
                boost_key: boostKey,
                user_id: user.id,
            },
        })
        authorizationUrl = data.authorization_url
    } catch (err) {
        // Mark the order failed so we don't leave a phantom pending row.
        await supabase.from('boost_orders')
            .update({ status: 'failed' })
            .eq('reference', reference)
        return { error: err.message || 'Could not start payment.' }
    }

    // redirect throws — won't reach the next line.
    redirect(authorizationUrl)
}
