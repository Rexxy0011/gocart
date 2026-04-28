'use client'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import ProductCard from './ProductCard'

const MAX_ITEMS = 4

const RelatedListings = ({ product }) => {

    const allProducts = useSelector(state => state.product.list)

    const related = useMemo(() => {
        if (!product) return []
        const isService = !!product.service

        // Same listing type only (don't mix services into a product page or vice versa)
        const pool = allProducts.filter(p => p.id !== product.id && !!p.service === isService)

        // Score: same category + same location is best, then category, then location, then recency
        const scored = pool.map(p => {
            let score = 0
            if (product.category && p.category === product.category) score += 4
            if (product.location && p.location === product.location) score += 2
            if (p.featured) score += 1
            return { p, score, ts: new Date(p.createdAt).getTime() }
        })

        return scored
            .sort((a, b) => b.score - a.score || b.ts - a.ts)
            .slice(0, MAX_ITEMS)
            .map(x => x.p)
    }, [product, allProducts])

    if (related.length < 2) return null

    const seeMoreHref = product?.category
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
                {related.map(p => (
                    <ProductCard key={p.id} product={p} />
                ))}
            </div>
        </section>
    )
}

export default RelatedListings
