'use client'
import { Heart, MapPin, Camera } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { useToggleFavorite } from '@/lib/features/cart/useToggleFavorite'
import { FeaturedRibbon, UrgentBulkTag } from '@/components/ListingBadges'

const buildSpecLine = (product) => {
    const v = product.vehicle
    if (!v) return null
    const parts = []
    if (v.year) parts.push(v.year)
    if (v.mileage != null) parts.push(`${v.mileage.toLocaleString()} miles`)
    if (v.transmission) parts.push(v.transmission)
    if (v.fuelType) parts.push(v.fuelType)
    if (v.engineSize) parts.push(`${v.engineSize.toLocaleString()} cc`)
    return parts.join(' | ')
}

const ProductRow = ({ product }) => {

    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '₦'

    const { isSaved, toggle: toggleSave } = useToggleFavorite(product.id)

    const location = product.location || 'Lagos'
    const postedAgo = formatDistanceToNow(new Date(product.createdAt), { addSuffix: true })
    const specLine = buildSpecLine(product)

    return (
        <Link
            href={`/product/${product.id}`}
            className='group flex gap-3 sm:gap-4 py-4 border-b border-slate-200 hover:bg-slate-50/60 transition -mx-2 px-2 rounded-md'
        >
            <div className='relative w-40 sm:w-60 aspect-[4/3] shrink-0 bg-slate-100 rounded-lg overflow-hidden'>
                <Image
                    src={product.images[0]}
                    alt={product.name}
                    fill
                    sizes='(min-width: 640px) 240px, 160px'
                    className={`object-cover group-hover:scale-105 transition duration-500 ${product.inStock === false ? 'opacity-60' : ''}`}
                />
                {/* Sold stamp */}
                {product.inStock === false && (
                    <div className='absolute inset-0 z-20 flex items-center justify-center pointer-events-none'>
                        <span className='bg-slate-900/85 text-white font-bold uppercase tracking-widest text-xs px-3 py-1 rounded-sm rotate-[-8deg] shadow-lg'>
                            Sold
                        </span>
                    </div>
                )}
                {/* Featured ribbon top-left, Urgent/Bulk bottom-left so they
                    don't collide with the image counter on the bottom-right. */}
                {product.featured && (
                    <div className='absolute top-2 left-2'>
                        <FeaturedRibbon size='sm' />
                    </div>
                )}
                {(product.urgent || product.bulkSale) && (
                    <div className='absolute bottom-2 left-2'>
                        <UrgentBulkTag urgent={product.urgent} bulkSale={product.bulkSale} size='sm' />
                    </div>
                )}
                {product.images.length > 1 && (
                    <span className='absolute bottom-2 right-2 inline-flex items-center gap-1 bg-slate-900/80 text-white text-[11px] px-1.5 py-0.5 rounded'>
                        <Camera size={11} /> {product.images.length}
                    </span>
                )}
            </div>

            <div className='flex-1 min-w-0 flex flex-col'>
                <div className='flex items-start gap-2'>
                    <p className='flex-1 text-base sm:text-lg font-bold text-slate-900 leading-snug line-clamp-2'>
                        {product.name}
                    </p>
                    <button
                        type='button'
                        onClick={toggleSave}
                        aria-label={isSaved ? 'Remove from favorites' : 'Add to favorites'}
                        className={`shrink-0 size-9 -mt-1 -mr-1 rounded-full flex items-center justify-center hover:bg-slate-100 active:scale-95 transition ${isSaved ? 'text-rose-500' : 'text-slate-400 hover:text-rose-500'}`}
                    >
                        <Heart size={18} fill={isSaved ? 'currentColor' : 'none'} />
                    </button>
                </div>

                {specLine ? (
                    <p className='text-sm text-slate-700 mt-1 line-clamp-1'>{specLine}</p>
                ) : (
                    <p className='text-sm text-slate-600 mt-1 line-clamp-2'>{product.description}</p>
                )}

                <p className='flex items-center gap-1 text-sm text-slate-500 mt-2'>
                    <MapPin size={14} className='shrink-0' />
                    <span className='truncate'>{location}</span>
                </p>

                <div className='mt-auto pt-2 flex items-end justify-between gap-3'>
                    {product.free || product.price === 0 ? (
                        <span className='inline-flex items-center bg-emerald-500 text-white text-xs font-bold uppercase tracking-wide rounded px-2 py-1'>FREE</span>
                    ) : product.price != null ? (
                        <p className='text-lg sm:text-xl font-bold text-emerald-600'>
                            {currency}{product.price.toLocaleString()}
                        </p>
                    ) : (
                        <p className='text-sm text-slate-500 italic'>Quote on request</p>
                    )}
                    <p className='text-xs text-slate-500 shrink-0'>{postedAgo}</p>
                </div>
            </div>
        </Link>
    )
}

export default ProductRow
