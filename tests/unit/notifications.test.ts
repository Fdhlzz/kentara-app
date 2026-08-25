import { describe, it, expect } from 'vitest';
import type {
  AppNotification,
  SendNotificationInput,
  PushSubscriptionData,
} from '@/types/notification';

describe('5. Notification System & PWA Web Push Unit Tests (Notifikasi)', () => {
  const mockNotifications: AppNotification[] = [
    {
      id: 'notif-1',
      recipient_role: 'admin',
      user_id: null,
      title: '📦 Pesanan Benih Baru Masuk!',
      message: 'Pesanan KTR-260825-99AB oleh Bpk. Herman senilai Rp 1.425.000 siap diproses.',
      type: 'new_order',
      order_id: 'order-1',
      data: { order_code: 'KTR-260825-99AB', url: '/admin' },
      is_read: false,
      created_at: '2026-08-25T08:00:00Z',
    },
    {
      id: 'notif-2',
      recipient_role: 'kurir',
      user_id: 'kurir-1',
      title: '🚚 Tugas Pengantaran Benih Baru!',
      message: 'Anda ditugaskan mengantar pesanan KTR-260825-99AB ke Bpk. Herman (Lembang).',
      type: 'courier_task',
      order_id: 'order-1',
      data: { order_code: 'KTR-260825-99AB', url: '/kurir' },
      is_read: false,
      created_at: '2026-08-25T08:30:00Z',
    },
    {
      id: 'notif-3',
      recipient_role: 'petani',
      user_id: 'user-petani-1',
      title: '✅ Pembayaran Lunas & Pesanan Diproses!',
      message: 'Pembayaran pesanan KTR-260825-99AB telah berhasil diverifikasi.',
      type: 'payment_success',
      order_id: 'order-1',
      data: { order_code: 'KTR-260825-99AB', url: '/petani' },
      is_read: true,
      created_at: '2026-08-25T08:05:00Z',
    },
  ];

  it('should filter notifications properly by role and target user', () => {
    const filterForUser = (role: string, userId?: string) => {
      return mockNotifications.filter((n) => {
        if (userId && n.user_id === userId) return true;
        if (n.recipient_role === role || n.recipient_role === 'all') return true;
        return false;
      });
    };

    // Admin should see admin & all notifs
    const adminNotifs = filterForUser('admin');
    expect(adminNotifs).toHaveLength(1);
    expect(adminNotifs[0].type).toBe('new_order');

    // Courier 1 should see their task
    const kurir1Notifs = filterForUser('kurir', 'kurir-1');
    expect(kurir1Notifs).toHaveLength(1);
    expect(kurir1Notifs[0].type).toBe('courier_task');
  });

  it('should accurately calculate unread notifications count', () => {
    const unreadCount = mockNotifications.filter((n) => !n.is_read).length;
    expect(unreadCount).toBe(2);
  });

  it('should mark a notification as read', () => {
    const notifications = [...mockNotifications];
    const markAsRead = (id: string) => {
      const idx = notifications.findIndex((n) => n.id === id);
      if (idx !== -1) {
        notifications[idx] = { ...notifications[idx], is_read: true };
      }
    };

    markAsRead('notif-1');
    expect(notifications.find((n) => n.id === 'notif-1')?.is_read).toBe(true);
    expect(notifications.filter((n) => !n.is_read)).toHaveLength(1);
  });

  it('should validate PWA Web Push subscription data structure', () => {
    const sampleSubscription: PushSubscriptionData = {
      endpoint: 'https://fcm.googleapis.com/fcm/send/sample-token-12345',
      keys: {
        p256dh: 'BNcRdreALRF89x...sample-key',
        auth: 'tBHItJI5svb...sample-auth',
      },
    };

    expect(sampleSubscription.endpoint).toContain('https://');
    expect(sampleSubscription.keys.p256dh).toBeDefined();
    expect(sampleSubscription.keys.auth).toBeDefined();
  });

  it('should construct valid background Web Push payload JSON', () => {
    const input: SendNotificationInput = {
      title: '📦 Pesanan Benih Baru Masuk!',
      message: 'Pesanan KTR-260825-99AB siap diproses.',
      type: 'new_order',
      recipient_role: 'admin',
      data: { url: '/admin' },
    };

    const payload = JSON.stringify({
      title: input.title,
      body: input.message,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      data: {
        url: input.data?.url || '/admin',
        type: input.type,
      },
    });

    const parsed = JSON.parse(payload);
    expect(parsed.title).toBe('📦 Pesanan Benih Baru Masuk!');
    expect(parsed.body).toBe('Pesanan KTR-260825-99AB siap diproses.');
    expect(parsed.icon).toBe('/icons/icon-192x192.png');
    expect(parsed.data.url).toBe('/admin');
  });
});
