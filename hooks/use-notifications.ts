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

export function useNotifications({
  role = 'all',
  userId,
  pollInterval = 10000,
}: UseNotificationsOptions = {}) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isLoading, setIsLoading] = useState(false);

  // Check initial permission
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  // Fetch notifications
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

  // Request native Browser Notification permission
  const requestPermission = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      toast.error('Browser Anda tidak mendukung Web Notification.');
      return false;
    }

    try {
      const res = await Notification.requestPermission();
      setPermission(res);

      if (res === 'granted') {
        toast.success('Notifikasi Web Push Diaktifkan!', {
          description: 'Anda akan menerima pemberitahuan instan saat ada pesanan dan tugas baru.',
        });

        // Register Service Worker push subscription if available
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.ready;
          // Show test welcome notification
          registration.showNotification('🌾 Kentara Push Notification Aktif', {
            body: 'Pemberitahuan pesanan dan tugas kurir akan muncul secara real-time.',
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-192x192.png',
          } as NotificationOptions);
        }
        return true;
      } else {
        toast.info('Izin notifikasi ditolak.');
        return false;
      }
    } catch (err) {
      console.error('[requestPermission Error]:', err);
      return false;
    }
  }, []);

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
    isLoading,
    refreshNotifications,
    requestPermission,
    markAsRead,
    markAllAsRead,
  };
}
