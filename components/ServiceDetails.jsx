'use client'
import { Clock, MapPin, BadgeCheck, Wrench, Calendar, ShieldCheck, Star } from 'lucide-react'

const formatPriceRange = (service) => {
    if (!service?.priceRange) return 'Quote on request'
    const { min, max, unit } = service.priceRange
    const symbol = service.currency === 'NGN' ? '₦' : '$'
    const u = unit === 'hour' ? '/hr' : unit === 'job' ? '/job' : ''
    if (min == null && max == null) return 'Quote on request'
    if (min != null && max != null) return `${symbol}${min.toLocaleString()} – ${symbol}${max.toLocaleString()}${u}`
    return `from ${symbol}${(min ?? max).toLocaleString()}${u}`
}

const ServiceDetails = ({ service, description, category, ratings = [] }) => {

    const priceRange = formatPriceRange(service)
    const jobsCompleted = service?.jobsCompleted ?? 0
    const ratingCount = ratings.length
    const averageRating = ratingCount
        ? ratings.reduce((s, r) => s + r.rating, 0) / ratingCount
        : 0

    const facts = [
        { icon: MapPin, label: 'Area covered', value: service?.areaCovered },
        { icon: Clock, label: 'Response time', value: service?.responseTime },
        { icon: Calendar, label: 'Available', value: service?.available },
        { icon: Wrench, label: 'Experience', value: service?.yearsExperience ? `${service.yearsExperience} years` : null },
    ].filter(f => f.value)

    return (
        <>
            <section>
                <div className='flex items-center gap-3 mb-3 flex-wrap'>
                    <h2 className='text-lg font-semibold text-slate-900'>About this service</h2>
                    {category && (
                        <span className='inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-emerald-700 bg-emerald-50 ring-1 ring-emerald-200 px-2 py-0.5 rounded-full'>
                            {category}
                        </span>
                    )}
                </div>

                {/* Stats banner */}
                <div className='grid grid-cols-3 divide-x divide-slate-200 border border-slate-200 rounded-xl bg-white mb-4'>
                    <div className='p-4'>
                        <p className='text-xs text-slate-500'>Price range</p>
                        <p className='text-base sm:text-lg font-bold text-emerald-600 mt-1 leading-tight'>{priceRange}</p>
                    </div>
                    <div className='p-4'>
                        <p className='text-xs text-slate-500'>Jobs completed</p>
                        <p className='inline-flex items-center gap-1.5 text-base sm:text-lg font-bold text-emerald-700 mt-1'>
                            <ShieldCheck size={18} className='shrink-0' />
                            {jobsCompleted.toLocaleString()}
                        </p>
                    </div>
                    <div className='p-4'>
                        <p className='text-xs text-slate-500'>Rating</p>
                        <p className='inline-flex items-center gap-1 text-base sm:text-lg font-bold text-amber-500 mt-1'>
                            <Star size={18} className='fill-current shrink-0' />
                            {averageRating ? averageRating.toFixed(1) : 'New'}
                            {ratingCount > 0 && <span className='text-slate-500 font-normal text-sm'>({ratingCount})</span>}
                        </p>
                    </div>
                </div>

                <p className='text-sm sm:text-base text-slate-700 leading-relaxed whitespace-pre-line'>
                    {description}
                </p>
            </section>

            {facts.length > 0 && (
                <section>
                    <h2 className='text-lg font-semibold text-slate-900 mb-3'>Service details</h2>
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
                </section>
            )}

            {service?.qualifications?.length > 0 && (
                <section>
                    <h2 className='text-lg font-semibold text-slate-900 mb-3'>Qualifications &amp; guarantees</h2>
                    <ul className='space-y-2'>
                        {service.qualifications.map((q) => (
                            <li key={q} className='flex items-center gap-2 text-sm text-slate-700'>
                                <BadgeCheck size={16} className='text-emerald-600 shrink-0' />
                                {q}
                            </li>
                        ))}
                    </ul>
                </section>
            )}
        </>
    )
}

export default ServiceDetails
