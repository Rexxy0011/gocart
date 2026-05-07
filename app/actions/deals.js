'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

// Fetch the deal row for a conversation. Lazy-creates one in `open`
// state if none exists yet — every conversation conceptually has a
// deal; the row just gets materialized on first action.
//
// Returns the (sometimes-just-created) deal, or { error }. The caller
// is expected to be a participant in the conversation; we double-check
// that here so a malicious user can't materialize deals on threads
// they're not part of.
async function ensureDealForConversation(supabase, conversationId, currentUserId) {
    const { data: existing } = await supabase
        .from('deals')
        .select('id, conversation_id, listing_id, buyer_id, seller_id, status, buyer_marked_at, seller_marked_at, verified_at, disputed_at, disputed_by, dispute_reason')
        .eq('conversation_id', conversationId)
        .maybeSingle()

    if (existing) return { deal: existing }

    const { data: convo } = await supabase
        .from('conversations')
        .select('id, listing_id, buyer_id, seller_id')
        .eq('id', conversationId)
        .maybeSingle()

    if (!convo) return { error: 'Conversation not found' }
    if (convo.buyer_id !== currentUserId && convo.seller_id !== currentUserId) {
        return { error: 'Not a participant in this conversation' }
    }

    const { data: created, error: createErr } = await supabase
        .from('deals')
        .insert({
            conversation_id: convo.id,
            listing_id:      convo.listing_id,
            buyer_id:        convo.buyer_id,
            seller_id:       convo.seller_id,
            status:          'open',
        })
        .select('id, conversation_id, listing_id, buyer_id, seller_id, status, buyer_marked_at, seller_marked_at, verified_at, disputed_at, disputed_by, dispute_reason')
        .single()

    if (createErr) return { error: createErr.message }
    return { deal: created }
}

// Mark the deal as done from the current user's side. State machine:
//
//   open                     ─(buyer)─▶ pending_seller
//   open                     ─(seller)─▶ pending_buyer
//   pending_seller           ─(seller)─▶ verified
//   pending_buyer            ─(buyer)─▶ verified
//   pending_<me>             ─(me)──▶  no-op (already marked)
//   verified | disputed      ─(any)──▶  no-op (terminal)
//
// On `verified`, we stamp verified_at. The buyer can then leave a
// review with deal_id set; that review renders the verified-job badge.
export async function markDealDone({ conversationId }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not signed in' }

    const ensured = await ensureDealForConversation(supabase, conversationId, user.id)
    if (ensured.error) return { error: ensured.error }
    const deal = ensured.deal

    const isBuyer  = deal.buyer_id === user.id
    const isSeller = deal.seller_id === user.id
    if (!isBuyer && !isSeller) return { error: 'Not a participant' }

    // Terminal states — nothing to do.
    if (deal.status === 'verified' || deal.status === 'disputed') {
        return { ok: true, deal, noop: true }
    }

    const nowIso = new Date().toISOString()
    let update = {}

    if (deal.status === 'open') {
        if (isBuyer) {
            update = { status: 'pending_seller', buyer_marked_at: nowIso }
        } else {
            update = { status: 'pending_buyer', seller_marked_at: nowIso }
        }
    } else if (deal.status === 'pending_seller' && isSeller) {
        // Seller confirms what buyer marked → verified.
        update = { status: 'verified', seller_marked_at: nowIso, verified_at: nowIso }
    } else if (deal.status === 'pending_buyer' && isBuyer) {
        // Buyer confirms what seller marked → verified.
        update = { status: 'verified', buyer_marked_at: nowIso, verified_at: nowIso }
    } else {
        // Already marked by this side, awaiting the other → no-op.
        return { ok: true, deal, noop: true }
    }

    const { data: updated, error } = await supabase
        .from('deals')
        .update(update)
        .eq('id', deal.id)
        .select('id, status, verified_at')
        .single()

    if (error) return { error: error.message }

    revalidatePath(`/messages/${conversationId}`)
    return { ok: true, deal: updated }
}

// Reject the other side's "marked done" claim. Only valid when the
// status is pending_<me> — i.e. the other party has marked done and is
// waiting for me. Flips to `disputed` with a reason. Disputes are
// terminal in this MVP (no re-open) — admin queue can review later.
export async function disputeDeal({ conversationId, reason }) {
    const trimmed = (reason || '').trim()
    if (!trimmed) return { error: 'Tell us why you\'re disputing this.' }
    if (trimmed.length > 500) return { error: 'Keep the dispute reason under 500 characters.' }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not signed in' }

    const ensured = await ensureDealForConversation(supabase, conversationId, user.id)
    if (ensured.error) return { error: ensured.error }
    const deal = ensured.deal

    const isBuyer  = deal.buyer_id === user.id
    const isSeller = deal.seller_id === user.id
    if (!isBuyer && !isSeller) return { error: 'Not a participant' }

    // Must be the side being asked to confirm. Disputing your own mark
    // doesn't make sense.
    const canDispute =
        (deal.status === 'pending_buyer'  && isBuyer) ||
        (deal.status === 'pending_seller' && isSeller)

    if (!canDispute) {
        return { error: 'Nothing to dispute — the other side hasn\'t marked this done yet.' }
    }

    const { error } = await supabase
        .from('deals')
        .update({
            status:         'disputed',
            disputed_at:    new Date().toISOString(),
            disputed_by:    user.id,
            dispute_reason: trimmed,
        })
        .eq('id', deal.id)

    if (error) return { error: error.message }

    revalidatePath(`/messages/${conversationId}`)
    return { ok: true }
}

// Read helper for the conversation page — fetches (or lazy-creates) the
// deal so the thread can render the right banner. Server-side only.
export async function getDealForConversation(conversationId) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const ensured = await ensureDealForConversation(supabase, conversationId, user.id)
    if (ensured.error) return null
    return ensured.deal
}
