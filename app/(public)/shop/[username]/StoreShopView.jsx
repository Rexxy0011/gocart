'use client'
import { useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ShieldCheck, Star, MessageSquareText, BadgeCheck, Pencil, Plus, LayoutDashboard, Eye } from "lucide-react"
import { differenceInMonths, differenceInYears, formatDistanceToNow } from "date-fns"
import ProductRow from "@/components/ProductRow"
import ServiceCard from "@/components/ServiceCard"
import VerifiedCheck from "@/components/VerifiedCheck"
import ReviewModal from "@/components/ReviewModal"
import EditProfileModal from "@/components/EditProfileModal"
import OwnerListingActions from "@/components/OwnerListingActions"
import { useAuthGate } from "@/hooks/useAuthGate"
import { categoryGroups } from "@/assets/assets"

const formatPostingDuration = (createdAt) => {
    if (!createdAt) return null
    const created = new Date(createdAt)
    const years = differenceInYears(new Date(), created)
    if (years >= 1) return `Posting for ${years}+ years`
    const months = differenceInMonths(new Date(), created)
    if (months >= 1) return `Posting for ${months}+ months`
    return 'Posting for less than a month'
}

const groupForCategory = (category) => {
    for (const g of categoryGroups) {
        if (g.items.includes(category)) return g.name
    }
    return category
}

const StoreShopView = ({
    storeInfo,
    products,
    reviews = [],
    viewerIsSelf = false,
    viewerSignedIn = false,
    providerVerified = false,
    profileMode = 'seller',          // 'seller' | 'provider'
    crossProfileHref = null,         // link to the other identity's profile when applicable
    crossProfileLabel = '',
    ownerPreviewing = false,         // owner has flipped into ?preview=buyer mode
}) => {

    const isProviderProfile = profileMode === 'provider'

    const [activeTab, setActiveTab] = useState('Listings')
    const [reviewOpen, setReviewOpen] = useState(false)
    const [editOpen, setEditOpen] = useState(false)
    const requireAuth = useAuthGate()

    // Owner CTAs are now strictly tied to which surface the owner is on,
    // not which roles they happen to hold. Provider profile → /pro tools.
    // Seller profile → /store tools. Even if a user is both, each profile
    // only ever exposes its own surface.
    const dashboardHref  = isProviderProfile ? '/pro'                   : '/store'
    const dashboardLabel = isProviderProfile ? 'Provider dashboard'     : 'Seller dashboard'
    const addListingHref = isProviderProfile ? '/pro/add-service'       : '/store/add-product'
    const addListingLabel = isProviderProfile ? 'Add a service'         : 'Post an ad'
    const listingNoun     = isProviderProfile ? 'service'               : 'item'
    const listingNounP    = isProviderProfile ? 'services'              : 'items'
    const sellingNoun     = isProviderProfile ? 'Service history'       : 'Selling history'

    const categoryCounts = useMemo(() => {
        const counts = new Map()
        for (const p of products) {
            const group = groupForCategory(p.category)
            counts.set(group, (counts.get(group) || 0) + 1)
        }
        return [...counts.entries()].sort((a, b) => b[1] - a[1])
    }, [products])

    const sellerName = storeInfo?.user?.name || storeInfo?.name || 'Seller'
    const initial = sellerName.charAt(0).toUpperCase()
    const avatar = storeInfo?.user?.image || storeInfo?.logo
    const postingDuration = formatPostingDuration(storeInfo?.createdAt)
    const isVerified = storeInfo?.status === 'approved' || providerVerified

    // Aggregate stars across every review on this seller's listings.
    const ratingCount = reviews.length
    const averageRating = ratingCount
        ? reviews.reduce((s, r) => s + r.rating, 0) / ratingCount
        : 0

    const openReviewModal = () => requireAuth(
        () => setReviewOpen(true),
        `Sign in to review ${sellerName.split(' ')[0]}.`,
    )

    // Path used to toggle in/out of buyer preview without rebuilding state.
    const profilePath = `/${profileMode === 'provider' ? 'provider' : 'shop'}/${storeInfo?.username || ''}`

    return (
        <div className="min-h-[70vh]">

            {/* Owner banner — only the signed-in owner (and not in buyer
                preview) sees this strip. Mirrors Jiji's blend: profile
                management lives where buyers see the profile, not behind
                a separate route. */}
            {viewerIsSelf && (
                <section className="bg-amber-50 border-b border-amber-200">
                    <div className="max-w-7xl mx-auto px-6 py-2.5 flex flex-wrap items-center gap-x-4 gap-y-2">
                        <p className="text-xs sm:text-sm text-amber-900">
                            <span className="font-semibold">This is your public profile.</span>
                            <span className="hidden sm:inline text-amber-800/80"> Only you see this strip.</span>
                        </p>
                        <div className="ml-auto flex items-center gap-2 flex-wrap">
                            <Link
                                href={`${profilePath}?preview=buyer`}
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-900 hover:text-amber-950 transition"
                            >
                                <Eye size={13} /> View as buyer
                            </Link>
                            <Link
                                href={dashboardHref}
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-900 hover:text-amber-950 transition"
                            >
                                <LayoutDashboard size={13} /> {dashboardLabel}
                            </Link>
                            <Link
                                href={addListingHref}
                                className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-full px-3 py-1.5 transition"
                            >
                                <Plus size={13} /> {addListingLabel}
                            </Link>
                        </div>
                    </div>
                </section>
            )}

            {/* Owner-in-preview bar — slim slate strip above the profile so
                the owner remembers they're looking at the buyer's view and
                can hop back to owner mode in one click. */}
            {ownerPreviewing && (
                <section className="bg-slate-900 text-white">
                    <div className="max-w-7xl mx-auto px-6 py-2 flex items-center gap-3 text-xs">
                        <Eye size={13} className="shrink-0" />
                        <p className="flex-1 min-w-0">
                            You&apos;re viewing your profile as a buyer would see it.
                        </p>
                        <Link
                            href={profilePath}
                            className="inline-flex items-center gap-1 bg-white text-slate-900 font-semibold rounded-full px-3 py-1 hover:bg-slate-100 transition shrink-0"
                        >
                            Exit preview
                        </Link>
                    </div>
                </section>
            )}

            {/* Seller header banner */}
            <section className="bg-slate-100 border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-6 py-8 sm:py-10">
                    <div className="flex items-start gap-5">
                        <div className="size-16 sm:size-20 rounded-full overflow-hidden ring-2 ring-white shadow-sm bg-rose-700 text-white flex items-center justify-center text-2xl sm:text-3xl font-semibold shrink-0">
                            {avatar ? (
                                <Image src={avatar} alt={sellerName} width={80} height={80} className="size-full object-cover" />
                            ) : (
                                initial
                            )}
                        </div>
                        <div className="min-w-0 flex-1">
                            <h1 className="inline-flex items-center gap-0 text-2xl sm:text-3xl font-bold text-slate-900">
                                <span className="truncate">{sellerName}</span>
                                {isVerified && <VerifiedCheck size={22} className="-ml-0.5" />}
                            </h1>
                            <div className="flex items-center gap-2 mt-2">
                                <div className="flex items-center">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Star
                                            key={i}
                                            size={18}
                                            className={i < Math.round(averageRating) ? 'text-amber-400' : 'text-slate-300'}
                                            fill={i < Math.round(averageRating) ? 'currentColor' : 'none'}
                                            strokeWidth={1.5}
                                        />
                                    ))}
                                </div>
                                {ratingCount > 0 ? (
                                    <span className="text-sm text-slate-700">
                                        <span className="font-semibold">{averageRating.toFixed(1)}</span>
                                        <span className="text-slate-500"> ({ratingCount} review{ratingCount === 1 ? '' : 's'})</span>
                                    </span>
                                ) : (
                                    <span className="text-sm text-slate-500">No reviews yet</span>
                                )}
                            </div>
                            {postingDuration && (
                                <p className="text-sm text-slate-600 mt-3">{postingDuration}</p>
                            )}
                            <p className="inline-flex items-center gap-2 text-sm text-slate-700 mt-4">
                                <ShieldCheck size={18} className="text-emerald-600" />
                                Email address verified
                            </p>

                            {/* Leave-a-review CTA — hidden on the seller's
                                own profile. Buyers who haven't signed in
                                yet still see the button; clicking goes
                                through useAuthGate and redirects them. */}
                            {!viewerIsSelf && products.length > 0 && (
                                <button
                                    type="button"
                                    onClick={openReviewModal}
                                    className="mt-5 inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-full px-4 py-2 transition"
                                >
                                    <MessageSquareText size={14} /> Leave a review
                                </button>
                            )}

                            {/* Edit-profile CTA — only the owner sees this. */}
                            {viewerIsSelf && (
                                <button
                                    type="button"
                                    onClick={() => setEditOpen(true)}
                                    className="mt-5 inline-flex items-center gap-2 ring-1 ring-slate-300 hover:ring-slate-500 text-slate-800 text-sm font-semibold rounded-full px-4 py-2 transition"
                                >
                                    <Pencil size={14} /> Edit profile
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Cross-profile link — when this person also has the
                    other identity, surface it as a small strip so buyers
                    can hop without having to guess. Each profile stays
                    strictly its own surface; the link is the only bridge. */}
                {crossProfileHref && (
                    <div className="mb-4 flex items-center gap-2 text-sm">
                        <span className="text-slate-500">{crossProfileLabel}.</span>
                        <a
                            href={crossProfileHref}
                            className="font-semibold text-emerald-700 hover:text-emerald-900 underline-offset-2 hover:underline transition"
                        >
                            View {isProviderProfile ? 'their products' : 'their services'} →
                        </a>
                    </div>
                )}

                {/* History block */}
                <section className="mb-6 border border-slate-200 rounded-lg p-5 bg-white">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">{sellingNoun}</h2>
                    <dl className="space-y-2 text-sm">
                        <div className="flex items-center gap-3">
                            <dt className="text-slate-500">Total {listingNounP}</dt>
                            <dd className="font-semibold text-slate-900">{products.length}</dd>
                        </div>
                        {categoryCounts.length > 0 && (
                            <div className="flex items-start gap-3">
                                <dt className="text-slate-500 shrink-0">Categories:</dt>
                                <dd className="text-slate-700">
                                    {categoryCounts.map(([name, count], i) => (
                                        <span key={name}>
                                            <span className="font-semibold text-slate-900">{name}</span>
                                            <span className="text-slate-500"> ({count})</span>
                                            {i < categoryCounts.length - 1 && <span className="text-slate-400">, </span>}
                                        </span>
                                    ))}
                                </dd>
                            </div>
                        )}
                    </dl>
                </section>

                {/* Tabs */}
                <div className="flex border-b-2 border-slate-200 mb-6">
                    {['Listings', 'Reviews'].map((tab) => (
                        <button
                            key={tab}
                            type="button"
                            onClick={() => setActiveTab(tab)}
                            className={`${
                                activeTab === tab
                                    ? 'text-slate-900 border-b-2 border-emerald-500 -mb-0.5 font-semibold'
                                    : 'text-slate-500 hover:text-slate-700'
                            } px-6 py-3 text-sm font-medium transition`}
                        >
                            {tab}
                            {tab === 'Reviews' && ratingCount > 0 && (
                                <span className="ml-1.5 text-xs text-slate-400">({ratingCount})</span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Tab content */}
                {activeTab === 'Listings' ? (
                    products.length === 0 ? (
                        <p className="text-sm text-slate-500 py-12 text-center">
                            No {listingNounP} yet.
                        </p>
                    ) : isProviderProfile ? (
                        // Provider profile renders services as cards in a grid,
                        // matching how /services lists them.
                        <>
                            <p className="text-sm text-slate-600 mb-4">
                                {products.length} {products.length === 1 ? listingNoun : listingNounP} on offer
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {products.map((product) => (
                                    <div key={product.id}>
                                        <ServiceCard product={product} />
                                        {viewerIsSelf && (
                                            <OwnerListingActions
                                                listingId={product.id}
                                                initialInStock={product.inStock !== false}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <>
                            <p className="text-sm text-slate-600 mb-4">
                                {products.length} {products.length === 1 ? listingNoun : listingNounP} for sale
                            </p>
                            <div className="border-t border-slate-200 max-w-3xl">
                                {products.map((product) => (
                                    <div key={product.id}>
                                        <ProductRow product={product} />
                                        {viewerIsSelf && (
                                            <OwnerListingActions
                                                listingId={product.id}
                                                initialInStock={product.inStock !== false}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </>
                    )
                ) : (
                    <div className="space-y-4 max-w-3xl">
                        {reviews.length === 0 ? (
                            <div className="py-12 text-center">
                                <p className="text-sm text-slate-500">No reviews yet.</p>
                                {!viewerIsSelf && products.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={openReviewModal}
                                        className="mt-4 text-sm font-semibold text-sky-700 hover:underline"
                                    >
                                        Be the first to review {sellerName.split(' ')[0]}
                                    </button>
                                )}
                            </div>
                        ) : (
                            reviews.map((r) => (
                                <article key={r.id} className="bg-white border border-slate-200 rounded-xl p-4">
                                    <header className="flex items-start gap-3">
                                        <div className="size-9 rounded-full overflow-hidden bg-slate-100 ring-1 ring-slate-200 flex items-center justify-center text-xs font-semibold text-slate-600 shrink-0">
                                            {r.user?.image ? (
                                                <Image src={r.user.image} alt={r.user.name || 'Reviewer'} width={36} height={36} className="size-full object-cover" />
                                            ) : (
                                                (r.user?.name?.charAt(0) || '?').toUpperCase()
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-slate-900 truncate">{r.user?.name || 'Buyer'}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <div className="flex items-center">
                                                    {Array.from({ length: 5 }).map((_, i) => (
                                                        <Star
                                                            key={i}
                                                            size={13}
                                                            className={i < r.rating ? 'text-amber-400' : 'text-slate-300'}
                                                            fill={i < r.rating ? 'currentColor' : 'none'}
                                                            strokeWidth={1.5}
                                                        />
                                                    ))}
                                                </div>
                                                <span className="text-xs text-slate-500">
                                                    {formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}
                                                </span>
                                            </div>
                                            {r.productName && (
                                                <p className="text-xs text-slate-500 mt-1 truncate">on “{r.productName}”</p>
                                            )}
                                            {r.verifiedJob && (
                                                <span className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 rounded-full px-2 py-0.5">
                                                    <BadgeCheck size={10} /> Verified job
                                                </span>
                                            )}
                                        </div>
                                    </header>
                                    {r.comment && (
                                        <p className="text-sm text-slate-700 mt-3 leading-relaxed whitespace-pre-line">{r.comment}</p>
                                    )}
                                </article>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Review modal — listings prop scopes the picker to this seller */}
            <ReviewModal
                open={reviewOpen}
                onClose={() => setReviewOpen(false)}
                listings={products.map(p => ({ id: p.id, name: p.name }))}
            />

            {/* Edit-profile modal — owner only */}
            {viewerIsSelf && (
                <EditProfileModal
                    open={editOpen}
                    onClose={() => setEditOpen(false)}
                    initial={{
                        name: storeInfo?.name || '',
                        description: storeInfo?.description || '',
                        contact: storeInfo?.contact || '',
                        logo: storeInfo?.logo || '',
                    }}
                />
            )}
        </div>
    )
}

export default StoreShopView
