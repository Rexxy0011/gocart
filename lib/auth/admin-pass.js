// Shared-password gate for /admin/*. A single ADMIN_PASSWORD env var -
// anyone who types the right password, regardless of whether they have a
// regular user account, gets a session cookie and admin access for 24h.
//
// Tradeoff: no audit identity (we can't tell which admin did what).
// Acceptable for MVP because the team is 1-2 people. Move to email-based
// admin auth + 2FA before that grows.
//
// Cookie:
//   name : gc_admin
//   value: sha256("gocart-admin:" + ADMIN_PASSWORD)  - never the raw password
//   attrs: httpOnly, secure (in prod), sameSite=lax, 24h
// Validation: re-hash the env password and compare. Rotating the password
// invalidates every existing session automatically.

import { cookies } from 'next/headers'

export const ADMIN_COOKIE_NAME = 'gc_admin'
const MAX_AGE_SEC = 60 * 60 * 24

const sha256Hex = async (str) => {
    const data = new TextEncoder().encode(str)
    const buf = await crypto.subtle.digest('SHA-256', data)
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

// Constant-time string compare so a wrong-password attacker can't time
// the comparison to extract the right one byte-by-byte.
const timingSafeEqual = (a, b) => {
    if (typeof a !== 'string' || typeof b !== 'string') return false
    if (a.length !== b.length) return false
    let mismatch = 0
    for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i)
    return mismatch === 0
}

export const checkAdminPassword = (provided) => {
    const expected = process.env.ADMIN_PASSWORD || ''
    // Refuse all logins if the env isn't set - fail closed, never wide open.
    if (!expected) return false
    return timingSafeEqual(provided, expected)
}

const expectedToken = async () => {
    const expected = process.env.ADMIN_PASSWORD || ''
    if (!expected) return null
    return sha256Hex(`gocart-admin:${expected}`)
}

export const setAdminCookie = async () => {
    const token = await expectedToken()
    if (!token) return
    const c = await cookies()
    c.set(ADMIN_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: MAX_AGE_SEC,
    })
}

export const clearAdminCookie = async () => {
    const c = await cookies()
    c.delete(ADMIN_COOKIE_NAME)
}

// Server-component / server-action context - reads cookies via next/headers.
export const isAdminAuthenticated = async () => {
    const c = await cookies()
    return isAdminCookieValid(c.get(ADMIN_COOKIE_NAME)?.value)
}

// Edge-runtime variant - middleware passes the cookie value in directly.
export const isAdminCookieValid = async (cookieValue) => {
    if (!cookieValue) return false
    const expected = await expectedToken()
    if (!expected) return false
    return timingSafeEqual(cookieValue, expected)
}
