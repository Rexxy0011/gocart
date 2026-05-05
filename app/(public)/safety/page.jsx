import Link from 'next/link'
import { SafetyContent } from '@/components/PolicyDocs'

export const metadata = { title: 'Safety — GoCart' }

export default function SafetyPage() {
    return (
        <main className='max-w-3xl mx-auto px-6 py-14'>
            <SafetyContent />
            <div className='mt-12 bg-slate-50 ring-1 ring-slate-200 rounded-2xl p-6 text-sm text-slate-600 leading-relaxed'>
                <p>
                    Saw something that doesn&apos;t look right?{' '}
                    <Link href='/contact' className='text-sky-700 font-medium hover:underline'>Tell us</Link>.
                    Every report is reviewed.
                </p>
            </div>
        </main>
    )
}
