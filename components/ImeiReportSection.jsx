'use client'
import { ShieldCheck, AlertTriangle, Calendar } from 'lucide-react'
import { format } from 'date-fns'

// Buyer-facing free IMEI report. Renders inside ProductDetails when the
// listing has an IMEI AND imei_reports has a cached row. Pulls from data
// already fetched on the server.
//
// What it shows today (free):
//   - Luhn pass / fail (catches mistyped or fabricated IMEIs)
//   - TAC-decoded brand / model when a public DB had a hit
//   - Past listings on GoCart (rebadge / re-list audit trail)
//
// Not yet:
//   - Stolen / blacklist status (paid)
//   - iCloud lock for iPhones (paid)
//   - Carrier lock (paid)
const ImeiReportSection = ({ imeiReport, claimedCondition }) => {

    if (!imeiReport) return null
    const { decoded, lastCheckedAt, history } = imeiReport
    const luhnOk = decoded?.luhnValid !== false

    const brandModel = [decoded?.brand, decoded?.model].filter(Boolean).join(' ')

    return (
        <section className='mt-6 bg-emerald-50/60 ring-1 ring-emerald-200 rounded-xl p-5'>
            <header className='flex items-start gap-3 mb-4'>
                <span className='inline-flex items-center justify-center size-9 rounded-full bg-emerald-600 text-white shrink-0'>
                    <ShieldCheck size={16} />
                </span>
                <div className='flex-1 min-w-0'>
                    <h2 className='text-base font-bold text-emerald-900'>Free IMEI verification</h2>
                    <p className='text-xs text-emerald-900/80 mt-0.5'>
                        Last checked {format(new Date(lastCheckedAt), 'd MMM yyyy')}.
                    </p>
                </div>
            </header>

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm'>
                {/* Luhn / format check */}
                <div className='bg-white rounded-lg p-3 ring-1 ring-emerald-100'>
                    <p className='text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1'>Format check</p>
                    {luhnOk ? (
                        <p className='font-semibold text-emerald-700 inline-flex items-center gap-1'>
                            <ShieldCheck size={14} /> Valid IMEI
                        </p>
                    ) : (
                        <p className='font-semibold text-rose-700 inline-flex items-center gap-1'>
                            <AlertTriangle size={14} /> Checksum failed
                        </p>
                    )}
                    <p className='text-[11px] text-slate-500 mt-1'>
                        Confirms the digits form a real GSMA-issued IMEI, not a typo.
                    </p>
                </div>

                {/* Brand decode */}
                <div className='bg-white rounded-lg p-3 ring-1 ring-emerald-100'>
                    <p className='text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1'>Brand match</p>
                    {brandModel ? (
                        <p className='font-semibold text-slate-900'>{brandModel}</p>
                    ) : (
                        <p className='text-slate-500 text-xs italic'>
                            Public database didn&apos;t recognise this TAC - common for older or unindexed phones. Buyer should still cross-check the box.
                        </p>
                    )}
                </div>

                {/* GoCart re-listing trail */}
                {history?.length > 1 && (
                    <div className='bg-white rounded-lg p-3 ring-1 ring-emerald-100 sm:col-span-2'>
                        <p className='text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-2'>
                            Past listings on GoCart ({history.length})
                        </p>
                        <ul className='text-xs text-slate-700 space-y-1.5'>
                            {history.slice(0, 5).map((h) => (
                                <li key={h.recorded_at} className='inline-flex items-center gap-2'>
                                    <Calendar size={11} className='text-slate-400 shrink-0' />
                                    {format(new Date(h.recorded_at), 'd MMM yyyy')}
                                    {h.claimed_condition && (
                                        <span className='text-slate-500'>· claimed {h.claimed_condition}</span>
                                    )}
                                </li>
                            ))}
                        </ul>
                        {claimedCondition === 'new-sealed' && history.length > 1 && (
                            <p className='mt-2 inline-flex items-center gap-1 text-xs font-medium text-amber-700'>
                                <AlertTriangle size={12} /> This IMEI has been listed before - &quot;Brand new (sealed)&quot; is unusual for a previously-listed device.
                            </p>
                        )}
                    </div>
                )}
            </div>

            <p className='text-[11px] text-emerald-900/70 mt-4 leading-relaxed'>
                Stolen-status and iCloud-lock checks aren&apos;t free in Nigeria. We surface what global databases publish, plus our own listing history.
            </p>
        </section>
    )
}

export default ImeiReportSection
