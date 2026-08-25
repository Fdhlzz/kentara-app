'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { sendWebPushNotification } from '@/lib/notifications/push-dispatcher';
import type {
  AppNotification,
  SendNotificationInput,
  PushSubscriptionData,
} from '@/types/notification';

/**
 * Kirim notifikasi sistem (In-App & Background Web Push Notification)
 */
export async function sendNotificationAction(
  input: SendNotificationInput
): Promise<{ success: boolean; error?: string; notification?: AppNotification }> {
  try {
    const supabase = await createClient();

    const {
      title,
      message,
      type,
      recipient_role = 'all',
      user_id = null,
      order_id = null,
      data = null,
    } = input;

    // 1. Insert in-app notification record
    const { data: notifData, error } = await supabase
      .from('notifications')
      .insert({
        title: title.trim(),
        message: message.trim(),
        type,
        recipient_role,
        user_id,
        order_id,
        data,
        is_read: false,
      })
      .select()
      .single();

    if (error || !notifData) {
      console.error('[sendNotificationAction Error]:', error);
      return { success: false, error: error?.message || 'Gagal menyimpan notifikasi.' };
    }

    // 2. Dispatch background Web Push (PWA & browser devices)
    try {
      await sendWebPushNotification(input);
    } catch (pushErr) {
      console.error('[sendWebPushNotification Dispatch Error]:', pushErr);
    }

    revalidatePath('/admin');
    revalidatePath('/kurir');
    revalidatePath('/petani');

    return {
      success: true,
      notification: notifData as AppNotification,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Terjadi kegagalan mengirim notifikasi.';
    console.error('[sendNotificationAction Error]:', err);
    return { success: false, error: msg };
  }
}

/**
 * Mengambil daftar notifikasi untuk peran / pengguna tertentu
 */
export async function getUserNotificationsAction(
  role?: string,
  userId?: string
): Promise<AppNotification[]> {
  try {
    const supabase = await createClient();

    let query = supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30);

    if (userId) {
      if (role) {
        query = query.or(`user_id.eq.${userId},recipient_role.eq.${role},recipient_role.eq.all`);
      } else {
        query = query.or(`user_id.eq.${userId},recipient_role.eq.all`);
      }
    } else if (role) {
      query = query.or(`recipient_role.eq.${role},recipient_role.eq.all`);
    }

    const { data, error } = await query;

    if (error || !data) {
      console.error('[getUserNotificationsAction Error]:', error);
      return [];
    }

    return data as AppNotification[];
  } catch (err) {
    console.error('[getUserNotificationsAction Error]:', err);
    return [];
  }
}

/**
 * Tandai satu notifikasi telah dibaca
 */
export async function markNotificationReadAction(
  notificationId: string
): Promise<{ success: boolean }> {
  try {
    const supabase = await createClient();

    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    revalidatePath('/admin');
    revalidatePath('/kurir');
    revalidatePath('/petani');

    return { success: true };
  } catch {
    return { success: false };
  }
}

/**
 * Tandai seluruh notifikasi telah dibaca
 */
export async function markAllNotificationsReadAction(
  role?: string,
  userId?: string
): Promise<{ success: boolean }> {
  try {
    const supabase = await createClient();

    let query = supabase.from('notifications').update({ is_read: true }).eq('is_read', false);

    if (userId) {
      query = query.or(`user_id.eq.${userId},recipient_role.eq.${role || 'all'},recipient_role.eq.all`);
    } else if (role) {
      query = query.or(`recipient_role.eq.${role},recipient_role.eq.all`);
    }

    await query;

    revalidatePath('/admin');
    revalidatePath('/kurir');
    revalidatePath('/petani');

    return { success: true };
  } catch {
    return { success: false };
  }
}

/**
 * Simpan langganan Web Push Subscription (Browser Push Notification)
 */
export async function savePushSubscriptionAction(
  sub: PushSubscriptionData,
  role?: string,
  userId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const { endpoint, keys } = sub;

    const { error } = await supabase
      .from('push_subscriptions')
      .upsert(
        {
          endpoint,
          p256dh: keys.p256dh,
          auth: keys.auth,
          role: role || null,
          user_id: userId || null,
        },
        { onConflict: 'endpoint' }
      );

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal menyimpan subscription push.';
    return { success: false, error: msg };
  }
}
