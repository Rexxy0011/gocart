import { createClient } from "@/lib/supabase/server"
import { PRODUCT_WITH_STORE_SELECT, mapProductRow, mapStoreRow } from "@/lib/supabase/mappers"
import StoreShopView from "./StoreShopView"

export default async function StoreShop({ params }) {

    const { username } = await params
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

    // Show every approved listing this seller has — products and
    // services together. The original "products only on profile" rule
    // assumed a separate provider profile that we never built, and
    // splitting two URLs for the same identity confuses buyers more
    // than it helps.
    const { data: productRows } = await supabase
        .from('products')
        .select(PRODUCT_WITH_STORE_SELECT)
        .eq('store_id', storeRow.id)
        .eq('review_status', 'approved')
        .is('removed_at', null)
        .order('featured', { ascending: false })
        .order('bumped_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })

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
            // Verified-job flag — true only when the rating is tied to
            // a deal that actually reached the verified state.
            verifiedJob: r.deal?.status === 'verified',
            productName: products.find(p => p.id === r.product_id)?.name || '',
        }))
    }

    // Identify the viewer so we can hide the "Leave a review" CTA on
    // the seller's own profile.
    const { data: { user: viewer } } = await supabase.auth.getUser()
    const viewerIsSelf = viewer?.id === storeRow.user_id

    const storeInfo = mapStoreRow(storeRow)

    return (
        <StoreShopView
            storeInfo={storeInfo}
            products={products}
            reviews={reviews}
            viewerIsSelf={viewerIsSelf}
            viewerSignedIn={!!viewer}
        />
    )
}
