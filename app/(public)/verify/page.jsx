import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import VerifyClient from './VerifyClient'

// /verify finishes Tier-1 verification: email + phone OTP.
// Middleware bounces unverified users here; once both checks pass we
// hard-nav them on to whatever they were trying to do.
//
// Source of truth for both verifications is auth.users:
//   - email_confirmed_at  → email verified
//   - phone_confirmed_at  → phone verified (Supabase native phone auth via
//                            the Twilio provider configured in dashboard)
export default async function VerifyPage({ searchParams }) {

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const sp = await searchParams

    if (!user) {
        const next = sp?.next ? `?next=${encodeURIComponent(sp.next)}` : ''
        redirect(`/login${next}`)
    }

    const nextUrl = sp?.next || '/'

    const emailVerified = !!user.email_confirmed_at
    const phoneVerified = !!user.phone_confirmed_at

    // Already fully verified — they got here by accident, send them on.
    if (emailVerified && phoneVerified) {
        redirect(nextUrl)
    }

    return (
        <VerifyClient
            email={user.email}
            emailVerified={emailVerified}
            phone={user.phone || ''}
            phoneVerified={phoneVerified}
            nextUrl={nextUrl}
        />
    )
}
