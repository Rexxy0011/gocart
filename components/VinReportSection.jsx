'use client'
import { ShieldCheck, AlertTriangle, Gauge, Calendar } from 'lucide-react'
import { format } from 'date-fns'

// Buyer-facing free VIN report. Renders inside ProductDetails when the
// listing has a VIN AND vin_reports has a cached row. Pulls from data
// already fetched on the server, so render is instant.
//
// What it shows today (free, automated):
//   - VIN-decoded year/make/model + decode-time spec match
//   - Recall count (and a list if any open)
//   - Mileage at this listing (declared by seller)
//   - Listing-history strip from vehicle_history when this VIN was
//     listed before (lets buyers spot mileage rollbacks).
//
// What it doesn't yet show (would need a paid provider):
//   - Accidents
//   - Ownership chain
const VinReportSection = ({ vinReport, listingMileage }) => {

    if (!vinReport) return null
    const { decoded, recalls, lastCheckedAt, history } = vinReport

    const yearMakeModel = [decoded.modelYear, decoded.make, decoded.model]
        .filter(Boolean)
        .join(' ')

    return (
        <section className='mt-6 bg-emerald-50/60 ring-1 ring-emerald-200 rounded-xl p-5'>
            <header className='flex items-start gap-3 mb-4'>
                <span className='inline-flex items-center justify-center size-9 rounded-full bg-emerald-600 text-white shrink-0'>
                    <ShieldCheck size={16} />
                </span>
                <div className='flex-1 min-w-0'>
                    <h2 className='text-base font-bold text-emerald-900'>Free VIN history report</h2>
                    <p className='text-xs text-emerald-900/80 mt-0.5'>
                        Verified against the international vehicle database. Last checked{' '}
                        {format(new Date(lastCheckedAt), 'd MMM yyyy')}.
                    </p>
                </div>
            </header>

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm'>
                {/* Decoded ID */}
                <div className='bg-white rounded-lg p-3 ring-1 ring-emerald-100'>
                    <p className='text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1'>VIN decode</p>
                    <p className='font-semibold text-slate-900'>{yearMakeModel || '—'}</p>
                    {(decoded.bodyClass || decoded.engineL || decoded.transmission) && (
                        <p className='text-xs text-slate-600 mt-1'>
                            {[
                                decoded.bodyClass,
                                decoded.engineL ? `${decoded.engineL}L` : null,
                                decoded.cylinders ? `V${decoded.cylinders}` : null,
                                decoded.transmission,
                            ].filter(Boolean).join(' · ')}
                        </p>
                    )}
                    {decoded.plantCountry && (
                        <p className='text-[11px] text-slate-500 mt-1'>Built in {decoded.plantCountry}</p>
                    )}
                </div>

                {/* Recalls */}
                <div className='bg-white rounded-lg p-3 ring-1 ring-emerald-100'>
                    <p className='text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1'>Open recalls</p>
                    {recalls.length === 0 ? (
                        <p className='font-semibold text-emerald-700 inline-flex items-center gap-1'>
                            <ShieldCheck size={14} /> No open recalls
                        </p>
                    ) : (
                        <p className='font-semibold text-amber-700 inline-flex items-center gap-1'>
                            <AlertTriangle size={14} /> {recalls.length} open
                        </p>
                    )}
                    {recalls.length > 0 && (
                        <ul className='text-xs text-slate-600 mt-2 space-y-1.5 list-disc list-inside'>
                            {recalls.slice(0, 3).map((r) => (
                                <li key={r.NHTSACampaignNumber || r.Component} className='line-clamp-2'>
                                    {r.Component}: {r.Summary}
                                </li>
                            ))}
                            {recalls.length > 3 && (
                                <li className='text-[11px] text-slate-500'>+{recalls.length - 3} more</li>
                            )}
                        </ul>
                    )}
                </div>

                {/* Mileage at this listing */}
                {listingMileage != null && (
                    <div className='bg-white rounded-lg p-3 ring-1 ring-emerald-100'>
                        <p className='text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1'>Mileage at listing</p>
                        <p className='font-semibold text-slate-900 inline-flex items-center gap-1.5'>
                            <Gauge size={14} className='text-slate-500' />
                            {listingMileage.toLocaleString()} mi
                        </p>
                        <p className='text-[11px] text-slate-500 mt-1'>Declared by the seller when posting.</p>
                    </div>
                )}

                {/* GoCart history — only meaningful if this VIN appeared before */}
                {history.length > 1 && (
                    <div className='bg-white rounded-lg p-3 ring-1 ring-emerald-100'>
                        <p className='text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1'>Past listings on GoCart</p>
                        <ul className='text-xs text-slate-700 space-y-1'>
                            {history.slice(0, 4).map((h) => (
                                <li key={h.recorded_at} className='inline-flex items-center gap-2'>
                                    <Calendar size={11} className='text-slate-400 shrink-0' />
                                    {format(new Date(h.recorded_at), 'd MMM yyyy')}
                                    {h.mileage_miles != null && (
                                        <span className='text-slate-500'>· {h.mileage_miles.toLocaleString()} mi</span>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            <p className='text-[11px] text-emerald-900/70 mt-4 leading-relaxed'>
                Accident and ownership data isn&apos;t available for free in Nigeria. We surface
                what manufacturers and the international vehicle database publish.
            </p>
        </section>
    )
}

export default VinReportSection
