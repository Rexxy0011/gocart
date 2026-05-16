import { isAdminAuthenticated } from '@/lib/auth/admin-pass'
import AdminLoginForm from '@/components/admin/AdminLoginForm'
import AdminDashboardView from '@/components/admin/AdminDashboardView'

// Single URL for the admin entrypoint - cookie present and valid → see
// the dashboard; missing or stale → see the password form. The layout
// (app/admin/layout.jsx) makes the same check and decides whether to
// wrap with admin chrome.
export default async function AdminEntry({ searchParams }) {
    const sp = await searchParams
    if (!(await isAdminAuthenticated())) {
        return <AdminLoginForm err={sp?.err === '1'} next={typeof sp?.next === 'string' ? sp.next : '/admin'} />
    }
    return <AdminDashboardView />
}
