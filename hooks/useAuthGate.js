'use client'
import { useDispatch } from 'react-redux'
import { useUser } from '@/lib/auth/UserContext'
import { openAuthModal } from '@/lib/features/ui/uiSlice'

// Wraps an action behind an auth check. Usage:
//
//   const requireAuth = useAuthGate()
//   <button onClick={() => requireAuth(() => save(id), 'Sign in to save this listing')}>
//
// If signed in, runs the callback immediately. If not, opens the AuthModal
// with the given prompt. After login the user has to click the action again —
// no deferred-callback magic, since storing functions in state is fragile and
// re-clicking is the standard Gumtree-style behaviour.
export const useAuthGate = () => {
    const user = useUser()
    const dispatch = useDispatch()

    return (callback, message = '') => {
        if (user) {
            callback?.()
            return true
        }
        dispatch(openAuthModal({ mode: 'login', message }))
        return false
    }
}
