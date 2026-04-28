'use client'
import { FileText, ArrowRight } from 'lucide-react'

const MOCK_QUOTES = [
    { id: 'q1', from: 'Adaeze N.',  brief: 'Burst pipe under kitchen sink — needs same-day fix', when: '38m ago', urgent: true },
    { id: 'q2', from: 'Tobi A.',    brief: 'Full bathroom plumbing for new build — 2 bathrooms.',  when: '2h ago' },
    { id: 'q3', from: 'Ifeoma E.',  brief: 'Boiler replacement, 5-bedroom flat in Lekki.',          when: 'Yesterday' },
]

export default function ProQuotes() {
    return (
        <div className='text-slate-700 mb-28 max-w-4xl'>
            <h1 className='text-2xl text-slate-900 font-semibold mb-1'>Quote requests</h1>
            <p className='text-sm text-slate-600 mb-8'>Buyers asking for a price before booking.</p>

            <div className='bg-white border border-slate-200 rounded-2xl overflow-hidden'>
                <ul className='divide-y divide-slate-100'>
                    {MOCK_QUOTES.map((q) => (
                        <li key={q.id} className='p-5 flex items-start gap-4'>
                            <div className='size-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-semibold text-slate-600 shrink-0'>
                                {q.from.charAt(0)}
                            </div>
                            <div className='flex-1 min-w-0'>
                                <div className='flex items-center gap-2'>
                                    <p className='text-sm font-semibold text-slate-900'>{q.from}</p>
                                    {q.urgent && (
                                        <span className='inline-flex items-center text-[10px] font-bold uppercase tracking-wide bg-yellow-300 text-yellow-950 rounded px-1.5 py-0.5'>Urgent</span>
                                    )}
                                </div>
                                <p className='text-sm text-slate-700 mt-1.5 leading-relaxed'>{q.brief}</p>
                                <p className='text-[11px] text-slate-400 mt-2'>{q.when}</p>
                            </div>
                            <button className='shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-full px-4 py-2 transition'>
                                Send quote <ArrowRight size={12} />
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    )
}
