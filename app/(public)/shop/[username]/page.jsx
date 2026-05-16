import { createClient } from "@/lib/supabase/server"
import { isAdminAuthenticated } from "@/lib/auth/admin-pass"
import { PRODUCT_WITH_STORE_SELECT, mapProductRow, mapStoreRow } from "@/lib/supabase/mappers"
import StoreShopView from "./StoreShopView"

export default async function StoreShop({ params, searchParams }) {

    const { username } = await params
    const sp = (await searchParams) || {}
    // ?preview=buyer lets the owner see exactly what visitors see - same
    // page, no owner banner, no per-listing edit/boost/delete strip.
    // The view-mode itself adds a floating "exit preview" bar.
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
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Seller not found</h1>
                <p className="text-sm text-slate-600 mt-2 max-w-md">
                    No GoCart seller exists at <span className="font-mono text-slate-900">/shop/{username}</span>. Check the link or browse all listings instead.
                </p>
                <a href="/shop" className="mt-6 inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-full px-5 py-2.5 transition">
                    Browse all listings
                </a>
            </div>
        )
    }

    // Seller profile = products only. Services live at /provider/[username]
    // so a user who's both has two strictly-separate surfaces, each tied
    // to its own dashboard (/store vs /pro).
    const { data: productRows } = await supabase
        .from('products')
        .select(PRODUCT_WITH_STORE_SELECT)
        .eq('store_id', storeRow.id)
        .eq('review_status', 'approved')
        .is('service', null)
        .is('removed_at', null)
        .order('created_at', { ascending: false })

    // Does this seller also have services? Drives the "Also offers
    // services" cross-link to /provider/[username].
    const { count: serviceCount } = await supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('store_id', storeRow.id)
        .eq('review_status', 'approved')
        .not('service', 'is', null)
        .is('removed_at', null)

    const products = (productRows || []).map(mapProductRow)
    const productIds = products.map(p => p.id)

    // Pull every review on this seller's listings, joined with the
    // reviewer's profile for display. Sorted newest-first.
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
            // Verified-job flag - true only when the rating is tied to
            // a deal that actually reached the verified state.
            verifiedJob: r.deal?.status === 'verified',
            productName: products.find(p => p.id === r.product_id)?.name || '',
        }))
    }

    // Identify the viewer so we can hide the "Leave a review" CTA on
    // the seller's own profile.
    const { data: { user: viewer } } = await supabase.auth.getUser()
    // Admin context - the password cookie is the admin signal, not the
    // Supabase user. An admin who *also* happens to be Supabase-signed-in
    // as the listing's seller should still see the buyer view; admins
    // don't sell. They review.
    const adminAuthed = await isAdminAuthenticated()
    const isOwner = !adminAuthed && viewer?.id === storeRow.user_id
    // Owner can self-toggle into buyer preview via ?preview=buyer.
    const viewerIsSelf = isOwner && !buyerPreview

    // Provider verification - separate from store-approval. KYC-approved
    // providers carry the badge even if their store status is something
    // else, and vice versa.
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
            profileMode="seller"
            crossProfileHref={serviceCount ? `/provider/${username}` : null}
            crossProfileLabel="Also offers services"
            ownerPreviewing={isOwner && buyerPreview}
        />
    )
}
