'use client'
import {
    ArrowUpRight, Bell, CalendarDays, FileText, Flame, MessageSquareText,
    Plus, Sparkles, Star, Trophy, Clock, ShieldCheck,
} from "lucide-react"
import Link from "next/link"
import { useMemo } from "react"
import { useSelector } from "react-redux"
import VerifiedTick from "@/components/VerifiedTick"
import VerifiedCheck from "@/components/VerifiedCheck"
import MilestoneBadge, { getMilestone } from "@/components/MilestoneBadge"

// Demo: scope to one provider (the plumber). Wire to logged-in provider later.
const PROVIDER_STORE_ID = 'store_2'

const MOCK_LEAD_ALERTS = [
    { id: 'l1', query: 'plumber',         area: 'Yaba, Lagos',     when: '12m ago', count: 3 },
    { id: 'l2', query: 'leak repair',     area: 'Lekki, Lagos',    when: '1h ago',  count: 1 },
    { id: 'l3', query: 'bathroom plumber',area: 'Surulere, Lagos', when: '3h ago',  count: 2 },
]

const MOCK_QUOTE_REQUESTS = [
    { id: 'q1', from: 'Adaeze N.',  brief: 'Burst pipe under kitchen sink — needs same-day fix', when: '38m ago' },
    { id: 'q2', from: 'Tobi A.',    brief: 'Full bathroom plumbing for new build — 2 bathrooms', when: '2h ago' },
]

const MOCK_UPCOMING_JOBS = [
    { id: 'j1', when: 'Tomorrow · 10:00am', who: 'Bola O.', what: 'Boiler service', area: 'Ikeja' },
    { id: 'j2', when: 'Sat · 2:00pm',       who: 'Femi K.', what: 'Drain clearance', area: 'Yaba' },
]

export default function ProviderDashboard() {

    const allProducts = useSelector(state => state.product.list)
    const providerListings = useMemo(
        () => allProducts.filter(p => p.storeId === PROVIDER_STORE_ID && p.service),
        [allProducts]
    )

    // Aggregate stats (mock derivation from service listings)
    const totalJobs = providerListings.reduce((s, p) => s + (p.service?.jobsCompleted || 0), 0)
    const ratings = providerListings.flatMap(p => p.rating || [])
    const ratingCount = ratings.length
    const avgRating = ratingCount ? ratings.reduce((s, r) => s + r.rating, 0) / ratingCount : 0
    const responseTime = providerListings[0]?.service?.responseTime || '—'

    const providerName = providerListings[0]?.store?.user?.name || 'Provider'
    const isPower = providerListings[0]?.store?.powerAccount === true
    const isVerified = providerListings[0]?.store?.status === 'approved'
    const milestone = getMilestone(totalJobs)

    const stats = [
        {
            title: 'Active services',
            value: providerListings.length,
            icon: FileText,
            tone: 'bg-sky-50 text-sky-600 ring-sky-200',
            hint: 'Live on /services',
        },
        {
            title: 'New inquiries',
            value: 0,
            icon: MessageSquareText,
            tone: 'bg-emerald-50 text-emerald-600 ring-emerald-200',
            hint: 'Last 7 days',
        },
        {
            title: 'Verified jobs',
            value: totalJobs.toLocaleString(),
            icon: ShieldCheck,
            tone: 'bg-violet-50 text-violet-600 ring-violet-200',
            hint: milestone ? milestone.label : 'No milestone yet',
        },
        {
            title: 'Rating',
            value: avgRating ? avgRating.toFixed(1) : 'New',
            icon: Star,
            tone: 'bg-amber-50 text-amber-600 ring-amber-200',
            hint: ratingCount ? `${ratingCount} review${ratingCount === 1 ? '' : 's'}` : 'No reviews yet',
        },
    ]

    return (
        <div className="text-slate-700 mb-28 max-w-5xl">

            {/* Hero header */}
            <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-emerald-50/40 ring-1 ring-slate-200 rounded-2xl p-6 sm:p-8">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="min-w-0">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Provider dashboard</p>
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1 inline-flex items-center gap-2 flex-wrap">
                            Hi {providerName.split(' ')[0]}
                            {isPower
                                ? <VerifiedTick size={20} />
                                : isVerified
                                    ? <VerifiedCheck size={18} />
                                    : null}
                            {milestone && <MilestoneBadge jobsCompleted={totalJobs} size="sm" />}
                        </h1>
                        <p className="text-sm text-slate-600 mt-1">
                            Services, inquiries, jobs and milestones — your provider hub.
                        </p>
                    </div>
                    {isPower && (
                        <div className="inline-flex items-center gap-2 bg-white ring-1 ring-sky-200 rounded-full px-3 py-1.5 shadow-sm">
                            <span className="inline-flex items-center justify-center size-5 rounded-full bg-gradient-to-br from-sky-500 to-indigo-500 text-white">
                                <Sparkles size={11} />
                            </span>
                            <span className="text-xs font-semibold text-slate-700">Power Account active</span>
                        </div>
                    )}
                </div>
            </section>

            {/* Stat cards */}
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
                {stats.map((card) => (
                    <div key={card.title} className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-sm transition">
                        <span className={`inline-flex items-center justify-center size-10 rounded-xl ring-1 ${card.tone}`}>
                            <card.icon size={18} />
                        </span>
                        <p className="text-3xl font-bold text-slate-900 mt-4 leading-none">{card.value}</p>
                        <p className="text-sm text-slate-600 mt-1.5">{card.title}</p>
                        {card.hint && <p className="text-[11px] text-slate-400 mt-2">{card.hint}</p>}
                    </div>
                ))}
            </section>

            {/* Lead alerts (Power Account perk for service providers) */}
            <section className="mt-8 bg-white border border-slate-200 rounded-2xl overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3 min-w-0">
                        <span className="inline-flex items-center justify-center size-9 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-500 text-white shrink-0">
                            <Bell size={16} />
                        </span>
                        <div className="min-w-0">
                            <p className="font-semibold text-slate-900 inline-flex items-center gap-1.5">
                                Lead alerts
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-sky-700 bg-sky-50 ring-1 ring-sky-200 px-1.5 py-0.5 rounded-full">
                                    <Sparkles size={9} /> Power
                                </span>
                            </p>
                            <p className="text-xs text-slate-500">Buyers searching for your service, before they message anyone.</p>
                        </div>
                    </div>
                </div>
                <ul className="divide-y divide-slate-100">
                    {MOCK_LEAD_ALERTS.map((lead) => (
                        <li key={lead.id} className="p-5 flex items-center gap-4 flex-wrap">
                            <span className="inline-flex items-center justify-center size-9 rounded-xl bg-rose-50 text-rose-600 ring-1 ring-rose-200 shrink-0">
                                <Flame size={15} />
                            </span>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-slate-900">
                                    <span className="font-semibold">{lead.count}</span> {lead.count === 1 ? 'buyer' : 'buyers'} searched{' '}
                                    <span className="font-semibold">&quot;{lead.query}&quot;</span> in {lead.area}
                                </p>
                                <p className="text-xs text-slate-500 mt-0.5">{lead.when}</p>
                            </div>
                            <button type="button" className="shrink-0 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-full px-4 py-2 transition">
                                Reach out
                            </button>
                        </li>
                    ))}
                </ul>
            </section>

            {/* Two-up: Quote requests + Upcoming jobs */}
            <section className="mt-8 grid lg:grid-cols-2 gap-4">
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                    <div className="p-5 border-b border-slate-100 flex items-center gap-3">
                        <span className="inline-flex items-center justify-center size-9 rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200 shrink-0">
                            <FileText size={16} />
                        </span>
                        <div className="min-w-0">
                            <p className="font-semibold text-slate-900">Quote requests</p>
                            <p className="text-xs text-slate-500">Buyers asking for a price.</p>
                        </div>
                    </div>
                    <ul className="divide-y divide-slate-100">
                        {MOCK_QUOTE_REQUESTS.map((q) => (
                            <li key={q.id} className="p-4 flex items-start gap-3">
                                <div className="size-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-semibold text-slate-600 shrink-0">
                                    {q.from.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-slate-900">{q.from}</p>
                                    <p className="text-xs text-slate-600 line-clamp-2 mt-0.5">{q.brief}</p>
                                    <p className="text-[11px] text-slate-400 mt-1">{q.when}</p>
                                </div>
                                <button className="shrink-0 text-xs font-semibold text-sky-700 hover:underline">Reply →</button>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                    <div className="p-5 border-b border-slate-100 flex items-center gap-3">
                        <span className="inline-flex items-center justify-center size-9 rounded-xl bg-violet-50 text-violet-600 ring-1 ring-violet-200 shrink-0">
                            <CalendarDays size={16} />
                        </span>
                        <div className="min-w-0">
                            <p className="font-semibold text-slate-900">Upcoming jobs</p>
                            <p className="text-xs text-slate-500">Booked through GoCart.</p>
                        </div>
                    </div>
                    <ul className="divide-y divide-slate-100">
                        {MOCK_UPCOMING_JOBS.map((j) => (
                            <li key={j.id} className="p-4 flex items-start gap-3">
                                <span className="inline-flex items-center justify-center size-8 rounded-lg bg-slate-100 text-slate-500 shrink-0">
                                    <Clock size={14} />
                                </span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-slate-900">{j.what}</p>
                                    <p className="text-xs text-slate-500 mt-0.5">{j.who} · {j.area}</p>
                                </div>
                                <p className="text-xs font-semibold text-slate-700 shrink-0 whitespace-nowrap">{j.when}</p>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>

            {/* Milestone progress + quick actions */}
            <section className="mt-8 grid lg:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-amber-50 to-yellow-50 ring-1 ring-amber-200 rounded-2xl p-5">
                    <div className="flex items-center gap-3">
                        <span className="inline-flex items-center justify-center size-10 rounded-xl bg-white text-amber-600 ring-1 ring-amber-200 shrink-0">
                            <Trophy size={18} />
                        </span>
                        <div>
                            <p className="font-semibold text-slate-900">Milestone progress</p>
                            <p className="text-xs text-slate-600">Verified jobs unlock badges that buyers see.</p>
                        </div>
                    </div>
                    <div className="mt-4">
                        <div className="flex items-baseline justify-between text-sm">
                            <span className="text-slate-700"><span className="font-bold text-slate-900">{totalJobs}</span> verified jobs</span>
                            <span className="text-slate-500 text-xs">{milestone ? `Current: ${milestone.label}` : 'Working toward 5+ jobs'}</span>
                        </div>
                        <div className="h-2 bg-amber-100 rounded-full mt-2 overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-amber-400 to-yellow-500" style={{ width: `${Math.min(100, (totalJobs / 500) * 100)}%` }} />
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-400 uppercase tracking-wide mt-2">
                            <span>5+</span><span>25+</span><span>100+</span><span>500+</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <Link href="/store/add-product" className="group bg-slate-900 hover:bg-slate-800 text-white rounded-2xl p-4 flex flex-col justify-between transition">
                        <Plus size={18} className="opacity-80" />
                        <p className="font-semibold mt-3">Add a service</p>
                        <p className="text-[11px] text-slate-300 mt-0.5">Plumbing, AC, courier…</p>
                    </Link>
                    <Link href="/pro/inquiries" className="group bg-white ring-1 ring-slate-200 hover:ring-slate-400 rounded-2xl p-4 flex flex-col justify-between transition">
                        <MessageSquareText size={18} className="text-slate-500" />
                        <p className="font-semibold text-slate-900 mt-3">Inquiries</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">Buyer messages</p>
                    </Link>
                </div>
            </section>
        </div>
    )
}
