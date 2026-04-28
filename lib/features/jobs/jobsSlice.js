import { createSlice } from '@reduxjs/toolkit'

// Bilateral confirmation flow.
//
// Every chat-derived job between a buyer and a provider can be confirmed by
// each party independently. A "verified job" requires BOTH parties to confirm.
// Verified jobs count toward milestone badges and unlock review eligibility.
//
// Status is derived (not stored) from the two confirmation timestamps:
//   - both null                            → 'awaiting_both' (ping fired, nobody answered)
//   - providerConfirmedAt set, buyer null  → 'provider_confirmed'
//   - buyer set, provider null             → 'buyer_confirmed'
//   - both set                             → 'verified'

const daysAgo = (n) => {
    const d = new Date()
    d.setDate(d.getDate() - n)
    return d.toISOString()
}

// Mock jobs for the demo provider (Tunde, store_2). Each ties to an existing
// listing so the JobConfirmCard can link back to a real product page.
const initialJobs = [
    {
        id: 'job_1',
        listingId: 'prod_14',
        providerStoreId: 'store_2',
        buyerId: 'buyer_demo',
        buyerName: 'Bola Adeyemi',
        lastMessageAt: daysAgo(2),
        providerConfirmedAt: null,
        buyerConfirmedAt: null,
    },
    {
        id: 'job_2',
        listingId: 'prod_14',
        providerStoreId: 'store_2',
        buyerId: 'buyer_demo',
        buyerName: 'Tobi Akande',
        lastMessageAt: daysAgo(4),
        providerConfirmedAt: null,
        buyerConfirmedAt: daysAgo(2),
    },
    {
        id: 'job_3',
        listingId: 'prod_14',
        providerStoreId: 'store_2',
        buyerId: 'buyer_demo',
        buyerName: 'Femi Olutade',
        lastMessageAt: daysAgo(3),
        providerConfirmedAt: daysAgo(1),
        buyerConfirmedAt: null,
    },
    {
        id: 'job_4',
        listingId: 'prod_14',
        providerStoreId: 'store_2',
        buyerId: 'buyer_demo',
        buyerName: 'Chika Ibe',
        lastMessageAt: daysAgo(5),
        providerConfirmedAt: daysAgo(4),
        buyerConfirmedAt: daysAgo(3),
    },
    {
        id: 'job_5',
        listingId: 'prod_14',
        providerStoreId: 'store_2',
        buyerId: 'buyer_demo',
        buyerName: 'Ifeoma Eze',
        lastMessageAt: daysAgo(6),
        providerConfirmedAt: daysAgo(5),
        buyerConfirmedAt: daysAgo(5),
    },
]

const jobsSlice = createSlice({
    name: 'jobs',
    initialState: { list: initialJobs },
    reducers: {
        confirmByProvider: (state, action) => {
            const job = state.list.find(j => j.id === action.payload)
            if (job && !job.providerConfirmedAt) {
                job.providerConfirmedAt = new Date().toISOString()
            }
        },
        // Mock-only — in production the buyer side has its own session/dispatch.
        confirmByBuyer: (state, action) => {
            const job = state.list.find(j => j.id === action.payload)
            if (job && !job.buyerConfirmedAt) {
                job.buyerConfirmedAt = new Date().toISOString()
            }
        },
    },
})

export const { confirmByProvider, confirmByBuyer } = jobsSlice.actions

export const getJobStatus = (job) => {
    if (job.providerConfirmedAt && job.buyerConfirmedAt) return 'verified'
    if (job.providerConfirmedAt) return 'provider_confirmed'
    if (job.buyerConfirmedAt) return 'buyer_confirmed'
    return 'awaiting_both'
}

export default jobsSlice.reducer
