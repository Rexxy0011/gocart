'use client'
import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { CheckCircle2, Clock, AlertCircle, Sparkles, X } from 'lucide-react'
import { markDealDone, disputeDeal } from '@/app/actions/deals'
import ReviewModal from '@/components/ReviewModal'

// Banner that sits at the top of /messages/[id] showing the current
// deal status and the action(s) the viewer can take. State is driven
// by the deal row from the server; clicks invoke server actions which
// revalidate this page so the banner re-renders.
//
// Five rendered states:
//   open                       → "Mark job done" button (either side)
//   pending_<other>            → "You marked done — awaiting <other>"  + Reset isn't supported in MVP
//   pending_<me>               → "<other> marked done — confirm or dispute"
//   verified                   → "Verified job — leave a review" (buyer only)
//   disputed                   → "Disputed: <reason>" (terminal)
const DealBanner = ({ deal, conversationId, viewerIsBuyer, otherPartyName, listing }) => {

    const [submitting, setSubmitting] = useState(false)
    const [disputeOpen, setDisputeOpen] = useState(false)
    const [disputeText, setDisputeText] = useState('')
    const [reviewOpen, setReviewOpen] = useState(false)

    if (!deal) return null

    const status = deal.status
    const isAwaitingMe =
        (status === 'pending_buyer'  && viewerIsBuyer) ||
        (status === 'pending_seller' && !viewerIsBuyer)
    const isAwaitingOther =
        (status === 'pending_seller' && viewerIsBuyer) ||
        (status === 'pending_buyer'  && !viewerIsBuyer)

    const handleMarkDone = async () => {
        setSubmitting(true)
        try {
            const result = await markDealDone({ conversationId })
            if (result?.error) toast.error(result.error)
            else if (result?.deal?.status === 'verified') toast.success('Deal verified — review on the way.')
            else toast.success('Marked as done. Waiting for the other side to confirm.')
        } finally {
            setSubmitting(false)
        }
    }

    const handleDispute = async () => {
        if (!disputeText.trim()) return toast.error('Add a brief reason.')
        setSubmitting(true)
        try {
            const result = await disputeDeal({ conversationId, reason: disputeText.trim() })
            if (result?.error) toast.error(result.error)
            else {
                toast.success('Dispute recorded.')
                setDisputeOpen(false)
            }
        } finally {
            setSubmitting(false)
        }
    }

    // ---- Render -----------------------------------------------------------
    if (status === 'verified') {
        return (
            <>
                <div className='mb-4 bg-emerald-50 ring-1 ring-emerald-200 rounded-xl p-4 flex items-start gap-3'>
                    <span className='inline-flex items-center justify-center size-9 rounded-full bg-emerald-600 text-white shrink-0'>
                        <CheckCircle2 size={18} />
                    </span>
                    <div className='flex-1 min-w-0'>
                        <p className='font-semibold text-emerald-900'>Verified job</p>
                        <p className='text-sm text-emerald-900/80 mt-0.5'>
                            Both sides confirmed this deal happened.
                            {viewerIsBuyer && ' Your review carries a Verified-job badge.'}
                        </p>
                    </div>
                    {viewerIsBuyer && listing && (
                        <button
                            type='button'
                            onClick={() => setReviewOpen(true)}
                            className='shrink-0 inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-full px-4 py-2 transition'
                        >
                            <Sparkles size={14} /> Leave a review
                        </button>
                    )}
                </div>
                {viewerIsBuyer && listing && (
                    <ReviewModal
                        open={reviewOpen}
                        onClose={() => setReviewOpen(false)}
                        listings={[{ id: listing.id, name: listing.name }]}
                        dealId={deal.id}
                    />
                )}
            </>
        )
    }

    if (status === 'disputed') {
        return (
            <div className='mb-4 bg-rose-50 ring-1 ring-rose-200 rounded-xl p-4 flex items-start gap-3'>
                <span className='inline-flex items-center justify-center size-9 rounded-full bg-rose-600 text-white shrink-0'>
                    <AlertCircle size={18} />
                </span>
                <div className='flex-1 min-w-0'>
                    <p className='font-semibold text-rose-900'>Deal disputed</p>
                    {deal.dispute_reason && (
                        <p className='text-sm text-rose-900/80 mt-1 leading-relaxed'>
                            “{deal.dispute_reason}”
                        </p>
                    )}
                    <p className='text-xs text-rose-900/70 mt-2'>
                        No review can be left on a disputed deal.
                    </p>
                </div>
            </div>
        )
    }

    if (isAwaitingMe) {
        return (
            <>
                <div className='mb-4 bg-amber-50 ring-1 ring-amber-200 rounded-xl p-4'>
                    <div className='flex items-start gap-3'>
                        <span className='inline-flex items-center justify-center size-9 rounded-full bg-amber-600 text-white shrink-0'>
                            <Clock size={18} />
                        </span>
                        <div className='flex-1 min-w-0'>
                            <p className='font-semibold text-amber-900'>{otherPartyName} marked this deal done</p>
                            <p className='text-sm text-amber-900/80 mt-0.5'>
                                Confirm if it really happened — that unlocks a verified review.
                            </p>
                            <div className='flex flex-wrap gap-2 mt-3'>
                                <button
                                    type='button'
                                    disabled={submitting}
                                    onClick={handleMarkDone}
                                    className='inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-semibold rounded-full px-4 py-2 transition'
                                >
                                    <CheckCircle2 size={14} /> Yes, it&apos;s done
                                </button>
                                <button
                                    type='button'
                                    onClick={() => setDisputeOpen(true)}
                                    className='inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 ring-1 ring-slate-300 hover:ring-slate-400 text-sm font-semibold rounded-full px-4 py-2 transition'
                                >
                                    No, dispute
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                {disputeOpen && (
                    <div
                        role='dialog'
                        aria-modal='true'
                        className='fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4'
                        onClick={() => !submitting && setDisputeOpen(false)}
                    >
                        <div
                            onClick={(e) => e.stopPropagation()}
                            className='bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md'
                        >
                            <div className='flex items-center justify-between px-5 py-4 border-b border-slate-100'>
                                <h3 className='text-base font-semibold text-slate-900'>Dispute this deal</h3>
                                <button
                                    type='button'
                                    onClick={() => !submitting && setDisputeOpen(false)}
                                    className='size-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500'
                                >
                                    <X size={16} />
                                </button>
                            </div>
                            <div className='px-5 py-5 space-y-4'>
                                <p className='text-sm text-slate-600 leading-relaxed'>
                                    Tell us briefly why you&apos;re rejecting this. A dispute is final — no review will be left.
                                </p>
                                <textarea
                                    rows={4}
                                    maxLength={500}
                                    value={disputeText}
                                    onChange={(e) => setDisputeText(e.target.value)}
                                    placeholder='e.g. The job was never started.'
                                    className='w-full text-sm bg-white ring-1 ring-slate-200 rounded-md p-3 resize-none focus:ring-slate-400 outline-none'
                                />
                                <p className='text-[11px] text-slate-400 text-right'>{disputeText.length}/500</p>
                            </div>
                            <div className='px-5 py-4 border-t border-slate-100 flex items-center justify-end gap-2'>
                                <button
                                    type='button'
                                    onClick={() => !submitting && setDisputeOpen(false)}
                                    className='text-sm text-slate-600 hover:text-slate-900 px-3 py-2 rounded-md transition'
                                >
                                    Cancel
                                </button>
                                <button
                                    type='button'
                                    disabled={submitting}
                                    onClick={handleDispute}
                                    className='inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white text-sm font-semibold rounded-full px-4 py-2 transition'
                                >
                                    {submitting ? 'Submitting…' : 'Submit dispute'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </>
        )
    }

    if (isAwaitingOther) {
        return (
            <div className='mb-4 bg-sky-50 ring-1 ring-sky-200 rounded-xl p-4 flex items-start gap-3'>
                <span className='inline-flex items-center justify-center size-9 rounded-full bg-sky-600 text-white shrink-0'>
                    <Clock size={18} />
                </span>
                <div className='flex-1 min-w-0'>
                    <p className='font-semibold text-sky-900'>You marked this done</p>
                    <p className='text-sm text-sky-900/80 mt-0.5'>
                        Waiting for {otherPartyName} to confirm. Once they do, the deal is verified.
                    </p>
                </div>
            </div>
        )
    }

    // status === 'open'
    return (
        <div className='mb-4 bg-slate-50 ring-1 ring-slate-200 rounded-xl p-4 flex items-start gap-3'>
            <span className='inline-flex items-center justify-center size-9 rounded-full bg-slate-700 text-white shrink-0'>
                <CheckCircle2 size={18} />
            </span>
            <div className='flex-1 min-w-0'>
                <p className='font-semibold text-slate-900'>Mark this deal done</p>
                <p className='text-sm text-slate-600 mt-0.5'>
                    {viewerIsBuyer
                        ? `Once ${otherPartyName} confirms, the deal is verified and you can leave a verified review.`
                        : `Once ${otherPartyName} confirms, the deal is verified and they can leave a verified review.`}
                </p>
            </div>
            <button
                type='button'
                disabled={submitting}
                onClick={handleMarkDone}
                className='shrink-0 inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white text-sm font-semibold rounded-full px-4 py-2 transition'
            >
                <CheckCircle2 size={14} /> Mark done
            </button>
        </div>
    )
}

export default DealBanner
