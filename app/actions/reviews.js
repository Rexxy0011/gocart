'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

// Submit a review for a listing. Upserts on (user_id, product_id) so a
// user editing their existing review just overwrites it instead of
// creating duplicates.
//
// Guard rails:
//   - Must be signed in.
//   - Cannot review your own listing.
//   - Rating must be 1..5.
//   - Comment optional, capped at 1000 chars.
//
// `order_id` is left null — see migration 0015 for context. When the
// bilateral deal-confirmation primitive lands, that flow will pre-stamp
// order_id from the deal record.
export async function submitReview({ productId, rating, comment }) {
    const r = Number(rating)
    if (!Number.isInteger(r) || r < 1 || r > 5) {
        return { error: 'Rating must be 1–5 stars.' }
    }
    const text = (comment || '').trim().slice(0, 1000) || null

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Sign in to leave a review.' }

    // Refuse self-reviews. Cheap to verify by joining product → store →
    // user_id via a single query.
    const { data: listing } = await supabase
        .from('products')
        .select('store:stores!inner(user_id)')
        .eq('id', productId)
        .maybeSingle()

    if (!listing) return { error: 'Listing not found.' }
    if (listing.store?.user_id === user.id) {
        return { error: "You can't review your own listing." }
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
            },
            { onConflict: 'user_id,product_id' }
        )

    if (error) return { error: error.message }

    // Bust the seller's profile + the listing's detail page so the new
    // review shows up immediately.
    revalidatePath('/shop')
    revalidatePath(`/product/${productId}`)
    revalidatePath(`/service/${productId}`)
    return { ok: true }
}
