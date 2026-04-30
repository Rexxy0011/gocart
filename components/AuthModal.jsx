'use client'
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { Mail, Lock, User, ArrowRight, Eye, EyeOff, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { closeAuthModal, setAuthModalMode } from '@/lib/features/ui/uiSlice'

// Single component that toggles between login and signup tabs. Mounted once
// in the public layout. Opens via dispatch(openAuthModal({...})), closes on
// successful auth or when the user dismisses it.
const AuthModal = () => {

    const router = useRouter()
    const dispatch = useDispatch()
    const supabase = createClient()
    const { open, mode, message } = useSelector(state => state.ui.authModal)

    const [form, setForm] = useState({ name: '', email: '', password: '' })
    const [showPassword, setShowPassword] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [errorMsg, setErrorMsg] = useState('')

    // Reset transient state whenever the modal toggles or mode switches
    useEffect(() => {
        if (!open) {
            setForm({ name: '', email: '', password: '' })
            setErrorMsg('')
            setShowPassword(false)
            setSubmitting(false)
        }
    }, [open])

    useEffect(() => {
        setErrorMsg('')
    }, [mode])

    // Esc to dismiss + lock body scroll while open
    useEffect(() => {
        if (!open) return
        const onKey = (e) => { if (e.key === 'Escape') dispatch(closeAuthModal()) }
        document.addEventListener('keydown', onKey)
        document.body.style.overflow = 'hidden'
        return () => {
            document.removeEventListener('keydown', onKey)
            document.body.style.overflow = ''
        }
    }, [open, dispatch])

    if (!open) return null

    const isSignup = mode === 'signup'

    const onSubmit = async (e) => {
        e.preventDefault()
        setErrorMsg('')
        setSubmitting(true)

        const email = form.email.trim().toLowerCase()
        const password = form.password

        const { error } = isSignup
            ? await supabase.auth.signUp({ email, password, options: { data: { name: form.name.trim() } } })
            : await supabase.auth.signInWithPassword({ email, password })

        if (error) {
            setErrorMsg(error.message)
            setSubmitting(false)
            return
        }

        toast.success(isSignup ? 'Account created — welcome.' : 'Welcome back.')
        dispatch(closeAuthModal())
        router.refresh()
    }

    return (
        <div
            className='fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4 py-6'
            onClick={() => dispatch(closeAuthModal())}
        >
            <div
                className='relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden'
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    type='button'
                    onClick={() => dispatch(closeAuthModal())}
                    aria-label='Close'
                    className='absolute top-3 right-3 size-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-700 transition'
                >
                    <X size={16} />
                </button>

                <div className='p-6 pt-7'>
                    <h2 className='text-xl font-bold text-slate-900'>
                        {isSignup ? 'Create your account' : 'Sign in to continue'}
                    </h2>
                    {message && (
                        <p className='text-sm text-slate-600 mt-2'>{message}</p>
                    )}

                    {/* Tabs */}
                    <div className='flex items-center gap-1 bg-slate-100 rounded-full p-1 mt-5'>
                        <button
                            type='button'
                            onClick={() => dispatch(setAuthModalMode('login'))}
                            className={`flex-1 text-sm font-medium rounded-full py-2 transition ${
                                !isSignup ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600 hover:text-slate-800'
                            }`}
                        >
                            Sign in
                        </button>
                        <button
                            type='button'
                            onClick={() => dispatch(setAuthModalMode('signup'))}
                            className={`flex-1 text-sm font-medium rounded-full py-2 transition ${
                                isSignup ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600 hover:text-slate-800'
                            }`}
                        >
                            Sign up
                        </button>
                    </div>

                    <form onSubmit={onSubmit} className='space-y-3 mt-5'>
                        {errorMsg && (
                            <div className='bg-rose-50 ring-1 ring-rose-200 text-rose-800 text-sm rounded-lg px-3 py-2'>
                                {errorMsg}
                            </div>
                        )}

                        {isSignup && (
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
                            <span className='text-sm font-medium text-slate-700'>Password</span>
                            <div className='flex items-center gap-2 ring-1 ring-slate-200 rounded px-3 py-2.5 focus-within:ring-slate-400 transition'>
                                <Lock size={15} className='text-slate-400 shrink-0' />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={form.password}
                                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                                    placeholder={isSignup ? 'At least 6 characters' : 'Your password'}
                                    className='flex-1 text-sm bg-transparent outline-none placeholder-slate-400'
                                    required
                                    minLength={isSignup ? 6 : undefined}
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
                            className='w-full inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white text-sm font-semibold rounded-full py-2.5 transition mt-2'
                        >
                            {submitting
                                ? (isSignup ? 'Creating…' : 'Signing in…')
                                : (isSignup ? 'Create account' : 'Sign in')}
                            {!submitting && <ArrowRight size={15} />}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default AuthModal
