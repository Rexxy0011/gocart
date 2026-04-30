'use client'
import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// Only allow same-origin paths in `next` to avoid open-redirect attacks.
const safeNext = (raw) => (raw && raw.startsWith('/') && !raw.startsWith('//')) ? raw : '/'

function LoginForm() {

    const router = useRouter()
    const searchParams = useSearchParams()
    const next = safeNext(searchParams.get('next'))
    const supabase = createClient()

    const [form, setForm] = useState({ email: '', password: '' })
    const [showPassword, setShowPassword] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [errorMsg, setErrorMsg] = useState('')

    const onSubmit = async (e) => {
        e.preventDefault()
        setErrorMsg('')
        setSubmitting(true)

        const { error } = await supabase.auth.signInWithPassword({
            email: form.email.trim().toLowerCase(),
            password: form.password,
        })

        if (error) {
            setErrorMsg(error.message)
            setSubmitting(false)
            return
        }

        toast.success('Welcome back.')
        router.push(next)
        router.refresh()
    }

    return (
        <div className='min-h-[80vh] flex items-center justify-center px-6 py-12'>
            <div className='w-full max-w-md'>
                <div className='text-center mb-8'>
                    <h1 className='text-2xl sm:text-3xl font-bold text-slate-900'>Sign in</h1>
                    <p className='text-sm text-slate-600 mt-2'>
                        Pick up where you left off.
                    </p>
                </div>

                <form onSubmit={onSubmit} className='space-y-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm'>
                    {errorMsg && (
                        <div className='bg-rose-50 ring-1 ring-rose-200 text-rose-800 text-sm rounded-lg px-3 py-2'>
                            {errorMsg}
                        </div>
                    )}

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
                                autoFocus
                            />
                        </div>
                    </label>

                    <label className='flex flex-col gap-1.5'>
                        <div className='flex items-center justify-between'>
                            <span className='text-sm font-medium text-slate-700'>Password</span>
                            <Link href='/forgot' className='text-xs text-sky-700 hover:underline'>Forgot?</Link>
                        </div>
                        <div className='flex items-center gap-2 ring-1 ring-slate-200 rounded px-3 py-2.5 focus-within:ring-slate-400 transition'>
                            <Lock size={15} className='text-slate-400 shrink-0' />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={form.password}
                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                                placeholder='Your password'
                                className='flex-1 text-sm bg-transparent outline-none placeholder-slate-400'
                                required
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
                        {submitting ? 'Signing in…' : 'Sign in'}
                        {!submitting && <ArrowRight size={15} />}
                    </button>
                </form>

                <p className='text-sm text-slate-600 text-center mt-6'>
                    New here?{' '}
                    <Link
                        href={next === '/' ? '/signup' : `/signup?next=${encodeURIComponent(next)}`}
                        className='text-sky-700 font-medium hover:underline'
                    >
                        Create an account
                    </Link>
                </p>
            </div>
        </div>
    )
}

export default function Login() {
    return (
        <Suspense fallback={<div className='min-h-[80vh]' />}>
            <LoginForm />
        </Suspense>
    )
}
