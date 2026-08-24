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

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      // Fallback profil jika trigger database belum menyinkronkan
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
 * Server Action untuk proses Login
 */
export async function loginAction(formData: FormData): Promise<AuthActionResult> {
  const email = String(formData.get('email') || '').trim();
  const password = String(formData.get('password') || '');

  if (!email || !password) {
    return {
      success: false,
      error: 'Email dan kata sandi wajib diisi.',
    };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      return {
        success: false,
        error:
          error?.message === 'Invalid login credentials'
            ? 'Email atau kata sandi yang Anda masukkan salah.'
            : error?.message || 'Gagal masuk ke akun.',
      };
    }

    // Ambil role pengguna untuk menentukan halaman tujuan
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single();

    const role = (profile?.role || data.user.user_metadata?.role || 'petani') as UserRole;
    const targetPath = `/${role}`;

    return {
      success: true,
      redirectTo: targetPath,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan sistem.';
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Server Action untuk proses Registrasi (Khusus Pendaftaran Petani / Pembeli)
 */
export async function registerAction(formData: FormData): Promise<AuthActionResult> {
  const fullName = String(formData.get('full_name') || '').trim();
  const phone = String(formData.get('phone') || '').trim();
  const email = String(formData.get('email') || '').trim();
  const password = String(formData.get('password') || '');
  const role: UserRole = 'petani'; // Registrasi publik dikhususkan untuk role Petani

  if (!fullName) {
    return { success: false, error: 'Nama lengkap wajib diisi.' };
  }
  if (!email) {
    return { success: false, error: 'Email wajib diisi.' };
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
      return {
        success: false,
        error: error?.message || 'Gagal mendaftarkan akun baru.',
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
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan sistem.';
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Server Action untuk proses Logout
 */
export async function logoutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
