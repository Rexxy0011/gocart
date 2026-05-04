import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail, boostExpiryReminderHtml } from '@/lib/email'
import { BOOST_CATALOG } from '@/lib/boosts'

// Daily cron — wakes at 09:00 UTC (10:00 Lagos), finds boosts that
// expire ~24h from now, mails the seller, stamps reminder_sent_at so we
// never double-mail.
//
// Vercel sends Authorization: Bearer $CRON_SECRET on cron invocations.
// We refuse anything else so curiosity probes can't spam users.

const ONE_HOUR = 60 * 60 * 1000
const REMIND_BEFORE_MS = 24 * ONE_HOUR
// Window is +/- 12h around the 24h mark. We run daily so this catches
// every paid boost exactly once between paid_at and expiry, regardless
// of when in the day the seller actually paid.
const WINDOW_MS = 12 * ONE_HOUR

const SITE_URL = (request) => new URL(request.url).origin

export async function GET(request) {
    const authHeader = request.headers.get('authorization')
    const expected = process.env.CRON_SECRET ? `Bearer ${process.env.CRON_SECRET}` : null
    if (expected && authHeader !== expected) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()

    // Pull every paid order that hasn't been reminded yet. We compute
    // expiry in JS rather than SQL because metadata.duration_days is
    // jsonb and casting to interval per-row is messier than a 50-row
    // filter loop in code. If this ever grows past a few thousand
    // pending reminders we move it server-side.
    const { data: orders, error: ordersErr } = await supabase
        .from('boost_orders')
        .select('id, user_id, listing_id, boost_key, paid_at, metadata')
        .eq('status', 'paid')
        .is('reminder_sent_at', null)
        .not('paid_at', 'is', null)

    if (ordersErr) {
        console.log('[boost-reminders] orders query failed', ordersErr)
        return NextResponse.json({ error: ordersErr.message }, { status: 500 })
    }
    if (!orders?.length) return NextResponse.json({ checked: 0, sent: 0 })

    const now = Date.now()
    const targetMin = now + REMIND_BEFORE_MS - WINDOW_MS  // expires in 12h or later
    const targetMax = now + REMIND_BEFORE_MS + WINDOW_MS  // and within 36h

    const dueOrders = orders.filter((o) => {
        const days = o.metadata?.duration_days || BOOST_CATALOG[o.boost_key]?.durationDays
        if (!days) return false
        const expiry = new Date(o.paid_at).getTime() + days * 24 * ONE_HOUR
        return expiry >= targetMin && expiry <= targetMax
    })

    if (!dueOrders.length) return NextResponse.json({ checked: orders.length, sent: 0 })

    // Batch-fetch listing names + seller email/name. One query each beats
    // N+1 round-trips when the cron picks up a busy day.
    const listingIds = [...new Set(dueOrders.map(o => o.listing_id))]
    const userIds = [...new Set(dueOrders.map(o => o.user_id))]

    const [{ data: listings }, { data: users }] = await Promise.all([
        supabase.from('products').select('id, name').in('id', listingIds),
        supabase.from('profiles').select('id, name, email').in('id', userIds),
    ])

    const listingById = new Map((listings || []).map(l => [l.id, l]))
    const userById    = new Map((users    || []).map(u => [u.id, u]))

    const manageUrl = `${SITE_URL(request)}/store/manage-product`

    let sent = 0, failed = 0
    for (const order of dueOrders) {
        const listing = listingById.get(order.listing_id)
        const user    = userById.get(order.user_id)
        if (!listing || !user?.email) {
            failed++
            continue
        }
        const days = order.metadata?.duration_days || BOOST_CATALOG[order.boost_key].durationDays
        const expiresAtIso = new Date(new Date(order.paid_at).getTime() + days * 24 * ONE_HOUR).toISOString()
        const boostLabel = BOOST_CATALOG[order.boost_key]?.label || order.boost_key

        try {
            await sendEmail({
                to: user.email,
                subject: `Your ${boostLabel} boost expires tomorrow`,
                html: boostExpiryReminderHtml({
                    name: user.name,
                    listingName: listing.name,
                    boostLabel,
                    expiresAtIso,
                    manageUrl,
                }),
                text: `Your ${boostLabel} boost on "${listing.name}" expires tomorrow. Renew at ${manageUrl} to stay at the top.`,
            })
            await supabase.from('boost_orders')
                .update({ reminder_sent_at: new Date().toISOString() })
                .eq('id', order.id)
            sent++
        } catch (err) {
            console.log('[boost-reminders] send failed', { orderId: order.id, err: err?.message })
            failed++
        }
    }

    return NextResponse.json({ checked: orders.length, due: dueOrders.length, sent, failed })
}
