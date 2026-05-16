import AdminNavbar from "./AdminNavbar"
import AdminSidebar from "./AdminSidebar"

// Chrome wrapper for authenticated admin pages. The decision of whether
// to render this at all happens in app/admin/layout.jsx - when the
// password cookie isn't valid, that layout returns bare children
// instead, so the login form renders without admin nav around it.
const AdminLayout = ({ children }) => (
    <div className="flex flex-col h-screen">
        <AdminNavbar />
        <div className="flex flex-1 items-start h-full overflow-y-scroll no-scrollbar">
            <AdminSidebar />
            <div className="flex-1 h-full p-5 lg:pl-12 lg:pt-12 overflow-y-scroll">
                {children}
            </div>
        </div>
    </div>
)

export default AdminLayout
