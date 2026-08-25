import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  RateLimiter,
  getClientIp,
  checkRateLimit,
  RATE_LIMIT_PRESETS,
  type RateLimitConfig,
} from '@/lib/security/rate-limit';

describe('Rate Limiter & Traffic Throttling Tests', () => {
  let limiter: RateLimiter;

  beforeEach(() => {
    limiter = new RateLimiter();
  });

  it('should allow requests within configured threshold', () => {
    const config: RateLimitConfig = { maxRequests: 5, windowSeconds: 60 };
    const ip = '192.168.1.100';

    for (let i = 1; i <= 5; i++) {
      const result = limiter.consume(`test:${ip}`, config);
      expect(result.allowed).toBe(true);
      expect(result.currentCount).toBe(i);
      expect(result.remaining).toBe(5 - i);
      expect(result.limit).toBe(5);
    }
  });

  it('should block requests when rate limit is exceeded', () => {
    const config: RateLimitConfig = { maxRequests: 3, windowSeconds: 60 };
    const key = 'auth:user-123';

    // 3 requests allowed
    limiter.consume(key, config);
    limiter.consume(key, config);
    const third = limiter.consume(key, config);
    expect(third.allowed).toBe(true);
    expect(third.remaining).toBe(0);

    // 4th request must be rejected
    const fourth = limiter.consume(key, config);
    expect(fourth.allowed).toBe(false);
    expect(fourth.remaining).toBe(0);
    expect(fourth.currentCount).toBe(4);
    expect(fourth.retryAfterSeconds).toBeGreaterThan(0);
    expect(fourth.retryAfterSeconds).toBeLessThanOrEqual(60);
  });

  it('should reset rate limit after window expiration', () => {
    const config: RateLimitConfig = { maxRequests: 2, windowSeconds: 10 };
    const key = 'test:expiration';

    const now = Date.now();
    vi.setSystemTime(now);

    limiter.consume(key, config);
    limiter.consume(key, config);
    expect(limiter.consume(key, config).allowed).toBe(false);

    // Advance time by 11 seconds (window is 10s)
    vi.setSystemTime(now + 11000);

    const afterWindow = limiter.consume(key, config);
    expect(afterWindow.allowed).toBe(true);
    expect(afterWindow.remaining).toBe(1);

    vi.useRealTimers();
  });

  it('should track separate limits for different identifiers and keys', () => {
    const config: RateLimitConfig = { maxRequests: 2, windowSeconds: 60 };

    limiter.consume('ip-1', config);
    limiter.consume('ip-1', config);
    expect(limiter.consume('ip-1', config).allowed).toBe(false);

    // ip-2 should still have full quota
    const ip2Result = limiter.consume('ip-2', config);
    expect(ip2Result.allowed).toBe(true);
    expect(ip2Result.remaining).toBe(1);
  });

  it('should produce standard RFC rate limit headers', () => {
    const config: RateLimitConfig = { maxRequests: 10, windowSeconds: 60 };
    const result = limiter.consume('header-test', config);
    const headers = limiter.getHeaders(result);

    expect(headers['X-RateLimit-Limit']).toBe('10');
    expect(headers['X-RateLimit-Remaining']).toBe('9');
    expect(typeof headers['X-RateLimit-Reset']).toBe('string');
    expect(headers['Retry-After']).toBeUndefined();

    // Fill quota to trigger Retry-After
    for (let i = 0; i < 9; i++) {
      limiter.consume('header-test', config);
    }
    const blockedResult = limiter.consume('header-test', config);
    const blockedHeaders = limiter.getHeaders(blockedResult);

    expect(blockedHeaders['X-RateLimit-Remaining']).toBe('0');
    expect(blockedHeaders['Retry-After']).toBeDefined();
  });

  it('should resolve client IP correctly from standard headers', () => {
    const mockHeadersWithForwarded = new Headers({
      'x-forwarded-for': '203.0.113.195, 70.41.3.18, 150.172.238.178',
    });
    expect(getClientIp(mockHeadersWithForwarded)).toBe('203.0.113.195');

    const mockHeadersWithRealIp = new Headers({
      'x-real-ip': '198.51.100.42',
    });
    expect(getClientIp(mockHeadersWithRealIp)).toBe('198.51.100.42');

    const mockHeadersWithCf = new Headers({
      'cf-connecting-ip': '198.51.100.99',
    });
    expect(getClientIp(mockHeadersWithCf)).toBe('198.51.100.99');

    const emptyHeaders = new Headers();
    expect(getClientIp(emptyHeaders)).toBe('127.0.0.1');
  });

  it('should have standard preset configurations for security tiers', () => {
    expect(RATE_LIMIT_PRESETS.auth).toBeDefined();
    expect(RATE_LIMIT_PRESETS.auth.maxRequests).toBeLessThanOrEqual(15);
    expect(RATE_LIMIT_PRESETS.auth.windowSeconds).toBe(60);

    expect(RATE_LIMIT_PRESETS.checkout).toBeDefined();
    expect(RATE_LIMIT_PRESETS.checkout.maxRequests).toBeLessThanOrEqual(30);

    expect(RATE_LIMIT_PRESETS.api).toBeDefined();
    expect(RATE_LIMIT_PRESETS.general).toBeDefined();
  });

  it('should support global checkRateLimit helper', () => {
    const ip = '10.0.0.1';
    const res1 = checkRateLimit(`helper:${ip}`, RATE_LIMIT_PRESETS.auth);
    expect(res1.allowed).toBe(true);
    expect(res1.limit).toBe(RATE_LIMIT_PRESETS.auth.maxRequests);
  });
});
