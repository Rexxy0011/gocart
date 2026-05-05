'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { Camera, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { uploadAvatar } from '@/lib/supabase/storage'

// Soft, dismissible banner that appears in the seller dashboard when the
// seller has no profile picture yet. EXPLICITLY separate from the KYC
// selfie — copy and the helper it calls (uploadAvatar) target the public
// product-images bucket, never the private provider-docs one. Dismissal
// is stored in sessionStorage so it doesn't haunt the seller forever, but
// also doesn't reappear on every page refresh in a single sit-down.
const AvatarPrompt = ({ userId, currentImage }) => {

    const router = useRouter()
    const [hasImage, setHasImage] = useState(!!currentImage)
    const [dismissed, setDismissed] = useState(false)
    const [uploading, setUploading] = useState(false)

    useEffect(() => {
        if (typeof window === 'undefined') return
        if (sessionStorage.getItem('avatar-prompt-dismissed') === '1') {
            setDismissed(true)
        }
    }, [])

    if (hasImage || dismissed) return null

    const onPick = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        if (!file.type.startsWith('image/')) {
            toast.error('Pick an image file.')
            return
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image too large — keep it under 5 MB.')
            return
        }

        setUploading(true)
        try {
            const url = await uploadAvatar(file, userId)
            const supabase = createClient()
            const { error } = await supabase
                .from('profiles')
                .update({ image: url })
                .eq('id', userId)
            if (error) throw error
            setHasImage(true)
            toast.success('Profile picture set — looking good.')
            // Refresh server data so other surfaces (avatar in nav, in
            // listings) pick up the new image without a hard reload.
            router.refresh()
        } catch (err) {
            toast.error(err?.message || 'Upload failed.')
        } finally {
            setUploading(false)
        }
    }

    const onSkip = () => {
        sessionStorage.setItem('avatar-prompt-dismissed', '1')
        setDismissed(true)
    }

    return (
        <div className='relative bg-gradient-to-br from-sky-50 via-white to-emerald-50/40 ring-1 ring-sky-200 rounded-2xl p-5 mb-6'>
            <button
                type='button'
                onClick={onSkip}
                aria-label='Skip for now'
                className='absolute top-3 right-3 size-7 rounded-full hover:bg-white/80 flex items-center justify-center text-slate-400'
            >
                <X size={14} />
            </button>
            <div className='flex items-start gap-4 pr-6'>
                <span className='inline-flex items-center justify-center size-11 rounded-full bg-white ring-1 ring-sky-200 text-sky-700 shrink-0'>
                    <Camera size={18} />
                </span>
                <div className='flex-1 min-w-0'>
                    <p className='font-semibold text-slate-900'>Add a profile picture</p>
                    <p className='text-sm text-slate-600 mt-1 leading-relaxed'>
                        Buyers see this on every listing — sellers with a real face get more replies. This is public and is{' '}
                        <strong>separate from any KYC selfie</strong> you may have uploaded for verification.
                    </p>
                    <div className='mt-3 flex items-center gap-3'>
                        <label className={`inline-flex items-center gap-2 text-sm font-semibold rounded-full px-4 py-2 transition cursor-pointer
                            ${uploading
                                ? 'bg-slate-300 text-white cursor-not-allowed'
                                : 'bg-slate-900 hover:bg-slate-800 text-white'}`}>
                            <Camera size={14} />
                            {uploading ? 'Uploading…' : 'Choose photo'}
                            <input type='file' accept='image/*' hidden onChange={onPick} disabled={uploading} />
                        </label>
                        <button
                            type='button'
                            onClick={onSkip}
                            className='text-sm text-slate-500 hover:text-slate-700'
                        >
                            Skip for now
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AvatarPrompt
