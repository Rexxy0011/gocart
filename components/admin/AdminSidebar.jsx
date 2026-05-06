'use client'

import { usePathname } from "next/navigation"
import { HomeIcon, ShieldCheckIcon, BadgeCheckIcon, FlagIcon } from "lucide-react"
import Link from "next/link"

const AdminSidebar = () => {

    const pathname = usePathname()

    // Tight nav — every link maps to actual daily work.
    // Stores auto-approve via DB default; coupons don't apply to a
    // classifieds model. If we ever add boost-discount codes those'd
    // come back in here.
    const sidebarLinks = [
        { name: 'Dashboard',         href: '/admin',           icon: HomeIcon },
        { name: 'Review Listings',   href: '/admin/approve',   icon: ShieldCheckIcon },
        { name: 'Approve Provider',  href: '/admin/providers', icon: BadgeCheckIcon },
        { name: 'Reports',           href: '/admin/reports',   icon: FlagIcon },
    ]

    return (
        <div className="inline-flex h-full flex-col gap-5 border-r border-slate-200 sm:min-w-60">
            <div className="max-sm:mt-6 sm:mt-6">
                {
                    sidebarLinks.map((link, index) => (
                        <Link key={index} href={link.href} className={`relative flex items-center gap-3 text-slate-500 hover:bg-slate-50 p-2.5 transition ${pathname === link.href && 'bg-slate-100 sm:text-slate-600'}`}>
                            <link.icon size={18} className="sm:ml-5" />
                            <p className="max-sm:hidden">{link.name}</p>
                            {pathname === link.href && <span className="absolute bg-slate-900 right-0 top-1.5 bottom-1.5 w-1 sm:w-1.5 rounded-l"></span>}
                        </Link>
                    ))
                }
            </div>
        </div>
    )
}

export default AdminSidebar