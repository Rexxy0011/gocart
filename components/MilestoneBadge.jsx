import { Trophy } from 'lucide-react'

const MILESTONES = [
    {
        min: 500,
        label: '500+ jobs',
        tone: 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white ring-violet-400/40',
    },
    {
        min: 100,
        label: '100+ jobs',
        tone: 'bg-gradient-to-br from-amber-300 to-yellow-500 text-yellow-950 ring-yellow-400/50',
    },
    {
        min: 25,
        label: '25+ jobs',
        tone: 'bg-gradient-to-br from-slate-200 to-slate-400 text-slate-800 ring-slate-400/50',
    },
    {
        min: 5,
        label: '5+ jobs',
        tone: 'bg-gradient-to-br from-orange-200 to-amber-400 text-orange-950 ring-amber-400/50',
    },
]

export const getMilestone = (jobsCompleted = 0) => MILESTONES.find(m => jobsCompleted >= m.min)

const MilestoneBadge = ({ jobsCompleted = 0, size = 'md', className = '' }) => {
    const tier = getMilestone(jobsCompleted)
    if (!tier) return null
    const sm = size === 'sm'
    return (
        <span
            title={`${jobsCompleted.toLocaleString()} verified jobs`}
            className={`inline-flex items-center gap-1 font-bold uppercase tracking-wide rounded-full ring-1 shadow-sm ${tier.tone} ${
                sm ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2.5 py-1'
            } ${className}`}
        >
            <Trophy size={sm ? 10 : 12} />
            {tier.label}
        </span>
    )
}

export default MilestoneBadge
