'use client'
import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { Mail, Lock, User, ArrowRight, Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const safeNext = (raw) => (raw && raw.startsWith('/') && !raw.startsWith('//')) ? raw : '/'

function SignupForm() {

    const router = useRouter()
    const searchParams = useSearchParams()
    const next = safeNext(searchParams.get('next'))
    const supabase = createClient()

    const [form, setForm] = useState({ name: '', email: '', password: '' })
    const [showPassword, setShowPassword] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [errorMsg, setErrorMsg] = useState('')

    const onSubmit = async (e) => {
        e.preventDefault()
        setErrorMsg('')
        setSubmitting(true)

        const { data, error } = await supabase.auth.signUp({
            email: form.email.trim().toLowerCase(),
            password: form.password,
            options: {
                data: { name: form.name.trim() },
            },
        })

        if (error) {
            setErrorMsg(error.message)
            setSubmitting(false)
            return
        }

        // If "Confirm email" is enabled in Supabase, signUp returns no session
        // — the user has to click the email link before logging in. Tell them
        // that explicitly instead of dumping them on a still-signed-out page.
        if (!data.session) {
            toast.success('Check your email to confirm your account, then sign in.')
            router.push(next === '/' ? '/login' : `/login?next=${encodeURIComponent(next)}`)
            return
        }

        // Auto-signed in (email confirmation disabled). Full page nav so the
        // freshly-written auth cookie is sent on the next request.
        toast.success('Welcome to GoCart.')
        window.location.assign(next)
    }

    return (
        <div className='min-h-[80vh] flex items-center justify-center px-6 py-12'>
            <div className='w-full max-w-md'>
                <div className='text-center mb-8'>
                    <h1 className='text-2xl sm:text-3xl font-bold text-slate-900'>Create your account</h1>
                    <p className='text-sm text-slate-600 mt-2'>
                        Free forever. List your stuff, message buyers directly, no commission on offline deals.
                    </p>
                </div>

                <form onSubmit={onSubmit} className='space-y-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm'>
                    {errorMsg && (
                        <div className='bg-rose-50 ring-1 ring-rose-200 text-rose-800 text-sm rounded-lg px-3 py-2'>
                            {errorMsg}
                        </div>
                    )}

                    <label className='flex flex-col gap-1.5'>
                        <span className='text-sm font-medium text-slate-700'>Full name</span>
                        <div className='flex items-center gap-2 ring-1 ring-slate-200 rounded px-3 py-2.5 focus-within:ring-slate-400 transition'>
                            <User size={15} className='text-slate-400 shrink-0' />
                            <input
                                type='text'
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                placeholder='Your full name'
                                className='flex-1 text-sm bg-transparent outline-none placeholder-slate-400'
                                required
                                minLength={2}
                            />
                        </div>
                    </label>

                    <label className='flex flex-col gap-1.5'>
                        <span className='text-sm font-medium text-slate-700'>Email</span>
                        <div className='flex items-center gap-2 ring-1 ring-slate-200 rounded px-3 py-2.5 focus-within:ring-slate-400 transition'>
                            <Mail size={15} className='text-slate-400 shrink-0' />
                            <input
                                type='email'
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                placeholder='you@example.com'
                                className='flex-1 text-sm bg-transparent outline-none placeholder-slate-400'
                                required
                            />
                        </div>
                    </label>

                    <label className='flex flex-col gap-1.5'>
                        <span className='text-sm font-medium text-slate-700'>Password</span>
                        <div className='flex items-center gap-2 ring-1 ring-slate-200 rounded px-3 py-2.5 focus-within:ring-slate-400 transition'>
                            <Lock size={15} className='text-slate-400 shrink-0' />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={form.password}
                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                                placeholder='At least 6 characters'
                                className='flex-1 text-sm bg-transparent outline-none placeholder-slate-400'
                                required
                                minLength={6}
                            />
                            <button
                                type='button'
                                onClick={() => setShowPassword((s) => !s)}
                                className='text-slate-400 hover:text-slate-700'
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                        </div>
                    </label>

                    <button
                        type='submit'
                        disabled={submitting}
                        className='w-full inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white text-sm font-semibold rounded-full py-3 transition'
                    >
                        {submitting ? 'Creating account…' : 'Create account'}
                        {!submitting && <ArrowRight size={15} />}
                    </button>

                    <p className='text-xs text-slate-500 text-center pt-1'>
                        By signing up, you agree to our{' '}
                        <Link href='/safety' className='text-sky-700 hover:underline'>Safety guidelines</Link>{' '}
                        and{' '}
                        <Link href='/terms' className='text-sky-700 hover:underline'>Terms of Use</Link>.
                    </p>
                </form>

                <p className='text-sm text-slate-600 text-center mt-6'>
                    Already have an account?{' '}
                    <Link
                        href={next === '/' ? '/login' : `/login?next=${encodeURIComponent(next)}`}
                        className='text-sky-700 font-medium hover:underline'
                    >
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    )
}

export default function Signup() {
    return (
        <Suspense fallback={<div className='min-h-[80vh]' />}>
            <SignupForm />
        </Suspense>
    )
}
