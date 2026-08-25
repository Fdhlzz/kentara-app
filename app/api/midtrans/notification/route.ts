import { NextResponse } from 'next/server';
import {
  verifyMidtransSignature,
  mapMidtransStatus,
} from '@/lib/midtrans/server';
import { markOrderPaymentSuccessAction } from '@/lib/admin/order-actions';
import { sanitizeString } from '@/lib/security/validation';
import type { MidtransNotificationPayload } from '@/types/midtrans';

export async function POST(req: Request) {
  try {
    const payload: MidtransNotificationPayload = await req.json();

    const order_id = sanitizeString(payload.order_id, 60);
    const status_code = sanitizeString(payload.status_code, 10);
    const gross_amount = sanitizeString(payload.gross_amount, 30);
    const signature_key = sanitizeString(payload.signature_key, 256);
    const transaction_status = sanitizeString(payload.transaction_status, 50);
    const fraud_status = payload.fraud_status ? sanitizeString(payload.fraud_status, 50) : undefined;
    const payment_type = sanitizeString(payload.payment_type, 50);
    const transaction_id = sanitizeString(payload.transaction_id, 100);
    const transaction_time = sanitizeString(payload.transaction_time, 50);

    if (!order_id || !status_code || !gross_amount || !signature_key) {
      return NextResponse.json(
        { success: false, message: 'Payload webhook tidak lengkap.' },
        { status: 400 }
      );
    }

    // Timing-safe verification of webhook signature
    const isValidSignature = verifyMidtransSignature({
      orderId: order_id,
      statusCode: status_code,
      grossAmount: gross_amount,
      signatureKey: signature_key,
    });

    if (!isValidSignature) {
      console.warn(
        `[Midtrans Webhook] Signature tidak valid untuk Order ID: ${order_id}`
      );
      return NextResponse.json(
        { success: false, message: 'Signature tidak valid' },
        { status: 403 }
      );
    }

    // Mapping status pembayaran ke domain Kentara
    const statusInfo = mapMidtransStatus(transaction_status, fraud_status);

    console.log(
      `[Midtrans Webhook] Transaksi ${order_id} (${transaction_id}) -> ${statusInfo.status} (${statusInfo.label}). Metode: ${payment_type}, Waktu: ${transaction_time}`
    );

    // Sinkronisasi status order & pengurangan stok otomatis
    if (statusInfo.status === 'PAID') {
      await markOrderPaymentSuccessAction(order_id, {
        payment_method: payment_type,
        transaction_id,
        isWebhookVerified: true,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Notifikasi pembayaran berhasil diproses',
      data: {
        orderId: order_id,
        transactionStatus: transaction_status,
        internalStatus: statusInfo.status,
        statusLabel: statusInfo.label,
      },
    });
  } catch (error: unknown) {
    console.error('[Midtrans Webhook Error]:', error instanceof Error ? error.message : error);

    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan saat memproses webhook.' },
      { status: 500 }
    );
  }
}
