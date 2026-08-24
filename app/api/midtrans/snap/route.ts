import { NextResponse } from 'next/server';
import { createSnapTransaction } from '@/lib/midtrans/server';
import type { MidtransSnapTransactionParams } from '@/types/midtrans';

export async function POST(req: Request) {
  try {
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
          sum + Math.round(item.price) * (item.quantity || 1),
        0
      );
    }

    if (!calculatedAmount || calculatedAmount <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Total pembayaran (grossAmount) harus lebih besar dari 0.',
        },
        { status: 400 }
      );
    }

    const generatedOrderId = (
      orderId ||
      `KTR-${Date.now().toString().slice(-8)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`
    )
      .replace(/[^a-zA-Z0-9-_]/g, '-')
      .slice(0, 50);

    const snapParams: MidtransSnapTransactionParams = {
      transaction_details: {
        order_id: generatedOrderId,
        gross_amount: Math.round(Number(calculatedAmount)),
      },
    };

    if (items && Array.isArray(items) && items.length > 0) {
      snapParams.item_details = items.map((item) => ({
        id: String(item.id || item.name).slice(0, 50),
        price: Math.round(Number(item.price)),
        quantity: Math.max(1, Math.round(Number(item.quantity || 1))),
        name: String(item.name || 'Produk Benih').slice(0, 50),
        category: item.category ? String(item.category).slice(0, 50) : undefined,
      }));

      const itemSum = snapParams.item_details.reduce(
        (acc, it) => acc + it.price * it.quantity,
        0
      );
      snapParams.transaction_details.gross_amount = itemSum;
    }

    if (customer) {
      snapParams.customer_details = {
        first_name: customer.first_name || customer.name || 'Pelanggan Kentara',
        email: customer.email || 'pelanggan@kentara.id',
        phone: customer.phone || '08123456789',
      };
    }

    if (enabledPayments && Array.isArray(enabledPayments) && enabledPayments.length > 0) {
      snapParams.enabled_payments = enabledPayments;
    }

    if (customExpiry) {
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
        error: errorDetails,
      },
      { status: 500 }
    );
  }
}
