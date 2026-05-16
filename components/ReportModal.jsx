'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { toast } from 'react-hot-toast'
import { X, Flag, ArrowRight, ImagePlus, Trash2 } from 'lucide-react'
import { submitReport } from '@/app/actions/reports'
import { uploadReportEvidence } from '@/lib/supabase/storage'
import { createClient } from '@/lib/supabase/client'

const REASON_PRESETS = [
    'Spam or scam',
    'Prohibited item (drugs, weapons, etc.)',
    'Counterfeit or stolen goods',
    'Miscategorised',
    'Offensive or abusive content',
    'Misleading description or photos',
]

const MAX_EVIDENCE = 5
const MAX_BYTES = 5 * 1024 * 1024 // 5MB per file

const ReportModal = ({ open, onClose, listingId, listingName }) => {

    const [reason, setReason] = useState('')
    const [description, setDescription] = useState('')
    const [files, setFiles] = useState([])     // File[] picked but not yet uploaded
    const [previews, setPreviews] = useState([]) // Object URLs for thumbnails
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        if (!open) {
            setReason('')
            setDescription('')
            setFiles([])
            setPreviews((p) => { p.forEach(URL.revokeObjectURL); return [] })
            setSubmitting(false)
        }
    }, [open])

    // Revoke preview blob URLs whenever files list changes so we don't leak.
    useEffect(() => {
        return () => previews.forEach(URL.revokeObjectURL)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [previews])

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

    const onPickFiles = (e) => {
        const picked = Array.from(e.target.files || [])
        if (!picked.length) return
        const remaining = MAX_EVIDENCE - files.length
        if (remaining <= 0) {
            toast.error(`Up to ${MAX_EVIDENCE} images.`)
            return
        }
        const ok = []
        for (const f of picked.slice(0, remaining)) {
            if (!f.type.startsWith('image/')) {
                toast.error(`${f.name} isn't an image.`); continue
            }
            if (f.size > MAX_BYTES) {
                toast.error(`${f.name} is over 5MB.`); continue
            }
            ok.push(f)
        }
        if (!ok.length) return
        setFiles((prev) => [...prev, ...ok])
        setPreviews((prev) => [...prev, ...ok.map((f) => URL.createObjectURL(f))])
        // Reset the input so picking the same file again still fires onChange.
        e.target.value = ''
    }

    const removeAt = (i) => {
        setFiles((prev) => prev.filter((_, idx) => idx !== i))
        setPreviews((prev) => {
            URL.revokeObjectURL(prev[i])
            return prev.filter((_, idx) => idx !== i)
        })
    }

    const onSubmit = async (e) => {
        e.preventDefault()
        if (!reason.trim() || submitting) return
        setSubmitting(true)

        let evidenceUrls = []
        if (files.length) {
            try {
                const supabase = createClient()
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) {
                    toast.error('Sign in first.')
                    setSubmitting(false)
                    return
                }
                evidenceUrls = await uploadReportEvidence(files, user.id)
            } catch (err) {
                toast.error(err?.message || 'Couldn\'t upload your evidence - try again.')
                setSubmitting(false)
                return
            }
        }

        const result = await submitReport({ listingId, reason, description, evidenceUrls })
        setSubmitting(false)
        if (result?.error) {
            toast.error(result.error)
            return
        }
        toast.success('Report submitted - our team will review.')
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
                                placeholder='Add anything specific the team should know.'
                                className='w-full text-sm bg-slate-50 ring-1 ring-slate-200 rounded p-2.5 outline-none focus:ring-slate-400 transition'
                            />
                        </label>

                        {/* Evidence uploads - up to 5 image attachments. */}
                        <div>
                            <p className='text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2'>
                                Picture evidence <span className='text-slate-400 font-normal normal-case'>- optional, up to {MAX_EVIDENCE}</span>
                            </p>
                            <div className='grid grid-cols-4 gap-2'>
                                {previews.map((src, i) => (
                                    <div key={src} className='relative aspect-square rounded-md overflow-hidden ring-1 ring-slate-200 bg-slate-100'>
                                        <Image src={src} alt={`Evidence ${i + 1}`} fill sizes='80px' className='object-cover' unoptimized />
                                        <button
                                            type='button'
                                            onClick={() => removeAt(i)}
                                            aria-label='Remove image'
                                            className='absolute top-1 right-1 size-6 rounded-full bg-black/55 hover:bg-black/75 text-white flex items-center justify-center transition'
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                ))}
                                {files.length < MAX_EVIDENCE && (
                                    <label className='aspect-square rounded-md ring-1 ring-dashed ring-slate-300 hover:ring-slate-500 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-700 flex flex-col items-center justify-center gap-1 cursor-pointer transition'>
                                        <ImagePlus size={18} />
                                        <span className='text-[10px] font-medium'>Add photo</span>
                                        <input
                                            type='file'
                                            accept='image/*'
                                            multiple
                                            className='hidden'
                                            onChange={onPickFiles}
                                        />
                                    </label>
                                )}
                            </div>
                            {files.length > 0 && (
                                <p className='text-[11px] text-slate-400 mt-2'>
                                    {files.length}/{MAX_EVIDENCE} added · uploaded when you submit
                                </p>
                            )}
                        </div>

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
