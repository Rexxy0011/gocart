import { configureStore } from '@reduxjs/toolkit'
import cartReducer from './features/cart/cartSlice'
import productReducer from './features/product/productSlice'
import addressReducer from './features/address/addressSlice'
import ratingReducer from './features/rating/ratingSlice'
import providerReducer from './features/provider/providerSlice'
import jobsReducer from './features/jobs/jobsSlice'
import uiReducer from './features/ui/uiSlice'

export const makeStore = () => {
    return configureStore({
        reducer: {
            cart: cartReducer,
            product: productReducer,
            address: addressReducer,
            rating: ratingReducer,
            provider: providerReducer,
            jobs: jobsReducer,
            ui: uiReducer,
        },
    })
}