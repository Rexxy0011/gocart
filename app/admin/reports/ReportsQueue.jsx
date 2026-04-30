'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'
import { Flag, ExternalLink, ShieldCheck, ShieldAlert } from 'lucide-react'
import { adminResolveReport } from '@/app/actions/reports'

const ReportsQueue = ({ groups: initialGroups }) => {

    const [groups, setGroups] = useState(initialGroups)
    const [pending, setPending] = useState({})
    const [notes, setNotes] = useState({})

    const onResolve = async (reportIds, listingId, action) => {
        // For action='remove-listing' we close every open report on the
        // same listing in a single server-side update — but we identify
        // the call by the *first* report id so the user-visible loading
        // state only attaches to the row they actually clicked.
        const headId = reportIds[0]
        setPending((p) => ({ ...p, [headId]: action }))
        const result = await adminResolveReport(headId, action, notes[headId] || '')
        if (result.error) {
            toast.error(result.error)
            setPending((p) => { const n = { ...p }; delete n[headId]; return n })
            return
        }

        // Drop the whole group when admin removes the listing — every report
        // on it is now resolved. For 'dismiss' just drop the single report
        // they acted on.
        setGroups((gs) => gs
            .map(g => g.listing.id === listingId
                ? action === 'remove-listing'
                    ? null  // entire group cleared
                    : { ...g, reports: g.reports.filter(r => r.id !== headId) }
                : g
            )
            .filter(g => g && g.reports.length > 0)
        )
        toast.success(action === 'remove-listing' ? 'Listing removed.' : 'Report dismissed.')
    }

    return (
        <div className='text-slate-500 mb-28'>
            <h1 className='text-2xl'>Open <span className='text-slate-800 font-medium'>Reports</span></h1>
            <p className='text-sm text-slate-500 mt-1'>Listings buyers have flagged. Removing a listing closes every open report on it; dismissing leaves the listing live.</p>

            {groups.length === 0 ? (
                <div className='flex items-center justify-center h-80'>
                    <h1 className='text-3xl text-slate-400 font-medium'>No open reports</h1>
                </div>
            ) : (
                <div className='flex flex-col gap-4 mt-6'>
                    {groups.map(({ listing, reports }) => {
                        const headId = reports[0]?.id
                        const action = pending[headId]
                        const listingHref = listing.service ? `/service/${listing.id}` : `/product/${listing.id}`
                        return (
                            <div key={listing.id} className='bg-white border border-slate-200 rounded-lg shadow-sm p-5 max-w-4xl'>
                                {/* Listing header */}
                                <div className='flex items-start gap-4 pb-4 border-b border-slate-100'>
                                    {listing.images?.[0] ? (
                                        <Image src={listing.images[0]} alt='' width={64} height={64} className='size-16 rounded-lg object-cover ring-1 ring-slate-200 shrink-0' />
                                    ) : (
                                        <div className='size-16 rounded-lg bg-slate-100 ring-1 ring-slate-200 shrink-0' />
                                    )}
                                    <div className='flex-1 min-w-0'>
                                        <p className='text-base font-semibold text-slate-900'>{listing.name}</p>
                                        {listing.store && (
                                            <p className='text-xs text-slate-500 mt-0.5'>
                                                Seller: <Link href={`/shop/${listing.store.username}`} className='text-sky-700 hover:underline'>{listing.store.name}</Link>
                                            </p>
                                        )}
                                        <Link href={listingHref} target='_blank' className='inline-flex items-center gap-1 text-xs text-sky-700 hover:underline mt-1'>
                                            View listing <ExternalLink size={11} />
                                        </Link>
                                    </div>
                                    <div className='shrink-0'>
                                        <span className='inline-flex items-center gap-1 text-xs font-semibold bg-rose-50 text-rose-700 ring-1 ring-rose-200 rounded-full px-2.5 py-0.5'>
                                            <Flag size={11} /> {reports.length} {reports.length === 1 ? 'report' : 'reports'}
                                        </span>
                                    </div>
                                </div>

                                {/* Individual reports */}
                                <ul className='divide-y divide-slate-100'>
                                    {reports.map((r) => (
                                        <li key={r.id} className='py-3 text-sm'>
                                            <div className='flex items-center gap-2 flex-wrap'>
                                                <span className='inline-flex items-center bg-rose-50 text-rose-700 ring-1 ring-rose-200 text-xs font-medium rounded-full px-2 py-0.5'>
                                                    {r.reason}
                                                </span>
                                                <span className='text-xs text-slate-400'>
                                                    by {r.reporter?.name || 'Anonymous'} · {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                                                </span>
                                            </div>
                                            {r.description && (
                                                <p className='text-sm text-slate-600 mt-1 leading-relaxed'>{r.description}</p>
                                            )}
                                        </li>
                                    ))}
                                </ul>

                                {/* Admin note + actions */}
                                <div className='mt-4 pt-4 border-t border-slate-100 space-y-3'>
                                    <textarea
                                        value={notes[headId] || ''}
                                        onChange={(e) => setNotes((n) => ({ ...n, [headId]: e.target.value }))}
                                        rows={2}
                                        placeholder='Optional admin note (private — for audit only).'
                                        className='w-full text-sm bg-slate-50 ring-1 ring-slate-200 rounded p-2 outline-none focus:ring-slate-400 transition'
                                    />
                                    <div className='flex flex-wrap gap-2 justify-end'>
                                        <button
                                            type='button'
                                            disabled={!!action}
                                            onClick={() => onResolve(reports.map(r => r.id), listing.id, 'dismiss')}
                                            className='inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white text-slate-700 ring-1 ring-slate-300 hover:ring-slate-500 rounded transition disabled:opacity-50'
                                        >
                                            <ShieldCheck size={13} /> {action === 'dismiss' ? 'Dismissing…' : 'Dismiss as false report'}
                                        </button>
                                        <button
                                            type='button'
                                            disabled={!!action}
                                            onClick={() => onResolve(reports.map(r => r.id), listing.id, 'remove-listing')}
                                            className='inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-rose-600 text-white rounded hover:bg-rose-700 disabled:opacity-50 transition'
                                        >
                                            <ShieldAlert size={13} /> {action === 'remove-listing' ? 'Removing…' : 'Remove listing'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

export default ReportsQueue
