/**
 * Kentara Security & Rate Limiting Module
 * High-performance sliding-window in-memory rate limiter with automated memory eviction
 */

export interface RateLimitConfig {
  maxRequests: number;
  windowSeconds: number;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  currentCount: number;
  resetTimeMs: number;
  retryAfterSeconds?: number;
}

export class RateLimiter {
  private store = new Map<string, number[]>();
  private lastCleanup = Date.now();
  private readonly cleanupIntervalMs = 60_000; // Cleanup every 1 minute

  constructor() {}

  /**
   * Consume 1 request token for the given key and config using sliding window log
   */
  public consume(key: string, config: RateLimitConfig): RateLimitResult {
    const now = Date.now();
    this.maybeCleanup(now);

    const windowMs = config.windowSeconds * 1000;
    const cutoff = now - windowMs;

    let timestamps = this.store.get(key);
    if (!timestamps) {
      timestamps = [];
      this.store.set(key, timestamps);
    }

    // Evict timestamps outside sliding window
    while (timestamps.length > 0 && timestamps[0] <= cutoff) {
      timestamps.shift();
    }

    if (timestamps.length < config.maxRequests) {
      timestamps.push(now);
      const remaining = config.maxRequests - timestamps.length;
      const resetTimeMs = timestamps.length > 0 ? timestamps[0] + windowMs : now + windowMs;

      return {
        allowed: true,
        limit: config.maxRequests,
        remaining,
        currentCount: timestamps.length,
        resetTimeMs,
      };
    }

    const oldestTimestamp = timestamps[0] || now;
    const resetTimeMs = oldestTimestamp + windowMs;
    const retryAfterSeconds = Math.max(1, Math.ceil((resetTimeMs - now) / 1000));

    return {
      allowed: false,
      limit: config.maxRequests,
      remaining: 0,
      currentCount: timestamps.length + 1,
      resetTimeMs,
      retryAfterSeconds,
    };
  }

  /**
   * Generate standard RFC HTTP rate limiting headers
   */
  public getHeaders(result: RateLimitResult): Record<string, string> {
    const headers: Record<string, string> = {
      'X-RateLimit-Limit': String(result.limit),
      'X-RateLimit-Remaining': String(result.remaining),
      'X-RateLimit-Reset': new Date(result.resetTimeMs).toUTCString(),
    };

    if (!result.allowed && result.retryAfterSeconds !== undefined) {
      headers['Retry-After'] = String(result.retryAfterSeconds);
    }

    return headers;
  }

  /**
   * Periodically evict empty or expired entries
   */
  private maybeCleanup(now: number): void {
    if (now - this.lastCleanup < this.cleanupIntervalMs) {
      return;
    }

    this.lastCleanup = now;
    for (const [k, timestamps] of this.store.entries()) {
      if (timestamps.length === 0 || timestamps[timestamps.length - 1] < now - 3600_000) {
        this.store.delete(k);
      }
    }
  }

  /**
   * Clear all internal buckets (useful for test resets)
   */
  public clear(): void {
    this.store.clear();
  }
}

/**
 * Standard Security Tier Presets
 */
export const RATE_LIMIT_PRESETS: Record<string, RateLimitConfig> = {
  auth: {
    maxRequests: 10,
    windowSeconds: 60,
  },
  checkout: {
    maxRequests: 20,
    windowSeconds: 60,
  },
  api: {
    maxRequests: 60,
    windowSeconds: 60,
  },
  general: {
    maxRequests: 120,
    windowSeconds: 60,
  },
};

/**
 * Global singleton rate limiter instance
 */
export const globalRateLimiter = new RateLimiter();

/**
 * Check rate limit using global instance
 */
export function checkRateLimit(key: string, config: RateLimitConfig = RATE_LIMIT_PRESETS.general): RateLimitResult {
  return globalRateLimiter.consume(key, config);
}

/**
 * Extract client IP address safely from incoming request headers
 */
export function getClientIp(headers: Headers | Record<string, string | string[] | undefined>): string {
  const getHeader = (name: string): string | null => {
    if (headers instanceof Headers) {
      return headers.get(name);
    }
    const val = headers[name] || headers[name.toLowerCase()];
    if (Array.isArray(val)) return val[0] || null;
    return val || null;
  };

  // 1. Check Cloudflare
  const cfConnectingIp = getHeader('cf-connecting-ip');
  if (cfConnectingIp) return cfConnectingIp.trim();

  // 2. Check X-Real-IP
  const xRealIp = getHeader('x-real-ip');
  if (xRealIp) return xRealIp.trim();

  // 3. Check X-Forwarded-For (first IP in chain is client)
  const xForwardedFor = getHeader('x-forwarded-for');
  if (xForwardedFor) {
    const firstIp = xForwardedFor.split(',')[0]?.trim();
    if (firstIp) return firstIp;
  }

  // 4. Check Client-IP / X-Client-IP
  const clientIp = getHeader('x-client-ip') || getHeader('client-ip');
  if (clientIp) return clientIp.trim();

  return '127.0.0.1';
}
