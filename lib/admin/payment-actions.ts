'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { Payment, AdminPaymentStats, ConfirmCashPaymentResult } from '@/types/payment';

/**
 * Helper to ensure current user is authenticated as admin
 */
async function verifyAdminRole() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Autentikasi diperlukan. Silakan login kembali.');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    throw new Error('Akses ditolak. Tindakan ini hanya untuk administrator.');
  }

  return { supabase, user };
}

/**
 * Admin: Mengambil ringkasan statistik pembayaran (Gateway & Cash)
 */
export async function getAdminPaymentStats(): Promise<AdminPaymentStats> {
  try {
    const supabase = await createClient();

    const { data: rpcStats, error: rpcError } = await supabase.rpc('admin_get_payment_stats');
    if (!rpcError && rpcStats) {
      return {
        totalPayments: Number(rpcStats.totalPayments || 0),
        completedPayments: Number(rpcStats.completedPayments || 0),
        pendingPayments: Number(rpcStats.pendingPayments || 0),
        failedPayments: Number(rpcStats.failedPayments || 0),
        gatewayPaymentsCount: Number(rpcStats.gatewayPaymentsCount || 0),
        cashPaymentsCount: Number(rpcStats.cashPaymentsCount || 0),
        totalRevenue: Number(rpcStats.totalRevenue || 0),
        gatewayRevenue: Number(rpcStats.gatewayRevenue || 0),
        cashRevenue: Number(rpcStats.cashRevenue || 0),
      };
    }

    // Fallback query
    const { data: payments } = await supabase
      .from('payments')
      .select('amount, payment_method_type, payment_status');

    if (!payments || payments.length === 0) {
      return {
        totalPayments: 0,
        completedPayments: 0,
        pendingPayments: 0,
        failedPayments: 0,
        gatewayPaymentsCount: 0,
        cashPaymentsCount: 0,
        totalRevenue: 0,
        gatewayRevenue: 0,
        cashRevenue: 0,
      };
    }

    const completed = payments.filter((p) =>
      ['completed', 'settlement', 'paid', 'success'].includes(p.payment_status)
    );

    return {
      totalPayments: payments.length,
      completedPayments: completed.length,
      pendingPayments: payments.filter((p) => p.payment_status === 'pending').length,
      failedPayments: payments.filter((p) =>
        ['failed', 'expire', 'cancel', 'deny'].includes(p.payment_status)
      ).length,
      gatewayPaymentsCount: payments.filter((p) => p.payment_method_type === 'gateway').length,
      cashPaymentsCount: payments.filter((p) => p.payment_method_type === 'cash').length,
      totalRevenue: completed.reduce((sum, p) => sum + (p.amount || 0), 0),
      gatewayRevenue: completed
        .filter((p) => p.payment_method_type === 'gateway')
        .reduce((sum, p) => sum + (p.amount || 0), 0),
      cashRevenue: completed
        .filter((p) => p.payment_method_type === 'cash')
        .reduce((sum, p) => sum + (p.amount || 0), 0),
    };
  } catch (err) {
    console.error('[getAdminPaymentStats Error]:', err);
    return {
      totalPayments: 0,
      completedPayments: 0,
      pendingPayments: 0,
      failedPayments: 0,
      gatewayPaymentsCount: 0,
      cashPaymentsCount: 0,
      totalRevenue: 0,
      gatewayRevenue: 0,
      cashRevenue: 0,
    };
  }
}

/**
 * Admin: Mengambil seluruh riwayat transaksi pembayaran
 */
export async function getAdminPaymentsList(): Promise<Payment[]> {
  try {
    const supabase = await createClient();

    // 1. Try RPC function
    const { data: rpcPayments, error: rpcError } = await supabase.rpc('admin_list_payments');
    if (!rpcError && Array.isArray(rpcPayments)) {
      return rpcPayments as Payment[];
    }

    // 2. Direct fallback
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select(`
        *,
        order:orders!payments_order_id_fkey(
          order_code,
          customer_name,
          customer_phone,
          customer_email,
          order_status,
          shipping_address,
          shipping_city
        ),
        collector:profiles!payments_cash_collected_by_fkey(
          full_name,
          phone
        )
      `)
      .order('created_at', { ascending: false });

    if (paymentsError || !payments) {
      console.error('[getAdminPaymentsList Fallback Error]:', paymentsError || rpcError);
      return [];
    }

    return payments.map((p: any) => ({
      ...p,
      order_code: p.order?.order_code || '',
      customer_name: p.order?.customer_name || '',
      customer_phone: p.order?.customer_phone || '',
      customer_email: p.order?.customer_email || null,
      order_status: p.order?.order_status || '',
      shipping_address: p.order?.shipping_address || '',
      shipping_city: p.order?.shipping_city || '',
      collector_name: p.collector?.full_name || null,
      collector_phone: p.collector?.phone || null,
    })) as Payment[];
  } catch (err) {
    console.error('[getAdminPaymentsList Error]:', err);
    return [];
  }
}

/**
 * Admin: Konfirmasi Pelunasan Tunai (Cash / COD Received)
 */
export async function confirmCashPaymentAction(
  paymentId: string,
  notes?: string
): Promise<ConfirmCashPaymentResult> {
  try {
    const { supabase, user } = await verifyAdminRole();

    // 1. Fetch payment record
    const { data: payment, error: fetchErr } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (fetchErr || !payment) {
      return { success: false, error: 'Data pembayaran tidak ditemukan.' };
    }

    const now = new Date().toISOString();

    // 2. Update payment status to completed
    const { data: updatedPayment, error: updatePaymentErr } = await supabase
      .from('payments')
      .update({
        payment_status: 'completed',
        paid_at: now,
        cash_collected_by: payment.cash_collected_by || user.id,
        notes: notes?.trim() || payment.notes || 'Dikonfirmasi lunas oleh administrator.',
      })
      .eq('id', paymentId)
      .select()
      .single();

    if (updatePaymentErr || !updatedPayment) {
      return { success: false, error: updatePaymentErr?.message || 'Gagal memperbarui status pembayaran.' };
    }

    // 3. Update related order status
    // Note: Postgres trigger `tr_reduce_stock_on_paid` will automatically reduce product stock
    await supabase
      .from('orders')
      .update({
        payment_status: 'settlement',
        order_status: 'sudah_dibayar',
        paid_at: now,
      })
      .eq('id', payment.order_id);

    // 4. Fallback stock deduction safety check
    const { data: items } = await supabase
      .from('order_items')
      .select('product_id, quantity')
      .eq('order_id', payment.order_id);

    if (items && Array.isArray(items)) {
      for (const it of items) {
        if (it.product_id) {
          const { data: prod } = await supabase
            .from('products')
            .select('stock')
            .eq('id', it.product_id)
            .single();

          if (prod) {
            const nextStock = Math.max(0, (prod.stock || 0) - it.quantity);
            await supabase
              .from('products')
              .update({ stock: nextStock })
              .eq('id', it.product_id);
          }
        }
      }
    }

    revalidatePath('/admin');
    revalidatePath('/admin/payments');
    revalidatePath('/admin/orders');
    revalidatePath('/admin/products');
    revalidatePath('/petani');
    revalidatePath('/');

    return {
      success: true,
      payment: updatedPayment as Payment,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal mengonfirmasi pembayaran tunai.';
    return { success: false, error: msg };
  }
}
