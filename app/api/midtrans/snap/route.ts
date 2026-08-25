import { NextResponse } from 'next/server';
import { createSnapTransaction } from '@/lib/midtrans/server';
import { sanitizeString, validatePositiveNumber, validateEmail, validatePhone } from '@/lib/security/validation';
import { checkRateLimit, getClientIp, RATE_LIMIT_PRESETS } from '@/lib/security/rate-limit';
import type { MidtransSnapTransactionParams } from '@/types/midtrans';

export async function POST(req: Request) {
  try {
    // 1. Rate Limiting Check
    const clientIp = getClientIp(req.headers);
    const rateLimit = checkRateLimit(`snap:${clientIp}`, RATE_LIMIT_PRESETS.checkout);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'Terlalu banyak permintaan pembuatan pembayaran. Mohon tunggu 1 menit.' },
        { status: 429 }
      );
    }

    const body = await req.json();

    const {
      orderId,
      grossAmount,
      items,
      customer,
      customExpiry,
      enabledPayments,
    } = body;

    let calculatedAmount = grossAmount;
    if (!calculatedAmount && Array.isArray(items) && items.length > 0) {
      calculatedAmount = items.reduce(
        (sum: number, item: { price: number; quantity: number }) =>
          sum + Math.round(Number(item.price || 0)) * Math.max(1, Math.round(Number(item.quantity || 1))),
        0
      );
    }

    const amountValidation = validatePositiveNumber(calculatedAmount, 1, 1_000_000_000);
    if (!amountValidation.valid || !amountValidation.value) {
      return NextResponse.json(
        {
          success: false,
          error: 'Total pembayaran (grossAmount) tidak valid.',
        },
        { status: 400 }
      );
    }

    const cleanRawOrderId = typeof orderId === 'string' ? orderId : '';
    const generatedOrderId = (
      cleanRawOrderId ||
      `KTR-${Date.now().toString().slice(-8)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`
    )
      .replace(/[^a-zA-Z0-9-_]/g, '-')
      .slice(0, 50);

    const snapParams: MidtransSnapTransactionParams = {
      transaction_details: {
        order_id: generatedOrderId,
        gross_amount: Math.round(amountValidation.value),
      },
    };

    if (items && Array.isArray(items) && items.length > 0) {
      if (items.length > 50) {
        return NextResponse.json(
          { success: false, error: 'Maksimal 50 item per transaksi.' },
          { status: 400 }
        );
      }

      snapParams.item_details = items.map((item) => ({
        id: sanitizeString(item.id || item.name, 50),
        price: Math.max(0, Math.min(100_000_000, Math.round(Number(item.price || 0)))),
        quantity: Math.max(1, Math.min(10_000, Math.round(Number(item.quantity || 1)))),
        name: sanitizeString(item.name || 'Produk Benih', 50),
        category: item.category ? sanitizeString(item.category, 50) : undefined,
      }));

      const itemSum = snapParams.item_details.reduce(
        (acc, it) => acc + it.price * it.quantity,
        0
      );
      snapParams.transaction_details.gross_amount = itemSum;
    }

    if (customer && typeof customer === 'object') {
      const emailCheck = validateEmail(customer.email);
      const phoneCheck = validatePhone(customer.phone);

      snapParams.customer_details = {
        first_name: sanitizeString(customer.first_name || customer.name || 'Pelanggan Kentara', 50),
        email: emailCheck.valid && emailCheck.sanitized ? emailCheck.sanitized : 'pelanggan@kentara.id',
        phone: phoneCheck.valid && phoneCheck.formatted ? phoneCheck.formatted : '081234567890',
      };
    }

    if (enabledPayments && Array.isArray(enabledPayments) && enabledPayments.length > 0) {
      snapParams.enabled_payments = enabledPayments.map((p) => sanitizeString(p, 30));
    }

    if (customExpiry && typeof customExpiry === 'object') {
      snapParams.expiry = customExpiry;
    }

    const snapResponse = await createSnapTransaction(snapParams);

    return NextResponse.json({
      success: true,
      orderId: generatedOrderId,
      token: snapResponse.token,
      redirect_url: snapResponse.redirect_url,
    });
  } catch (error: unknown) {
    const err = error as { ApiResponse?: { error_messages?: string[] }; message?: string };
    const errorDetails =
      err?.ApiResponse?.error_messages?.join(', ') ||
      err?.message ||
      'Terjadi kesalahan pada sistem pembayaran';

    console.error('[Midtrans Snap API Error]:', errorDetails);

    return NextResponse.json(
      {
        success: false,
        error: 'Gagal membuat sesi pembayaran transaksi.',
      },
      { status: 500 }
    );
  }
}
