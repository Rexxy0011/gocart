'use client'
import { useState } from "react"
import toast from "react-hot-toast"
import { BadgeCheck, MapPin, Mail, Phone, FileText, Camera } from "lucide-react"
import { setProviderApplicationStatus } from "@/app/actions/admin"

const REJECT_PRESETS = [
    'ID document is unclear or unreadable',
    'Selfie does not match the ID',
    'Identity / contact info inconsistency',
    'Insufficient experience or evidence',
    'Banned or restricted service category',
]

const ProviderQueue = ({ applications: initial }) => {

    const [apps, setApps] = useState(initial)
    const [pending, setPending] = useState({})
    const [rejectingId, setRejectingId] = useState(null)
    const [reason, setReason] = useState('')

    const startReject = (id) => { setRejectingId(id); setReason('') }
    const cancelReject = () => { setRejectingId(null); setReason('') }

    const submit = async (id, status, reasonText = '') => {
        setPending((p) => ({ ...p, [id]: status }))
        const result = await setProviderApplicationStatus(id, status, reasonText)
        if (result.error) {
            toast.error(result.error)
            setPending((p) => { const n = { ...p }; delete n[id]; return n })
            return
        }
        setApps((a) => a.filter(x => x.id !== id))
        setRejectingId(null)
        setReason('')
        toast.success(status === 'approved' ? 'Provider approved.' : 'Provider rejected.')
    }

    return (
        <div className="text-slate-500 mb-28">
            <h1 className="text-2xl">Approve <span className="text-slate-800 font-medium">Providers</span></h1>
            <p className="text-sm text-slate-500 mt-1">Service providers awaiting verification. Approving unlocks their /pro dashboard and the verified tick on their listings.</p>

            {apps.length === 0 ? (
                <div className="flex items-center justify-center h-80">
                    <h1 className="text-3xl text-slate-400 font-medium">No applications pending</h1>
                </div>
            ) : (
                <div className="flex flex-col gap-4 mt-6">
                    {apps.map((app) => {
                        const action = pending[app.id]
                        const isRejecting = rejectingId === app.id
                        return (
                            <div key={app.id} className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 flex max-md:flex-col gap-6 max-w-5xl">

                                <div className="flex-1 space-y-3 text-sm">
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <h3 className="text-xl font-semibold text-slate-800">{app.full_name}</h3>
                                        <span className="text-xs font-semibold px-3 py-0.5 rounded-full bg-yellow-100 text-yellow-800">
                                            {app.status}
                                        </span>
                                        <span className="inline-flex items-center gap-1 text-xs text-slate-500 bg-slate-100 ring-1 ring-slate-200 rounded-full px-2 py-0.5">
                                            <BadgeCheck size={12} /> {app.primary_category}
                                        </span>
                                    </div>

                                    {app.bio && <p className="text-slate-600 max-w-2xl">{app.bio}</p>}

                                    <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-slate-600 text-xs">
                                        <p className="flex items-center gap-2"><Phone size={13} /> {app.phone}</p>
                                        {app.user?.email && <p className="flex items-center gap-2"><Mail size={13} /> {app.user.email}</p>}
                                        {app.location && <p className="flex items-center gap-2"><MapPin size={13} /> {app.location}{app.area_covered ? ` · ${app.area_covered}` : ''}</p>}
                                        {app.years_experience != null && <p>{app.years_experience}+ yrs experience</p>}
                                    </div>

                                    {app.specialties?.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5">
                                            {app.specialties.map(s => (
                                                <span key={s} className="text-[11px] bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 rounded-full px-2 py-0.5">
                                                    {s}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {(app.id_type || app.id_document_signed_url || app.selfie_signed_url) && (
                                        <div className="pt-2 border-t border-slate-100 mt-3">
                                            <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">Identity</p>
                                            <div className="flex flex-wrap items-center gap-3 text-xs">
                                                {app.id_type && (
                                                    <span className="inline-flex items-center gap-1 text-slate-600">
                                                        <BadgeCheck size={13} /> {app.id_type.toUpperCase()}
                                                    </span>
                                                )}
                                                {app.id_document_signed_url && (
                                                    <a href={app.id_document_signed_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sky-700 hover:underline">
                                                        <FileText size={13} /> View ID document
                                                    </a>
                                                )}
                                                {app.selfie_signed_url && (
                                                    <a href={app.selfie_signed_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sky-700 hover:underline">
                                                        <Camera size={13} /> View selfie
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {app.certifications && (
                                        <div className="pt-2 border-t border-slate-100 mt-3">
                                            <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1">Certifications & references</p>
                                            <p className="text-slate-600 whitespace-pre-line">{app.certifications}</p>
                                        </div>
                                    )}

                                    <p className="text-xs text-slate-400 pt-2">Applied {new Date(app.created_at).toLocaleDateString()} · {app.user?.name}</p>
                                </div>

                                <div className="flex flex-col gap-3 md:w-72">
                                    {!isRejecting ? (
                                        <div className="flex gap-3 flex-wrap">
                                            <button type="button" disabled={!!action} onClick={() => submit(app.id, 'approved')} className="px-4 py-2 bg-slate-900 text-white rounded hover:bg-slate-950 disabled:opacity-50 text-sm transition">
                                                {action === 'approved' ? 'Approving…' : 'Approve'}
                                            </button>
                                            <button type="button" disabled={!!action} onClick={() => startReject(app.id)} className="px-4 py-2 bg-white text-slate-700 ring-1 ring-slate-300 hover:ring-slate-500 rounded disabled:opacity-50 text-sm transition">
                                                Reject
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="bg-slate-50 ring-1 ring-slate-200 rounded-lg p-3 space-y-3">
                                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Why rejecting?</p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {REJECT_PRESETS.map((preset) => (
                                                    <button key={preset} type="button" onClick={() => setReason(preset)} className="text-[11px] bg-white ring-1 ring-slate-200 hover:ring-slate-400 rounded-full px-2.5 py-1 transition">
                                                        {preset}
                                                    </button>
                                                ))}
                                            </div>
                                            <textarea
                                                value={reason}
                                                onChange={(e) => setReason(e.target.value)}
                                                rows={3}
                                                placeholder="Pick a preset or type a specific reason. The applicant sees this on their dashboard."
                                                className="w-full text-sm bg-white border border-slate-200 rounded p-2 outline-none focus:border-slate-400 transition"
                                            />
                                            <div className="flex gap-2 justify-end">
                                                <button type="button" onClick={cancelReject} className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 transition">Cancel</button>
                                                <button type="button" disabled={!reason.trim() || !!action} onClick={() => submit(app.id, 'rejected', reason)} className="px-3 py-1.5 text-xs bg-rose-600 text-white rounded hover:bg-rose-700 disabled:opacity-50 transition">
                                                    {action === 'rejected' ? 'Rejecting…' : 'Confirm reject'}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

export default ProviderQueue
