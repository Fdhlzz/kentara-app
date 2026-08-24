'use client';

import { useState, useCallback } from 'react';
import type {
  MidtransCustomerDetails,
  MidtransItemDetail,
  SnapCallbacks,
  SnapResult,
} from '@/types/midtrans';
import { MIDTRANS_CLIENT_KEY, MIDTRANS_SNAP_URL } from '@/lib/midtrans/client';

export interface CheckoutPayload {
  orderId?: string;
  grossAmount?: number;
  items?: MidtransItemDetail[];
  customer?: Partial<MidtransCustomerDetails> & {
    name?: string;
    address?: string;
    city?: string;
    postal_code?: string;
  };
  enabledPayments?: string[];
}

export function useMidtransSnap() {
  const [isLoading, setIsLoading] = useState(false);
  const [isScriptReady, setIsScriptReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Memastikan snap.js sudah dimuat ke dalam dokumen window
   */
  const loadSnapScript = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && window.snap) {
        setIsScriptReady(true);
        resolve(true);
        return;
      }

      // Periksa apakah tag script sudah ada
      const existingScript = document.getElementById('midtrans-snap-dynamic');
      if (existingScript) {
        existingScript.addEventListener('load', () => {
          setIsScriptReady(true);
          resolve(true);
        });
        return;
      }

      const script = document.createElement('script');
      script.id = 'midtrans-snap-dynamic';
      script.src = MIDTRANS_SNAP_URL;
      if (MIDTRANS_CLIENT_KEY) {
        script.setAttribute('data-client-key', MIDTRANS_CLIENT_KEY);
      }
      script.async = true;
      script.onload = () => {
        setIsScriptReady(true);
        resolve(true);
      };
      script.onerror = () => {
        setError('Gagal memuat sistem pembayaran Midtrans');
        resolve(false);
      };
      document.body.appendChild(script);
    });
  }, []);

  /**
   * Membuka popup Snap menggunakan token yang sudah dibuat
   */
  const openSnapPopup = useCallback(
    async (token: string, callbacks?: SnapCallbacks) => {
      await loadSnapScript();

      if (typeof window === 'undefined' || !window.snap) {
        const err = 'Midtrans Snap SDK tidak tersedia';
        setError(err);
        callbacks?.onError?.({
          status_code: '500',
          status_message: [err],
          transaction_id: '',
          order_id: '',
          gross_amount: '0',
          payment_type: '',
          transaction_time: '',
          transaction_status: 'error',
        });
        return;
      }

      window.snap.pay(token, {
        onSuccess: (result: SnapResult) => {
          callbacks?.onSuccess?.(result);
        },
        onPending: (result: SnapResult) => {
          callbacks?.onPending?.(result);
        },
        onError: (result: SnapResult) => {
          setError('Terjadi kesalahan saat memproses pembayaran');
          callbacks?.onError?.(result);
        },
        onClose: () => {
          callbacks?.onClose?.();
        },
      });
    },
    [loadSnapScript]
  );

  /**
   * Membuat transaksi ke server Kentara kemudian langsung membuka popup Midtrans Snap
   */
  const checkout = useCallback(
    async (
      payload: CheckoutPayload,
      callbacks?: SnapCallbacks
    ): Promise<{ success: boolean; token?: string; orderId?: string; error?: string }> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/midtrans/snap', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          const errMsg = data.error || 'Gagal membuat sesi pembayaran';
          setError(errMsg);
          setIsLoading(false);
          return { success: false, error: errMsg };
        }

        const { token, orderId } = data;

        // Buka popup Snap
        await openSnapPopup(token, callbacks);

        setIsLoading(false);
        return { success: true, token, orderId };
      } catch (err: unknown) {
        const errMsg =
          err instanceof Error
            ? err.message
            : 'Terjadi kegagalan jaringan saat menghubungi server';
        setError(errMsg);
        setIsLoading(false);
        return { success: false, error: errMsg };
      }
    },
    [openSnapPopup]
  );

  return {
    checkout,
    openSnapPopup,
    loadSnapScript,
    isLoading,
    isScriptReady,
    error,
  };
}
