'use client'
import Link from 'next/link'
import {
    BarChart3, BellRing, Boxes, Building2, Check, Crown,
    Megaphone, MessageSquareText, Rocket, ShieldCheck, Sparkles, Trophy, X, Zap,
} from 'lucide-react'
import VerifiedTick from '@/components/VerifiedTick'

const POWER_PERKS = [
    {
        Icon: ShieldCheck,
        accent: 'bg-emerald-50 text-emerald-600 ring-emerald-200',
        title: 'Verified Power Seller badge',
        body: 'The green Power tick buyers trust. Shown next to your name on every listing, card, and search result.',
    },
    {
        Icon: Rocket,
        accent: 'bg-orange-50 text-orange-600 ring-orange-200',
        title: 'Featured placement (automatic)',
        body: "When you're on Power Account, your listings carry the Featured ribbon and always sit above free listings on the home page, in /shop, and in search results.",
    },
    {
        Icon: Zap,
        accent: 'bg-rose-50 text-rose-600 ring-rose-200',
        title: 'Sell quicker toolkit',
        body: 'Three tools to push a listing harder when you need to: the Urgent tag, the Bulk-sale type (group multiple items into one ad — the relocator special), and the one-tap Bump up to push a sunken listing back to the top.',
    },
    {
        Icon: Trophy,
        accent: 'bg-yellow-50 text-yellow-700 ring-yellow-200',
        title: 'Service-provider milestone badges',
        body: '5 / 25 / 100 / 500 jobs completed badges. Built from real GoCart-tracked job confirmations — not fake counts.',
    },
    {
        Icon: BellRing,
        accent: 'bg-violet-50 text-violet-600 ring-violet-200',
        title: 'Lead alerts',
        body: 'Get notified the moment a buyer in your area searches your category. Reach out before competitors do.',
    },
    {
        Icon: Sparkles,
        accent: 'bg-pink-50 text-pink-600 ring-pink-200',
        title: 'Branded storefront',
        body: 'Customise your /shop page — cover image, brand colour, hours, gallery. Look like a real business.',
    },
    {
        Icon: BarChart3,
        accent: 'bg-indigo-50 text-indigo-600 ring-indigo-200',
        title: 'Analytics dashboard',
        body: 'See views, message clicks, conversion rate, and where you rank for your category. Know what works.',
    },
]

const FREE_FEATURES = [
    { ok: true,  text: 'Unlimited basic listings' },
    { ok: true,  text: 'Up to 4 photos per listing' },
    { ok: true,  text: 'In-app messaging with buyers' },
    { ok: true,  text: 'Standard search placement' },
    { ok: false, text: 'Verified Power Seller badge' },
    { ok: false, text: 'Featured ribbon (auto top-of-results)' },
    { ok: false, text: 'Sell quicker toolkit (Urgent, Bulk, Bump up)' },
    { ok: false, text: 'Branded storefront' },
    { ok: false, text: 'Lead alerts & analytics' },
]

const POWER_FEATURES = [
    { text: 'Everything in Free, plus:' },
    { ok: true, text: 'Verified Power Seller badge' },
    { ok: true, text: 'Featured ribbon — automatic top placement on every browse' },
    { ok: true, text: 'Sell quicker toolkit: Urgent tag, Bulk sale, Bump up' },
    { ok: true, text: 'Service-provider milestone badges' },
    { ok: true, text: 'Lead alerts in your category' },
    { ok: true, text: 'Branded storefront customisation' },
    { ok: true, text: 'Analytics dashboard' },
    { ok: true, text: 'Up to 12 photos per listing' },
    { ok: true, text: 'Priority support' },
]

const AUDIENCES = [
    {
        Icon: Boxes,
        title: 'Relocators & estate sales',
        body: 'Leaving the country, downsizing, or clearing out a flat? List the whole property as one bulk sale, attach an urgency countdown, and let GoCart push it to the top.',
    },
    {
        Icon: Megaphone,
        title: 'Service providers',
        body: 'Plumbers, mechanics, AC engineers, couriers — get the verified tick, milestone badges, and lead alerts so buyers find you first.',
    },
    {
        Icon: MessageSquareText,
        title: 'Active sellers',
        body: 'If you list more than a few items a month, the Featured slot pays for itself. Bump up dormant listings, run with the urgency tag, and stand out.',
    },
]

export default function PricingPage() {

    const monthly = 4500 // ₦ — placeholder until backend pricing is wired

    return (
        <div className='bg-slate-50'>
            <div className='max-w-6xl mx-auto px-6 py-16'>

                {/* Hero */}
                <div className='text-center max-w-2xl mx-auto'>
                    <span className='inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-700 bg-emerald-50 ring-1 ring-emerald-200 px-3 py-1 rounded-full'>
                        <Crown size={13} /> Power Account
                    </span>
                    <h1 className='text-3xl sm:text-5xl font-bold text-slate-900 mt-5 leading-tight'>
                        A few extras for sellers <br className='hidden sm:block' />who want to stand out.
                    </h1>
                    <p className='text-base text-slate-600 mt-4'>
                        The green Power tick, top-of-search placement, urgency tags, and milestone badges — optional tools for when you&apos;re ready to push harder.
                    </p>
                </div>

                {/* Tier comparison */}
                <div className='grid md:grid-cols-2 gap-5 mt-12'>
                    {/* Free tier */}
                    <div className='bg-white rounded-2xl ring-1 ring-slate-200 p-7'>
                        <p className='text-sm font-semibold uppercase tracking-wide text-slate-500'>Free</p>
                        <p className='text-3xl font-bold text-slate-900 mt-2'>₦0<span className='text-sm font-medium text-slate-500'> / forever</span></p>
                        <p className='text-sm text-slate-600 mt-2'>List on GoCart and connect with buyers. No fees, no commissions on offline sales.</p>

                        <ul className='space-y-3 mt-6'>
                            {FREE_FEATURES.map(({ ok, text }) => (
                                <li key={text} className='flex items-start gap-2 text-sm'>
                                    {ok ? (
                                        <Check size={16} className='text-emerald-600 mt-0.5 shrink-0' />
                                    ) : (
                                        <X size={16} className='text-slate-300 mt-0.5 shrink-0' />
                                    )}
                                    <span className={ok ? 'text-slate-700' : 'text-slate-400 line-through'}>{text}</span>
                                </li>
                            ))}
                        </ul>

                        <button
                            type='button'
                            className='mt-7 w-full text-sm font-medium text-slate-700 ring-1 ring-slate-200 hover:ring-slate-400 rounded-full py-2.5 transition'
                            disabled
                        >
                            Your current plan
                        </button>
                    </div>

                    {/* Power tier */}
                    <div className='relative bg-white rounded-2xl ring-2 ring-emerald-500 p-7 shadow-lg shadow-emerald-500/10'>
                        <p className='inline-flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-emerald-700'>
                            Power Account <VerifiedTick size={14} />
                        </p>
                        <p className='text-3xl font-bold text-slate-900 mt-2'>
                            ₦{monthly.toLocaleString()}
                            <span className='text-sm font-medium text-slate-500'> / month</span>
                        </p>
                        <p className='text-sm text-slate-600 mt-2'>
                            For sellers, service providers, and relocators who want to stand out.
                        </p>

                        <ul className='space-y-3 mt-6'>
                            {POWER_FEATURES.map(({ ok, text }, i) => (
                                <li key={text} className={`flex items-start gap-2 text-sm ${i === 0 ? 'font-semibold text-slate-900' : ''}`}>
                                    {ok && <Check size={16} className='text-emerald-600 mt-0.5 shrink-0' />}
                                    <span className={ok ? 'text-slate-700' : ''}>{text}</span>
                                </li>
                            ))}
                        </ul>

                        <button
                            type='button'
                            className='mt-7 w-full bg-slate-900 hover:bg-slate-800 text-white text-base font-semibold rounded-full py-3 transition'
                        >
                            Upgrade to Power Account
                        </button>
                        <p className='text-[11px] text-slate-500 text-center mt-2'>Cancel any time. Annual plan saves 20%.</p>
                    </div>
                </div>

                {/* Power perks deep-dive */}
                <section className='mt-20'>
                    <div className='text-center max-w-2xl mx-auto'>
                        <h2 className='text-2xl sm:text-3xl font-bold text-slate-900'>Everything you get with Power Account</h2>
                        <p className='text-sm text-slate-600 mt-2'>
                            Not just a badge — a stack of features that compound to push your listings to the front.
                        </p>
                    </div>

                    <div className='grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-10'>
                        {POWER_PERKS.map(({ Icon, accent, title, body }) => (
                            <div key={title} className='bg-white rounded-xl ring-1 ring-slate-200 p-5'>
                                <span className={`inline-flex items-center justify-center size-10 rounded-full ring-1 ${accent}`}>
                                    <Icon size={18} />
                                </span>
                                <p className='font-semibold text-slate-900 mt-4'>{title}</p>
                                <p className='text-sm text-slate-600 mt-1.5 leading-relaxed'>{body}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Audiences */}
                <section className='mt-20'>
                    <div className='text-center max-w-2xl mx-auto'>
                        <h2 className='text-2xl sm:text-3xl font-bold text-slate-900'>Built for the people who need GoCart most</h2>
                    </div>

                    <div className='grid md:grid-cols-3 gap-4 mt-8'>
                        {AUDIENCES.map(({ Icon, title, body }) => (
                            <div key={title} className='bg-white rounded-xl ring-1 ring-slate-200 p-6'>
                                <span className='inline-flex items-center justify-center size-10 rounded-lg bg-slate-900 text-white'>
                                    <Icon size={18} />
                                </span>
                                <p className='font-semibold text-slate-900 mt-4'>{title}</p>
                                <p className='text-sm text-slate-600 mt-2 leading-relaxed'>{body}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Brands footer link */}
                <section className='mt-20 flex items-center justify-center gap-3 text-sm text-slate-600'>
                    <Building2 size={16} className='text-slate-400' />
                    <span>Are you a brand (Nike, Samsung, etc.) wanting to sell through GoCart?</span>
                    <Link href='/business' className='text-sky-700 font-medium hover:underline'>Talk to sales →</Link>
                </section>
            </div>
        </div>
    )
}
