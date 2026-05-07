import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";

export default async function PublicLayout({ children }) {

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Drives the navbar's "Provider" / "Offer a service" link target.
    let providerStatus = null
    let unreadCount = 0
    if (user) {
        const { data: app } = await supabase
            .from('provider_applications')
            .select('status')
            .eq('user_id', user.id)
            .maybeSingle()
        providerStatus = app?.status || null

        // Unread = conversations whose latest message wasn't sent by the
        // viewer AND whose last_message_at is past the viewer's last
        // read receipt. Buyer + seller halves are queried separately so
        // each can compare against the right read column.
        const [buyerSide, sellerSide] = await Promise.all([
            supabase
                .from('conversations')
                .select('id, last_message_at, buyer_last_read_at, last_sender_id')
                .eq('buyer_id', user.id)
                .neq('last_sender_id', user.id),
            supabase
                .from('conversations')
                .select('id, last_message_at, seller_last_read_at, last_sender_id')
                .eq('seller_id', user.id)
                .neq('last_sender_id', user.id),
        ])
        const isUnread = (lastMsg, lastRead) =>
            !!lastMsg && (!lastRead || new Date(lastMsg) > new Date(lastRead))
        unreadCount =
            (buyerSide.data || []).filter(c => isUnread(c.last_message_at, c.buyer_last_read_at)).length +
            (sellerSide.data || []).filter(c => isUnread(c.last_message_at, c.seller_last_read_at)).length
    }

    return (
        <>
            <Navbar user={user} providerStatus={providerStatus} unreadCount={unreadCount} />
            {children}
            <Footer />
        </>
    );
}
