import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { isAdminEmail } from '@/lib/auth/admins'

// Routes that require an authenticated session. Anonymous users hitting any of
// these get bounced to /login?next=<original-path>; on successful login we send
// them back to where they were going.
//
// /pro/apply is included — anyone offering a service must have an account so
// the provider record can attach to a real user_id when verified.
//
// /admin requires not just auth but admin allowlist membership (see admins.js).
const PROTECTED_PREFIXES = ['/store', '/pro', '/orders', '/admin', '/messages']

const isProtected = (pathname) => PROTECTED_PREFIXES.some(p =>
    pathname === p || pathname.startsWith(p + '/')
)

const isAdminRoute = (pathname) => pathname === '/admin' || pathname.startsWith('/admin/')

// Refresh the Supabase session on every request so cookies stay live, and
// gate the protected routes above on the user being signed in.
export async function middleware(request) {
    // Expose the request pathname to server components so layouts can do
    // route-aware logic (e.g. /store/layout deciding whether to redirect to
    // /store/setup) without each page wiring it manually.
    request.headers.set('x-pathname', request.nextUrl.pathname)

    let response = NextResponse.next({ request })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                    response = NextResponse.next({ request })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // Touching getUser() forces a refresh if the access token is near expiry.
    const { data: { user } } = await supabase.auth.getUser()

    if (!user && isProtected(request.nextUrl.pathname)) {
        const loginUrl = request.nextUrl.clone()
        loginUrl.pathname = '/login'
        loginUrl.searchParams.set('next', request.nextUrl.pathname + request.nextUrl.search)
        return NextResponse.redirect(loginUrl)
    }

    // Admin allowlist check — even authenticated non-admins can't see /admin.
    if (user && isAdminRoute(request.nextUrl.pathname) && !isAdminEmail(user.email)) {
        const homeUrl = request.nextUrl.clone()
        homeUrl.pathname = '/'
        homeUrl.search = ''
        return NextResponse.redirect(homeUrl)
    }

    return response
}

export const config = {
    matcher: [
        // Skip Next.js internals + image/static asset endpoints — auth not relevant on those.
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
