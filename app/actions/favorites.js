'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

// Toggle a listing in the user's favorites. Returns { saved: true|false }
// reflecting the new state, or { error } if it failed (most likely cause:
// not signed in). Idempotent — calling toggle twice ends up where you
// started, calling delete on a row that doesn't exist is a no-op.
export async function toggleFavorite({ productId }) {
    if (!productId) return { error: 'Missing product.' }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Sign in to save listings.' }

    // Check current state — RLS limits this to the user's own row.
    const { data: existing } = await supabase
        .from('favorites')
        .select('product_id')
        .eq('product_id', productId)
        .maybeSingle()

    if (existing) {
        const { error } = await supabase
            .from('favorites')
            .delete()
            .eq('product_id', productId)
        if (error) return { error: error.message }
        revalidatePath('/cart')
        return { saved: false }
    }

    const { error } = await supabase
        .from('favorites')
        .insert({ user_id: user.id, product_id: productId })
    if (error) return { error: error.message }
    revalidatePath('/cart')
    return { saved: true }
}

// Read all of the current user's favorite product IDs. Used to hydrate
// the Redux slice on app load so heart icons render with the correct
// initial state. Returns [] for signed-out users (silent — let the UI
// handle the auth gate when they actually click).
export async function getFavoriteIds() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []
    const { data } = await supabase
        .from('favorites')
        .select('product_id')
    return (data || []).map(r => r.product_id)
}
