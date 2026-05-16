import { ChevronRight } from "lucide-react"

export const metadata = {
    title: 'Terms of Use - Kakimart',
    description:
        "Kakimart's Terms of Use - user responsibilities, prohibited activities, " +
        "moderation, transactions, enforcement, and limitations.",
}

const USER_DUTIES = [
    'Provide accurate and up-to-date account information',
    'Maintain the security of their accounts',
    'Use the platform in a lawful and respectful manner',
    'Post genuine, accurate, and non-misleading listings',
    'Communicate respectfully with other users',
    'Comply with applicable laws and platform policies',
    'Avoid fraudulent, deceptive, or harmful activities',
]

const PROHIBITED = [
    'Scam attempts or fraudulent behavior',
    'Fake, misleading, or deceptive listings',
    'Impersonation of individuals or businesses',
    'Sale of illegal, counterfeit, stolen, or prohibited items',
    'Harassment, threats, or abusive conduct',
    'Spam, manipulation, or platform misuse',
    'Circumventing verification or security systems',
    'Attempting unauthorized access to accounts or platform infrastructure',
    'Uploading harmful software, malicious links, or unsafe content',
]

const MODERATION_REASONS = [
    'Violate platform policies',
    'Create safety concerns',
    'Appear fraudulent or misleading',
    'Receive credible reports of abuse or suspicious activity',
]

const TRANSACTION_DUTIES = [
    'Product inspections',
    'Payment decisions',
    'Delivery arrangements',
    'Transaction agreements',
    'Verifying the legitimacy of other users',
]

const SUSPENSION_TRIGGERS = [
    'Violate these Terms of Use',
    'Engage in suspicious or fraudulent activity',
    'Create security risks',
    'Abuse the platform or other users',
]

const LIABILITY_EXCLUSIONS = [
    'User disputes',
    'Financial losses',
    'Fraudulent transactions',
    'Misrepresentation by users',
    'Damages arising from marketplace interactions',
]

// Plain dash-bullet list, used inside expanded accordion bodies.
const DashList = ({ items }) => (
    <ul className="space-y-2">
        {items.map((item) => (
            <li key={item} className="flex gap-3">
                <span className="text-slate-400 select-none">-</span>
                <span>{item}</span>
            </li>
        ))}
    </ul>
)

// Native <details>/<summary> accordion row. Server-renderable, fully
// keyboard-accessible by default, no client JS required.
//
// `index` is rendered as a 2-digit chip (01, 02 …) on the left of the
// row. Clicking anywhere on the summary toggles open/closed; the
// chevron rotates 90° via `group-open:rotate-90`.
const AccordionRow = ({ index, title, children, defaultOpen = false }) => (
    <details className="group border-b border-slate-200" open={defaultOpen}>
        <summary
            className="flex items-center gap-4 sm:gap-6 py-6 cursor-pointer list-none select-none hover:bg-slate-50/60 transition px-2 -mx-2 rounded"
        >
            <span className="text-[11px] sm:text-xs font-bold tabular-nums text-slate-400 tracking-wide w-7 sm:w-9 shrink-0">
                {String(index).padStart(2, '0')}
            </span>
            <h2 className="flex-1 text-base sm:text-xl font-bold text-slate-900 tracking-tight">
                {title}
            </h2>
            <ChevronRight
                size={18}
                className="text-slate-400 group-hover:text-slate-700 group-open:rotate-90 transition shrink-0"
            />
        </summary>
        <div className="pb-8 pl-7 sm:pl-15 pr-2 -mt-1 space-y-4 text-slate-600 leading-relaxed max-w-3xl">
            {children}
        </div>
    </details>
)

export default function TermsPage() {
    return (
        <main className="bg-white min-h-screen">

            {/* Hero - big bold title + eyebrow, then the welcome intro
                visible above the accordion (collapsed sections shouldn't
                hide the very first thing a reader needs to see). */}
            <section className="max-w-4xl mx-auto px-6 pt-16 sm:pt-20 pb-10">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold uppercase text-slate-900 tracking-tight leading-[1]">
                    Terms of Use
                </h1>
                <p className="mt-4 text-[11px] sm:text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                    Rights · Responsibilities · Marketplace conduct
                </p>

                <div className="mt-10 space-y-5 text-slate-600 leading-relaxed">
                    <p>
                        Welcome to Kakimart. By accessing or using the Kakimart platform, website, or
                        services, you agree to comply with these Terms of Use. These terms are
                        designed to help maintain a safe, fair, and trusted marketplace experience
                        for all users.
                    </p>
                    <p>
                        Kakimart provides a digital marketplace that connects buyers, sellers,
                        businesses, and service providers across Nigeria. While we work to maintain
                        platform safety and integrity, users remain responsible for their
                        activities, listings, communications, and transactions conducted through the
                        platform.
                    </p>
                </div>
            </section>

            {/* Accordion - each row collapsed by default. No client JS;
                <details>/<summary> handles toggling natively. */}
            <section className="max-w-4xl mx-auto px-6 border-t border-slate-200">

                <AccordionRow index={1} title="User responsibilities">
                    <p>By using Kakimart, users agree to:</p>
                    <DashList items={USER_DUTIES} />
                    <p>
                        Users are responsible for ensuring that any products, services, or content
                        they post comply with applicable laws and Kakimart policies.
                    </p>
                </AccordionRow>

                <AccordionRow index={2} title="Prohibited activities">
                    <p>The following activities are strictly prohibited on Kakimart:</p>
                    <DashList items={PROHIBITED} />
                    <p className="text-slate-900 font-semibold">
                        Kakimart reserves the right to take action against accounts or content
                        involved in prohibited activities.
                    </p>
                </AccordionRow>

                <AccordionRow index={3} title="Listings & marketplace content">
                    <p>Users are responsible for the accuracy and legality of their listings and content.</p>
                    <p>
                        Kakimart may review, moderate, restrict, reject, or remove listings, accounts,
                        or content that:
                    </p>
                    <DashList items={MODERATION_REASONS} />
                    <p>
                        Kakimart is not obligated to publish or maintain any listing submitted to the
                        platform.
                    </p>
                </AccordionRow>

                <AccordionRow index={4} title="Transactions between users">
                    <p>
                        Kakimart serves as a marketplace platform and is not directly involved in
                        transactions between users.
                    </p>
                    <p>Buyers and sellers are individually responsible for:</p>
                    <DashList items={TRANSACTION_DUTIES} />
                    <p>Users are encouraged to follow recommended safety practices during all transactions.</p>
                </AccordionRow>

                <AccordionRow index={5} title="Account suspension & enforcement">
                    <p>
                        Kakimart reserves the right to suspend, restrict, or permanently remove accounts that:
                    </p>
                    <DashList items={SUSPENSION_TRIGGERS} />
                    <p className="text-slate-900 font-semibold">
                        Serious violations may result in immediate enforcement actions without prior notice.
                    </p>
                </AccordionRow>

                <AccordionRow index={6} title="Intellectual property">
                    <p>
                        Users must not post or use content that infringes on the intellectual property
                        rights of others, including copyrighted materials, trademarks, or unauthorized
                        business content.
                    </p>
                    <p>
                        Kakimart branding, platform design, and proprietary content remain the property
                        of Kakimart unless otherwise stated.
                    </p>
                </AccordionRow>

                <AccordionRow index={7} title="Limitation of liability">
                    <p>
                        Kakimart works to provide a secure and reliable marketplace environment, but
                        cannot guarantee the actions, behavior, quality, or legitimacy of users,
                        listings, or transactions conducted through the platform.
                    </p>
                    <p>To the extent permitted by law, Kakimart shall not be held liable for:</p>
                    <DashList items={LIABILITY_EXCLUSIONS} />
                    <p className="text-slate-900 font-semibold">
                        Users access and use the platform at their own discretion and responsibility.
                    </p>
                </AccordionRow>

                <AccordionRow index={8} title="Changes to terms">
                    <p>
                        Kakimart may update these Terms of Use periodically to reflect platform
                        improvements, operational changes, legal requirements, or security updates.
                    </p>
                    <p className="text-slate-900 font-semibold">
                        Continued use of the platform after updates constitutes acceptance of the
                        revised Terms.
                    </p>
                </AccordionRow>

                <AccordionRow index={9} title="Contact us">
                    <p>
                        For questions, concerns, or reports related to these Terms of Use, users may
                        contact Kakimart through the official support channels available on the
                        platform.
                    </p>
                </AccordionRow>

            </section>

            {/* Closing tagline */}
            <div className="max-w-4xl mx-auto px-6 py-12">
                <p className="text-xs sm:text-sm uppercase tracking-[0.18em] text-slate-500">
                    Kakimart - Building a safer and more trusted marketplace experience.
                </p>
            </div>
        </main>
    )
}
