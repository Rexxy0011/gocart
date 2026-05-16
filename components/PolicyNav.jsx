import Link from "next/link"

// Pill-tab navigator across Kakimart's policy pages. Sits between the
// app navbar and a policy page's hero - same visual rhythm as the
// reference (Skilltwins-style). The active pill goes white on dark;
// the rest stay translucent.
const POLICY_TABS = [
    { href: '/privacy', label: 'Privacy Notice' },
    { href: '/terms',   label: 'Terms of Use' },
    { href: '/safety',  label: 'Safety Tips' },
    { href: '/about',   label: 'About' },
    { href: '/contact', label: 'Contact' },
]

const PolicyNav = ({ active }) => (
    <div className="bg-slate-950 border-b border-slate-800/60">
        <nav
            aria-label="Policy pages"
            className="max-w-6xl mx-auto px-6 py-4 flex gap-2 overflow-x-auto scrollbar-none"
        >
            {POLICY_TABS.map((tab) => {
                const isActive = tab.href === active
                return (
                    <Link
                        key={tab.href}
                        href={tab.href}
                        className={`shrink-0 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.14em] rounded px-4 py-2.5 transition ${
                            isActive
                                ? 'bg-white text-slate-950'
                                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 ring-1 ring-slate-800'
                        }`}
                    >
                        {tab.label}
                    </Link>
                )
            })}
        </nav>
    </div>
)

export default PolicyNav
