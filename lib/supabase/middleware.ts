import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Lindungi rute-rute khusus role (/admin, /petani, /kurir)
  const isProtectedRoleRoute =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/petani') ||
    pathname.startsWith('/kurir');

  const isAuthRoute = pathname === '/login' || pathname === '/register';

  // Fast-path: untuk rute publik umum seperti beranda, webhook, dan api publik,
  // lewati autentikasi remote untuk menghasilkan TTFB super cepat (<10ms).
  if (!isProtectedRoleRoute && !isAuthRoute) {
    return NextResponse.next({ request });
  }

  // Cek apakah ada cookie token Supabase sama sekali di request
  const hasAuthCookie = request.cookies
    .getAll()
    .some((c) => c.name.startsWith('sb-') && c.name.includes('-auth-token'));

  // Jika pengunjung belum login dan mencoba mengakses rute terproteksi, langsung redirect ke /login
  if (isProtectedRoleRoute && !hasAuthCookie) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(url);
  }

  // Jika di halaman auth (/login, /register) dan tidak ada cookie auth, langsung render
  if (isAuthRoute && !hasAuthCookie) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    '';

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // Ambil data user dari session token
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (isProtectedRoleRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthRoute && user) {
    const role = user.user_metadata?.role || 'petani';
    const url = request.nextUrl.clone();
    url.pathname = `/${role}`;
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
