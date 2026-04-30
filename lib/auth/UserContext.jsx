'use client'
import { createContext, useContext } from 'react'

// Holds the server-fetched authenticated user so any client component can read
// it via useUser() without prop-drilling. The provider is mounted once in the
// public layout with the user from supabase.auth.getUser() server-side.
//
// Value is null when signed out.
const UserContext = createContext(null)

export const UserProvider = ({ user, children }) => (
    <UserContext.Provider value={user}>{children}</UserContext.Provider>
)

export const useUser = () => useContext(UserContext)
