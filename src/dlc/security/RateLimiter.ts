/**
 * Rate Limiter for DLC Operations
 * Prevents abuse of license validation and NSFW detection
 */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export class RateLimiter {
  private limits = new Map<string, RateLimitEntry>();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig = { maxRequests: 10, windowMs: 60000 }) {
    this.config = config;
  }

  /**
   * Check if request is allowed
   */
  isAllowed(key: string): boolean {
    const now = Date.now();
    const entry = this.limits.get(key);

    // No entry or expired window
    if (!entry || now > entry.resetAt) {
      this.limits.set(key, {
        count: 1,
        resetAt: now + this.config.windowMs,
      });
      return true;
    }

    // Within window
    if (entry.count < this.config.maxRequests) {
      entry.count++;
      return true;
    }

    // Rate limit exceeded
    return false;
  }

  /**
   * Get remaining requests
   */
  getRemaining(key: string): number {
    const entry = this.limits.get(key);
    if (!entry || Date.now() > entry.resetAt) {
      return this.config.maxRequests;
    }
    return Math.max(0, this.config.maxRequests - entry.count);
  }

  /**
   * Get time until reset (ms)
   */
  getResetTime(key: string): number {
    const entry = this.limits.get(key);
    if (!entry) return 0;
    return Math.max(0, entry.resetAt - Date.now());
  }

  /**
   * Clear rate limit for key
   */
  clear(key: string): void {
    this.limits.delete(key);
  }

  /**
   * Clear all rate limits
   */
  clearAll(): void {
    this.limits.clear();
  }
}

// Singleton instances for different operations
export const licenseValidationLimiter = new RateLimiter({
  maxRequests: 5,
  windowMs: 60000, // 5 requests per minute
});

export const nsfwDetectionLimiter = new RateLimiter({
  maxRequests: 20,
  windowMs: 60000, // 20 detections per minute
});

export const ageVerificationLimiter = new RateLimiter({
  maxRequests: 3,
  windowMs: 300000, // 3 attempts per 5 minutes
});
