'use client'
import { useMemo, useState } from "react"
import { toast } from "react-hot-toast"
import Image from "next/image"
import { ArrowUp, Rocket } from "lucide-react"
import { useDispatch, useSelector } from "react-redux"
import { bumpProduct } from "@/lib/features/product/productSlice"
import { formatDistanceToNow } from "date-fns"

const BUMP_PRICE = 1500
const BUMP_DURATION_DAYS = 7

export default function StoreManageProducts() {

    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '$'
    const dispatch = useDispatch()

    // Demo: scope to first store (replace with logged-in store on backend wiring)
    const STORE_ID = 'store_1'

    const allProducts = useSelector(state => state.product.list)
    const products = useMemo(
        () => allProducts.filter(p => p.storeId === STORE_ID),
        [allProducts]
    )

    const [bumping, setBumping] = useState({})

    const onBump = (productId) => {
        // Demo: skip the real Paystack handoff for now and treat the bump as paid.
        setBumping((b) => ({ ...b, [productId]: true }))
        dispatch(bumpProduct(productId))
        toast.success(`Listing bumped — runs daily for ${BUMP_DURATION_DAYS} days.`)
        setTimeout(() => setBumping((b) => ({ ...b, [productId]: false })), 1500)
    }

    const toggleStock = async (productId) => {
        // Logic to toggle the stock of a product
    }

    return (
        <>
            <div className='flex flex-wrap items-start justify-between gap-3 mb-5'>
                <h1 className="text-2xl text-slate-500">
                    Manage <span className="text-slate-800 font-medium">Products</span>
                </h1>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-50 ring-1 ring-slate-200 px-3 py-1 rounded-full">
                    <Rocket size={12} className='text-sky-600' /> Bump up — ₦{BUMP_PRICE.toLocaleString()} · {BUMP_DURATION_DAYS} days
                </span>
            </div>

            <table className="w-full max-w-5xl text-left ring ring-slate-200 rounded overflow-hidden text-sm">
                <thead className="bg-slate-50 text-gray-700 uppercase tracking-wider">
                    <tr>
                        <th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3 hidden md:table-cell">Posted</th>
                        <th className="px-4 py-3">Price</th>
                        <th className="px-4 py-3">In stock</th>
                        <th className="px-4 py-3">Actions</th>
                    </tr>
                </thead>
                <tbody className="text-slate-700">
                    {products.map((product) => {
                        const postedAgo = product.createdAt ? formatDistanceToNow(new Date(product.createdAt), { addSuffix: true }) : ''
                        const isBumping = !!bumping[product.id]
                        return (
                            <tr key={product.id} className="border-t border-gray-200 hover:bg-gray-50">
                                <td className="px-4 py-3">
                                    <div className="flex gap-2 items-center">
                                        <Image width={40} height={40} className='p-1 shadow rounded' src={product.images[0]} alt="" />
                                        <span className='line-clamp-2'>{product.name}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-3 hidden md:table-cell text-slate-500">{postedAgo}</td>
                                <td className="px-4 py-3">
                                    {product.price != null ? `${currency} ${product.price.toLocaleString()}` : '—'}
                                </td>
                                <td className="px-4 py-3">
                                    <label className="relative inline-flex items-center cursor-pointer text-gray-900 gap-3">
                                        <input type="checkbox" className="sr-only peer" onChange={() => toast.promise(toggleStock(product.id), { loading: "Updating data..." })} checked={product.inStock} />
                                        <div className="w-9 h-5 bg-slate-300 rounded-full peer peer-checked:bg-slate-900 transition-colors duration-200"></div>
                                        <span className="dot absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform duration-200 ease-in-out peer-checked:translate-x-4"></span>
                                    </label>
                                </td>
                                <td className="px-4 py-3">
                                    <button
                                        type='button'
                                        onClick={() => onBump(product.id)}
                                        disabled={isBumping}
                                        title={`Bump up — ₦${BUMP_PRICE.toLocaleString()} for ${BUMP_DURATION_DAYS} days`}
                                        className='inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-full ring-1 bg-white text-sky-700 ring-sky-200 hover:bg-sky-50 hover:ring-sky-400 disabled:opacity-50 transition'
                                    >
                                        <ArrowUp size={12} />
                                        {isBumping ? 'Bumped!' : `Bump · ₦${BUMP_PRICE.toLocaleString()}`}
                                    </button>
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </>
    )
}
