import Title from './Title'
import ProductCard from './ProductCard'
import { createClient } from '@/lib/supabase/server'
import { PRODUCT_WITH_STORE_SELECT, mapProductRow } from '@/lib/supabase/mappers'

// Top 4 product listings on the home page. Featured first, then most-recently
// bumped, then newest. Filters to approved + active shops (per the B+C model)
// and excludes services (those live on /services).
const DISPLAY_QUANTITY = 4

const LatestProducts = async () => {

    const supabase = await createClient()
    const { data: rows } = await supabase
        .from('products')
        .select(PRODUCT_WITH_STORE_SELECT)
        .is('service', null)
        .is('removed_at', null)
        .eq('review_status', 'approved')
        .eq('store.status', 'approved')
        .eq('store.is_active', true)
        .order('featured', { ascending: false })
        .order('bumped_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
        .limit(DISPLAY_QUANTITY)

    const products = (rows || []).map(mapProductRow)

    return (
        <div className='px-6 my-30 max-w-6xl mx-auto'>
            <Title
                title='Top listings'
                description={`Showing ${products.length} of the freshest classifieds`}
                href='/shop'
            />
            {products.length === 0 ? (
                <p className='text-center text-sm text-slate-500 mt-8'>
                    Nothing posted yet — check back soon, or be the first.
                </p>
            ) : (
                <div className='mt-12 grid grid-cols-2 sm:flex flex-wrap gap-6 justify-between'>
                    {products.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            )}
        </div>
    )
}

export default LatestProducts
