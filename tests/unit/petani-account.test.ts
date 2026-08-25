import { describe, it, expect } from 'vitest';
import type { UserProfile } from '@/types/auth';

describe('Petani Account Page Unit Tests', () => {
  const mockProfile: UserProfile = {
    id: '662936e5-70e4-428b-ba5d-df887142271c',
    full_name: 'Bpk. Herman Petani Pangalengan',
    email: 'petani@kentara.com',
    phone: '085156392978',
    role: 'petani',
    created_at: '2026-08-25T00:00:00Z',
    updated_at: '2026-08-25T00:00:00Z',
  };

  it('should format profile user info with initials and verified badge', () => {
    function getProfileDisplay(profile: UserProfile) {
      const initial = profile.full_name ? profile.full_name.charAt(0).toUpperCase() : 'P';
      const roleLabel = profile.role === 'petani' ? 'Mitra Petani Terverifikasi' : profile.role;
      return {
        initial,
        roleLabel,
        formattedPhone: profile.phone ? profile.phone.replace(/(\d{4})(\d{4})(\d+)/, '$1-$2-$3') : '-',
      };
    }

    const display = getProfileDisplay(mockProfile);
    expect(display.initial).toBe('B');
    expect(display.roleLabel).toBe('Mitra Petani Terverifikasi');
  });

  it('should calculate account order summary statistics accurately', () => {
    const mockOrders = [
      { order_status: 'dikirim' },
      { order_status: 'selesai' },
      { order_status: 'menunggu_pembayaran' },
      { order_status: 'selesai' },
    ];

    function calculateAccountStats(orders: { order_status: string }[]) {
      return {
        totalOrders: orders.length,
        activeOrders: orders.filter((o) => ['menunggu_pembayaran', 'sudah_dibayar', 'diproses', 'dikirim'].includes(o.order_status)).length,
        completedOrders: orders.filter((o) => o.order_status === 'selesai').length,
      };
    }

    const stats = calculateAccountStats(mockOrders);
    expect(stats.totalOrders).toBe(4);
    expect(stats.activeOrders).toBe(2);
    expect(stats.completedOrders).toBe(2);
  });
});
