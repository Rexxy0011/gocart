import { redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import {
    ArrowUpRight, Eye, ListChecks, MessageSquareText,
    Plus, Star, TrendingUp, BarChart3, Wrench, Clock,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { createClient } from '@/lib/supabase/server'
import VerifiedCheck from '@/components/VerifiedCheck'

// Seller dashboard. Real data from Supabase: counts come from the
// products and conversations tables, the seller name comes from the
// profile, the verified state comes from email + phone confirmation.
//
// Things that are real:
//   - Active listings count
//   - Pending review count
//   - New inquiries (last 7 days)
//   - Average rating + reviews list
//   - Top listings by inquiry count
//
// Things we deliberately DON'T fake:
//   - Listing views — we don't track views yet, so the card shows "—"
//     with a "coming soon" hint instead of a fabricated number.
//   - Review counts — empty until the ratings system is wired.

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

export default async function Dashboard() {

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login?next=/store')

    // Profile + store ----------------------------------------------------
    const [{ data: profile }, { data: store }] = await Promise.all([
        supabase
            .from('profiles')
            .select('name, image')
            .eq('id', user.id)
            .maybeSingle(),
        supabase
            .from('stores')
            .select('id, name, username')
            .eq('user_id', user.id)
            .maybeSingle(),
    ])

    const sellerName = profile?.name || user.user_metadata?.name || user.email?.split('@')[0] || 'Seller'
    const emailVerified = !!user.email_confirmed_at
    const phoneVerified = !!user.phone_confirmed_at
    const isVerified = emailVerified && phoneVerified

    // No store yet → empty-state CTA. Skip all the analytics — there's
    // nothing to show.
    if (!store) {
        return (
            <div className="text-slate-700 mb-28 max-w-5xl">
                <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-sky-50/40 ring-1 ring-slate-200 rounded-2xl p-6 sm:p-8">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Seller dashboard</p>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
                        Hi {sellerName.split(' ')[0]}
                    </h1>
                    <p className="text-sm text-slate-600 mt-2 max-w-md">
                        Your shop is empty. Post your first ad — buyers reach you directly through GoCart messaging. Free, no commission on offline sales.
                    </p>
                    <Link
                        href="/store/add-product"
                        className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-full px-5 py-2.5 transition mt-6"
                    >
                        <Plus size={15} /> Post an ad
                    </Link>
                </section>
            </div>
        )
    }

    // Counts -------------------------------------------------------------
    const sevenDaysAgo = new Date(Date.now() - SEVEN_DAYS_MS).toISOString()

    const [
        activeListingsRes,
        pendingReviewRes,
        newInquiriesRes,
    ] = await Promise.all([
        supabase
            .from('products')
            .select('id', { count: 'exact', head: true })
            .eq('store_id', store.id)
            .eq('review_status', 'approved')
            .is('removed_at', null),
        supabase
            .from('products')
            .select('id', { count: 'exact', head: true })
            .eq('store_id', store.id)
            .eq('review_status', 'pending')
            .is('removed_at', null),
        supabase
            .from('conversations')
            .select('id', { count: 'exact', head: true })
            .eq('seller_id', user.id)
            .gte('created_at', sevenDaysAgo),
    ])

    const activeListings = activeListingsRes.count || 0
    const pendingReview = pendingReviewRes.count || 0
    const newInquiries = newInquiriesRes.count || 0

    // Listings + per-listing inquiry counts ------------------------------
    const { data: listings } = await supabase
        .from('products')
        .select('id, name, images, price, free, created_at')
        .eq('store_id', store.id)
        .eq('review_status', 'approved')
        .is('removed_at', null)
        .order('bumped_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
        .limit(20)

    const listingIds = (listings || []).map(l => l.id)
    const inqByListing = {}
    if (listingIds.length > 0) {
        const { data: convos } = await supabase
            .from('conversations')
            .select('listing_id')
            .in('listing_id', listingIds)
        for (const c of (convos || [])) {
            inqByListing[c.listing_id] = (inqByListing[c.listing_id] || 0) + 1
        }
    }

    const topByInquiries = (listings || [])
        .map(l => ({ ...l, inquiriesCount: inqByListing[l.id] || 0 }))
        .sort((a, b) => b.inquiriesCount - a.inquiriesCount || new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 4)

    // Reviews ------------------------------------------------------------
    // Pulls ratings whose product belongs to this store. Will be empty
    // until the ratings/jobs flow is wired — the empty state below
    // explains that to the seller.
    const { data: ratings } = await supabase
        .from('ratings')
        .select(`
            id, rating, review, created_at,
            user:profiles!ratings_user_id_fkey(name, image),
            product:products!inner(id, name, category, store_id)
        `)
        .eq('product.store_id', store.id)
        .order('created_at', { ascending: false })
        .limit(5)

    const ratingsList = ratings || []
    const ratingCount = ratingsList.length
    const averageRating = ratingCount
        ? ratingsList.reduce((s, r) => s + r.rating, 0) / ratingCount
        : 0
    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '₦'

    const stats = [
        {
            title: 'Active listings',
            value: activeListings,
            icon: ListChecks,
            tone: 'bg-sky-50 text-sky-600 ring-sky-200',
            hint: pendingReview > 0 ? `${pendingReview} pending review` : 'All live',
        },
        {
            title: 'New inquiries',
            value: newInquiries,
            icon: MessageSquareText,
            tone: 'bg-emerald-50 text-emerald-600 ring-emerald-200',
            hint: 'Last 7 days',
        },
        {
            title: 'Listing views',
            value: '—',
            icon: Eye,
            tone: 'bg-violet-50 text-violet-600 ring-violet-200',
            hint: 'View tracking — coming soon',
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
                        {card.hint && (
                            <p className="text-[11px] text-slate-400 mt-2">{card.hint}</p>
                        )}
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
                            <p className="text-xs text-slate-500">Your top listings — ranked by buyer inquiries.</p>
                        </div>
                    </div>
                    <Link href="/store/manage-product" className="text-xs font-semibold text-sky-700 hover:underline shrink-0">
                        See all →
                    </Link>
                </div>
                <ul className="divide-y divide-slate-100">
                    {topByInquiries.length === 0 ? (
                        <li className="p-8 text-center text-sm text-slate-500">
                            No live listings yet — post your first ad to see insights.
                        </li>
                    ) : topByInquiries.map((p) => {
                        const firstImage = p.images?.[0]
                        return (
                            <li key={p.id} className="p-4 flex items-center gap-4 flex-wrap">
                                {firstImage ? (
                                    <Image
                                        src={firstImage}
                                        alt={p.name}
                                        width={48}
                                        height={48}
                                        className="size-12 rounded-lg object-cover ring-1 ring-slate-200 shrink-0"
                                    />
                                ) : (
                                    <div className="size-12 rounded-lg bg-slate-100 ring-1 ring-slate-200 shrink-0" />
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-slate-900 line-clamp-1">{p.name}</p>
                                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                                        <span className="inline-flex items-center gap-1">
                                            <MessageSquareText size={11} /> {p.inquiriesCount} {p.inquiriesCount === 1 ? 'inquiry' : 'inquiries'}
                                        </span>
                                        <span className="inline-flex items-center gap-1">
                                            <Clock size={11} /> {formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}
                                        </span>
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
                        )
                    })}
                </ul>
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

                {ratingsList.length === 0 ? (
                    <div className="border border-dashed border-slate-300 bg-slate-50/60 rounded-xl p-10 text-center">
                        <Star size={22} className="mx-auto text-slate-300" />
                        <p className="text-sm text-slate-500 mt-2">No reviews yet — they appear here once a buyer confirms a job.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {ratingsList.map((review) => (
                            <div key={review.id} className="bg-white border border-slate-200 rounded-xl p-5 flex max-sm:flex-col sm:items-center justify-between gap-4">
                                <div className="flex gap-3 min-w-0">
                                    {review.user?.image ? (
                                        <Image src={review.user.image} alt="" className="size-10 rounded-full shrink-0 object-cover" width={40} height={40} />
                                    ) : (
                                        <div className="size-10 rounded-full bg-slate-200 shrink-0" />
                                    )}
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="font-semibold text-slate-900">{review.user?.name || 'Buyer'}</p>
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
                                        <p className="text-xs text-slate-500 mt-0.5">{new Date(review.created_at).toDateString()}</p>
                                        <p className="text-sm text-slate-700 mt-2 max-w-xl leading-relaxed">{review.review}</p>
                                    </div>
                                </div>
                                <div className="flex sm:flex-col sm:items-end justify-between gap-3 shrink-0">
                                    <div className="text-right">
                                        <p className="text-[11px] text-slate-400 uppercase tracking-wide">{review.product?.category}</p>
                                        <p className="text-sm font-medium text-slate-700 max-w-[10rem] truncate">{review.product?.name}</p>
                                    </div>
                                    <Link
                                        href={`/product/${review.product?.id}`}
                                        className="inline-flex items-center gap-1 text-xs font-semibold text-sky-700 hover:underline whitespace-nowrap"
                                    >
                                        View listing <ArrowUpRight size={12} />
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    )
}
