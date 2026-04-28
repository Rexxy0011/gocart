'use client'
import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useSelector } from "react-redux"
import StoreNavbar from "../store/StoreNavbar"
import ProSidebar from "./ProSidebar"
import Loading from "../Loading"

// Demo mock — providerInfo would come from auth context.
const DEMO_PROVIDER_INFO = {
    name: 'Tunde Adebayo',
    username: 'quickfix',
    primaryCategory: 'Plumbing',
}

const ProLayout = ({ children }) => {

    const pathname = usePathname()
    const router = useRouter()
    const status = useSelector(state => state.provider.status)

    const isApplyRoute = pathname?.startsWith('/pro/apply')

    // Anyone landing on /pro/* without verification is bounced to /pro/apply.
    // /pro/apply itself is always reachable.
    useEffect(() => {
        if (!isApplyRoute && status !== 'verified') {
            router.replace('/pro/apply')
        }
    }, [isApplyRoute, status, router])

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

    // While the redirect is in-flight, show the loading shell instead of
    // flashing the dashboard contents to an unverified user.
    if (status !== 'verified') return <Loading />

    return (
        <div className="flex flex-col h-screen">
            <StoreNavbar />
            <div className="flex flex-1 items-start h-full overflow-y-scroll no-scrollbar">
                <ProSidebar providerInfo={DEMO_PROVIDER_INFO} />
                <div className="flex-1 h-full p-5 lg:pl-12 lg:pt-12 overflow-y-scroll">
                    {children}
                </div>
            </div>
        </div>
    )
}

export default ProLayout
