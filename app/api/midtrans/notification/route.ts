import { NextResponse } from 'next/server';
import {
  verifyMidtransSignature,
  mapMidtransStatus,
} from '@/lib/midtrans/server';
import { markOrderPaymentSuccessAction } from '@/lib/admin/order-actions';
import type { MidtransNotificationPayload } from '@/types/midtrans';

export async function POST(req: Request) {
  try {
    const payload: MidtransNotificationPayload = await req.json();

    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      fraud_status,
      payment_type,
      transaction_id,
      transaction_time,
    } = payload;

    // Verifikasi keaslian webhook dari Midtrans via Signature Key SHA512
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
    const errorMessage =
      error instanceof Error ? error.message : 'Kesalahan internal webhook';
    console.error('[Midtrans Webhook Error]:', errorMessage);

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
