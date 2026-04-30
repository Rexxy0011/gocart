// Server-side helpers shared by /messages, /pro/inquiries, /store/inquiries.
// All three render the same card list — they just differ in which subset of
// conversations they show.

const SELECT_FIELDS = `
    id, listing_id, buyer_id, seller_id, last_message_at,
    listing:products!inner(id, name, images, price, free, service),
    buyer:profiles!conversations_buyer_id_fkey(id, name, image),
    seller:profiles!conversations_seller_id_fkey(id, name, image)
`

// `mode`:
//   'all'             → user is buyer OR seller (the unified inbox)
//   'selling-services'→ user is seller AND listing is a service
//   'selling-products'→ user is seller AND listing is NOT a service
//
// Returns { conversations, lastMessages } where lastMessages is a Map keyed by
// conversation id so the row can render the most recent reply preview.
export async function fetchConversationsForUser(supabase, userId, mode = 'all') {
    let query = supabase
        .from('conversations')
        .select(SELECT_FIELDS)
        .order('last_message_at', { ascending: false })

    if (mode === 'all') {
        query = query.or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    } else if (mode === 'selling-services') {
        query = query.eq('seller_id', userId).not('listing.service', 'is', null)
    } else if (mode === 'selling-products') {
        query = query.eq('seller_id', userId).is('listing.service', null)
    }

    const { data: conversations } = await query
    const list = conversations || []

    // Pull the latest message for each conversation in one query so the
    // card list shows a preview without a per-row round trip.
    const lastMessages = new Map()
    if (list.length) {
        const { data: msgs } = await supabase
            .from('messages')
            .select('conversation_id, body, created_at, sender_id')
            .in('conversation_id', list.map(c => c.id))
            .order('created_at', { ascending: false })
        for (const m of msgs || []) {
            if (!lastMessages.has(m.conversation_id)) lastMessages.set(m.conversation_id, m)
        }
    }

    return { conversations: list, lastMessages }
}
