import { createSlice } from '@reduxjs/toolkit'

// status: 'none' | 'pending' | 'verified'
// Defaults to 'none' so the unverified path is the visible one in dev.
// Once Supabase auth is wired, hydrate this from the session.
const providerSlice = createSlice({
    name: 'provider',
    initialState: {
        status: 'none',
        info: null,
    },
    reducers: {
        submitApplication: (state, action) => {
            state.status = 'pending'
            state.info = action.payload || state.info
        },
        approveProvider: (state, action) => {
            state.status = 'verified'
            state.info = action.payload || state.info
        },
        resetProvider: (state) => {
            state.status = 'none'
            state.info = null
        },
    },
})

export const { submitApplication, approveProvider, resetProvider } = providerSlice.actions

export default providerSlice.reducer
