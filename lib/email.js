// Server-only email helpers. We use Resend — free 3k/month, made for
// transactional mail. Never import this from a client component (the API
// key is server-only and the SDK pulls in Node-specific deps).

import { Resend } from 'resend'

const FROM = process.env.RESEND_FROM_EMAIL || 'GoCart <onboarding@resend.dev>'

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
        Your <strong>${boostLabel}</strong> boost on <strong>${listingName}</strong> expires <strong>${expiresPretty}</strong> — about 24 hours from now.
      </p>
      <p style="margin:0 0 24px;color:#334155;line-height:1.55;">
        Renew before it ends to stay at the top of the feed without a gap. Buyers tend to scroll the first 30 listings — falling out of those costs views fast.
      </p>
      <p style="margin:0 0 24px;">
        <a href="${manageUrl}"
           style="display:inline-block;background:#0f172a;color:#fff;text-decoration:none;padding:11px 20px;border-radius:9999px;font-weight:600;font-size:14px;">
          Renew this boost →
        </a>
      </p>
      <p style="margin:0;color:#64748b;font-size:13px;line-height:1.5;">
        Not ready to renew? No action needed — your listing stays up, just without the boost badge.
      </p>
    </div>
    <p style="text-align:center;color:#94a3b8;font-size:12px;margin-top:24px;">
      GoCart · You're receiving this because you boosted a listing.
    </p>
  </div>
</body>
</html>`.trim()
}
