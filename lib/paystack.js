// Server-only Paystack helpers. The secret key never crosses the network
// boundary — these run inside server actions and API routes.

const PAYSTACK_BASE = 'https://api.paystack.co'

const secret = () => {
    const key = process.env.PAYSTACK_SECRET_KEY
    if (!key) throw new Error('Missing PAYSTACK_SECRET_KEY')
    return key
}

// /transaction/initialize → returns an authorization_url the user is
// redirected to. Paystack hosts the card form on their own domain.
export async function initializeTransaction({ email, amountKobo, reference, callbackUrl, metadata }) {
    const res = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${secret()}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            email,
            amount: amountKobo,
            reference,
            callback_url: callbackUrl,
            metadata,
        }),
    })

    const json = await res.json()
    if (!res.ok || !json.status) {
        throw new Error(json.message || 'Paystack initialize failed')
    }
    return json.data  // { authorization_url, access_code, reference }
}

// /transaction/verify/{reference} → run from the callback before crediting
// the listing. Re-checks against Paystack so a forged callback URL can't
// trick us into activating a boost.
export async function verifyTransaction(reference) {
    const res = await fetch(`${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(reference)}`, {
        headers: { Authorization: `Bearer ${secret()}` },
        cache: 'no-store',
    })
    const json = await res.json()
    if (!res.ok || !json.status) {
        throw new Error(json.message || 'Paystack verify failed')
    }
    return json.data  // { status, amount, reference, ... }
}
