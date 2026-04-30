'use client'
import { useRouter } from "next/navigation"
import { MoveLeftIcon } from "lucide-react"

const ShopHeader = ({ search }) => {
    const router = useRouter()
    return (
        <h1
            onClick={() => router.push('/shop')}
            className="text-2xl text-slate-500 my-6 flex items-center gap-2 cursor-pointer"
        >
            {search && <MoveLeftIcon size={20} />}
            All <span className="text-slate-700 font-medium">Listings</span>
            {search && <span className="text-sm text-slate-400">— "{search}"</span>}
        </h1>
    )
}

export default ShopHeader
