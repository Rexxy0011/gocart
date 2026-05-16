'use server'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail, welcomeEmailHtml, signinAlertHtml, adminNewUserHtml } from '@/lib/email'

// Origin of the current request - works on localhost, previews, and prod
// without a per-environment env var. Falls back to NEXT_PUBLIC_SITE_URL.
const resolveSiteUrl = async () => {
    try {
        const h = await headers()
        const host = h.get('x-forwarded-host') || h.get('host')
        const proto = h.get('x-forwarded-proto') || (host?.startsWith('localhost') ? 'http' : 'https')
        if (host) return `${proto}://${host}`
    } catch {}
    return (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')
}

// Fire transactional email on an auth event. The client calls this right
// after a successful signUp / signInWithPassword.
//
// The user is identified from the freshly-established server session -
// NEVER from a client argument - so this can't be used to spam arbitrary
// addresses (the worst an attacker can do is mail their own inbox).
//
// Every failure is swallowed: a flaky Resend call must never break auth.
//
// `event` is 'signup' | 'signin' - it only selects the sign-in alert; the
// welcome path is gated on a metadata flag, not the event.
export async function notifyAuthEvent(event) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        // No session yet - e.g. signup with "Confirm email" on. Nothing we
        // can securely send; the welcome goes out on the first signed-in
        // event instead (handled by the `welcomed` flag below).
        if (!user?.email) return

        const name = user.user_metadata?.name || ''
        const siteUrl = await resolveSiteUrl()

        // Welcome + admin alert - exactly once per user, on the first event
        // that carries a session. The `welcomed` flag on the auth user's
        // metadata is the idempotency guard.
        if (!user.user_metadata?.welcomed) {
            await sendEmail({
                to: user.email,
                subject: 'Welcome to Kakimart',
                html: welcomeEmailHtml({ name, siteUrl }),
                text: `Welcome to Kakimart - your account is live. Browse listings at ${siteUrl}/shop`,
            })
            // Stamp the flag as soon as the welcome lands so a later failure
            // can't cause a duplicate welcome on the next event.
            const admin = createAdminClient()
            await admin.auth.admin.updateUserById(user.id, {
                user_metadata: { ...user.user_metadata, welcomed: true },
            })

            // Admin growth ping - best-effort, never blocks the user path.
            const adminTo = process.env.ADMIN_NOTIFY_EMAIL
            if (adminTo) {
                try {
                    await sendEmail({
                        to: adminTo,
                        subject: `New Kakimart signup: ${user.email}`,
                        html: adminNewUserHtml({ name, email: user.email, atIso: new Date().toISOString() }),
                    })
                } catch (err) {
                    console.log('[notifyAuthEvent] admin alert failed', err?.message)
                }
            }
            return
        }

        // Returning sign-in → security alert.
        if (event === 'signin') {
            const h = await headers()
            const ip = (h.get('x-forwarded-for') || '').split(',')[0].trim()
            const device = h.get('user-agent') || ''
            await sendEmail({
                to: user.email,
                subject: 'New sign-in to your Kakimart account',
                html: signinAlertHtml({
                    name,
                    atIso: new Date().toISOString(),
                    ip: ip || 'unknown',
                    device: device || 'an unrecognised device',
                    siteUrl,
                }),
            })
        }
    } catch (err) {
        console.log('[notifyAuthEvent] failed', err?.message)
    }
}
