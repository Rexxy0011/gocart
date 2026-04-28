'use client'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, MapPin, Star } from 'lucide-react'
import VerifiedTick from '@/components/VerifiedTick'

const VendorCard = ({ store, productCount = 0, averageRating = 0, ratingCount = 0 }) => {

    const verified = store?.status === 'approved'
    const sellerName = store?.user?.name || store?.name || 'Seller'
    const initial = sellerName.charAt(0).toUpperCase()
    const avatar = store?.user?.image || store?.logo

    return (
        <Link
            href={`/shop/${store.username}`}
            className={`group flex flex-col w-full sm:w-60 bg-white rounded-2xl ring-1 transition overflow-hidden p-4 ${
                verified
                    ? 'ring-sky-200 hover:ring-sky-400 hover:shadow-md'
                    : 'ring-slate-200/70 hover:ring-slate-300 hover:shadow-md'
            }`}
        >
            <div className='flex items-center gap-3'>
                <div className='size-14 rounded-full overflow-hidden bg-slate-100 ring-1 ring-slate-200 shrink-0 flex items-center justify-center'>
                    {avatar ? (
                        <Image src={avatar} alt={sellerName} width={56} height={56} className='size-full object-cover' />
                    ) : (
                        <span className='text-lg font-semibold text-slate-700'>{initial}</span>
                    )}
                </div>
                <div className='min-w-0 flex-1'>
                    <p className='inline-flex items-center gap-1.5 font-semibold text-slate-900 max-w-full'>
                        <span className='truncate'>{sellerName}</span>
                        {verified && <VerifiedTick size={16} />}
                    </p>
                    <p className='text-xs text-slate-500 truncate'>@{store.username}</p>
                </div>
            </div>

            {verified && (
                <span className='inline-flex items-center self-start gap-1 mt-3 text-[11px] font-semibold uppercase tracking-wide text-sky-700 bg-sky-50 ring-1 ring-sky-200 px-2 py-0.5 rounded-full'>
                    Power seller
                </span>
            )}

            <div className='flex items-center gap-2 mt-3 text-xs text-slate-600'>
                <div className='flex items-center'>
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                            key={i}
                            size={13}
                            className={i < Math.round(averageRating) ? 'text-amber-400' : 'text-slate-300'}
                            fill={i < Math.round(averageRating) ? 'currentColor' : 'none'}
                            strokeWidth={1.5}
                        />
                    ))}
                </div>
                <span className='text-slate-500'>({ratingCount})</span>
            </div>

            <div className='flex items-center gap-3 mt-2 text-xs text-slate-500'>
                <span>{productCount} {productCount === 1 ? 'item' : 'items'}</span>
                {store.address && (
                    <span className='inline-flex items-center gap-1 truncate'>
                        <MapPin size={11} className='shrink-0' />
                        <span className='truncate'>{store.address.split(',').pop().trim()}</span>
                    </span>
                )}
            </div>

            <p className='inline-flex items-center gap-1 text-sm font-semibold text-slate-900 mt-4 group-hover:gap-2 transition-all'>
                View store <ArrowRight size={14} />
            </p>
        </Link>
    )
}

export default VendorCard
