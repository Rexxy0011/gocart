'use client'
import { Heart, MapPin, Clock, Star, ShieldCheck } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'
import { addToCart, deleteItemFromCart } from '@/lib/features/cart/cartSlice'
import VerifiedTick from '@/components/VerifiedTick'
import VerifiedCheck from '@/components/VerifiedCheck'
import MilestoneBadge, { getMilestone } from '@/components/MilestoneBadge'

const formatPriceRange = (service) => {
    if (!service?.priceRange) return 'Quote on request'
    const { min, max, unit } = service.priceRange
    const symbol = service.currency === 'NGN' ? '₦' : '$'
    const u = unit === 'hour' ? '/hr' : unit === 'job' ? '/job' : ''
    if (min == null && max == null) return 'Quote on request'
    if (min != null && max != null) return `${symbol}${min.toLocaleString()} – ${symbol}${max.toLocaleString()}${u}`
    return `from ${symbol}${(min ?? max).toLocaleString()}${u}`
}

const ServiceCard = ({ product }) => {

    const cart = useSelector(state => state.cart.cartItems)
    const dispatch = useDispatch()
    const router = useRouter()
    const isSaved = !!cart[product.id]

    const sellerName = product.store?.user?.name || product.store?.name || 'Provider'
    const sellerUsername = product.store?.username
    const sellerImage = product.store?.user?.image || product.store?.logo
    const isPower = product.store?.powerAccount === true
    const isVerified = product.store?.status === 'approved'

    const ratings = product.rating || []
    const ratingCount = ratings.length
    const averageRating = ratingCount
        ? ratings.reduce((s, r) => s + r.rating, 0) / ratingCount
        : 0

    const priceRange = formatPriceRange(product.service)
    const responseTime = product.service?.responseTime
    const areaCovered = product.service?.areaCovered || product.location
    const jobsCompleted = product.service?.jobsCompleted ?? 0

    const toggleSave = (e) => {
        e.preventDefault()
        e.stopPropagation()
        if (isSaved) dispatch(deleteItemFromCart({ productId: product.id }))
        else dispatch(addToCart({ productId: product.id }))
    }

    const goToSeller = (e) => {
        if (!sellerUsername) return
        e.preventDefault()
        e.stopPropagation()
        router.push(`/shop/${sellerUsername}`)
    }

    return (
        <Link
            href={`/service/${product.id}`}
            className='group relative flex flex-col w-full bg-white rounded-2xl ring-1 ring-slate-200 hover:ring-slate-300 hover:shadow-md transition overflow-hidden'
        >
            {/* Header strip */}
            <div className='flex items-start gap-3 p-4'>
                <button
                    type='button'
                    onClick={goToSeller}
                    className='size-14 rounded-full overflow-hidden bg-slate-100 ring-1 ring-slate-200 shrink-0 flex items-center justify-center hover:ring-slate-400 transition'
                >
                    {sellerImage ? (
                        <Image src={sellerImage} alt={sellerName} width={56} height={56} className='size-full object-cover' />
                    ) : (
                        <span className='text-lg font-semibold text-slate-700'>{sellerName.charAt(0).toUpperCase()}</span>
                    )}
                </button>
                <div className='flex-1 min-w-0'>
                    <button
                        type='button'
                        onClick={goToSeller}
                        className='inline-flex items-center gap-1.5 max-w-full hover:underline'
                    >
                        <span className='text-base font-bold text-slate-900 truncate'>{sellerName}</span>
                        {isPower
                            ? <VerifiedTick size={15} />
                            : isVerified
                                ? <VerifiedCheck size={14} />
                                : null}
                    </button>
                    <p className='text-xs font-semibold uppercase tracking-wide text-emerald-700 mt-0.5'>{product.category}</p>
                    <p className='inline-flex items-center gap-1 text-xs text-slate-500 mt-1'>
                        <MapPin size={11} className='shrink-0' />
                        <span className='truncate'>{areaCovered}</span>
                    </p>
                </div>
                <button
                    type='button'
                    onClick={toggleSave}
                    aria-label={isSaved ? 'Remove from favorites' : 'Add to favorites'}
                    className={`size-8 rounded-full flex items-center justify-center hover:bg-slate-100 active:scale-95 transition ${isSaved ? 'text-rose-500' : 'text-slate-400 hover:text-rose-500'}`}
                >
                    <Heart size={15} fill={isSaved ? 'currentColor' : 'none'} />
                </button>
            </div>

            {/* Stats row */}
            <div className='grid grid-cols-2 px-4 py-3 border-y border-slate-100 bg-slate-50/60 text-sm'>
                <div>
                    <p className='inline-flex items-center gap-1 text-amber-500 font-bold'>
                        <Star size={14} className='fill-current' />
                        {averageRating ? averageRating.toFixed(1) : 'New'}
                        {ratingCount > 0 && <span className='text-slate-500 font-normal text-xs'>({ratingCount})</span>}
                    </p>
                    <p className='text-[11px] text-slate-500 mt-0.5'>Rating</p>
                </div>
                <div>
                    <p className='inline-flex items-center gap-1 text-emerald-700 font-bold'>
                        <ShieldCheck size={14} className='shrink-0' />
                        {jobsCompleted.toLocaleString()}
                    </p>
                    {getMilestone(jobsCompleted) ? (
                        <div className='mt-0.5'>
                            <MilestoneBadge jobsCompleted={jobsCompleted} size='sm' />
                        </div>
                    ) : (
                        <p className='text-[11px] text-slate-500 mt-0.5'>Jobs completed</p>
                    )}
                </div>
            </div>

            {/* Price + meta */}
            <div className='p-4 flex flex-col gap-2 flex-1'>
                <p className='text-lg font-bold text-emerald-600'>{priceRange}</p>
                <p className='text-sm text-slate-700 line-clamp-2 leading-snug'>{product.name}</p>
                {product.service?.specialties?.length > 0 && (
                    <div className='flex flex-wrap gap-1'>
                        {product.service.specialties.slice(0, 3).map((s) => (
                            <span key={s} className='inline-flex items-center text-[10px] font-medium text-slate-600 bg-slate-100 ring-1 ring-slate-200 px-1.5 py-0.5 rounded-full'>
                                {s}
                            </span>
                        ))}
                        {product.service.specialties.length > 3 && (
                            <span className='inline-flex items-center text-[10px] font-medium text-slate-500 px-1.5 py-0.5'>
                                +{product.service.specialties.length - 3}
                            </span>
                        )}
                    </div>
                )}
                {responseTime && (
                    <p className='inline-flex items-center gap-1 text-xs text-slate-500 mt-auto'>
                        <Clock size={11} className='shrink-0' /> Responds {responseTime.toLowerCase()}
                    </p>
                )}
            </div>
        </Link>
    )
}

export default ServiceCard
