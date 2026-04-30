import Link from "next/link"
import { ShieldAlert, MapPin, MessageSquare, Eye, Flag } from "lucide-react"

export const metadata = { title: 'Safety — GoCart' }

const TIPS = [
    {
        Icon: MapPin,
        title: 'Meet in a public place',
        body: 'A petrol station forecourt, a busy shopping centre, the lobby of a bank — somewhere with people and CCTV. Never agree to meet at an empty address. Bring someone with you for high-value items.',
    },
    {
        Icon: Eye,
        title: 'Inspect before you pay',
        body: 'See it. Hold it. Test it. For phones, check the IMEI on the box and on the device itself. For cars, ask for the documents and run a quick history check. If a seller resists inspection, walk away.',
    },
    {
        Icon: MessageSquare,
        title: 'Keep the chat on GoCart',
        body: 'WhatsApp and Telegram conversations leave us no record if something goes wrong. The in-app messages are timestamped and we can review them when you report a problem.',
    },
    {
        Icon: ShieldAlert,
        title: 'No deposits to strangers',
        body: 'A seller who insists on a transfer before you&apos;ve seen the item is the single most common scam pattern. Pay on the spot, in person, after inspection. Verified-tick businesses are different — those have been reviewed.',
    },
    {
        Icon: Flag,
        title: 'Report anything that feels off',
        body: 'Every listing has a Report button. Reports go to a real person. We remove listings, suspend accounts, and (for serious cases) cooperate with law enforcement.',
    },
]

export default function SafetyPage() {
    return (
        <main className="max-w-3xl mx-auto px-6 py-14">
            <h1 className="text-3xl sm:text-4xl font-semibold text-slate-900">Stay safe on GoCart</h1>
            <p className="text-slate-600 mt-4 leading-relaxed">
                The vast majority of trades on GoCart are honest neighbours doing honest deals. Five rules cover almost every
                situation that goes wrong. Read them once — they take a minute and they&apos;ll save you a headache.
            </p>

            <ol className="mt-10 space-y-5">
                {TIPS.map(({ Icon, title, body }, i) => (
                    <li key={title} className="flex gap-4 bg-white ring-1 ring-slate-200 rounded-2xl p-5">
                        <span className="inline-flex items-center justify-center size-10 rounded-full bg-amber-50 text-amber-700 shrink-0 ring-1 ring-amber-200">
                            <Icon size={17} />
                        </span>
                        <div>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Rule {i + 1}</p>
                            <h2 className="text-base font-semibold text-slate-900 mt-0.5">{title}</h2>
                            <p className="text-sm text-slate-600 mt-2 leading-relaxed">{body}</p>
                        </div>
                    </li>
                ))}
            </ol>

            <div className="mt-12 bg-slate-50 ring-1 ring-slate-200 rounded-2xl p-6 text-sm text-slate-600 leading-relaxed">
                <p>
                    Saw something that doesn&apos;t look right? <Link href="/contact" className="text-sky-700 font-medium hover:underline">Tell us</Link>.
                    Every report is reviewed.
                </p>
            </div>
        </main>
    )
}
