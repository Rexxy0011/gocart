import Link from 'next/link'
import { ShieldCheck, Hourglass, Info, ChevronRight, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

// Provider's jobs overview - real `deals` rows where this provider is the
// seller. Confirmation itself happens in the message thread (DealBanner);
// this page is the at-a-glance list + a jump-off into each thread.
//
// Status from the provider's perspective:
//   pending_seller → the buyer marked done - YOUR confirm is needed
//   open           → in progress, neither side has marked
//   pending_buyer  → you marked done, waiting on the buyer
//   verified       → both confirmed
//   disputed       → one side declined

const STATUS_META = {
    pending_seller: { label: 'Confirm this job', rank: 0, tone: 'bg-amber-50 text-amber-700 ring-amber-200' },
    open:           { label: 'In progress',      rank: 1, tone: 'bg-slate-50 text-slate-600 ring-slate-200' },
    pending_buyer:  { label: 'Waiting on buyer',  rank: 2, tone: 'bg-sky-50 text-sky-700 ring-sky-200' },
    verified:       { label: 'Verified',          rank: 3, tone: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
    disputed:       { label: 'Disputed',          rank: 4, tone: 'bg-rose-50 text-rose-700 ring-rose-200' },
}

export default async function ProJobs() {

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: dealRows } = await supabase
        .from('deals')
        .select(`
            id, status, conversation_id, verified_at, updated_at,
            listing:products!deals_listing_id_fkey(id, name),
            buyer:profiles!deals_buyer_id_fkey(id, name)
        `)
        .eq('seller_id', user.id)
        .order('updated_at', { ascending: false })

    const deals = dealRows || []

    // Action-needed first, then by recency within each status.
    const sorted = [...deals].sort((a, b) => {
        const ra = STATUS_META[a.status]?.rank ?? 9
        const rb = STATUS_META[b.status]?.rank ?? 9
        return ra - rb
    })

    const counts = {
        actionNeeded: deals.filter(d => d.status === 'pending_seller').length,
        pending:      deals.filter(d => d.status === 'pending_buyer').length,
        verified:     deals.filter(d => d.status === 'verified').length,
    }

    return (
        <div className='text-slate-700 mb-28 max-w-4xl'>
            <div className='flex items-start gap-4 mb-6'>
                <span className='inline-flex items-center justify-center size-12 rounded-2xl bg-emerald-50 ring-1 ring-emerald-200 text-emerald-600 shrink-0'>
                    <ShieldCheck size={20} />
                </span>
                <div>
                    <h1 className='text-2xl text-slate-900 font-semibold'>Jobs</h1>
                    <p className='text-sm text-slate-600 mt-1'>
                        Every buyer conversation is a job. Confirm completed ones in the chat - both sides must agree before it counts.
                    </p>
                </div>
            </div>

            {/* How it works hint */}
            <div className='bg-slate-50 ring-1 ring-slate-200 rounded-xl p-4 flex items-start gap-3 mb-6'>
                <Info size={16} className='text-slate-500 mt-0.5 shrink-0' />
                <p className='text-sm text-slate-600'>
                    <span className='font-semibold text-slate-900'>How it works:</span>{' '}
                    Open a job to confirm it in the chat. Once both you and the buyer confirm, it&apos;s a verified job - it counts toward your milestone badge and unlocks the buyer&apos;s review.
                </p>
            </div>

            {/* Stat strip */}
            <div className='grid grid-cols-3 gap-3 mb-6'>
                <div className='bg-white ring-1 ring-slate-200 rounded-xl p-4'>
                    <div className='inline-flex items-center justify-center size-9 rounded-xl bg-amber-50 text-amber-600 ring-1 ring-amber-200'>
                        <Hourglass size={15} />
                    </div>
                    <p className='text-2xl font-bold text-slate-900 mt-3 leading-none'>{counts.actionNeeded}</p>
                    <p className='text-xs text-slate-500 mt-1'>Need your confirm</p>
                </div>
                <div className='bg-white ring-1 ring-slate-200 rounded-xl p-4'>
                    <div className='inline-flex items-center justify-center size-9 rounded-xl bg-sky-50 text-sky-600 ring-1 ring-sky-200'>
                        <Hourglass size={15} />
                    </div>
                    <p className='text-2xl font-bold text-slate-900 mt-3 leading-none'>{counts.pending}</p>
                    <p className='text-xs text-slate-500 mt-1'>Waiting on buyer</p>
                </div>
                <div className='bg-white ring-1 ring-slate-200 rounded-xl p-4'>
                    <div className='inline-flex items-center justify-center size-9 rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200'>
                        <ShieldCheck size={15} />
                    </div>
                    <p className='text-2xl font-bold text-slate-900 mt-3 leading-none'>{counts.verified}</p>
                    <p className='text-xs text-slate-500 mt-1'>Verified</p>
                </div>
            </div>

            {/* Jobs list */}
            {sorted.length === 0 ? (
                <div className='border border-dashed border-slate-300 rounded-xl p-10 text-center bg-slate-50/60'>
                    <ShieldCheck size={22} className='mx-auto text-slate-300' />
                    <p className='text-sm text-slate-500 mt-2'>
                        No jobs yet - once buyers message you about a service, those conversations show up here as jobs.
                    </p>
                </div>
            ) : (
                <div className='space-y-3'>
                    {sorted.map(deal => {
                        const meta = STATUS_META[deal.status] || STATUS_META.open
                        const needsAction = deal.status === 'pending_seller'
                        return (
                            <Link
                                key={deal.id}
                                href={`/messages/${deal.conversation_id}`}
                                className='flex items-center gap-4 bg-white ring-1 ring-slate-200 hover:ring-slate-400 rounded-xl p-4 transition'
                            >
                                <span className={`inline-flex items-center justify-center size-10 rounded-xl ring-1 shrink-0 ${meta.tone}`}>
                                    {needsAction ? <AlertCircle size={16} /> : <ShieldCheck size={16} />}
                                </span>
                                <div className='flex-1 min-w-0'>
                                    <p className='text-sm font-semibold text-slate-900 truncate'>
                                        {deal.listing?.name || 'Service'}
                                    </p>
                                    <p className='text-xs text-slate-500 mt-0.5 truncate'>
                                        with {deal.buyer?.name || 'a buyer'}
                                    </p>
                                </div>
                                <span className={`shrink-0 text-xs font-semibold rounded-full px-2.5 py-1 ring-1 ${meta.tone}`}>
                                    {meta.label}
                                </span>
                                <ChevronRight size={16} className='text-slate-300 shrink-0' />
                            </Link>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
