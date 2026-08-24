import crypto from 'crypto';
import midtransClient from 'midtrans-client';
import type {
  MidtransNotificationPayload,
  MidtransSnapResponse,
  MidtransSnapTransactionParams,
  PaymentStatusInfo,
} from '@/types/midtrans';

/**
 * Midtrans configuration from environment variables
 */
export function getMidtransConfig() {
  const serverKey =
    process.env.MIDTRANS_SERVER_KEY ||
    process.env.MIDTRANS_SERVERKEY ||
    process.env.SERVER_KEY ||
    '';

  const clientKey =
    process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ||
    process.env.MIDTRANS_CLIENT_KEY ||
    process.env.NEXT_PUBLIC_CLIENT_KEY ||
    '';

  const isProduction =
    process.env.MIDTRANS_IS_PRODUCTION === 'true' ||
    process.env.MIDTRANS_ENVIRONMENT === 'production';

  const merchantId =
    process.env.MIDTRANS_MERCHANT_ID || process.env.MERCHANT_ID || '';

  return {
    serverKey,
    clientKey,
    isProduction,
    merchantId,
    snapJsUrl: isProduction
      ? 'https://app.midtrans.com/snap/snap.js'
      : 'https://app.sandbox.midtrans.com/snap/snap.js',
  };
}

/**
 * Initialize Midtrans Snap instance
 */
export function getMidtransSnap() {
  const { serverKey, clientKey, isProduction } = getMidtransConfig();

  if (!serverKey) {
    throw new Error('MIDTRANS_SERVER_KEY is not configured in environment variables');
  }

  return new midtransClient.Snap({
    isProduction,
    serverKey,
    clientKey,
  });
}

/**
 * Initialize Midtrans CoreApi instance
 */
export function getMidtransCoreApi() {
  const { serverKey, clientKey, isProduction } = getMidtransConfig();

  if (!serverKey) {
    throw new Error('MIDTRANS_SERVER_KEY is not configured in environment variables');
  }

  return new midtransClient.CoreApi({
    isProduction,
    serverKey,
    clientKey,
  });
}

/**
 * Create a new Snap transaction and return snap token + redirect URL
 */
export async function createSnapTransaction(
  params: MidtransSnapTransactionParams
): Promise<MidtransSnapResponse> {
  const snap = getMidtransSnap();
  const response = await snap.createTransaction(params);

  return {
    token: response.token,
    redirect_url: response.redirect_url,
  };
}

/**
 * Verify webhook notification signature from Midtrans
 * Formula: SHA512(order_id + status_code + gross_amount + ServerKey)
 */
export function verifyMidtransSignature(params: {
  orderId: string;
  statusCode: string;
  grossAmount: string;
  signatureKey: string;
}): boolean {
  const { serverKey } = getMidtransConfig();
  if (!serverKey) return false;

  const payload = `${params.orderId}${params.statusCode}${params.grossAmount}${serverKey}`;
  const calculatedSignature = crypto
    .createHash('sha512')
    .update(payload)
    .digest('hex');

  return calculatedSignature.toLowerCase() === params.signatureKey.toLowerCase();
}

/**
 * Check transaction status from Midtrans Core API
 */
export async function checkTransactionStatus(orderId: string) {
  const core = getMidtransCoreApi();
  const statusResponse = await core.transaction.status(orderId);
  return statusResponse;
}

/**
 * Map Midtrans transaction status to internal status
 */
export function mapMidtransStatus(
  transactionStatus: MidtransNotificationPayload['transaction_status'] | string,
  fraudStatus?: string
): PaymentStatusInfo {
  if (transactionStatus === 'capture') {
    if (fraudStatus === 'challenge') {
      return {
        status: 'CHALLENGE',
        label: 'Menunggu Verifikasi',
        description: 'Transaksi terdeteksi memerlukan verifikasi keamanan tambahan.',
        color: 'warning',
      };
    } else if (fraudStatus === 'accept') {
      return {
        status: 'PAID',
        label: 'Pembayaran Berhasil',
        description: 'Pembayaran telah berhasil diterima dan dikonfirmasi.',
        color: 'success',
      };
    }
  }

  if (transactionStatus === 'settlement') {
    return {
      status: 'PAID',
      label: 'Pembayaran Berhasil',
      description: 'Dana pembayaran telah sukses diterima.',
      color: 'success',
    };
  }

  if (transactionStatus === 'pending') {
    return {
      status: 'PENDING',
      label: 'Menunggu Pembayaran',
      description: 'Menunggu pembayaran diselesaikan oleh pembeli.',
      color: 'warning',
    };
  }

  if (transactionStatus === 'deny') {
    return {
      status: 'FAILED',
      label: 'Pembayaran Ditolak',
      description: 'Transaksi pembayaran ditolak oleh sistem atau penyedia pembayaran.',
      color: 'destructive',
    };
  }

  if (transactionStatus === 'expire') {
    return {
      status: 'EXPIRED',
      label: 'Pembayaran Kadaluwarsa',
      description: 'Batas waktu pembayaran telah berakhir.',
      color: 'destructive',
    };
  }

  if (transactionStatus === 'cancel') {
    return {
      status: 'CANCELLED',
      label: 'Pesanan Dibatalkan',
      description: 'Transaksi pesanan telah dibatalkan.',
      color: 'secondary',
    };
  }

  if (transactionStatus === 'refund' || transactionStatus === 'partial_refund') {
    return {
      status: 'REFUNDED',
      label: 'Dana Dikembalikan',
      description: 'Pengembalian dana (refund) telah diproses.',
      color: 'secondary',
    };
  }

  return {
    status: 'UNKNOWN',
    label: 'Status Tidak Dikenal',
    description: 'Status transaksi belum dapat diidentifikasi.',
    color: 'default',
  };
}
