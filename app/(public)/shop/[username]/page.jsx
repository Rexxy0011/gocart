'use client'
import { useParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { ShieldCheck, Star } from "lucide-react"
import { differenceInMonths, differenceInYears } from "date-fns"
import Loading from "@/components/Loading"
import ProductRow from "@/components/ProductRow"
import VerifiedCheck from "@/components/VerifiedCheck"
import { categoryGroups, dummyStoreData, productDummyData } from "@/assets/assets"

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

export default function StoreShop() {

    const { username } = useParams()
    const [products, setProducts] = useState([])
    const [storeInfo, setStoreInfo] = useState(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('Listings')

    useEffect(() => {
        setStoreInfo(dummyStoreData)
        // Per services-separation rule: products only on a seller profile.
        // Services have their own surface at /services and a dedicated provider profile.
        setProducts(productDummyData.filter(p => !p.service))
        setLoading(false)
    }, [])

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
    const isVerified = storeInfo?.status === 'approved'
    const reviews = useMemo(
        () => products.flatMap(p => (p.rating || []).map(r => ({ ...r, productName: p.name }))),
        [products]
    )
    const ratingCount = reviews.length
    const averageRating = ratingCount
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / ratingCount
        : 0

    if (loading) return <Loading />

    return (
        <div className="min-h-[70vh]">
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
                            <h1 className="inline-flex items-center gap-2 text-2xl sm:text-3xl font-bold text-slate-900">
                                <span className="truncate">{sellerName}</span>
                                {isVerified && <VerifiedCheck size={22} />}
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
                                <span className="text-sm text-slate-600">({ratingCount})</span>
                            </div>
                            {postingDuration && (
                                <p className="text-sm text-slate-600 mt-3">{postingDuration}</p>
                            )}
                            <p className="inline-flex items-center gap-2 text-sm text-slate-700 mt-4">
                                <ShieldCheck size={18} className="text-emerald-600" />
                                Email address verified
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Selling history block */}
                <section className="mb-6 border border-slate-200 rounded-lg p-5 bg-white">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">Selling history</h2>
                    <dl className="space-y-2 text-sm">
                        <div className="flex items-center gap-3">
                            <dt className="text-slate-500">Total items</dt>
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
                        </button>
                    ))}
                </div>

                {/* Tab content */}
                {activeTab === 'Listings' ? (
                    <>
                        <p className="text-sm text-slate-600 mb-4">
                            {products.length} {products.length === 1 ? 'item' : 'items'} for sale
                        </p>
                        <div className="border-t border-slate-200 max-w-3xl">
                            {products.map((product) => (
                                <ProductRow key={product.id} product={product} />
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="space-y-4">
                        {reviews.length === 0 ? (
                            <p className="text-sm text-slate-500 py-12 text-center">No reviews yet</p>
                        ) : (
                            reviews.map((r, i) => (
                                <div key={`${r.id}-${i}`} className="border border-slate-200 rounded-lg p-4 bg-white">
                                    <div className="flex items-center gap-3">
                                        <div className="size-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 font-semibold">
                                            {r.user?.name?.charAt(0) || '?'}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-slate-900">{r.user?.name || 'Anonymous'}</p>
                                            <div className="flex items-center">
                                                {Array.from({ length: 5 }).map((_, idx) => (
                                                    <Star
                                                        key={idx}
                                                        size={14}
                                                        className={idx < Math.round(r.rating) ? 'text-amber-400' : 'text-slate-300'}
                                                        fill={idx < Math.round(r.rating) ? 'currentColor' : 'none'}
                                                        strokeWidth={1.5}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-sm text-slate-700 mt-3 leading-relaxed">{r.review}</p>
                                    {r.productName && (
                                        <p className="text-xs text-slate-500 mt-2">on {r.productName}</p>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
