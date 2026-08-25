'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createSnapTransaction } from '@/lib/midtrans/server';
import { sendNotificationAction } from '@/lib/notifications/notification-actions';
import type {
  Order,
  AdminOrderStats,
  CreateOrderInput,
  OrderActionResult,
  OrderStatus,
} from '@/types/order';
import type { MidtransSnapTransactionParams } from '@/types/midtrans';

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
 * Generate unique order code (e.g. KTR-260825-ABCD)
 */
function generateOrderCode(): string {
  const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `KTR-${dateStr}-${randomStr}`;
}

/**
 * Public/Petani Action: Create Order with 1 or multiple items & generate Midtrans Snap Token
 */
export async function createOrderAndGetSnapAction(
  input: CreateOrderInput
): Promise<OrderActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const {
      customer_name,
      customer_phone,
      customer_email,
      shipping_address,
      shipping_city,
      notes,
      items,
      shipping_cost = 15000,
      payment_method_type = 'gateway',
      payment_method_detail = 'midtrans',
    } = input;

    if (!customer_name?.trim()) {
      return { success: false, error: 'Nama penerima / pembeli wajib diisi.' };
    }
    if (!customer_phone?.trim() || customer_phone.length < 8) {
      return { success: false, error: 'Nomor WhatsApp / telepon wajib diisi dengan valid.' };
    }
    if (!shipping_address?.trim()) {
      return { success: false, error: 'Alamat pengiriman lengkap wajib diisi.' };
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return { success: false, error: 'Keranjang pesanan masih kosong.' };
    }

    // Calculate item subtotals and grand total
    let subtotal = 0;
    const sanitizedItems = items.map((item) => {
      const itemSubtotal = Math.round(Number(item.price)) * Math.max(1, Math.round(Number(item.quantity)));
      subtotal += itemSubtotal;
      return {
        product_id: item.product_id || null,
        product_name: item.product_name,
        product_variety: item.product_variety || null,
        seed_class: item.seed_class || null,
        price: Math.round(Number(item.price)),
        quantity: Math.max(1, Math.round(Number(item.quantity))),
        unit: item.unit || 'kg',
        weight_kg: Number(item.weight_kg || 1.0),
        subtotal: itemSubtotal,
      };
    });

    const total_amount = subtotal + Math.round(Number(shipping_cost));
    const order_code = generateOrderCode();
    const isCash = payment_method_type === 'cash';

    // 1. Insert into public.orders
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_code,
        user_id: user?.id || null,
        customer_name: customer_name.trim(),
        customer_phone: customer_phone.trim(),
        customer_email: customer_email?.trim() || null,
        shipping_address: shipping_address.trim(),
        shipping_city: shipping_city?.trim() || null,
        notes: notes?.trim() || null,
        subtotal,
        shipping_cost: Math.round(Number(shipping_cost)),
        total_amount,
        payment_gateway: isCash ? 'cash' : 'midtrans',
        payment_method: isCash ? 'cash_on_delivery' : payment_method_detail,
        payment_status: 'pending',
        order_status: 'menunggu_pembayaran',
      })
      .select()
      .single();

    if (orderError || !orderData) {
      console.error('[createOrderAndGetSnapAction Error]:', orderError);
      return { success: false, error: orderError?.message || 'Gagal membuat pesanan.' };
    }

    // 2. Insert into public.order_items
    const orderItemsToInsert = sanitizedItems.map((item) => ({
      order_id: orderData.id,
      ...item,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItemsToInsert);

    if (itemsError) {
      console.error('[createOrderItems Error]:', itemsError);
    }

    // 3. Insert into public.payments
    const payment_code = `PAY-${order_code.slice(4)}`;
    await supabase.from('payments').insert({
      payment_code,
      order_id: orderData.id,
      user_id: user?.id || null,
      amount: total_amount,
      payment_method_type: isCash ? 'cash' : 'gateway',
      payment_method_detail: isCash ? 'cash_on_delivery' : payment_method_detail,
      payment_status: 'pending',
    });

    let snapToken = '';
    let redirectUrl = '';

    // 4. If online gateway, generate Snap Token
    if (!isCash) {
      const midtransParams: MidtransSnapTransactionParams = {
        transaction_details: {
          order_id: order_code,
          gross_amount: total_amount,
        },
        item_details: [
          ...sanitizedItems.map((item) => ({
            id: String(item.product_id || item.product_name).slice(0, 50),
            price: item.price,
            quantity: item.quantity,
            name: item.product_name.slice(0, 50),
            category: 'Benih Kentang',
          })),
          {
            id: 'shipping-fee',
            price: Math.round(Number(shipping_cost)),
            quantity: 1,
            name: 'Ongkos Kirim Logistik Kentara',
            category: 'Pengiriman',
          },
        ],
        customer_details: {
          first_name: customer_name.trim(),
          phone: customer_phone.trim(),
          email: customer_email?.trim() || 'pelanggan@kentara.id',
        },
      };

      try {
        const snapRes = await createSnapTransaction(midtransParams);
        snapToken = snapRes.token;
        redirectUrl = snapRes.redirect_url;

        // Update snap token in order
        await supabase
          .from('orders')
          .update({ midtrans_snap_token: snapToken })
          .eq('id', orderData.id);
      } catch (midtransErr) {
        console.error('[Midtrans Snap Creation Error]:', midtransErr);
      }
    }

    // 5. Send Notification to Admin & Buyer
    await sendNotificationAction({
      title: '📦 Pesanan Benih Baru Masuk!',
      message: `Pesanan ${order_code} oleh ${customer_name} (${sanitizedItems.length} varietas) senilai Rp ${total_amount.toLocaleString('id-ID')} siap diproses.`,
      type: 'new_order',
      recipient_role: 'admin',
      user_id: user?.id || null,
      order_id: orderData.id,
      data: {
        order_code,
        customer_name,
        total_amount,
        payment_method_type: isCash ? 'cash' : 'gateway',
        url: '/admin',
      },
    });

    revalidatePath('/admin');
    revalidatePath('/admin/orders');
    revalidatePath('/admin/payments');

    const completeOrder: Order = {
      ...orderData,
      midtrans_snap_token: snapToken,
      items: sanitizedItems,
    };

    return {
      success: true,
      order: completeOrder,
      snapToken,
      redirectUrl,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Terjadi gangguan saat membuat pesanan.';
    console.error('[createOrderAndGetSnapAction Error]:', err);
    return { success: false, error: msg };
  }
}

/**
 * Public/Webhook Action: Mark order payment as settled / paid & ensure stock is reduced
 */
export async function markOrderPaymentSuccessAction(
  orderCode: string,
  paymentDetails?: { payment_method?: string; transaction_id?: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    // 1. Fetch order
    const { data: order, error: findError } = await supabase
      .from('orders')
      .select('id, payment_status')
      .eq('order_code', orderCode)
      .maybeSingle();

    if (findError || !order) {
      return { success: false, error: 'Pesanan tidak ditemukan.' };
    }

    // If already paid, return early
    if (['settlement', 'paid', 'capture', 'success'].includes(order.payment_status)) {
      return { success: true };
    }

    const now = new Date().toISOString();

    // 2. Update order to paid status
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        payment_status: 'settlement',
        order_status: 'sudah_dibayar',
        payment_method: paymentDetails?.payment_method || 'midtrans',
        midtrans_transaction_id: paymentDetails?.transaction_id || null,
        paid_at: now,
      })
      .eq('id', order.id);

    if (updateError) {
      console.error('[markOrderPaymentSuccessAction Error]:', updateError);
      return { success: false, error: updateError.message };
    }

    // 3. Update payment table to completed
    await supabase
      .from('payments')
      .update({
        payment_status: 'completed',
        paid_at: now,
        gateway_transaction_id: paymentDetails?.transaction_id || null,
        payment_method_detail: paymentDetails?.payment_method || 'midtrans',
      })
      .eq('order_id', order.id);

    // 3. Fallback explicit stock deduction check
    const { data: items } = await supabase
      .from('order_items')
      .select('product_id, quantity')
      .eq('order_id', order.id);

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

    // 4. Send Payment Success Notification
    await sendNotificationAction({
      title: '✅ Pembayaran Lunas & Pesanan Diproses!',
      message: `Pembayaran pesanan ${orderCode} telah berhasil dikonfirmasi. Stok benih telah dikurangi di sistem.`,
      type: 'payment_success',
      recipient_role: 'all',
      order_id: order.id,
      data: {
        order_code: orderCode,
        payment_method: paymentDetails?.payment_method || 'midtrans',
        url: '/admin',
      },
    });

    revalidatePath('/admin');
    revalidatePath('/admin/orders');
    revalidatePath('/admin/products');
    revalidatePath('/petani');
    revalidatePath('/');

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal memproses status pembayaran.';
    return { success: false, error: msg };
  }
}

/**
 * Admin: Get Order Stats
 */
export async function getAdminOrderStats(): Promise<AdminOrderStats> {
  try {
    const supabase = await createClient();

    const { data: rpcStats, error: rpcError } = await supabase.rpc('admin_get_order_stats');
    if (!rpcError && rpcStats) {
      return {
        totalOrders: Number(rpcStats.totalOrders || 0),
        pendingPaymentOrders: Number(rpcStats.pendingPaymentOrders || 0),
        paidOrders: Number(rpcStats.paidOrders || 0),
        inDeliveryOrders: Number(rpcStats.inDeliveryOrders || 0),
        completedOrders: Number(rpcStats.completedOrders || 0),
        cancelledOrders: Number(rpcStats.cancelledOrders || 0),
        totalRevenue: Number(rpcStats.totalRevenue || 0),
      };
    }

    // Fallback direct count
    const { data: orders } = await supabase
      .from('orders')
      .select('order_status, payment_status, total_amount, courier_id');

    if (!orders || orders.length === 0) {
      return {
        totalOrders: 0,
        pendingPaymentOrders: 0,
        paidOrders: 0,
        inDeliveryOrders: 0,
        completedOrders: 0,
        cancelledOrders: 0,
        totalRevenue: 0,
      };
    }

    return {
      totalOrders: orders.length,
      pendingPaymentOrders: orders.filter((o) => o.payment_status === 'pending').length,
      paidOrders: orders.filter(
        (o) => ['settlement', 'paid', 'capture', 'success'].includes(o.payment_status) && !o.courier_id
      ).length,
      inDeliveryOrders: orders.filter((o) => o.courier_id && ['diproses', 'dikirim'].includes(o.order_status)).length,
      completedOrders: orders.filter((o) => o.order_status === 'selesai').length,
      cancelledOrders: orders.filter((o) => o.order_status === 'dibatalkan').length,
      totalRevenue: orders
        .filter((o) => ['settlement', 'paid', 'capture', 'success'].includes(o.payment_status))
        .reduce((sum, o) => sum + (o.total_amount || 0), 0),
    };
  } catch (err) {
    console.error('[getAdminOrderStats Error]:', err);
    return {
      totalOrders: 0,
      pendingPaymentOrders: 0,
      paidOrders: 0,
      inDeliveryOrders: 0,
      completedOrders: 0,
      cancelledOrders: 0,
      totalRevenue: 0,
    };
  }
}

/**
 * Admin: Get List of All Orders with joined items and courier name
 */
export async function getAdminOrdersList(): Promise<Order[]> {
  try {
    const supabase = await createClient();

    // 1. Try RPC function first
    const { data: rpcOrders, error: rpcError } = await supabase.rpc('admin_list_orders');
    if (!rpcError && Array.isArray(rpcOrders)) {
      return rpcOrders as Order[];
    }

    // 2. Direct fallback
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        *,
        courier:profiles!orders_courier_id_fkey(full_name, phone),
        items:order_items(*)
      `)
      .order('created_at', { ascending: false });

    if (ordersError || !orders) {
      console.error('[getAdminOrdersList Direct Fallback Error]:', ordersError || rpcError);
      return [];
    }

    return orders.map((o: any) => ({
      ...o,
      courier_name: o.courier?.full_name || null,
      courier_phone: o.courier?.phone || null,
      items: o.items || [],
    })) as Order[];
  } catch (err) {
    console.error('[getAdminOrdersList Error]:', err);
    return [];
  }
}

/**
 * Admin Action: Assign Courier to an Order
 */
export async function assignCourierToOrderAction(
  orderId: string,
  courierId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { supabase } = await verifyAdminRole();

    if (!orderId) {
      return { success: false, error: 'ID pesanan tidak valid.' };
    }
    if (!courierId) {
      return { success: false, error: 'Silakan pilih mitra kurir.' };
    }

    // Verify courier exists
    const { data: courierProfile, error: courierErr } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .eq('id', courierId)
      .single();

    if (courierErr || !courierProfile || courierProfile.role !== 'kurir') {
      return { success: false, error: 'Akun kurir yang dipilih tidak valid.' };
    }

    // Update order with courier
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        courier_id: courierId,
        courier_assigned_at: new Date().toISOString(),
        order_status: 'diproses',
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('[assignCourierToOrderAction Error]:', updateError);
      return { success: false, error: updateError.message };
    }

    // Fetch order details for notification
    const { data: orderObj } = await supabase
      .from('orders')
      .select('order_code, customer_name, customer_phone, shipping_address, shipping_city')
      .eq('id', orderId)
      .single();

    // Send Notification to Courier
    await sendNotificationAction({
      title: '🚚 Tugas Pengantaran Benih Baru!',
      message: `Anda ditugaskan mengantar pesanan ${orderObj?.order_code || ''} ke ${orderObj?.customer_name || 'Pembeli'} (${orderObj?.shipping_city || orderObj?.shipping_address || ''}).`,
      type: 'courier_task',
      recipient_role: 'kurir',
      user_id: courierId,
      order_id: orderId,
      data: {
        order_code: orderObj?.order_code,
        customer_name: orderObj?.customer_name,
        customer_phone: orderObj?.customer_phone,
        shipping_address: orderObj?.shipping_address,
        url: '/kurir',
      },
    });

    revalidatePath('/admin');
    revalidatePath('/admin/orders');
    revalidatePath('/kurir');
    revalidatePath('/petani');

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal menugaskan kurir ke pesanan.';
    return { success: false, error: msg };
  }
}

/**
 * Admin Action: Update Order Status
 */
export async function updateOrderStatusAction(
  orderId: string,
  newStatus: OrderStatus
): Promise<{ success: boolean; error?: string }> {
  try {
    const { supabase } = await verifyAdminRole();

    const { error } = await supabase
      .from('orders')
      .update({ order_status: newStatus })
      .eq('id', orderId);

    if (error) {
      return { success: false, error: error.message };
    }

    // Fetch order info
    const { data: orderObj } = await supabase
      .from('orders')
      .select('order_code, customer_name, user_id')
      .eq('id', orderId)
      .single();

    if (newStatus === 'selesai') {
      await sendNotificationAction({
        title: '🎉 Pesanan Benih Berhasil Diterima!',
        message: `Pesanan ${orderObj?.order_code || ''} telah sukses diantarkan dan diterima di lahan pembeli.`,
        type: 'order_delivered',
        recipient_role: 'all',
        user_id: orderObj?.user_id || null,
        order_id: orderId,
        data: {
          order_code: orderObj?.order_code,
          url: '/petani',
        },
      });
    }

    revalidatePath('/admin');
    revalidatePath('/admin/orders');
    revalidatePath('/kurir');
    revalidatePath('/petani');

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal memperbarui status pesanan.';
    return { success: false, error: msg };
  }
}

/**
 * Admin Action: Delete Order
 */
export async function deleteOrderAction(
  orderId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { supabase } = await verifyAdminRole();

    const { error } = await supabase.from('orders').delete().eq('id', orderId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/admin');
    revalidatePath('/admin/orders');

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal menghapus pesanan.';
    return { success: false, error: msg };
  }
}
