import StoreLayout from "@/components/store/StoreLayout"
import StoreStatusBanner from "@/components/store/StoreStatusBanner"
import { createClient } from "@/lib/supabase/server"

export const metadata = {
    title: "GoCart. - Store Dashboard",
    description: "GoCart. - Store Dashboard",
};

// Authenticated dashboard shell. Auth itself is enforced by middleware, so
// we only fetch the user's store row here to feed the navbar/sidebar. If
// the seller hasn't posted their first listing yet, store will be null and
// the sidebar shows a friendly placeholder.
//
// Store rows are created lazily by /store/add-product on first post — there
// is intentionally no separate "shop setup" ceremony for individual sellers
// (that experience is reserved for Tier-3 brand/business accounts).
export default async function StoreRouteLayout({ children }) {

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: store } = await supabase
        .from('stores')
        .select('id, name, username, description, address, status, logo, contact, email, created_at, rejection_reason, user_id')
        .eq('user_id', user.id)
        .maybeSingle()

    const userName = user.user_metadata?.name || user.email?.split('@')[0] || 'Seller'

    const storeInfo = store ? {
        id: store.id,
        name: store.name,
        username: store.username,
        description: store.description,
        address: store.address,
        status: store.status,
        logo: store.logo,
        contact: store.contact,
        email: store.email,
        createdAt: store.created_at,
        user: { name: userName, image: null },
    } : {
        // Pre-first-post placeholder so the sidebar still shows the user.
        name: userName,
        user: { name: userName, image: null },
    }

    return (
        <StoreLayout storeInfo={storeInfo}>
            <StoreStatusBanner status={store?.status} reason={store?.rejection_reason} />
            {children}
        </StoreLayout>
    );
}
