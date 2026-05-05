import { redirect } from 'next/navigation'
import { Lock } from 'lucide-react'
import { checkAdminPassword, setAdminCookie } from '@/lib/auth/admin-pass'

export const metadata = { title: 'Admin login — GoCart' }

// Server action — runs in the same request, so we can set the cookie
// and redirect inside it without a round-trip.
async function loginAction(formData) {
    'use server'
    const password = String(formData.get('password') || '')
    const next = String(formData.get('next') || '/admin')
    if (!checkAdminPassword(password)) {
        // Pass next through so the user lands where they were heading
        // after a correct retry.
        const params = new URLSearchParams({ err: '1', next })
        redirect(`/admin/login?${params.toString()}`)
    }
    await setAdminCookie()
    // Only redirect to internal paths to prevent open-redirect abuse.
    redirect(next.startsWith('/') ? next : '/admin')
}

export default async function AdminLoginPage({ searchParams }) {
    const sp = await searchParams
    const err = sp?.err === '1'
    const next = typeof sp?.next === 'string' ? sp.next : '/admin'

    return (
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

                <input type='hidden' name='next' value={next} />

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
}
