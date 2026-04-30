import Link from "next/link"

export const metadata = { title: 'Privacy Notice — GoCart' }

export default function PrivacyPage() {
    return (
        <main className="max-w-3xl mx-auto px-6 py-14 text-slate-700 leading-relaxed">
            <h1 className="text-3xl sm:text-4xl font-semibold text-slate-900">Privacy Notice</h1>
            <p className="text-sm text-slate-500 mt-2">Last updated: 2026-04</p>

            <p className="mt-6">
                This notice explains what data we collect, why, and what you can do about it. We collect the minimum needed to
                run the service, and we don&apos;t sell your data to third parties.
            </p>

            <h2 className="text-lg font-semibold text-slate-900 mt-10">What we collect</h2>
            <ul className="mt-3 text-sm list-disc pl-6 space-y-1.5">
                <li><span className="font-medium">Account info</span>: name, email, password (hashed), profile image.</li>
                <li><span className="font-medium">Listings you post</span>: title, description, photos, price, location, category, contact phone (optional).</li>
                <li><span className="font-medium">Messages</span>: content of conversations between buyers and sellers, timestamps, read receipts.</li>
                <li><span className="font-medium">Payments</span>: when you buy a boost, Paystack handles the card data. We store the transaction reference and amount, not the card.</li>
                <li><span className="font-medium">Verification documents</span> (verified providers only): ID and licence images. Stored privately, viewable only by our review team.</li>
                <li><span className="font-medium">Technical data</span>: IP address, browser type, basic analytics for crash and abuse detection.</li>
            </ul>

            <h2 className="text-lg font-semibold text-slate-900 mt-10">Why we use it</h2>
            <ul className="mt-3 text-sm list-disc pl-6 space-y-1.5">
                <li>To run the service: show your listings, route messages, process boosts.</li>
                <li>To keep the marketplace safe: detect fraud, review reports, suspend bad actors.</li>
                <li>To comply with law: respond to lawful requests from authorities.</li>
            </ul>

            <h2 className="text-lg font-semibold text-slate-900 mt-10">Who we share it with</h2>
            <ul className="mt-3 text-sm list-disc pl-6 space-y-1.5">
                <li><span className="font-medium">Other users</span>: anything you put on a public listing or in a message — that&apos;s the point.</li>
                <li><span className="font-medium">Paystack</span>: the minimum needed to process a boost payment.</li>
                <li><span className="font-medium">Supabase</span>: our database and storage provider.</li>
                <li><span className="font-medium">Authorities</span>: when legally required.</li>
            </ul>
            <p className="mt-3 text-sm">
                We do not sell or rent your data to advertisers.
            </p>

            <h2 className="text-lg font-semibold text-slate-900 mt-10">Your rights</h2>
            <ul className="mt-3 text-sm list-disc pl-6 space-y-1.5">
                <li>Ask for a copy of your data.</li>
                <li>Correct anything wrong on your profile yourself, or ask us if you can&apos;t.</li>
                <li>Delete your account — listings come down, messages are anonymised, login is removed.</li>
                <li>Object to specific processing (e.g. analytics) — email us.</li>
            </ul>
            <p className="mt-3 text-sm">
                Email <Link href="/contact" className="text-sky-700 hover:underline">our team</Link> for any of the above.
            </p>

            <h2 className="text-lg font-semibold text-slate-900 mt-10">Cookies</h2>
            <p className="mt-3 text-sm">
                We use a small number of cookies for login sessions and basic analytics. You can clear or block them in your browser
                — login sessions won&apos;t survive that.
            </p>

            <h2 className="text-lg font-semibold text-slate-900 mt-10">Data retention</h2>
            <p className="mt-3 text-sm">
                Active listings stay until you take them down. Closed conversations are kept for 12 months for safety review, then
                anonymised. Payment references are kept for 7 years for accounting purposes.
            </p>

            <p className="text-xs text-slate-400 mt-12">
                GoCart Limited, registered company number TBD. Data controller contact:{" "}
                <Link href="/contact" className="text-sky-700 hover:underline">/contact</Link>.
            </p>
        </main>
    )
}
