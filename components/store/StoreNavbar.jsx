'use client'
import Link from "next/link"
import { usePathname } from "next/navigation"

// Shared navbar for /store and /pro shells. Badge label flips based on
// pathname so the provider dashboard reads "Pro" rather than "Store",
// and the static "Hi, Seller" greeting is gone — each page's hero
// already greets the user by name, so duplicating here was just noise.
const StoreNavbar = () => {

    const pathname = usePathname()
    const badge = pathname?.startsWith('/pro') ? 'Pro' : 'Store'

    return (
        <div className="flex items-center justify-between px-12 py-3 border-b border-slate-200 transition-all">
            <Link href="/" className="relative text-4xl font-semibold text-slate-700">
                <span className="text-slate-900">go</span>cart<span className="text-slate-900 text-5xl leading-0">.</span>
                <p className="absolute text-xs font-semibold -top-1 -right-11 px-3 p-0.5 rounded-full flex items-center gap-2 text-white bg-slate-900">
                    {badge}
                </p>
            </Link>
        </div>
    )
}

export default StoreNavbar