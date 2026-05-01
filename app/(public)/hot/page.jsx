import Link from 'next/link'
import { Flame, Boxes } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PRODUCT_WITH_STORE_SELECT, mapProductRow } from '@/lib/supabase/mappers'
import ProductCard from '@/components/ProductCard'

export const metadata = { title: 'Hot listings — GoCart' }

// /hot — sellers who paid for an Urgent tag or Bulk sale boost. Buyers
// who want a deal that won't be up much longer come here. Two sections,
// each empty-state-aware so an empty bucket just disappears rather than
// showing a confusing "no items" placeholder.
//
// Source-of-truth filters mirror the rest of the buyer surfaces:
// approved review status, removed_at null, store approved + active.
export default async function HotPage() {

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
        .or('urgent.eq.true,bulk_sale.eq.true')
        .order('featured', { ascending: false })
        .order('bumped_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
        .limit(60)

    const products = (rows || []).map(mapProductRow)
    const urgentItems = products.filter(p => p.urgent)
    const bulkItems   = products.filter(p => p.bulkSale && !p.urgent)  // de-dupe — urgent+bulk shows in urgent only

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
                            Sellers with a reason to move fast — Urgent tags and Bulk sales. These don&apos;t stay up for long.
                        </p>
                    </div>
                </div>

                {products.length === 0 ? (
                    <div className='mt-12 text-center py-16 bg-slate-50 rounded-xl'>
                        <p className='text-sm text-slate-500'>Nothing hot right now. Check back soon.</p>
                    </div>
                ) : (
                    <div className='space-y-12 mt-10 mb-20'>
                        {urgentItems.length > 0 && (
                            <section>
                                <div className='flex items-center gap-3 mb-5'>
                                    <span className='inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1 rounded-full ring-1 text-yellow-800 bg-yellow-50 ring-yellow-200'>
                                        <Flame size={14} /> Urgent
                                    </span>
                                    <span className='text-xs text-slate-500'>{urgentItems.length} {urgentItems.length === 1 ? 'listing' : 'listings'}</span>
                                </div>
                                <div className='grid grid-cols-2 sm:flex flex-wrap gap-6 xl:gap-8'>
                                    {urgentItems.map((p) => <ProductCard key={p.id} product={p} />)}
                                </div>
                            </section>
                        )}
                        {bulkItems.length > 0 && (
                            <section>
                                <div className='flex items-center gap-3 mb-5'>
                                    <span className='inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1 rounded-full ring-1 text-amber-800 bg-amber-50 ring-amber-200'>
                                        <Boxes size={14} /> Bulk sale
                                    </span>
                                    <span className='text-xs text-slate-500'>{bulkItems.length} {bulkItems.length === 1 ? 'listing' : 'listings'}</span>
                                </div>
                                <div className='grid grid-cols-2 sm:flex flex-wrap gap-6 xl:gap-8'>
                                    {bulkItems.map((p) => <ProductCard key={p.id} product={p} />)}
                                </div>
                            </section>
                        )}
                    </div>
                )}

                {/* Subtle seller-side prompt */}
                <section className='mt-12 max-w-3xl mx-auto bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-4'>
                    <span className='text-3xl'>🔥</span>
                    <div className='flex-1 min-w-0'>
                        <p className='font-semibold text-slate-900'>Need to sell fast?</p>
                        <p className='text-sm text-slate-600'>
                            Boost your listing as Urgent or Bulk sale to land here and reach buyers in a hurry.
                        </p>
                    </div>
                    <Link href='/store/manage-product' className='shrink-0 text-sm font-semibold text-sky-700 hover:underline'>
                        Boost a listing →
                    </Link>
                </section>
            </div>
        </div>
    )
}
