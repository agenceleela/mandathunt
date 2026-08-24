import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Refresh session
  const { data: { session } } = await supabase.auth.getSession()

  // Routes publiques (login uniquement)
  const isLoginRoute = request.nextUrl.pathname === '/login'

  if (!session && !isLoginRoute) {
    // Pas de session → redirect vers /login
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirectedFrom', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (session && isLoginRoute) {
    // Déjà connecté → redirect vers /
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Vérifier que la session a un profil associé
  if (session && !isLoginRoute) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role, agency_id')
      .eq('id', session.user.id)
      .single()

    if (!profile) {
      // Session sans profil → logout + message
      await supabase.auth.signOut()
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('error', 'no_profile')
      return NextResponse.redirect(loginUrl)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
