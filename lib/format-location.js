// Stored as "<State> · <Area>" (see add-product page) - flip to "Area, State"
// for buyer-facing surfaces. Matches Jiji/Gumtree convention where the
// neighborhood reads first since it's the more useful filter.
//
// Tolerates legacy rows (just a state, just a city, hand-typed values)
// by falling back to whatever's there.

export function formatLocation(stored) {
    if (!stored) return ''
    const parts = stored.split(' · ').map(s => s.trim()).filter(Boolean)
    if (parts.length >= 2) return `${parts[1]}, ${parts[0]}`
    return parts[0] || stored
}
