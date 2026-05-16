import { createClient } from "@/lib/supabase/server"
import { isAdminAuthenticated } from "@/lib/auth/admin-pass"
import { PRODUCT_WITH_STORE_SELECT, mapProductRow, mapStoreRow } from "@/lib/supabase/mappers"
import StoreShopView from "../../shop/[username]/StoreShopView"

// Provider profile — strict mirror of /shop/[username] but scoped to
// services only. Reviews on services, banner pointing at /pro, "Add a
// service" CTA. Sellers' products live at /shop/[username] and never
// leak in here.
export default async function ProviderShop({ params, searchParams }) {

    const { username } = await params
    const sp = (await searchParams) || {}
    const buyerPreview = sp.preview === 'buyer'
    const supabase = await createClient()

    const { data: storeRow } = await supabase
        .from('stores')
        .select(`
            id, name, username, description, address, status, logo, contact, email, created_at, user_id,
            user:profiles!stores_user_id_fkey(id, name, image)
        `)
        .eq('username', username)
        .maybeSingle()

    if (!storeRow) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Provider not found</h1>
                <p className="text-sm text-slate-600 mt-2 max-w-md">
                    No GoCart provider exists at <span className="font-mono text-slate-900">/provider/{username}</span>. Check the link or browse all services instead.
                </p>
                <a href="/services" className="mt-6 inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-full px-5 py-2.5 transition">
                    Browse all services
                </a>
            </div>
        )
    }

    // Provider profile = services only.
    const { data: serviceRows } = await supabase
        .from('products')
        .select(PRODUCT_WITH_STORE_SELECT)
        .eq('store_id', storeRow.id)
        .eq('review_status', 'approved')
        .not('service', 'is', null)
        .is('removed_at', null)
        .order('featured', { ascending: false })
        .order('bumped_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })

    const products = (serviceRows || []).map(mapProductRow)
    const productIds = products.map(p => p.id)

    let reviews = []
    if (productIds.length) {
        const { data: ratingRows } = await supabase
            .from('ratings')
            .select(`
                id, rating, review, created_at, product_id, deal_id,
                user:profiles!ratings_user_id_fkey(id, name, image),
                deal:deals!ratings_deal_id_fkey(id, status)
            `)
            .in('product_id', productIds)
            .order('created_at', { ascending: false })
        reviews = (ratingRows || []).map(r => ({
            id: r.id,
            rating: r.rating,
            comment: r.review,
            createdAt: r.created_at,
            productId: r.product_id,
            user: r.user,
            verifiedJob: r.deal?.status === 'verified',
            productName: products.find(p => p.id === r.product_id)?.name || '',
        }))
    }

    // Does this provider also sell products? Drives the cross-link.
    const { count: productCount } = await supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('store_id', storeRow.id)
        .eq('review_status', 'approved')
        .is('service', null)
        .is('removed_at', null)

    const { data: { user: viewer } } = await supabase.auth.getUser()
    // Admins reviewing a provider's profile should always see the buyer
    // view, even if their browser is also Supabase-signed-in as that
    // provider. Admin role is separate from buyer/seller/provider.
    const adminAuthed = await isAdminAuthenticated()
    const isOwner = !adminAuthed && viewer?.id === storeRow.user_id
    const viewerIsSelf = isOwner && !buyerPreview

    const { data: providerApp } = await supabase
        .from('provider_applications')
        .select('status')
        .eq('user_id', storeRow.user_id)
        .maybeSingle()
    const providerVerified = providerApp?.status === 'approved'

    const storeInfo = mapStoreRow(storeRow)

    return (
        <StoreShopView
            storeInfo={storeInfo}
            products={products}
            reviews={reviews}
            viewerIsSelf={viewerIsSelf}
            viewerSignedIn={!!viewer}
            providerVerified={providerVerified}
            profileMode="provider"
            crossProfileHref={productCount ? `/shop/${username}` : null}
            crossProfileLabel="Also sells products"
            ownerPreviewing={isOwner && buyerPreview}
        />
    )
}
