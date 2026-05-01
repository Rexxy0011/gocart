import Title from './Title'
import ProductCard from './ProductCard'
import { createClient } from '@/lib/supabase/server'
import { PRODUCT_WITH_STORE_SELECT, mapProductRow } from '@/lib/supabase/mappers'

// "Today's Deals" — listings posted in the last 24 hours. The home page's
// "what's new today" surface. Different from Top listings (paid boosts);
// this section is purely chronological so brand-new sellers see their work
// land somewhere visible without paying.
//
// Cutoff is rolling 24h, not midnight, so the section never goes empty
// just because it's 1am.
const DISPLAY_QUANTITY = 8
const ONE_DAY_MS = 24 * 60 * 60 * 1000

const BestSelling = async () => {

    const supabase = await createClient()
    const since = new Date(Date.now() - ONE_DAY_MS).toISOString()

    const { data: rows } = await supabase
        .from('products')
        .select(PRODUCT_WITH_STORE_SELECT)
        .is('service', null)
        .is('removed_at', null)
        .eq('review_status', 'approved')
        .eq('in_stock', true)
        .eq('store.status', 'approved')
        .eq('store.is_active', true)
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(DISPLAY_QUANTITY)

    const products = (rows || []).map(mapProductRow)

    // Hide the section when there's nothing fresh today — beats showing
    // a half-empty row that reads as broken.
    if (products.length === 0) return null

    return (
        <div className='px-6 my-30 max-w-6xl mx-auto'>
            <Title
                title="Today's Deals"
                description={`${products.length} new listing${products.length === 1 ? '' : 's'} posted in the last 24 hours`}
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
