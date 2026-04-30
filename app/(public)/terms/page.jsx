import Link from "next/link"

export const metadata = { title: 'Terms of Use — GoCart' }

export default function TermsPage() {
    return (
        <main className="max-w-3xl mx-auto px-6 py-14 text-slate-700 leading-relaxed">
            <h1 className="text-3xl sm:text-4xl font-semibold text-slate-900">Terms of Use</h1>
            <p className="text-sm text-slate-500 mt-2">Last updated: 2026-04</p>

            <p className="mt-6">
                These terms govern your use of GoCart. By creating an account, posting an ad, or messaging another user, you
                agree to them. If you don&apos;t, please don&apos;t use the service.
            </p>

            <h2 className="text-lg font-semibold text-slate-900 mt-10">1. What GoCart is</h2>
            <p className="mt-3 text-sm">
                GoCart is a classifieds platform. We connect buyers and sellers and let them message each other. We&apos;re not a
                party to any transaction, and we don&apos;t take payment for offline sales. For Verified-tick businesses, embedded
                checkout flows may be operated by the seller or their payment provider; commission, if any, is disclosed at checkout.
            </p>

            <h2 className="text-lg font-semibold text-slate-900 mt-10">2. Your account</h2>
            <p className="mt-3 text-sm">
                You are responsible for what happens under your account. Don&apos;t share login credentials. Use your real name and
                a real email. If you suspect unauthorised access, <Link href="/contact" className="text-sky-700 hover:underline">tell us</Link> immediately.
            </p>

            <h2 className="text-lg font-semibold text-slate-900 mt-10">3. Posting rules</h2>
            <ul className="mt-3 text-sm list-disc pl-6 space-y-1.5">
                <li>List only items you own or are authorised to sell.</li>
                <li>Be accurate — condition, photos, mileage, year. Fraudulent listings get removed and accounts suspended.</li>
                <li>No prohibited goods: stolen items, weapons outside legal channels, counterfeit goods, recreational drugs, live animals beyond legal pet trade, human-trafficking content.</li>
                <li>One listing per item. Duplicate-flooding is treated as spam.</li>
                <li>Boosts (Bump, Featured, Urgent, Bulk sale, Bundle) are visibility products — we do not refund unused time.</li>
            </ul>

            <h2 className="text-lg font-semibold text-slate-900 mt-10">4. Conduct between users</h2>
            <p className="mt-3 text-sm">
                Treat other users with basic respect. Harassment, threats, hate speech, or attempting to defraud another user
                will cost you your account. Read the <Link href="/safety" className="text-sky-700 hover:underline">Safety guide</Link> before
                meeting anyone in person.
            </p>

            <h2 className="text-lg font-semibold text-slate-900 mt-10">5. Disputes</h2>
            <p className="mt-3 text-sm">
                Disputes about the item, price, condition, or delivery are between you and the other party. We&apos;ll cooperate
                with reasonable requests from law enforcement. We don&apos;t adjudicate consumer disputes the way a marketplace with
                custodial checkout would, because we don&apos;t hold the money.
            </p>

            <h2 className="text-lg font-semibold text-slate-900 mt-10">6. Termination</h2>
            <p className="mt-3 text-sm">
                We may suspend or terminate accounts that violate these terms or harm other users. You may delete your account at
                any time by contacting us; we&apos;ll handle data deletion per the <Link href="/privacy" className="text-sky-700 hover:underline">Privacy Notice</Link>.
            </p>

            <h2 className="text-lg font-semibold text-slate-900 mt-10">7. Changes</h2>
            <p className="mt-3 text-sm">
                We&apos;ll update these terms from time to time. Material changes will be highlighted in-app. Continued use after a
                change means you accept it.
            </p>

            <p className="text-xs text-slate-400 mt-12">
                GoCart Limited, registered company number TBD. Contact:{" "}
                <Link href="/contact" className="text-sky-700 hover:underline">/contact</Link>.
            </p>
        </main>
    )
}
