import Link from 'next/link'
import { ShieldCheck, BadgeCheck, Flag, Wallet, Rocket, UserPlus, ArrowRight } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'

// Live admin dashboard. Six cards aligned to actual daily work:
//   1. Listings under review        → /admin/approve
//   2. KYC applications pending     → /admin/providers
//   3. Reports unhandled            → /admin/reports
//   4. Boost revenue (last 30d)     → ₦ from boost_orders.status='paid'
//   5. Active boosts now            → products with any *_until > now()
//   6. New signups (last 7d)        → growth signal
//
// All counts use the service-role admin client - RLS would otherwise
// hide most of these from a session-less server component.
const formatNaira = (kobo) => `₦${Math.round((kobo || 0) / 100).toLocaleString()}`

const Card = ({ title, value, sub, href, icon: Icon, tone = 'slate' }) => {
    const tones = {
        slate:   'bg-slate-50 text-slate-600 ring-slate-200',
        amber:   'bg-amber-50 text-amber-700 ring-amber-200',
        sky:     'bg-sky-50 text-sky-700 ring-sky-200',
        rose:    'bg-rose-50 text-rose-700 ring-rose-200',
        emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    }
    const body = (
        <div className='flex items-start gap-4 bg-white ring-1 ring-slate-200 rounded-2xl p-5 hover:ring-slate-300 transition group'>
            <span className={`inline-flex items-center justify-center size-11 rounded-xl ring-1 shrink-0 ${tones[tone]}`}>
                <Icon size={18} />
            </span>
            <div className='min-w-0 flex-1'>
                <p className='text-xs font-medium uppercase tracking-wide text-slate-500'>{title}</p>
                <p className='text-2xl font-bold text-slate-900 mt-1 leading-none'>{value}</p>
                {sub && <p className='text-xs text-slate-500 mt-1.5'>{sub}</p>}
            </div>
            {href && (
                <ArrowRight size={16} className='text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition' />
            )}
        </div>
    )
    return href ? <Link href={href}>{body}</Link> : body
}

const AdminDashboardView = async () => {

    const admin = createAdminClient()
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const sevenDaysAgo  = new Date(now.getTime() -  7 * 24 * 60 * 60 * 1000).toISOString()
    const nowIso = now.toISOString()

    // Run independent counts in parallel - the dashboard's blocking on
    // the slowest of these otherwise.
    const [
        pendingListings,
        pendingProviders,
        openReports,
        paidBoosts,
        activeBoosts,
        newSignups,
    ] = await Promise.all([
        admin.from('products').select('id', { count: 'exact', head: true })
            .eq('review_status', 'pending').is('removed_at', null),
        admin.from('provider_applications').select('id', { count: 'exact', head: true })
            .eq('status', 'pending'),
        admin.from('reports').select('id', { count: 'exact', head: true })
            .eq('status', 'open'),
        admin.from('boost_orders').select('amount_kobo')
            .eq('status', 'paid').gte('paid_at', thirtyDaysAgo),
        admin.from('products').select('id', { count: 'exact', head: true })
            .or(`featured_until.gt.${nowIso},urgent_until.gt.${nowIso},bulk_sale_until.gt.${nowIso},bumped_until.gt.${nowIso}`),
        admin.from('profiles').select('id', { count: 'exact', head: true })
            .gte('created_at', sevenDaysAgo),
    ])

    const boostRevenueKobo = (paidBoosts.data || []).reduce((sum, o) => sum + (o.amount_kobo || 0), 0)

    return (
        <div className='text-slate-700'>
            <div>
                <h1 className='text-2xl text-slate-500'>Admin <span className='text-slate-800 font-medium'>Dashboard</span></h1>
                <p className='text-sm text-slate-500 mt-1'>Things you should look at today.</p>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6 max-w-5xl'>
                <Card
                    title='Listings under review'
                    value={pendingListings.count ?? 0}
                    sub='Tap to clear the queue'
                    href='/admin/approve'
                    icon={ShieldCheck}
                    tone='amber'
                />
                <Card
                    title='KYC applications'
                    value={pendingProviders.count ?? 0}
                    sub='Provider verifications waiting'
                    href='/admin/providers'
                    icon={BadgeCheck}
                    tone='sky'
                />
                <Card
                    title='Open reports'
                    value={openReports.count ?? 0}
                    sub='User-flagged listings'
                    href='/admin/reports'
                    icon={Flag}
                    tone='rose'
                />
                <Card
                    title='Boost revenue (30d)'
                    value={formatNaira(boostRevenueKobo)}
                    sub={`${(paidBoosts.data || []).length} paid orders`}
                    icon={Wallet}
                    tone='emerald'
                />
                <Card
                    title='Active boosts'
                    value={activeBoosts.count ?? 0}
                    sub='Listings currently boosted'
                    icon={Rocket}
                    tone='sky'
                />
                <Card
                    title='New signups (7d)'
                    value={newSignups.count ?? 0}
                    sub='Growth signal'
                    icon={UserPlus}
                    tone='slate'
                />
            </div>
        </div>
    )
}

export default AdminDashboardView
