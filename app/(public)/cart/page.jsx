import Link from 'next/link'
import { Heart } from 'lucide-react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { mapProductRow, PRODUCT_WITH_STORE_SELECT } from '@/lib/supabase/mappers'
import ProductCard from '@/components/ProductCard'

// Saved listings page (still routed at /cart for legacy URL stability —
// the cart slice was repurposed as the favorites store way back). Reads
// the user's favorites joined to products, filters out anything that's
// no longer publicly visible (rejected, removed, or pulled by the store
// going inactive), and renders the same ProductCard buyers see on /shop.
export const metadata = { title: 'Saved listings — GoCart' }

export default async function SavedListings() {

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login?next=/cart')
    }

    // PostgREST embedded filter: pull favorites and the joined product +
    // store. The product join carries our usual approved-and-visible
    // rules — listings the user saved that have since been rejected /
    // removed / their store deactivated drop out of the result.
    const { data: rows } = await supabase
        .from('favorites')
        .select(`
            created_at,
            product:products!inner(
                ${PRODUCT_WITH_STORE_SELECT}
            )
        `)
        .eq('product.review_status', 'approved')
        .is('product.removed_at', null)
        .eq('product.store.status', 'approved')
        .eq('product.store.is_active', true)
        .order('created_at', { ascending: false })

    const products = (rows || [])
        .map(r => r.product)
        .filter(Boolean)
        .map(mapProductRow)

    if (products.length === 0) {
        return (
            <main className='min-h-[70vh] mx-6 flex items-center justify-center'>
                <div className='max-w-md text-center'>
                    <span className='inline-flex items-center justify-center size-14 rounded-full bg-rose-50 ring-1 ring-rose-200 text-rose-500 mb-4'>
                        <Heart size={22} />
                    </span>
                    <h1 className='text-2xl font-semibold text-slate-900'>No saved listings yet</h1>
                    <p className='text-sm text-slate-600 mt-2 leading-relaxed'>
                        Tap the heart on any listing to save it for later. Your favourites show up here, on every device you sign in from.
                    </p>
                    <Link
                        href='/shop'
                        className='inline-flex items-center justify-center bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-full px-5 py-2.5 mt-6 transition'
                    >
                        Browse listings
                    </Link>
                </div>
            </main>
        )
    }

    return (
        <main className='min-h-[70vh] mx-6'>
            <div className='max-w-7xl mx-auto py-8'>
                <div className='flex items-end justify-between gap-3 mb-6'>
                    <div>
                        <h1 className='text-2xl font-semibold text-slate-900'>Saved listings</h1>
                        <p className='text-sm text-slate-500 mt-1'>{products.length} item{products.length === 1 ? '' : 's'} saved</p>
                    </div>
                    <Link href='/shop' className='text-sm text-sky-700 hover:underline shrink-0'>Add more →</Link>
                </div>

                <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4'>
                    {products.map(p => <ProductCard key={p.id} product={p} />)}
                </div>
            </div>
        </main>
    )
}
