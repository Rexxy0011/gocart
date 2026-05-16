// NHTSA vPIC API - free VIN decoder run by the US government. Works for
// every VIN globally because the standard (ISO 3779) is global; what
// varies is whether the manufacturer registered the year-make-model
// combination with NHTSA, which Mercedes/Toyota/Honda/etc. all do.
//
// What we get:
//   - Make, Model, ModelYear, BodyClass
//   - Series / Trim
//   - EngineNumberOfCylinders, DisplacementL, DisplacementCC
//   - TransmissionStyle
//   - FuelTypePrimary
//   - DriveType, ManufacturerName, PlantCountry
//   - And ~120 other fields when populated.
//
// What we DON'T get from NHTSA:
//   - Mileage history, accidents, prior owners. Those need a paid
//     provider (Carfax/CarVertical) - separate integration.
//
// The recalls endpoint takes year/make/model (NOT the VIN) and returns
// every NHTSA-issued safety recall. We feed it the decoded result.

const VPIC_BASE   = 'https://vpic.nhtsa.dot.gov/api/vehicles'
const RECALL_BASE = 'https://api.nhtsa.gov/recalls/recallsByVehicle'

// 17-char ISO 3779 VIN: A-Z0-9 except I, O, Q (banned to avoid
// confusion with 1, 0).
export const isValidVin = (vin) =>
    typeof vin === 'string' &&
    /^[A-HJ-NPR-Z0-9]{17}$/.test(vin.toUpperCase())

// Decode a VIN. Returns the curated subset of fields we actually display
// or store; the full NHTSA payload has ~125 keys, we're not warehousing
// all of them.
export async function decodeVin(vin) {
    if (!isValidVin(vin)) throw new Error('Invalid VIN format.')

    const res = await fetch(`${VPIC_BASE}/decodevinvalues/${vin}?format=json`, {
        // VIN decode rarely changes for a given VIN; allow Next/edge to cache.
        next: { revalidate: 60 * 60 * 24 * 30 },
    })
    if (!res.ok) throw new Error(`NHTSA decode failed (${res.status})`)
    const json = await res.json()
    const r = json?.Results?.[0]
    if (!r) throw new Error('Empty response from NHTSA.')

    // ErrorCode 0 = success. Anything else means partial decode; we still
    // return what we have but flag it.
    const errorCode = parseInt(r.ErrorCode || '0', 10)

    return {
        vin,
        errorCode,
        errorText: r.ErrorText || '',
        make:           (r.Make || '').trim() || null,
        model:          (r.Model || '').trim() || null,
        modelYear:      r.ModelYear ? parseInt(r.ModelYear, 10) || null : null,
        bodyClass:      (r.BodyClass || '').trim() || null,
        series:         (r.Series || '').trim() || null,
        trim:           (r.Trim || '').trim() || null,
        cylinders:      r.EngineNumberOfCylinders ? parseInt(r.EngineNumberOfCylinders, 10) || null : null,
        engineCc:       r.DisplacementCC ? Math.round(parseFloat(r.DisplacementCC)) || null : null,
        engineL:        r.DisplacementL ? parseFloat(r.DisplacementL) || null : null,
        transmission:   (r.TransmissionStyle || '').trim() || null,
        fuelType:       (r.FuelTypePrimary || '').trim() || null,
        driveType:      (r.DriveType || '').trim() || null,
        manufacturer:   (r.ManufacturerName || '').trim() || null,
        plantCountry:   (r.PlantCountry || '').trim() || null,
    }
}

// Pull open recalls for the decoded year/make/model. Each item is
// { Component, Summary, Consequence, Remedy, NHTSACampaignNumber }.
export async function fetchRecalls({ make, model, modelYear }) {
    if (!make || !model || !modelYear) return []
    const url = `${RECALL_BASE}?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&modelYear=${modelYear}`
    try {
        const res = await fetch(url, { next: { revalidate: 60 * 60 * 24 } })
        if (!res.ok) return []
        const json = await res.json()
        return Array.isArray(json?.results) ? json.results : []
    } catch {
        // Swallow - recalls are bonus signal, not a hard failure.
        return []
    }
}
