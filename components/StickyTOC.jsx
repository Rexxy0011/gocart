'use client'
import { useEffect, useState } from 'react'

// Sticky table-of-contents rail. Sits to the left of long-form content
// on desktop and tracks the in-view section via IntersectionObserver,
// highlighting the current one with an emerald accent. Hidden on mobile.
//
// `items` is an array of { id, label }. Anchor IDs must match the
// `id="…"` set on each <section> in the parent page.
const StickyTOC = ({ items = [] }) => {

    const [activeId, setActiveId] = useState(items[0]?.id || '')

    useEffect(() => {
        const sections = items
            .map(i => document.getElementById(i.id))
            .filter(Boolean)

        if (!sections.length) return

        const observer = new IntersectionObserver(
            (entries) => {
                // Pick the entry that's most visible in the upper half of
                // the viewport — keeps the highlight in sync with what the
                // reader is actually looking at, not whatever the bottom
                // edge of the viewport just clipped.
                const visible = entries
                    .filter(e => e.isIntersecting)
                    .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
                if (visible[0]) setActiveId(visible[0].target.id)
            },
            { rootMargin: '-20% 0px -55% 0px', threshold: [0, 0.5, 1] },
        )

        sections.forEach(s => observer.observe(s))
        return () => observer.disconnect()
    }, [items])

    return (
        <nav aria-label="On this page" className="hidden lg:block sticky top-24 self-start">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 mb-4">
                On this page
            </p>
            <ul className="space-y-1">
                {items.map((item, i) => {
                    const active = item.id === activeId
                    return (
                        <li key={item.id}>
                            <a
                                href={`#${item.id}`}
                                className={`group flex items-start gap-3 py-1.5 text-sm transition ${
                                    active ? 'text-slate-900 font-semibold' : 'text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                <span className={`mt-1 inline-flex items-center justify-center text-[10px] font-bold tabular-nums w-6 h-5 rounded transition ${
                                    active
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                                }`}>
                                    {String(i + 1).padStart(2, '0')}
                                </span>
                                <span className="leading-snug">{item.label}</span>
                            </a>
                        </li>
                    )
                })}
            </ul>
        </nav>
    )
}

export default StickyTOC
