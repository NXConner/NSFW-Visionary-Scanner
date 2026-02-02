/**
 * Client-side rate limiting utilities
 * Works in conjunction with server-side rate limiting
 */

interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetAt: number;
}

export class RateLimiter {
  private static cache: Map<string, RateLimitInfo> = new Map();

  /**
   * Parse rate limit headers from response
   */
  static parseHeaders(headers: Headers): RateLimitInfo | null {
    const limit = headers.get("X-RateLimit-Limit");
    const remaining = headers.get("X-RateLimit-Remaining");
    const reset = headers.get("X-RateLimit-Reset");

    if (!limit || !remaining || !reset) {
      return null;
    }

    return {
      limit: parseInt(limit, 10),
      remaining: parseInt(remaining, 10),
      resetAt: parseInt(reset, 10) * 1000, // Convert to milliseconds
    };
  }

  /**
   * Check if request should be allowed based on cached rate limit info
   */
  static checkLimit(endpoint: string): { allowed: boolean; info: RateLimitInfo | null } {
    const cached = this.cache.get(endpoint);

    if (!cached) {
      return { allowed: true, info: null };
    }

    const now = Date.now();

    // If reset time has passed, allow request
    if (now >= cached.resetAt) {
      this.cache.delete(endpoint);
      return { allowed: true, info: null };
    }

    // If no requests remaining, deny
    if (cached.remaining <= 0) {
      return {
        allowed: false,
        info: cached,
      };
    }

    return {
      allowed: true,
      info: cached,
    };
  }

  /**
   * Update cached rate limit info
   */
  static updateLimit(endpoint: string, info: RateLimitInfo): void {
    this.cache.set(endpoint, info);
  }

  /**
   * Get time until rate limit resets (in seconds)
   */
  static getRetryAfter(endpoint: string): number | null {
    const cached = this.cache.get(endpoint);
    if (!cached || cached.remaining > 0) {
      return null;
    }

    const now = Date.now();
    const retryAfter = Math.ceil((cached.resetAt - now) / 1000);
    return retryAfter > 0 ? retryAfter : null;
  }

  /**
   * Clear rate limit cache
   */
  static clearCache(): void {
    this.cache.clear();
  }
}

/**
 * Rate limit error class
 */
export class RateLimitError extends Error {
  constructor(
    public retryAfter: number,
    message?: string,
  ) {
    super(message || `Rate limit exceeded. Retry after ${retryAfter} seconds.`);
    this.name = "RateLimitError";
  }
}

/**
 * Fetch with rate limiting
 */
export async function fetchWithRateLimit(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  const endpoint = new URL(url).pathname;

  // Check client-side cache first
  const check = RateLimiter.checkLimit(endpoint);
  if (!check.allowed && check.info) {
    const retryAfter = RateLimiter.getRetryAfter(endpoint);
    throw new RateLimitError(
      retryAfter || 60,
      `Rate limit exceeded. Please try again in ${retryAfter || 60} seconds.`,
    );
  }

  // Make request
  const response = await fetch(url, options);

  // Parse rate limit headers
  const rateLimitInfo = RateLimiter.parseHeaders(response.headers);
  if (rateLimitInfo) {
    RateLimiter.updateLimit(endpoint, rateLimitInfo);
  }

  // If rate limited, throw error
  if (response.status === 429) {
    const data = await response.json().catch(() => ({}));
    const retryAfter = data.retryAfter || 60;
    throw new RateLimitError(retryAfter, data.message || "Rate limit exceeded");
  }

  return response;
}
