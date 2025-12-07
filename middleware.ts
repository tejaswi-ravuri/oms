import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Get session
  const { data: { session }, error } = await supabase.auth.getSession()

  const { pathname } = request.nextUrl

  // Public paths that don't require authentication
  const publicPaths = ['/login', '/signup', '/forgot-password', '/reset-password']
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path))

  // API routes and static files should pass through
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    pathname.includes('.')
  ) {
    return response
  }

  console.log('🔍 Middleware Check:', {
    path: pathname,
    hasSession: !!session,
    isPublic: isPublicPath,
    userEmail: session?.user?.email,
    sessionId: session?.user?.id,
    cookies: request.cookies.getAll().map(c => c.name)
  })

  // If user is NOT authenticated
  if (!session) {
    // Allow access to public paths
    if (isPublicPath) {
      return response
    }

    // Redirect to login for protected routes
    console.log('❌ No session, redirecting to /login')
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // If user IS authenticated
  if (session) {
    // Fetch user profile to check status
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_status, user_role')
      .eq('id', session.user.id)
      .single()

    // Check if account is active
    if (profile && profile.user_status !== 'Active') {
      console.log('❌ Account not active, redirecting to /login')
      await supabase.auth.signOut()
      return NextResponse.redirect(new URL('/login?error=account_inactive', request.url))
    }

    // If authenticated user tries to access public paths, redirect to dashboard
    if (isPublicPath) {
      console.log('✅ Already authenticated, redirecting to /dashboard')
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    console.log('✅ Authenticated, allowing access to:', pathname)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}