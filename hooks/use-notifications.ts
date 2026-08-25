'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  getUserNotificationsAction,
  markNotificationReadAction,
  markAllNotificationsReadAction,
  savePushSubscriptionAction,
} from '@/lib/notifications/notification-actions';
import type { AppNotification } from '@/types/notification';

interface UseNotificationsOptions {
  role?: string;
  userId?: string;
  pollInterval?: number; // default: 10000 ms (10s)
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function useNotifications({
  role = 'all',
  userId,
  pollInterval = 10000,
}: UseNotificationsOptions = {}) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check initial permission & subscription
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);

      if ('serviceWorker' in navigator && Notification.permission === 'granted') {
        navigator.serviceWorker.ready.then(async (reg) => {
          const sub = await reg.pushManager.getSubscription();
          if (sub) {
            setIsSubscribed(true);
          }
        });
      }
    }
  }, []);

  // Fetch in-app notifications
  const refreshNotifications = useCallback(async () => {
    try {
      const data = await getUserNotificationsAction(role, userId);
      setNotifications(data);
    } catch (err) {
      console.error('[useNotifications error]:', err);
    }
  }, [role, userId]);

  // Initial fetch and polling loop
  useEffect(() => {
    refreshNotifications();
    const interval = setInterval(refreshNotifications, pollInterval);
    return () => clearInterval(interval);
  }, [refreshNotifications, pollInterval]);

  // Request native PWA / Browser Web Push Notification permission & subscribe
  const requestPermission = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      toast.error('Browser Anda tidak mendukung Web Notification.');
      return false;
    }

    try {
      setIsLoading(true);
      const res = await Notification.requestPermission();
      setPermission(res);

      if (res === 'granted') {
        // Register Service Worker push subscription if available
        if ('serviceWorker' in navigator && 'PushManager' in window) {
          const registration = await navigator.serviceWorker.ready;
          const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

          if (vapidPublicKey) {
            try {
              const convertedKey = urlBase64ToUint8Array(vapidPublicKey);
              let subscription = await registration.pushManager.getSubscription();

              if (!subscription) {
                subscription = await registration.pushManager.subscribe({
                  userVisibleOnly: true,
                  applicationServerKey: convertedKey,
                });
              }

              const rawSub = subscription.toJSON();
              if (rawSub.endpoint && rawSub.keys?.p256dh && rawSub.keys?.auth) {
                await savePushSubscriptionAction(
                  {
                    endpoint: rawSub.endpoint,
                    keys: {
                      p256dh: rawSub.keys.p256dh,
                      auth: rawSub.keys.auth,
                    },
                  },
                  role,
                  userId
                );
                setIsSubscribed(true);
              }
            } catch (subErr) {
              console.error('[Push Subscription Error]:', subErr);
            }
          }

          // Show test welcome notification
          registration.showNotification('🌾 Kentara PWA Push Notification Aktif', {
            body: 'Notifikasi pesanan dan pengantaran akan muncul secara langsung di perangkat Anda.',
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-192x192.png',
          } as NotificationOptions);
        }

        toast.success('Notifikasi Web Push PWA Diaktifkan!', {
          description: 'Anda akan menerima notifikasi otomatis bahkan saat aplikasi ditutup.',
        });
        return true;
      } else {
        toast.info('Izin notifikasi ditolak.');
        return false;
      }
    } catch (err) {
      console.error('[requestPermission Error]:', err);
      toast.error('Gagal mengaktifkan notifikasi');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [role, userId]);

  // Mark single as read
  const markAsRead = useCallback(async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    await markNotificationReadAction(id);
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    await markAllNotificationsReadAction(role, userId);
    toast.success('Semua notifikasi telah ditandai dibaca.');
  }, [role, userId]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return {
    notifications,
    unreadCount,
    permission,
    isSubscribed,
    isLoading,
    refreshNotifications,
    requestPermission,
    markAsRead,
    markAllAsRead,
  };
}
