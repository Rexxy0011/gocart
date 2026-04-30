'use server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

// Resolves an existing conversation between the current user and the seller
// of `listingId`, or creates a new one. Optionally posts the first message
// in the same call. Returns the conversation id (and redirects if requested).
//
// Used by /product/[id] "Send Message" — buyers shouldn't have to think
// about whether the conversation already exists.
export async function startConversation({ listingId, message, redirectAfter = true }) {

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not signed in' }

    // 1. Resolve the listing's seller via the store's user_id.
    const { data: listing, error: listingErr } = await supabase
        .from('products')
        .select('id, store:stores!inner(user_id)')
        .eq('id', listingId)
        .maybeSingle()

    if (listingErr || !listing) return { error: 'Listing not found' }
    const sellerId = listing.store.user_id

    if (sellerId === user.id) {
        return { error: 'You can\'t message your own listing.' }
    }

    // 2. Find or create the conversation. The (listing_id, buyer_id) unique
    // constraint means a re-message just reopens the existing thread.
    let conversationId
    const { data: existing } = await supabase
        .from('conversations')
        .select('id')
        .eq('listing_id', listingId)
        .eq('buyer_id', user.id)
        .maybeSingle()

    if (existing) {
        conversationId = existing.id
    } else {
        const { data: created, error: createErr } = await supabase
            .from('conversations')
            .insert({
                listing_id: listingId,
                buyer_id: user.id,
                seller_id: sellerId,
            })
            .select('id')
            .single()
        if (createErr) return { error: createErr.message }
        conversationId = created.id
    }

    // 3. Post the initial message if one was provided.
    if (message?.trim()) {
        const { error: msgErr } = await supabase
            .from('messages')
            .insert({
                conversation_id: conversationId,
                sender_id: user.id,
                body: message.trim(),
            })
        if (msgErr) return { error: msgErr.message }
    }

    revalidatePath('/messages')
    if (redirectAfter) redirect(`/messages/${conversationId}`)
    return { conversationId }
}

// Plain message send — used by the thread view's send-form.
export async function sendMessage({ conversationId, body }) {
    if (!body?.trim()) return { error: 'Empty message' }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not signed in' }

    // Verify the user is part of this conversation. RLS would do this for
    // us in a polished setup; until we wire it, check explicitly.
    const { data: convo } = await supabase
        .from('conversations')
        .select('buyer_id, seller_id')
        .eq('id', conversationId)
        .maybeSingle()

    if (!convo || (convo.buyer_id !== user.id && convo.seller_id !== user.id)) {
        return { error: 'Not authorized for this conversation' }
    }

    const { data: inserted, error } = await supabase
        .from('messages')
        .insert({
            conversation_id: conversationId,
            sender_id: user.id,
            body: body.trim(),
        })
        .select('id, conversation_id, sender_id, body, created_at')
        .single()

    if (error) return { error: error.message }
    return { message: inserted }
}
