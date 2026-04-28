'use client'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { ShieldCheck, Hourglass, Info } from 'lucide-react'
import JobConfirmCard from '@/components/pro/JobConfirmCard'
import { getJobStatus } from '@/lib/features/jobs/jobsSlice'

const PROVIDER_STORE_ID = 'store_2'

// Order: jobs that need YOUR action first, then waiting-on-buyer, then verified.
const STATUS_RANK = {
    buyer_confirmed: 0,
    awaiting_both:   1,
    provider_confirmed: 2,
    verified: 3,
}

export default function ProJobs() {

    const allJobs = useSelector(state => state.jobs.list)
    const myJobs = useMemo(
        () => allJobs.filter(j => j.providerStoreId === PROVIDER_STORE_ID),
        [allJobs]
    )

    const sortedJobs = useMemo(() => {
        return [...myJobs].sort((a, b) => {
            const rank = STATUS_RANK[getJobStatus(a)] - STATUS_RANK[getJobStatus(b)]
            if (rank !== 0) return rank
            return new Date(b.lastMessageAt) - new Date(a.lastMessageAt)
        })
    }, [myJobs])

    const counts = useMemo(() => {
        const c = { actionNeeded: 0, pending: 0, verified: 0 }
        for (const j of myJobs) {
            const s = getJobStatus(j)
            if (s === 'awaiting_both' || s === 'buyer_confirmed') c.actionNeeded++
            else if (s === 'provider_confirmed') c.pending++
            else if (s === 'verified') c.verified++
        }
        return c
    }, [myJobs])

    return (
        <div className='text-slate-700 mb-28 max-w-4xl'>
            <div className='flex items-start gap-4 mb-6'>
                <span className='inline-flex items-center justify-center size-12 rounded-2xl bg-emerald-50 ring-1 ring-emerald-200 text-emerald-600 shrink-0'>
                    <ShieldCheck size={20} />
                </span>
                <div>
                    <h1 className='text-2xl text-slate-900 font-semibold'>Jobs</h1>
                    <p className='text-sm text-slate-600 mt-1'>
                        Confirm completed jobs so they count toward your milestones. Both you and the buyer must say yes.
                    </p>
                </div>
            </div>

            {/* How it works hint */}
            <div className='bg-slate-50 ring-1 ring-slate-200 rounded-xl p-4 flex items-start gap-3 mb-6'>
                <Info size={16} className='text-slate-500 mt-0.5 shrink-0' />
                <p className='text-sm text-slate-600'>
                    <span className='font-semibold text-slate-900'>How it works:</span>{' '}
                    Once a chat with a buyer goes quiet, we ping you both around the 48-hour mark. Confirm the job got done, and once the buyer confirms too it&apos;s a verified job — counts toward your badge tier and unlocks the buyer&apos;s review.
                </p>
            </div>

            {/* Stat strip */}
            <div className='grid grid-cols-3 gap-3 mb-6'>
                <div className='bg-white ring-1 ring-slate-200 rounded-xl p-4'>
                    <div className='inline-flex items-center justify-center size-9 rounded-xl bg-sky-50 text-sky-600 ring-1 ring-sky-200'>
                        <Hourglass size={15} />
                    </div>
                    <p className='text-2xl font-bold text-slate-900 mt-3 leading-none'>{counts.actionNeeded}</p>
                    <p className='text-xs text-slate-500 mt-1'>Need your confirm</p>
                </div>
                <div className='bg-white ring-1 ring-slate-200 rounded-xl p-4'>
                    <div className='inline-flex items-center justify-center size-9 rounded-xl bg-amber-50 text-amber-600 ring-1 ring-amber-200'>
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
            {sortedJobs.length === 0 ? (
                <div className='border border-dashed border-slate-300 rounded-xl p-10 text-center bg-slate-50/60'>
                    <ShieldCheck size={22} className='mx-auto text-slate-300' />
                    <p className='text-sm text-slate-500 mt-2'>
                        No jobs yet — once buyers message you and the chat goes quiet, completed jobs land here.
                    </p>
                </div>
            ) : (
                <div className='space-y-4'>
                    {sortedJobs.map(job => (
                        <JobConfirmCard key={job.id} job={job} />
                    ))}
                </div>
            )}
        </div>
    )
}
