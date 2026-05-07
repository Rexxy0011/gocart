'use client'
import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { toast } from 'react-hot-toast'
import { X, Camera, Trash2 } from 'lucide-react'
import { updateStoreProfile } from '@/app/actions/stores'
import { uploadAvatar } from '@/lib/supabase/storage'
import { createClient } from '@/lib/supabase/client'

// Inline edit-profile form for the owner of a /shop/[username] page.
// Edits the four "soft" store fields — name, description, contact, logo.
// Username, status, and email are deliberately NOT editable here.
// Logo upload reuses the avatar uploader (product-images bucket, owner-
// scoped path), so no new storage policy is needed.
const EditProfileModal = ({ open, onClose, initial }) => {

    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [contact, setContact] = useState('')
    const [logoUrl, setLogoUrl] = useState('')
    const [logoFile, setLogoFile] = useState(null)
    const [logoPreview, setLogoPreview] = useState('')
    const [saving, setSaving] = useState(false)
    const fileInputRef = useRef(null)

    useEffect(() => {
        if (open && initial) {
            setName(initial.name || '')
            setDescription(initial.description || '')
            setContact(initial.contact || '')
            setLogoUrl(initial.logo || '')
            setLogoFile(null)
            setLogoPreview('')
        }
        if (!open) {
            setSaving(false)
        }
    }, [open, initial])

    useEffect(() => {
        if (!open) return
        const onKey = (e) => { if (e.key === 'Escape' && !saving) onClose() }
        document.addEventListener('keydown', onKey)
        document.body.style.overflow = 'hidden'
        return () => {
            document.removeEventListener('keydown', onKey)
            document.body.style.overflow = ''
        }
    }, [open, onClose, saving])

    useEffect(() => () => { if (logoPreview) URL.revokeObjectURL(logoPreview) }, [logoPreview])

    if (!open) return null

    const onPickLogo = (e) => {
        const f = e.target.files?.[0]
        if (!f) return
        if (!f.type.startsWith('image/')) { toast.error('Pick an image file.'); return }
        if (f.size > 5 * 1024 * 1024)     { toast.error('Logo must be ≤ 5MB.'); return }
        if (logoPreview) URL.revokeObjectURL(logoPreview)
        setLogoFile(f)
        setLogoPreview(URL.createObjectURL(f))
        e.target.value = ''
    }

    const onClearLogo = () => {
        if (logoPreview) URL.revokeObjectURL(logoPreview)
        setLogoFile(null)
        setLogoPreview('')
        setLogoUrl('')   // explicit clear — server treats '' as "remove"
    }

    const onSubmit = async (e) => {
        e.preventDefault()
        if (saving) return
        setSaving(true)

        let nextLogo = logoUrl
        if (logoFile) {
            try {
                const supabase = createClient()
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) { toast.error('Sign in first.'); setSaving(false); return }
                nextLogo = await uploadAvatar(logoFile, user.id)
            } catch (err) {
                toast.error(err?.message || 'Logo upload failed.')
                setSaving(false)
                return
            }
        }

        const result = await updateStoreProfile({
            name,
            description,
            contact,
            // null = leave as-is, '' = clear, http... = new URL
            logo: logoFile ? nextLogo : (logoUrl === '' && initial.logo ? '' : null),
        })
        setSaving(false)
        if (result?.error) { toast.error(result.error); return }
        toast.success('Profile updated.')
        onClose()
    }

    const previewSrc = logoPreview || logoUrl

    return (
        <div
            className='fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm sm:p-4'
            onClick={() => !saving && onClose()}
        >
            <form
                onSubmit={onSubmit}
                onClick={(e) => e.stopPropagation()}
                className='relative w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[92vh] flex flex-col'
            >
                <div className='flex items-center justify-between px-5 py-4 border-b border-slate-100'>
                    <h2 className='text-base font-bold text-slate-900'>Edit profile</h2>
                    <button
                        type='button'
                        onClick={onClose}
                        disabled={saving}
                        aria-label='Close'
                        className='size-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500'
                    >
                        <X size={16} />
                    </button>
                </div>

                <div className='overflow-y-auto px-5 py-5 space-y-5'>

                    {/* Logo */}
                    <div>
                        <p className='text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2'>Profile photo</p>
                        <div className='flex items-center gap-4'>
                            <div className='relative size-20 rounded-full overflow-hidden bg-slate-100 ring-1 ring-slate-200 shrink-0'>
                                {previewSrc ? (
                                    <Image src={previewSrc} alt='' fill sizes='80px' className='object-cover' unoptimized />
                                ) : (
                                    <div className='size-full flex items-center justify-center text-slate-400 text-2xl font-semibold'>
                                        {(name || '?').charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <div className='flex flex-col gap-2'>
                                <button
                                    type='button'
                                    onClick={() => fileInputRef.current?.click()}
                                    className='inline-flex items-center gap-1.5 text-sm bg-slate-900 hover:bg-slate-800 text-white rounded-full px-3 py-1.5 transition'
                                >
                                    <Camera size={14} /> Change photo
                                </button>
                                {previewSrc && (
                                    <button
                                        type='button'
                                        onClick={onClearLogo}
                                        className='inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-rose-600 transition'
                                    >
                                        <Trash2 size={12} /> Remove
                                    </button>
                                )}
                                <input ref={fileInputRef} type='file' accept='image/*' className='hidden' onChange={onPickLogo} />
                            </div>
                        </div>
                    </div>

                    {/* Name */}
                    <label className='flex flex-col gap-1.5'>
                        <span className='text-xs font-semibold uppercase tracking-wide text-slate-500'>Display name</span>
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            maxLength={80}
                            required
                            placeholder='How buyers see you'
                            className='text-sm bg-slate-50 ring-1 ring-slate-200 rounded p-2.5 outline-none focus:ring-slate-400 transition'
                        />
                    </label>

                    {/* Description */}
                    <label className='flex flex-col gap-1.5'>
                        <span className='text-xs font-semibold uppercase tracking-wide text-slate-500'>About you / your shop</span>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={4}
                            maxLength={1000}
                            placeholder='What do you sell? Any guarantee? Hours?'
                            className='text-sm bg-slate-50 ring-1 ring-slate-200 rounded p-2.5 outline-none focus:ring-slate-400 transition resize-none'
                        />
                        <span className='text-[10px] text-slate-400 self-end'>{description.length}/1000</span>
                    </label>

                    {/* Contact */}
                    <label className='flex flex-col gap-1.5'>
                        <span className='text-xs font-semibold uppercase tracking-wide text-slate-500'>Contact phone</span>
                        <input
                            value={contact}
                            onChange={(e) => setContact(e.target.value)}
                            maxLength={40}
                            placeholder='+234…'
                            className='text-sm bg-slate-50 ring-1 ring-slate-200 rounded p-2.5 outline-none focus:ring-slate-400 transition'
                        />
                        <span className='text-[10px] text-slate-400'>Buyers tap "Show contact" on your listings to reveal this.</span>
                    </label>
                </div>

                <div className='border-t border-slate-100 px-5 py-4 flex items-center justify-end gap-2'>
                    <button
                        type='button'
                        onClick={onClose}
                        disabled={saving}
                        className='text-sm text-slate-600 hover:text-slate-900 px-3 py-2 rounded-md transition'
                    >
                        Cancel
                    </button>
                    <button
                        type='submit'
                        disabled={saving}
                        className='inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white text-sm font-semibold rounded-full px-5 py-2 transition'
                    >
                        {saving ? 'Saving…' : 'Save changes'}
                    </button>
                </div>
            </form>
        </div>
    )
}

export default EditProfileModal
