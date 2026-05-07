'use client'
import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import { Star, X } from 'lucide-react'
import { submitReview } from '@/app/actions/reviews'

// Minimal review form. Picks a listing to review (if seller has more
// than one), 1–5 star rating, optional 1000-char comment. Calls the
// server action then closes itself + refreshes the page so the new
// review renders. Modal style matches BoostPicker / PolicyModal.
const ReviewModal = ({ open, onClose, listings = [] }) => {

    const [productId, setProductId] = useState(listings[0]?.id || '')
    const [rating, setRating] = useState(0)
    const [hover, setHover] = useState(0)
    const [comment, setComment] = useState('')
    const [saving, setSaving] = useState(false)

    // Reset state whenever the modal re-opens. Otherwise a previous
    // submission would leave stale rating/comment values.
    useEffect(() => {
        if (open) {
            setProductId(listings[0]?.id || '')
            setRating(0)
            setHover(0)
            setComment('')
        }
    }, [open, listings])

    useEffect(() => {
        if (!open) return
        const onKey = (e) => { if (e.key === 'Escape') onClose() }
        document.addEventListener('keydown', onKey)
        const prevOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        return () => {
            document.removeEventListener('keydown', onKey)
            document.body.style.overflow = prevOverflow
        }
    }, [open, onClose])

    if (!open) return null

    const onSubmit = async (e) => {
        e.preventDefault()
        if (!productId) return toast.error('Pick a listing to review.')
        if (!rating)    return toast.error('Pick a star rating.')

        setSaving(true)
        try {
            const result = await submitReview({ productId, rating, comment })
            if (result?.error) {
                toast.error(result.error)
                return
            }
            toast.success('Review posted — thanks!')
            onClose()
        } finally {
            setSaving(false)
        }
    }

    return (
        <div
            className='fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4'
            onClick={onClose}
        >
            <form
                onSubmit={onSubmit}
                onClick={(e) => e.stopPropagation()}
                className='bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md max-h-[90vh] flex flex-col'
            >
                <div className='flex items-center justify-between px-5 py-4 border-b border-slate-100'>
                    <h3 className='text-base font-semibold text-slate-900'>Leave a review</h3>
                    <button
                        type='button'
                        onClick={onClose}
                        aria-label='Close'
                        className='size-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500'
                    >
                        <X size={16} />
                    </button>
                </div>

                <div className='overflow-y-auto px-5 py-5 space-y-5'>

                    {/* Listing picker — only shown when seller has >1 listing */}
                    {listings.length > 1 && (
                        <label className='flex flex-col gap-2'>
                            <span className='text-sm font-medium text-slate-700'>Which listing?</span>
                            <select
                                value={productId}
                                onChange={(e) => setProductId(e.target.value)}
                                className='w-full text-sm bg-white ring-1 ring-slate-200 rounded-md px-3 py-2 focus:ring-slate-400 outline-none'
                            >
                                {listings.map((l) => (
                                    <option key={l.id} value={l.id}>{l.name}</option>
                                ))}
                            </select>
                        </label>
                    )}

                    {/* Stars */}
                    <div>
                        <p className='text-sm font-medium text-slate-700 mb-2'>Your rating</p>
                        <div className='flex items-center gap-1'>
                            {[1, 2, 3, 4, 5].map((n) => {
                                const filled = n <= (hover || rating)
                                return (
                                    <button
                                        key={n}
                                        type='button'
                                        onMouseEnter={() => setHover(n)}
                                        onMouseLeave={() => setHover(0)}
                                        onClick={() => setRating(n)}
                                        aria-label={`${n} star${n === 1 ? '' : 's'}`}
                                        className='p-1 transition'
                                    >
                                        <Star
                                            size={28}
                                            className={filled ? 'text-amber-400' : 'text-slate-300'}
                                            fill={filled ? 'currentColor' : 'none'}
                                            strokeWidth={1.5}
                                        />
                                    </button>
                                )
                            })}
                            {rating > 0 && (
                                <span className='ml-2 text-xs text-slate-500'>{rating} / 5</span>
                            )}
                        </div>
                    </div>

                    {/* Comment */}
                    <label className='flex flex-col gap-2'>
                        <span className='text-sm font-medium text-slate-700'>
                            Comment <span className='text-slate-400 font-normal'>— optional</span>
                        </span>
                        <textarea
                            rows={4}
                            maxLength={1000}
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder='Anything specific about the experience?'
                            className='w-full text-sm bg-white ring-1 ring-slate-200 rounded-md p-3 resize-none focus:ring-slate-400 outline-none'
                        />
                        <span className='text-[11px] text-slate-400 self-end'>{comment.length}/1000</span>
                    </label>
                </div>

                <div className='px-5 py-4 border-t border-slate-100 flex items-center justify-end gap-2'>
                    <button
                        type='button'
                        onClick={onClose}
                        className='text-sm text-slate-600 hover:text-slate-900 px-3 py-2 rounded-md transition'
                    >
                        Cancel
                    </button>
                    <button
                        type='submit'
                        disabled={saving}
                        className='inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white text-sm font-semibold rounded-full px-5 py-2 transition'
                    >
                        {saving ? 'Posting…' : 'Post review'}
                    </button>
                </div>
            </form>
        </div>
    )
}

export default ReviewModal
