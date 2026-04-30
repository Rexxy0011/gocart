import Link from "next/link";
import { Apple, Facebook, Instagram, Play, Twitter, Youtube } from "lucide-react";

// Every link below points to a route that actually resolves — either an
// existing page (auth-gated routes redirect to /login, that's fine) or a
// stub policy page in (public)/. Avoid adding links to pages that 404.
const linkColumns = [
    {
        title: "Browse",
        links: [
            { text: "All ads", href: "/shop" },
            { text: "Services", href: "/services" },
            { text: "Cars", href: "/shop?category=Sedans" },
            { text: "Phones", href: "/shop?category=iPhones" },
            { text: "Home & Appliances", href: "/shop?category=Sofas" },
        ],
    },
    {
        title: "Selling",
        links: [
            { text: "Post an ad", href: "/store/add-product" },
            { text: "My listings", href: "/store/manage-product" },
            { text: "Verified providers", href: "/pro" },
            { text: "Messages", href: "/messages" },
        ],
    },
    {
        title: "Help & Trust",
        links: [
            { text: "About GoCart", href: "/about" },
            { text: "Safety tips", href: "/safety" },
            { text: "Contact us", href: "/contact" },
            { text: "Terms of Use", href: "/terms" },
            { text: "Privacy Notice", href: "/privacy" },
        ],
    },
];

const socialLinks = [
    { Icon: Facebook, href: "https://facebook.com", label: "Facebook" },
    { Icon: Instagram, href: "https://instagram.com", label: "Instagram" },
    { Icon: Twitter, href: "https://twitter.com", label: "X" },
    { Icon: Youtube, href: "https://youtube.com", label: "YouTube" },
];

const Footer = () => {
    return (
        <footer className="bg-[#1F1A35] text-slate-300 mt-20">
            <div className="max-w-7xl mx-auto px-6 py-14">
                {/* Link columns + Mobile Apps */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
                    {linkColumns.map((col) => (
                        <div key={col.title}>
                            <h3 className="text-base font-bold text-slate-100 mb-4">{col.title}</h3>
                            <ul className="space-y-3">
                                {col.links.map((link) => (
                                    <li key={link.text}>
                                        <Link href={link.href} className="text-sm text-sky-200 hover:underline">
                                            {link.text}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}

                    <div>
                        <h3 className="text-base font-bold text-slate-100 mb-4">Mobile Apps</h3>
                        <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                            Native apps coming soon — meanwhile GoCart works great on mobile browsers.
                        </p>
                        <div className="space-y-3">
                            <span
                                aria-label="App Store coming soon"
                                className="flex items-center gap-3 bg-black text-white rounded-lg px-3 py-2 ring-1 ring-slate-700 opacity-70 cursor-not-allowed"
                            >
                                <Apple size={22} className="shrink-0" />
                                <span className="leading-tight">
                                    <span className="block text-[10px] text-slate-400">Coming soon to</span>
                                    <span className="block text-sm font-semibold">App Store</span>
                                </span>
                            </span>
                            <span
                                aria-label="Google Play coming soon"
                                className="flex items-center gap-3 bg-black text-white rounded-lg px-3 py-2 ring-1 ring-slate-700 opacity-70 cursor-not-allowed"
                            >
                                <Play size={22} className="shrink-0" fill="currentColor" />
                                <span className="leading-tight">
                                    <span className="block text-[10px] text-slate-400">Coming soon to</span>
                                    <span className="block text-sm font-semibold">Google Play</span>
                                </span>
                            </span>
                        </div>
                    </div>
                </div>

                {/* Community */}
                <div className="border-t border-slate-700/40 mt-12 pt-8 text-center">
                    <h3 className="text-base font-bold text-slate-100 mb-5">Join GoCart Community</h3>
                    <div className="flex items-center justify-center gap-3">
                        {socialLinks.map(({ Icon, href, label }) => (
                            <Link
                                key={label}
                                href={href}
                                aria-label={label}
                                className="flex items-center justify-center size-10 rounded-full bg-white/5 ring-1 ring-slate-700 hover:bg-white/10 transition"
                            >
                                <Icon size={18} className="text-slate-100" />
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Legal block */}
                <div className="border-t border-slate-700/40 mt-8 pt-8 max-w-3xl mx-auto text-center text-xs text-slate-400 leading-relaxed space-y-4">
                    <p>© 2025–2026 GoCart Limited. All rights reserved.</p>

                    <p>
                        GoCart is a classifieds marketplace. We facilitate connections between buyers and sellers but are not a party to
                        transactions. Sellers are responsible for the accuracy of their listings and for fulfilling any agreements made
                        directly with buyers. See our{" "}
                        <Link href="/safety" className="text-sky-200 hover:underline">Safety</Link> guidelines and{" "}
                        <Link href="/terms" className="text-sky-200 hover:underline">Terms of Use</Link>.
                    </p>

                    <p>
                        Verified business sellers may transact through embedded checkout flows operated by the seller or their payment
                        provider. In those transactions, GoCart receives a commission disclosed at checkout. GoCart does not handle
                        fulfilment or shipping; logistics are the responsibility of the seller.
                    </p>

                    <p>GoCart Limited, registered company number TBD. Registered office: TBD.</p>

                    <p className="text-slate-300">
                        <Link href="/terms" className="text-sky-200 hover:underline">Terms of Use</Link>
                        <span className="text-slate-500"> · </span>
                        <Link href="/privacy" className="text-sky-200 hover:underline">Privacy Notice</Link>
                        <span className="text-slate-500"> · </span>
                        <Link href="/contact" className="text-sky-200 hover:underline">Contact</Link>
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
