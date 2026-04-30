'use client'
import { dummyStoreDashboardData } from "@/assets/assets"
import Loading from "@/components/Loading"
import VerifiedCheck from "@/components/VerifiedCheck"
import {
    ArrowUpRight, Eye, ListChecks, MessageSquareText,
    Plus, Star, TrendingUp, BarChart3, Wrench,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { useSelector } from "react-redux"

// Demo-only hook into the seller (later: from auth context)
const STORE_ID = 'store_1'

export default function Dashboard() {

    const router = useRouter()

    const [loading, setLoading] = useState(true)
    const [dashboardData, setDashboardData] = useState({
        totalProducts: 0,
        ratings: [],
    })

    const allProducts = useSelector(state => state.product.list)
    // /store is product-seller-only. Service listings are managed in /pro.
    const productListings = useMemo(
        () => allProducts.filter(p => p.storeId === STORE_ID && !p.service),
        [allProducts]
    )
    const topByViews = productListings.slice(0, 4).map((p, i) => ({
        ...p,
        viewsMock: [842, 514, 388, 271][i] ?? 200,
        inquiriesMock: [12, 7, 4, 3][i] ?? 1,
    }))

    const fetchDashboardData = async () => {
        setDashboardData(dummyStoreDashboardData)
        setLoading(false)
    }

    useEffect(() => {
        fetchDashboardData()
    }, [])

    if (loading) return <Loading />

    const sellerName = 'Great Stack'
    const isVerified = true
    const ratingCount = dashboardData.ratings.length
    const averageRating = ratingCount
        ? dashboardData.ratings.reduce((s, r) => s + r.rating, 0) / ratingCount
        : 0
    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '₦'

    const stats = [
        {
            title: 'Active listings',
            value: productListings.length,
            icon: ListChecks,
            tone: 'bg-sky-50 text-sky-600 ring-sky-200',
            trend: { dir: 'up', text: '+2 this week' },
        },
        {
            title: 'New inquiries',
            value: 0,
            icon: MessageSquareText,
            tone: 'bg-emerald-50 text-emerald-600 ring-emerald-200',
            hint: 'Last 7 days',
        },
        {
            title: 'Listing views',
            value: '1,284',
            icon: Eye,
            tone: 'bg-violet-50 text-violet-600 ring-violet-200',
            trend: { dir: 'up', text: '+12% vs last week' },
        },
        {
            title: 'Rating',
            value: averageRating ? averageRating.toFixed(1) : 'New',
            icon: Star,
            tone: 'bg-amber-50 text-amber-600 ring-amber-200',
            hint: ratingCount ? `${ratingCount} review${ratingCount === 1 ? '' : 's'}` : 'No reviews yet',
        },
    ]

    return (
        <div className="text-slate-700 mb-28 max-w-5xl">

            {/* Hero header */}
            <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-sky-50/40 ring-1 ring-slate-200 rounded-2xl p-6 sm:p-8">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="min-w-0">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Seller dashboard</p>
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1 inline-flex items-center gap-2">
                            Hi {sellerName.split(' ')[0]}
                            {isVerified && <VerifiedCheck size={20} />}
                        </h1>
                        <p className="text-sm text-slate-600 mt-1">
                            Listings, inquiries, and reviews — all in one place.
                        </p>
                    </div>
                </div>
            </section>

            {/* Stat cards */}
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
                {stats.map((card) => (
                    <div key={card.title} className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-sm transition">
                        <div className="flex items-start justify-between gap-3">
                            <span className={`inline-flex items-center justify-center size-10 rounded-xl ring-1 ${card.tone}`}>
                                <card.icon size={18} />
                            </span>
                        </div>
                        <p className="text-3xl font-bold text-slate-900 mt-4 leading-none">{card.value}</p>
                        <p className="text-sm text-slate-600 mt-1.5">{card.title}</p>
                        {card.trend ? (
                            <p className={`inline-flex items-center gap-1 text-[11px] font-medium mt-2 ${
                                card.trend.dir === 'up' ? 'text-emerald-600' : 'text-rose-600'
                            }`}>
                                {card.trend.dir === 'up' ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                                {card.trend.text}
                            </p>
                        ) : card.hint ? (
                            <p className="text-[11px] text-slate-400 mt-2">{card.hint}</p>
                        ) : null}
                    </div>
                ))}
            </section>

            {/* Listing insights — products only. Service-side metrics live in /pro. */}
            <section className="mt-8 bg-white border border-slate-200 rounded-2xl overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3 min-w-0">
                        <span className="inline-flex items-center justify-center size-9 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shrink-0">
                            <BarChart3 size={16} />
                        </span>
                        <div className="min-w-0">
                            <p className="font-semibold text-slate-900">Listing insights</p>
                            <p className="text-xs text-slate-500">Your top listings — what&apos;s pulling buyer attention.</p>
                        </div>
                    </div>
                    <Link href="/store/manage-product" className="text-xs font-semibold text-sky-700 hover:underline shrink-0">
                        See all →
                    </Link>
                </div>
                <ul className="divide-y divide-slate-100">
                    {topByViews.length === 0 ? (
                        <li className="p-8 text-center text-sm text-slate-500">No listings yet — post your first ad to see insights.</li>
                    ) : topByViews.map((p) => (
                        <li key={p.id} className="p-4 flex items-center gap-4 flex-wrap">
                            <Image
                                src={p.images[0]}
                                alt={p.name}
                                width={48}
                                height={48}
                                className="size-12 rounded-lg object-cover ring-1 ring-slate-200 shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-slate-900 line-clamp-1">{p.name}</p>
                                <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                                    <span className="inline-flex items-center gap-1"><Eye size={11} /> {p.viewsMock.toLocaleString()} views</span>
                                    <span className="inline-flex items-center gap-1"><MessageSquareText size={11} /> {p.inquiriesMock} inquiries</span>
                                </div>
                            </div>
                            <p className="text-sm font-semibold text-slate-900 shrink-0">
                                {p.free ? 'FREE' : `${currency}${(p.price ?? 0).toLocaleString()}`}
                            </p>
                            <Link
                                href={`/product/${p.id}`}
                                className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-sky-700 hover:underline"
                            >
                                Open <ArrowUpRight size={11} />
                            </Link>
                        </li>
                    ))}
                </ul>
                {/* Cross-link to /pro for users who also offer services */}
                <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-3 flex items-center justify-between gap-3 flex-wrap">
                    <p className="text-xs text-slate-500 inline-flex items-center gap-2">
                        <Wrench size={12} className="text-slate-400" />
                        Also offer a service? Manage it in your <span className="font-semibold">Provider dashboard</span>.
                    </p>
                    <Link href="/pro" className="text-xs font-semibold text-sky-700 hover:underline whitespace-nowrap">
                        Open /pro →
                    </Link>
                </div>
            </section>

            {/* Quick actions */}
            <section className="mt-8 grid sm:grid-cols-3 gap-3">
                <Link
                    href="/store/add-product"
                    className="group bg-slate-900 hover:bg-slate-800 text-white rounded-2xl p-5 flex items-start justify-between gap-3 transition"
                >
                    <div className="min-w-0">
                        <span className="inline-flex items-center justify-center size-9 rounded-xl bg-white/10 text-white">
                            <Plus size={16} />
                        </span>
                        <p className="font-semibold mt-3">Post an ad</p>
                        <p className="text-xs text-slate-300 mt-0.5">Free — buyers contact you directly.</p>
                    </div>
                    <ArrowUpRight size={18} className="opacity-60 group-hover:opacity-100 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition" />
                </Link>

                <Link
                    href="/store/manage-product"
                    className="group bg-white ring-1 ring-slate-200 hover:ring-slate-400 rounded-2xl p-5 flex items-start justify-between gap-3 transition"
                >
                    <div className="min-w-0">
                        <span className="inline-flex items-center justify-center size-9 rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200">
                            <ListChecks size={16} />
                        </span>
                        <p className="font-semibold text-slate-900 mt-3">My listings</p>
                        <p className="text-xs text-slate-500 mt-0.5">Edit, bump up, or take down.</p>
                    </div>
                    <ArrowUpRight size={18} className="text-slate-400 group-hover:text-slate-700 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition" />
                </Link>

                <Link
                    href="/store/inquiries"
                    className="group bg-white ring-1 ring-slate-200 hover:ring-slate-400 rounded-2xl p-5 flex items-start justify-between gap-3 transition"
                >
                    <div className="min-w-0">
                        <span className="inline-flex items-center justify-center size-9 rounded-xl bg-violet-50 text-violet-600 ring-1 ring-violet-200">
                            <MessageSquareText size={16} />
                        </span>
                        <p className="font-semibold text-slate-900 mt-3">Inquiries</p>
                        <p className="text-xs text-slate-500 mt-0.5">Buyer messages on your ads.</p>
                    </div>
                    <ArrowUpRight size={18} className="text-slate-400 group-hover:text-slate-700 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition" />
                </Link>
            </section>

            {/* Recent reviews */}
            <section className="mt-10">
                <div className="flex items-end justify-between mb-4">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">Recent reviews</h2>
                        <p className="text-xs text-slate-500 mt-0.5">From buyers you&apos;ve served on GoCart.</p>
                    </div>
                    {ratingCount > 0 && (
                        <p className="text-sm text-slate-500">
                            <span className="inline-flex items-center gap-1 text-amber-500 font-bold">
                                <Star size={14} className="fill-current" />
                                {averageRating.toFixed(1)}
                            </span>
                            <span className="text-slate-400 ml-1.5">({ratingCount})</span>
                        </p>
                    )}
                </div>

                {dashboardData.ratings.length === 0 ? (
                    <div className="border border-dashed border-slate-300 bg-slate-50/60 rounded-xl p-10 text-center">
                        <Star size={22} className="mx-auto text-slate-300" />
                        <p className="text-sm text-slate-500 mt-2">No reviews yet — they appear here once a buyer confirms a job.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {dashboardData.ratings.map((review, index) => (
                            <div key={index} className="bg-white border border-slate-200 rounded-xl p-5 flex max-sm:flex-col sm:items-center justify-between gap-4">
                                <div className="flex gap-3 min-w-0">
                                    <Image src={review.user.image} alt="" className="size-10 rounded-full shrink-0" width={40} height={40} />
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="font-semibold text-slate-900">{review.user.name}</p>
                                            <div className="flex items-center">
                                                {Array(5).fill('').map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        size={13}
                                                        className={i < Math.round(review.rating) ? 'text-amber-400' : 'text-slate-300'}
                                                        fill={i < Math.round(review.rating) ? 'currentColor' : 'none'}
                                                        strokeWidth={1.5}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-0.5">{new Date(review.createdAt).toDateString()}</p>
                                        <p className="text-sm text-slate-700 mt-2 max-w-xl leading-relaxed">{review.review}</p>
                                    </div>
                                </div>
                                <div className="flex sm:flex-col sm:items-end justify-between gap-3 shrink-0">
                                    <div className="text-right">
                                        <p className="text-[11px] text-slate-400 uppercase tracking-wide">{review.product?.category}</p>
                                        <p className="text-sm font-medium text-slate-700 max-w-[10rem] truncate">{review.product?.name}</p>
                                    </div>
                                    <button
                                        onClick={() => router.push(`/product/${review.product.id}`)}
                                        className="inline-flex items-center gap-1 text-xs font-semibold text-sky-700 hover:underline whitespace-nowrap"
                                    >
                                        View listing <ArrowUpRight size={12} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    )
}
