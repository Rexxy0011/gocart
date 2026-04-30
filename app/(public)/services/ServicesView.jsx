'use client'
import { useMemo } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
    Wrench, Truck, Snowflake, Zap, Droplets, Sparkles, Smartphone, Hammer, Boxes, Tv,
    MapPin, Search, X, ArrowRight, Hourglass, LayoutDashboard,
} from 'lucide-react'
import ServiceCard from '@/components/ServiceCard'
import Dropdown from '@/components/Dropdown'

const SERVICE_CATALOG = [
    { name: 'Mechanic',         Icon: Wrench,     accent: 'bg-orange-50 text-orange-600 ring-orange-200' },
    { name: 'Courier',          Icon: Truck,      accent: 'bg-blue-50 text-blue-600 ring-blue-200' },
    { name: 'AC Repair',        Icon: Snowflake,  accent: 'bg-sky-50 text-sky-600 ring-sky-200' },
    { name: 'Electrician',      Icon: Zap,        accent: 'bg-amber-50 text-amber-600 ring-amber-200' },
    { name: 'Plumbing',         Icon: Droplets,   accent: 'bg-emerald-50 text-emerald-600 ring-emerald-200' },
    { name: 'Cleaning',         Icon: Sparkles,   accent: 'bg-pink-50 text-pink-600 ring-pink-200' },
    { name: 'Phone repair',     Icon: Smartphone, accent: 'bg-violet-50 text-violet-600 ring-violet-200' },
    { name: 'Carpentry',        Icon: Hammer,     accent: 'bg-yellow-50 text-yellow-700 ring-yellow-200' },
    { name: 'Moving',           Icon: Boxes,      accent: 'bg-red-50 text-red-600 ring-red-200' },
    { name: 'Appliance repair', Icon: Tv,         accent: 'bg-indigo-50 text-indigo-600 ring-indigo-200' },
]

const ServicesView = ({ services = [], providerStatus = null }) => {

    const router = useRouter()
    const searchParams = useSearchParams()
    const activeCategory = searchParams.get('category')
    const activeLocation = searchParams.get('location') || ''
    const activeSearch = searchParams.get('q') || ''

    const locations = useMemo(() => {
        const set = new Set()
        for (const s of services) if (s.location) set.add(s.location)
        return [...set].sort()
    }, [services])

    const countByCategory = useMemo(() => {
        const map = new Map()
        for (const s of services) map.set(s.category, (map.get(s.category) || 0) + 1)
        return map
    }, [services])

    const filtered = useMemo(() => {
        let list = services
        if (activeCategory) list = list.filter(s => s.category === activeCategory)
        if (activeLocation) list = list.filter(s => s.location === activeLocation)
        if (activeSearch.trim()) {
            const q = activeSearch.trim().toLowerCase()
            list = list.filter(s => {
                const fields = [
                    s.name,
                    s.category,
                    s.store?.user?.name,
                    s.store?.name,
                    s.location,
                    s.service?.areaCovered,
                    ...(s.service?.specialties || []),
                ]
                return fields.some(f => f && f.toLowerCase().includes(q))
            })
        }
        return list
    }, [services, activeCategory, activeLocation, activeSearch])

    const updateParams = (mutate) => {
        const params = new URLSearchParams(searchParams.toString())
        mutate(params)
        const qs = params.toString()
        router.push(`/services${qs ? '?' + qs : ''}`)
    }

    const setCategory = (cat) => updateParams((p) => {
        if (cat) p.set('category', cat); else p.delete('category')
    })
    const setLocation = (loc) => updateParams((p) => {
        if (loc) p.set('location', loc); else p.delete('location')
    })
    const setSearch = (q) => updateParams((p) => {
        if (q.trim()) p.set('q', q.trim()); else p.delete('q')
    })
    const clearFilters = () => router.push('/services')

    const onSubmitSearch = (e) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        setSearch(formData.get('q') || '')
    }

    const hasFilters = !!(activeCategory || activeLocation || activeSearch)

    return (
        <div className='mx-6'>
            <div className='max-w-7xl mx-auto py-8'>
                {/* Header + provider CTA */}
                <div className='flex flex-col md:flex-row md:items-end md:justify-between gap-4'>
                    <div className='max-w-2xl'>
                        <h1 className='text-2xl sm:text-3xl font-bold text-slate-900'>Repairs &amp; Services</h1>
                        <p className='text-sm text-slate-600 mt-2'>
                            Find trusted local providers — from picking up your latest GoCart purchase to fixing what&apos;s broken at home. Verified, rated, and paid only when the job is done.
                        </p>
                    </div>

                    {/* Provider CTA — three states */}
                    {providerStatus === 'approved' ? (
                        <Link
                            href='/pro'
                            className='inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-full px-5 py-2.5 transition shrink-0'
                        >
                            <LayoutDashboard size={15} />
                            Provider dashboard
                            <ArrowRight size={14} />
                        </Link>
                    ) : providerStatus === 'pending' ? (
                        <span className='inline-flex items-center gap-2 bg-amber-50 ring-1 ring-amber-200 text-amber-800 text-sm font-medium rounded-full px-5 py-2.5 shrink-0'>
                            <Hourglass size={15} />
                            Verification in review
                        </span>
                    ) : (
                        <Link
                            href='/pro/apply'
                            className='inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-full px-5 py-2.5 transition shrink-0'
                        >
                            <Wrench size={15} />
                            Offer a service
                            <ArrowRight size={14} />
                        </Link>
                    )}
                </div>

                {/* Category showcase grid */}
                <section className='mt-8'>
                    <h2 className='text-base font-semibold text-slate-900 mb-3'>Browse by service</h2>
                    <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3'>
                        {SERVICE_CATALOG.map(({ name, Icon, accent }) => {
                            const count = countByCategory.get(name) || 0
                            const isActive = activeCategory === name
                            return (
                                <button
                                    key={name}
                                    type='button'
                                    onClick={() => setCategory(isActive ? null : name)}
                                    className={`group flex flex-col items-start gap-3 p-4 rounded-xl ring-1 transition text-left ${
                                        isActive
                                            ? 'bg-slate-900 ring-slate-900 text-white'
                                            : 'bg-white ring-slate-200 hover:ring-slate-400 hover:shadow-sm'
                                    }`}
                                >
                                    <span className={`inline-flex items-center justify-center size-10 rounded-full ring-1 ${
                                        isActive ? 'bg-white/10 text-white ring-white/30' : accent
                                    }`}>
                                        <Icon size={20} />
                                    </span>
                                    <div className='min-w-0'>
                                        <p className={`text-sm font-semibold truncate ${isActive ? 'text-white' : 'text-slate-900'}`}>{name}</p>
                                        <p className={`text-xs ${isActive ? 'text-white/70' : 'text-slate-500'}`}>
                                            {count} {count === 1 ? 'provider' : 'providers'}
                                        </p>
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                </section>

                {/* Filter bar */}
                <section className='mt-8'>
                    <div className='flex flex-col sm:flex-row gap-3'>
                        <form onSubmit={onSubmitSearch} className='flex-1 flex items-center gap-2 bg-white ring-1 ring-slate-200 rounded-full px-4 py-2 focus-within:ring-slate-400 transition'>
                            <Search size={16} className='text-slate-400 shrink-0' />
                            <input
                                key={activeSearch}
                                name='q'
                                defaultValue={activeSearch}
                                placeholder='Search providers, specialties (e.g. AC fixes, courier)…'
                                className='flex-1 text-sm bg-transparent outline-none placeholder-slate-400 min-w-0'
                            />
                            {activeSearch && (
                                <button
                                    type='button'
                                    onClick={() => setSearch('')}
                                    aria-label='Clear search'
                                    className='size-6 flex items-center justify-center text-slate-400 hover:text-slate-700'
                                >
                                    <X size={14} />
                                </button>
                            )}
                            <button type='submit' className='ml-1 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium px-3 py-1.5 rounded-full transition'>
                                Search
                            </button>
                        </form>

                        <Dropdown
                            value={activeLocation}
                            onChange={setLocation}
                            placeholder='All locations'
                            leftIcon={<MapPin size={16} className='text-slate-400 shrink-0' />}
                            className='sm:w-64'
                            options={[
                                { value: '', label: 'All locations' },
                                ...locations.map((loc) => ({ value: loc, label: loc })),
                            ]}
                        />
                    </div>

                    {hasFilters && (
                        <div className='flex flex-wrap items-center gap-2 mt-3 text-xs'>
                            <span className='text-slate-500'>Filters:</span>
                            {activeCategory && (
                                <button onClick={() => setCategory(null)} className='inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded-full'>
                                    {activeCategory} <X size={11} />
                                </button>
                            )}
                            {activeLocation && (
                                <button onClick={() => setLocation('')} className='inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded-full'>
                                    <MapPin size={10} /> {activeLocation} <X size={11} />
                                </button>
                            )}
                            {activeSearch && (
                                <button onClick={() => setSearch('')} className='inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded-full'>
                                    &quot;{activeSearch}&quot; <X size={11} />
                                </button>
                            )}
                            <button onClick={clearFilters} className='text-sky-700 hover:underline ml-1'>
                                Clear all
                            </button>
                        </div>
                    )}
                </section>

                {/* Results */}
                <section className='mt-8'>
                    <div className='flex items-end justify-between mb-4'>
                        <h2 className='text-base font-semibold text-slate-900'>
                            {activeCategory ? `${activeCategory} providers` : 'All providers'}
                            {activeLocation && ` in ${activeLocation}`}
                        </h2>
                        <p className='text-sm text-slate-500'>
                            {filtered.length} {filtered.length === 1 ? 'result' : 'results'}
                        </p>
                    </div>

                    {filtered.length === 0 ? (
                        <div className='text-center py-12 bg-slate-50 rounded-xl'>
                            <p className='text-sm text-slate-500'>
                                {services.length === 0
                                    ? 'No verified providers yet — be the first to offer a service.'
                                    : 'No providers match your filters.'}
                            </p>
                            {hasFilters && (
                                <button onClick={clearFilters} className='text-sm text-sky-700 hover:underline mt-2'>
                                    Clear filters
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-32'>
                            {filtered.map((p) => <ServiceCard key={p.id} product={p} />)}
                        </div>
                    )}
                </section>
            </div>
        </div>
    )
}

export default ServicesView
