import { describe, it, expect } from 'vitest';
import type { Payment, AdminPaymentStats, PaymentMethodType, PaymentRecordStatus } from '@/types/payment';

describe('3. Payments System Unit Tests (Transaksi Gateway & Bayar Tunai COD)', () => {
  const mockPayments: Payment[] = [
    {
      id: 'pay-1',
      payment_code: 'PAY-260825-A1B2',
      order_id: 'order-1',
      order_code: 'KTR-260825-A1B2',
      customer_name: 'Bpk. Suryadi (Petani Wonosobo)',
      customer_phone: '081234567890',
      order_status: 'sudah_dibayar',
      amount: 1425000,
      payment_method_type: 'gateway',
      payment_method_detail: 'qris',
      payment_status: 'completed',
      paid_at: '2026-08-25T10:00:00Z',
      gateway_transaction_id: 'MID-TX-9901',
      created_at: '2026-08-25T09:55:00Z',
      updated_at: '2026-08-25T10:00:00Z',
    },
    {
      id: 'pay-2',
      payment_code: 'PAY-260825-C3D4',
      order_id: 'order-2',
      order_code: 'KTR-260825-C3D4',
      customer_name: 'Ibu Ratna (Kelompok Tani Batu)',
      customer_phone: '081987654321',
      order_status: 'menunggu_pembayaran',
      amount: 665000,
      payment_method_type: 'cash',
      payment_method_detail: 'cash_on_delivery',
      payment_status: 'pending',
      paid_at: null,
      created_at: '2026-08-25T11:00:00Z',
      updated_at: '2026-08-25T11:00:00Z',
    },
    {
      id: 'pay-3',
      payment_code: 'PAY-260825-E5F6',
      order_id: 'order-3',
      order_code: 'KTR-260825-E5F6',
      customer_name: 'Bpk. Ahmad Fauzi (Pangalengan)',
      customer_phone: '085712345678',
      order_status: 'selesai',
      amount: 850000,
      payment_method_type: 'cash',
      payment_method_detail: 'cash_on_delivery',
      payment_status: 'completed',
      paid_at: '2026-08-25T14:30:00Z',
      cash_collected_by: 'courier-uuid-1',
      collector_name: 'Kurir Ridwan',
      collector_phone: '081299881122',
      notes: 'Uang tunai pas diterima oleh kurir di lahan.',
      created_at: '2026-08-25T12:00:00Z',
      updated_at: '2026-08-25T14:30:00Z',
    },
  ];

  it('should format payment code properly from order code', () => {
    const orderCode = 'KTR-260825-7K9P';
    const paymentCode = `PAY-${orderCode.slice(4)}`;

    expect(paymentCode).toBe('PAY-260825-7K9P');
    expect(paymentCode).toMatch(/^PAY-\d{6}-[A-Z0-9]{4}$/);
  });

  it('should aggregate financial metrics for Gateway and Cash payments', () => {
    const totalPayments = mockPayments.length;
    const completedPayments = mockPayments.filter((p) =>
      ['completed', 'settlement', 'paid'].includes(p.payment_status)
    ).length;
    const pendingPayments = mockPayments.filter((p) => p.payment_status === 'pending').length;
    const failedPayments = mockPayments.filter((p) =>
      ['failed', 'expire', 'cancel', 'deny'].includes(p.payment_status)
    ).length;

    const totalRevenue = mockPayments
      .filter((p) => ['completed', 'settlement', 'paid'].includes(p.payment_status))
      .reduce((sum, p) => sum + p.amount, 0);

    const gatewayRevenue = mockPayments
      .filter(
        (p) =>
          p.payment_method_type === 'gateway' &&
          ['completed', 'settlement', 'paid'].includes(p.payment_status)
      )
      .reduce((sum, p) => sum + p.amount, 0);

    const cashRevenue = mockPayments
      .filter(
        (p) =>
          p.payment_method_type === 'cash' &&
          ['completed', 'settlement', 'paid'].includes(p.payment_status)
      )
      .reduce((sum, p) => sum + p.amount, 0);

    const gatewayPaymentsCount = mockPayments.filter((p) => p.payment_method_type === 'gateway').length;
    const cashPaymentsCount = mockPayments.filter((p) => p.payment_method_type === 'cash').length;

    const stats: AdminPaymentStats = {
      totalPayments,
      completedPayments,
      pendingPayments,
      failedPayments,
      totalRevenue,
      gatewayRevenue,
      cashRevenue,
      gatewayPaymentsCount,
      cashPaymentsCount,
    };

    expect(stats.totalPayments).toBe(3);
    expect(stats.completedPayments).toBe(2);
    expect(stats.pendingPayments).toBe(1);
    expect(stats.failedPayments).toBe(0);
    expect(stats.totalRevenue).toBe(2275000); // 1.425.000 + 850.000
    expect(stats.gatewayRevenue).toBe(1425000);
    expect(stats.cashRevenue).toBe(850000);
    expect(stats.gatewayPaymentsCount).toBe(1);
    expect(stats.cashPaymentsCount).toBe(2);
  });

  it('should correctly process Cash / COD confirmation workflow', () => {
    const pendingPayment = { ...mockPayments[1] };
    expect(pendingPayment.payment_status).toBe('pending');
    expect(pendingPayment.paid_at).toBeNull();

    // Confirm Cash Payment Action Simulation
    function confirmCashPayment(
      payment: Payment,
      collectorId: string,
      collectorName: string,
      notes?: string
    ): Payment {
      return {
        ...payment,
        payment_status: 'completed',
        paid_at: new Date().toISOString(),
        cash_collected_by: collectorId,
        collector_name: collectorName,
        notes: notes || 'Pelunasan tunai terkonfirmasi.',
      };
    }

    const settledPayment = confirmCashPayment(
      pendingPayment,
      'admin-uuid-1',
      'Administrator Kentara',
      'Uang diterima lengkap di gudang.'
    );

    expect(settledPayment.payment_status).toBe('completed');
    expect(settledPayment.paid_at).not.toBeNull();
    expect(settledPayment.cash_collected_by).toBe('admin-uuid-1');
    expect(settledPayment.notes).toBe('Uang diterima lengkap di gudang.');
  });
});
