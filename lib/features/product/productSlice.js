import { createSlice } from '@reduxjs/toolkit'
import { productDummyData } from '@/assets/assets'

const productSlice = createSlice({
    name: 'product',
    initialState: {
        list: productDummyData,
    },
    reducers: {
        setProduct: (state, action) => {
            state.list = action.payload
        },
        clearProduct: (state) => {
            state.list = []
        },
        bumpProduct: (state, action) => {
            const id = action.payload
            const item = state.list.find(p => p.id === id)
            if (item) item.createdAt = new Date().toISOString()
        },
    }
})

export const { setProduct, clearProduct, bumpProduct } = productSlice.actions

export default productSlice.reducer