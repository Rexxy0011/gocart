// Free IMEI verification - what we can deliver without paying anyone.
//
// Two checks always run:
//   1. Luhn - every IMEI's 15th digit is a checksum over the first 14.
//      A bad checksum means the IMEI was typed wrong or fabricated.
//   2. TAC decode - the first 8 digits identify make + model. We try a
//      couple of free public endpoints; if they're all down or rate-
//      limited the report still ships, just without the brand line.
//
// What we DON'T have for free:
//   - Stolen / blacklist status (CheckMEND, Sickw - paid)
//   - iCloud lock status for iPhones (paid, ~$0.30/check)
//   - Carrier lock status (paid)
// Those come in later via a "Premium IMEI report" upsell.

// 15-digit IMEI; nothing else accepted.
export const isImeiShape = (imei) =>
    typeof imei === 'string' && /^[0-9]{15}$/.test(imei)

// GSMA Luhn check - exact algorithm IMEIs are minted with.
export const passesLuhn = (imei) => {
    if (!isImeiShape(imei)) return false
    let sum = 0
    for (let i = 0; i < 15; i++) {
        let d = parseInt(imei.charAt(14 - i), 10)
        // Every second digit from the right is doubled, then 9-digit
        // results split into two digits and re-summed.
        if (i % 2 === 1) {
            d *= 2
            if (d > 9) d -= 9
        }
        sum += d
    }
    return sum % 10 === 0
}

// Try a free public TAC decoder. The IMEI's first 8 digits are the TAC
// (Type Allocation Code) - globally unique per make+model combo.
//
// We try imei.org first - they expose a JSON endpoint that doesn't need
// a key for low volume. Fall back gracefully: a missing TAC decode is
// fine, we still surface Luhn + Kakimart's own re-listing history.
async function tacDecode(imei) {
    try {
        const res = await fetch(`https://api.imei.org/api/check-imei?imei=${imei}`, {
            // TAC results are immutable for a given IMEI - cache aggressively.
            next: { revalidate: 60 * 60 * 24 * 365 },
            // Don't let a flaky 3rd-party hold up the form.
            signal: AbortSignal.timeout(4000),
        })
        if (!res.ok) return null
        const json = await res.json()
        const brand = json?.result?.brand || json?.brand || null
        const model = json?.result?.model || json?.model || null
        if (!brand && !model) return null
        return { brand, model, source: 'imei.org' }
    } catch {
        return null
    }
}

// Run both checks. Returns a structured decoded object the caller can
// store in imei_reports.decoded.
export async function decodeImei(imei) {
    if (!isImeiShape(imei)) {
        return { errorText: 'IMEI must be 15 digits.', luhnValid: false }
    }
    const luhnValid = passesLuhn(imei)
    const tac = imei.slice(0, 8)
    const tacInfo = luhnValid ? await tacDecode(imei) : null

    return {
        imei,
        tac,
        luhnValid,
        // brand / model only populated when we got a hit from a public DB.
        // Empty fields are normal - buyers are told the report is "best
        // effort" for unindexed devices.
        brand: tacInfo?.brand || null,
        model: tacInfo?.model || null,
        source: tacInfo?.source || null,
    }
}
