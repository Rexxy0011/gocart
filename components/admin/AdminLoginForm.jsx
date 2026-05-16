import { redirect } from 'next/navigation'
import { Lock } from 'lucide-react'
import { checkAdminPassword, setAdminCookie } from '@/lib/auth/admin-pass'

// Login UI for the admin panel. Mounted inline on /admin when the
// password cookie isn't valid - same URL handles both the gate and the
// dashboard, so sharing a single link with a teammate "just works".

async function loginAction(formData) {
    'use server'
    const password = String(formData.get('password') || '')
    const next = String(formData.get('next') || '/admin')
    if (!checkAdminPassword(password)) {
        const params = new URLSearchParams({ err: '1', next })
        redirect(`/admin?${params.toString()}`)
    }
    await setAdminCookie()
    // Open-redirect guard - only allow internal paths.
    redirect(next.startsWith('/') ? next : '/admin')
}

const AdminLoginForm = ({ err, next }) => (
    <main className='min-h-[80vh] flex items-center justify-center px-6 bg-slate-50'>
        <form
            action={loginAction}
            className='w-full max-w-sm bg-white ring-1 ring-slate-200 rounded-2xl p-7 space-y-5 shadow-sm'
        >
            <div className='flex flex-col items-center text-center'>
                <span className='inline-flex items-center justify-center size-12 rounded-2xl bg-slate-900 text-white'>
                    <Lock size={20} />
                </span>
                <h1 className='text-xl font-semibold text-slate-900 mt-3'>Admin access</h1>
                <p className='text-sm text-slate-500 mt-1'>Enter the shared admin password.</p>
            </div>

            <input type='hidden' name='next' value={next || '/admin'} />

            <div>
                <input
                    type='password'
                    name='password'
                    required
                    autoFocus
                    autoComplete='current-password'
                    placeholder='Admin password'
                    className='w-full bg-white ring-1 ring-slate-200 rounded-full px-4 py-2.5 text-sm focus:ring-slate-400 outline-none transition'
                />
                {err && <p className='text-xs text-rose-600 mt-2'>Wrong password.</p>}
            </div>

            <button
                type='submit'
                className='w-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-full py-2.5 transition'
            >
                Sign in
            </button>

            <p className='text-[11px] text-slate-400 text-center'>
                Sessions last 24 hours. Rotating the password signs everyone out.
            </p>
        </form>
    </main>
)

export default AdminLoginForm
