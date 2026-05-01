'use client'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-hot-toast'
import { addToCart, deleteItemFromCart } from './cartSlice'
import { toggleFavorite } from '@/app/actions/favorites'
import { useAuthGate } from '@/hooks/useAuthGate'

// Heart-icon hook used by every listing surface (cards, rows, detail
// pages). Wraps three concerns into a single call:
//   1. Auth gate — signed-out users get the sign-in modal instead.
//   2. Redux dispatch — instant UI feedback (optimistic).
//   3. Server-side persist — favorites table via toggleFavorite action.
//
// On server failure we revert the Redux change so the heart matches the
// real server state again. On auth-gated bail (signed-out user), we
// never touch Redux.
export function useToggleFavorite(productId) {
    const cart = useSelector(state => state.cart.cartItems)
    const dispatch = useDispatch()
    const requireAuth = useAuthGate()
    const isSaved = !!cart[productId]

    const toggle = (e) => {
        e?.stopPropagation?.()
        e?.preventDefault?.()
        requireAuth(async () => {
            // Optimistic local update
            if (isSaved) dispatch(deleteItemFromCart({ productId }))
            else dispatch(addToCart({ productId }))

            // Persist
            const result = await toggleFavorite({ productId })
            if (result?.error) {
                // Revert
                if (isSaved) dispatch(addToCart({ productId }))
                else dispatch(deleteItemFromCart({ productId }))
                toast.error(result.error)
            }
        }, 'Sign in to save listings.')
    }

    return { isSaved, toggle }
}
