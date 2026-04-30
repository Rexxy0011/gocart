import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import ProductCard from './ProductCard'
import { createClient } from '@/lib/supabase/server'
import { PRODUCT_WITH_STORE_SELECT, mapProductRow } from '@/lib/supabase/mappers'

const MAX_ITEMS = 4

// "You may also like" — fetches a small pool from the same category as the
// current product, excluding it. Same listing type (services don't bleed
// into product pages and vice versa). Approved + active shops only.
const RelatedListings = async ({ product }) => {
    if (!product) return null

    const isService = !!product.service
    const supabase = await createClient()

    // Postgres doesn't have an OR-on-different-tables filter that handles the
    // service / non-service split cleanly via PostgREST, so we run two
    // separate orderings client-side. Scope by category for the strongest
    // signal, fall back to overall newest if there aren't enough matches.
    let query = supabase
        .from('products')
        .select(PRODUCT_WITH_STORE_SELECT)
        .neq('id', product.id)
        .is('removed_at', null)
        .eq('store.status', 'approved')
        .eq('store.is_active', true)
        .order('featured', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(MAX_ITEMS * 3)  // overshoot then re-rank in memory

    if (isService) query = query.not('service', 'is', null)
    else           query = query.is('service', null)

    if (product.category) query = query.eq('category', product.category)

    const { data: rows } = await query

    // Re-rank: same category + same location > same category > recency
    const ts = (r) => new Date(r.created_at).getTime()
    const score = (r) => (
        (product.location && r.location === product.location ? 2 : 0) +
        (r.featured ? 1 : 0)
    )
    const sorted = (rows || [])
        .sort((a, b) => score(b) - score(a) || ts(b) - ts(a))
        .slice(0, MAX_ITEMS)
        .map(mapProductRow)

    if (sorted.length < 2) return null

    const seeMoreHref = product.category
        ? `/shop?category=${encodeURIComponent(product.category)}`
        : '/shop'

    return (
        <section className='mt-16'>
            <div className='flex items-end justify-between gap-4 mb-6'>
                <div>
                    <h2 className='text-xl sm:text-2xl font-semibold text-slate-900'>You may also like</h2>
                    <p className='text-sm text-slate-500 mt-1'>
                        {product.category
                            ? `More ${product.category.toLowerCase()} listings`
                            : 'More listings on GoCart'}
                        {product.location ? ` near ${product.location}` : ''}
                    </p>
                </div>
                <Link href={seeMoreHref} className='shrink-0 text-sm font-medium text-slate-700 hover:text-slate-900 inline-flex items-center gap-1'>
                    See more <ArrowRight size={14} />
                </Link>
            </div>
            <div className='grid grid-cols-2 sm:flex flex-wrap gap-6 sm:justify-start'>
                {sorted.map(p => (
                    <ProductCard key={p.id} product={p} />
                ))}
            </div>
        </section>
    )
}

export default RelatedListings
