import Link from "next/link"
import { Mail, MessageSquare, ShieldAlert } from "lucide-react"

export const metadata = { title: 'Contact — GoCart' }

const CHANNELS = [
    {
        Icon: MessageSquare,
        title: 'Buying or selling something specific',
        body: 'Open the listing, hit the Message seller button, type your question. Sellers reply through the in-app inbox.',
        href: '/shop',
        cta: 'Browse listings',
    },
    {
        Icon: ShieldAlert,
        title: 'Report a listing or a user',
        body: 'Every listing has a Report button. Pick a reason, add a note, and the report lands with our moderation team.',
        href: '/safety',
        cta: 'Read safety tips',
    },
    {
        Icon: Mail,
        title: 'Anything else',
        body: 'Press, partnerships, payment problems, account recovery, GDPR/data requests — email us and we&apos;ll route it to a human.',
        href: 'mailto:hello@gocart.ng',
        cta: 'hello@gocart.ng',
    },
]

export default function ContactPage() {
    return (
        <main className="max-w-3xl mx-auto px-6 py-14">
            <h1 className="text-3xl sm:text-4xl font-semibold text-slate-900">Get in touch</h1>
            <p className="text-slate-600 mt-4 leading-relaxed">
                We&apos;re a small team. Pick the channel that fits — it gets to the right person faster than a generic helpdesk.
            </p>

            <div className="grid sm:grid-cols-1 gap-4 mt-10">
                {CHANNELS.map(({ Icon, title, body, href, cta }) => (
                    <div key={title} className="flex gap-4 bg-white ring-1 ring-slate-200 rounded-2xl p-5">
                        <span className="inline-flex items-center justify-center size-10 rounded-full bg-sky-50 text-sky-700 shrink-0 ring-1 ring-sky-200">
                            <Icon size={17} />
                        </span>
                        <div className="flex-1 min-w-0">
                            <h2 className="text-base font-semibold text-slate-900">{title}</h2>
                            <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">{body}</p>
                            <Link
                                href={href}
                                className="inline-block mt-3 text-sm font-medium text-sky-700 hover:underline"
                            >
                                {cta} →
                            </Link>
                        </div>
                    </div>
                ))}
            </div>

            <p className="mt-10 text-xs text-slate-400 leading-relaxed">
                Office: Lagos (registered office TBD). Response times: messages within 1 business day,
                email within 2 business days.
            </p>
        </main>
    )
}
