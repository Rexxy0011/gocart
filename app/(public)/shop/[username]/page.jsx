import { createClient } from "@/lib/supabase/server"
import { PRODUCT_WITH_STORE_SELECT, mapProductRow, mapStoreRow } from "@/lib/supabase/mappers"
import StoreShopView from "./StoreShopView"

export default async function StoreShop({ params }) {

    const { username } = await params
    const supabase = await createClient()

    const { data: storeRow } = await supabase
        .from('stores')
        .select(`
            id, name, username, description, address, status, logo, contact, email, created_at,
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

    // Per services-separation rule: products only on a seller profile.
    // Service listings show on a separate provider profile (future).
    const { data: productRows } = await supabase
        .from('products')
        .select(PRODUCT_WITH_STORE_SELECT)
        .eq('store_id', storeRow.id)
        .is('service', null)
        .is('removed_at', null)
        .order('featured', { ascending: false })
        .order('bumped_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })

    const storeInfo = mapStoreRow(storeRow)
    const products = (productRows || []).map(mapProductRow)

    return <StoreShopView storeInfo={storeInfo} products={products} />
}
