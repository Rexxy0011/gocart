'use client'
import { useMemo } from 'react'
import Link from 'next/link'
import { Flame, Boxes, Building2, Plane, Tag } from 'lucide-react'
import { useSelector } from 'react-redux'
import ProductCard from '@/components/ProductCard'

const REASON_LABELS = {
    'leaving-country':       { Icon: Plane,     label: 'Leaving the country', tone: 'text-yellow-700 bg-yellow-50 ring-yellow-200' },
    'closing-down':          { Icon: Building2, label: 'Closing down',        tone: 'text-orange-700 bg-orange-50 ring-orange-200' },
    'didnt-fit':             { Icon: Tag,       label: "Didn't fit purpose",  tone: 'text-rose-700 bg-rose-50 ring-rose-200' },
    'upgrading':             { Icon: Tag,       label: 'Upgrading',           tone: 'text-violet-700 bg-violet-50 ring-violet-200' },
    'gift-not-needed':       { Icon: Tag,       label: 'Gift, not needed',    tone: 'text-pink-700 bg-pink-50 ring-pink-200' },
    'other':                 { Icon: Flame,     label: 'Urgent',              tone: 'text-rose-700 bg-rose-50 ring-rose-200' },
}

const BULK_GROUP = { Icon: Boxes, label: 'Bulk sale', tone: 'text-amber-700 bg-amber-50 ring-amber-200' }

export default function HotPage() {

    const allProducts = useSelector(state => state.product.list)

    const hot = useMemo(
        () => allProducts
            .filter(p => (p.urgent || p.bulkSale) && !p.service)
            .slice()
            .sort((a, b) => {
                if (!!b.featured - !!a.featured !== 0) return !!b.featured - !!a.featured
                return new Date(b.createdAt) - new Date(a.createdAt)
            }),
        [allProducts]
    )

    // Bucket: each listing goes into its urgencyReason bucket; bulk-only (no urgent reason) into 'bulk-sale'
    const grouped = useMemo(() => {
        const map = new Map()
        for (const p of hot) {
            const key = p.urgent ? (p.urgencyReason || 'other') : 'bulk-sale'
            if (!map.has(key)) map.set(key, [])
            map.get(key).push(p)
        }
        return [...map.entries()]
    }, [hot])

    return (
        <div className='mx-6'>
            <div className='max-w-7xl mx-auto py-8'>

                {/* Header */}
                <div className='flex items-start gap-4'>
                    <span className='inline-flex items-center justify-center size-12 rounded-2xl bg-gradient-to-br from-orange-100 to-rose-200 text-2xl shrink-0'>
                        🔥
                    </span>
                    <div className='min-w-0'>
                        <h1 className='text-2xl sm:text-3xl font-bold text-slate-900'>Hot listings</h1>
                        <p className='text-sm text-slate-600 mt-1 max-w-2xl'>
                            Sellers with a reason to move fast — relocators, businesses winding down, bulk sales going at once. These don&apos;t stay up for long.
                        </p>
                    </div>
                </div>

                {hot.length === 0 ? (
                    <div className='mt-12 text-center py-16 bg-slate-50 rounded-xl'>
                        <p className='text-sm text-slate-500'>Nothing hot right now. Check back soon.</p>
                    </div>
                ) : (
                    <div className='space-y-12 mt-10 mb-32'>
                        {grouped.map(([key, items]) => {
                            const variant = key === 'bulk-sale' ? BULK_GROUP : (REASON_LABELS[key] || REASON_LABELS.other)
                            const { Icon, label, tone } = variant
                            return (
                                <section key={key}>
                                    <div className='flex items-center gap-3 mb-5'>
                                        <span className={`inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1 rounded-full ring-1 ${tone}`}>
                                            <Icon size={14} /> {label}
                                        </span>
                                        <span className='text-xs text-slate-500'>{items.length} {items.length === 1 ? 'listing' : 'listings'}</span>
                                    </div>
                                    <div className='grid grid-cols-2 sm:flex flex-wrap gap-6 xl:gap-8'>
                                        {items.map((p) => <ProductCard key={p.id} product={p} />)}
                                    </div>
                                </section>
                            )
                        })}
                    </div>
                )}

                {/* Subtle seller-side prompt */}
                <section className='mt-12 max-w-3xl mx-auto bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-4'>
                    <span className='text-3xl'>🔥</span>
                    <div className='flex-1 min-w-0'>
                        <p className='font-semibold text-slate-900'>Need to sell fast?</p>
                        <p className='text-sm text-slate-600'>
                            Mark your listing as Urgent or Bulk sale to land here and reach buyers in a hurry.
                        </p>
                    </div>
                    <Link href='/store/add-product' className='shrink-0 text-sm font-semibold text-sky-700 hover:underline'>
                        List now →
                    </Link>
                </section>
            </div>
        </div>
    )
}
