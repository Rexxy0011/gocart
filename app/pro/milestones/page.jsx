'use client'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { Trophy, ShieldCheck } from 'lucide-react'
import MilestoneBadge, { getMilestone } from '@/components/MilestoneBadge'

const PROVIDER_STORE_ID = 'store_2'

const TIERS = [
    { min: 5,   label: '5+ jobs',   tone: 'from-orange-200 to-amber-400' },
    { min: 25,  label: '25+ jobs',  tone: 'from-slate-200 to-slate-400' },
    { min: 100, label: '100+ jobs', tone: 'from-amber-300 to-yellow-500' },
    { min: 500, label: '500+ jobs', tone: 'from-indigo-500 to-violet-600' },
]

export default function ProMilestones() {

    const allProducts = useSelector(state => state.product.list)
    const totalJobs = useMemo(() => {
        return allProducts
            .filter(p => p.storeId === PROVIDER_STORE_ID && p.service)
            .reduce((s, p) => s + (p.service?.jobsCompleted || 0), 0)
    }, [allProducts])

    const current = getMilestone(totalJobs)
    const nextTier = TIERS.find(t => t.min > totalJobs)
    const toNext = nextTier ? nextTier.min - totalJobs : 0

    return (
        <div className='text-slate-700 mb-28 max-w-4xl'>
            <div className='flex items-start gap-4 mb-8'>
                <span className='inline-flex items-center justify-center size-12 rounded-2xl bg-amber-50 ring-1 ring-amber-200 text-amber-600 shrink-0'>
                    <Trophy size={20} />
                </span>
                <div>
                    <h1 className='text-2xl text-slate-900 font-semibold'>Milestones</h1>
                    <p className='text-sm text-slate-600 mt-1'>Verified-job badges that buyers see on your listings. Each badge unlocks at the count below.</p>
                </div>
            </div>

            {/* Current state */}
            <div className='bg-gradient-to-br from-amber-50 to-yellow-50 ring-1 ring-amber-200 rounded-2xl p-5 mb-8'>
                <div className='flex items-center justify-between gap-3 flex-wrap'>
                    <div>
                        <p className='text-xs uppercase tracking-wide text-slate-500'>Current tier</p>
                        <div className='flex items-center gap-2 mt-2'>
                            {current ? (
                                <MilestoneBadge jobsCompleted={totalJobs} />
                            ) : (
                                <span className='text-sm text-slate-700'>No badge yet</span>
                            )}
                            <span className='text-sm text-slate-600'>· <span className='font-bold text-slate-900'>{totalJobs.toLocaleString()}</span> verified jobs</span>
                        </div>
                    </div>
                    {nextTier && (
                        <p className='text-xs text-slate-600'>
                            <span className='font-semibold text-slate-900'>{toNext}</span> more jobs to <span className='font-semibold'>{nextTier.label}</span>
                        </p>
                    )}
                </div>
                <div className='h-2 bg-amber-100 rounded-full mt-4 overflow-hidden'>
                    <div className='h-full bg-gradient-to-r from-amber-400 to-yellow-500' style={{ width: `${Math.min(100, (totalJobs / 500) * 100)}%` }} />
                </div>
            </div>

            {/* All tiers */}
            <h2 className='text-sm font-bold uppercase tracking-wide text-slate-500 mb-4'>All tiers</h2>
            <div className='grid sm:grid-cols-2 gap-4'>
                {TIERS.map((tier) => {
                    const earned = totalJobs >= tier.min
                    return (
                        <div key={tier.min} className={`rounded-xl p-5 ring-1 ${earned ? 'bg-white ring-slate-200' : 'bg-slate-50/50 ring-slate-200 opacity-70'}`}>
                            <div className='flex items-center gap-3'>
                                <span className={`inline-flex items-center justify-center size-10 rounded-xl text-white bg-gradient-to-br ${tier.tone}`}>
                                    <Trophy size={16} />
                                </span>
                                <div>
                                    <p className='font-semibold text-slate-900'>{tier.label}</p>
                                    <p className='text-xs text-slate-500'>
                                        {earned ? 'Unlocked' : `${(tier.min - totalJobs).toLocaleString()} more to unlock`}
                                    </p>
                                </div>
                                {earned && (
                                    <ShieldCheck size={18} className='ml-auto text-emerald-500' />
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

            <p className='text-xs text-slate-500 mt-6'>
                A &quot;verified job&quot; is one where both you and the buyer confirmed completion in the GoCart app. Self-claimed counts don&apos;t add to milestones.
            </p>
        </div>
    )
}
