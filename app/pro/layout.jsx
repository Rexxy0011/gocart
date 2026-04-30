import { headers } from "next/headers"
import { redirect } from "next/navigation"
import ProLayout from "@/components/pro/ProLayout"
import { createClient } from "@/lib/supabase/server"

export const metadata = {
    title: "GoCart. - Provider Dashboard",
    description: "GoCart. - Provider Dashboard",
}

export default async function ProRootLayout({ children }) {

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: application } = await supabase
        .from('provider_applications')
        .select('id, status, full_name, phone, primary_category, location, rejection_reason')
        .eq('user_id', user.id)
        .maybeSingle()

    const headerList = await headers()
    const pathname = headerList.get('x-pathname') || ''
    const isApplyRoute = pathname === '/pro/apply' || pathname.startsWith('/pro/apply/')

    // Anyone hitting /pro/* without an approved application is bounced to
    // /pro/apply. /pro/apply itself stays reachable so they can submit /
    // resubmit / see their pending or rejected status.
    if (!isApplyRoute && application?.status !== 'approved') {
        redirect('/pro/apply')
    }

    return <ProLayout application={application}>{children}</ProLayout>
}
