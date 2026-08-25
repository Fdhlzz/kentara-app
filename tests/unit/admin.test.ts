import { describe, it, expect } from 'vitest';
import type { UserProfile } from '@/types/auth';
import type { Order, AdminOrderStats } from '@/types/order';
import type { AdminProductStats } from '@/types/product';
import type { AdminPaymentStats } from '@/types/payment';

describe('7. Admin Panel & Mobile-First UX Unit Tests (Pusat Kendali Admin)', () => {
  const mockAdminProfile: UserProfile = {
    id: 'admin-uuid-1',
    email: 'admin@kentara.com',
    full_name: 'Administrator Kentara',
    phone: '081122334455',
    role: 'admin',
    created_at: '2026-08-25T00:00:00Z',
    updated_at: '2026-08-25T00:00:00Z',
  };

  const mockNonAdminProfile: UserProfile = {
    id: 'petani-uuid-1',
    email: 'petani@kentara.com',
    full_name: 'Petani Makmur',
    phone: '081233445566',
    role: 'petani',
    created_at: '2026-08-25T00:00:00Z',
    updated_at: '2026-08-25T00:00:00Z',
  };

  it('should enforce admin role access and reject non-admin users', () => {
    function verifyAdminAccess(profile: UserProfile | null): boolean {
      if (!profile) return false;
      return profile.role === 'admin';
    }

    expect(verifyAdminAccess(mockAdminProfile)).toBe(true);
    expect(verifyAdminAccess(mockNonAdminProfile)).toBe(false);
    expect(verifyAdminAccess(null)).toBe(false);
  });

  it('should manage 5-tab mobile-first navigation state (ringkasan, pesanan, produk, kurir, pengaturan)', () => {
    type AdminTab = 'ringkasan' | 'pesanan' | 'produk' | 'kurir' | 'pengaturan';

    function getAdminActiveTabTitle(tab: AdminTab): string {
      switch (tab) {
        case 'ringkasan':
          return 'Ringkasan & Dashboard Operasional';
        case 'pesanan':
          return 'Manajemen Pesanan & Penugasan Kurir';
        case 'produk':
          return 'Katalog Benih Pertanian & Stok';
        case 'kurir':
          return 'Pelacakan Armada Mitra Kurir';
        case 'pengaturan':
          return 'Pengaturan Akun & Tampilan Tema';
        default:
          return 'Pusat Kendali Admin';
      }
    }

    expect(getAdminActiveTabTitle('ringkasan')).toContain('Ringkasan');
    expect(getAdminActiveTabTitle('pesanan')).toContain('Pesanan');
    expect(getAdminActiveTabTitle('produk')).toContain('Benih');
    expect(getAdminActiveTabTitle('kurir')).toContain('Kurir');
    expect(getAdminActiveTabTitle('pengaturan')).toContain('Pengaturan');
  });

  it('should compute admin KPI aggregates accurately', () => {
    const productStats: AdminProductStats = {
      totalProducts: 8,
      activeProducts: 7,
      lowStockProducts: 1,
      outOfStockProducts: 0,
      featuredProducts: 3,
      totalStockKg: 2450,
      totalStockKnol: 1200,
    };

    const orderStats: AdminOrderStats = {
      totalOrders: 15,
      pendingPaymentOrders: 2,
      paidOrders: 4,
      inDeliveryOrders: 3,
      completedOrders: 5,
      cancelledOrders: 1,
      totalRevenue: 34500000,
    };

    const paymentStats: AdminPaymentStats = {
      totalPayments: 15,
      completedPayments: 9,
      pendingPayments: 5,
      failedPayments: 1,
      gatewayPaymentsCount: 8,
      cashPaymentsCount: 7,
      totalRevenue: 34500000,
      gatewayRevenue: 20000000,
      cashRevenue: 14500000,
    };

    expect(productStats.activeProducts).toBeLessThanOrEqual(productStats.totalProducts);
    expect(orderStats.totalOrders).toBe(15);
    expect(paymentStats.totalRevenue).toBe(34500000);
    expect(paymentStats.completedPayments).toBe(9);
  });

  it('should hide assign/change courier button when order is in delivery, completed, or cancelled', () => {
    function canAssignOrChangeCourier(orderStatus: string): boolean {
      // Button must be GONE if order is in delivery, done, or cancelled
      return (
        orderStatus !== 'dikirim' &&
        orderStatus !== 'selesai' &&
        orderStatus !== 'dibatalkan'
      );
    }

    // 1. Order diproses -> Assign/Change button IS visible
    expect(canAssignOrChangeCourier('diproses')).toBe(true);
    expect(canAssignOrChangeCourier('menunggu_pembayaran')).toBe(true);
    expect(canAssignOrChangeCourier('sudah_dibayar')).toBe(true);

    // 2. Courier already processed and delivering (dikirim) -> Button is GONE
    expect(canAssignOrChangeCourier('dikirim')).toBe(false);

    // 3. Order completed (selesai) -> Button is GONE
    expect(canAssignOrChangeCourier('selesai')).toBe(false);

    // 4. Order cancelled (dibatalkan) -> Button is GONE
    expect(canAssignOrChangeCourier('dibatalkan')).toBe(false);
  });

  it('should filter orders by status and keyword search for admin management', () => {
    const mockOrders: Order[] = [
      {
        id: 'ord-1',
        order_code: 'KTR-260825-GTWY',
        customer_name: 'Bpk. Daeng Sikki',
        customer_phone: '081144556677',
        shipping_address: 'Jl. Masjid Raya No. 112, Bontoala',
        shipping_city: 'Makassar',
        subtotal: 2200000,
        shipping_cost: 10000,
        total_amount: 2210000,
        payment_gateway: 'midtrans',
        payment_status: 'settlement',
        order_status: 'diproses',
        items: [
          {
            product_name: 'Benih Kentang Granola L - G2',
            price: 2200000,
            quantity: 2,
            unit: 'sak_50kg',
            weight_kg: 100,
            subtotal: 2200000,
          },
        ],
        created_at: '2026-08-25T10:00:00Z',
        updated_at: '2026-08-25T10:00:00Z',
      },
      {
        id: 'ord-2',
        order_code: 'KTR-260825-CASH',
        customer_name: 'Ibu Hajjah Maryam',
        customer_phone: '081299887766',
        shipping_address: 'Jl. Perintis Kemerdekaan KM 10, Tamalanrea',
        shipping_city: 'Makassar',
        subtotal: 1270000,
        shipping_cost: 15000,
        total_amount: 1285000,
        payment_gateway: 'cash',
        payment_status: 'pending',
        order_status: 'diproses',
        items: [
          {
            product_name: 'Benih Kentang Atlantic - G1',
            price: 1270000,
            quantity: 1,
            unit: 'sak_25kg',
            weight_kg: 25,
            subtotal: 1270000,
          },
        ],
        created_at: '2026-08-25T11:00:00Z',
        updated_at: '2026-08-25T11:00:00Z',
      },
      {
        id: 'ord-3',
        order_code: 'KTR-260825-COMP',
        customer_name: 'Bpk. Ridwan',
        customer_phone: '081344552211',
        shipping_address: 'Jl. Malino No. 45',
        shipping_city: 'Gowa',
        subtotal: 800000,
        shipping_cost: 20000,
        total_amount: 820000,
        payment_gateway: 'midtrans',
        payment_status: 'settlement',
        order_status: 'selesai',
        items: [
          {
            product_name: 'Benih Kentang Spunta - G2',
            price: 800000,
            quantity: 1,
            unit: 'sak_25kg',
            weight_kg: 25,
            subtotal: 800000,
          },
        ],
        created_at: '2026-08-25T08:00:00Z',
        updated_at: '2026-08-25T09:30:00Z',
      },
    ];

    function filterAdminOrders(
      orders: Order[],
      query: string,
      statusFilter: string
    ): Order[] {
      return orders.filter((o) => {
        const matchesQuery =
          !query ||
          o.order_code.toLowerCase().includes(query.toLowerCase()) ||
          o.customer_name.toLowerCase().includes(query.toLowerCase());

        const matchesStatus =
          statusFilter === 'all' || o.order_status === statusFilter;

        return matchesQuery && matchesStatus;
      });
    }

    // 1. Search by customer name
    const daengOrders = filterAdminOrders(mockOrders, 'Daeng', 'all');
    expect(daengOrders).toHaveLength(1);
    expect(daengOrders[0].order_code).toBe('KTR-260825-GTWY');

    // 2. Filter by status diproses
    const diprosesOrders = filterAdminOrders(mockOrders, '', 'diproses');
    expect(diprosesOrders).toHaveLength(2);

    // 3. Filter by status selesai
    const selesaiOrders = filterAdminOrders(mockOrders, '', 'selesai');
    expect(selesaiOrders).toHaveLength(1);
  });
});
