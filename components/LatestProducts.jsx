import Title from './Title'
import ProductCard from './ProductCard'
import { createClient } from '@/lib/supabase/server'
import { PRODUCT_WITH_STORE_SELECT, mapProductRow } from '@/lib/supabase/mappers'

// "Top listings" — only listings with an active paid boost. Sellers who
// have paid for visibility (Featured, Urgent, Bulk sale, or Bump) get
// surfaced here above the plain feed. Without boosts the home page has a
// weaker signal but the section disappears entirely so we don't pad with
// random listings and dilute the meaning of the badge.
//
// Order: Featured first (premium ribbon, top placement), then most
// recently bumped, then newest.
const DISPLAY_QUANTITY = 8

const LatestProducts = async () => {

    const supabase = await createClient()
    const { data: rows } = await supabase
        .from('products')
        .select(PRODUCT_WITH_STORE_SELECT)
        .is('service', null)
        .is('removed_at', null)
        .eq('review_status', 'approved')
        .eq('in_stock', true)
        .eq('store.status', 'approved')
        .eq('store.is_active', true)
        // Any one of the four paid-boost markers qualifies the listing
        // for the Top section. bumped_at-not-null = the seller paid for
        // a Bump (we don't yet stamp bumped_until everywhere).
        .or('featured.eq.true,urgent.eq.true,bulk_sale.eq.true,bumped_at.not.is.null')
        .order('featured', { ascending: false })
        .order('bumped_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
        .limit(DISPLAY_QUANTITY)

    const products = (rows || []).map(mapProductRow)

    if (products.length === 0) return null

    return (
        <div className='px-6 my-30 max-w-6xl mx-auto'>
            <Title
                title='Top listings'
                description={`${products.length} boosted listing${products.length === 1 ? '' : 's'} buyers are seeing first`}
                href='/shop'
            />
            <div className='mt-12 grid grid-cols-2 sm:flex flex-wrap gap-6 justify-between'>
                {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                ))}
            </div>
        </div>
    )
}

export default LatestProducts
