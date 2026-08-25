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
  const isLandingRoute = pathname === '/';

  // Fast-path: untuk request non-auth & non-role (misal: webhook, api publik),
  // lewati autentikasi remote untuk menghasilkan TTFB super cepat (<10ms).
  if (!isProtectedRoleRoute && !isAuthRoute && !isLandingRoute) {
    return NextResponse.next({ request });
  }

  // Cek apakah ada cookie token Supabase sama sekali di request
  const hasAuthCookie = request.cookies
    .getAll()
    .some((c) => c.name.startsWith('sb-') && c.name.includes('-auth-token'));

  // 1. Jika pengunjung belum login dan mencoba mengakses rute terproteksi, langsung redirect ke /login
  if (isProtectedRoleRoute && !hasAuthCookie) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(url);
  }

  // 2. Jika di halaman landing atau auth tanpa cookie, langsung izinkan render
  if ((isAuthRoute || isLandingRoute) && !hasAuthCookie) {
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

  // Jika pengunjung tidak login dan akses route protected, redirect ke /login
  if (isProtectedRoleRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(url);
  }

  // Jika user sudah login dan membuka landing page (/) atau auth route (/login, /register),
  // otomatis redirect langsung ke dashboard perannya masing-masing
  if ((isAuthRoute || isLandingRoute) && user) {
    // Ambil role dari profiles untuk akurasi penuh
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    const role = profile?.role || user.user_metadata?.role || 'petani';
    const url = request.nextUrl.clone();
    url.pathname = `/${role}`;
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
