'use client'
import Link from 'next/link'
import { Inbox, MessageSquareText, Sparkles } from 'lucide-react'

export default function ProInquiries() {
    return (
        <div className='text-slate-700 mb-28 max-w-4xl'>
            <h1 className='text-2xl text-slate-900 font-semibold mb-1'>Inquiries</h1>
            <p className='text-sm text-slate-600 mb-8'>Buyer messages on your service listings.</p>

            <div className='border border-dashed border-slate-300 rounded-xl p-10 text-center bg-slate-50/60'>
                <span className='inline-flex items-center justify-center size-14 rounded-full bg-white ring-1 ring-slate-200'>
                    <Inbox size={22} className='text-slate-400' />
                </span>
                <h2 className='text-lg font-semibold text-slate-900 mt-5'>No inquiries yet</h2>
                <p className='text-sm text-slate-600 mt-2 max-w-md mx-auto'>
                    When a buyer contacts you on a service listing, the conversation lands here. Reply directly — GoCart never takes a cut on offline jobs.
                </p>
                <div className='mt-6 inline-flex items-center gap-2 text-xs text-slate-500 bg-white ring-1 ring-slate-200 rounded-full px-3 py-1.5'>
                    <MessageSquareText size={12} className='text-slate-400' />
                    In-app messaging is rolling out.
                </div>
            </div>

            <div className='mt-6 bg-sky-50 ring-1 ring-sky-200 rounded-xl p-4 flex items-start gap-3'>
                <Sparkles size={16} className='text-sky-600 mt-0.5 shrink-0' />
                <p className='text-sm text-slate-700'>
                    <span className='font-semibold'>Lead alerts</span> on your dashboard show buyers searching for your service before they message anyone — get there first.{' '}
                    <Link href='/pro' className='text-sky-700 font-medium hover:underline'>Open dashboard →</Link>
                </p>
            </div>
        </div>
    )
}
