import { NextResponse } from 'next/server';
import {
  checkTransactionStatus,
  mapMidtransStatus,
} from '@/lib/midtrans/server';

export async function GET(
  _req: Request,
  props: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await props.params;

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Order ID wajib disertakan' },
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
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
