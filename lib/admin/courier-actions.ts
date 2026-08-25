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
 * Helper to ensure current user is authenticated as admin
 */
async function verifyAdminRole() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Autentikasi diperlukan. Silakan login kembali sebagai Administrator.');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  const userRole = profile?.role || user.user_metadata?.role;

  if (userRole !== 'admin') {
    throw new Error('Akses ditolak. Tindakan ini memerlukan hak akses Administrator.');
  }

  return { supabase, user };
}

/**
 * Mengambil statistik ringkasan pengguna untuk Admin Dashboard
 */
export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  try {
    const { supabase } = await verifyAdminRole();

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
    const { supabase } = await verifyAdminRole();

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
  try {
    const { supabase } = await verifyAdminRole();

    const fullName = String(formData.get('full_name') || '').trim();
    const rawEmail = String(formData.get('email') || '').trim();
    const rawPhone = String(formData.get('phone') || '').trim();
    const password = String(formData.get('password') || '');

    if (!fullName || fullName.length < 2) {
      return { success: false, error: 'Nama lengkap kurir wajib diisi (minimal 2 karakter).' };
    }

    const { validateEmail, validatePhone, validatePasswordStrength } = await import('@/lib/security/validation');

    const emailCheck = validateEmail(rawEmail);
    if (!emailCheck.valid || !emailCheck.sanitized) {
      return { success: false, error: emailCheck.error || 'Alamat email kurir tidak valid.' };
    }

    const pwdCheck = validatePasswordStrength(password);
    if (!pwdCheck.valid) {
      return { success: false, error: pwdCheck.error || 'Kata sandi minimal 6 karakter.' };
    }

    let formattedPhone: string | null = null;
    if (rawPhone) {
      const phoneCheck = validatePhone(rawPhone);
      if (!phoneCheck.valid) {
        return { success: false, error: phoneCheck.error || 'Format nomor telepon tidak valid.' };
      }
      formattedPhone = phoneCheck.formatted || null;
    }

    const { error } = await supabase.rpc('admin_create_courier', {
      p_full_name: fullName,
      p_email: emailCheck.sanitized,
      p_password: password,
      p_phone: formattedPhone,
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
  try {
    const { supabase } = await verifyAdminRole();

    const userId = String(formData.get('id') || '').trim();
    const fullName = String(formData.get('full_name') || '').trim();
    const rawPhone = String(formData.get('phone') || '').trim();
    const newPassword = String(formData.get('new_password') || '').trim();

    if (!userId) {
      return { success: false, error: 'ID kurir tidak valid.' };
    }
    if (!fullName || fullName.length < 2) {
      return { success: false, error: 'Nama lengkap kurir wajib diisi.' };
    }

    const { validatePhone, validatePasswordStrength } = await import('@/lib/security/validation');

    if (newPassword) {
      const pwdCheck = validatePasswordStrength(newPassword);
      if (!pwdCheck.valid) {
        return { success: false, error: pwdCheck.error || 'Kata sandi baru minimal harus 6 karakter.' };
      }
    }

    let formattedPhone: string | null = null;
    if (rawPhone) {
      const phoneCheck = validatePhone(rawPhone);
      if (!phoneCheck.valid) {
        return { success: false, error: phoneCheck.error || 'Format telepon tidak valid.' };
      }
      formattedPhone = phoneCheck.formatted || null;
    }

    const { error } = await supabase.rpc('admin_update_courier', {
      p_user_id: userId,
      p_full_name: fullName,
      p_phone: formattedPhone,
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
    const { supabase } = await verifyAdminRole();

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

/**
 * Kurir Action: Mulai Pengantaran (Swipe to Start Delivery)
 */
export async function startCourierDeliveryAction(
  orderId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Sesi kurir tidak valid. Silakan login kembali.' };
    }

    // Verify order belongs to courier
    const { data: order, error: findErr } = await supabase
      .from('orders')
      .select('id, order_code, courier_id, order_status, customer_name, user_id')
      .eq('id', orderId)
      .single();

    if (findErr || !order) {
      return { success: false, error: 'Pesanan tidak ditemukan.' };
    }

    if (order.courier_id !== user.id) {
      return { success: false, error: 'Anda tidak memiliki otorisasi untuk pesanan ini.' };
    }

    // Update status to 'dikirim'
    const { error: updateErr } = await supabase
      .from('orders')
      .update({
        order_status: 'dikirim',
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (updateErr) {
      return { success: false, error: updateErr.message };
    }

    // Send Realtime Push Notification to Petani / Buyer
    try {
      const { sendNotificationAction } = await import('@/lib/notifications/notification-actions');
      await sendNotificationAction({
        title: '🚚 Benih Sedang Diantar oleh Kurir!',
        message: `Kurir sedang menuju ke lokasi lahan Anda untuk mengantarkan pesanan ${order.order_code}.`,
        type: 'courier_task',
        recipient_role: 'petani',
        user_id: order.user_id || null,
        order_id: orderId,
        data: {
          order_code: order.order_code,
          url: '/petani',
        },
      });
    } catch (notifErr) {
      console.error('[startCourierDeliveryAction Notification Error]:', notifErr);
    }

    revalidatePath('/kurir');
    revalidatePath('/admin');
    revalidatePath('/petani');

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal memulai pengantaran.';
    return { success: false, error: msg };
  }
}

/**
 * Kurir Action: Selesaikan Pengantaran (Swipe to Finish + Cash Payment Verification)
 */
export async function completeCourierDeliveryAction(
  orderId: string,
  options?: {
    cashPaidConfirmed?: boolean;
    cashNotes?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Sesi kurir tidak valid. Silakan login kembali.' };
    }

    // 1. Fetch order
    const { data: order, error: findErr } = await supabase
      .from('orders')
      .select('id, order_code, courier_id, payment_gateway, payment_status, total_amount, user_id, customer_name, paid_at')
      .eq('id', orderId)
      .single();

    if (findErr || !order) {
      return { success: false, error: 'Pesanan tidak ditemukan.' };
    }

    if (order.courier_id !== user.id) {
      return { success: false, error: 'Anda tidak memiliki otorisasi untuk pesanan ini.' };
    }

    // 2. If Cash (COD) payment, check confirmation
    const isCashOrder = order.payment_gateway === 'cash';
    if (isCashOrder && !options?.cashPaidConfirmed) {
      return {
        success: false,
        error: 'Mohon konfirmasi bahwa uang tunai (COD) telah Anda terima dari pembeli.',
      };
    }

    const now = new Date().toISOString();

    // 3. If Cash, update public.payments table
    if (isCashOrder) {
      await supabase
        .from('payments')
        .update({
          payment_status: 'completed',
          paid_at: now,
          cash_collected_by: user.id,
          notes: options?.cashNotes || `Uang tunai Rp ${order.total_amount.toLocaleString('id-ID')} diterima kurir saat pengantaran.`,
        })
        .eq('order_id', orderId);
    }

    // 4. Update order status to 'selesai' and payment_status to 'settlement'
    const { error: updateErr } = await supabase
      .from('orders')
      .update({
        order_status: 'selesai',
        payment_status: 'settlement',
        paid_at: order.paid_at || now,
        updated_at: now,
      })
      .eq('id', orderId);

    if (updateErr) {
      return { success: false, error: updateErr.message };
    }

    // 5. Send completion notifications to Admin & Buyer
    try {
      const { sendNotificationAction } = await import('@/lib/notifications/notification-actions');
      await sendNotificationAction({
        title: '🎉 Pesanan Benih Berhasil Tiba & Selesai!',
        message: `Pesanan ${order.order_code} untuk ${order.customer_name} telah sukses diserahkan oleh kurir.`,
        type: 'order_delivered',
        recipient_role: 'all',
        user_id: order.user_id || null,
        order_id: orderId,
        data: {
          order_code: order.order_code,
          url: '/petani',
        },
      });
    } catch (notifErr) {
      console.error('[completeCourierDeliveryAction Notification Error]:', notifErr);
    }

    revalidatePath('/kurir');
    revalidatePath('/admin');
    revalidatePath('/admin/orders');
    revalidatePath('/admin/payments');
    revalidatePath('/petani');

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal menyelesaikan pengantaran.';
    return { success: false, error: msg };
  }
}

/**
 * Kurir Action: Edit Profile Mandiri
 */
export async function updateCourierSelfProfileAction(input: {
  full_name: string;
  phone: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Sesi tidak valid.' };
    }

    if (!input.full_name?.trim()) {
      return { success: false, error: 'Nama lengkap wajib diisi.' };
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: input.full_name.trim(),
        phone: input.phone?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/kurir');
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal memperbarui profil.';
    return { success: false, error: msg };
  }
}
