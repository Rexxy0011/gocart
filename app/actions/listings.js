'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkListingContent } from '@/lib/moderation'
import { recordVehicleHistory } from '@/app/actions/vin'
import { recordPhoneHistory } from '@/app/actions/imei'

// Soft-remove a listing the current user owns. Sets removed_at so every
// public-facing query (which already filters `removed_at IS NULL`) drops
// it. Conversations + ratings stay intact for audit / moderation.
//
// Returns { ok: true } on success or { error } with a message - caller
// is expected to surface it via toast.
export async function removeListing({ listingId }) {
    if (!listingId) return { error: 'Missing listing id.' }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Sign in first.' }

    // Ownership check - only the seller (via the joined store) can remove
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
    if (listing.removed_at) return { ok: true } // already gone - idempotent

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

// Create a listing. This is the ONLY products-insert path in the app -
// migration 0023 revokes INSERT on `products` from the authenticated/anon
// roles, so a crafted client can no longer POST a row straight to PostgREST
// with review_status:'approved' or featured_until set (self-approving past
// admin review, or faking a paid boost for free).
//
// The action whitelists the seller-settable columns: anything else on
// `input` is ignored. System-controlled columns - review_status,
// reviewed_at, removed_at, featured / urgent / bulk_sale and their *_until
// timestamps - are never read from the caller. review_status is owned by
// the DB default + the auto_review_listing trigger.
//
// It inserts with the service-role client (RLS / the INSERT revoke don't
// apply to it), so the store-ownership check below IS the authorization.
export async function createListing(input = {}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Sign in to post a listing.' }

    const name = (input.name || '').trim()
    if (!name)            return { error: 'Give your listing a title.' }
    if (!input.store_id)  return { error: 'Missing store.' }
    if (!input.category)  return { error: 'Pick a category.' }

    // Server-side content screen - the client runs this too, but a crafted
    // client could skip it.
    const screen = checkListingContent(name, input.description)
    if (!screen.ok) return { error: screen.message }

    const admin = createAdminClient()

    // Verify the target store belongs to this user - the admin client
    // bypasses RLS, so this is the authorization gate.
    const { data: store } = await admin
        .from('stores')
        .select('id, user_id, username')
        .eq('id', input.store_id)
        .maybeSingle()
    if (!store) return { error: 'Store not found.' }
    if (store.user_id !== user.id) {
        return { error: 'You can only post to your own store.' }
    }

    // Whitelist - only these columns are taken from the caller.
    const payload = {
        store_id:           store.id,
        name,
        description:        (input.description || '').trim() || null,
        category:           input.category,
        location:           input.location || null,
        images:             Array.isArray(input.images) ? input.images : [],
        in_stock:           true,
        free:               Boolean(input.free),
        price:              Boolean(input.free)
            ? 0
            : (input.price != null ? Number(input.price) : null),
        was_price:          input.was_price != null ? Number(input.was_price) : null,
        condition:          input.condition || null,
        delivery_available: Boolean(input.delivery_available),
        phone:              input.phone || null,
        imei:               input.imei || null,
        service:            input.service || null,
        vehicle:            input.vehicle || null,
        vin:                input.vin || null,
    }

    const { data: inserted, error } = await admin
        .from('products')
        .insert(payload)
        .select('id, review_status')
        .single()
    if (error) return { error: error.message }

    // Re-listing trails (vehicle_history / phone_history) - recorded here,
    // server-side, so they can't be dropped by the client unmounting when
    // the post-success overlay routes away. Non-fatal: the listing is
    // already published, so a failed trail write is logged and swallowed.
    if (payload.vin) {
        try {
            const mileageMiles = payload.vehicle?.mileage != null
                ? Number(payload.vehicle.mileage) || null
                : null
            await recordVehicleHistory({ vin: payload.vin, listingId: inserted.id, mileageMiles })
        } catch (err) {
            console.log('[createListing] vehicle history write failed', err?.message)
        }
    }
    if (payload.imei) {
        try {
            await recordPhoneHistory({ imei: payload.imei, listingId: inserted.id, claimedCondition: payload.condition })
        } catch (err) {
            console.log('[createListing] phone history write failed', err?.message)
        }
    }

    if (store.username) revalidatePath(`/shop/${store.username}`)
    revalidatePath('/store/manage-product')
    revalidatePath('/shop')
    return { id: inserted.id, reviewStatus: inserted.review_status }
}
