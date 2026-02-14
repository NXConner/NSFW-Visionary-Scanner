import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  InputSanitizer,
  RateLimiter,
  generateCSPHeader,
  CSP_CONFIG,
  SECURITY_HEADERS,
  DataEncryptor,
  SecureStorage,
  initializeSecurity,
} from "../security";

describe("InputSanitizer", () => {
  describe("sanitizeString", () => {
    it("should remove HTML tags", () => {
      const input = "<script>alert('xss')</script>Hello";
      const result = InputSanitizer.sanitizeString(input);
      expect(result).not.toContain("<");
      expect(result).not.toContain(">");
    });

    it("should trim whitespace", () => {
      const input = "  Hello World  ";
      const result = InputSanitizer.sanitizeString(input);
      expect(result).toBe("Hello World");
    });

    it("should limit string length to 1000 characters", () => {
      const input = "a".repeat(1500);
      const result = InputSanitizer.sanitizeString(input);
      expect(result.length).toBe(1000);
    });

    it("should handle empty strings", () => {
      const result = InputSanitizer.sanitizeString("");
      expect(result).toBe("");
    });
  });

  describe("sanitizeEmail", () => {
    it("should convert to lowercase", () => {
      const result = InputSanitizer.sanitizeEmail("TEST@UNIT.TEST");
      expect(result).toBe("test@unit.test");
    });

    it("should trim whitespace", () => {
      const result = InputSanitizer.sanitizeEmail("  test@unit.test  ");
      expect(result).toBe("test@unit.test");
    });

    it("should limit length to 254 characters", () => {
      const input = "a".repeat(300) + "@unit.test";
      const result = InputSanitizer.sanitizeEmail(input);
      expect(result.length).toBe(254);
    });
  });

  describe("sanitizeMeasurement", () => {
    it("should clamp values between 0 and 1000", () => {
      expect(InputSanitizer.sanitizeMeasurement(-10)).toBe(0);
      expect(InputSanitizer.sanitizeMeasurement(1500)).toBe(1000);
      expect(InputSanitizer.sanitizeMeasurement(500)).toBe(500);
    });

    it("should handle boundary values", () => {
      expect(InputSanitizer.sanitizeMeasurement(0)).toBe(0);
      expect(InputSanitizer.sanitizeMeasurement(1000)).toBe(1000);
    });
  });

  describe("sanitizeNotes", () => {
    it("should remove script tags", () => {
      const input = "Hello <script>alert('xss')</script> World";
      const result = InputSanitizer.sanitizeNotes(input);
      expect(result).not.toContain("<script>");
      expect(result).toContain("Hello");
      expect(result).toContain("World");
    });

    it("should remove all HTML tags", () => {
      const input = "Hello <div><b>World</b></div>";
      const result = InputSanitizer.sanitizeNotes(input);
      expect(result).toBe("Hello World");
    });

    it("should limit length to 5000 characters", () => {
      const input = "a".repeat(6000);
      const result = InputSanitizer.sanitizeNotes(input);
      expect(result.length).toBe(5000);
    });

    it("should trim whitespace", () => {
      const input = "  Test notes  ";
      const result = InputSanitizer.sanitizeNotes(input);
      expect(result).toBe("Test notes");
    });
  });
});

describe("RateLimiter", () => {
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    rateLimiter = new RateLimiter();
  });

  it("should allow first attempt", () => {
    const result = rateLimiter.checkLimit("test-user");
    expect(result).toBe(true);
  });

  it("should allow attempts up to the limit", () => {
    const identifier = "test-user";
    for (let i = 0; i < 5; i++) {
      expect(rateLimiter.checkLimit(identifier, 5, 1000)).toBe(true);
    }
  });

  it("should block attempts after limit is reached", () => {
    const identifier = "test-user";
    // Use up all attempts
    for (let i = 0; i < 5; i++) {
      rateLimiter.checkLimit(identifier, 5, 1000);
    }
    // Next attempt should be blocked
    expect(rateLimiter.checkLimit(identifier, 5, 1000)).toBe(false);
  });

  it("should reset attempts after time window", () => {
    const identifier = "test-user";
    // Use all attempts with 10ms window
    for (let i = 0; i < 5; i++) {
      rateLimiter.checkLimit(identifier, 5, 10);
    }

    // Wait for window to expire
    return new Promise(resolve => {
      setTimeout(() => {
        const result = rateLimiter.checkLimit(identifier, 5, 10);
        expect(result).toBe(true);
        resolve(undefined);
      }, 20);
    });
  });

  it("should track different identifiers separately", () => {
    const user1 = "user1";
    const user2 = "user2";

    // Use up attempts for user1
    for (let i = 0; i < 5; i++) {
      rateLimiter.checkLimit(user1, 5, 1000);
    }

    // user2 should still have attempts
    expect(rateLimiter.checkLimit(user2, 5, 1000)).toBe(true);
  });

  it("should correctly reset specific identifier", () => {
    const identifier = "test-user";
    // Use some attempts
    for (let i = 0; i < 5; i++) {
      rateLimiter.checkLimit(identifier, 5, 1000);
    }

    // Reset
    rateLimiter.reset(identifier);

    // Should be able to make attempts again
    expect(rateLimiter.checkLimit(identifier, 5, 1000)).toBe(true);
  });

  it("should return correct remaining attempts", () => {
    const identifier = "test-user";

    expect(rateLimiter.getRemainingAttempts(identifier, 5)).toBe(5);

    rateLimiter.checkLimit(identifier, 5, 1000);
    expect(rateLimiter.getRemainingAttempts(identifier, 5)).toBe(4);

    rateLimiter.checkLimit(identifier, 5, 1000);
    rateLimiter.checkLimit(identifier, 5, 1000);
    expect(rateLimiter.getRemainingAttempts(identifier, 5)).toBe(2);
  });
});

describe("generateCSPHeader", () => {
  it("should generate valid CSP header string", () => {
    const header = generateCSPHeader();
    expect(header).toBeTruthy();
    expect(typeof header).toBe("string");
  });

  it("should include all CSP directives", () => {
    const header = generateCSPHeader();
    expect(header).toContain("default-src");
    expect(header).toContain("script-src");
    expect(header).toContain("style-src");
    expect(header).toContain("img-src");
    expect(header).toContain("connect-src");
  });

  it("should include frame-ancestors none", () => {
    const header = generateCSPHeader();
    expect(header).toContain("frame-ancestors 'none'");
  });

  it("should include object-src none", () => {
    const header = generateCSPHeader();
    expect(header).toContain("object-src 'none'");
  });
});

describe("SECURITY_HEADERS", () => {
  it("should have all required security headers", () => {
    expect(SECURITY_HEADERS).toHaveProperty("X-Frame-Options");
    expect(SECURITY_HEADERS).toHaveProperty("X-Content-Type-Options");
    expect(SECURITY_HEADERS).toHaveProperty("X-XSS-Protection");
    expect(SECURITY_HEADERS).toHaveProperty("Referrer-Policy");
    expect(SECURITY_HEADERS).toHaveProperty("Permissions-Policy");
    expect(SECURITY_HEADERS).toHaveProperty("Strict-Transport-Security");
  });

  it("should set X-Frame-Options to DENY", () => {
    expect(SECURITY_HEADERS["X-Frame-Options"]).toBe("DENY");
  });

  it("should set X-Content-Type-Options to nosniff", () => {
    expect(SECURITY_HEADERS["X-Content-Type-Options"]).toBe("nosniff");
  });
});

describe("initializeSecurity", () => {
  beforeEach(() => {
    // Clear any existing meta tags
    document.head.innerHTML = "";
  });

  it("should create security meta tags", () => {
    initializeSecurity();

    const xFrameOptions = document.querySelector('meta[http-equiv="X-Frame-Options"]');
    expect(xFrameOptions).toBeTruthy();
    expect(xFrameOptions?.getAttribute("content")).toBe("DENY");
  });

  it("should set all security headers as meta tags", () => {
    initializeSecurity();

    const metaTags = [
      "X-Frame-Options",
      "X-Content-Type-Options",
      "X-XSS-Protection",
      "Referrer-Policy",
    ];

    metaTags.forEach(tag => {
      const meta = document.querySelector(`meta[http-equiv="${tag}"]`);
      expect(meta).toBeTruthy();
    });
  });

  it("should update existing meta tags", () => {
    // Create existing meta tag
    const existingMeta = document.createElement("meta");
    existingMeta.setAttribute("http-equiv", "X-Frame-Options");
    existingMeta.setAttribute("content", "SAMEORIGIN");
    document.head.appendChild(existingMeta);

    initializeSecurity();

    const meta = document.querySelector('meta[http-equiv="X-Frame-Options"]');
    expect(meta?.getAttribute("content")).toBe("DENY");
  });
});

describe("DataEncryptor", () => {
  it("should generate a valid crypto key", async () => {
    const key = await DataEncryptor.generateKey();
    expect(key).toBeTruthy();
    expect(key.type).toBe("secret");
  });

  it("should encrypt and decrypt data successfully", async () => {
    const originalData = "Sensitive information";
    const key = await DataEncryptor.generateKey();

    const { encrypted, iv } = await DataEncryptor.encryptData(originalData, key);
    expect(encrypted).toBeTruthy();
    expect(iv).toBeTruthy();

    const decrypted = await DataEncryptor.decryptData(encrypted, iv, key);
    expect(decrypted).toBe(originalData);
  });

  it("should produce different encrypted output for same input", async () => {
    const data = "Test data";
    const key = await DataEncryptor.generateKey();

    const result1 = await DataEncryptor.encryptData(data, key);
    const result2 = await DataEncryptor.encryptData(data, key);

    // IVs should be different
    expect(result1.iv).not.toEqual(result2.iv);
  });

  it("should export and import keys", async () => {
    const originalKey = await DataEncryptor.generateKey();
    const jwk = await DataEncryptor.exportKey(originalKey);

    expect(jwk).toBeTruthy();
    expect(jwk.kty).toBe("oct");

    const importedKey = await DataEncryptor.importKey(jwk);
    expect(importedKey).toBeTruthy();

    // Verify the key works
    const testData = "Test encryption";
    const { encrypted, iv } = await DataEncryptor.encryptData(testData, originalKey);
    const decrypted = await DataEncryptor.decryptData(encrypted, iv, importedKey);
    expect(decrypted).toBe(testData);
  });
});

describe("SecureStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should store and retrieve data", async () => {
    const key = "test-key";
    const value = "test-value";

    await SecureStorage.setItem(key, value);
    const retrieved = await SecureStorage.getItem(key);

    expect(retrieved).toBe(value);
  });

  it("should return null for non-existent keys", async () => {
    const result = await SecureStorage.getItem("non-existent-key");
    expect(result).toBeNull();
  });

  it("should remove items", async () => {
    const key = "test-key";
    const value = "test-value";

    await SecureStorage.setItem(key, value);
    SecureStorage.removeItem(key);

    const retrieved = await SecureStorage.getItem(key);
    expect(retrieved).toBeNull();
  });

  it("should clear all secure storage items", async () => {
    await SecureStorage.setItem("key1", "value1");
    await SecureStorage.setItem("key2", "value2");

    SecureStorage.clear();

    const value1 = await SecureStorage.getItem("key1");
    const value2 = await SecureStorage.getItem("key2");

    expect(value1).toBeNull();
    expect(value2).toBeNull();
  });

  it("should handle storage with encryption when salt is available", async () => {
    // Mock env variable
    vi.stubEnv("VITE_CLIENT_ENCRYPTION_SALT", "test-salt-value");

    const key = "encrypted-key";
    const value = "sensitive-data";

    await SecureStorage.setItem(key, value);

    // Check that data is stored encrypted (should not be plain text)
    const rawStored = localStorage.getItem("morphoscan_secure_encrypted-key");
    expect(rawStored).toBeTruthy();
    expect(rawStored).not.toContain("sensitive-data");

    // But should decrypt correctly
    const retrieved = await SecureStorage.getItem(key);
    expect(retrieved).toBe(value);

    vi.unstubAllEnvs();
  });

  it("should use prefix for storage keys", async () => {
    const key = "test-key";
    const value = "test-value";

    await SecureStorage.setItem(key, value);

    // Check that localStorage has the prefixed key
    const prefixedKey = "morphoscan_secure_test-key";
    const stored = localStorage.getItem(prefixedKey);
    expect(stored).toBeTruthy();
  });
});
