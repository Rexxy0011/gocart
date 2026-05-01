import { createSlice } from '@reduxjs/toolkit'

const cartSlice = createSlice({
    name: 'cart',
    initialState: {
        total: 0,
        cartItems: {},
    },
    reducers: {
        addToCart: (state, action) => {
            const { productId } = action.payload
            if (state.cartItems[productId]) {
                state.cartItems[productId]++
            } else {
                state.cartItems[productId] = 1
            }
            state.total += 1
        },
        removeFromCart: (state, action) => {
            const { productId } = action.payload
            if (state.cartItems[productId]) {
                state.cartItems[productId]--
                if (state.cartItems[productId] === 0) {
                    delete state.cartItems[productId]
                }
            }
            state.total -= 1
        },
        deleteItemFromCart: (state, action) => {
            const { productId } = action.payload
            state.total -= state.cartItems[productId] ? state.cartItems[productId] : 0
            delete state.cartItems[productId]
        },
        clearCart: (state) => {
            state.cartItems = {}
            state.total = 0
        },
        // Replace the whole favorites map with a server-truth list of
        // product IDs. Used at app boot to hydrate the slice from the
        // favorites table so heart icons render in the correct state.
        setFavorites: (state, action) => {
            const ids = Array.isArray(action.payload) ? action.payload : []
            const map = {}
            for (const id of ids) map[id] = 1
            state.cartItems = map
            state.total = ids.length
        },
    }
})

export const { addToCart, removeFromCart, clearCart, deleteItemFromCart, setFavorites } = cartSlice.actions

export default cartSlice.reducer
