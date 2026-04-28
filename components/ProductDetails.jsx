'use client'
import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { format, formatDistanceToNow } from "date-fns"
import {
    ChevronLeft, ChevronRight, ChevronDown, Heart, Flag, Camera, MapPin,
} from "lucide-react"
import { useDispatch, useSelector } from "react-redux"
import { addToCart, deleteItemFromCart } from "@/lib/features/cart/cartSlice"
import { Button } from "@/components/ui/button"
import VehicleSpecs from "@/components/VehicleSpecs"
import ServiceDetails from "@/components/ServiceDetails"
import { categoryGroups } from "@/assets/assets"

const CONDITION_LABEL = {
    'new':    'New',
    'as-new': 'As good as new',
    'good':   'Good condition',
    'fair':   'Fair condition',
}

const VEHICLE_CATEGORIES = new Set(
    categoryGroups.find(g => g.name === 'Vehicles')?.items || []
)

const ProductDetails = ({ product }) => {

    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '$'
    const productId = product.id

    const sellerName = product.store?.user?.name || product.store?.name || 'Seller'
    const location = product.location || 'Lagos'

    const isService = !!product.service
    const isVehicle = VEHICLE_CATEGORIES.has(product.category) && product.vehicle

    // Stable 10-digit reference derived from product.id — buyers quote this when reporting.
    const adId = `15${((parseInt(productId.replace(/\D/g, ''), 10) || 0) * 1357 + 4571).toString().padStart(8, '0')}`
    const postedDate = product.createdAt ? new Date(product.createdAt) : null
    const conditionLabel = CONDITION_LABEL[product.condition]

    const [imageIndex, setImageIndex] = useState(0)
    const [activeTab, setActiveTab] = useState('Images')
    const [message, setMessage] = useState(
        isService
            ? `Hi ${sellerName.split(' ')[0]},\n\nI'd like to request a quote for your ${product.category?.toLowerCase() || 'service'}. Could you share availability and pricing?\n\nThanks`
            : `Hi ${sellerName.split(' ')[0]},\n\nI'm interested in your item. Is this still available?\n\nThanks`
    )

    const cart = useSelector(state => state.cart.cartItems)
    const dispatch = useDispatch()
    const isSaved = !!cart[productId]

    const prevImage = () => setImageIndex((i) => (i - 1 + product.images.length) % product.images.length)
    const nextImage = () => setImageIndex((i) => (i + 1) % product.images.length)

    const toggleSave = () => {
        if (isSaved) dispatch(deleteItemFromCart({ productId }))
        else dispatch(addToCart({ productId }))
    }

    return (
        <div>

            {/* Title row */}
            <div className='flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3'>
                <div className='min-w-0'>
                    <h1 className='text-2xl sm:text-3xl lg:text-[28px] font-bold text-slate-900 leading-tight uppercase tracking-tight'>
                        {product.name}
                    </h1>
                    <Link
                        href={`/shop?location=${encodeURIComponent(location)}`}
                        className='text-sm text-sky-700 hover:underline mt-2 inline-flex items-center gap-1'
                    >
                        {location}
                    </Link>
                </div>
                {!isService && product.price != null && (
                    <p className='text-2xl sm:text-3xl font-bold text-slate-900 shrink-0'>
                        {currency}{product.price.toLocaleString()}
                    </p>
                )}
            </div>

            <div className='grid lg:grid-cols-12 gap-6 mt-4'>

                {/* LEFT — Tabs + Image gallery */}
                <div className='lg:col-span-8 min-w-0'>
                    {/* Tabs */}
                    <div className='grid grid-cols-2 border-b-2 border-slate-200'>
                        {['Images', 'Map'].map((tab) => (
                            <button
                                key={tab}
                                type='button'
                                onClick={() => setActiveTab(tab)}
                                className={`flex items-center justify-center gap-2 py-3 text-sm font-semibold transition relative ${
                                    activeTab === tab
                                        ? 'text-slate-900 bg-white border-b-2 border-slate-900 -mb-0.5'
                                        : 'text-slate-500 hover:text-slate-700 bg-slate-50'
                                }`}
                            >
                                {tab === 'Images' ? <Camera size={16} /> : <MapPin size={16} />}
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Gallery / Map */}
                    {activeTab === 'Images' ? (
                        <div className='relative bg-slate-100 border border-t-0 border-slate-200'>
                            <div className='relative aspect-[4/3] flex items-center justify-center overflow-hidden'>
                                <Image
                                    src={product.images[imageIndex]}
                                    alt={product.name}
                                    fill
                                    sizes='(min-width: 1024px) 60vw, 100vw'
                                    className='object-contain p-8'
                                    priority
                                />
                                {product.images.length > 1 && (
                                    <>
                                        <button
                                            type='button'
                                            onClick={prevImage}
                                            aria-label='Previous image'
                                            className='absolute left-0 top-0 bottom-0 w-12 sm:w-14 bg-slate-300/80 hover:bg-slate-400/80 text-slate-700 transition flex items-center justify-center'
                                        >
                                            <ChevronLeft size={32} strokeWidth={1.75} />
                                        </button>
                                        <button
                                            type='button'
                                            onClick={nextImage}
                                            aria-label='Next image'
                                            className='absolute right-0 top-0 bottom-0 w-12 sm:w-14 bg-slate-800 hover:bg-slate-900 text-white transition flex items-center justify-center'
                                        >
                                            <ChevronRight size={32} strokeWidth={1.75} />
                                        </button>
                                    </>
                                )}
                            </div>
                            <div className='absolute bottom-3 left-3 z-10 inline-flex items-center gap-1.5 bg-slate-900/80 text-white text-xs px-2.5 py-1 rounded'>
                                <Camera size={12} /> {imageIndex + 1} of {product.images.length}
                            </div>
                        </div>
                    ) : (
                        <div className='aspect-[4/3] bg-slate-100 border border-t-0 border-slate-200 flex items-center justify-center text-slate-500 text-sm'>
                            Map view coming soon
                        </div>
                    )}
                </div>

                {/* RIGHT — Seller / Contact card */}
                <div className='lg:col-span-4 min-w-0'>
                    <div className='border border-slate-200 rounded p-5 bg-white'>

                        {/* Seller header */}
                        <Link
                            href={product.store?.username ? `/shop/${product.store.username}` : '#'}
                            className='flex items-center gap-3 group'
                        >
                            <div className='size-12 rounded-full bg-slate-100 ring-1 ring-slate-200 flex items-center justify-center text-slate-700 font-semibold text-lg shrink-0'>
                                {sellerName.charAt(0).toUpperCase()}
                            </div>
                            <p className='text-lg font-semibold text-slate-900 truncate group-hover:underline'>{sellerName}</p>
                        </Link>
                        <hr className='border-slate-200 my-4' />
                        <p className='text-xs text-slate-500'>
                            Posting for 3+ years <span className='mx-2 text-slate-300'>|</span> 4 Ads in a year
                        </p>

                        {/* Contact */}
                        <h3 className='text-base font-semibold text-sky-700 mt-5 mb-3'>
                            Contact {sellerName.split(' ')[0]}
                        </h3>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={6}
                            className='w-full text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded p-3 resize-none focus:outline-none focus:ring-2 focus:ring-slate-300'
                        />

                        <div className='flex flex-col gap-2 mt-4'>
                            <Button size='lg' className='w-full bg-slate-900 hover:bg-slate-800 text-white text-base'>
                                Send Message
                            </Button>
                            <Button size='lg' variant='outline' className='w-full justify-center text-base'>
                                {isService ? 'Request quote' : 'Make offer'} <ChevronDown size={16} />
                            </Button>
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

            {/* Description + Attributes (full width below) */}
            <div className='grid lg:grid-cols-12 gap-6 mt-10'>
                <div className='lg:col-span-8 space-y-8'>
                    {isService ? (
                        <ServiceDetails service={product.service} description={product.description} category={product.category} ratings={product.rating} />
                    ) : (
                        <section>
                            <h2 className='text-lg font-semibold text-slate-900 mb-3'>Description</h2>
                            <p className='text-sm sm:text-base text-slate-700 leading-relaxed whitespace-pre-line'>
                                {product.description}
                            </p>
                        </section>
                    )}

                    {isVehicle && <VehicleSpecs vehicle={product.vehicle} />}

                    {/* Specs — universal facts. Vehicle-specific specs live in VehicleSpecs above. */}
                    <section>
                        <h2 className='text-lg font-semibold text-slate-900 mb-3'>Specs</h2>
                        <dl className='grid grid-cols-1 sm:grid-cols-2 gap-x-8 text-sm'>
                            {[
                                { label: 'Ad ID', value: adId },
                                postedDate && {
                                    label: 'Posted',
                                    value: `${format(postedDate, 'd MMM yyyy')} (${formatDistanceToNow(postedDate, { addSuffix: true })})`,
                                },
                                !isService && conditionLabel && { label: 'Condition', value: conditionLabel },
                                product.category && { label: 'Category', value: product.category },
                                { label: 'Location', value: location },
                            ].filter(Boolean).map((s) => (
                                <div key={s.label} className='flex justify-between gap-4 border-b border-slate-100 py-2.5'>
                                    <dt className='text-slate-500'>{s.label}</dt>
                                    <dd className='text-slate-900 font-medium text-right truncate'>{s.value}</dd>
                                </div>
                            ))}
                        </dl>
                    </section>
                </div>
            </div>
        </div>
    )
}

export default ProductDetails
