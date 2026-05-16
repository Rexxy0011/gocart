// Boost catalog - single source of truth for prices, durations, and which
// columns get set on the listing once paid. Lives in /lib so both server
// actions and API routes can import it without tripping the 'use server'
// "only async functions" rule.

// The *_until expiry columns on `products`. A listing is "actively boosted"
// on an axis when its column is a timestamp in the future. Buyer surfaces
// filter on these directly so expiry is instant - no dependency on the
// pg_cron sweeper having run (see supabase/migrations/0012_boost_expiry_cron.sql).
export const BOOST_UNTIL_COLUMNS = ['featured_until', 'urgent_until', 'bulk_sale_until', 'bumped_until']

// PostgREST `.or()` string matching any listing with at least one active
// boost. Pass an ISO `now`; optionally restrict which axes count (e.g. /hot
// ignores bumps). Usage: query.or(activeBoostFilter(now))
export const activeBoostFilter = (now, columns = BOOST_UNTIL_COLUMNS) =>
    columns.map(c => `${c}.gt.${now}`).join(',')

// Restrict a query to listings with NO active boost on any axis. Each axis
// is its own `.or()` (null OR expired); chained .or() calls are AND-ed, so
// the result is "not boosted anywhere". Usage: q = excludeActiveBoosts(q, now)
export const excludeActiveBoosts = (query, now) => {
    for (const c of BOOST_UNTIL_COLUMNS) {
        query = query.or(`${c}.is.null,${c}.lte.${now}`)
    }
    return query
}

export const BOOST_CATALOG = {
    bump: {
        label: 'Bump up',
        price: 1500,        // NGN
        durationDays: 7,
    },
    featured: {
        label: 'Featured ribbon',
        price: 3000,
        durationDays: 7,
    },
    urgent: {
        label: 'Urgent tag',
        price: 2000,
        durationDays: 7,
    },
    bulk_sale: {
        label: 'Bulk sale',
        price: 4000,
        durationDays: 14,
    },
    bundle: {
        label: 'Boost bundle',
        price: 5500,
        durationDays: 14,
    },
}
