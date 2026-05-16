import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail, boostExpiryReminderHtml } from '@/lib/email'
import { BOOST_CATALOG } from '@/lib/boosts'

// Daily cron - wakes at 09:00 UTC (10:00 Lagos), finds boosts that expire
// ~24h from now, mails the seller, stamps reminder_sent_at so we never
// double-mail.
//
// Expiry is read from the listing's real *_until columns - the same
// timestamps the buyer feeds and the expire_boosts cron use - NOT from
// paid_at + duration_days, which drifts by the verify latency and, on a
// renewal, leaves the old order pointing at a stale expiry.
//
// Reminders are deduped per listing: if a listing has several paid orders
// (e.g. an original + a renewal) only one email goes out and every one of
// its pending orders is stamped.
//
// Vercel sends Authorization: Bearer $CRON_SECRET on cron invocations.
// We refuse anything else so curiosity probes can't spam users.

const ONE_HOUR = 60 * 60 * 1000
const REMIND_BEFORE_MS = 24 * ONE_HOUR
// Window is +/- 12h around the 24h mark. We run daily so this catches
// every boost exactly once between its application and expiry.
const WINDOW_MS = 12 * ONE_HOUR

// Which listing column carries the expiry for each boost key.
const BOOST_UNTIL_COLUMN = {
    bump:      'bumped_until',
    featured:  'featured_until',
    urgent:    'urgent_until',
    bulk_sale: 'bulk_sale_until',
}

// The real expiry (ms) for an order, read off the listing row. `bundle`
// sets featured/urgent/bump together - take the latest of the three.
const expiryForOrder = (order, listing) => {
    if (order.boost_key === 'bundle') {
        const stamps = [listing.featured_until, listing.urgent_until, listing.bumped_until]
            .filter(Boolean)
            .map(t => new Date(t).getTime())
        return stamps.length ? Math.max(...stamps) : null
    }
    const col = BOOST_UNTIL_COLUMN[order.boost_key]
    const value = col ? listing[col] : null
    return value ? new Date(value).getTime() : null
}

const SITE_URL = (request) => new URL(request.url).origin

export async function GET(request) {
    const authHeader = request.headers.get('authorization')
    const expected = process.env.CRON_SECRET ? `Bearer ${process.env.CRON_SECRET}` : null
    if (expected && authHeader !== expected) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()

    // Every paid order that hasn't been reminded yet.
    const { data: orders, error: ordersErr } = await supabase
        .from('boost_orders')
        .select('id, user_id, listing_id, boost_key')
        .eq('status', 'paid')
        .is('reminder_sent_at', null)

    if (ordersErr) {
        console.log('[boost-reminders] orders query failed', ordersErr)
        return NextResponse.json({ error: ordersErr.message }, { status: 500 })
    }
    if (!orders?.length) return NextResponse.json({ checked: 0, sent: 0 })

    // Batch-fetch the listings' real boost expiry timestamps + names.
    const listingIds = [...new Set(orders.map(o => o.listing_id))]
    const { data: listings } = await supabase
        .from('products')
        .select('id, name, featured_until, urgent_until, bulk_sale_until, bumped_until')
        .in('id', listingIds)
    const listingById = new Map((listings || []).map(l => [l.id, l]))

    const now = Date.now()
    const targetMin = now + REMIND_BEFORE_MS - WINDOW_MS  // expires in 12h or later
    const targetMax = now + REMIND_BEFORE_MS + WINDOW_MS  // and within 36h

    // Group due orders by listing - one reminder per listing, but every
    // pending order on that listing gets stamped so a renewal order can't
    // trigger a second email for the same expiry.
    const dueByListing = new Map()
    for (const order of orders) {
        const listing = listingById.get(order.listing_id)
        if (!listing) continue
        const expiry = expiryForOrder(order, listing)
        if (expiry == null) continue                       // boost already expired / not applied
        if (expiry < targetMin || expiry > targetMax) continue

        let entry = dueByListing.get(order.listing_id)
        if (!entry) {
            entry = { listing, expiry, boostKey: order.boost_key, userId: order.user_id, orderIds: [] }
            dueByListing.set(order.listing_id, entry)
        }
        entry.orderIds.push(order.id)
    }

    if (!dueByListing.size) return NextResponse.json({ checked: orders.length, sent: 0 })

    // Seller email/name for each due listing's representative order.
    const userIds = [...new Set([...dueByListing.values()].map(e => e.userId))]
    const { data: users } = await supabase
        .from('profiles')
        .select('id, name, email')
        .in('id', userIds)
    const userById = new Map((users || []).map(u => [u.id, u]))

    const manageUrl = `${SITE_URL(request)}/store/manage-product`

    let sent = 0, failed = 0
    for (const entry of dueByListing.values()) {
        const user = userById.get(entry.userId)
        if (!user?.email) {
            failed++
            continue
        }
        const boostLabel = BOOST_CATALOG[entry.boostKey]?.label || entry.boostKey

        try {
            await sendEmail({
                to: user.email,
                subject: `Your ${boostLabel} boost expires tomorrow`,
                html: boostExpiryReminderHtml({
                    name: user.name,
                    listingName: entry.listing.name,
                    boostLabel,
                    expiresAtIso: new Date(entry.expiry).toISOString(),
                    manageUrl,
                }),
                text: `Your ${boostLabel} boost on "${entry.listing.name}" expires tomorrow. Renew at ${manageUrl} to stay at the top.`,
            })
            // Stamp every pending order on this listing, not just one.
            await supabase.from('boost_orders')
                .update({ reminder_sent_at: new Date().toISOString() })
                .in('id', entry.orderIds)
            sent++
        } catch (err) {
            console.log('[boost-reminders] send failed', { listingId: entry.listing.id, err: err?.message })
            failed++
        }
    }

    return NextResponse.json({ checked: orders.length, due: dueByListing.size, sent, failed })
}
