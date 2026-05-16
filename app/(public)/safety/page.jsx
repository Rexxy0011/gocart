import {
    MapPin, ScanSearch, BanknoteX, Lock, ShieldCheck, AlertTriangle,
    MessageSquareLock, Flag,
    UserCheck, Truck, Gem,
    Eye, Cog, Users, LifeBuoy,
} from "lucide-react"
import StickyTOC from "@/components/StickyTOC"

export const metadata = {
    title: 'Safety Tips - Kakimart',
    description:
        "How to stay safe on Kakimart - meeting buyers and sellers, inspecting products, " +
        "avoiding scams, protecting personal information, and reporting suspicious activity.",
}

// ── Data ─────────────────────────────────────────────────────────────────

const TOC = [
    { id: 'general',        label: 'General safety tips' },
    { id: 'sellers',        label: 'Safety tips for sellers' },
    { id: 'scam-awareness', label: 'Online scam awareness' },
    { id: 'commitment',     label: "Kakimart's commitment" },
    { id: 'shared',         label: 'Shared responsibility' },
    { id: 'help',           label: 'Need help?' },
]

const SAFE_LOCATIONS = ['Shopping malls','Bank premises','Fuel stations','Restaurants or cafés','Police-approved safe zones','Busy commercial areas']
const INSPECT_GENERAL = ['Product condition','Functionality','Completeness of accessories','Originality / authenticity','Serial numbers where applicable']
const INSPECT_ELECTRONICS = ['Test the device properly','Confirm battery health where applicable','Verify accessories and receipts if available','Ensure the item matches the listing description']
const INSPECT_VEHICLES = ['Request inspection documents where necessary','Verify ownership documents','Consider professional mechanical inspection before purchase']
const SCAM_TACTICS = ['Fake urgency','“Last buyer” pressure tactics','Unrealistic discounts','Emotional stories','Delivery promises without verification']
const PAY_AFTER = ['Pay after inspection','Use secure transaction methods','Confirm identities before transferring funds']
const SENSITIVE_INFO = ['Bank PINs','OTP codes','ATM card details','Passwords','BVN information','Email login credentials']
const PROFILE_REVIEW = ['Seller profile details','Verification status','Account activity','Reviews or transaction history where available']
const SCAM_INDICATORS = ['Extremely low prices','Poor-quality or copied images','Refusal to meet physically','Requests for urgent transfers','Inconsistent product information','Fake proof of payment screenshots']
const IN_APP_BENEFITS = ['Improve dispute investigations','Detect suspicious activity','Monitor abusive behavior','Strengthen user protection systems']
const REPORT_TRIGGERS = ['Fake listings','Scam attempts','Harassment','Impersonation','Fraudulent payment activity','Threatening behavior','Stolen product listings']
const SUSPICIOUS_BUYERS = ['Rush transactions aggressively','Refuse proper communication','Send fake alerts or fake transfers','Overcomplicate payment arrangements','Request unusual delivery methods']
const SHIPPING_TRICKS = ['Delayed transfer tricks','Edited bank receipts','Fake mobile banking screenshots','Reversed transactions']
const HIGH_VALUE_ITEMS = ['Phones','Laptops','Vehicles','Luxury items','Business equipment']
const HIGH_VALUE_PRACTICES = ['Meeting in secure locations','Using bank environments','Requesting identification where appropriate','Recording transaction evidence']
const SCAM_PATTERNS = ['Fake delivery agents','Identity impersonation','Fake escrow promises','WhatsApp business impersonation','Payment reversal scams','Phishing links','Fake customer support contacts']
const SAFETY_INFRASTRUCTURE = ['Account verification systems','Automated fraud detection','Intelligent listing moderation','Behavioral risk analysis','Suspicious activity monitoring','User reporting systems','Spam prevention technologies','Security-focused platform improvements']

// ── Reusable building blocks ─────────────────────────────────────────────

// Two-column dot list. Tone controls bullet colour - emerald for
// positive / actionable, rose for warnings / red flags.
const DotList = ({ items, tone = 'emerald', columns = 2 }) => (
    <ul className={`grid ${columns === 2 ? 'sm:grid-cols-2' : ''} gap-x-6 gap-y-2`}>
        {items.map((item) => (
            <li key={item} className="flex items-start gap-3">
                <span className={`mt-2 size-1.5 rounded-full shrink-0 ${tone === 'rose' ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                <span className="text-slate-800">{item}</span>
            </li>
        ))}
    </ul>
)

// Sub-section card. Icon + title at top, accented left rail, hover lifts it.
const SubSection = ({ Icon, title, children }) => (
    <div className="bg-white ring-1 ring-slate-200 rounded-2xl p-6 sm:p-7 hover:ring-slate-300 hover:shadow-sm transition">
        <div className="flex items-center gap-3 mb-4">
            <span className="inline-flex items-center justify-center size-9 rounded-lg bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 shrink-0">
                <Icon size={16} />
            </span>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">{title}</h3>
        </div>
        <div className="space-y-4 leading-relaxed text-slate-700">{children}</div>
    </div>
)

// Section header with a numbered chip + title + accent bar.
const SectionHeader = ({ index, title, lead }) => (
    <header className="mb-10">
        <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center text-[10px] font-bold tabular-nums px-2 py-1 rounded bg-slate-900 text-white tracking-wide">
                {String(index).padStart(2, '0')}
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">{title}</h2>
        </div>
        <div className="mt-3 h-1 w-16 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-300" />
        {lead && <p className="mt-5 text-slate-700 leading-relaxed max-w-3xl">{lead}</p>}
    </header>
)

// Critical-warning callout. Used for the "never share PIN/OTP" line and
// the "always confirm payment" line - sentences that need to break the
// reading rhythm.
const CriticalCallout = ({ children }) => (
    <div className="my-2 flex items-start gap-3 bg-rose-50 ring-1 ring-rose-200 rounded-xl p-4">
        <span className="inline-flex items-center justify-center size-8 rounded-lg bg-rose-600 text-white shrink-0">
            <AlertTriangle size={15} />
        </span>
        <p className="text-sm font-semibold text-rose-900 leading-relaxed">{children}</p>
    </div>
)

// Soft "did you know" callout - reinforces a positive practice in a way
// that doesn't read as a warning.
const Note = ({ children }) => (
    <div className="my-2 flex items-start gap-3 bg-emerald-50 ring-1 ring-emerald-200 rounded-xl p-4">
        <span className="inline-flex items-center justify-center size-8 rounded-lg bg-emerald-600 text-white shrink-0">
            <ShieldCheck size={15} />
        </span>
        <p className="text-sm font-semibold text-emerald-900 leading-relaxed">{children}</p>
    </div>
)

// ── Page ─────────────────────────────────────────────────────────────────

export default function SafetyPage() {
    return (
        <main className="mb-24">

            {/* ─── Hero with /njo7.jpeg as background ──────────────── */}
            <section
                className="relative bg-slate-900"
                style={{
                    backgroundImage: 'url(/njo7.jpeg)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
            >
                <div className="absolute inset-0 bg-gradient-to-b from-slate-900/85 via-slate-900/70 to-slate-900/90" />
                <div className="relative max-w-6xl mx-auto px-6 py-24 sm:py-32 text-white">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">Safety tips</p>
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mt-3 leading-[1.05] tracking-tight max-w-3xl">
                        Stay safe on Kakimart
                    </h1>
                    <p className="mt-6 text-xl font-semibold text-emerald-200">
                        Your safety is one of our highest priorities.
                    </p>
                    <div className="mt-6 space-y-4 text-slate-200 leading-relaxed max-w-3xl">
                        <p>
                            Kakimart is built with modern trust and safety systems designed to reduce
                            scams, fake listings, suspicious activity, and fraudulent behavior.
                            However, online safety also depends on users making informed and careful
                            decisions during transactions.
                        </p>
                        <p>
                            Whether you are buying, selling, renting, or promoting services, following
                            proper safety practices can significantly reduce risks and improve your
                            overall marketplace experience.
                        </p>
                        <p>This guide provides important recommendations to help you trade more safely on Kakimart.</p>
                    </div>
                </div>
            </section>

            {/* ─── Body - TOC sidebar + content ───────────────────── */}
            <div className="max-w-6xl mx-auto px-6 pt-16 grid lg:grid-cols-[14rem_minmax(0,1fr)] gap-10 lg:gap-16">

                <StickyTOC items={TOC} />

                <article className="text-slate-700 leading-relaxed">

                    {/* ── 01. General Safety Tips ───────────────── */}
                    <section id="general" className="scroll-mt-24">
                        <SectionHeader
                            index={1}
                            title="General safety tips"
                            lead="Read these once. They cover the situations almost every Kakimart user runs into."
                        />

                        <div className="space-y-6">
                            <SubSection Icon={MapPin} title="Meet in safe public locations">
                                <p>
                                    Whenever possible, arrange physical meetings in secure and public places with
                                    good visibility and regular human activity.
                                </p>
                                <p className="text-slate-900 font-semibold">Recommended locations include:</p>
                                <DotList items={SAFE_LOCATIONS} />
                                <p>
                                    Avoid isolated environments, private residences, abandoned areas, or meeting
                                    late at night unless absolutely necessary.
                                </p>
                                <p>If the transaction involves expensive items, consider going with another trusted person.</p>
                            </SubSection>

                            <SubSection Icon={ScanSearch} title="Inspect products before payment">
                                <p>Always inspect items carefully before making payment.</p>
                                <p className="text-slate-900 font-semibold">Check:</p>
                                <DotList items={INSPECT_GENERAL} />
                                <Note>Do not allow pressure, urgency, or emotional manipulation to force quick decisions.</Note>
                                <p className="text-slate-900 font-semibold">For electronics and gadgets:</p>
                                <DotList items={INSPECT_ELECTRONICS} />
                                <p className="text-slate-900 font-semibold">For vehicles:</p>
                                <DotList items={INSPECT_VEHICLES} />
                            </SubSection>

                            <SubSection Icon={BanknoteX} title="Avoid advance payments">
                                <p>
                                    Be extremely cautious when asked to make deposits or full payments before
                                    seeing a product or confirming the legitimacy of a seller.
                                </p>
                                <p className="text-slate-900 font-semibold">Scammers commonly use:</p>
                                <DotList items={SCAM_TACTICS} tone="rose" />
                                <CriticalCallout>Never send money simply because a seller appears convincing online.</CriticalCallout>
                                <p className="text-slate-900 font-semibold">Where possible:</p>
                                <DotList items={PAY_AFTER} />
                            </SubSection>

                            <SubSection Icon={Lock} title="Protect your personal information">
                                <p>Never share sensitive financial or security information with anyone on Kakimart.</p>
                                <p className="text-slate-900 font-semibold">This includes:</p>
                                <DotList items={SENSITIVE_INFO} tone="rose" />
                                <CriticalCallout>
                                    Kakimart representatives will never ask for your password, PIN, or OTP.
                                </CriticalCallout>
                                <p>Be cautious of impersonators pretending to be customer support agents.</p>
                            </SubSection>

                            <SubSection Icon={ShieldCheck} title="Use verified accounts where possible">
                                <p>Verified accounts help improve trust within the marketplace ecosystem.</p>
                                <p>
                                    Although verification does not guarantee perfect transactions, users who complete
                                    identity or trust verification processes generally provide higher levels of
                                    accountability than anonymous accounts.
                                </p>
                                <p className="text-slate-900 font-semibold">Always review:</p>
                                <DotList items={PROFILE_REVIEW} />
                            </SubSection>

                            <SubSection Icon={AlertTriangle} title="Be careful of unrealistic deals">
                                <p>If an offer appears significantly cheaper than normal market value, exercise caution.</p>
                                <p className="text-slate-900 font-semibold">Common scam indicators include:</p>
                                <DotList items={SCAM_INDICATORS} tone="rose" />
                                <Note>If something feels suspicious, trust your judgment and avoid proceeding.</Note>
                            </SubSection>

                            <SubSection Icon={MessageSquareLock} title="Keep conversations within Kakimart">
                                <p>
                                    Using Kakimart&apos;s in-app messaging system improves transparency and helps maintain
                                    communication records for safety and moderation purposes.
                                </p>
                                <p>Avoid moving conversations immediately to unsecured external platforms unless necessary.</p>
                                <p className="text-slate-900 font-semibold">Maintaining communication within Kakimart helps:</p>
                                <DotList items={IN_APP_BENEFITS} />
                            </SubSection>

                            <SubSection Icon={Flag} title="Report suspicious behavior immediately">
                                <p>If you notice:</p>
                                <DotList items={REPORT_TRIGGERS} tone="rose" />
                                <p>Please report the account or listing immediately through the Kakimart platform.</p>
                                <Note>Fast reporting helps protect other users and improves marketplace safety for everyone.</Note>
                            </SubSection>
                        </div>
                    </section>

                    <hr className="my-16 border-slate-200" />

                    {/* ── 02. Safety Tips for Sellers ───────────── */}
                    <section id="sellers" className="scroll-mt-24">
                        <SectionHeader
                            index={2}
                            title="Safety tips for sellers"
                            lead="Sellers face a different set of scams. These three habits cover almost all of them."
                        />

                        <div className="space-y-6">
                            <SubSection Icon={UserCheck} title="Verify buyer seriousness">
                                <p>Be cautious of buyers who:</p>
                                <DotList items={SUSPICIOUS_BUYERS} tone="rose" />
                                <CriticalCallout>
                                    Always confirm payment directly through your banking application before releasing products.
                                </CriticalCallout>
                                <p>Do not rely solely on SMS alerts or screenshots.</p>
                            </SubSection>

                            <SubSection Icon={Truck} title="Avoid shipping before confirmation">
                                <p>Never dispatch products until payment has been fully confirmed and cleared.</p>
                                <p className="text-slate-900 font-semibold">Scammers sometimes use:</p>
                                <DotList items={SHIPPING_TRICKS} tone="rose" />
                                <Note>Take time to verify payments properly.</Note>
                            </SubSection>

                            <SubSection Icon={Gem} title="Protect high-value transactions">
                                <p>For expensive products such as:</p>
                                <DotList items={HIGH_VALUE_ITEMS} />
                                <p className="text-slate-900 font-semibold">Consider:</p>
                                <DotList items={HIGH_VALUE_PRACTICES} />
                            </SubSection>
                        </div>
                    </section>

                    <hr className="my-16 border-slate-200" />

                    {/* ── 03. Online Scam Awareness ─────────────── */}
                    <section id="scam-awareness" className="scroll-mt-24">
                        <SectionHeader
                            index={3}
                            title="Online scam awareness"
                            lead="Modern online scams can be highly sophisticated."
                        />
                        <div className="bg-white ring-1 ring-slate-200 rounded-2xl p-6 sm:p-7 space-y-5">
                            <p className="text-slate-900 font-semibold">Common scam patterns include:</p>
                            <DotList items={SCAM_PATTERNS} tone="rose" />
                            <CriticalCallout>
                                Never click suspicious links or download unknown files from untrusted users.
                            </CriticalCallout>
                        </div>
                    </section>

                    <hr className="my-16 border-slate-200" />

                    {/* ── 04. Kakimart's Commitment ───────────────── */}
                    <section id="commitment" className="scroll-mt-24">
                        <SectionHeader
                            index={4}
                            title="Kakimart's commitment to marketplace safety"
                            lead="We invest in systems and technologies designed to improve user protection and reduce fraudulent activity across the platform."
                        />
                        <div className="bg-white ring-1 ring-slate-200 rounded-2xl p-6 sm:p-7 space-y-5">
                            <p className="text-slate-900 font-semibold inline-flex items-center gap-2">
                                <Cog size={16} className="text-emerald-700" /> Our safety infrastructure may include:
                            </p>
                            <DotList items={SAFETY_INFRASTRUCTURE} />
                            <Note>
                                Our moderation and security systems continuously evolve to respond to emerging threats and improve trust within the Kakimart ecosystem.
                            </Note>
                        </div>
                    </section>

                    <hr className="my-16 border-slate-200" />

                    {/* ── 05. Shared Responsibility ─────────────── */}
                    <section id="shared" className="scroll-mt-24">
                        <SectionHeader index={5} title="Shared responsibility" />
                        <div className="bg-gradient-to-br from-slate-50 to-emerald-50/60 ring-1 ring-slate-200 rounded-2xl p-7 sm:p-8">
                            <Users size={28} className="text-emerald-600" />
                            <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-4 leading-tight">
                                A safer marketplace depends on both platform protection systems and responsible user behavior.
                            </p>
                            <p className="text-slate-700 mt-4 leading-relaxed">
                                By staying alert, following safety practices, and reporting suspicious activity,
                                every user contributes to making Kakimart a more trusted environment for buying and
                                selling across Nigeria.
                            </p>
                        </div>
                    </section>

                    <hr className="my-16 border-slate-200" />

                    {/* ── 06. Need Help ─────────────────────────── */}
                    <section id="help" className="scroll-mt-24">
                        <SectionHeader index={6} title="Need help?" />
                        <div className="bg-slate-900 text-white rounded-2xl p-7 sm:p-8 flex items-start gap-4">
                            <span className="inline-flex items-center justify-center size-11 rounded-2xl bg-white/10 ring-1 ring-white/20 shrink-0">
                                <LifeBuoy size={20} />
                            </span>
                            <div className="min-w-0">
                                <p className="leading-relaxed">
                                    If you encounter suspicious activity or need assistance, please contact the
                                    Kakimart support or safety team through the official support channels available
                                    within the platform.
                                </p>
                                <p className="mt-5 text-emerald-300 font-bold text-lg">
                                    Kakimart - Building a safer marketplace for everyone.
                                </p>
                            </div>
                        </div>
                    </section>

                </article>
            </div>
        </main>
    )
}
