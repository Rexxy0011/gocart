import Link from "next/link"
import { LogOut } from "lucide-react"
import { adminSignOut } from "@/app/actions/admin"

const AdminNavbar = () => {

    return (
        <div className="flex items-center justify-between px-12 py-3 border-b border-slate-200 transition-all">
            <Link href="/" className="relative text-4xl font-semibold text-slate-700">
                <span className="text-slate-900">go</span>cart<span className="text-slate-900 text-5xl leading-0">.</span>
                <p className="absolute text-xs font-semibold -top-1 -right-13 px-3 p-0.5 rounded-full flex items-center gap-2 text-white bg-slate-900">
                    Admin
                </p>
            </Link>
            <div className="flex items-center gap-3">
                <p className="text-sm text-slate-600">Hi, Admin</p>
                <form action={adminSignOut}>
                    <button
                        type="submit"
                        title="Sign out of admin"
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 ring-1 ring-slate-200 hover:ring-slate-400 rounded-full px-3 py-1.5 transition"
                    >
                        <LogOut size={12} /> Sign out
                    </button>
                </form>
            </div>
        </div>
    )
}

export default AdminNavbar