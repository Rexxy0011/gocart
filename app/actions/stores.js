'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

// Update editable fields on the current user's store profile. Username,
// status, and email are intentionally NOT editable here - they're either
// admin-controlled (status) or have side-effects (username changes break
// /shop/<old-username> URLs and existing inbound links).
//
// `logo` is expected to be a URL the client already uploaded (via
// uploadAvatar in lib/supabase/storage.js). Pass null to leave it as-is.
// Pass an empty string to explicitly clear it (revert to initial-letter
// fallback).
export async function updateStoreProfile({ name, description, contact, logo }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Sign in first.' }

    const trimmedName = (name || '').trim()
    if (!trimmedName) return { error: 'Name can\'t be empty.' }
    if (trimmedName.length > 80) return { error: 'Keep the name under 80 characters.' }

    const update = {
        name: trimmedName,
        description: description?.trim().slice(0, 1000) || null,
        contact: contact?.trim().slice(0, 40) || null,
    }
    if (logo === '')   update.logo = ''       // explicit clear
    if (typeof logo === 'string' && logo.startsWith('http')) update.logo = logo

    const { data: store, error } = await supabase
        .from('stores')
        .update(update)
        .eq('user_id', user.id)
        .select('id, username')
        .single()

    if (error) return { error: error.message }

    if (store?.username) revalidatePath(`/shop/${store.username}`)
    revalidatePath('/store')
    revalidatePath('/pro')
    return { ok: true }
}
