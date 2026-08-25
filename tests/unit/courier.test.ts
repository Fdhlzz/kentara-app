import { describe, it, expect } from 'vitest';
import type { Order } from '@/types/order';
import type { CourierUser } from '@/lib/admin/courier-actions';

describe('4. Courier Management & Mobile UX Unit Tests (Aplikasi Kurir)', () => {
  const mockCourier: CourierUser = {
    id: 'kurir-1',
    email: 'kurir.ridwan@kentara.id',
    full_name: 'Ridwan Saputra',
    phone: '081299881122',
    role: 'kurir',
    created_at: '2026-08-25T00:00:00Z',
    updated_at: '2026-08-25T00:00:00Z',
  };

  const mockAssignedOrder: Order = {
    id: 'order-uuid-201',
    order_code: 'KTR-260825-88XX',
    customer_name: 'Bpk. Herman (Kelompok Tani Lembang)',
    customer_phone: '08123456789',
    shipping_address: 'Jl. Maribaya No. 45, Lembang',
    shipping_city: 'Kab. Bandung Barat',
    subtotal: 1400000,
    shipping_cost: 25000,
    total_amount: 1425000,
    payment_gateway: 'cash',
    payment_status: 'pending',
    order_status: 'diproses',
    courier_id: 'kurir-1',
    courier_name: 'Ridwan Saputra',
    courier_phone: '081299881122',
    courier_assigned_at: '2026-08-25T08:00:00Z',
    created_at: '2026-08-25T07:30:00Z',
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

  // Helper Haversine Distance (in meters)
  function calculateDistanceMeters(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3; // metres
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(R * c);
  }

  function isNearbyCustomer(
    courierCoords: [number, number],
    customerCoords: [number, number],
    thresholdMeters = 500
  ): boolean {
    const dist = calculateDistanceMeters(
      courierCoords[0],
      courierCoords[1],
      customerCoords[0],
      customerCoords[1]
    );
    return dist <= thresholdMeters;
  }

  it('should transition order from diproses to dikirim on Swipe to Start Delivery', () => {
    function startDelivery(order: Order): Order {
      if (order.order_status !== 'diproses') {
        throw new Error('Hanya pesanan berstatus diproses yang dapat dimulai pengantarannya.');
      }
      return {
        ...order,
        order_status: 'dikirim',
        updated_at: new Date().toISOString(),
      };
    }

    const inTransitOrder = startDelivery(mockAssignedOrder);
    expect(inTransitOrder.order_status).toBe('dikirim');
  });

  it('should accurately detect when courier is within proximity of the customer coordinate', () => {
    const customerCoords: [number, number] = [-6.81234, 107.6189]; // Lembang Farm
    const nearbyCourier: [number, number] = [-6.8125, 107.619]; // ~25m away
    const farCourier: [number, number] = [-6.85, 107.6]; // ~4.5km away

    expect(isNearbyCustomer(nearbyCourier, customerCoords, 300)).toBe(true);
    expect(isNearbyCustomer(farCourier, customerCoords, 300)).toBe(false);
  });

  it('should require cash confirmation before completing Cash on Delivery (COD) order', () => {
    function completeDelivery(
      order: Order,
      courierId: string,
      options: { cashPaidConfirmed?: boolean; cashNotes?: string }
    ) {
      if (order.payment_gateway === 'cash' && !options.cashPaidConfirmed) {
        return {
          success: false,
          requiresCashConfirmation: true,
          error: 'Mohon konfirmasi penerimaan uang tunai (COD) dari pembeli.',
        };
      }

      return {
        success: true,
        order: {
          ...order,
          order_status: 'selesai',
          payment_status: 'settlement',
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        paymentUpdate: {
          payment_status: 'completed',
          cash_collected_by: courierId,
          notes: options.cashNotes || 'Pelunasan tunai COD diverifikasi oleh kurir saat serah terima.',
        },
      };
    }

    // Attempt without confirming cash
    const failedAttempt = completeDelivery(mockAssignedOrder, 'kurir-1', {
      cashPaidConfirmed: false,
    });
    expect(failedAttempt.success).toBe(false);
    expect(failedAttempt.requiresCashConfirmation).toBe(true);

    // Attempt with confirmed cash
    const successAttempt = completeDelivery(mockAssignedOrder, 'kurir-1', {
      cashPaidConfirmed: true,
      cashNotes: 'Uang pas Rp 1.425.000 telah diterima kurir.',
    });
    expect(successAttempt.success).toBe(true);
    expect(successAttempt.order?.order_status).toBe('selesai');
    expect(successAttempt.paymentUpdate?.payment_status).toBe('completed');
    expect(successAttempt.paymentUpdate?.cash_collected_by).toBe('kurir-1');
  });

  it('should aggregate courier completed jobs and total cash collected', () => {
    const courierJobsHistory: Order[] = [
      {
        ...mockAssignedOrder,
        id: 'ord-1',
        order_status: 'selesai',
        payment_gateway: 'cash',
        total_amount: 500000,
      },
      {
        ...mockAssignedOrder,
        id: 'ord-2',
        order_status: 'selesai',
        payment_gateway: 'midtrans',
        total_amount: 800000,
      },
      {
        ...mockAssignedOrder,
        id: 'ord-3',
        order_status: 'selesai',
        payment_gateway: 'cash',
        total_amount: 750000,
      },
      {
        ...mockAssignedOrder,
        id: 'ord-4',
        order_status: 'dikirim', // still in progress
        payment_gateway: 'cash',
        total_amount: 300000,
      },
    ];

    const completedJobs = courierJobsHistory.filter((j) => j.order_status === 'selesai');
    const totalCashCollected = completedJobs
      .filter((j) => j.payment_gateway === 'cash')
      .reduce((sum, j) => sum + j.total_amount, 0);

    expect(completedJobs).toHaveLength(3);
    expect(totalCashCollected).toBe(1250000); // 500.000 + 750.000
  });
});
