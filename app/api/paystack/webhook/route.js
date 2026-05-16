import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { fulfilBoostOrder } from '@/lib/boost-fulfilment'

// Paystack server-to-server webhook - the reliable boost-completion path.
// Even if the buyer closes the tab before the browser callback fires,
// Paystack POSTs charge.success here and the boost still gets applied.
//
// Security: Paystack signs the raw body with HMAC-SHA512 using the secret
// key. We recompute it and constant-time compare before trusting anything.
// fulfilBoostOrder additionally re-verifies the charge against Paystack's
// /verify endpoint, so even a forged event can't activate a boost.
//
// Configure the endpoint URL in the Paystack dashboard:
//   Settings → API Keys & Webhooks → Webhook URL → https://<host>/api/paystack/webhook

export async function POST(request) {
    const secret = process.env.PAYSTACK_SECRET_KEY
    if (!secret) {
        console.log('[paystack webhook] missing PAYSTACK_SECRET_KEY')
        return NextResponse.json({ error: 'not configured' }, { status: 500 })
    }

    // Raw body - the HMAC must cover the exact bytes Paystack sent, not a
    // re-serialised JSON.parse round-trip.
    const raw = await request.text()
    const signature = request.headers.get('x-paystack-signature') || ''
    const expected = crypto.createHmac('sha512', secret).update(raw).digest('hex')

    const sigBuf = Buffer.from(signature)
    const expBuf = Buffer.from(expected)
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
        console.log('[paystack webhook] bad signature')
        return NextResponse.json({ error: 'invalid signature' }, { status: 401 })
    }

    let event
    try {
        event = JSON.parse(raw)
    } catch {
        return NextResponse.json({ error: 'bad payload' }, { status: 400 })
    }

    // Only successful charges complete a boost. Ack everything else with a
    // 200 so Paystack doesn't keep retrying events we intentionally ignore.
    if (event?.event === 'charge.success') {
        const reference = event?.data?.reference
        console.log('[paystack webhook] charge.success', { reference })
        const { status } = await fulfilBoostOrder(reference)
        console.log('[paystack webhook] fulfilled', { reference, status })
    }

    return NextResponse.json({ received: true })
}
