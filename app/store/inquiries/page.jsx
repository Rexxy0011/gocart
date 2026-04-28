'use client'
import Link from 'next/link'
import { Inbox, MessageSquareText, Sparkles } from 'lucide-react'

export default function StoreInquiries() {
    return (
        <div className='text-slate-500 mb-28 max-w-4xl'>
            <h1 className='text-2xl text-slate-900 font-semibold mb-1'>Inquiries</h1>
            <p className='text-sm text-slate-600 mb-8'>
                Buyer messages on your listings will appear here.
            </p>

            {/* Empty / coming-soon state */}
            <div className='border border-dashed border-slate-300 rounded-xl p-10 text-center bg-slate-50/60'>
                <span className='inline-flex items-center justify-center size-14 rounded-full bg-white ring-1 ring-slate-200'>
                    <Inbox size={22} className='text-slate-400' />
                </span>
                <h2 className='text-lg font-semibold text-slate-900 mt-5'>No inquiries yet</h2>
                <p className='text-sm text-slate-600 mt-2 max-w-md mx-auto'>
                    Once a buyer sends a message on one of your ads, the conversation lands here. Reply directly — GoCart never takes a cut on offline sales.
                </p>

                <div className='mt-6 inline-flex items-center gap-2 text-xs text-slate-500 bg-white ring-1 ring-slate-200 rounded-full px-3 py-1.5'>
                    <MessageSquareText size={12} className='text-slate-400' />
                    In-app messaging is rolling out — listings already accept inquiries on the buyer side.
                </div>

                <div className='mt-8'>
                    <Link
                        href='/store/add-product'
                        className='inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-full px-5 py-2.5 transition'
                    >
                        Post an ad
                    </Link>
                </div>
            </div>

            {/* Power Account hint — contextual, not pushy */}
            <div className='mt-6 bg-sky-50 ring-1 ring-sky-200 rounded-xl p-4 flex items-start gap-3'>
                <Sparkles size={16} className='text-sky-600 mt-0.5 shrink-0' />
                <p className='text-sm text-slate-700'>
                    <span className='font-semibold'>Lead alerts</span> are part of Power Account — get pinged the moment a buyer in your area searches your category, before they message anyone.{' '}
                    <Link href='/pricing' className='text-sky-700 font-medium hover:underline'>How Power Account works →</Link>
                </p>
            </div>
        </div>
    )
}
