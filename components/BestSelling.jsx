import Title from './Title'
import ProductCard from './ProductCard'
import { createClient } from '@/lib/supabase/server'
import { PRODUCT_WITH_STORE_SELECT, mapProductRow } from '@/lib/supabase/mappers'
import { excludeActiveBoosts } from '@/lib/boosts'

// "Today's listings" - non-boosted listings posted in the last 24 hours,
// ranked purely by recency. The home page's "what's new today" surface so
// brand-new sellers see their work land somewhere visible without paying.
//
// Mutually exclusive with Top listings: anything with an active boost is
// excluded here (it shows in Top listings instead). When a boost expires
// the listing rejoins this recency feed at its true post-date position.
//
// Cutoff is rolling 24h, not midnight, so the section never goes empty
// just because it's 1am.
const DISPLAY_QUANTITY = 8
const ONE_DAY_MS = 24 * 60 * 60 * 1000

const BestSelling = async () => {

    const supabase = await createClient()
    const now = new Date()
    const since = new Date(now.getTime() - ONE_DAY_MS).toISOString()

    let query = supabase
        .from('products')
        .select(PRODUCT_WITH_STORE_SELECT)
        .is('service', null)
        .is('removed_at', null)
        .eq('review_status', 'approved')
        .eq('in_stock', true)
        .eq('store.status', 'approved')
        .eq('store.is_active', true)
        .gte('created_at', since)
    query = excludeActiveBoosts(query, now.toISOString())
    const { data: rows } = await query
        .order('created_at', { ascending: false })
        .limit(DISPLAY_QUANTITY)

    const products = (rows || []).map(mapProductRow)

    // Hide the section when there's nothing fresh today - beats showing
    // a half-empty row that reads as broken.
    if (products.length === 0) return null

    return (
        <div className='px-6 my-30 max-w-6xl mx-auto'>
            <Title
                title="Today's listings"
                description={`${products.length} new listing${products.length === 1 ? '' : 's'} posted in the last 24 hours`}
                href='/shop'
            />
            <div className='mt-12 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6'>
                {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                ))}
            </div>
        </div>
    )
}

export default BestSelling
