'use client'
import { useMemo, useState } from "react"
import { toast } from "react-hot-toast"
import Image from "next/image"
import Link from "next/link"
import { ArrowUp, Sparkles } from "lucide-react"
import { useDispatch, useSelector } from "react-redux"
import { bumpProduct } from "@/lib/features/product/productSlice"
import { formatDistanceToNow } from "date-fns"

export default function StoreManageProducts() {

    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '$'
    const dispatch = useDispatch()

    // Demo: scope to first store (replace with logged-in store on backend wiring)
    const STORE_ID = 'store_1'
    const STORE_USERNAME = 'happyshop'

    const allProducts = useSelector(state => state.product.list)
    const products = useMemo(
        () => allProducts.filter(p => p.storeId === STORE_ID),
        [allProducts]
    )

    const isPowerAccount = products[0]?.store?.powerAccount === true

    const [bumping, setBumping] = useState({})

    const onBump = (productId) => {
        if (!isPowerAccount) {
            toast.error('Bump up is a Power Account perk. Upgrade to use it.')
            return
        }
        setBumping((b) => ({ ...b, [productId]: true }))
        dispatch(bumpProduct(productId))
        toast.success('Listing bumped — back at the top of newest.')
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
                {isPowerAccount ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-sky-700 bg-sky-100 ring-1 ring-sky-200 px-3 py-1 rounded-full">
                        <Sparkles size={12} /> Power Account
                    </span>
                ) : (
                    <Link href='/pricing' className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-700 bg-slate-100 ring-1 ring-slate-200 hover:ring-slate-400 px-3 py-1 rounded-full transition">
                        <Sparkles size={12} /> Upgrade for Bump up
                    </Link>
                )}
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
                                        title={isPowerAccount ? 'Bump to top of newest' : 'Power Account perk'}
                                        className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-full ring-1 transition ${
                                            isPowerAccount
                                                ? 'bg-white text-sky-700 ring-sky-200 hover:bg-sky-50 hover:ring-sky-400 disabled:opacity-50'
                                                : 'bg-slate-50 text-slate-400 ring-slate-200 cursor-not-allowed'
                                        }`}
                                    >
                                        <ArrowUp size={12} />
                                        {isBumping ? 'Bumped!' : 'Bump up'}
                                    </button>
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>

            {!isPowerAccount && (
                <div className='mt-4 max-w-5xl bg-sky-50 ring-1 ring-sky-200 rounded-lg p-4 flex items-center gap-3'>
                    <Sparkles size={18} className='text-sky-600 shrink-0' />
                    <p className='text-sm text-slate-700'>
                        Bump up is a Power Account perk. <Link href='/pricing' className='text-sky-700 font-medium hover:underline'>Upgrade →</Link>
                    </p>
                </div>
            )}
        </>
    )
}
