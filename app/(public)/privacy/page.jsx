export const metadata = {
    title: 'Privacy Notice — GoCart',
    description:
        "How GoCart collects, uses, stores, and protects your personal information. " +
        "Your data, your rights, our commitments.",
}

const INFO_COLLECTED = [
    'Name, phone number, and email address',
    'Account and profile information',
    'Verification information where applicable',
    'Device, browser, and IP information',
    'Marketplace activity and interactions',
    'Communication and support-related data',
]

const INFO_USE = [
    'Create and manage user accounts',
    'Operate and improve marketplace services',
    'Verify accounts and reduce fraudulent activity',
    'Monitor platform security and integrity',
    'Provide customer support',
    'Personalize user experience',
    'Comply with legal and regulatory obligations',
]

const SHARING_REASONS = [
    'Platform operations and technical services',
    'Fraud prevention and security investigations',
    'Legal or regulatory compliance',
    'Protecting the rights, safety, or integrity of users and the platform',
]

const USER_RIGHTS = [
    'Update or correct account information',
    'Manage account settings',
    'Request account deletion, subject to legal and operational requirements',
]

// Dash bullets — keeps lists feeling like prose, no chips or icons.
const DashList = ({ items }) => (
    <ul className="space-y-2">
        {items.map((item) => (
            <li key={item} className="flex gap-3">
                <span className="text-slate-400 select-none">—</span>
                <span>{item}</span>
            </li>
        ))}
    </ul>
)

// Title-on-left, body-on-right section row. Stacks on mobile.
const Row = ({ title, children }) => (
    <section className="grid lg:grid-cols-12 gap-6 lg:gap-12 py-10 border-b border-slate-200">
        <div className="lg:col-span-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">{title}</h2>
        </div>
        <div className="lg:col-span-9 space-y-4 text-slate-600 leading-relaxed">
            {children}
        </div>
    </section>
)

export default function PrivacyPage() {
    return (
        <main className="bg-white min-h-screen">

            {/* Hero — same big bold uppercase title from before, now on white */}
            <section className="max-w-6xl mx-auto px-6 py-16 sm:py-20 border-b border-slate-200">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold uppercase text-slate-900 tracking-tight leading-[1]">
                    Privacy Notice
                </h1>
                <p className="mt-4 text-[11px] sm:text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                    Your data · Our practices · Cookies · Third parties
                </p>
            </section>

            {/* Body — two-column rows */}
            <article className="max-w-6xl mx-auto px-6">

                <Row title="Personal statement">
                    <p>
                        At GoCart, we value your privacy and are committed to protecting your
                        personal information. This Privacy Notice explains how we collect, use,
                        store, and protect information when you use our platform and services.
                    </p>
                    <p>
                        By accessing or using GoCart, you agree to the practices described in
                        this Privacy Notice.
                    </p>
                </Row>

                <Row title="Information we collect">
                    <p>
                        To operate and improve our marketplace, GoCart may collect certain
                        information, including:
                    </p>
                    <DashList items={INFO_COLLECTED} />
                    <p>
                        Some information is collected directly from users, while certain
                        technical information may be collected automatically during platform
                        usage.
                    </p>
                </Row>

                <Row title="How we use information">
                    <p>GoCart uses collected information to:</p>
                    <DashList items={INFO_USE} />
                    <p>
                        We only use information where necessary for legitimate platform
                        operations and user protection.
                    </p>
                </Row>

                <Row title="Data protection">
                    <p>
                        GoCart implements security measures designed to help protect user
                        information from unauthorized access, misuse, alteration, or loss.
                    </p>
                    <p>
                        While we work to maintain secure systems, no online platform can
                        guarantee absolute security. Users are also responsible for protecting
                        their account credentials and login information.
                    </p>
                </Row>

                <Row title="Information sharing">
                    <p className="text-slate-900 font-semibold">
                        GoCart does not sell users&apos; personal information to third parties.
                    </p>
                    <p>Information may only be shared where necessary for:</p>
                    <DashList items={SHARING_REASONS} />
                    <p>
                        Any authorized third-party service providers are expected to handle
                        information responsibly and securely.
                    </p>
                </Row>

                <Row title="User rights">
                    <p>Users may request to:</p>
                    <DashList items={USER_RIGHTS} />
                    <p>
                        Certain information may be retained where necessary for fraud
                        prevention, dispute resolution, legal compliance, or security purposes.
                    </p>
                </Row>

                <Row title="Cookies & platform technologies">
                    <p>
                        GoCart may use cookies and similar technologies to improve functionality,
                        maintain user sessions, analyze platform performance, and enhance user
                        experience.
                    </p>
                    <p>
                        Users can manage certain browser cookie settings through their device or
                        browser preferences.
                    </p>
                </Row>

                <Row title="Updates to this notice">
                    <p>
                        GoCart may update this Privacy Notice periodically to reflect platform
                        improvements, operational changes, legal requirements, or security
                        updates.
                    </p>
                    <p className="text-slate-900 font-semibold">
                        Continued use of the platform after updates constitutes acceptance of
                        the revised Privacy Notice.
                    </p>
                </Row>

                <Row title="Contact us">
                    <p>
                        If you have questions or concerns regarding this Privacy Notice or your
                        personal information, please contact GoCart through the official support
                        channels available on the platform.
                    </p>
                </Row>

                {/* Closing tagline — sits below the last row, no border */}
                <div className="py-12">
                    <p className="text-xs sm:text-sm uppercase tracking-[0.18em] text-slate-500">
                        GoCart — Building a safer and more trusted marketplace experience.
                    </p>
                </div>
            </article>
        </main>
    )
}
