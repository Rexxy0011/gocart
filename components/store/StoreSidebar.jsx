'use client'
import { usePathname } from "next/navigation"
import { HomeIcon, MessageSquareTextIcon, SquarePenIcon, SquarePlusIcon } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

const StoreSidebar = ({storeInfo}) => {

    const pathname = usePathname()

    const sidebarLinks = [
        { name: 'Dashboard',     href: '/store',                icon: HomeIcon },
        { name: 'Post an ad',    href: '/store/add-product',    icon: SquarePlusIcon },
        { name: 'My listings',   href: '/store/manage-product', icon: SquarePenIcon },
        { name: 'Inquiries',     href: '/store/inquiries',      icon: MessageSquareTextIcon },
    ]

    const displayName = storeInfo?.name || 'Seller'
    const initial = displayName.charAt(0).toUpperCase()
    const hasLogo = !!storeInfo?.logo

    return (
        <div className="inline-flex h-full flex-col gap-5 border-r border-slate-200 sm:min-w-60">
            <div className="flex flex-col gap-3 justify-center items-center pt-8 max-sm:hidden">
                {hasLogo ? (
                    <Image className="w-14 h-14 rounded-full shadow-md object-cover" src={storeInfo.logo} alt="" width={80} height={80} />
                ) : (
                    <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-semibold text-lg shadow-md">
                        {initial}
                    </div>
                )}
                <p className="text-slate-700">{displayName}</p>
            </div>

            <div className="max-sm:mt-6">
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

export default StoreSidebar