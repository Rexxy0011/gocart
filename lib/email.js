// Server-only email helpers. We use Resend - free 3k/month, made for
// transactional mail. Never import this from a client component (the API
// key is server-only and the SDK pulls in Node-specific deps).

import { Resend } from 'resend'

const FROM = process.env.RESEND_FROM_EMAIL || 'Kakimart <onboarding@resend.dev>'

const client = () => {
    const key = process.env.RESEND_API_KEY
    if (!key) throw new Error('Missing RESEND_API_KEY')
    return new Resend(key)
}

// Plain HTML mail. Resend takes either `html` or `react`; we keep it as
// a string so we don't pull react-email into the bundle.
export async function sendEmail({ to, subject, html, text }) {
    const resend = client()
    const { data, error } = await resend.emails.send({
        from: FROM,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        text,
    })
    if (error) throw new Error(error.message || 'Resend send failed')
    return data
}

// T-24h boost-expiry reminder. CTA points back to /store/manage-product
// where the seller can re-buy the same boost in two clicks.
export function boostExpiryReminderHtml({ name, listingName, boostLabel, expiresAtIso, manageUrl }) {
    const safeName = (name || 'there').split(' ')[0]
    const expiresPretty = new Date(expiresAtIso).toLocaleString('en-NG', {
        timeZone: 'Africa/Lagos',
        weekday: 'short', month: 'short', day: 'numeric',
        hour: 'numeric', minute: '2-digit',
    })
    return `
<!doctype html>
<html>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
    <div style="background:#fff;border-radius:14px;padding:32px;border:1px solid #e2e8f0;">
      <h1 style="margin:0 0 16px;font-size:20px;color:#0f172a;">Hey ${safeName},</h1>
      <p style="margin:0 0 16px;color:#334155;line-height:1.55;">
        Your <strong>${boostLabel}</strong> boost on <strong>${listingName}</strong> expires <strong>${expiresPretty}</strong> - about 24 hours from now.
      </p>
      <p style="margin:0 0 24px;color:#334155;line-height:1.55;">
        Renew before it ends to stay at the top of the feed without a gap. Buyers tend to scroll the first 30 listings - falling out of those costs views fast.
      </p>
      <p style="margin:0 0 24px;">
        <a href="${manageUrl}"
           style="display:inline-block;background:#0f172a;color:#fff;text-decoration:none;padding:11px 20px;border-radius:9999px;font-weight:600;font-size:14px;">
          Renew this boost →
        </a>
      </p>
      <p style="margin:0;color:#64748b;font-size:13px;line-height:1.5;">
        Not ready to renew? No action needed - your listing stays up, just without the boost badge.
      </p>
    </div>
    <p style="text-align:center;color:#94a3b8;font-size:12px;margin-top:24px;">
      Kakimart · You're receiving this because you boosted a listing.
    </p>
  </div>
</body>
</html>`.trim()
}

// ─── Shared helpers for the auth emails below ──────────────────────────────

// Escape user-supplied strings before interpolating into HTML.
const esc = (s) => String(s ?? '').replace(/[<>&]/g, (c) => (
    { '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]
))

const firstNameOf = (name) => esc((name || 'there').trim().split(/\s+/)[0] || 'there')

const lagosTime = (iso) => new Date(iso).toLocaleString('en-NG', {
    timeZone: 'Africa/Lagos',
    weekday: 'short', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
})

// Card-on-grey shell shared by the auth emails.
const emailShell = (bodyHtml, footer = 'Kakimart - buy and sell anything.') => `
<!doctype html>
<html>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
    <div style="background:#fff;border-radius:14px;padding:32px;border:1px solid #e2e8f0;">
      ${bodyHtml}
    </div>
    <p style="text-align:center;color:#94a3b8;font-size:12px;margin-top:24px;">${footer}</p>
  </div>
</body>
</html>`.trim()

// Sent once, on a new user's first signed-in event.
export function welcomeEmailHtml({ name, siteUrl }) {
    return emailShell(`
      <h1 style="margin:0 0 16px;font-size:20px;color:#0f172a;">Welcome to Kakimart, ${firstNameOf(name)}</h1>
      <p style="margin:0 0 16px;color:#334155;line-height:1.55;">
        Your account is live. Kakimart is an open marketplace - post anything you
        want to sell, message buyers and sellers directly, and save listings you
        like. No commission on offline deals.
      </p>
      <p style="margin:0 0 24px;">
        <a href="${esc(siteUrl)}/shop"
           style="display:inline-block;background:#0f172a;color:#fff;text-decoration:none;padding:11px 20px;border-radius:9999px;font-weight:600;font-size:14px;">
          Start browsing →
        </a>
      </p>
      <p style="margin:0;color:#64748b;font-size:13px;line-height:1.5;">
        Got something to sell? Posting an ad takes about a minute.
      </p>
    `)
}

// Security notice - sent on a returning sign-in.
export function signinAlertHtml({ name, atIso, ip, device, siteUrl }) {
    const row = (label, value) => `
      <tr>
        <td style="padding:6px 0;color:#64748b;">${label}</td>
        <td style="padding:6px 0;text-align:right;color:#334155;">${esc(value)}</td>
      </tr>`
    return emailShell(`
      <h1 style="margin:0 0 16px;font-size:20px;color:#0f172a;">New sign-in to your account</h1>
      <p style="margin:0 0 16px;color:#334155;line-height:1.55;">
        Hi ${firstNameOf(name)}, your Kakimart account was just signed in.
      </p>
      <table style="width:100%;border-collapse:collapse;margin:0 0 20px;font-size:14px;">
        ${row('When', lagosTime(atIso))}
        ${row('IP address', ip)}
        ${row('Device', device)}
      </table>
      <p style="margin:0 0 8px;color:#334155;line-height:1.55;">If this was you, no action is needed.</p>
      <p style="margin:0;color:#64748b;font-size:13px;line-height:1.5;">
        Don't recognise it? Change your password right away from
        <a href="${esc(siteUrl)}/login" style="color:#0f172a;">the sign-in page</a>.
      </p>
    `, 'Kakimart - security notification.')
}

// Internal - pings the admin when a new user registers.
export function adminNewUserHtml({ name, email, atIso }) {
    const row = (label, value) => `
      <tr>
        <td style="padding:6px 0;color:#64748b;">${label}</td>
        <td style="padding:6px 0;text-align:right;color:#334155;">${esc(value)}</td>
      </tr>`
    return emailShell(`
      <h1 style="margin:0 0 16px;font-size:20px;color:#0f172a;">New Kakimart signup</h1>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        ${row('Name', name || '-')}
        ${row('Email', email)}
        ${row('Registered', lagosTime(atIso))}
      </table>
    `, 'Kakimart - admin notification.')
}
