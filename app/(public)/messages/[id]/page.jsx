import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { ChevronLeft } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { getDealForConversation } from "@/app/actions/deals"
import DealBanner from "@/components/messages/DealBanner"
import MessageThread from "./MessageThread"

export default async function ConversationPage({ params }) {

    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: conversation } = await supabase
        .from('conversations')
        .select(`
            id, listing_id, buyer_id, seller_id, last_message_at, created_at,
            listing:products!conversations_listing_id_fkey(id, name, images, price, free, service),
            buyer:profiles!conversations_buyer_id_fkey(id, name, image),
            seller:profiles!conversations_seller_id_fkey(id, name, image)
        `)
        .eq('id', id)
        .maybeSingle()

    if (!conversation) notFound()
    if (conversation.buyer_id !== user.id && conversation.seller_id !== user.id) {
        // User isn't a participant — bounce them home rather than 404 to
        // avoid leaking conversation existence.
        redirect('/messages')
    }

    const isBuyer = conversation.buyer_id === user.id
    const otherParty = isBuyer ? conversation.seller : conversation.buyer
    const listing = conversation.listing
    const listingHref = listing?.service ? `/service/${listing.id}` : `/product/${listing?.id}`

    // Buyer-side avatar click destination:
    //   service convo → /provider/[username] (provider-only profile —
    //                   service catalogue, service reviews, badge)
    //   product convo → /product/[id] (the listing itself; products are
    //                   one-off classifieds, the seller has no real brand
    //                   page to land on)
    // Seller-side header stays a plain block — the buyer's other identities
    // shouldn't leak out of this private thread.
    let otherProfileHref = null
    if (isBuyer && listing) {
        if (listing.service) {
            const { data: sellerStore } = await supabase
                .from('stores')
                .select('username')
                .eq('user_id', conversation.seller_id)
                .maybeSingle()
            if (sellerStore?.username) otherProfileHref = `/provider/${sellerStore.username}`
        } else {
            otherProfileHref = `/product/${listing.id}`
        }
    }

    // Mark this side's read receipt on every render — opening the thread
    // clears it from the navbar's unread count. Fire-and-forget; if the
    // update fails the badge just stays a beat longer.
    await supabase
        .from('conversations')
        .update(isBuyer
            ? { buyer_last_read_at:  new Date().toISOString() }
            : { seller_last_read_at: new Date().toISOString() })
        .eq('id', id)

    const { data: initialMessages } = await supabase
        .from('messages')
        .select('id, conversation_id, sender_id, body, created_at')
        .eq('conversation_id', id)
        .order('created_at', { ascending: true })

    // Lazy-create the deal row if it doesn't exist yet so the banner
    // always has a status to render.
    const deal = await getDealForConversation(id)

    return (
        <div className="mx-6">
            <div className="max-w-3xl mx-auto py-6">
                <Link href="/messages" className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 mb-4">
                    <ChevronLeft size={14} /> Back to messages
                </Link>

                {/* Listing context strip */}
                {listing && (
                    <Link href={listingHref} className="flex items-center gap-3 bg-slate-50 ring-1 ring-slate-200 rounded-xl p-3 mb-4 hover:bg-slate-100 transition">
                        {listing.images?.[0] && (
                            <Image src={listing.images[0]} alt="" width={48} height={48} className="size-12 rounded-md object-cover ring-1 ring-slate-200 shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="text-xs text-slate-500">Conversation about</p>
                            <p className="text-sm font-semibold text-slate-900 line-clamp-1">{listing.name}</p>
                        </div>
                        <p className="text-sm font-semibold text-slate-700 shrink-0">
                            {listing.free ? 'FREE' : (listing.price != null ? `₦${Number(listing.price).toLocaleString()}` : '—')}
                        </p>
                    </Link>
                )}

                <DealBanner
                    deal={deal}
                    conversationId={id}
                    viewerIsBuyer={isBuyer}
                    otherPartyName={otherParty?.name?.split(' ')[0] || (isBuyer ? 'the seller' : 'the buyer')}
                    listing={listing ? { id: listing.id, name: listing.name } : null}
                />

                <MessageThread
                    conversationId={id}
                    currentUserId={user.id}
                    otherParty={{
                        name: otherParty?.name || (isBuyer ? 'Seller' : 'Buyer'),
                        image: otherParty?.image,
                        role: isBuyer ? 'seller' : 'buyer',
                        profileHref: otherProfileHref,
                        profileLabel: listing?.service ? 'view profile' : 'view listing',
                    }}
                    initialMessages={initialMessages || []}
                />
            </div>
        </div>
    )
}
