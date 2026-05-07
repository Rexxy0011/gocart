'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

// Soft-remove a listing the current user owns. Sets removed_at so every
// public-facing query (which already filters `removed_at IS NULL`) drops
// it. Conversations + ratings stay intact for audit / moderation.
//
// Returns { ok: true } on success or { error } with a message — caller
// is expected to surface it via toast.
export async function removeListing({ listingId }) {
    if (!listingId) return { error: 'Missing listing id.' }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Sign in first.' }

    // Ownership check — only the seller (via the joined store) can remove
    // their own listing. RLS would also block, but an explicit check
    // gives a clearer error.
    const { data: listing } = await supabase
        .from('products')
        .select('id, removed_at, store:stores!inner(user_id, username)')
        .eq('id', listingId)
        .maybeSingle()
    if (!listing) return { error: 'Listing not found.' }
    if (listing.store.user_id !== user.id) {
        return { error: 'You can only remove your own listings.' }
    }
    if (listing.removed_at) return { ok: true } // already gone — idempotent

    const { error } = await supabase
        .from('products')
        .update({ removed_at: new Date().toISOString() })
        .eq('id', listingId)
    if (error) return { error: error.message }

    if (listing.store.username) revalidatePath(`/shop/${listing.store.username}`)
    revalidatePath('/store')
    revalidatePath('/store/manage-product')
    revalidatePath('/pro')
    revalidatePath('/shop')
    return { ok: true }
}
