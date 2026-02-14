import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  RateLimiter,
  licenseValidationLimiter,
  nsfwDetectionLimiter,
  ageVerificationLimiter,
} from "../RateLimiter";

describe("RateLimiter", () => {
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    rateLimiter = new RateLimiter({ maxRequests: 5, windowMs: 1000 });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("isAllowed", () => {
    it("should allow first request", () => {
      const result = rateLimiter.isAllowed("user1");
      expect(result).toBe(true);
    });

    it("should allow requests up to max limit", () => {
      for (let i = 0; i < 5; i++) {
        const result = rateLimiter.isAllowed("user1");
        expect(result).toBe(true);
      }
    });

    it("should block requests after limit is exceeded", () => {
      // Use up all allowed requests
      for (let i = 0; i < 5; i++) {
        rateLimiter.isAllowed("user1");
      }

      // Next request should be blocked
      const result = rateLimiter.isAllowed("user1");
      expect(result).toBe(false);
    });

    it("should reset after time window expires", async () => {
      // Use all requests
      for (let i = 0; i < 5; i++) {
        rateLimiter.isAllowed("user1");
      }

      // Mock time passing beyond window
      const futureTime = Date.now() + 1500;
      vi.spyOn(Date, "now").mockReturnValue(futureTime);

      // Should be allowed again
      const result = rateLimiter.isAllowed("user1");
      expect(result).toBe(true);
    });

    it("should track different keys separately", () => {
      // Use all requests for user1
      for (let i = 0; i < 5; i++) {
        rateLimiter.isAllowed("user1");
      }

      // user2 should still be allowed
      const result = rateLimiter.isAllowed("user2");
      expect(result).toBe(true);
    });

    it("should handle rapid successive requests", () => {
      const results = [];
      for (let i = 0; i < 10; i++) {
        results.push(rateLimiter.isAllowed("user1"));
      }

      // First 5 should be true, rest false
      expect(results.slice(0, 5)).toEqual([true, true, true, true, true]);
      expect(results.slice(5)).toEqual([false, false, false, false, false]);
    });
  });

  describe("getRemaining", () => {
    it("should return max requests for new key", () => {
      const remaining = rateLimiter.getRemaining("newuser");
      expect(remaining).toBe(5);
    });

    it("should decrease remaining count after requests", () => {
      rateLimiter.isAllowed("user1");
      expect(rateLimiter.getRemaining("user1")).toBe(4);

      rateLimiter.isAllowed("user1");
      expect(rateLimiter.getRemaining("user1")).toBe(3);

      rateLimiter.isAllowed("user1");
      expect(rateLimiter.getRemaining("user1")).toBe(2);
    });

    it("should return 0 when limit is exhausted", () => {
      for (let i = 0; i < 5; i++) {
        rateLimiter.isAllowed("user1");
      }

      const remaining = rateLimiter.getRemaining("user1");
      expect(remaining).toBe(0);
    });

    it("should reset remaining count after window expires", () => {
      rateLimiter.isAllowed("user1");
      rateLimiter.isAllowed("user1");

      // Mock time passing
      const futureTime = Date.now() + 1500;
      vi.spyOn(Date, "now").mockReturnValue(futureTime);

      const remaining = rateLimiter.getRemaining("user1");
      expect(remaining).toBe(5);
    });
  });

  describe("getResetTime", () => {
    it("should return 0 for new key", () => {
      const resetTime = rateLimiter.getResetTime("newuser");
      expect(resetTime).toBe(0);
    });

    it("should return time until reset", () => {
      rateLimiter.isAllowed("user1");

      const resetTime = rateLimiter.getResetTime("user1");
      expect(resetTime).toBeGreaterThan(0);
      expect(resetTime).toBeLessThanOrEqual(1000);
    });

    it("should decrease over time", async () => {
      rateLimiter.isAllowed("user1");

      const resetTime1 = rateLimiter.getResetTime("user1");

      // Mock time passing (500ms)
      const futureTime = Date.now() + 500;
      vi.spyOn(Date, "now").mockReturnValue(futureTime);

      const resetTime2 = rateLimiter.getResetTime("user1");

      expect(resetTime2).toBeLessThan(resetTime1);
    });

    it("should return 0 after window expires", () => {
      rateLimiter.isAllowed("user1");

      // Mock time passing beyond window
      const futureTime = Date.now() + 1500;
      vi.spyOn(Date, "now").mockReturnValue(futureTime);

      const resetTime = rateLimiter.getResetTime("user1");
      expect(resetTime).toBe(0);
    });
  });

  describe("clear", () => {
    it("should clear rate limit for specific key", () => {
      // Use all requests
      for (let i = 0; i < 5; i++) {
        rateLimiter.isAllowed("user1");
      }

      // Should be blocked
      expect(rateLimiter.isAllowed("user1")).toBe(false);

      // Clear the limit
      rateLimiter.clear("user1");

      // Should be allowed again
      expect(rateLimiter.isAllowed("user1")).toBe(true);
    });

    it("should not affect other keys", () => {
      rateLimiter.isAllowed("user1");
      rateLimiter.isAllowed("user2");

      rateLimiter.clear("user1");

      // user1 should reset to max
      expect(rateLimiter.getRemaining("user1")).toBe(5);

      // user2 should still have 4 remaining
      expect(rateLimiter.getRemaining("user2")).toBe(4);
    });
  });

  describe("clearAll", () => {
    it("should clear all rate limits", () => {
      rateLimiter.isAllowed("user1");
      rateLimiter.isAllowed("user2");
      rateLimiter.isAllowed("user3");

      rateLimiter.clearAll();

      expect(rateLimiter.getRemaining("user1")).toBe(5);
      expect(rateLimiter.getRemaining("user2")).toBe(5);
      expect(rateLimiter.getRemaining("user3")).toBe(5);
    });
  });

  describe("custom configuration", () => {
    it("should respect custom max requests", () => {
      const customLimiter = new RateLimiter({ maxRequests: 3, windowMs: 1000 });

      expect(customLimiter.isAllowed("user1")).toBe(true);
      expect(customLimiter.isAllowed("user1")).toBe(true);
      expect(customLimiter.isAllowed("user1")).toBe(true);
      expect(customLimiter.isAllowed("user1")).toBe(false);
    });

    it("should respect custom time window", () => {
      const customLimiter = new RateLimiter({ maxRequests: 5, windowMs: 500 });

      for (let i = 0; i < 5; i++) {
        customLimiter.isAllowed("user1");
      }

      // Mock time passing (600ms - beyond 500ms window)
      const futureTime = Date.now() + 600;
      vi.spyOn(Date, "now").mockReturnValue(futureTime);

      expect(customLimiter.isAllowed("user1")).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("should handle empty key string", () => {
      const result = rateLimiter.isAllowed("");
      expect(result).toBe(true);
    });

    it("should handle special characters in key", () => {
      const specialKey = "user@unit.test#123";
      const result = rateLimiter.isAllowed(specialKey);
      expect(result).toBe(true);
    });

    it("should handle very long keys", () => {
      const longKey = "a".repeat(1000);
      const result = rateLimiter.isAllowed(longKey);
      expect(result).toBe(true);
    });

    it("should handle concurrent requests for same key", () => {
      const results = Array.from({ length: 10 }, () => rateLimiter.isAllowed("user1"));

      const allowedCount = results.filter(r => r === true).length;
      const blockedCount = results.filter(r => r === false).length;

      expect(allowedCount).toBe(5);
      expect(blockedCount).toBe(5);
    });
  });
});

describe("Singleton instances", () => {
  beforeEach(() => {
    licenseValidationLimiter.clearAll();
    nsfwDetectionLimiter.clearAll();
    ageVerificationLimiter.clearAll();
  });

  describe("licenseValidationLimiter", () => {
    it("should have correct configuration (5 requests per minute)", () => {
      // Test max requests
      for (let i = 0; i < 5; i++) {
        expect(licenseValidationLimiter.isAllowed("test")).toBe(true);
      }
      expect(licenseValidationLimiter.isAllowed("test")).toBe(false);
    });

    it("should reset after 60 seconds", () => {
      for (let i = 0; i < 5; i++) {
        licenseValidationLimiter.isAllowed("test");
      }

      // Mock time passing (61 seconds)
      const futureTime = Date.now() + 61000;
      vi.spyOn(Date, "now").mockReturnValue(futureTime);

      expect(licenseValidationLimiter.isAllowed("test")).toBe(true);

      vi.restoreAllMocks();
    });
  });

  describe("nsfwDetectionLimiter", () => {
    it("should have correct configuration (20 requests per minute)", () => {
      // Test max requests
      for (let i = 0; i < 20; i++) {
        expect(nsfwDetectionLimiter.isAllowed("test")).toBe(true);
      }
      expect(nsfwDetectionLimiter.isAllowed("test")).toBe(false);
    });

    it("should allow more requests than license limiter", () => {
      const nsfwRemaining = nsfwDetectionLimiter.getRemaining("test");
      const licenseRemaining = licenseValidationLimiter.getRemaining("test");

      expect(nsfwRemaining).toBeGreaterThan(licenseRemaining);
    });
  });

  describe("ageVerificationLimiter", () => {
    it("should have correct configuration (3 requests per 5 minutes)", () => {
      // Test max requests
      for (let i = 0; i < 3; i++) {
        expect(ageVerificationLimiter.isAllowed("test")).toBe(true);
      }
      expect(ageVerificationLimiter.isAllowed("test")).toBe(false);
    });

    it("should reset after 5 minutes", () => {
      for (let i = 0; i < 3; i++) {
        ageVerificationLimiter.isAllowed("test");
      }

      // Mock time passing (5 minutes + 1 second)
      const futureTime = Date.now() + 301000;
      vi.spyOn(Date, "now").mockReturnValue(futureTime);

      expect(ageVerificationLimiter.isAllowed("test")).toBe(true);

      vi.restoreAllMocks();
    });

    it("should be most restrictive limiter", () => {
      const ageRemaining = ageVerificationLimiter.getRemaining("test");
      const licenseRemaining = licenseValidationLimiter.getRemaining("test");
      const nsfwRemaining = nsfwDetectionLimiter.getRemaining("test");

      expect(ageRemaining).toBeLessThan(licenseRemaining);
      expect(ageRemaining).toBeLessThan(nsfwRemaining);
    });
  });

  describe("independence of singleton instances", () => {
    it("should track limits independently", () => {
      // Use up age verification attempts
      for (let i = 0; i < 3; i++) {
        ageVerificationLimiter.isAllowed("user1");
      }

      // Other limiters should still work for same user
      expect(licenseValidationLimiter.isAllowed("user1")).toBe(true);
      expect(nsfwDetectionLimiter.isAllowed("user1")).toBe(true);
    });
  });
});
