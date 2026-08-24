/**
 * Client-side helper for Midtrans Snap SDK
 */

export const MIDTRANS_CLIENT_KEY =
  process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ||
  process.env.MIDTRANS_CLIENT_KEY ||
  process.env.NEXT_PUBLIC_CLIENT_KEY ||
  '';

export const MIDTRANS_IS_PRODUCTION =
  process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true' ||
  process.env.MIDTRANS_IS_PRODUCTION === 'true';

export const MIDTRANS_SNAP_URL = MIDTRANS_IS_PRODUCTION
  ? 'https://app.midtrans.com/snap/snap.js'
  : 'https://app.sandbox.midtrans.com/snap/snap.js';
