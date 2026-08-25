import { describe, it, expect } from 'vitest';
import type { Order } from '@/types/order';
import type { CourierUser } from '@/lib/admin/courier-actions';

describe('4. Courier Assignment & Logistics Unit Tests (Penugasan Kurir)', () => {
  const mockCouriers: CourierUser[] = [
    {
      id: 'kurir-1',
      email: 'kurir.ridwan@kentara.id',
      full_name: 'Ridwan Saputra',
      phone: '081299881122',
      role: 'kurir',
      created_at: '2026-08-25T00:00:00Z',
      updated_at: '2026-08-25T00:00:00Z',
    },
    {
      id: 'kurir-2',
      email: 'kurir.budi@kentara.id',
      full_name: 'Budi Santoso',
      phone: '081377889900',
      role: 'kurir',
      created_at: '2026-08-25T01:00:00Z',
      updated_at: '2026-08-25T01:00:00Z',
    },
  ];

  const initialOrder: Order = {
    id: 'order-uuid-101',
    order_code: 'KTR-260825-99AB',
    customer_name: 'Bpk. Herman (Kelompok Tani Lembang)',
    customer_phone: '08123456789',
    shipping_address: 'Jl. Maribaya No. 45, Lembang',
    shipping_city: 'Kab. Bandung Barat',
    subtotal: 1400000,
    shipping_cost: 25000,
    total_amount: 1425000,
    payment_gateway: 'midtrans',
    payment_status: 'settlement',
    order_status: 'sudah_dibayar',
    courier_id: null,
    courier_assigned_at: null,
    created_at: '2026-08-25T08:00:00Z',
    updated_at: '2026-08-25T08:00:00Z',
    items: [
      {
        id: 'item-1',
        product_name: 'Benih Kentang Granola L - G2 Pangalengan',
        quantity: 50,
        price: 28000,
        unit: 'kg',
        weight_kg: 50.0,
        subtotal: 1400000,
      },
    ],
  };

  it('should validate courier selection before assignment', () => {
    const validateAssignment = (orderId?: string, courierId?: string) => {
      if (!orderId) return { success: false, error: 'ID pesanan wajib diisi.' };
      if (!courierId) return { success: false, error: 'Silakan pilih mitra kurir.' };
      const courierExists = mockCouriers.some((c) => c.id === courierId);
      if (!courierExists) return { success: false, error: 'Akun kurir tidak ditemukan.' };
      return { success: true };
    };

    expect(validateAssignment('order-1', 'kurir-1').success).toBe(true);
    expect(validateAssignment('', 'kurir-1').success).toBe(false);
    expect(validateAssignment('order-1', '').success).toBe(false);
    expect(validateAssignment('order-1', 'invalid-id').success).toBe(false);
  });

  it('should transition order to diproses and bind courier info upon assignment', () => {
    function assignCourier(order: Order, courier: CourierUser): Order {
      const now = new Date().toISOString();
      return {
        ...order,
        courier_id: courier.id,
        courier_name: courier.full_name,
        courier_phone: courier.phone,
        courier_assigned_at: now,
        order_status: 'diproses',
      };
    }

    const assignedOrder = assignCourier(initialOrder, mockCouriers[0]);

    expect(assignedOrder.courier_id).toBe('kurir-1');
    expect(assignedOrder.courier_name).toBe('Ridwan Saputra');
    expect(assignedOrder.courier_phone).toBe('081299881122');
    expect(assignedOrder.order_status).toBe('diproses');
    expect(assignedOrder.courier_assigned_at).not.toBeNull();
  });

  it('should correctly filter tasks assigned to a specific courier', () => {
    const ordersList: Order[] = [
      { ...initialOrder, id: 'ord-1', courier_id: 'kurir-1', order_status: 'diproses' },
      { ...initialOrder, id: 'ord-2', courier_id: 'kurir-2', order_status: 'diproses' },
      { ...initialOrder, id: 'ord-3', courier_id: 'kurir-1', order_status: 'selesai' },
    ];

    const getCourierTasks = (courierId: string) => {
      return ordersList.filter((o) => o.courier_id === courierId);
    };

    const ridwanTasks = getCourierTasks('kurir-1');
    expect(ridwanTasks).toHaveLength(2);
    expect(ridwanTasks.filter((t) => t.order_status !== 'selesai')).toHaveLength(1);
  });
});
