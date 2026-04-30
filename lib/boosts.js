// Boost catalog — single source of truth for prices, durations, and which
// columns get set on the listing once paid. Lives in /lib so both server
// actions and API routes can import it without tripping the 'use server'
// "only async functions" rule.

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
