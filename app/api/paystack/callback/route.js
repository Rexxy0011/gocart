import { NextResponse } from 'next/server'
import { fulfilBoostOrder } from '@/lib/boost-fulfilment'

// Paystack returns the buyer's browser here after they pay. URL has
// ?reference=… - we verify with Paystack and apply the boost, then
// redirect to the dashboard.
//
// This is the "belt"; /api/paystack/webhook is the "suspenders". If the
// buyer closes the tab before this redirect fires, the webhook still
// completes the order. Both call the same idempotent fulfilBoostOrder().

// Derive the redirect base from the actual request URL so we always land
// back on the same origin Paystack just sent the user from.
const baseFrom = (request) => new URL(request.url).origin
const back = (request, status) =>
    NextResponse.redirect(`${baseFrom(request)}/store/manage-product?boost=${status}`)

export async function GET(request) {
    const { searchParams } = new URL(request.url)
    const reference = searchParams.get('reference') || searchParams.get('trxref')
    console.log('[paystack callback] hit', { reference, url: request.url })

    if (!reference) return back(request, 'missing')

    const { status } = await fulfilBoostOrder(reference)

    // fulfilBoostOrder's statuses map 1:1 to the ?boost= values the
    // dashboard already understands.
    return back(request, status)
}
