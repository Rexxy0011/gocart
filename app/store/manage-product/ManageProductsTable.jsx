'use client'
import { useEffect, useState } from "react"
import { toast } from "react-hot-toast"
import Image from "next/image"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Rocket, Plus, X, Crown, Flame, Boxes, ArrowUp } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { createClient } from "@/lib/supabase/client"
import { initBoostPayment } from "@/app/actions/boosts"

// Compact countdown for table cells. >24h → "5d", >1h → "8h", else "<1h".
const fmtLeft = (until) => {
    if (!until) return null
    const ms = new Date(until).getTime() - Date.now()
    if (ms <= 0) return null
    const hours = Math.floor(ms / 3_600_000)
    if (hours >= 24) return `${Math.floor(hours / 24)}d left`
    if (hours >= 1) return `${hours}h left`
    return '<1h left'
}

// Active boosts on a row, rendered as stacked pills. Visibility is derived
// purely from the *_until timestamps - fmtLeft() returns null for a null or
// past stamp, so a boost is "on" exactly when its *_until is in the future.
// The legacy boolean columns aren't consulted (the cron sweeper may not
// have flipped a stale one yet).
const BoostBadges = ({ product }) => {
    const featuredLeft = fmtLeft(product.featured_until)
    const urgentLeft   = fmtLeft(product.urgent_until)
    const bulkLeft     = fmtLeft(product.bulk_sale_until)
    const bumpLeft     = fmtLeft(product.bumped_until)

    if (!featuredLeft && !urgentLeft && !bulkLeft && !bumpLeft) {
        return <span className='text-slate-300 text-xs'>-</span>
    }

    const pill = 'inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ring-1 whitespace-nowrap'
    return (
        <div className='flex flex-col items-start gap-1'>
            {featuredLeft && (
                <span className={`${pill} text-sky-800 bg-sky-50 ring-sky-200`}>
                    <Crown size={10} /> Featured · {featuredLeft}
                </span>
            )}
            {urgentLeft && (
                <span className={`${pill} text-yellow-800 bg-yellow-50 ring-yellow-200`}>
                    <Flame size={10} /> Urgent · {urgentLeft}
                </span>
            )}
            {bulkLeft && (
                <span className={`${pill} text-amber-800 bg-amber-50 ring-amber-200`}>
                    <Boxes size={10} /> Bulk · {bulkLeft}
                </span>
            )}
            {bumpLeft && (
                <span className={`${pill} text-slate-700 bg-slate-50 ring-slate-200`}>
                    <ArrowUp size={10} /> Bumped · {bumpLeft}
                </span>
            )}
        </div>
    )
}

// Resolves the listing's overall boost state for the action button:
//   - 'idle'     → no active boost; allow Boost
//   - 'locked'   → boosted with >24h to expiry; button disabled (one-at-a-time)
//   - 'renewable'→ boosted with ≤24h to expiry; allow Renew (matches the
//                  reminder mail window)
const RENEW_WINDOW_MS = 24 * 60 * 60 * 1000
const boostState = (p) => {
    const candidates = [p.featured_until, p.urgent_until, p.bulk_sale_until, p.bumped_until]
        .filter(Boolean)
        .map(t => new Date(t).getTime())
        .filter(t => t > Date.now())
    if (!candidates.length) return 'idle'
    const max = Math.max(...candidates)
    return max > Date.now() + RENEW_WINDOW_MS ? 'locked' : 'renewable'
}

// Returns { label, until } for the longest-remaining active boost on a row,
// or null if none. Used to build the "you're about to sell a boosted
// listing" confirmation copy.
const primaryActiveBoost = (p) => {
    const all = [
        { until: p.featured_until,  label: 'Featured' },
        { until: p.urgent_until,    label: 'Urgent' },
        { until: p.bulk_sale_until, label: 'Bulk sale' },
        { until: p.bumped_until,    label: 'Bump' },
    ]
    const active = all
        .filter(b => b.until && new Date(b.until).getTime() > Date.now())
        .sort((a, b) => new Date(b.until).getTime() - new Date(a.until).getTime())
    return active[0] || null
}

// Each entry maps to a key in BOOST_CATALOG (lib/boosts.js) - keep in sync.
const BOOSTS = [
    { key: 'bump',      label: 'Bump up',         price: 1500, duration: '7 days',  why: 'Auto-pushes your listing to the top of the feed once a day.' },
    { key: 'featured',  label: 'Featured ribbon', price: 3000, duration: '7 days',  why: 'Locks your listing at the top of its category and location.' },
    { key: 'urgent',    label: 'Urgent tag',      price: 2000, duration: '7 days',  why: 'Yellow Urgent badge - pulls attention for time-sensitive sales.' },
    { key: 'bulk_sale', label: 'Bulk sale',       price: 4000, duration: '14 days', why: 'Multi-item ad format - perfect for relocators and clear-outs.' },
    { key: 'bundle',    label: 'Boost bundle',    price: 5500, duration: '14 days', why: 'Featured + Urgent + 3 daily Bumps. Best value if you must sell.' },
]

const BOOST_RESULT_TOASTS = {
    ok:               { type: 'success', text: 'Boost applied - your listing is live and pushed to top.' },
    failed:           { type: 'error',   text: 'Payment failed - try again or contact support.' },
    abandoned:        { type: 'error',   text: 'Payment abandoned - boost not applied.' },
    'verify-failed':  { type: 'error',   text: 'Could not verify payment. Try again.' },
    'apply-failed':   { type: 'error',   text: 'Payment went through but boost failed to apply - support is on it.' },
    mismatch:         { type: 'error',   text: 'Payment amount mismatched - please reach out to support.' },
    missing:          { type: 'error',   text: 'Payment reference missing.' },
    unknown:          { type: 'error',   text: 'Payment reference not recognised.' },
}

const ManageProductsTable = ({ products: initialProducts, hasStore }) => {

    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '₦'
    const router = useRouter()
    const searchParams = useSearchParams()
    const supabase = createClient()
    const [products, setProducts] = useState(initialProducts)
    // Holds { productId, boostKey } during the brief window between clicking
    // a boost option and the browser actually leaving for Paystack. Lets us
    // disable the modal and show a "Redirecting…" hint.
    const [paying, setPaying] = useState(null)
    // ID of the product whose boost-picker modal is open, or null.
    const [pickerFor, setPickerFor] = useState(null)

    // Surface the result of a Paystack callback round-trip via ?boost=...
    // Strip the query param after toasting so a refresh doesn't re-fire.
    useEffect(() => {
        const boostParam = searchParams.get('boost')
        if (!boostParam) return
        const config = BOOST_RESULT_TOASTS[boostParam]
        if (config?.type === 'success') toast.success(config.text)
        else if (config) toast.error(config.text)
        router.replace('/store/manage-product', { scroll: false })
    }, [searchParams, router])

    const onPickBoost = async (productId, boostKey) => {
        setPaying({ productId, boostKey })
        // Server action returns Paystack's authorization URL - we navigate
        // the browser there ourselves. Cross-origin redirect() from a server
        // action is unreliable in Next 15, so the client handles it.
        try {
            const result = await initBoostPayment({ listingId: productId, boostKey })
            if (result?.error) {
                toast.error(result.error)
                setPaying(null)
                return
            }
            if (result?.url) {
                window.location.assign(result.url)
                return
            }
            toast.error('Could not start payment.')
            setPaying(null)
        } catch (err) {
            toast.error(err?.message || 'Could not start payment.')
            setPaying(null)
        }
    }

    const toggleStock = async (productId, current) => {
        const next = !current
        // Soft guard: marking a boosted listing sold doesn't refund the
        // boost, so warn the seller before we flip in-stock off. Going
        // back IN stock never asks - that's always fine.
        if (current && !next) {
            const product = products.find(p => p.id === productId)
            const active = product && primaryActiveBoost(product)
            if (active) {
                const left = fmtLeft(active.until)
                const desc = left ? `${active.label} · ${left}` : active.label
                const ok = window.confirm(
                    `This listing is currently boosted (${desc}). ` +
                    `Marking it sold won't refund the boost - continue?`
                )
                if (!ok) return
            }
        }
        // Optimistic update
        setProducts((ps) => ps.map(p => p.id === productId ? { ...p, in_stock: next } : p))
        const { error } = await supabase
            .from('products')
            .update({ in_stock: next })
            .eq('id', productId)
        if (error) {
            toast.error(error.message)
            setProducts((ps) => ps.map(p => p.id === productId ? { ...p, in_stock: current } : p))
        }
    }

    const cheapest = BOOSTS.reduce((m, b) => Math.min(m, b.price), Infinity)

    // Maps review_status → pill style. Pending listings get a soft pulsing
    // dot to signal "in motion" rather than just sitting there.
    const statusBadge = (status) => {
        if (status === 'rejected') return { label: 'Rejected',     cls: 'bg-rose-50 text-rose-700 ring-rose-200',       pulse: false }
        if (status === 'pending')  return { label: 'Under review', cls: 'bg-amber-50 text-amber-800 ring-amber-200',    pulse: true  }
        return                            { label: 'Live',         cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200', pulse: false }
    }

    return (
        <>
            <div className='flex flex-wrap items-start justify-between gap-3 mb-5'>
                <h1 className="text-2xl text-slate-500">
                    Manage <span className="text-slate-800 font-medium">Listings</span>
                </h1>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-50 ring-1 ring-slate-200 px-3 py-1 rounded-full">
                    <Rocket size={12} className='text-sky-600' /> Boosts from ₦{cheapest.toLocaleString()}
                </span>
            </div>

            {products.length === 0 ? (
                <div className='border border-dashed border-slate-300 rounded-xl p-10 text-center bg-slate-50/60 max-w-3xl'>
                    <span className='inline-flex items-center justify-center size-14 rounded-full bg-white ring-1 ring-slate-200 text-slate-400'>
                        <Plus size={22} />
                    </span>
                    <h2 className='text-lg font-semibold text-slate-900 mt-5'>
                        {hasStore ? 'No listings yet' : 'Your shop is empty'}
                    </h2>
                    <p className='text-sm text-slate-600 mt-2 max-w-md mx-auto'>
                        Post your first ad - buyers reach you directly through GoCart messaging. Free, no commission on offline sales.
                    </p>
                    <div className='mt-6'>
                        <Link
                            href='/store/add-product'
                            className='inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-full px-5 py-2.5 transition'
                        >
                            <Plus size={15} /> Post an ad
                        </Link>
                    </div>
                </div>
            ) : (
                <table className="w-full max-w-5xl text-left ring ring-slate-200 rounded overflow-hidden text-sm">
                    <thead className="bg-slate-50 text-gray-700 uppercase tracking-wider">
                        <tr>
                            <th className="px-4 py-3">Name</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Boost</th>
                            <th className="px-4 py-3 hidden md:table-cell">Posted</th>
                            <th className="px-4 py-3">Price</th>
                            <th className="px-4 py-3">In stock</th>
                            <th className="px-4 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="text-slate-700">
                        {products.map((product) => {
                            const postedAgo = product.created_at ? formatDistanceToNow(new Date(product.created_at), { addSuffix: true }) : ''
                            const firstImage = product.images?.[0]
                            return (
                                <tr key={product.id} className="border-t border-gray-200 hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                        <div className="flex gap-2 items-center">
                                            {firstImage ? (
                                                <Image width={40} height={40} className='p-1 shadow rounded object-cover' src={firstImage} alt="" />
                                            ) : (
                                                <div className='size-10 rounded bg-slate-100 ring-1 ring-slate-200 flex items-center justify-center text-slate-400 text-[10px]'>
                                                    No img
                                                </div>
                                            )}
                                            <span className='line-clamp-2'>{product.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        {(() => {
                                            const b = statusBadge(product.review_status || 'approved')
                                            return (
                                                <span className={`inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide rounded-full px-2 py-0.5 ring-1 ${b.cls}`}>
                                                    {b.pulse && <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />}
                                                    {b.label}
                                                </span>
                                            )
                                        })()}
                                    </td>
                                    <td className="px-4 py-3">
                                        <BoostBadges product={product} />
                                    </td>
                                    <td className="px-4 py-3 hidden md:table-cell text-slate-500">{postedAgo}</td>
                                    <td className="px-4 py-3">
                                        {product.free
                                            ? <span className='inline-flex items-center text-[10px] font-bold uppercase tracking-wide bg-emerald-500 text-white rounded px-2 py-0.5'>FREE</span>
                                            : product.price != null
                                                ? `${currency} ${Number(product.price).toLocaleString()}`
                                                : product.service ? <span className='text-slate-500'>Quote</span> : '-'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <label className="relative inline-flex items-center cursor-pointer text-gray-900 gap-3">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                onChange={() => toggleStock(product.id, product.in_stock)}
                                                checked={product.in_stock}
                                            />
                                            <div className="w-9 h-5 bg-slate-300 rounded-full peer peer-checked:bg-slate-900 transition-colors duration-200"></div>
                                            <span className="dot absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform duration-200 ease-in-out peer-checked:translate-x-4"></span>
                                        </label>
                                    </td>
                                    <td className="px-4 py-3">
                                        {(() => {
                                            const state = boostState(product)
                                            const isFree = product.free
                                            const disabled = isFree || state === 'locked'
                                            const label = state === 'idle' ? 'Boost' : state === 'renewable' ? 'Renew' : 'Boosted'
                                            const title = isFree
                                                ? "Free listings can't be boosted"
                                                : state === 'locked'
                                                    ? 'Already boosted - renew within 24h of expiry'
                                                    : state === 'renewable'
                                                        ? 'Boost expires soon - renew now to stay at the top'
                                                        : 'Boost this listing'
                                            // Distinct styling per state so the lock is visually obvious:
                                            //  idle      → sky (call-to-action)
                                            //  renewable → amber (urgency, matches the reminder mail tone)
                                            //  locked    → slate, no hover, dimmed
                                            const cls = state === 'renewable'
                                                ? 'bg-white text-amber-800 ring-amber-300 hover:bg-amber-50 hover:ring-amber-400'
                                                : state === 'locked'
                                                    ? 'bg-slate-50 text-slate-500 ring-slate-200 cursor-not-allowed'
                                                    : 'bg-white text-sky-700 ring-sky-200 hover:bg-sky-50 hover:ring-sky-400'
                                            return (
                                                <button
                                                    type='button'
                                                    onClick={() => !disabled && setPickerFor(product.id)}
                                                    disabled={disabled}
                                                    title={title}
                                                    className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-full ring-1 transition disabled:opacity-70 ${cls}`}
                                                >
                                                    <Rocket size={12} /> {label}
                                                </button>
                                            )
                                        })()}
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            )}

            {/* Boost picker modal - opens when a row's Boost button is clicked.
                Each option triggers a Paystack redirect; control leaves this page
                on success and the callback applies the boost server-side. */}
            {pickerFor && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
                    onClick={() => !paying && setPickerFor(null)}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900">Boost this listing</h3>
                                <p className="text-xs text-slate-500 mt-0.5">Pick one - pay once, runs for the duration shown.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => !paying && setPickerFor(null)}
                                aria-label="Close"
                                className="size-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 disabled:opacity-50"
                                disabled={!!paying}
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="space-y-2">
                            {BOOSTS.map((b) => {
                                const isInFlight = paying?.boostKey === b.key
                                return (
                                    <button
                                        key={b.key}
                                        type="button"
                                        onClick={() => onPickBoost(pickerFor, b.key)}
                                        disabled={!!paying}
                                        className="w-full text-left p-3 rounded-lg ring-1 ring-slate-200 hover:ring-sky-400 hover:bg-sky-50 transition disabled:opacity-50 disabled:hover:bg-white disabled:hover:ring-slate-200"
                                    >
                                        <div className="flex items-baseline justify-between gap-3">
                                            <span className="font-medium text-slate-900">{b.label}</span>
                                            <span className="text-sm font-semibold text-slate-900 shrink-0">
                                                ₦{b.price.toLocaleString()} <span className="text-slate-500 font-normal">· {b.duration}</span>
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">{b.why}</p>
                                        {isInFlight && (
                                            <p className="text-xs text-sky-700 font-medium mt-2">Redirecting to Paystack…</p>
                                        )}
                                    </button>
                                )
                            })}
                        </div>

                        <p className="text-[11px] text-slate-400 mt-4 text-center">
                            You&apos;ll be sent to Paystack&apos;s secure page. Boost is applied automatically once payment confirms.
                        </p>
                    </div>
                </div>
            )}
        </>
    )
}

export default ManageProductsTable
