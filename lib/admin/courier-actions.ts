'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { UserProfile } from '@/types/auth';

export interface CourierUser extends UserProfile {
  email: string;
}

export interface AdminDashboardStats {
  totalPetani: number;
  totalKurir: number;
  totalAdmin: number;
  totalUsers: number;
}

/**
 * Mengambil statistik ringkasan pengguna untuk Admin Dashboard
 */
export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  try {
    const supabase = await createClient();

    const { data: stats, error } = await supabase.rpc('admin_get_stats');
    if (!error && stats) {
      return {
        totalPetani: Number(stats.totalPetani || 0),
        totalKurir: Number(stats.totalKurir || 0),
        totalAdmin: Number(stats.totalAdmin || 0),
        totalUsers: Number(stats.totalUsers || 0),
      };
    }

    // Fallback if RPC fails
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    return {
      totalPetani: 0,
      totalKurir: 0,
      totalAdmin: 0,
      totalUsers: totalUsers || 0,
    };
  } catch (err) {
    console.error('[getAdminDashboardStats Error]:', err);
    return { totalPetani: 0, totalKurir: 0, totalAdmin: 0, totalUsers: 0 };
  }
}

/**
 * Mengambil daftar seluruh akun Kurir dengan email
 */
export async function getCouriersList(): Promise<CourierUser[]> {
  try {
    const supabase = await createClient();

    const { data: rpcCouriers, error } = await supabase.rpc('admin_list_couriers');

    if (!error && Array.isArray(rpcCouriers)) {
      return rpcCouriers.map((c) => ({
        id: c.id,
        full_name: c.full_name,
        phone: c.phone,
        role: c.role,
        email: c.email || '-',
        created_at: c.created_at,
        updated_at: c.updated_at,
      }));
    }

    // Fallback if RPC is not available
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'kurir')
      .order('created_at', { ascending: false });

    if (profileError || !profiles) {
      return [];
    }

    return profiles.map((p) => ({
      id: p.id,
      full_name: p.full_name,
      phone: p.phone,
      role: p.role,
      created_at: p.created_at,
      updated_at: p.updated_at,
      email: '-',
    }));
  } catch (err) {
    console.error('[getCouriersList Error]:', err);
    return [];
  }
}

/**
 * Server Action untuk membuat akun Kurir baru
 */
export async function createCourierAction(
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const fullName = String(formData.get('full_name') || '').trim();
  const email = String(formData.get('email') || '').trim();
  const phone = String(formData.get('phone') || '').trim();
  const password = String(formData.get('password') || '');

  if (!fullName) {
    return { success: false, error: 'Nama lengkap kurir wajib diisi.' };
  }
  if (!email) {
    return { success: false, error: 'Alamat email kurir wajib diisi.' };
  }
  if (!password || password.length < 6) {
    return {
      success: false,
      error: 'Kata sandi minimal harus terdiri dari 6 karakter.',
    };
  }

  try {
    const supabase = await createClient();

    const { error } = await supabase.rpc('admin_create_courier', {
      p_full_name: fullName,
      p_email: email,
      p_password: password,
      p_phone: phone || null,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/admin');
    return { success: true };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Gagal membuat akun kurir.';
    return { success: false, error: message };
  }
}

/**
 * Server Action untuk memperbarui akun Kurir
 */
export async function updateCourierAction(
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const userId = String(formData.get('id') || '');
  const fullName = String(formData.get('full_name') || '').trim();
  const phone = String(formData.get('phone') || '').trim();
  const newPassword = String(formData.get('new_password') || '').trim();

  if (!userId) {
    return { success: false, error: 'ID kurir tidak valid.' };
  }
  if (!fullName) {
    return { success: false, error: 'Nama lengkap kurir wajib diisi.' };
  }
  if (newPassword && newPassword.length < 6) {
    return {
      success: false,
      error: 'Kata sandi baru minimal harus 6 karakter.',
    };
  }

  try {
    const supabase = await createClient();

    const { error } = await supabase.rpc('admin_update_courier', {
      p_user_id: userId,
      p_full_name: fullName,
      p_phone: phone || null,
      p_new_password: newPassword || null,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/admin');
    return { success: true };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Gagal memperbarui akun kurir.';
    return { success: false, error: message };
  }
}

/**
 * Server Action untuk menghapus akun Kurir
 */
export async function deleteCourierAction(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  if (!userId) {
    return { success: false, error: 'ID kurir tidak valid.' };
  }

  try {
    const supabase = await createClient();

    const { error } = await supabase.rpc('admin_delete_courier', {
      p_user_id: userId,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/admin');
    return { success: true };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Gagal menghapus akun kurir.';
    return { success: false, error: message };
  }
}
