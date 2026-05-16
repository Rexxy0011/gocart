import { isAdminAuthenticated } from '@/lib/auth/admin-pass'
import AdminLayout from '@/components/admin/AdminLayout'

export const metadata = {
    title: 'Kakimart. - Admin',
    description: 'Kakimart. - Admin',
}

// Render bare children when the visitor is not yet authenticated - this is
// what makes /admin double as the login page (no admin nav/sidebar around
// the password form). Once the cookie is valid, wrap with the chrome.
export default async function RootAdminLayout({ children }) {

    const authed = await isAdminAuthenticated()
    if (!authed) return <>{children}</>

    return (
        <AdminLayout>
            {children}
        </AdminLayout>
    )
}
