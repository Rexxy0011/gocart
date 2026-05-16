export const metadata = {
    title: 'About — GoCart',
    description:
        "GoCart is a next-generation Nigerian marketplace combining innovation, security, transparency, and simplicity. " +
        "Smarter marketplace. Safer transactions.",
}

const FOCUS_AREAS = [
    'Trust',
    'Accountability',
    'Safer transactions',
    'Better user experiences',
    'Smarter marketplace technology',
    'Long-term digital commerce growth in Nigeria',
]

const PROBLEMS = [
    'Fake products and misleading listings',
    'Scam payments and fraudulent transactions',
    'Anonymous and unverified sellers',
    'Poor customer experiences',
    'Unsafe communication practices',
    'Limited accountability on traditional platforms',
]

const DIFFERENTIATORS = [
    {
        title: 'Advanced verification systems',
        body: 'GoCart is designed around identity and trust verification systems that help improve platform credibility and reduce fraudulent activity. Verification processes may include account authentication, seller reviews, activity monitoring, and other security measures aimed at building a safer marketplace environment.',
    },
    {
        title: 'Intelligent fraud prevention',
        body: 'We continuously improve our fraud detection and moderation systems to identify suspicious activity, fake listings, impersonation attempts, spam behavior, and marketplace abuse before they affect users.',
    },
    {
        title: 'Smarter marketplace technology',
        body: 'Our platform is built using modern technologies focused on performance, security, scalability, and user experience. We are developing a marketplace that feels faster, cleaner, and more intelligent than traditional classified platforms.',
    },
    {
        title: 'User-focused experience',
        body: 'GoCart is designed to be simple, accessible, and efficient for both buyers and sellers. We focus heavily on usability, smooth navigation, modern interface design, and better communication experiences.',
    },
    {
        title: 'Nigerian-focused solutions',
        body: 'GoCart is built specifically with the Nigerian market in mind. We understand the unique challenges, behaviors, and realities of online trading within Nigeria, and we are developing solutions tailored to local users and businesses.',
    },
    {
        title: 'Continuous innovation',
        body: 'We believe trust and safety are ongoing responsibilities. GoCart continuously evolves through platform improvements, smarter moderation systems, new safety features, and technology upgrades designed to improve user confidence over time.',
    },
]

const SAFETY_COMMITMENTS = [
    'Active listing moderation',
    'Scam prevention systems',
    'Suspicious activity monitoring',
    'User reporting tools',
    'Verification-focused infrastructure',
    'Secure communication practices',
    'Continuous platform monitoring and improvement',
]

const Divider = () => <hr className="my-16 border-slate-200" />

export default function AboutPage() {
    return (
        <main className="mx-6 mb-24">
            <article className="max-w-3xl mx-auto pt-14 pb-6 text-slate-700 leading-relaxed">

                {/* ─── About GoCart ─────────────────────────────────────── */}
                <section>
                    <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">About GoCart</h1>
                    <div className="mt-6 space-y-5">
                        <p>
                            Welcome to GoCart — a next-generation Nigerian marketplace built to redefine how
                            people buy, sell, and connect online.
                        </p>
                        <p>
                            GoCart was created with a simple but powerful goal: to solve the trust problems
                            that have affected online marketplaces for years. Across many digital trading
                            platforms, users often face fake listings, scam attempts, unreliable sellers,
                            poor moderation, and unsafe transactions. These challenges have reduced confidence
                            in online commerce and made many people hesitant to trade online.
                        </p>
                        <p className="text-lg font-semibold text-slate-900 pl-4 border-l-2 border-emerald-500">
                            We believe Nigerians deserve better.
                        </p>
                        <p>
                            GoCart is designed as a modern, security-focused marketplace where technology,
                            verification, and intelligent moderation work together to create a safer and more
                            reliable trading environment for everyone.
                        </p>
                        <p>
                            Our platform combines a clean user experience with advanced trust and safety
                            systems that help reduce fraudulent activity, detect suspicious behavior, and
                            improve transparency between buyers and sellers. From verified user systems to
                            smarter listing reviews and risk-monitoring technologies, every part of GoCart is
                            built with long-term trust in mind.
                        </p>
                        <p>
                            Whether you are an individual seller, a growing business, a student entrepreneur,
                            a real estate agent, a gadget dealer, or someone simply looking for great products
                            and services, GoCart provides a platform built for modern commerce in Nigeria.
                        </p>
                        <p className="text-lg font-semibold text-slate-900">
                            We are not just building another classifieds app.
                        </p>
                        <p>We are building an ecosystem focused on:</p>
                        <ul className="space-y-2 pl-1">
                            {FOCUS_AREAS.map((area) => (
                                <li key={area} className="flex items-start gap-3">
                                    <span className="mt-2 size-1.5 rounded-full bg-emerald-500 shrink-0" />
                                    <span className="text-slate-800">{area}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>

                <Divider />

                {/* ─── Why GoCart Exists ────────────────────────────────── */}
                <section>
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Why GoCart exists</h2>
                    <div className="mt-6 space-y-5">
                        <p>
                            Online marketplaces have made buying and selling easier, but many users still
                            struggle with:
                        </p>
                        <ul className="space-y-2 pl-1">
                            {PROBLEMS.map((p) => (
                                <li key={p} className="flex items-start gap-3">
                                    <span className="mt-2 size-1.5 rounded-full bg-rose-500 shrink-0" />
                                    <span className="text-slate-800">{p}</span>
                                </li>
                            ))}
                        </ul>
                        <p>
                            GoCart was created to directly address these problems through stronger platform
                            standards, improved verification systems, and continuous safety innovation.
                        </p>
                        <p>
                            Our goal is to make online trading feel more secure, transparent, and dependable
                            for everyday Nigerians.
                        </p>
                    </div>
                </section>

                <Divider />

                {/* ─── What Makes GoCart Different ──────────────────────── */}
                <section>
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                        What makes GoCart different?
                    </h2>
                    <div className="mt-8 space-y-8">
                        {DIFFERENTIATORS.map(({ title, body }) => (
                            <div key={title} className="border-l-2 border-slate-200 pl-5 hover:border-emerald-500 transition">
                                <h3 className="text-base sm:text-lg font-bold text-slate-900">{title}</h3>
                                <p className="mt-2 leading-relaxed">{body}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <Divider />

                {/* ─── Our Mission ──────────────────────────────────────── */}
                <section>
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Our mission</h2>
                    <p className="mt-6">
                        To build Nigeria&apos;s most trusted digital marketplace by combining innovation,
                        security, transparency, and simplicity into one reliable platform where people and
                        businesses can trade with confidence.
                    </p>
                </section>

                <Divider />

                {/* ─── Our Vision ───────────────────────────────────────── */}
                <section>
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Our vision</h2>
                    <div className="mt-6 space-y-5">
                        <p>
                            To create a future where online buying and selling across Nigeria becomes safer,
                            more transparent, more accessible, and more trusted for everyone.
                        </p>
                        <p>
                            We envision a digital commerce ecosystem where users no longer have to trade in
                            fear of scams, fake identities, or unsafe transactions.
                        </p>
                    </div>
                </section>

                <Divider />

                {/* ─── Our Commitment to Trust & Safety ─────────────────── */}
                <section>
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                        Our commitment to trust &amp; safety
                    </h2>
                    <div className="mt-6 space-y-5">
                        <p className="text-lg font-semibold text-slate-900">
                            Trust is the foundation of every successful marketplace.
                        </p>
                        <p>
                            At GoCart, we are committed to investing in systems and technologies that improve
                            platform integrity and user protection. Our approach to trust and safety includes:
                        </p>
                        <ul className="space-y-2 pl-1">
                            {SAFETY_COMMITMENTS.map((c) => (
                                <li key={c} className="flex items-start gap-3">
                                    <span className="mt-2 size-1.5 rounded-full bg-emerald-500 shrink-0" />
                                    <span className="text-slate-800">{c}</span>
                                </li>
                            ))}
                        </ul>
                        <p>
                            While no online platform can completely eliminate fraud, GoCart is committed to
                            reducing risks through proactive technology, strong moderation standards, and
                            responsible platform management.
                        </p>
                    </div>
                </section>

                <Divider />

                {/* ─── Built for the Future ─────────────────────────────── */}
                <section>
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                        Built for the future of commerce
                    </h2>
                    <div className="mt-6 space-y-5">
                        <p className="text-lg font-semibold text-slate-900">GoCart is more than a marketplace.</p>
                        <p>
                            We are building a long-term digital commerce platform designed for the future of
                            buying and selling in Nigeria — one that combines technology, trust, accessibility,
                            and innovation into a single ecosystem that empowers both individuals and businesses.
                        </p>
                        <p>
                            As digital commerce continues to evolve, GoCart aims to remain at the forefront by
                            continuously improving safety systems, expanding marketplace opportunities, and
                            creating a more dependable online trading experience for millions of users.
                        </p>
                    </div>
                </section>

                <Divider />

                {/* ─── Join the GoCart Community ────────────────────────── */}
                <section>
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                        Join the GoCart community
                    </h2>
                    <div className="mt-6 space-y-5">
                        <p>
                            Whether you are buying, selling, promoting your business, or exploring opportunities
                            online, GoCart provides a smarter and safer platform built for modern Nigeria.
                        </p>
                        <p className="text-lg font-semibold text-slate-900 pt-2">
                            GoCart — Smarter Marketplace. Safer Transactions.
                        </p>
                    </div>
                </section>

            </article>
        </main>
    )
}
