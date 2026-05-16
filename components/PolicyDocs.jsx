'use client'
import { useEffect } from 'react'
import Link from 'next/link'
import { ShieldAlert, MapPin, MessageSquare, Eye, Flag, X } from 'lucide-react'

// Single source of truth for the Safety + Terms copy. Both the full
// /safety and /terms pages and the in-form PolicyModal render these
// components, so wording never drifts between contexts.

const SAFETY_TIPS = [
    {
        Icon: MapPin,
        title: 'Meet in a public place',
        body: 'A petrol station forecourt, a busy shopping centre, the lobby of a bank - somewhere with people and CCTV. Never agree to meet at an empty address. Bring someone with you for high-value items.',
    },
    {
        Icon: Eye,
        title: 'Inspect before you pay',
        body: 'See it. Hold it. Test it. For phones, check the IMEI on the box and on the device itself. For cars, ask for the documents and run a quick history check. If a seller resists inspection, walk away.',
    },
    {
        Icon: MessageSquare,
        title: 'Keep the chat on Kakimart',
        body: 'WhatsApp and Telegram conversations leave us no record if something goes wrong. The in-app messages are timestamped and we can review them when you report a problem.',
    },
    {
        Icon: ShieldAlert,
        title: 'No deposits to strangers',
        body: "A seller who insists on a transfer before you've seen the item is the single most common scam pattern. Pay on the spot, in person, after inspection. Verified-tick businesses are different - those have been reviewed.",
    },
    {
        Icon: Flag,
        title: 'Report anything that feels off',
        body: 'Every listing has a Report button. Reports go to a real person. We remove listings, suspend accounts, and (for serious cases) cooperate with law enforcement.',
    },
]

export const SafetyContent = () => (
    <>
        <h1 className='text-2xl sm:text-3xl font-semibold text-slate-900'>Stay safe on Kakimart</h1>
        <p className='text-slate-600 mt-3 leading-relaxed text-sm sm:text-base'>
            The vast majority of trades on Kakimart are honest neighbours doing honest deals. Five rules cover almost every
            situation that goes wrong. Read them once - they take a minute and they&apos;ll save you a headache.
        </p>
        <ol className='mt-8 space-y-4'>
            {SAFETY_TIPS.map(({ Icon, title, body }, i) => (
                <li key={title} className='flex gap-4 bg-white ring-1 ring-slate-200 rounded-2xl p-4'>
                    <span className='inline-flex items-center justify-center size-9 rounded-full bg-amber-50 text-amber-700 shrink-0 ring-1 ring-amber-200'>
                        <Icon size={16} />
                    </span>
                    <div>
                        <p className='text-[10px] font-semibold text-slate-400 uppercase tracking-wide'>Rule {i + 1}</p>
                        <h2 className='text-sm font-semibold text-slate-900 mt-0.5'>{title}</h2>
                        <p className='text-sm text-slate-600 mt-1.5 leading-relaxed'>{body}</p>
                    </div>
                </li>
            ))}
        </ol>
    </>
)

export const TermsContent = () => (
    <>
        <h1 className='text-2xl sm:text-3xl font-semibold text-slate-900'>Terms of Use</h1>
        <p className='text-xs text-slate-500 mt-1'>Last updated: 2026-04</p>
        <p className='mt-5 text-sm text-slate-700 leading-relaxed'>
            These terms govern your use of Kakimart. By creating an account, posting an ad, or messaging another user, you
            agree to them. If you don&apos;t, please don&apos;t use the service.
        </p>

        <h2 className='text-base font-semibold text-slate-900 mt-7'>1. What Kakimart is</h2>
        <p className='mt-2 text-sm text-slate-700 leading-relaxed'>
            Kakimart is a classifieds platform. We connect buyers and sellers and let them message each other. We&apos;re not a
            party to any transaction, and we don&apos;t take payment for offline sales. For Verified-tick businesses, embedded
            checkout flows may be operated by the seller or their payment provider; commission, if any, is disclosed at checkout.
        </p>

        <h2 className='text-base font-semibold text-slate-900 mt-7'>2. Your account</h2>
        <p className='mt-2 text-sm text-slate-700 leading-relaxed'>
            You are responsible for what happens under your account. Don&apos;t share login credentials. Use your real name and
            a real email. If you suspect unauthorised access, <Link href='/contact' className='text-sky-700 hover:underline'>tell us</Link> immediately.
        </p>

        <h2 className='text-base font-semibold text-slate-900 mt-7'>3. Posting rules</h2>
        <ul className='mt-2 text-sm text-slate-700 list-disc pl-6 space-y-1.5 leading-relaxed'>
            <li>List only items you own or are authorised to sell.</li>
            <li>Be accurate - condition, photos, mileage, year. Fraudulent listings get removed and accounts suspended.</li>
            <li>No prohibited goods: stolen items, weapons outside legal channels, counterfeit goods, recreational drugs, live animals beyond legal pet trade, human-trafficking content.</li>
            <li>One listing per item. Duplicate-flooding is treated as spam.</li>
            <li>Boosts (Bump, Featured, Urgent, Bulk sale, Bundle) are visibility products - we do not refund unused time.</li>
        </ul>

        <h2 className='text-base font-semibold text-slate-900 mt-7'>4. Conduct between users</h2>
        <p className='mt-2 text-sm text-slate-700 leading-relaxed'>
            Treat other users with basic respect. Harassment, threats, hate speech, or attempting to defraud another user
            will cost you your account. Read the <Link href='/safety' className='text-sky-700 hover:underline'>Safety guide</Link> before
            meeting anyone in person.
        </p>

        <h2 className='text-base font-semibold text-slate-900 mt-7'>5. Disputes</h2>
        <p className='mt-2 text-sm text-slate-700 leading-relaxed'>
            Disputes about the item, price, condition, or delivery are between you and the other party. We&apos;ll cooperate
            with reasonable requests from law enforcement. We don&apos;t adjudicate consumer disputes the way a marketplace with
            custodial checkout would, because we don&apos;t hold the money.
        </p>

        <h2 className='text-base font-semibold text-slate-900 mt-7'>6. Termination</h2>
        <p className='mt-2 text-sm text-slate-700 leading-relaxed'>
            We may suspend or terminate accounts that violate these terms or harm other users. You may delete your account at
            any time by contacting us; we&apos;ll handle data deletion per the <Link href='/privacy' className='text-sky-700 hover:underline'>Privacy Notice</Link>.
        </p>

        <h2 className='text-base font-semibold text-slate-900 mt-7'>7. Changes</h2>
        <p className='mt-2 text-sm text-slate-700 leading-relaxed'>
            We&apos;ll update these terms from time to time. Material changes will be highlighted in-app. Continued use after a
            change means you accept it.
        </p>

        <p className='text-xs text-slate-400 mt-10'>
            Kakimart Limited, registered company number TBD. Contact:{' '}
            <Link href='/contact' className='text-sky-700 hover:underline'>/contact</Link>.
        </p>
    </>
)

export const PrivacyContent = () => (
    <>
        <h1 className='text-2xl sm:text-3xl font-semibold text-slate-900'>Privacy Notice</h1>
        <p className='text-xs text-slate-500 mt-1'>Last updated: 2026-05</p>

        <p className='mt-5 text-sm text-slate-700 leading-relaxed'>
            This notice explains what Kakimart Limited (&quot;Kakimart&quot;, &quot;we&quot;) collects, why, and how long we keep it.
            We comply with the Nigerian Data Protection Act (NDPA) 2023.
        </p>

        <h2 className='text-base font-semibold text-slate-900 mt-7'>1. What we collect</h2>
        <ul className='mt-2 text-sm text-slate-700 list-disc pl-6 space-y-1.5 leading-relaxed'>
            <li><strong>Account:</strong> name, email, phone number.</li>
            <li><strong>Listings:</strong> photos, description, price, location.</li>
            <li><strong>Verification (Pro applicants only):</strong> ID document (NIN / passport / driver&apos;s license / voter card) and a selfie. We use these only to confirm you are who you say you are.</li>
            <li><strong>Payments:</strong> processed entirely by Paystack. We never see or store your card details.</li>
            <li><strong>Usage:</strong> standard server logs (IP, browser, pages visited) for security and abuse prevention.</li>
        </ul>

        <h2 className='text-base font-semibold text-slate-900 mt-7'>2. Why we collect it</h2>
        <p className='mt-2 text-sm text-slate-700 leading-relaxed'>
            To run the platform, prevent fraud, and meet our legal obligations. ID documents are processed under your
            explicit consent (the box you ticked when applying for verification) - that&apos;s our lawful basis under NDPA.
        </p>

        <h2 className='text-base font-semibold text-slate-900 mt-7'>3. Who we share it with</h2>
        <ul className='mt-2 text-sm text-slate-700 list-disc pl-6 space-y-1.5 leading-relaxed'>
            <li><strong>Other users:</strong> anything you put on a public listing or in a message - that&apos;s the point.</li>
            <li><strong>Paystack:</strong> the minimum needed to process a boost payment. We never see your card details.</li>
            <li><strong>Supabase:</strong> our database, storage, and auth provider.</li>
            <li><strong>Resend:</strong> handles transactional email (e.g. boost-expiry reminders).</li>
            <li><strong>Kakimart admin team:</strong> only the small group needed to review applications and respond to reports. ID documents live in a private Storage bucket; admins access them through short-lived signed URLs that expire automatically.</li>
            <li><strong>Authorities:</strong> when legally required.</li>
        </ul>
        <p className='mt-2 text-sm text-slate-700 leading-relaxed'>
            We do <strong>not</strong> sell or rent your data to advertisers.
        </p>

        <h2 className='text-base font-semibold text-slate-900 mt-7'>4. How long we keep it</h2>
        <ul className='mt-2 text-sm text-slate-700 list-disc pl-6 space-y-1.5 leading-relaxed'>
            <li><strong>Account data:</strong> as long as your account is open. Deleted within 30 days of account closure.</li>
            <li><strong>ID documents and selfies:</strong> deleted automatically <strong>30 days after a decision</strong> on your application (approval or rejection). The verification record itself stays so we know you were verified.</li>
            <li><strong>Listing data:</strong> until you remove the listing or close your account.</li>
            <li><strong>Closed conversations:</strong> kept for 12 months for safety review, then anonymised.</li>
            <li><strong>Payment references:</strong> 7 years for accounting/tax purposes.</li>
            <li><strong>Server logs:</strong> 90 days.</li>
        </ul>

        <h2 className='text-base font-semibold text-slate-900 mt-7'>4a. Cookies</h2>
        <p className='mt-2 text-sm text-slate-700 leading-relaxed'>
            We use a small number of cookies for login sessions and basic analytics. You can clear or block them in your browser
            - login sessions won&apos;t survive that.
        </p>

        <h2 className='text-base font-semibold text-slate-900 mt-7'>5. Your rights</h2>
        <p className='mt-2 text-sm text-slate-700 leading-relaxed'>
            Under NDPA you have the right to access your data, correct it, delete it, or withdraw consent. To exercise any
            of these, email us via <Link href='/contact' className='text-sky-700 hover:underline'>/contact</Link>. We respond within 30 days.
        </p>

        <h2 className='text-base font-semibold text-slate-900 mt-7'>6. Breach notification</h2>
        <p className='mt-2 text-sm text-slate-700 leading-relaxed'>
            In the unlikely event of a data breach affecting your information, we will notify you and the Nigeria Data
            Protection Commission within 72 hours.
        </p>

        <h2 className='text-base font-semibold text-slate-900 mt-7'>7. Changes</h2>
        <p className='mt-2 text-sm text-slate-700 leading-relaxed'>
            We&apos;ll update this notice from time to time. Material changes will be highlighted in-app.
        </p>

        <p className='text-xs text-slate-400 mt-10'>
            Kakimart Limited. Contact:{' '}
            <Link href='/contact' className='text-sky-700 hover:underline'>/contact</Link>.
        </p>
    </>
)

// Reusable modal for any policy doc. Locks body scroll while open and
// closes on Escape so the seller can ⌫ back to the form quickly.
export const PolicyModal = ({ open, onClose, children }) => {

    useEffect(() => {
        if (!open) return
        const onKey = (e) => { if (e.key === 'Escape') onClose() }
        document.addEventListener('keydown', onKey)
        const prev = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        return () => {
            document.removeEventListener('keydown', onKey)
            document.body.style.overflow = prev
        }
    }, [open, onClose])

    if (!open) return null

    return (
        <div
            className='fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4'
            onClick={onClose}
        >
            <div
                className='bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-2xl max-h-[90vh] flex flex-col'
                onClick={(e) => e.stopPropagation()}
            >
                <div className='flex items-center justify-end px-4 py-2 border-b border-slate-100'>
                    <button
                        type='button'
                        onClick={onClose}
                        aria-label='Close'
                        className='size-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500'
                    >
                        <X size={16} />
                    </button>
                </div>
                <div className='overflow-y-auto px-6 py-5'>
                    {children}
                </div>
            </div>
        </div>
    )
}
