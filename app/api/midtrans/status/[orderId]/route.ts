import { NextResponse } from 'next/server';
import {
  checkTransactionStatus,
  mapMidtransStatus,
} from '@/lib/midtrans/server';
import { checkRateLimit, getClientIp, RATE_LIMIT_PRESETS } from '@/lib/security/rate-limit';

export async function GET(
  req: Request,
  props: { params: Promise<{ orderId: string }> }
) {
  try {
    // 1. Rate Limiting Check
    const clientIp = getClientIp(req.headers);
    const rateLimit = checkRateLimit(`midtrans-status:${clientIp}`, RATE_LIMIT_PRESETS.api);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'Terlalu banyak permintaan pengecekan status.' },
        { status: 429 }
      );
    }

    const { orderId } = await props.params;

    if (!orderId || !/^[a-zA-Z0-9\-_]{3,60}$/.test(orderId)) {
      return NextResponse.json(
        { success: false, error: 'Format Order ID tidak valid.' },
        { status: 400 }
      );
    }

    const midtransStatus = (await checkTransactionStatus(orderId)) as {
      transaction_status?: string;
      fraud_status?: string;
      [key: string]: unknown;
    };

    const statusInfo = mapMidtransStatus(
      String(midtransStatus?.transaction_status || 'unknown'),
      midtransStatus?.fraud_status ? String(midtransStatus.fraud_status) : undefined
    );

    return NextResponse.json({
      success: true,
      data: {
        ...midtransStatus,
        internal_status: statusInfo.status,
        status_label: statusInfo.label,
        status_description: statusInfo.description,
      },
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Gagal memeriksa status transaksi';

    console.error(`[Midtrans Status Error]:`, errorMessage);

    return NextResponse.json(
      { success: false, error: 'Gagal memverifikasi status pembayaran.' },
      { status: 500 }
    );
  }
}
