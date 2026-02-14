import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  downloadContentPackage,
  verifyPackageChecksum,
  extractContentPackage,
  getInstalledContentVersion,
  isContentInstalled,
  getInstalledManifest,
  type ContentPackageManifest,
  type ContentFile,
} from "../contentPackage";

// Mock dependencies
vi.mock("../logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock("sonner", () => ({
  toast: {
    info: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("contentPackage", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe("verifyPackageChecksum", () => {
    it("should verify correct checksum", async () => {
      const testData = new TextEncoder().encode("test data");

      // Calculate expected checksum
      const hashBuffer = await crypto.subtle.digest("SHA-256", testData);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const expectedChecksum = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

      const result = await verifyPackageChecksum(testData.buffer, expectedChecksum);
      expect(result).toBe(true);
    });

    it("should reject incorrect checksum", async () => {
      const testData = new TextEncoder().encode("test data");
      const wrongChecksum = "0".repeat(64);

      const result = await verifyPackageChecksum(testData.buffer, wrongChecksum);
      expect(result).toBe(false);
    });

    it("should handle checksum with sha256: prefix", async () => {
      const testData = new TextEncoder().encode("test data");

      const hashBuffer = await crypto.subtle.digest("SHA-256", testData);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const checksum = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

      const result = await verifyPackageChecksum(testData.buffer, `sha256:${checksum}`);
      expect(result).toBe(true);
    });

    it("should normalize checksum case", async () => {
      const testData = new TextEncoder().encode("test data");

      const hashBuffer = await crypto.subtle.digest("SHA-256", testData);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const checksum = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

      const result = await verifyPackageChecksum(testData.buffer, checksum.toUpperCase());
      expect(result).toBe(true);
    });

    it("should handle empty data", async () => {
      const emptyData = new ArrayBuffer(0);
      const emptyChecksum = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

      const result = await verifyPackageChecksum(emptyData, emptyChecksum);
      expect(result).toBe(true);
    });
  });

  describe("extractContentPackage", () => {
    it("should extract valid package", async () => {
      const mockManifest: ContentPackageManifest = {
        version: "1.0.0",
        files: [],
        checksum: "abc123",
        size: 1024,
        releaseDate: "2025-01-01",
        changelog: ["Initial release"],
      };

      const mockFile: ContentFile = {
        path: "images/test.png",
        url: "https://upload.wikimedia.org/wikipedia/commons/c/ce/Icon_for_testing.png",
        checksum: "def456",
        size: 512,
        type: "image",
      };

      const packageData = {
        manifest: mockManifest,
        files: [mockFile],
      };

      const encoded = new TextEncoder().encode(JSON.stringify(packageData));

      const result = await extractContentPackage(encoded.buffer);

      expect(result.success).toBe(true);
      expect(result.manifest).toEqual(mockManifest);
      expect(result.files).toEqual([mockFile]);
    });

    it("should handle invalid package format", async () => {
      const invalidData = new TextEncoder().encode(JSON.stringify({ invalid: true }));

      const result = await extractContentPackage(invalidData.buffer);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should handle malformed JSON", async () => {
      const malformedData = new TextEncoder().encode("not valid json {");

      const result = await extractContentPackage(malformedData.buffer);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should handle empty data", async () => {
      const emptyData = new ArrayBuffer(0);

      const result = await extractContentPackage(emptyData);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("downloadContentPackage", () => {
    it("should download package successfully", async () => {
      const testData = new Uint8Array([1, 2, 3, 4, 5]);
      const mockResponse = {
        ok: true,
        statusText: "OK",
        headers: new Headers({ "content-length": "5" }),
        body: {
          getReader: () => ({
            read: vi
              .fn()
              .mockResolvedValueOnce({ done: false, value: testData })
              .mockResolvedValueOnce({ done: true }),
          }),
        },
      };

      vi.mocked(global.fetch).mockResolvedValue(mockResponse as any);

      const result = await downloadContentPackage("https://downloads.unit.test/package.zip");

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(new Uint8Array(result.data!)).toEqual(testData);
    });

    it("should handle download failure", async () => {
      const mockResponse = {
        ok: false,
        statusText: "Not Found",
      };

      vi.mocked(global.fetch).mockResolvedValue(mockResponse as any);

      const result = await downloadContentPackage("https://downloads.unit.test/package.zip");

      expect(result.success).toBe(false);
      expect(result.error).toContain("Not Found");
    });

    it("should call progress callback", async () => {
      const testData = new Uint8Array([1, 2, 3, 4, 5]);
      const mockResponse = {
        ok: true,
        statusText: "OK",
        headers: new Headers({ "content-length": "5" }),
        body: {
          getReader: () => ({
            read: vi
              .fn()
              .mockResolvedValueOnce({ done: false, value: testData })
              .mockResolvedValueOnce({ done: true }),
          }),
        },
      };

      vi.mocked(global.fetch).mockResolvedValue(mockResponse as any);

      const progressCallback = vi.fn();
      await downloadContentPackage("https://downloads.unit.test/package.zip", progressCallback);

      expect(progressCallback).toHaveBeenCalled();
      expect(progressCallback.mock.calls[0][0]).toBeGreaterThan(0);
    });

    it("should handle missing content-length header", async () => {
      const testData = new Uint8Array([1, 2, 3, 4, 5]);
      const mockResponse = {
        ok: true,
        statusText: "OK",
        headers: new Headers(),
        body: {
          getReader: () => ({
            read: vi
              .fn()
              .mockResolvedValueOnce({ done: false, value: testData })
              .mockResolvedValueOnce({ done: true }),
          }),
        },
      };

      vi.mocked(global.fetch).mockResolvedValue(mockResponse as any);

      const result = await downloadContentPackage("https://downloads.unit.test/package.zip");

      expect(result.success).toBe(true);
    });

    it("should handle network errors", async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error("Network error"));

      const result = await downloadContentPackage("https://downloads.unit.test/package.zip");

      expect(result.success).toBe(false);
      expect(result.error).toContain("Network error");
    });

    it("should handle missing response body", async () => {
      const mockResponse = {
        ok: true,
        statusText: "OK",
        headers: new Headers(),
        body: null,
      };

      vi.mocked(global.fetch).mockResolvedValue(mockResponse as any);

      const result = await downloadContentPackage("https://downloads.unit.test/package.zip");

      expect(result.success).toBe(false);
      expect(result.error).toContain("not readable");
    });

    it("should combine multiple chunks correctly", async () => {
      const chunk1 = new Uint8Array([1, 2, 3]);
      const chunk2 = new Uint8Array([4, 5, 6]);
      const chunk3 = new Uint8Array([7, 8, 9]);

      const mockResponse = {
        ok: true,
        statusText: "OK",
        headers: new Headers({ "content-length": "9" }),
        body: {
          getReader: () => ({
            read: vi
              .fn()
              .mockResolvedValueOnce({ done: false, value: chunk1 })
              .mockResolvedValueOnce({ done: false, value: chunk2 })
              .mockResolvedValueOnce({ done: false, value: chunk3 })
              .mockResolvedValueOnce({ done: true }),
          }),
        },
      };

      vi.mocked(global.fetch).mockResolvedValue(mockResponse as any);

      const result = await downloadContentPackage("https://downloads.unit.test/package.zip");

      expect(result.success).toBe(true);
      expect(new Uint8Array(result.data!)).toEqual(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9]));
    });
  });

  describe("getInstalledContentVersion", () => {
    it("should return installed version", () => {
      const packageId = "test-package";
      const version = "1.2.3";

      localStorage.setItem(`dlc_content_version:${packageId}`, version);

      const result = getInstalledContentVersion(packageId);
      expect(result).toBe(version);
    });

    it("should return null for non-existent package", () => {
      const result = getInstalledContentVersion("non-existent");
      expect(result).toBeNull();
    });

    it("should handle different package IDs separately", () => {
      localStorage.setItem("dlc_content_version:package1", "1.0.0");
      localStorage.setItem("dlc_content_version:package2", "2.0.0");

      expect(getInstalledContentVersion("package1")).toBe("1.0.0");
      expect(getInstalledContentVersion("package2")).toBe("2.0.0");
    });
  });

  describe("isContentInstalled", () => {
    it("should return true for installed content", () => {
      const packageId = "test-package";
      localStorage.setItem(`dlc_content_installed_at:${packageId}`, new Date().toISOString());

      const result = isContentInstalled(packageId);
      expect(result).toBe(true);
    });

    it("should return false for non-installed content", () => {
      const result = isContentInstalled("non-existent");
      expect(result).toBe(false);
    });

    it("should handle different package IDs", () => {
      localStorage.setItem("dlc_content_installed_at:package1", new Date().toISOString());

      expect(isContentInstalled("package1")).toBe(true);
      expect(isContentInstalled("package2")).toBe(false);
    });
  });

  describe("getInstalledManifest", () => {
    it("should return installed manifest", async () => {
      const packageId = "test-package";
      const manifest: ContentPackageManifest = {
        version: "1.0.0",
        files: [],
        checksum: "abc123",
        size: 1024,
        releaseDate: "2025-01-01",
        changelog: ["Initial release"],
      };

      localStorage.setItem(`dlc_content_manifest:${packageId}`, JSON.stringify(manifest));

      const result = await getInstalledManifest(packageId);
      expect(result).toEqual(manifest);
    });

    it("should return null for non-existent manifest", async () => {
      const result = await getInstalledManifest("non-existent");
      expect(result).toBeNull();
    });

    it("should handle malformed JSON gracefully", async () => {
      const packageId = "test-package";
      localStorage.setItem(`dlc_content_manifest:${packageId}`, "not valid json {");

      const result = await getInstalledManifest(packageId);
      expect(result).toBeNull();
    });

    it("should parse complex manifest correctly", async () => {
      const packageId = "test-package";
      const manifest: ContentPackageManifest = {
        version: "2.1.0",
        files: [],
        checksum: "def456",
        size: 2048,
        releaseDate: "2025-02-01",
        changelog: ["Feature 1", "Feature 2", "Bug fix"],
      };

      localStorage.setItem(`dlc_content_manifest:${packageId}`, JSON.stringify(manifest));

      const result = await getInstalledManifest(packageId);
      expect(result).toEqual(manifest);
      expect(result?.changelog).toHaveLength(3);
    });
  });

  describe("edge cases", () => {
    it("should handle concurrent operations", async () => {
      const promises = [];

      for (let i = 0; i < 10; i++) {
        const testData = new TextEncoder().encode(`test data ${i}`);
        const hashBuffer = await crypto.subtle.digest("SHA-256", testData);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const checksum = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

        promises.push(verifyPackageChecksum(testData.buffer, checksum));
      }

      const results = await Promise.all(promises);
      expect(results.every(r => r === true)).toBe(true);
    });

    it("should handle very large package data", async () => {
      const largeData = new Uint8Array(10 * 1024 * 1024); // 10MB
      for (let i = 0; i < largeData.length; i++) {
        largeData[i] = i % 256;
      }

      const hashBuffer = await crypto.subtle.digest("SHA-256", largeData);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const checksum = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

      const result = await verifyPackageChecksum(largeData.buffer, checksum);
      expect(result).toBe(true);
    });

    it("should handle special characters in package IDs", () => {
      const specialIds = [
        "package-with-dashes",
        "package_with_underscores",
        "package.with.dots",
        "package123",
      ];

      specialIds.forEach(id => {
        localStorage.setItem(`dlc_content_version:${id}`, "1.0.0");
        expect(getInstalledContentVersion(id)).toBe("1.0.0");
      });
    });

    it("should handle empty manifest files array", async () => {
      const manifest: ContentPackageManifest = {
        version: "1.0.0",
        files: [],
        checksum: "abc123",
        size: 0,
        releaseDate: "2025-01-01",
        changelog: [],
      };

      const packageData = {
        manifest,
        files: [],
      };

      const encoded = new TextEncoder().encode(JSON.stringify(packageData));
      const result = await extractContentPackage(encoded.buffer);

      expect(result.success).toBe(true);
      expect(result.files).toHaveLength(0);
    });
  });

  describe("localStorage persistence", () => {
    it("should persist version across operations", () => {
      const packageId = "persistent-package";
      const version1 = "1.0.0";
      const version2 = "2.0.0";

      localStorage.setItem(`dlc_content_version:${packageId}`, version1);
      expect(getInstalledContentVersion(packageId)).toBe(version1);

      localStorage.setItem(`dlc_content_version:${packageId}`, version2);
      expect(getInstalledContentVersion(packageId)).toBe(version2);
    });

    it("should handle clearing localStorage", () => {
      const packageId = "test-package";
      localStorage.setItem(`dlc_content_version:${packageId}`, "1.0.0");
      localStorage.setItem(`dlc_content_installed_at:${packageId}`, new Date().toISOString());

      localStorage.clear();

      expect(getInstalledContentVersion(packageId)).toBeNull();
      expect(isContentInstalled(packageId)).toBe(false);
    });
  });
});
