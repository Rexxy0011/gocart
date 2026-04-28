'use client'
import { usePathname } from "next/navigation"
import {
    HomeIcon, MessageSquareTextIcon, CalendarDays, FileText, ShieldCheck, Trophy, ArrowUpRightIcon,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"

const ProSidebar = ({ providerInfo }) => {

    const pathname = usePathname()

    const sidebarLinks = [
        { name: 'Dashboard',     href: '/pro',           icon: HomeIcon },
        { name: 'Inquiries',     href: '/pro/inquiries', icon: MessageSquareTextIcon },
        { name: 'Jobs',          href: '/pro/jobs',      icon: ShieldCheck },
        { name: 'Quote requests',href: '/pro/quotes',    icon: FileText },
        { name: 'Calendar',      href: '/pro/calendar',  icon: CalendarDays },
        { name: 'Milestones',    href: '/pro/milestones',icon: Trophy },
    ]

    return (
        <div className="inline-flex h-full flex-col gap-5 border-r border-slate-200 sm:min-w-60">
            <div className="flex flex-col gap-3 justify-center items-center pt-8 max-sm:hidden">
                {providerInfo?.logo ? (
                    <Image className="size-14 rounded-full shadow-md object-cover" src={providerInfo.logo} alt="" width={80} height={80} />
                ) : (
                    <div className="size-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-semibold text-lg shadow-md">
                        {providerInfo?.name?.charAt(0) || 'P'}
                    </div>
                )}
                <div className="text-center">
                    <p className="text-slate-700 font-medium">{providerInfo?.name}</p>
                    <p className="text-xs text-slate-400">Provider mode</p>
                </div>
            </div>

            <div className="max-sm:mt-6">
                {sidebarLinks.map((link, index) => (
                    <Link
                        key={index}
                        href={link.href}
                        className={`relative flex items-center gap-3 text-slate-500 hover:bg-slate-50 p-2.5 transition ${pathname === link.href ? 'bg-slate-100 sm:text-slate-600' : ''}`}
                    >
                        <link.icon size={18} className="sm:ml-5" />
                        <p className="max-sm:hidden">{link.name}</p>
                        {pathname === link.href && <span className="absolute bg-slate-900 right-0 top-1.5 bottom-1.5 w-1 sm:w-1.5 rounded-l"></span>}
                    </Link>
                ))}
            </div>

            {/* Switch to /store */}
            <div className="mt-auto p-3 border-t border-slate-100 max-sm:hidden">
                <Link href="/store" className="flex items-center justify-between gap-2 text-xs text-slate-500 hover:text-slate-800 px-2 py-2 rounded transition">
                    <span>Switch to seller mode</span>
                    <ArrowUpRightIcon size={12} />
                </Link>
            </div>
        </div>
    )
}

export default ProSidebar
