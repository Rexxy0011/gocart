'use client'
import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import { Mail, Phone, CheckCircle2, Loader2, ArrowRight, ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// Tier-1 verification UI. Two stops, both backed by Supabase Auth:
//   - Email: Supabase already sent the confirmation link on signup.
//     We poll for it and resend on demand.
//   - Phone: Supabase's native phone-auth flow (Twilio under the hood,
//     configured at Authentication → Providers → Phone in the dashboard).
//     updateUser({ phone }) sends the OTP; verifyOtp confirms it.
//
// When both flip green we play a 1.2s "all set" animation and hard-nav
// to the user's next URL. Hard nav forces middleware to re-evaluate
// against the freshly-updated session.
const VerifyClient = ({ email, emailVerified: initialEmailVerified, phone: initialPhone, phoneVerified: initialPhoneVerified, nextUrl }) => {

    const supabase = createClient()
    const [emailVerified, setEmailVerified] = useState(initialEmailVerified)
    const [phoneVerified, setPhoneVerified] = useState(initialPhoneVerified)
    const [resendingEmail, setResendingEmail] = useState(false)

    // Phone form state. otpSent flips true once the SMS goes out so we
    // swap the UI from "send code" to "enter code".
    const [phone, setPhone] = useState(initialPhone || '+234')
    const [code, setCode] = useState('')
    const [otpSent, setOtpSent] = useState(false)
    const [sendingOtp, setSendingOtp] = useState(false)
    const [verifyingOtp, setVerifyingOtp] = useState(false)

    const [completing, setCompleting] = useState(false)

    // Poll Supabase for email confirmation. The user clicks the link in
    // their inbox on whatever device — this page just refreshes the local
    // view so they see green without manually reloading.
    useEffect(() => {
        if (emailVerified) return
        const interval = setInterval(async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user?.email_confirmed_at) setEmailVerified(true)
        }, 5000)
        return () => clearInterval(interval)
    }, [emailVerified, supabase])

    // When both flip true, fade into the success state and hard-nav so
    // middleware re-evaluates with the new phone_confirmed_at on the user.
    useEffect(() => {
        if (emailVerified && phoneVerified && !completing) {
            setCompleting(true)
            const t = setTimeout(() => { window.location.assign(nextUrl) }, 1200)
            return () => clearTimeout(t)
        }
    }, [emailVerified, phoneVerified, completing, nextUrl])

    const onResendEmail = async () => {
        setResendingEmail(true)
        const { error } = await supabase.auth.resend({ type: 'signup', email })
        setResendingEmail(false)
        if (error) toast.error(error.message)
        else toast.success('Confirmation email re-sent.')
    }

    const onSendOtp = async (e) => {
        e.preventDefault()
        if (sendingOtp) return
        if (!phone || phone.length < 8 || !phone.startsWith('+')) {
            toast.error('Use international format with + (e.g. +234801…).')
            return
        }
        setSendingOtp(true)
        // updateUser({ phone }) initiates a phone change on the existing
        // email-authenticated user. Supabase generates the OTP, sends it
        // via the configured Twilio provider, and waits for verifyOtp.
        const { error } = await supabase.auth.updateUser({ phone })
        setSendingOtp(false)
        if (error) {
            toast.error(error.message)
            return
        }
        setOtpSent(true)
        toast.success('Code sent. Check your messages.')
    }

    const onVerifyOtp = async (e) => {
        e.preventDefault()
        if (verifyingOtp) return
        if (!/^\d{6}$/.test(code)) {
            toast.error('Enter the 6-digit code.')
            return
        }
        setVerifyingOtp(true)
        // type: 'phone_change' confirms the OTP for the phone field that
        // updateUser() initiated. On success the session is refreshed
        // with phone_confirmed_at set on the user record.
        const { error } = await supabase.auth.verifyOtp({
            phone,
            token: code,
            type: 'phone_change',
        })
        setVerifyingOtp(false)
        if (error) {
            toast.error(error.message || 'Code didn\'t match.')
            return
        }
        setPhoneVerified(true)
        toast.success('Phone verified.')
    }

    const bothDone = emailVerified && phoneVerified
    const progress = (emailVerified ? 50 : 0) + (phoneVerified ? 50 : 0)

    return (
        <main className="max-w-xl mx-auto px-6 py-14">
            <div className="text-center mb-8">
                <span className="inline-flex items-center justify-center size-12 rounded-full bg-sky-50 ring-1 ring-sky-200 text-sky-700 mb-4">
                    <ShieldCheck size={22} />
                </span>
                <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900">Verify your account</h1>
                <p className="text-sm text-slate-600 mt-2">
                    Two quick steps so other users know you&apos;re real. Both are required to post listings or message sellers.
                </p>
            </div>

            {/* Progress bar */}
            <div className="mb-8">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                    <span>{progress}% complete</span>
                    {bothDone && <span className="text-emerald-600 font-medium">All set — redirecting…</span>}
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-sky-500 to-emerald-500 transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Email card */}
            <section className={`bg-white ring-1 ring-slate-200 rounded-2xl p-5 mb-4 transition ${emailVerified ? 'opacity-70' : ''}`}>
                <div className="flex items-start gap-4">
                    <span className={`inline-flex items-center justify-center size-10 rounded-full shrink-0 ${emailVerified ? 'bg-emerald-50 ring-1 ring-emerald-200 text-emerald-600' : 'bg-slate-50 ring-1 ring-slate-200 text-slate-500'}`}>
                        {emailVerified ? <CheckCircle2 size={18} /> : <Mail size={18} />}
                    </span>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900">Email</p>
                        <p className="text-xs text-slate-500 mt-0.5 truncate">{email}</p>
                        {emailVerified ? (
                            <p className="text-xs text-emerald-600 font-medium mt-2">Confirmed</p>
                        ) : (
                            <>
                                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                                    We sent a confirmation link. Click it from your inbox — this page updates automatically.
                                </p>
                                <button
                                    type="button"
                                    onClick={onResendEmail}
                                    disabled={resendingEmail}
                                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-sky-700 hover:underline disabled:opacity-60"
                                >
                                    {resendingEmail ? <Loader2 size={12} className="animate-spin" /> : null}
                                    Resend confirmation email
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </section>

            {/* Phone card */}
            <section className={`bg-white ring-1 ring-slate-200 rounded-2xl p-5 mb-6 transition ${phoneVerified ? 'opacity-70' : ''}`}>
                <div className="flex items-start gap-4">
                    <span className={`inline-flex items-center justify-center size-10 rounded-full shrink-0 ${phoneVerified ? 'bg-emerald-50 ring-1 ring-emerald-200 text-emerald-600' : 'bg-slate-50 ring-1 ring-slate-200 text-slate-500'}`}>
                        {phoneVerified ? <CheckCircle2 size={18} /> : <Phone size={18} />}
                    </span>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900">Phone</p>
                        {phoneVerified ? (
                            <>
                                <p className="text-xs text-slate-500 mt-0.5 truncate">{initialPhone || phone}</p>
                                <p className="text-xs text-emerald-600 font-medium mt-2">Verified</p>
                            </>
                        ) : !otpSent ? (
                            <form onSubmit={onSendOtp} className="mt-2">
                                <p className="text-xs text-slate-600 leading-relaxed mb-3">
                                    Enter your phone in international format. We&apos;ll send a 6-digit code by SMS.
                                </p>
                                <div className="flex gap-2">
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="+2348012345678"
                                        autoComplete="tel"
                                        className="flex-1 text-sm bg-white ring-1 ring-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-slate-400 transition"
                                        required
                                    />
                                    <button
                                        type="submit"
                                        disabled={sendingOtp}
                                        className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-lg px-4 py-2 transition disabled:opacity-60"
                                    >
                                        {sendingOtp ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
                                        Send code
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <form onSubmit={onVerifyOtp} className="mt-2">
                                <p className="text-xs text-slate-600 leading-relaxed mb-3">
                                    Code sent to <span className="font-medium text-slate-900">{phone}</span>.
                                    Enter the 6 digits below.
                                </p>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        pattern="\d{6}"
                                        maxLength={6}
                                        value={code}
                                        onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        placeholder="123456"
                                        className="flex-1 text-sm bg-white ring-1 ring-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-slate-400 transition tracking-widest text-center"
                                        autoFocus
                                        required
                                    />
                                    <button
                                        type="submit"
                                        disabled={verifyingOtp || code.length !== 6}
                                        className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-lg px-4 py-2 transition disabled:opacity-60"
                                    >
                                        {verifyingOtp ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                                        Verify
                                    </button>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => { setOtpSent(false); setCode('') }}
                                    className="mt-2 text-xs text-slate-500 hover:underline"
                                >
                                    Use a different number
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </section>

            <p className="text-xs text-slate-400 text-center">
                We never share your phone with buyers. It&apos;s used only for verification and account recovery.
            </p>
        </main>
    )
}

export default VerifyClient
