import crypto from 'crypto';

/**
 * Build Content-Security-Policy header
 */
export function buildCspHeader(): string {
  const isDev = process.env.NODE_ENV === 'development';

  const directives: Record<string, string[]> = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      "'unsafe-inline'", // Needed for Next.js hydration & inline scripts
      isDev ? "'unsafe-eval'" : '',
      'https://app.midtrans.com',
      'https://app.sandbox.midtrans.com',
      'https://unpkg.com',
      'https://cdnjs.cloudflare.com',
    ].filter(Boolean),
    'style-src': [
      "'self'",
      "'unsafe-inline'", // Needed for Tailwind CSS and Leaflet styles
      'https://unpkg.com',
      'https://cdnjs.cloudflare.com',
      'https://fonts.googleapis.com',
    ],
    'img-src': [
      "'self'",
      'data:',
      'blob:',
      'https:',
      'https://*.tile.openstreetmap.org',
      'https://images.unsplash.com',
    ],
    'font-src': [
      "'self'",
      'data:',
      'https://fonts.gstatic.com',
    ],
    'connect-src': [
      "'self'",
      'https:',
      'wss:',
      'https://*.supabase.co',
      'https://app.midtrans.com',
      'https://app.sandbox.midtrans.com',
      'https://api.midtrans.com',
      'https://api.sandbox.midtrans.com',
      'https://nominatim.openstreetmap.org',
      'https://router.project-osrm.org',
    ],
    'frame-src': [
      "'self'",
      'https://app.midtrans.com',
      'https://app.sandbox.midtrans.com',
    ],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'self'"],
  };

  return Object.entries(directives)
    .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
    .join('; ');
}

export const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self)',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
};

/**
 * Returns security headers formatted for Next.js next.config.ts `headers()` method
 */
export function getSecurityHeadersList(): Array<{ key: string; value: string }> {
  const headers = [
    ...Object.entries(SECURITY_HEADERS).map(([key, value]) => ({ key, value })),
    {
      key: 'Content-Security-Policy',
      value: buildCspHeader(),
    },
  ];

  return headers;
}

/**
 * Timing-safe Midtrans Signature verification using crypto.timingSafeEqual
 */
export function verifyMidtransSignatureTimingSafe(params: {
  orderId: string;
  statusCode: string;
  grossAmount: string;
  signatureKey: string;
  serverKey: string;
}): boolean {
  const { orderId, statusCode, grossAmount, signatureKey, serverKey } = params;
  if (!serverKey || !signatureKey) return false;

  const payload = `${orderId}${statusCode}${grossAmount}${serverKey}`;
  const calculatedHex = crypto.createHash('sha512').update(payload).digest('hex').toLowerCase();
  const inputHex = signatureKey.trim().toLowerCase();

  if (calculatedHex.length !== inputHex.length) {
    return false;
  }

  const calcBuf = Buffer.from(calculatedHex, 'utf8');
  const inputBuf = Buffer.from(inputHex, 'utf8');

  try {
    return crypto.timingSafeEqual(calcBuf, inputBuf);
  } catch {
    return false;
  }
}
