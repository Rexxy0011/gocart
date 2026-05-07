'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

// Submit a review for a listing. Upserts on (user_id, product_id) so a
// user editing their existing review just overwrites it instead of
// creating duplicates.
//
// Two paths into this action:
//   1. Drive-by review from /shop/[username] — no dealId. Renders as a
//      plain review.
//   2. Verified-job review from a conversation thread — dealId is set.
//      The review carries a "Verified job" badge in the UI because we
//      know both parties confirmed the deal.
//
// Guard rails:
//   - Must be signed in.
//   - Cannot review your own listing.
//   - Rating 1..5, comment ≤ 1000 chars.
//   - If dealId is provided: the deal must be `verified`, the current
//     user must be its buyer, and the deal's listing_id must match.
export async function submitReview({ productId, rating, comment, dealId = null }) {
    const r = Number(rating)
    if (!Number.isInteger(r) || r < 1 || r > 5) {
        return { error: 'Rating must be 1–5 stars.' }
    }
    const text = (comment || '').trim().slice(0, 1000) || null

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Sign in to leave a review.' }

    const { data: listing } = await supabase
        .from('products')
        .select('store:stores!inner(user_id)')
        .eq('id', productId)
        .maybeSingle()

    if (!listing) return { error: 'Listing not found.' }
    if (listing.store?.user_id === user.id) {
        return { error: "You can't review your own listing." }
    }

    // If a dealId is provided, verify it. The badge claim is meaningful
    // only when the deal really is verified and tied to this user + listing.
    let validatedDealId = null
    if (dealId) {
        const { data: deal } = await supabase
            .from('deals')
            .select('id, status, buyer_id, listing_id')
            .eq('id', dealId)
            .maybeSingle()
        if (!deal) return { error: 'Deal not found.' }
        if (deal.buyer_id !== user.id) return { error: 'Only the buyer can leave a verified review.' }
        if (deal.listing_id !== productId) return { error: 'Deal does not match listing.' }
        if (deal.status !== 'verified') {
            return { error: "This deal isn't verified yet — both sides need to confirm first." }
        }
        validatedDealId = deal.id
    }

    const { error } = await supabase
        .from('ratings')
        .upsert(
            {
                user_id: user.id,
                product_id: productId,
                rating: r,
                review: text,
                order_id: null,
                deal_id: validatedDealId,
            },
            { onConflict: 'user_id,product_id' }
        )

    if (error) return { error: error.message }

    revalidatePath('/shop')
    revalidatePath(`/product/${productId}`)
    revalidatePath(`/service/${productId}`)
    if (validatedDealId) revalidatePath('/pro')
    return { ok: true }
}
