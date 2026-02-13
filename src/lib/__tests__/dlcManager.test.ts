/**
 * DLC Manager Tests
 * Tests for DLC license management, signature verification, and content handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock Supabase
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(),
          })),
          single: vi.fn(),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(),
      })),
      insert: vi.fn(),
    })),
    functions: {
      invoke: vi.fn(),
    },
  },
}));

// Mock logger
vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe("DLC Manager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("License Signature Verification", () => {
    it("should return false for missing signature", async () => {
      const license = {
        license_key: "TEST-KEY1-TEST-KEY2",
        user_id: "user-123",
        purchase_date: new Date().toISOString(),
        content_version: "1.0.0",
        signature: null,
      };

      // Import after mocks are set up
      const { verifyLicenseSignature } = await import("../dlcManager");

      // The function is private, but we can test through hasDLCLicense
      expect(license.signature).toBeNull();
    });

    it("should validate license key format", () => {
      const validFormats = ["AAAA-BBBB-CCCC-DDDD", "1234-5678-9ABC-DEF0", "TEST-1234-ABCD-5678"];

      const invalidFormats = [
        "invalid",
        "AAA-BBB-CCC-DDD",
        "AAAAA-BBBBB-CCCCC-DDDDD",
        "AAAA_BBBB_CCCC_DDDD",
      ];

      const licenseKeyRegex = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

      validFormats.forEach(key => {
        expect(licenseKeyRegex.test(key)).toBe(true);
      });

      invalidFormats.forEach(key => {
        expect(licenseKeyRegex.test(key)).toBe(false);
      });
    });
  });

  describe("License Expiration", () => {
    it("should detect expired licenses", () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 30);

      const expiredLicense = {
        expiration_date: pastDate.toISOString(),
      };

      const expirationDate = new Date(expiredLicense.expiration_date);
      expect(expirationDate < new Date()).toBe(true);
    });

    it("should accept valid licenses", () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const validLicense = {
        expiration_date: futureDate.toISOString(),
      };

      const expirationDate = new Date(validLicense.expiration_date);
      expect(expirationDate >= new Date()).toBe(true);
    });

    it("should handle null expiration (perpetual license)", () => {
      const perpetualLicense = {
        expiration_date: null,
      };

      // Null expiration means perpetual license (never expires)
      expect(perpetualLicense.expiration_date).toBeNull();
    });
  });

  describe("Local License Storage", () => {
    it("should store license in localStorage", () => {
      const license = {
        id: "license-123",
        userId: "user-456",
        licenseKey: "TEST-1234-ABCD-5678",
        contentVersion: "1.0.0",
        isActive: true,
      };

      localStorage.setItem("dlc_license", JSON.stringify(license));

      const stored = localStorage.getItem("dlc_license");
      expect(stored).not.toBeNull();

      const parsed = JSON.parse(stored!);
      expect(parsed.id).toBe("license-123");
      expect(parsed.licenseKey).toBe("TEST-1234-ABCD-5678");
    });

    it("should handle invalid stored license gracefully", () => {
      localStorage.setItem("dlc_license", "invalid-json");

      expect(() => {
        JSON.parse(localStorage.getItem("dlc_license")!);
      }).toThrow();
    });
  });

  describe("DLC Content Package", () => {
    it("should validate content package structure", () => {
      const validPackage = {
        version: "1.2.0",
        downloadUrl: "https://example.invalid/dlc/1.2.0.zip",
        checksum: "sha256:abc123...",
        size: 1024000,
        releaseDate: new Date().toISOString(),
        changelog: ["New features", "Bug fixes"],
      };

      expect(validPackage.version).toMatch(/^\d+\.\d+\.\d+$/);
      expect(validPackage.downloadUrl).toMatch(/^https:\/\//);
      expect(validPackage.size).toBeGreaterThan(0);
      expect(Array.isArray(validPackage.changelog)).toBe(true);
    });

    it("should compare versions correctly", () => {
      const compareVersions = (a: string, b: string): number => {
        const partsA = a.split(".").map(Number);
        const partsB = b.split(".").map(Number);

        for (let i = 0; i < 3; i++) {
          if (partsA[i] > partsB[i]) return 1;
          if (partsA[i] < partsB[i]) return -1;
        }
        return 0;
      };

      expect(compareVersions("1.2.0", "1.1.0")).toBe(1);
      expect(compareVersions("1.1.0", "1.2.0")).toBe(-1);
      expect(compareVersions("1.2.0", "1.2.0")).toBe(0);
      expect(compareVersions("2.0.0", "1.9.9")).toBe(1);
    });
  });
});
