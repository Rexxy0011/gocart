'use client'
import { CalendarDays, Clock, MapPin } from 'lucide-react'

const MOCK_JOBS = [
    { id: 'j1', day: 'Tomorrow',   time: '10:00am', who: 'Bola O.',  what: 'Boiler service',     area: 'Ikeja',  status: 'confirmed' },
    { id: 'j2', day: 'Saturday',   time: '2:00pm',  who: 'Femi K.',  what: 'Drain clearance',    area: 'Yaba',   status: 'confirmed' },
    { id: 'j3', day: 'Mon, May 5', time: '9:00am',  who: 'Chika I.', what: 'Bathroom fitting',   area: 'Lekki',  status: 'pending' },
]

export default function ProCalendar() {
    return (
        <div className='text-slate-700 mb-28 max-w-4xl'>
            <div className='flex items-start gap-4 mb-8'>
                <span className='inline-flex items-center justify-center size-12 rounded-2xl bg-violet-50 ring-1 ring-violet-200 text-violet-600 shrink-0'>
                    <CalendarDays size={20} />
                </span>
                <div>
                    <h1 className='text-2xl text-slate-900 font-semibold'>Calendar</h1>
                    <p className='text-sm text-slate-600 mt-1'>Upcoming jobs you&apos;ve confirmed through GoCart.</p>
                </div>
            </div>

            <div className='bg-white border border-slate-200 rounded-2xl overflow-hidden'>
                <ul className='divide-y divide-slate-100'>
                    {MOCK_JOBS.map((j) => (
                        <li key={j.id} className='p-5 flex items-start gap-4 flex-wrap'>
                            <div className='shrink-0 text-center bg-slate-50 ring-1 ring-slate-200 rounded-lg px-3 py-2 min-w-20'>
                                <p className='text-[10px] font-semibold uppercase tracking-wide text-slate-500'>{j.day.split(' ')[0]}</p>
                                <p className='text-sm font-bold text-slate-900 mt-0.5'>{j.day.split(' ').slice(1).join(' ') || j.day}</p>
                            </div>
                            <div className='flex-1 min-w-0'>
                                <p className='text-sm font-semibold text-slate-900'>{j.what}</p>
                                <p className='text-xs text-slate-600 mt-1'>For {j.who}</p>
                                <div className='flex items-center gap-3 mt-2 text-xs text-slate-500'>
                                    <span className='inline-flex items-center gap-1'><Clock size={11} /> {j.time}</span>
                                    <span className='inline-flex items-center gap-1'><MapPin size={11} /> {j.area}</span>
                                </div>
                            </div>
                            <span className={`shrink-0 inline-flex items-center text-[10px] font-bold uppercase tracking-wide rounded-full px-2.5 py-1 ${
                                j.status === 'confirmed'
                                    ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                                    : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
                            }`}>
                                {j.status}
                            </span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    )
}
