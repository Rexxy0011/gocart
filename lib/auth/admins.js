// Admin allowlist by email. Read from ADMIN_EMAILS env var (comma-separated)
// so the list lives in deploy config, not in code.
//
// Example .env.local entry:
//   ADMIN_EMAILS=rex@example.com,founder@gocart.com
//
// **Dev-mode behavior**: if ADMIN_EMAILS is empty / unset, the allowlist
// gate is OPEN — any signed-in user is treated as an admin. This is purely
// for early development convenience. Set the var in any real deployment.
const adminSet = (() => {
    const raw = process.env.ADMIN_EMAILS || ''
    return new Set(
        raw.split(',')
            .map(e => e.trim().toLowerCase())
            .filter(Boolean)
    )
})()

export const isAdminAllowlistOpen = () => adminSet.size === 0

export const isAdminEmail = (email) => {
    if (isAdminAllowlistOpen()) return true   // dev-mode wide open
    if (!email) return false
    return adminSet.has(email.toLowerCase())
}
