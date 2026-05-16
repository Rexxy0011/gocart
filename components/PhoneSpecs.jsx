'use client'
import { Smartphone, BatteryFull, Lock, Package, Shield, HardDrive, Cpu } from 'lucide-react'

// Buyer-facing phone-spec block. Renders inside ProductDetails when the
// listing is a phone (iPhones / Androids categories) and at least one
// phone field is populated. Mirrors VehicleSpecs' shape: a labelled grid
// the buyer can scan in 2 seconds.
const PhoneSpecs = ({ phone }) => {

    if (!phone) return null

    const facts = [
        { icon: Smartphone, label: 'Brand',         value: phone.brand },
        { icon: Smartphone, label: 'Model',         value: phone.model },
        { icon: HardDrive,  label: 'Storage',       value: phone.storage },
        { icon: Cpu,        label: 'RAM',           value: phone.ram },
        { icon: BatteryFull,label: 'Battery health',value: phone.batteryHealth ? `${phone.batteryHealth}%` : null },
        { icon: Lock,       label: 'Network lock',  value: phone.networkLock },
        { icon: Smartphone, label: 'Colour',        value: phone.colour },
    ].filter(f => f.value)

    if (facts.length === 0 && !phone.accessories?.length && !phone.warranty) return null

    return (
        <section>
            <h2 className='text-lg font-semibold text-slate-900 mb-3'>Phone details</h2>
            <dl className='grid grid-cols-1 sm:grid-cols-2 gap-x-10 text-sm'>
                {facts.map(({ icon: Icon, label, value }) => (
                    <div key={label} className='flex items-start gap-3 border-b border-slate-100 py-3'>
                        <Icon size={16} className='text-slate-400 mt-0.5 shrink-0' />
                        <div className='flex-1 min-w-0'>
                            <dt className='text-slate-500 text-xs'>{label}</dt>
                            <dd className='text-slate-900 font-semibold'>{value}</dd>
                        </div>
                    </div>
                ))}
            </dl>

            {(phone.accessories?.length > 0) && (
                <div className='mt-4'>
                    <p className='text-xs font-bold uppercase tracking-wide text-slate-500 mb-2'>
                        <Package size={12} className='inline-block -mt-0.5 mr-1' /> What&apos;s included
                    </p>
                    <div className='flex flex-wrap gap-1.5'>
                        {phone.accessories.map((a) => (
                            <span key={a} className='inline-flex items-center text-xs bg-slate-100 text-slate-700 ring-1 ring-slate-200 rounded-full px-2.5 py-1'>
                                {a}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {phone.warranty && (
                <div className='mt-4 inline-flex items-center gap-2 text-sm text-slate-700 bg-slate-50 ring-1 ring-slate-200 rounded-lg px-3 py-2'>
                    <Shield size={14} className='text-slate-500 shrink-0' />
                    {phone.warranty}
                </div>
            )}
        </section>
    )
}

export default PhoneSpecs
