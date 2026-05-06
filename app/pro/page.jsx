import Link from 'next/link'
import Image from 'next/image'
import {
    FileText, MessageSquareText, Star, Plus, Search,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import AvatarPrompt from '@/components/AvatarPrompt'

// Provider dashboard — real data only. Lead alerts, quote requests, and
// upcoming jobs are intentionally not here yet; those features aren't
// built. We add them back when there's something real to show.
export default async function ProviderDashboard() {

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Layout already gated on approved; double-check defensively.
    if (!user) return null

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    // Profile image — drives the AvatarPrompt (banner self-hides if set).
    const { data: profile } = await supabase
        .from('profiles')
        .select('image')
        .eq('id', user.id)
        .maybeSingle()

    // The provider's store. Used as the FK target for listings + inquiries.
    const { data: store } = await supabase
        .from('stores')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

    let listings = []
    let listingIds = []
    let newInquiriesCount = 0
    let ratings = []

    if (store) {
        // Service listings owned by this provider.
        const { data: listingRows } = await supabase
            .from('products')
            .select('id, name, review_status')
            .eq('store_id', store.id)
            .not('service', 'is', null)
            .is('removed_at', null)
        listings = listingRows || []
        listingIds = listings.map(l => l.id)

        // Conversations opened on this provider's store in the last 7 days
        // — same metric the /store dashboard uses.
        const { count } = await supabase
            .from('conversations')
            .select('id', { count: 'exact', head: true })
            .eq('seller_id', user.id)
            .gte('created_at', sevenDaysAgo)
        newInquiriesCount = count || 0

        // Ratings on this provider's listings.
        if (listingIds.length) {
            const { data: ratingRows } = await supabase
                .from('ratings')
                .select('rating')
                .in('product_id', listingIds)
            ratings = ratingRows || []
        }
    }

    // Provider name from the application (the layout already fetched it
    // but we don't pass it down here; cheap to re-query).
    const { data: app } = await supabase
        .from('provider_applications')
        .select('full_name, primary_category')
        .eq('user_id', user.id)
        .maybeSingle()
    const providerName = app?.full_name || user.email?.split('@')[0] || 'Provider'

    const ratingCount = ratings.length
    const avgRating = ratingCount ? ratings.reduce((s, r) => s + r.rating, 0) / ratingCount : 0
    const liveCount = listings.filter(l => l.review_status === 'approved').length
    const pendingCount = listings.filter(l => l.review_status === 'pending').length

    const stats = [
        {
            title: 'Active services',
            value: liveCount,
            icon: FileText,
            tone: 'bg-sky-50 text-sky-600 ring-sky-200',
            hint: pendingCount ? `${pendingCount} pending review` : 'Live on /services',
        },
        {
            title: 'New inquiries',
            value: newInquiriesCount,
            icon: MessageSquareText,
            tone: 'bg-emerald-50 text-emerald-600 ring-emerald-200',
            hint: 'Last 7 days',
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
        <div className='text-slate-700 mb-28 max-w-5xl'>

            {/* Public profile picture nudge — explicitly separate from
                the KYC selfie, which is private and purged after 30 days. */}
            <AvatarPrompt userId={user.id} currentImage={profile?.image} />

            {/* Hero */}
            <section className='relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-emerald-50/40 ring-1 ring-slate-200 rounded-2xl p-6 sm:p-8'>
                <div className='flex items-center gap-4'>
                    {/* Public profile picture (or initial fallback). Sits
                        flush against the greeting so the dashboard feels
                        personalised. Distinct from the KYC selfie. */}
                    <div className='size-14 rounded-full overflow-hidden bg-white ring-2 ring-white shadow-sm flex items-center justify-center shrink-0'>
                        {profile?.image ? (
                            <Image
                                src={profile.image}
                                alt={providerName}
                                width={56}
                                height={56}
                                className='size-full object-cover'
                            />
                        ) : (
                            <span className='text-lg font-semibold text-slate-700'>
                                {providerName.charAt(0).toUpperCase()}
                            </span>
                        )}
                    </div>
                    <div className='min-w-0 flex-1'>
                        <p className='text-xs font-medium uppercase tracking-wide text-slate-500'>Provider dashboard</p>
                        <h1 className='text-2xl sm:text-3xl font-bold text-slate-900 mt-0.5 flex items-center gap-2 flex-wrap'>
                            Hi {providerName.split(' ')[0]}
                            <span className='inline-flex items-center text-[10px] font-semibold uppercase tracking-wide bg-sky-50 text-sky-700 ring-1 ring-sky-200 rounded-full px-2 py-0.5'>
                                Verified
                            </span>
                        </h1>
                        <p className='text-sm text-slate-600 mt-1'>
                            {app?.primary_category
                                ? `Your ${app.primary_category.toLowerCase()} services hub.`
                                : 'Your provider hub.'}
                        </p>
                    </div>
                </div>
            </section>

            {/* Stats — real data, no mocks */}
            <section className='grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8'>
                {stats.map((card) => (
                    <div key={card.title} className='bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-sm transition'>
                        <span className={`inline-flex items-center justify-center size-10 rounded-xl ring-1 ${card.tone}`}>
                            <card.icon size={18} />
                        </span>
                        <p className='text-3xl font-bold text-slate-900 mt-4 leading-none'>{card.value}</p>
                        <p className='text-sm text-slate-600 mt-1.5'>{card.title}</p>
                        {card.hint && <p className='text-[11px] text-slate-400 mt-2'>{card.hint}</p>}
                    </div>
                ))}
            </section>

            {/* Quick actions */}
            <section className='grid grid-cols-2 lg:grid-cols-3 gap-3 mt-8'>
                <Link
                    href='/pro/add-service'
                    className='group bg-slate-900 hover:bg-slate-800 text-white rounded-2xl p-4 flex flex-col justify-between transition'
                >
                    <Plus size={18} className='opacity-80' />
                    <p className='font-semibold mt-3'>Add a service</p>
                    <p className='text-[11px] text-slate-300 mt-0.5'>Plumbing, AC, courier…</p>
                </Link>
                <Link
                    href='/pro/inquiries'
                    className='group bg-white ring-1 ring-slate-200 hover:ring-slate-400 rounded-2xl p-4 flex flex-col justify-between transition'
                >
                    <MessageSquareText size={18} className='text-slate-500' />
                    <p className='font-semibold text-slate-900 mt-3'>Inquiries</p>
                    <p className='text-[11px] text-slate-500 mt-0.5'>Buyer messages</p>
                </Link>
                <Link
                    href='/services'
                    className='group bg-white ring-1 ring-slate-200 hover:ring-slate-400 rounded-2xl p-4 flex flex-col justify-between transition'
                >
                    <Search size={18} className='text-slate-500' />
                    <p className='font-semibold text-slate-900 mt-3'>Browse services</p>
                    <p className='text-[11px] text-slate-500 mt-0.5'>See what other providers offer</p>
                </Link>
            </section>
        </div>
    )
}
