import webpush from 'web-push';
import { createClient } from '@/lib/supabase/server';
import type { SendNotificationInput } from '@/types/notification';

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@kentara.id';

let isVapidConfigured = false;

if (vapidPublicKey && vapidPrivateKey) {
  try {
    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
    isVapidConfigured = true;
  } catch (err) {
    console.error('[WebPush VAPID Init Error]:', err);
  }
}

/**
 * Dispatch real-time background Web Push to PWA / Mobile Devices
 */
export async function sendWebPushNotification(
  input: SendNotificationInput
): Promise<{ sentCount: number; errorsCount: number }> {
  if (!isVapidConfigured) {
    console.warn('[WebPush] VAPID keys are not configured. Skipping background push.');
    return { sentCount: 0, errorsCount: 0 };
  }

  try {
    const supabase = await createClient();
    const { title, message, type, recipient_role = 'all', user_id, order_id, data } = input;

    // Determine target URL based on role and type
    let defaultUrl = '/';
    if (recipient_role === 'admin') defaultUrl = '/admin';
    else if (recipient_role === 'kurir') defaultUrl = '/kurir';
    else if (recipient_role === 'petani') defaultUrl = '/petani';

    const targetUrl = data?.url || defaultUrl;

    // 1. Query target subscriptions from DB
    let query = supabase.from('push_subscriptions').select('id, endpoint, p256dh, auth, role, user_id');

    if (user_id) {
      if (recipient_role && recipient_role !== 'all') {
        query = query.or(`user_id.eq.${user_id},role.eq.${recipient_role},role.eq.all`);
      } else {
        query = query.or(`user_id.eq.${user_id},role.eq.all`);
      }
    } else if (recipient_role && recipient_role !== 'all') {
      query = query.or(`role.eq.${recipient_role},role.eq.all`);
    }

    const { data: subscriptions, error } = await query;

    if (error || !subscriptions || subscriptions.length === 0) {
      return { sentCount: 0, errorsCount: 0 };
    }

    const payload = JSON.stringify({
      title,
      body: message,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      data: {
        url: targetUrl,
        type,
        order_id,
        ...data,
      },
    });

    let sentCount = 0;
    let errorsCount = 0;
    const expiredIds: string[] = [];

    // 2. Dispatch push to all matching client devices concurrently
    await Promise.all(
      subscriptions.map(async (sub) => {
        try {
          const pushSubscription = {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          };

          await webpush.sendNotification(pushSubscription, payload);
          sentCount++;
        } catch (pushErr: any) {
          errorsCount++;
          // If subscription is expired or unregistered (HTTP 404 or 410 Gone), flag for removal
          if (pushErr.statusCode === 404 || pushErr.statusCode === 410) {
            expiredIds.push(sub.id);
          } else {
            console.error(`[WebPush Send Error for endpoint ${sub.endpoint.slice(0, 30)}...]:`, pushErr?.message || pushErr);
          }
        }
      })
    );

    // 3. Cleanup expired subscriptions if any
    if (expiredIds.length > 0) {
      await supabase.from('push_subscriptions').delete().in('id', expiredIds);
    }

    return { sentCount, errorsCount };
  } catch (err) {
    console.error('[sendWebPushNotification Global Error]:', err);
    return { sentCount: 0, errorsCount: 0 };
  }
}
