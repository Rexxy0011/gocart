'use client'
import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
    ShieldCheck, Upload, Camera, BadgeCheck, MapPin, Phone, FileText, ArrowRight, Info, X,
    Hourglass, ShieldAlert,
} from "lucide-react"
import { toast } from "react-hot-toast"
import { categoryGroups, serviceSpecialties, stateAreas } from "@/assets/assets"
import Dropdown from "@/components/Dropdown"
import VerifiedCheck from "@/components/VerifiedCheck"
import { createClient } from "@/lib/supabase/client"
import { uploadProviderDoc } from "@/lib/supabase/storage"
import { useUser } from "@/lib/auth/UserContext"

const SERVICES_GROUP_NAME = 'Repairs & Services'
const serviceCategories = (categoryGroups.find(g => g.name === SERVICES_GROUP_NAME)?.items || [])
    .map(c => ({ value: c, label: c }))

const ID_TYPES = [
    { value: 'nin',      label: 'NIN (National ID)' },
    { value: 'passport', label: 'International passport' },
    { value: 'license',  label: "Driver's license" },
    { value: 'voter',    label: 'Voter card' },
]

const LOCATIONS = Object.keys(stateAreas).map(c => ({ value: c, label: c }))

export default function ProviderApply() {

    const router = useRouter()
    const supabase = createClient()
    const user = useUser()

    const [form, setForm] = useState({
        fullName: '',
        phone: '',
        idType: '',
        idDocument: null,
        selfie: null,
        primaryCategory: '',
        specialties: [],
        location: '',
        areaCovered: '',
        yearsExperience: '',
        bio: '',
        certifications: '',
    })
    const [submitting, setSubmitting] = useState(false)

    // Existing application status — drives the banner and whether the form
    // is editable. Fetched once on mount via the client SDK.
    const [existing, setExisting] = useState(null)
    const [loadingExisting, setLoadingExisting] = useState(true)

    useEffect(() => {
        if (!user) {
            setLoadingExisting(false)
            return
        }
        let active = true
        ;(async () => {
            const { data } = await supabase
                .from('provider_applications')
                .select('id, status, full_name, phone, id_type, primary_category, specialties, location, area_covered, years_experience, bio, certifications, rejection_reason')
                .eq('user_id', user.id)
                .maybeSingle()
            if (!active) return
            setExisting(data)
            // Prefill the form when there's a previous (rejected) application
            // so the seller doesn't have to retype everything to resubmit.
            if (data?.status === 'rejected') {
                setForm({
                    fullName: data.full_name || '',
                    phone: data.phone || '',
                    idType: data.id_type || '',
                    idDocument: null,
                    selfie: null,
                    primaryCategory: data.primary_category || '',
                    specialties: data.specialties || [],
                    location: data.location || '',
                    areaCovered: data.area_covered || '',
                    yearsExperience: data.years_experience != null ? String(data.years_experience) : '',
                    bio: data.bio || '',
                    certifications: data.certifications || '',
                })
            }
            setLoadingExisting(false)
        })()
        return () => { active = false }
    }, [user, supabase])

    const availableSpecialties = serviceSpecialties[form.primaryCategory] || []

    const set = (k, v) => setForm({ ...form, [k]: v })
    const toggleSpecialty = (s) => {
        setForm((f) => ({
            ...f,
            specialties: f.specialties.includes(s)
                ? f.specialties.filter(x => x !== s)
                : [...f.specialties, s],
        }))
    }

    const onSubmit = async (e) => {
        e.preventDefault()
        if (!user) {
            toast.error('You need to be signed in to apply.')
            return
        }
        setSubmitting(true)

        try {
            // 1. Upload ID + selfie to the private provider-docs bucket. Paths
            // (not public URLs) are stored — admin generates signed URLs at
            // view time. Skip uploads if the user reused a re-submit and
            // didn't pick new files; we'll keep whatever was already there.
            let idDocPath = null
            let selfiePath = null
            if (form.idDocument) {
                idDocPath = await uploadProviderDoc(form.idDocument, user.id, 'id-document')
            }
            if (form.selfie) {
                selfiePath = await uploadProviderDoc(form.selfie, user.id, 'selfie')
            }

            // 2. Upsert the provider_applications row. user_id is unique so
            // re-submitting after a rejection updates the existing row.
            const payload = {
                user_id: user.id,
                full_name: form.fullName.trim(),
                phone: form.phone.trim(),
                id_type: form.idType || null,
                id_document_url: idDocPath,
                selfie_url: selfiePath,
                primary_category: form.primaryCategory,
                specialties: form.specialties,
                location: form.location || null,
                area_covered: form.areaCovered.trim() || null,
                years_experience: form.yearsExperience ? Number(form.yearsExperience) : null,
                bio: form.bio.trim(),
                certifications: form.certifications.trim() || null,
                status: 'pending',
                rejection_reason: null,
            }

            const { error } = await supabase
                .from('provider_applications')
                .upsert(payload, { onConflict: 'user_id' })

            if (error) throw error

            toast.success('Application submitted — admin will review within 24 hours.')
            router.push('/pro')
            router.refresh()
        } catch (err) {
            toast.error(err?.message || 'Could not submit application.')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="px-6 my-10 max-w-3xl mx-auto">

            {/* Header */}
            <div className="flex items-start gap-4">
                <span className="inline-flex items-center justify-center size-12 rounded-2xl bg-emerald-50 ring-1 ring-emerald-200 text-emerald-600 shrink-0">
                    <ShieldCheck size={20} />
                </span>
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Become a verified provider</h1>
                    <p className="text-sm text-slate-600 mt-1 max-w-xl">
                        Quick verification so buyers can trust you. Free, takes about 5 minutes — usually approved within 24 hours.
                    </p>
                </div>
            </div>

            {/* What you get */}
            <div className="mt-6 grid sm:grid-cols-3 gap-3">
                {[
                    { Icon: VerifiedCheck, label: 'Verified ✓ next to your name', tone: 'text-emerald-600 bg-emerald-50 ring-emerald-200' },
                    { Icon: BadgeCheck,    label: 'List unlimited services',      tone: 'text-sky-600 bg-sky-50 ring-sky-200' },
                    { Icon: ShieldCheck,   label: 'Receive job inquiries',        tone: 'text-violet-600 bg-violet-50 ring-violet-200' },
                ].map(({ Icon, label, tone }, i) => (
                    <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3">
                        <span className={`inline-flex items-center justify-center size-9 rounded-xl ring-1 ${tone}`}>
                            <Icon size={16} />
                        </span>
                        <p className="text-sm text-slate-700 font-medium">{label}</p>
                    </div>
                ))}
            </div>

            {/* Hint */}
            <div className="mt-6 bg-slate-50 ring-1 ring-slate-200 rounded-xl p-4 flex items-start gap-3">
                <Info size={16} className="text-slate-500 mt-0.5 shrink-0" />
                <p className="text-sm text-slate-600">
                    <span className="font-semibold text-slate-900">Verification is free.</span>{' '}
                    Once approved, you get the verified tick, branded storefront, lead alerts, and access to milestone badges as you complete verified jobs.
                </p>
            </div>

            {/* Existing-application banner */}
            {existing?.status === 'pending' && (
                <div className="mt-6 bg-amber-50 ring-1 ring-amber-200 rounded-xl p-4 flex items-start gap-3">
                    <Hourglass size={16} className="text-amber-600 mt-0.5 shrink-0" />
                    <div className="flex-1">
                        <p className="text-sm font-semibold text-amber-900">Application under review</p>
                        <p className="text-sm text-amber-800 mt-0.5">
                            Submitted — admin is reviewing your details. Usually approved within 24 hours. You can&apos;t edit while it&apos;s pending; reach out to support if you need to change something urgent.
                        </p>
                    </div>
                </div>
            )}
            {existing?.status === 'rejected' && (
                <div className="mt-6 bg-rose-50 ring-1 ring-rose-200 rounded-xl p-4 flex items-start gap-3">
                    <ShieldAlert size={16} className="text-rose-600 mt-0.5 shrink-0" />
                    <div className="flex-1">
                        <p className="text-sm font-semibold text-rose-900">Application rejected</p>
                        {existing.rejection_reason && (
                            <p className="text-sm text-rose-800 mt-0.5">
                                <span className="font-medium">Reason:</span> {existing.rejection_reason}
                            </p>
                        )}
                        <p className="text-xs text-rose-700 mt-2">
                            Edit the details below and resubmit — your form is pre-filled with what you submitted last time.
                        </p>
                    </div>
                </div>
            )}

            {/* Form is hidden while a pending application is in review */}
            {existing?.status !== 'pending' && (
            <form onSubmit={onSubmit} className="mt-10 space-y-10">

                {/* About you */}
                <section>
                    <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500 mb-4">About you</h2>
                    <div className="grid sm:grid-cols-2 gap-4">
                        <label className="flex flex-col gap-2">
                            <span className="text-slate-700 font-medium text-sm">Full name</span>
                            <input
                                type="text"
                                value={form.fullName}
                                onChange={(e) => set('fullName', e.target.value)}
                                placeholder="As on your ID"
                                className="w-full p-2.5 px-4 outline-none border border-slate-200 rounded focus:border-slate-400"
                                required
                            />
                        </label>
                        <label className="flex flex-col gap-2">
                            <span className="text-slate-700 font-medium text-sm">Phone</span>
                            <div className="flex items-center gap-2 bg-white ring-1 ring-slate-200 rounded px-4 py-2.5 focus-within:ring-slate-400 transition">
                                <Phone size={15} className="text-slate-400 shrink-0" />
                                <input
                                    type="tel"
                                    value={form.phone}
                                    onChange={(e) => set('phone', e.target.value)}
                                    placeholder="+234 802 000 0000"
                                    className="flex-1 text-sm bg-transparent outline-none placeholder-slate-400 min-w-0"
                                    required
                                />
                            </div>
                            <span className="text-xs text-slate-400">We&apos;ll send an OTP to confirm.</span>
                        </label>
                    </div>
                </section>

                {/* Identity */}
                <section>
                    <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500 mb-4">Identity</h2>
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                            <span className="text-slate-700 font-medium text-sm">ID type</span>
                            <Dropdown
                                value={form.idType}
                                onChange={(v) => set('idType', v)}
                                placeholder="Choose ID type"
                                leftIcon={<BadgeCheck size={15} className="text-slate-400 shrink-0" />}
                                options={ID_TYPES}
                            />
                        </div>
                        <label className="flex flex-col gap-2">
                            <span className="text-slate-700 font-medium text-sm">ID document</span>
                            <label className="flex items-center gap-3 bg-white ring-1 ring-slate-200 hover:ring-slate-400 rounded p-3 cursor-pointer transition">
                                <Upload size={16} className="text-slate-500 shrink-0" />
                                <span className="text-sm text-slate-600 truncate">
                                    {form.idDocument ? form.idDocument.name : 'Upload front photo of ID'}
                                </span>
                                <input
                                    type="file"
                                    accept="image/*,application/pdf"
                                    hidden
                                    onChange={(e) => set('idDocument', e.target.files[0] || null)}
                                />
                            </label>
                        </label>
                    </div>

                    <label className="flex flex-col gap-2 mt-4 max-w-md">
                        <span className="text-slate-700 font-medium text-sm">Selfie</span>
                        <label className="flex items-center gap-3 bg-white ring-1 ring-slate-200 hover:ring-slate-400 rounded p-3 cursor-pointer transition">
                            <Camera size={16} className="text-slate-500 shrink-0" />
                            <span className="text-sm text-slate-600 truncate">
                                {form.selfie ? form.selfie.name : 'Upload a clear selfie'}
                            </span>
                            <input
                                type="file"
                                accept="image/*"
                                hidden
                                onChange={(e) => set('selfie', e.target.files[0] || null)}
                            />
                        </label>
                        <span className="text-xs text-slate-400">We match this against your ID. Never shown publicly.</span>
                    </label>
                </section>

                {/* Service profile */}
                <section>
                    <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500 mb-4">Your service</h2>
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                            <span className="text-slate-700 font-medium text-sm">Primary category</span>
                            <Dropdown
                                value={form.primaryCategory}
                                onChange={(v) => set('primaryCategory', v)}
                                placeholder="What do you do?"
                                options={serviceCategories}
                            />
                        </div>
                        <label className="flex flex-col gap-2">
                            <span className="text-slate-700 font-medium text-sm">Years of experience</span>
                            <input
                                type="number"
                                min="0"
                                value={form.yearsExperience}
                                onChange={(e) => set('yearsExperience', e.target.value)}
                                placeholder="e.g. 5"
                                className="w-full p-2.5 px-4 outline-none border border-slate-200 rounded focus:border-slate-400"
                            />
                        </label>
                    </div>

                    {availableSpecialties.length > 0 && (
                        <div className="mt-4">
                            <span className="text-slate-700 font-medium text-sm">Specialties (pick all that apply)</span>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {availableSpecialties.map((s) => {
                                    const active = form.specialties.includes(s)
                                    return (
                                        <button
                                            key={s}
                                            type="button"
                                            onClick={() => toggleSpecialty(s)}
                                            className={`text-sm px-3 py-1.5 rounded-full ring-1 transition ${
                                                active
                                                    ? 'bg-slate-900 text-white ring-slate-900'
                                                    : 'bg-white text-slate-700 ring-slate-200 hover:ring-slate-400'
                                            }`}
                                        >
                                            {s}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    <div className="grid sm:grid-cols-2 gap-4 mt-4">
                        <div className="flex flex-col gap-2">
                            <span className="text-slate-700 font-medium text-sm">Based in</span>
                            <Dropdown
                                value={form.location}
                                onChange={(v) => set('location', v)}
                                placeholder="Your city"
                                leftIcon={<MapPin size={15} className="text-slate-400 shrink-0" />}
                                options={LOCATIONS}
                            />
                        </div>
                        <label className="flex flex-col gap-2">
                            <span className="text-slate-700 font-medium text-sm">Area you cover</span>
                            <input
                                type="text"
                                value={form.areaCovered}
                                onChange={(e) => set('areaCovered', e.target.value)}
                                placeholder="e.g. Lagos mainland & Yaba"
                                className="w-full p-2.5 px-4 outline-none border border-slate-200 rounded focus:border-slate-400"
                            />
                        </label>
                    </div>

                    <label className="flex flex-col gap-2 mt-4">
                        <span className="text-slate-700 font-medium text-sm">Short bio</span>
                        <textarea
                            rows={4}
                            value={form.bio}
                            onChange={(e) => set('bio', e.target.value)}
                            placeholder="What you do, who you work with, and why buyers should pick you."
                            className="w-full p-2.5 px-4 outline-none border border-slate-200 rounded resize-none focus:border-slate-400"
                            required
                        />
                    </label>

                    <label className="flex flex-col gap-2 mt-4">
                        <span className="text-slate-700 font-medium text-sm">
                            Certifications &amp; references <span className="text-slate-400 font-normal">— optional</span>
                        </span>
                        <textarea
                            rows={3}
                            value={form.certifications}
                            onChange={(e) => set('certifications', e.target.value)}
                            placeholder="Trade certifications, past employers, references buyers can call."
                            className="w-full p-2.5 px-4 outline-none border border-slate-200 rounded resize-none focus:border-slate-400"
                        />
                    </label>
                </section>

                {/* Submit */}
                <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-200">
                    <p className="text-xs text-slate-500">
                        By submitting, you agree to our{' '}
                        <Link href="/safety" className="text-sky-700 hover:underline">Safety guidelines</Link>{' '}
                        and{' '}
                        <Link href="/terms" className="text-sky-700 hover:underline">Terms of Use</Link>.
                    </p>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-full px-6 py-3 transition disabled:opacity-50"
                    >
                        {submitting ? 'Submitting…' : (existing?.status === 'rejected' ? 'Resubmit' : 'Submit for verification')}
                        {!submitting && <ArrowRight size={15} />}
                    </button>
                </div>
            </form>
            )}
        </div>
    )
}
