'use client';

import Script from 'next/script';
import { MIDTRANS_CLIENT_KEY, MIDTRANS_SNAP_URL } from '@/lib/midtrans/client';

export function MidtransScript() {
  return (
    <Script
      id="midtrans-snap"
      src={MIDTRANS_SNAP_URL}
      data-client-key={MIDTRANS_CLIENT_KEY}
      strategy="lazyOnload"
    />
  );
}
