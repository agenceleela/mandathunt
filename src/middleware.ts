import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Routes publiques
  if (
    request.nextUrl.pathname === '/login' ||
    request.nextUrl.pathname === '/mot-de-passe'
  ) {
    // Si déjà connecté, rediriger vers /
    if (user) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return supabaseResponse;
  }

  // Routes protégées : vérifier authentification
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Vérifier le profil et le rôle
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role, agency_id, id')
    .eq('id', user.id)
    .single();

  if (error || !profile) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Route /reglages : accessible uniquement aux admin et superadmin
  if (request.nextUrl.pathname === '/reglages') {
    if (profile.role !== 'admin' && profile.role !== 'superadmin') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Si l'utilisateur n'a pas encore de mot de passe (invitation en cours)
  // et qu'il n'est pas sur /mot-de-passe, rediriger
  const { data: userData } = await supabase.auth.admin.getUserById(user.id);
  if (
    userData?.user &&
    !userData.user.last_sign_in_at &&
    request.nextUrl.pathname !== '/mot-de-passe'
  ) {
    return NextResponse.redirect(new URL('/mot-de-passe', request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
