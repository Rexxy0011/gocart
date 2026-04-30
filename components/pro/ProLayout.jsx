'use client'
import { usePathname } from "next/navigation"
import StoreNavbar from "../store/StoreNavbar"
import ProSidebar from "./ProSidebar"

// Layout for /pro/*. Server-side parent already gates access on application
// status — when we get here the user is either on /pro/apply (any state) or
// has an approved application (full dashboard).
const ProLayout = ({ children, application }) => {

    const pathname = usePathname()
    const isApplyRoute = pathname?.startsWith('/pro/apply')

    // /pro/apply uses a simpler shell — they're not yet fully a provider.
    if (isApplyRoute) {
        return (
            <div className="flex flex-col min-h-screen">
                <StoreNavbar />
                <main className="flex-1 overflow-y-auto">
                    {children}
                </main>
            </div>
        )
    }

    const providerInfo = application ? {
        name: application.full_name,
        primaryCategory: application.primary_category,
        location: application.location,
    } : null

    return (
        <div className="flex flex-col h-screen">
            <StoreNavbar />
            <div className="flex flex-1 items-start h-full overflow-y-scroll no-scrollbar">
                <ProSidebar providerInfo={providerInfo} />
                <div className="flex-1 h-full p-5 lg:pl-12 lg:pt-12 overflow-y-scroll">
                    {children}
                </div>
            </div>
        </div>
    )
}

export default ProLayout
