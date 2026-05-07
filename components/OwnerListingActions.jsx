'use client'
import { useState, useTransition } from 'react'
import Link from 'next/link'
import { toast } from 'react-hot-toast'
import { Pencil, Sparkles, Tag, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { removeListing } from '@/app/actions/listings'

// Owner-only action strip rendered under each ProductRow when the
// signed-in viewer is the seller of the listing. Mirrors what Jiji shows
// inline on the seller's profile so they can manage from where buyers see.
//
// Actions:
//   - Mark sold / Mark active : flips products.in_stock; optimistic update
//   - Boost                   : routes to /store/manage-product (where the
//                              BoostPicker UI lives) — inline boost picker
//                              would duplicate that component's state.
//   - Edit                    : route to /store/manage-product (placeholder
//                              for when a per-listing edit form exists).
//   - Remove                  : confirms, then soft-deletes via the
//                              removeListing server action.
const OwnerListingActions = ({ listingId, initialInStock = true }) => {

    const [inStock, setInStock] = useState(initialInStock)
    const [busy, startTransition] = useTransition()

    const onToggleStock = () => {
        const next = !inStock
        setInStock(next)
        ;(async () => {
            const supabase = createClient()
            const { error } = await supabase
                .from('products')
                .update({ in_stock: next })
                .eq('id', listingId)
            if (error) {
                toast.error(error.message)
                setInStock(!next)
            } else {
                toast.success(next ? 'Marked active.' : 'Marked sold.')
            }
        })()
    }

    const onRemove = () => {
        const ok = window.confirm(
            'Remove this listing? Buyers will no longer see it. Existing conversations stay so you can refer back to them.',
        )
        if (!ok) return
        startTransition(async () => {
            const result = await removeListing({ listingId })
            if (result?.error) toast.error(result.error)
            else                toast.success('Listing removed.')
        })
    }

    return (
        <div className='flex flex-wrap items-center gap-2 text-xs -mt-2 mb-3 ml-[172px] sm:ml-[256px] pr-2'>
            <span className='inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400'>
                Owner actions:
            </span>

            <button
                type='button'
                onClick={onToggleStock}
                disabled={busy}
                className={`inline-flex items-center gap-1 ring-1 rounded-full px-2.5 py-1 transition ${
                    inStock
                        ? 'bg-white text-slate-700 ring-slate-200 hover:ring-slate-400'
                        : 'bg-slate-900 text-white ring-slate-900'
                }`}
            >
                <Tag size={12} /> {inStock ? 'Mark sold' : 'Mark active'}
            </button>

            <Link
                href='/store/manage-product'
                className='inline-flex items-center gap-1 bg-white text-slate-700 ring-1 ring-slate-200 hover:ring-slate-400 rounded-full px-2.5 py-1 transition'
            >
                <Sparkles size={12} /> Boost
            </Link>

            <Link
                href='/store/manage-product'
                className='inline-flex items-center gap-1 bg-white text-slate-700 ring-1 ring-slate-200 hover:ring-slate-400 rounded-full px-2.5 py-1 transition'
            >
                <Pencil size={12} /> Edit
            </Link>

            <button
                type='button'
                onClick={onRemove}
                disabled={busy}
                className='inline-flex items-center gap-1 bg-white text-rose-600 ring-1 ring-rose-200 hover:ring-rose-400 rounded-full px-2.5 py-1 transition disabled:opacity-60'
            >
                <Trash2 size={12} /> {busy ? 'Removing…' : 'Remove'}
            </button>
        </div>
    )
}

export default OwnerListingActions
