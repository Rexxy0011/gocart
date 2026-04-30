import Link from "next/link"
import { ArrowRight, MapPin, ShieldCheck, MessageSquare } from "lucide-react"

export const metadata = { title: 'About — GoCart' }

const PILLARS = [
    {
        Icon: MapPin,
        title: 'Mobile-first, built for Nigeria',
        body: 'Lagos, Abuja, Port Harcourt and beyond — every flow is designed to work on the phone in your pocket on a flaky connection.',
    },
    {
        Icon: MessageSquare,
        title: 'Buyers and sellers talk directly',
        body: 'No middleman pricing tricks, no hidden checkout. We connect you, then get out of the way. You agree the price, you handle the handover.',
    },
    {
        Icon: ShieldCheck,
        title: 'Trust you can see',
        body: 'Verified providers carry a blue tick. Reports go to a real person. Bad actors lose access — full stop.',
    },
]

export default function AboutPage() {
    return (
        <main className="max-w-3xl mx-auto px-6 py-14">
            <h1 className="text-3xl sm:text-4xl font-semibold text-slate-900">About GoCart</h1>
            <p className="text-slate-600 mt-4 leading-relaxed">
                GoCart is a classifieds marketplace for Nigeria. We help everyday sellers, small shops, and verified service
                providers reach buyers who are right around the corner. Listing is free; we don&apos;t take a cut on offline
                sales. We&apos;re building the calmest, most trustworthy place to buy and sell — one ad at a time.
            </p>

            <div className="grid sm:grid-cols-3 gap-5 mt-10">
                {PILLARS.map(({ Icon, title, body }) => (
                    <div key={title} className="bg-white ring-1 ring-slate-200 rounded-2xl p-5">
                        <span className="inline-flex items-center justify-center size-9 rounded-full bg-sky-50 text-sky-700">
                            <Icon size={16} />
                        </span>
                        <h2 className="text-base font-semibold text-slate-900 mt-4">{title}</h2>
                        <p className="text-sm text-slate-600 mt-2 leading-relaxed">{body}</p>
                    </div>
                ))}
            </div>

            <div className="mt-12 bg-slate-50 ring-1 ring-slate-200 rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-slate-900">Want to sell something?</h2>
                <p className="text-sm text-slate-600 mt-2">
                    Posting an ad takes about a minute. Buyers reach you directly through GoCart messages.
                </p>
                <Link
                    href="/store/add-product"
                    className="inline-flex items-center gap-2 mt-4 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-full px-5 py-2.5 transition"
                >
                    Post an ad <ArrowRight size={14} />
                </Link>
            </div>
        </main>
    )
}
