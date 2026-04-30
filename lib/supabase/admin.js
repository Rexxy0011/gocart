// SERVER-ONLY admin client. Uses the service_role key to bypass RLS — never
// import this from a client component, and never expose any of the data this
// pulls without a separate authorization check.
//
// The middleware allowlist gate (lib/auth/admins.js) is the access check.
// Admin server routes use this client to read private storage / write any
// table without RLS friction.

import { createClient } from '@supabase/supabase-js'

let _client = null

export function createAdminClient() {
    if (_client) return _client
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) throw new Error('Supabase admin client missing env vars.')
    _client = createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
    })
    return _client
}

// Convenience: signed download URL for a path inside a private bucket.
// Default 60-minute window so admin can leave the queue tab open.
export async function signProviderDocUrl(path, expiresInSeconds = 3600) {
    if (!path) return null
    const supabase = createAdminClient()
    const { data, error } = await supabase
        .storage
        .from('provider-docs')
        .createSignedUrl(path, expiresInSeconds)
    if (error) return null
    return data.signedUrl
}
