'use client'
import { useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
    BadgeCheck, CalendarClock, ChevronDown, Clock, Flag, Heart, MapPin, Package, ShieldCheck, Star, Wrench,
} from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { addToCart, deleteItemFromCart } from '@/lib/features/cart/cartSlice'
import { Button } from '@/components/ui/button'
import VerifiedCheck from '@/components/VerifiedCheck'
import Dropdown from '@/components/Dropdown'
import AddressInput from '@/components/AddressInput'
import MilestoneBadge from '@/components/MilestoneBadge'
import { stateAreas } from '@/assets/assets'

const PARCEL_SIZE_OPTIONS = [
    { value: 'small',  label: 'Small (parcel / docs)' },
    { value: 'medium', label: 'Medium (boxes)' },
    { value: 'large',  label: 'Large (furniture / appliance)' },
]

const formatPriceRange = (service) => {
    if (!service?.priceRange) return 'Quote on request'
    const { min, max, unit } = service.priceRange
    const symbol = service.currency === 'NGN' ? '₦' : '$'
    const u = unit === 'hour' ? '/hr' : unit === 'job' ? '/job' : ''
    if (min == null && max == null) return 'Quote on request'
    if (min != null && max != null) return `${symbol}${min.toLocaleString()} – ${symbol}${max.toLocaleString()}${u}`
    return `from ${symbol}${(min ?? max).toLocaleString()}${u}`
}

const ServicePage = ({ product }) => {

    const service = product.service || {}
    const sellerName = product.store?.user?.name || product.store?.name || 'Provider'
    const sellerUsername = product.store?.username
    const sellerImage = product.store?.user?.image || product.store?.logo
    const isVerified = product.store?.status === 'approved'
    const portfolio = service.portfolio || []
    const ratings = product.rating || []
    const ratingCount = ratings.length
    const averageRating = ratingCount
        ? ratings.reduce((s, r) => s + r.rating, 0) / ratingCount
        : 0
    const priceRange = formatPriceRange(service)

    const cart = useSelector(state => state.cart.cartItems)
    const allProducts = useSelector(state => state.product.list)
    const dispatch = useDispatch()
    const isSaved = !!cart[product.id]

    const marketContext = useMemo(() => {
        if (!service?.priceRange?.min || !service?.priceRange?.max) return null
        const peers = allProducts.filter(p =>
            p.id !== product.id &&
            p.category === product.category &&
            p.location === product.location &&
            p.service?.priceRange?.min != null &&
            p.service?.priceRange?.max != null
        )
        if (peers.length === 0) return null
        const avgMin = Math.round(peers.reduce((s, p) => s + p.service.priceRange.min, 0) / peers.length)
        const avgMax = Math.round(peers.reduce((s, p) => s + p.service.priceRange.max, 0) / peers.length)
        const symbol = service.currency === 'NGN' ? '₦' : '$'
        const thisMid = (service.priceRange.min + service.priceRange.max) / 2
        const marketMid = (avgMin + avgMax) / 2
        let tone = 'inline'
        if (thisMid > marketMid * 1.25) tone = 'above'
        else if (thisMid < marketMid * 0.8) tone = 'below'
        return {
            label: `${symbol}${avgMin.toLocaleString()} – ${symbol}${avgMax.toLocaleString()}`,
            peerCount: peers.length,
            tone,
        }
    }, [allProducts, product.id, product.category, product.location, service])

    const isCourier = product.category === 'Courier'
    const providerState = product.location || null
    const areaSuggestions = stateAreas[providerState] || []

    const [pickup, setPickup] = useState('')
    const [dropoff, setDropoff] = useState('')
    const [parcelSize, setParcelSize] = useState('small')

    const courierEstimate = useMemo(() => {
        if (!isCourier || !service.priceRange) return null
        if (!pickup.trim() || !dropoff.trim()) return null
        const { min = 0, max = 0 } = service.priceRange
        const sizeMultiplier = parcelSize === 'small' ? 1 : parcelSize === 'medium' ? 1.6 : 2.4
        const estMin = Math.round(min * sizeMultiplier)
        const estMax = Math.round(max * sizeMultiplier * 0.8)
        const symbol = service.currency === 'NGN' ? '₦' : '$'
        return `${symbol}${estMin.toLocaleString()} – ${symbol}${estMax.toLocaleString()}`
    }, [isCourier, service.priceRange, service.currency, pickup, dropoff, parcelSize])

    const [message, setMessage] = useState(
        isCourier
            ? `Hi ${sellerName.split(' ')[0]},\n\nDetails of the parcel and special handling notes…`
            : `Hi ${sellerName.split(' ')[0]},\n\nI'd like to book your ${product.category?.toLowerCase() || 'service'}. Could you confirm availability and rough pricing?\n\nThanks`
    )

    const toggleSave = () => {
        if (isSaved) dispatch(deleteItemFromCart({ productId: product.id }))
        else dispatch(addToCart({ productId: product.id }))
    }

    return (
        <div className='mx-6'>
            <div className='max-w-7xl mx-auto py-6'>

                {/* Breadcrumbs */}
                <nav className='text-slate-600 text-sm mb-4 flex flex-wrap items-center gap-1'>
                    <Link href='/' className='text-sky-700 hover:underline'>Home</Link>
                    <span className='text-slate-400'>/</span>
                    <Link href='/services' className='text-sky-700 hover:underline'>Services</Link>
                    {product.category && (
                        <>
                            <span className='text-slate-400'>/</span>
                            <Link href={`/services?category=${encodeURIComponent(product.category)}`} className='text-sky-700 hover:underline'>
                                {product.category}
                            </Link>
                        </>
                    )}
                </nav>

                {/* Title row */}
                <div className='mb-6'>
                    <div className='flex flex-wrap items-center gap-2 mb-3'>
                        <span className='inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-emerald-700 bg-emerald-50 ring-1 ring-emerald-200 px-2.5 py-1 rounded-full'>
                            <Wrench size={12} /> {product.category}
                        </span>
                        <MilestoneBadge jobsCompleted={service.jobsCompleted ?? 0} />
                    </div>
                    <h1 className='text-2xl sm:text-3xl lg:text-[28px] font-bold text-slate-900 leading-tight'>
                        {product.name}
                    </h1>
                    {service.specialties?.length > 0 && (
                        <div className='flex flex-wrap gap-1.5 mt-3'>
                            {service.specialties.map((s) => (
                                <span key={s} className='inline-flex items-center text-xs font-medium text-slate-700 bg-slate-100 ring-1 ring-slate-200 px-2.5 py-1 rounded-full'>
                                    {s}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                <div className='grid lg:grid-cols-12 gap-6'>

                    {/* LEFT */}
                    <div className='lg:col-span-8 min-w-0 space-y-8'>

                        {/* Stats banner */}
                        <div className='grid grid-cols-2 sm:grid-cols-4 divide-x divide-slate-200 border border-slate-200 rounded-xl bg-white'>
                            <div className='p-4'>
                                <p className='text-xs text-slate-500'>Price range</p>
                                <p className='text-base sm:text-lg font-bold text-emerald-600 mt-1 leading-tight'>{priceRange}</p>
                            </div>
                            <div className='p-4'>
                                <p className='text-xs text-slate-500'>Jobs completed</p>
                                <p className='inline-flex items-center gap-1.5 text-base sm:text-lg font-bold text-emerald-700 mt-1'>
                                    <ShieldCheck size={18} className='shrink-0' />
                                    {(service.jobsCompleted ?? 0).toLocaleString()}
                                </p>
                            </div>
                            <div className='p-4'>
                                <p className='text-xs text-slate-500'>Rating</p>
                                <p className='inline-flex items-center gap-1 text-base sm:text-lg font-bold text-amber-500 mt-1'>
                                    <Star size={18} className='fill-current shrink-0' />
                                    {averageRating ? averageRating.toFixed(1) : 'New'}
                                    {ratingCount > 0 && <span className='text-slate-500 font-normal text-sm'>({ratingCount})</span>}
                                </p>
                            </div>
                            <div className='p-4'>
                                <p className='text-xs text-slate-500'>Response</p>
                                <p className='inline-flex items-center gap-1.5 text-base sm:text-lg font-bold text-slate-900 mt-1'>
                                    <Clock size={16} className='shrink-0 text-slate-500' />
                                    {service.responseTime || '—'}
                                </p>
                            </div>
                        </div>

                        {/* Market context strip */}
                        {marketContext && (
                            <div className={`flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 px-4 py-3 rounded-lg ring-1 ${
                                marketContext.tone === 'above'
                                    ? 'bg-amber-50 ring-amber-200'
                                    : marketContext.tone === 'below'
                                    ? 'bg-emerald-50 ring-emerald-200'
                                    : 'bg-slate-50 ring-slate-200'
                            }`}>
                                <div className='flex-1 min-w-0 text-sm'>
                                    <p className='text-slate-500 text-xs'>Market context</p>
                                    <p className='text-slate-900'>
                                        Average <span className='font-semibold'>{product.category}</span> in <span className='font-semibold'>{product.location}</span>:{' '}
                                        <span className='font-bold'>{marketContext.label}</span>
                                        <span className='text-slate-400 text-xs ml-1'>(across {marketContext.peerCount} {marketContext.peerCount === 1 ? 'other provider' : 'other providers'})</span>
                                    </p>
                                </div>
                                <span className={`shrink-0 inline-flex items-center text-xs font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full ${
                                    marketContext.tone === 'above'
                                        ? 'bg-amber-100 text-amber-800'
                                        : marketContext.tone === 'below'
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : 'bg-slate-200 text-slate-700'
                                }`}>
                                    {marketContext.tone === 'above'
                                        ? 'Above market'
                                        : marketContext.tone === 'below'
                                        ? 'Below market'
                                        : 'In line with market'}
                                </span>
                            </div>
                        )}

                        {/* Portfolio */}
                        {portfolio.length > 0 && (
                            <section>
                                <h2 className='text-lg font-semibold text-slate-900 mb-3'>Showcase of past work</h2>
                                <div className='grid grid-cols-2 sm:grid-cols-3 gap-3'>
                                    {portfolio.map((img, i) => (
                                        <div key={i} className='relative aspect-square bg-slate-100 rounded-lg overflow-hidden ring-1 ring-slate-200'>
                                            <Image
                                                src={img}
                                                alt={`Past work ${i + 1}`}
                                                fill
                                                sizes='(min-width: 640px) 220px, 50vw'
                                                className='object-cover'
                                            />
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* About */}
                        <section>
                            <h2 className='text-lg font-semibold text-slate-900 mb-3'>About this service</h2>
                            <p className='text-sm sm:text-base text-slate-700 leading-relaxed whitespace-pre-line'>
                                {product.description}
                            </p>
                        </section>

                        {/* Service details */}
                        <section>
                            <h2 className='text-lg font-semibold text-slate-900 mb-3'>Service details</h2>
                            <dl className='grid grid-cols-1 sm:grid-cols-2 gap-x-10 text-sm'>
                                {[
                                    { icon: MapPin, label: 'Area covered', value: service.areaCovered },
                                    { icon: Clock, label: 'Response time', value: service.responseTime },
                                    { icon: CalendarClock, label: 'Available', value: service.available },
                                    { icon: Wrench, label: 'Experience', value: service.yearsExperience ? `${service.yearsExperience} years` : null },
                                ].filter(f => f.value).map(({ icon: Icon, label, value }) => (
                                    <div key={label} className='flex items-start gap-3 border-b border-slate-100 py-3'>
                                        <Icon size={16} className='text-slate-400 mt-0.5 shrink-0' />
                                        <div className='flex-1 min-w-0'>
                                            <dt className='text-slate-500 text-xs'>{label}</dt>
                                            <dd className='text-slate-900 font-semibold'>{value}</dd>
                                        </div>
                                    </div>
                                ))}
                            </dl>
                        </section>

                        {/* Qualifications */}
                        {service.qualifications?.length > 0 && (
                            <section>
                                <h2 className='text-lg font-semibold text-slate-900 mb-3'>Qualifications &amp; guarantees</h2>
                                <ul className='space-y-2'>
                                    {service.qualifications.map((q) => (
                                        <li key={q} className='flex items-center gap-2 text-sm text-slate-700'>
                                            <BadgeCheck size={16} className='text-emerald-600 shrink-0' />
                                            {q}
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        )}

                        {/* Reviews */}
                        {ratings.length > 0 && (
                            <section>
                                <h2 className='text-lg font-semibold text-slate-900 mb-3'>Reviews ({ratings.length})</h2>
                                <div className='space-y-4'>
                                    {ratings.slice(0, 6).map((r, i) => (
                                        <div key={`${r.id}-${i}`} className='border border-slate-200 rounded-lg p-4 bg-white'>
                                            <div className='flex items-center gap-3'>
                                                <div className='size-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 font-semibold'>
                                                    {r.user?.name?.charAt(0) || '?'}
                                                </div>
                                                <div className='min-w-0'>
                                                    <p className='text-sm font-semibold text-slate-900'>{r.user?.name || 'Anonymous'}</p>
                                                    <div className='flex items-center'>
                                                        {Array.from({ length: 5 }).map((_, idx) => (
                                                            <Star
                                                                key={idx}
                                                                size={14}
                                                                className={idx < Math.round(r.rating) ? 'text-amber-400' : 'text-slate-300'}
                                                                fill={idx < Math.round(r.rating) ? 'currentColor' : 'none'}
                                                                strokeWidth={1.5}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                            <p className='text-sm text-slate-700 mt-3 leading-relaxed'>{r.review}</p>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>

                    {/* RIGHT */}
                    <div className='lg:col-span-4 min-w-0'>
                        <div className='border border-slate-200 rounded p-5 bg-white sticky top-6'>

                            {/* Provider header */}
                            <Link
                                href={sellerUsername ? `/shop/${sellerUsername}` : '#'}
                                className='flex items-center gap-3 group'
                            >
                                <div className='size-12 rounded-full overflow-hidden bg-slate-100 ring-1 ring-slate-200 flex items-center justify-center shrink-0'>
                                    {sellerImage ? (
                                        <Image src={sellerImage} alt={sellerName} width={48} height={48} className='size-full object-cover' />
                                    ) : (
                                        <span className='text-base font-semibold text-slate-700'>{sellerName.charAt(0).toUpperCase()}</span>
                                    )}
                                </div>
                                <div className='min-w-0 flex-1'>
                                    <p className='inline-flex items-center gap-1 max-w-full'>
                                        <span className='text-base font-semibold text-slate-900 truncate group-hover:underline'>{sellerName}</span>
                                        {isVerified && <VerifiedCheck size={13} />}
                                    </p>
                                    <div className='flex items-center gap-1.5 mt-1'>
                                        <p className='text-xs text-slate-500 truncate'>@{sellerUsername}</p>
                                        <MilestoneBadge jobsCompleted={service.jobsCompleted ?? 0} size='sm' />
                                    </div>
                                </div>
                            </Link>
                            <hr className='border-slate-200 my-4' />

                            <div className='grid grid-cols-2 gap-3 text-center'>
                                <div className='border border-slate-200 rounded-lg p-2.5'>
                                    <p className='inline-flex items-center justify-center gap-1 text-base font-bold text-amber-500'>
                                        <Star size={14} className='fill-current' />
                                        {averageRating ? averageRating.toFixed(1) : 'New'}
                                    </p>
                                    <p className='text-[11px] text-slate-500'>Rating</p>
                                </div>
                                <div className='border border-slate-200 rounded-lg p-2.5'>
                                    <p className='inline-flex items-center justify-center gap-1 text-base font-bold text-emerald-700'>
                                        <ShieldCheck size={14} /> {(service.jobsCompleted ?? 0).toLocaleString()}
                                    </p>
                                    <p className='text-[11px] text-slate-500'>Jobs done</p>
                                </div>
                            </div>

                            {isCourier && (
                                <div className='mt-5 space-y-3'>
                                    <div>
                                        <h3 className='text-base font-semibold text-sky-700'>
                                            Where are we going?
                                        </h3>
                                        {providerState && (
                                            <p className='text-xs text-slate-500 mt-1'>
                                                {sellerName.split(' ')[0]} only covers {providerState}. Suggestions below are within state.
                                            </p>
                                        )}
                                    </div>
                                    <div className='space-y-2'>
                                        <AddressInput
                                            value={pickup}
                                            onChange={setPickup}
                                            placeholder={providerState ? `Pickup address (${providerState})` : 'Pickup address'}
                                            suggestions={areaSuggestions}
                                            state={providerState}
                                            leftIcon={<span className='size-2.5 rounded-full bg-emerald-500 shrink-0' aria-hidden />}
                                        />
                                        <AddressInput
                                            value={dropoff}
                                            onChange={setDropoff}
                                            placeholder={providerState ? `Delivery address (${providerState})` : 'Delivery address'}
                                            suggestions={areaSuggestions}
                                            state={providerState}
                                            leftIcon={<span className='size-2.5 rounded-full bg-rose-500 shrink-0' aria-hidden />}
                                        />
                                    </div>
                                    <Dropdown
                                        value={parcelSize}
                                        onChange={setParcelSize}
                                        options={PARCEL_SIZE_OPTIONS}
                                        leftIcon={<Package size={14} className='text-slate-400 shrink-0' />}
                                    />

                                    <div className='bg-emerald-50 border border-emerald-200 rounded p-3'>
                                        <p className='text-xs text-emerald-900/70'>Estimated price</p>
                                        <p className='text-base font-bold text-emerald-700'>
                                            {courierEstimate || 'Enter pickup & delivery'}
                                        </p>
                                        <p className='text-[11px] text-emerald-900/60 mt-1'>
                                            Final quote confirmed by {sellerName.split(' ')[0]} based on distance and timing.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Contact */}
                            <h3 className='text-base font-semibold text-sky-700 mt-5 mb-3'>
                                {isCourier ? `Notes for ${sellerName.split(' ')[0]}` : `Message ${sellerName.split(' ')[0]}`}
                            </h3>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                rows={isCourier ? 4 : 6}
                                className='w-full text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded p-3 resize-none focus:outline-none focus:ring-2 focus:ring-slate-300'
                            />

                            <div className='flex flex-col gap-2 mt-4'>
                                <Button size='lg' className='w-full bg-slate-900 hover:bg-slate-800 text-white text-base'>
                                    <CalendarClock size={18} /> {isCourier ? 'Book courier' : 'Book this service'}
                                </Button>
                                <Button size='lg' variant='outline' className='w-full justify-center text-base'>
                                    Send Message
                                </Button>
                                {!isCourier && (
                                    <Button size='lg' variant='ghost' className='w-full justify-center text-base'>
                                        Request quote <ChevronDown size={16} />
                                    </Button>
                                )}
                            </div>

                            <hr className='border-slate-200 my-4' />

                            <div className='grid grid-cols-2 gap-2'>
                                <Button
                                    variant='outline'
                                    onClick={toggleSave}
                                    className={`justify-center ${isSaved ? 'text-rose-600 border-rose-300 hover:text-rose-700' : ''}`}
                                >
                                    <Heart size={16} fill={isSaved ? 'currentColor' : 'none'} /> {isSaved ? 'Saved' : 'Favourite'}
                                </Button>
                                <Button variant='outline' className='justify-center'>
                                    <Flag size={16} /> Report <ChevronDown size={14} />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ServicePage
