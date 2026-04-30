/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        // We render external Supabase Storage URLs and lots of remote sources;
        // keep optimization off so we don't have to maintain a remotePatterns
        // allowlist. Trade-off: no auto-srcset / format conversion.
        unoptimized: true,
    },

    // Sane security defaults for every response. Vercel adds HSTS automatically
    // on HTTPS, so we don't set it here.
    //   - DENY framing (no clickjacking; we never iframe ourselves)
    //   - nosniff (MIME-type confusion blocked)
    //   - referrer trimmed cross-origin (don't leak full URLs to ad networks)
    //   - permissions locked off for sensors we never use
    async headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    { key: 'X-Frame-Options',         value: 'DENY' },
                    { key: 'X-Content-Type-Options',  value: 'nosniff' },
                    { key: 'Referrer-Policy',         value: 'strict-origin-when-cross-origin' },
                    { key: 'Permissions-Policy',      value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
                ],
            },
        ]
    },
}

export default nextConfig
