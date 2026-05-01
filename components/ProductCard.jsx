'use client'
import { Heart, MapPin, Clock } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { useToggleFavorite } from '@/lib/features/cart/useToggleFavorite'
import VerifiedCheck from '@/components/VerifiedCheck'
import {
    FeaturedRibbon, UrgentBulkTag, ConditionTag,
} from '@/components/ListingBadges'

const ProductCard = ({ product }) => {

    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '₦'

    const router = useRouter()
    const { isSaved, toggle: toggleSave } = useToggleFavorite(product.id)

    const location = product.location || 'Lagos'
    const postedAgo = formatDistanceToNow(new Date(product.createdAt), { addSuffix: true })
    const sellerName = product.store?.user?.name || product.store?.name
    const sellerUsername = product.store?.username
    const isVerified = product.store?.status === 'approved'

    const goToSeller = (e) => {
        if (!sellerUsername) return
        e.preventDefault()
        e.stopPropagation()
        router.push(`/shop/${sellerUsername}`)
    }

    return (
        <Link
            href={`/product/${product.id}`}
            className='group flex flex-col w-full sm:w-60 bg-white rounded-2xl ring-1 ring-slate-200/70 hover:ring-slate-300 hover:shadow-md transition overflow-hidden max-xl:mx-auto'
        >
            {/* Image + favorite */}
            <div className='relative aspect-square bg-[#F5F5F5] overflow-hidden'>
                <Image
                    src={product.images[0]}
                    alt={product.name}
                    fill
                    sizes='(min-width: 1024px) 240px, 50vw'
                    className={`object-contain p-6 group-hover:scale-105 transition duration-500 ${product.inStock === false ? 'opacity-60' : ''}`}
                />
                {/* Sold overlay — desaturates the image and stamps a banner */}
                {product.inStock === false && (
                    <div className='absolute inset-0 z-20 flex items-center justify-center pointer-events-none'>
                        <span className='bg-slate-900/85 text-white font-bold uppercase tracking-widest text-xs sm:text-sm px-4 py-1.5 rounded-sm rotate-[-8deg] shadow-lg'>
                            Sold
                        </span>
                    </div>
                )}
                {/* Top-left: Featured (means seller has Power sub — top placement perk) */}
                {product.featured && (
                    <div className='absolute top-2.5 left-2.5 z-10'>
                        <FeaturedRibbon size='sm' />
                    </div>
                )}
                {/* Bottom-left: Urgent / Bulk only.
                    Free is shown in the body in place of the price.
                    Reduced is shown via the strike-through price in the body. */}
                {(product.urgent || product.bulkSale) && (
                    <div className='absolute bottom-2.5 left-2.5 z-10'>
                        <UrgentBulkTag urgent={product.urgent} bulkSale={product.bulkSale} size='sm' />
                    </div>
                )}
                <button
                    type='button'
                    onClick={toggleSave}
                    aria-label={isSaved ? 'Remove from favorites' : 'Add to favorites'}
                    className={`absolute top-2.5 right-2.5 z-10 size-9 rounded-full flex items-center justify-center bg-white/95 backdrop-blur-sm shadow-sm ring-1 ring-slate-200 hover:ring-slate-300 active:scale-95 transition ${isSaved ? 'text-rose-500' : 'text-slate-600 hover:text-rose-500'}`}
                >
                    <Heart size={16} strokeWidth={2} fill={isSaved ? 'currentColor' : 'none'} />
                </button>
            </div>

            {/* Body */}
            <div className='p-3 flex flex-col gap-1'>
                {(product.free || product.price === 0) ? (
                    <p className='leading-tight'>
                        <span className='inline-flex items-center gap-1.5 bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wide rounded px-2 py-0.5'>FREE</span>
                    </p>
                ) : product.mrp != null && product.mrp > product.price ? (
                    <p className='leading-tight'>
                        <span className='text-base font-bold text-emerald-600'>{currency}{product.price.toLocaleString()}</span>
                        <span className='text-xs text-slate-400 line-through ml-2 font-medium'>{currency}{product.mrp.toLocaleString()}</span>
                    </p>
                ) : (
                    <p className='text-base font-bold text-slate-900 leading-tight'>{currency}{product.price.toLocaleString()}</p>
                )}
                <p className='text-sm text-slate-800 font-medium line-clamp-1'>{product.name}</p>
                {sellerName && (
                    <button
                        type='button'
                        onClick={goToSeller}
                        className='inline-flex items-center gap-1 text-xs text-slate-600 min-w-0 self-start hover:text-slate-900 hover:underline'
                    >
                        <span className='truncate'>{sellerName}</span>
                        {isVerified && <VerifiedCheck size={13} />}
                    </button>
                )}
                <div className='flex items-center gap-2 text-[11px] text-slate-500 mt-1.5'>
                    <span className='flex items-center gap-1 truncate'><MapPin size={11} className='shrink-0' /> {location}</span>
                    <span>·</span>
                    <span className='flex items-center gap-1 truncate'><Clock size={11} className='shrink-0' /> {postedAgo}</span>
                </div>
                {product.condition && (
                    <div className='mt-1.5'>
                        <ConditionTag condition={product.condition} size='sm' />
                    </div>
                )}
            </div>
        </Link>
    )
}

export default ProductCard
