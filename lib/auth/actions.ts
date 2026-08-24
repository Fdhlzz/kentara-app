'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { AuthActionResult, UserProfile, UserRole } from '@/types/auth';

/**
 * Mendapatkan profil pengguna saat ini beserta email dari Supabase Auth
 */
export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return null;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile) {
      // Fallback profil jika record belum ada di tabel profiles
      const metaRole = (user.user_metadata?.role as UserRole) || 'petani';
      return {
        id: user.id,
        full_name:
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email?.split('@')[0] ||
          'Pengguna Kentara',
        phone: user.user_metadata?.phone || null,
        role: ['admin', 'petani', 'kurir'].includes(metaRole) ? metaRole : 'petani',
        created_at: user.created_at,
        updated_at: user.updated_at || user.created_at,
        email: user.email,
      };
    }

    return {
      ...profile,
      email: user.email,
    };
  } catch (err) {
    console.error('[getCurrentUserProfile Error]:', err);
    return null;
  }
}

/**
 * Server Action untuk proses Login dengan penanganan error komprehensif
 */
export async function loginAction(formData: FormData): Promise<AuthActionResult> {
  const email = String(formData.get('email') || '').trim();
  const password = String(formData.get('password') || '');

  if (!email) {
    return {
      success: false,
      error: 'Alamat email wajib diisi.',
    };
  }

  if (!password) {
    return {
      success: false,
      error: 'Kata sandi wajib diisi.',
    };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      let errorMessage = 'Gagal masuk ke akun.';
      const rawMsg = error?.message || '';

      if (rawMsg.includes('Invalid login credentials')) {
        errorMessage = 'Email atau kata sandi yang Anda masukkan salah.';
      } else if (rawMsg.includes('Email not confirmed')) {
        errorMessage = 'Email Anda belum dikonfirmasi. Silakan periksa inbox/spam email Anda.';
      } else if (rawMsg.includes('rate limit') || rawMsg.includes('Too many requests')) {
        errorMessage = 'Terlalu banyak percobaan masuk. Mohon tunggu 1-2 menit sebelum mencoba kembali.';
      } else if (rawMsg) {
        errorMessage = rawMsg;
      }

      return {
        success: false,
        error: errorMessage,
      };
    }

    // Ambil role pengguna dari tabel profiles dengan fallback ke metadata
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .maybeSingle();

    const role = (profile?.role || data.user.user_metadata?.role || 'petani') as UserRole;
    const targetPath = `/${role}`;

    return {
      success: true,
      redirectTo: targetPath,
    };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Terjadi gangguan jaringan atau server.';
    console.error('[loginAction Error]:', message);

    return {
      success: false,
      error: 'Terjadi kesalahan sistem saat mencoba masuk. Silakan coba kembali.',
    };
  }
}

/**
 * Server Action untuk proses Registrasi dengan penanganan error komprehensif
 */
export async function registerAction(formData: FormData): Promise<AuthActionResult> {
  const fullName = String(formData.get('full_name') || '').trim();
  const phone = String(formData.get('phone') || '').trim();
  const email = String(formData.get('email') || '').trim();
  const password = String(formData.get('password') || '');
  const role: UserRole = 'petani';

  if (!fullName) {
    return { success: false, error: 'Nama lengkap wajib diisi.' };
  }
  if (!email) {
    return { success: false, error: 'Alamat email wajib diisi.' };
  }
  if (!password || password.length < 6) {
    return {
      success: false,
      error: 'Kata sandi minimal harus terdiri dari 6 karakter.',
    };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone: phone || null,
          role: role,
        },
      },
    });

    if (error || !data.user) {
      let errorMessage = 'Gagal mendaftarkan akun baru.';
      const rawMsg = error?.message || '';

      if (rawMsg.includes('already registered') || rawMsg.includes('User already exists')) {
        errorMessage = 'Alamat email ini sudah terdaftar. Silakan masuk atau gunakan email lain.';
      } else if (rawMsg.includes('Password should be')) {
        errorMessage = 'Kata sandi terlalu sederhana. Mohon gunakan kata sandi yang lebih kuat.';
      } else if (rawMsg) {
        errorMessage = rawMsg;
      }

      return {
        success: false,
        error: errorMessage,
      };
    }

    // Pastikan profil tersimpan di database
    await supabase.from('profiles').upsert({
      id: data.user.id,
      full_name: fullName,
      phone: phone || null,
      role: role,
    });

    return {
      success: true,
      redirectTo: '/petani',
    };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Terjadi gangguan jaringan atau server.';
    console.error('[registerAction Error]:', message);

    return {
      success: false,
      error: 'Terjadi kesalahan sistem saat mendaftar. Silakan coba kembali.',
    };
  }
}

/**
 * Server Action untuk proses Logout
 */
export async function logoutAction(): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch (err) {
    console.error('[logoutAction Error]:', err);
  }
  redirect('/login');
}
