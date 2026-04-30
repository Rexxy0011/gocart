'use client'
import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import { X, Flag, ArrowRight } from 'lucide-react'
import { submitReport } from '@/app/actions/reports'

const REASON_PRESETS = [
    'Spam or scam',
    'Prohibited item (drugs, weapons, etc.)',
    'Counterfeit or stolen goods',
    'Miscategorised',
    'Offensive or abusive content',
    'Misleading description or photos',
]

const ReportModal = ({ open, onClose, listingId, listingName }) => {

    const [reason, setReason] = useState('')
    const [description, setDescription] = useState('')
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        if (!open) {
            setReason('')
            setDescription('')
            setSubmitting(false)
        }
    }, [open])

    useEffect(() => {
        if (!open) return
        const onKey = (e) => { if (e.key === 'Escape') onClose() }
        document.addEventListener('keydown', onKey)
        document.body.style.overflow = 'hidden'
        return () => {
            document.removeEventListener('keydown', onKey)
            document.body.style.overflow = ''
        }
    }, [open, onClose])

    if (!open) return null

    const onSubmit = async (e) => {
        e.preventDefault()
        if (!reason.trim() || submitting) return
        setSubmitting(true)
        const result = await submitReport({ listingId, reason, description })
        setSubmitting(false)
        if (result?.error) {
            toast.error(result.error)
            return
        }
        toast.success('Report submitted — our team will review.')
        onClose()
    }

    return (
        <div
            className='fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4 py-6'
            onClick={onClose}
        >
            <div
                className='relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden'
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    type='button'
                    onClick={onClose}
                    aria-label='Close'
                    className='absolute top-3 right-3 size-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-700 transition'
                >
                    <X size={16} />
                </button>

                <div className='p-6 pt-7'>
                    <div className='flex items-center gap-2 mb-1'>
                        <span className='inline-flex items-center justify-center size-9 rounded-xl bg-rose-50 ring-1 ring-rose-200 text-rose-600'>
                            <Flag size={16} />
                        </span>
                        <h2 className='text-lg font-bold text-slate-900'>Report this listing</h2>
                    </div>
                    <p className='text-sm text-slate-600 mt-1'>
                        Reporting <span className='font-medium text-slate-800'>{listingName || 'this listing'}</span>. Our team reviews every report.
                    </p>

                    <form onSubmit={onSubmit} className='mt-5 space-y-4'>
                        <div>
                            <p className='text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2'>Reason</p>
                            <div className='flex flex-wrap gap-1.5'>
                                {REASON_PRESETS.map((preset) => (
                                    <button
                                        key={preset}
                                        type='button'
                                        onClick={() => setReason(preset)}
                                        className={`text-xs ring-1 rounded-full px-2.5 py-1 transition ${
                                            reason === preset
                                                ? 'bg-slate-900 text-white ring-slate-900'
                                                : 'bg-white text-slate-700 ring-slate-200 hover:ring-slate-400'
                                        }`}
                                    >
                                        {preset}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <label className='flex flex-col gap-1.5'>
                            <span className='text-xs font-semibold uppercase tracking-wide text-slate-500'>Anything else? (optional)</span>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                                placeholder='Help our team — links, screenshots context, anything specific.'
                                className='w-full text-sm bg-slate-50 ring-1 ring-slate-200 rounded p-2.5 outline-none focus:ring-slate-400 transition'
                            />
                        </label>

                        <button
                            type='submit'
                            disabled={!reason.trim() || submitting}
                            className='w-full inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-sm font-semibold rounded-full py-2.5 transition'
                        >
                            {submitting ? 'Submitting…' : 'Submit report'}
                            {!submitting && <ArrowRight size={15} />}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default ReportModal
