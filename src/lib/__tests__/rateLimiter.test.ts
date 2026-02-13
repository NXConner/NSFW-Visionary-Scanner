/**
 * Rate Limiter Tests
 * Tests for client-side rate limiting functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { RateLimiter, RateLimitError, fetchWithRateLimit } from "../rateLimiter";

describe("RateLimiter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    RateLimiter.clearCache();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("parseHeaders", () => {
    it("should parse rate limit headers correctly", () => {
      const headers = new Headers({
        "X-RateLimit-Limit": "100",
        "X-RateLimit-Remaining": "95",
        "X-RateLimit-Reset": "1704067200", // Unix timestamp
      });

      const result = RateLimiter.parseHeaders(headers);

      expect(result).not.toBeNull();
      expect(result?.limit).toBe(100);
      expect(result?.remaining).toBe(95);
      expect(result?.resetAt).toBe(1704067200000); // Converted to milliseconds
    });

    it("should return null for missing headers", () => {
      const headers = new Headers({
        "X-RateLimit-Limit": "100",
        // Missing other headers
      });

      const result = RateLimiter.parseHeaders(headers);
      expect(result).toBeNull();
    });
  });

  describe("checkLimit", () => {
    it("should allow requests when no cached limit exists", () => {
      const result = RateLimiter.checkLimit("/api/test");

      expect(result.allowed).toBe(true);
      expect(result.info).toBeNull();
    });

    it("should deny requests when limit exceeded", () => {
      const endpoint = "/api/test";
      const futureReset = Date.now() + 60000; // 1 minute from now

      RateLimiter.updateLimit(endpoint, {
        limit: 100,
        remaining: 0,
        resetAt: futureReset,
      });

      const result = RateLimiter.checkLimit(endpoint);

      expect(result.allowed).toBe(false);
      expect(result.info?.remaining).toBe(0);
    });

    it("should allow requests when limit not exceeded", () => {
      const endpoint = "/api/test";
      const futureReset = Date.now() + 60000;

      RateLimiter.updateLimit(endpoint, {
        limit: 100,
        remaining: 50,
        resetAt: futureReset,
      });

      const result = RateLimiter.checkLimit(endpoint);

      expect(result.allowed).toBe(true);
      expect(result.info?.remaining).toBe(50);
    });

    it("should reset limit after reset time passes", () => {
      const endpoint = "/api/test";
      const pastReset = Date.now() - 1000; // 1 second ago

      RateLimiter.updateLimit(endpoint, {
        limit: 100,
        remaining: 0,
        resetAt: pastReset,
      });

      const result = RateLimiter.checkLimit(endpoint);

      expect(result.allowed).toBe(true);
      expect(result.info).toBeNull(); // Cache should be cleared
    });
  });

  describe("updateLimit", () => {
    it("should store rate limit info", () => {
      const endpoint = "/api/test";
      const info = {
        limit: 100,
        remaining: 75,
        resetAt: Date.now() + 60000,
      };

      RateLimiter.updateLimit(endpoint, info);

      const result = RateLimiter.checkLimit(endpoint);
      expect(result.info?.limit).toBe(100);
      expect(result.info?.remaining).toBe(75);
    });
  });

  describe("getRetryAfter", () => {
    it("should return null when no limit exceeded", () => {
      const endpoint = "/api/test";

      const result = RateLimiter.getRetryAfter(endpoint);
      expect(result).toBeNull();
    });

    it("should return seconds until reset when limit exceeded", () => {
      const endpoint = "/api/test";
      const futureReset = Date.now() + 30000; // 30 seconds from now

      RateLimiter.updateLimit(endpoint, {
        limit: 100,
        remaining: 0,
        resetAt: futureReset,
      });

      const result = RateLimiter.getRetryAfter(endpoint);

      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThanOrEqual(30);
    });
  });

  describe("clearCache", () => {
    it("should clear all cached limits", () => {
      RateLimiter.updateLimit("/api/test1", {
        limit: 100,
        remaining: 50,
        resetAt: Date.now() + 60000,
      });
      RateLimiter.updateLimit("/api/test2", {
        limit: 100,
        remaining: 50,
        resetAt: Date.now() + 60000,
      });

      RateLimiter.clearCache();

      expect(RateLimiter.checkLimit("/api/test1").info).toBeNull();
      expect(RateLimiter.checkLimit("/api/test2").info).toBeNull();
    });
  });
});

describe("RateLimitError", () => {
  it("should create error with retry after value", () => {
    const error = new RateLimitError(60);

    expect(error.retryAfter).toBe(60);
    expect(error.name).toBe("RateLimitError");
    expect(error.message).toContain("60 seconds");
  });

  it("should accept custom message", () => {
    const error = new RateLimitError(30, "Custom rate limit message");

    expect(error.message).toBe("Custom rate limit message");
  });
});

describe("fetchWithRateLimit", () => {
  beforeEach(() => {
    RateLimiter.clearCache();
    global.fetch = vi.fn();
  });

  it("should make request when not rate limited", async () => {
    vi.useRealTimers();

    const mockResponse = new Response(JSON.stringify({ data: "test" }), {
      status: 200,
      headers: {
        "X-RateLimit-Limit": "100",
        "X-RateLimit-Remaining": "99",
        "X-RateLimit-Reset": String(Math.floor(Date.now() / 1000) + 60),
      },
    });

    (global.fetch as any).mockResolvedValueOnce(mockResponse);

    const response = await fetchWithRateLimit("https://api.example.invalid/test");

    expect(global.fetch).toHaveBeenCalled();
    expect(response.status).toBe(200);
  });

  it("should throw RateLimitError when limit exceeded in cache", async () => {
    const endpoint = "/test";
    RateLimiter.updateLimit(endpoint, {
      limit: 100,
      remaining: 0,
      resetAt: Date.now() + 60000,
    });

    await expect(fetchWithRateLimit(`https://api.example.invalid${endpoint}`)).rejects.toThrow(
      RateLimitError,
    );
  });

  it("should throw RateLimitError on 429 response", async () => {
    vi.useRealTimers();

    const mockResponse = new Response(
      JSON.stringify({ error: "Too many requests", retryAfter: 60 }),
      { status: 429 },
    );

    (global.fetch as any).mockResolvedValueOnce(mockResponse);

    await expect(fetchWithRateLimit("https://api.example.invalid/test")).rejects.toThrow(
      RateLimitError,
    );
  });
});
