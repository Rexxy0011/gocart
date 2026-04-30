import { createClient } from "@/lib/supabase/server"
import ManageProductsTable from "./ManageProductsTable"

export default async function StoreManageProducts() {

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Resolve the seller's store, then their listings. The layout doesn't
    // bounce missing-store sellers any more (no setup ceremony) — sellers
    // who haven't posted yet just see an empty state.
    const { data: store } = await supabase
        .from('stores')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

    let products = []
    if (store) {
        const { data } = await supabase
            .from('products')
            .select('id, name, images, price, in_stock, created_at, bumped_at, free, category, service')
            .eq('store_id', store.id)
            .order('created_at', { ascending: false })
        products = data || []
    }

    return <ManageProductsTable products={products} hasStore={!!store} />
}
