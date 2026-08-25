import { describe, it, expect } from 'vitest';
import {
  SECURITY_HEADERS,
  getSecurityHeadersList,
  verifyMidtransSignatureTimingSafe,
  buildCspHeader,
} from '@/lib/security/headers';

describe('Security Headers & Cryptographic Hardening Tests', () => {
  it('should define critical security headers according to OWASP guidelines', () => {
    expect(SECURITY_HEADERS['X-Content-Type-Options']).toBe('nosniff');
    expect(SECURITY_HEADERS['X-Frame-Options']).toBe('SAMEORIGIN');
    expect(SECURITY_HEADERS['X-XSS-Protection']).toBe('1; mode=block');
    expect(SECURITY_HEADERS['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
    expect(SECURITY_HEADERS['Strict-Transport-Security']).toContain('max-age=');
  });

  it('should build a strict Content-Security-Policy header containing required origins', () => {
    const csp = buildCspHeader();

    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain('https://app.midtrans.com');
    expect(csp).toContain('https://app.sandbox.midtrans.com');
    expect(csp).toContain('https://*.tile.openstreetmap.org');
    expect(csp).toContain('https://nominatim.openstreetmap.org');
  });

  it('should export security headers formatted for Next.js next.config.ts', () => {
    const headersList = getSecurityHeadersList();

    expect(Array.isArray(headersList)).toBe(true);
    expect(headersList.length).toBeGreaterThanOrEqual(6);

    const keys = headersList.map((h) => h.key);
    expect(keys).toContain('X-Content-Type-Options');
    expect(keys).toContain('X-Frame-Options');
    expect(keys).toContain('Content-Security-Policy');
  });

  it('should perform timing-safe signature verification for Midtrans webhooks', () => {
    const orderId = 'KTR-260825-ABCD';
    const statusCode = '200';
    const grossAmount = '150000';
    const serverKey = 'SB-Mid-server-TESTKEY123';

    // Calculate valid SHA-512
    const crypto = require('crypto');
    const validSignature = crypto
      .createHash('sha512')
      .update(`${orderId}${statusCode}${grossAmount}${serverKey}`)
      .digest('hex');

    const isValid = verifyMidtransSignatureTimingSafe({
      orderId,
      statusCode,
      grossAmount,
      signatureKey: validSignature,
      serverKey,
    });

    expect(isValid).toBe(true);

    // Tampered signature must fail
    const isTamperedValid = verifyMidtransSignatureTimingSafe({
      orderId,
      statusCode,
      grossAmount,
      signatureKey: 'tampered-signature-hex-1234567890abcdef',
      serverKey,
    });

    expect(isTamperedValid).toBe(false);
  });
});
