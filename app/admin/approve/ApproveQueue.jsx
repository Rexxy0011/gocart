'use client'
import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import toast from "react-hot-toast"
import { AlertTriangle, Calendar, Mail, Tag, MapPin } from "lucide-react"
import { setProductReviewStatus } from "@/app/actions/admin"

const REJECT_PRESETS = [
    'Banned item / category not allowed',
    'Counterfeit or replica goods',
    'Spam / duplicate listing',
    'Stolen-goods indicators',
    'Inappropriate content',
    'Insufficient information / fake-looking',
]

const RISK_CATEGORIES = new Set([
    'Sedans', 'SUVs', 'Motorcycles',
    'iPhones', 'Androids', 'Laptops', 'TVs', 'Cameras',
])

const ApproveQueue = ({ products: initialProducts }) => {

    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '₦'
    const [products, setProducts] = useState(initialProducts)
    const [pending, setPending] = useState({})
    const [rejectingId, setRejectingId] = useState(null)
    const [reason, setReason] = useState('')

    const startReject = (id) => { setRejectingId(id); setReason('') }
    const cancelReject = () => { setRejectingId(null); setReason('') }

    const submit = async (productId, status, reasonText = '') => {
        setPending((p) => ({ ...p, [productId]: status }))
        const result = await setProductReviewStatus(productId, status, reasonText)
        if (result.error) {
            toast.error(result.error)
            setPending((p) => { const n = { ...p }; delete n[productId]; return n })
            return
        }
        setProducts((ps) => ps.filter(p => p.id !== productId))
        setRejectingId(null)
        setReason('')
        toast.success(status === 'approved' ? 'Listing approved.' : 'Listing rejected.')
    }

    return (
        <div className="text-slate-500 mb-28">
            <h1 className="text-2xl">Review <span className="text-slate-800 font-medium">listings</span></h1>
            <p className="text-sm text-slate-500 mt-1">
                New sellers&apos; first listings land here. After 3 approvals their posts auto-publish.
                Risk categories (vehicles, electronics) are sorted to the top.
            </p>

            {products.length === 0 ? (
                <div className="flex items-center justify-center h-80">
                    <h1 className="text-3xl text-slate-400 font-medium">No pending listings</h1>
                </div>
            ) : (
                <div className="flex flex-col gap-4 mt-6">
                    {products.map((product) => {
                        const action = pending[product.id]
                        const isRejecting = rejectingId === product.id
                        const isHighRisk = RISK_CATEGORIES.has(product.category)
                        const seller = product.store?.user
                        const sellerJoinedAgo = seller?.created_at
                            ? formatDistanceToNow(new Date(seller.created_at), { addSuffix: true })
                            : ''
                        const firstImage = product.images?.[0]

                        return (
                            <div key={product.id} className="bg-white border border-slate-200 rounded-lg shadow-sm p-5 max-w-4xl">

                                <div className="flex gap-4 max-md:flex-col">
                                    {/* Image */}
                                    <div className="shrink-0">
                                        {firstImage ? (
                                            <Image
                                                src={firstImage}
                                                alt=""
                                                width={140}
                                                height={140}
                                                className="size-32 sm:size-36 rounded-lg object-cover ring-1 ring-slate-200"
                                            />
                                        ) : (
                                            <div className="size-32 sm:size-36 rounded-lg bg-slate-100 ring-1 ring-slate-200 flex items-center justify-center text-slate-400 text-xs">
                                                No image
                                            </div>
                                        )}
                                    </div>

                                    {/* Listing details */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start gap-2 flex-wrap">
                                            <h2 className="text-base font-semibold text-slate-900 line-clamp-2">{product.name}</h2>
                                            {isHighRisk && (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide bg-amber-50 text-amber-800 ring-1 ring-amber-200 rounded-full px-2 py-0.5 shrink-0">
                                                    <AlertTriangle size={10} /> High risk
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1.5 flex-wrap">
                                            <span className="inline-flex items-center gap-1"><Tag size={11} /> {product.category}</span>
                                            <span className="inline-flex items-center gap-1"><MapPin size={11} /> {product.location || '—'}</span>
                                            <span className="font-semibold text-slate-700">
                                                {product.free
                                                    ? 'FREE'
                                                    : product.price != null
                                                        ? `${currency} ${Number(product.price).toLocaleString()}`
                                                        : product.service ? 'Quote' : '—'}
                                            </span>
                                        </div>

                                        {product.description && (
                                            <p className="text-sm text-slate-600 mt-3 line-clamp-3 leading-relaxed">
                                                {product.description}
                                            </p>
                                        )}

                                        {/* Seller block */}
                                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-3 text-xs">
                                            {seller?.image ? (
                                                <Image src={seller.image} alt="" width={28} height={28} className="size-7 rounded-full object-cover" />
                                            ) : (
                                                <div className="size-7 rounded-full bg-slate-200" />
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-slate-700 font-medium truncate">
                                                    {seller?.name || '—'}
                                                </p>
                                                <p className="text-slate-500 truncate flex items-center gap-3">
                                                    <span className="inline-flex items-center gap-1"><Mail size={10} /> {seller?.email || '—'}</span>
                                                    {sellerJoinedAgo && <span className="inline-flex items-center gap-1"><Calendar size={10} /> joined {sellerJoinedAgo}</span>}
                                                </p>
                                            </div>
                                            {product.store?.username && (
                                                <Link
                                                    href={`/shop/${product.store.username}`}
                                                    target="_blank"
                                                    className="text-sky-700 hover:underline shrink-0"
                                                >
                                                    Shop →
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Action row */}
                                <div className="mt-4 pt-4 border-t border-slate-100">
                                    {!isRejecting ? (
                                        <div className="flex gap-3 flex-wrap">
                                            <button
                                                type="button"
                                                disabled={!!action}
                                                onClick={() => submit(product.id, 'approved')}
                                                className="px-4 py-2 bg-slate-900 text-white rounded hover:bg-slate-950 disabled:opacity-50 text-sm transition"
                                            >
                                                {action === 'approved' ? 'Approving…' : 'Approve & publish'}
                                            </button>
                                            <button
                                                type="button"
                                                disabled={!!action}
                                                onClick={() => startReject(product.id)}
                                                className="px-4 py-2 bg-white text-slate-700 ring-1 ring-slate-300 hover:ring-slate-500 rounded disabled:opacity-50 text-sm transition"
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="bg-slate-50 ring-1 ring-slate-200 rounded-lg p-3 space-y-3">
                                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Why are you rejecting?</p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {REJECT_PRESETS.map((preset) => (
                                                    <button
                                                        key={preset}
                                                        type="button"
                                                        onClick={() => setReason(preset)}
                                                        className="text-[11px] bg-white ring-1 ring-slate-200 hover:ring-slate-400 rounded-full px-2.5 py-1 transition"
                                                    >
                                                        {preset}
                                                    </button>
                                                ))}
                                            </div>
                                            <textarea
                                                value={reason}
                                                onChange={(e) => setReason(e.target.value)}
                                                rows={3}
                                                placeholder="Pick a preset or type a specific reason. The seller sees this on their dashboard."
                                                className="w-full text-sm bg-white border border-slate-200 rounded p-2 outline-none focus:border-slate-400 transition"
                                            />
                                            <div className="flex gap-2 justify-end">
                                                <button
                                                    type="button"
                                                    onClick={cancelReject}
                                                    className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 transition"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={!reason.trim() || !!action}
                                                    onClick={() => submit(product.id, 'rejected', reason)}
                                                    className="px-3 py-1.5 text-xs bg-rose-600 text-white rounded hover:bg-rose-700 disabled:opacity-50 transition"
                                                >
                                                    {action === 'rejected' ? 'Rejecting…' : 'Confirm reject'}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

export default ApproveQueue
