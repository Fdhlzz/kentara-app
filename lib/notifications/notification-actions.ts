'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { sendWebPushNotification } from '@/lib/notifications/push-dispatcher';
import { sanitizeString } from '@/lib/security/validation';
import type {
  AppNotification,
  SendNotificationInput,
  PushSubscriptionData,
  RecipientRole,
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
      data: { user },
    } = await supabase.auth.getUser();

    const title = sanitizeString(input.title, 150);
    const message = sanitizeString(input.message, 500);

    if (!title || !message) {
      return { success: false, error: 'Judul dan pesan notifikasi wajib diisi.' };
    }

    let callerRole: string = 'system';
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();
      callerRole = profile?.role || user.user_metadata?.role || 'petani';
    }

    // Role guard: Non-admin users cannot broadcast to 'all' or other specific roles arbitrarily
    let recipient_role: RecipientRole = input.recipient_role || 'all';
    let targetUserId = input.user_id || null;

    if (callerRole !== 'admin' && callerRole !== 'system') {
      if (callerRole === 'petani') {
        recipient_role = 'petani';
        targetUserId = user?.id || null;
      } else if (callerRole === 'kurir') {
        recipient_role = 'kurir';
        targetUserId = user?.id || null;
      }
    }

    // 1. Insert in-app notification record
    const { data: notifData, error } = await supabase
      .from('notifications')
      .insert({
        title,
        message,
        type: input.type || 'general',
        recipient_role,
        user_id: targetUserId,
        order_id: input.order_id || null,
        data: input.data || null,
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
      await sendWebPushNotification({
        ...input,
        title,
        message,
        recipient_role,
        user_id: targetUserId,
      });
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
 * Resolves session and role server-side to prevent IDOR / privilege escalation
 */
export async function getUserNotificationsAction(
  clientRoleHint?: string,
  clientUserIdHint?: string
): Promise<AppNotification[]> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let authenticatedRole: string | null = null;
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      authenticatedRole = profile?.role || user.user_metadata?.role || 'petani';
    }

    let query = supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30);

    if (!user) {
      // Unauthenticated visitors only see general public broadcasts
      query = query.is('user_id', null).eq('recipient_role', 'all');
    } else if (authenticatedRole === 'admin') {
      // Admin sees admin notifications and broadcasts
      query = query.or('recipient_role.eq.admin,recipient_role.eq.all');
    } else if (authenticatedRole === 'kurir') {
      // Courier sees courier broadcasts or notifications specifically addressed to their user_id
      query = query.or(`user_id.eq.${user.id},and(user_id.is.null,recipient_role.in.(kurir,all))`);
    } else {
      // Petani / buyer sees their own notifications or public broadcasts
      query = query.or(`user_id.eq.${user.id},and(user_id.is.null,recipient_role.in.(petani,all))`);
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
 * Tandai satu notifikasi telah dibaca (scoped to user session)
 */
export async function markNotificationReadAction(
  notificationId: string
): Promise<{ success: boolean }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { success: false };

    let query = supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    // Ensure non-admin users only update notifications sent to their own user_id or matching public role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    const role = profile?.role || user.user_metadata?.role;
    if (role !== 'admin') {
      query = query.or(`user_id.eq.${user.id},user_id.is.null`);
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
 * Tandai seluruh notifikasi telah dibaca
 */
export async function markAllNotificationsReadAction(
  clientRoleHint?: string,
  clientUserIdHint?: string
): Promise<{ success: boolean }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { success: false };

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    const role = profile?.role || user.user_metadata?.role || 'petani';

    let query = supabase.from('notifications').update({ is_read: true }).eq('is_read', false);

    if (role === 'admin') {
      query = query.or(`user_id.eq.${user.id},recipient_role.eq.admin,recipient_role.eq.all`);
    } else {
      query = query.or(`user_id.eq.${user.id},and(user_id.is.null,recipient_role.in.(${role},all))`);
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
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { endpoint, keys } = sub;

    // Use authenticated user ID when available
    const effectiveUserId = user?.id || userId || null;
    let effectiveRole = role || null;
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();
      effectiveRole = profile?.role || effectiveRole;
    }

    const { error } = await supabase
      .from('push_subscriptions')
      .upsert(
        {
          endpoint,
          p256dh: keys.p256dh,
          auth: keys.auth,
          role: effectiveRole,
          user_id: effectiveUserId,
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
