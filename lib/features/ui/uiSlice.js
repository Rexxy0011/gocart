import { createSlice } from '@reduxjs/toolkit'

// Cross-cutting UI state — modals, banners, anything overlay-shaped that the
// rest of the app needs to dispatch from any component without prop-drilling.

const uiSlice = createSlice({
    name: 'ui',
    initialState: {
        authModal: {
            open: false,
            mode: 'login',     // 'login' | 'signup'
            message: '',       // contextual prompt e.g. "Sign in to save this listing"
        },
    },
    reducers: {
        openAuthModal: (state, action) => {
            state.authModal.open = true
            state.authModal.mode = action.payload?.mode || 'login'
            state.authModal.message = action.payload?.message || ''
        },
        setAuthModalMode: (state, action) => {
            state.authModal.mode = action.payload
        },
        closeAuthModal: (state) => {
            state.authModal.open = false
            state.authModal.message = ''
        },
    },
})

export const { openAuthModal, setAuthModalMode, closeAuthModal } = uiSlice.actions
export default uiSlice.reducer
