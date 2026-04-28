'use client'
import Image from 'next/image'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { useDispatch, useSelector } from 'react-redux'
import { Check, ShieldCheck, X } from 'lucide-react'
import { confirmByProvider, confirmByBuyer, getJobStatus } from '@/lib/features/jobs/jobsSlice'

const ConfirmDot = ({ label, confirmed }) => (
    <div className='flex flex-col items-center gap-1 min-w-0'>
        <span
            className={`inline-flex items-center justify-center size-7 rounded-full text-[10px] font-bold ring-1 ${
                confirmed
                    ? 'bg-emerald-500 text-white ring-emerald-500'
                    : 'bg-slate-100 text-slate-400 ring-slate-300 border-dashed'
            }`}
            title={confirmed ? 'Confirmed' : 'Not yet'}
        >
            {confirmed ? <Check size={13} strokeWidth={3} /> : '?'}
        </span>
        <span className='text-[10px] text-slate-500 truncate max-w-[5rem]'>{label}</span>
    </div>
)

// `perspective` controls which side of the bilateral confirmation the viewer is.
// 'provider' = the seller/service-provider view (default, used on /pro/jobs)
// 'buyer'    = the buyer's view (used on /orders)
const JobConfirmCard = ({ job, perspective = 'provider' }) => {

    const dispatch = useDispatch()
    const products = useSelector(state => state.product.list)
    const listing = products.find(p => p.id === job.listingId)
    const status = getJobStatus(job)

    const lastMessaged = formatDistanceToNow(new Date(job.lastMessageAt), { addSuffix: true })

    const isProvider = perspective === 'provider'
    const providerFullName = listing?.store?.user?.name || listing?.store?.name || 'Provider'
    const providerFirstName = providerFullName.split(' ')[0]
    const buyerFirstName = (job.buyerName || 'Buyer').split(' ')[0]

    // What the viewer sees as "the other party"
    const otherPartyName = isProvider ? job.buyerName : providerFullName
    const otherPartyFirstName = isProvider ? buyerFirstName : providerFirstName

    // Which timestamp = "you," which = "the other"
    const youConfirmed     = isProvider ? !!job.providerConfirmedAt : !!job.buyerConfirmedAt
    const otherConfirmed   = isProvider ? !!job.buyerConfirmedAt    : !!job.providerConfirmedAt

    const youActionNeeded = !youConfirmed && status !== 'verified'
    const onConfirm = () => dispatch(isProvider ? confirmByProvider(job.id) : confirmByBuyer(job.id))

    // Demo affordance — flip the OTHER side's confirmation, only useful when they haven't yet
    const onDemoFlipOther = () => dispatch(isProvider ? confirmByBuyer(job.id) : confirmByProvider(job.id))

    return (
        <div className='bg-white border border-slate-200 rounded-2xl overflow-hidden'>
            <div className='p-5 flex items-start gap-4 flex-wrap'>

                {/* Listing thumbnail */}
                {listing ? (
                    <Link href={`/product/${listing.id}`} className='size-16 shrink-0 rounded-lg overflow-hidden bg-slate-100 ring-1 ring-slate-200 hover:ring-slate-400 transition'>
                        <Image src={listing.images[0]} alt={listing.name} width={64} height={64} className='size-full object-cover' />
                    </Link>
                ) : (
                    <div className='size-16 shrink-0 rounded-lg bg-slate-100 ring-1 ring-slate-200' />
                )}

                {/* Job info + bilateral indicator */}
                <div className='flex-1 min-w-0'>
                    <p className='text-sm font-semibold text-slate-900 line-clamp-1'>{listing?.name || 'Listing'}</p>
                    <p className='text-xs text-slate-500 mt-0.5'>
                        {isProvider ? 'For ' : 'With '}
                        <span className='font-medium text-slate-700'>{otherPartyName}</span>
                        <span className='text-slate-300'> · </span>
                        last messaged {lastMessaged}
                    </p>

                    <div className='flex items-end gap-3 mt-3'>
                        <ConfirmDot label='You' confirmed={youConfirmed} />
                        <span className='h-px flex-1 bg-slate-200 max-w-16 mb-3' />
                        <ConfirmDot label={otherPartyFirstName} confirmed={otherConfirmed} />
                    </div>
                </div>

                {/* Status / actions */}
                <div className='shrink-0 ml-auto flex flex-col items-end gap-2 min-w-[10rem]'>
                    {status === 'verified' && (
                        <span className='inline-flex items-center gap-1 bg-emerald-50 ring-1 ring-emerald-200 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-full'>
                            <ShieldCheck size={12} /> Verified job
                        </span>
                    )}
                    {!youActionNeeded && status !== 'verified' && (
                        <span className='inline-flex items-center gap-1 bg-amber-50 ring-1 ring-amber-200 text-amber-800 text-xs font-medium px-2.5 py-1 rounded-full'>
                            Pending — waiting on {otherPartyFirstName}
                        </span>
                    )}
                    {youActionNeeded && otherConfirmed && (
                        <span className='inline-flex items-center gap-1 bg-sky-50 ring-1 ring-sky-200 text-sky-700 text-xs font-medium px-2.5 py-1 rounded-full'>
                            {otherPartyFirstName} says it&apos;s done
                        </span>
                    )}

                    {youActionNeeded && (
                        <div className='flex items-center gap-2'>
                            <button
                                type='button'
                                onClick={onConfirm}
                                className='inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-full px-3 py-1.5 transition'
                            >
                                <Check size={12} strokeWidth={3} /> Yes, completed
                            </button>
                            <button
                                type='button'
                                disabled
                                title='Dispute flow — coming soon'
                                className='inline-flex items-center gap-1 bg-white ring-1 ring-slate-200 text-slate-500 text-xs font-medium rounded-full px-3 py-1.5 cursor-not-allowed opacity-60'
                            >
                                <X size={12} /> Not yet
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* State-specific footer */}
            <div className='border-t border-slate-100 px-5 py-2.5 bg-slate-50/60 text-xs text-slate-500'>
                {status === 'awaiting_both' && (
                    <span>We pinged both of you ~48hrs after the chat went idle. Did this job get done?</span>
                )}
                {youActionNeeded && otherConfirmed && (
                    <span>{otherPartyFirstName} already confirmed. Confirm too and this counts as a verified job.</span>
                )}
                {!youActionNeeded && status !== 'verified' && (
                    <span className='inline-flex items-center gap-2'>
                        <span>Verifies once {otherPartyFirstName} confirms too.</span>
                        <button
                            type='button'
                            onClick={onDemoFlipOther}
                            className='text-[11px] font-medium text-sky-700 hover:underline'
                        >
                            Demo: confirm as {otherPartyFirstName} →
                        </button>
                    </span>
                )}
                {status === 'verified' && (
                    <span>
                        {isProvider
                            ? 'Counted toward your milestone badge. Buyer can leave a review.'
                            : 'Counted as a verified job — you can leave a review for ' + providerFirstName + '.'}
                    </span>
                )}
            </div>
        </div>
    )
}

export default JobConfirmCard
