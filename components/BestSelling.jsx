import Title from './Title'
import ProductCard from './ProductCard'
import { createClient } from '@/lib/supabase/server'
import { PRODUCT_WITH_STORE_SELECT, mapProductRow } from '@/lib/supabase/mappers'

// "Today's Deals" — listings carrying a deal-shaped signal:
//   was_price IS NOT NULL (strikethrough/reduced price)
//   free = true            (free giveaway)
//   urgent = true          (urgent paid boost)
//   bulk_sale = true       (multi-item ad)
//
// Same approved-shop, no-service filter as everywhere else. A listing can
// appear here AND in Top listings if it qualifies for both — that's the
// intended overlap.
const DISPLAY_QUANTITY = 8

const BestSelling = async () => {

    const supabase = await createClient()
    const { data: rows } = await supabase
        .from('products')
        .select(PRODUCT_WITH_STORE_SELECT)
        .is('service', null)
        .is('removed_at', null)
        .eq('store.status', 'approved')
        .eq('store.is_active', true)
        .or('urgent.eq.true,bulk_sale.eq.true,free.eq.true,was_price.not.is.null')
        .order('featured', { ascending: false })
        .order('bumped_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
        .limit(DISPLAY_QUANTITY)

    const products = (rows || []).map(mapProductRow)

    // Hide the section entirely when there are no deal-shaped listings — a
    // half-empty "Today's Deals" reads as broken. Top listings still shows
    // everything fresh, so the home page never goes blank.
    if (products.length === 0) return null

    return (
        <div className='px-6 my-30 max-w-6xl mx-auto'>
            <Title
                title="Today's Deals"
                description={`${products.length} listing${products.length === 1 ? '' : 's'} on offer right now`}
                href='/shop'
            />
            <div className='mt-12 grid grid-cols-2 sm:flex flex-wrap gap-6 xl:gap-12'>
                {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                ))}
            </div>
        </div>
    )
}

export default BestSelling
