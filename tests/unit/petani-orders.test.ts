import { describe, it, expect } from 'vitest';
import type { Order, OrderStatus } from '@/types/order';

describe('Petani Orders Page Unit Tests', () => {
  const mockOrders: Order[] = [
    {
      id: 'order-1',
      order_code: 'KTR-260825-ABCD',
      user_id: 'user-1',
      customer_name: 'Bpk. Herman',
      customer_phone: '08123456789',
      shipping_address: 'Jl. Raya Pangalengan No. 45',
      shipping_city: 'Bandung',
      subtotal: 560000,
      shipping_cost: 20000,
      total_amount: 580000,
      payment_gateway: 'midtrans',
      payment_status: 'pending',
      payment_method: 'gopay',
      order_status: 'menunggu_pembayaran',
      created_at: '2026-08-25T10:00:00Z',
      updated_at: '2026-08-25T10:00:00Z',
      items: [
        {
          id: 'item-1',
          product_id: 'prod-1',
          product_name: 'Benih Kentang Granola L - G2 Pangalengan',
          product_variety: 'Granola L',
          seed_class: 'G2',
          price: 28000,
          quantity: 20,
          unit: 'kg',
          weight_kg: 20,
          subtotal: 560000,
        },
      ],
    },
    {
      id: 'order-2',
      order_code: 'KTR-260825-WXYZ',
      user_id: 'user-1',
      customer_name: 'Bpk. Herman',
      customer_phone: '08123456789',
      shipping_address: 'Jl. Raya Pangalengan No. 45',
      shipping_city: 'Bandung',
      subtotal: 380000,
      shipping_cost: 20000,
      total_amount: 400000,
      payment_gateway: 'cod',
      payment_status: 'pending',
      payment_method: 'cash',
      order_status: 'dikirim',
      courier_id: 'courier-1',
      courier_name: 'Kang Asep (Armada Logistik)',
      courier_phone: '08987654321',
      created_at: '2026-08-24T08:00:00Z',
      updated_at: '2026-08-25T09:00:00Z',
      items: [
        {
          id: 'item-2',
          product_id: 'prod-2',
          product_name: 'Benih Kentang Atlantic - G1 Industri',
          product_variety: 'Atlantic',
          seed_class: 'G1',
          price: 38000,
          quantity: 10,
          unit: 'kg',
          weight_kg: 10,
          subtotal: 380000,
        },
      ],
    },
    {
      id: 'order-3',
      order_code: 'KTR-260823-HIST',
      user_id: 'user-1',
      customer_name: 'Bpk. Herman',
      customer_phone: '08123456789',
      shipping_address: 'Jl. Raya Pangalengan No. 45',
      shipping_city: 'Bandung',
      subtotal: 280000,
      shipping_cost: 20000,
      total_amount: 300000,
      payment_gateway: 'midtrans',
      payment_status: 'settlement',
      payment_method: 'bca_va',
      order_status: 'selesai',
      created_at: '2026-08-23T08:00:00Z',
      updated_at: '2026-08-24T12:00:00Z',
      items: [
        {
          id: 'item-3',
          product_id: 'prod-1',
          product_name: 'Benih Kentang Granola L - G2 Pangalengan',
          product_variety: 'Granola L',
          seed_class: 'G2',
          price: 28000,
          quantity: 10,
          unit: 'kg',
          weight_kg: 10,
          subtotal: 280000,
        },
      ],
    },
  ];

  it('should filter orders accurately by status tab', () => {
    function filterOrdersByStatus(orders: Order[], tab: string): Order[] {
      if (tab === 'all') return orders;
      if (tab === 'diproses') {
        return orders.filter((o) => o.order_status === 'diproses' || o.order_status === 'sudah_dibayar');
      }
      return orders.filter((o) => o.order_status === tab);
    }

    const allOrders = filterOrdersByStatus(mockOrders, 'all');
    expect(allOrders).toHaveLength(3);

    const pendingOrders = filterOrdersByStatus(mockOrders, 'menunggu_pembayaran');
    expect(pendingOrders).toHaveLength(1);
    expect(pendingOrders[0].order_code).toBe('KTR-260825-ABCD');

    const inDeliveryOrders = filterOrdersByStatus(mockOrders, 'dikirim');
    expect(inDeliveryOrders).toHaveLength(1);
    expect(inDeliveryOrders[0].courier_name).toBe('Kang Asep (Armada Logistik)');

    const completedOrders = filterOrdersByStatus(mockOrders, 'selesai');
    expect(completedOrders).toHaveLength(1);
  });

  it('should search orders by code, product name, or location', () => {
    function searchOrders(orders: Order[], query: string): Order[] {
      if (!query.trim()) return orders;
      const q = query.toLowerCase();
      return orders.filter((o) => {
        const matchCode = o.order_code.toLowerCase().includes(q);
        const matchCity = o.shipping_city?.toLowerCase().includes(q);
        const matchProduct = o.items.some((item) =>
          item.product_name.toLowerCase().includes(q) ||
          item.product_variety?.toLowerCase().includes(q)
        );
        return matchCode || matchCity || matchProduct;
      });
    }

    const byCode = searchOrders(mockOrders, 'ABCD');
    expect(byCode).toHaveLength(1);

    const byProduct = searchOrders(mockOrders, 'Atlantic');
    expect(byProduct).toHaveLength(1);
    expect(byProduct[0].order_code).toBe('KTR-260825-WXYZ');

    const byVariety = searchOrders(mockOrders, 'Granola');
    expect(byVariety).toHaveLength(2);
  });

  it('should format order status labels and icons in Indonesian correctly', () => {
    function getOrderStatusMeta(status: OrderStatus | string) {
      switch (status) {
        case 'menunggu_pembayaran':
          return { label: 'Menunggu Pembayaran', badgeColor: 'amber' };
        case 'sudah_dibayar':
          return { label: 'Pembayaran Diterima', badgeColor: 'emerald' };
        case 'diproses':
          return { label: 'Sedang Dikemas', badgeColor: 'blue' };
        case 'dikirim':
          return { label: 'Sedang Dikirim', badgeColor: 'purple' };
        case 'selesai':
          return { label: 'Pesanan Selesai', badgeColor: 'emerald' };
        case 'dibatalkan':
          return { label: 'Dibatalkan', badgeColor: 'rose' };
        default:
          return { label: status, badgeColor: 'zinc' };
      }
    }

    expect(getOrderStatusMeta('menunggu_pembayaran').label).toBe('Menunggu Pembayaran');
    expect(getOrderStatusMeta('dikirim').label).toBe('Sedang Dikirim');
    expect(getOrderStatusMeta('selesai').label).toBe('Pesanan Selesai');
  });

  it('should support reordering items by converting order items into cart additions', () => {
    function getReorderPayload(order: Order) {
      return order.items.map((item) => ({
        productId: item.product_id,
        quantity: item.quantity,
      }));
    }

    const payload = getReorderPayload(mockOrders[0]);
    expect(payload).toHaveLength(1);
    expect(payload[0].productId).toBe('prod-1');
    expect(payload[0].quantity).toBe(20);
  });
});
