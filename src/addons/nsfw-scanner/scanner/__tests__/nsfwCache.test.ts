import { describe, it, expect, beforeEach, vi } from "vitest";
import { nsfwCache } from "../nsfwCache";
import type { NsfwDetectionResult } from "../types";

describe("nsfwCache", () => {
  const mockResult: NsfwDetectionResult = {
    label: "neutral",
    confidence: 0.95,
    model: "nsfwjs",
    raw: { neutral: 0.95, suggestive: 0.03, explicit: 0.02 },
  };

  const createTestDataUrl = (content: string = "test") => {
    return `data:image/png;base64,${btoa(content)}`;
  };

  beforeEach(() => {
    nsfwCache.clear();
    vi.clearAllMocks();
  });

  describe("get and set", () => {
    it("should store and retrieve cached results", async () => {
      const dataUrl = createTestDataUrl("image1");

      await nsfwCache.set(dataUrl, mockResult);
      const retrieved = await nsfwCache.get(dataUrl);

      expect(retrieved).toEqual(mockResult);
    });

    it("should return null for non-existent cache entries", async () => {
      const dataUrl = createTestDataUrl("nonexistent");
      const result = await nsfwCache.get(dataUrl);

      expect(result).toBeNull();
    });

    it("should handle different images separately", async () => {
      const dataUrl1 = createTestDataUrl("image1");
      const dataUrl2 = createTestDataUrl("image2");

      const result1: NsfwDetectionResult = {
        label: "neutral",
        confidence: 0.95,
        model: "nsfwjs",
      };

      const result2: NsfwDetectionResult = {
        label: "suggestive",
        confidence: 0.75,
        model: "nsfwjs",
      };

      await nsfwCache.set(dataUrl1, result1);
      await nsfwCache.set(dataUrl2, result2);

      const retrieved1 = await nsfwCache.get(dataUrl1);
      const retrieved2 = await nsfwCache.get(dataUrl2);

      expect(retrieved1).toEqual(result1);
      expect(retrieved2).toEqual(result2);
    });

    it("should update existing cache entries", async () => {
      const dataUrl = createTestDataUrl("image1");

      const result1: NsfwDetectionResult = {
        label: "neutral",
        confidence: 0.95,
        model: "nsfwjs",
      };

      const result2: NsfwDetectionResult = {
        label: "suggestive",
        confidence: 0.75,
        model: "nsfwjs",
      };

      await nsfwCache.set(dataUrl, result1);
      await nsfwCache.set(dataUrl, result2);

      const retrieved = await nsfwCache.get(dataUrl);
      expect(retrieved).toEqual(result2);
    });
  });

  describe("expiration", () => {
    it("should return null for expired entries", async () => {
      const dataUrl = createTestDataUrl("expired");

      await nsfwCache.set(dataUrl, mockResult);

      // Mock Date.now to simulate time passing (1 hour + 1 minute)
      const originalDateNow = Date.now;
      const futureTime = Date.now() + 60 * 60 * 1000 + 60 * 1000;
      vi.spyOn(Date, "now").mockReturnValue(futureTime);

      const retrieved = await nsfwCache.get(dataUrl);

      expect(retrieved).toBeNull();

      // Restore Date.now
      vi.spyOn(Date, "now").mockRestore();
    });

    it("should return cached result within expiration time", async () => {
      const dataUrl = createTestDataUrl("fresh");

      await nsfwCache.set(dataUrl, mockResult);

      // Mock Date.now to simulate time passing (30 minutes)
      const futureTime = Date.now() + 30 * 60 * 1000;
      vi.spyOn(Date, "now").mockReturnValue(futureTime);

      const retrieved = await nsfwCache.get(dataUrl);

      expect(retrieved).toEqual(mockResult);

      vi.spyOn(Date, "now").mockRestore();
    });
  });

  describe("LRU eviction", () => {
    it("should evict oldest entries when max size is reached", async () => {
      // Fill cache to max size (100 entries)
      const results: Array<{ dataUrl: string; result: NsfwDetectionResult }> = [];

      for (let i = 0; i < 100; i++) {
        const dataUrl = createTestDataUrl(`image${i}`);
        const result: NsfwDetectionResult = {
          label: "neutral",
          confidence: 0.95,
          model: "nsfwjs",
        };
        results.push({ dataUrl, result });
        await nsfwCache.set(dataUrl, result);
      }

      // Add one more to trigger eviction
      const newDataUrl = createTestDataUrl("new-image");
      const newResult: NsfwDetectionResult = {
        label: "suggestive",
        confidence: 0.75,
        model: "nsfwjs",
      };
      await nsfwCache.set(newDataUrl, newResult);

      // First entry should be evicted
      const firstEntry = await nsfwCache.get(results[0].dataUrl);
      expect(firstEntry).toBeNull();

      // New entry should exist
      const newEntry = await nsfwCache.get(newDataUrl);
      expect(newEntry).toEqual(newResult);

      // Cache size should be at max
      const stats = nsfwCache.getStats();
      expect(stats.size).toBe(100);
    });

    it("should update access order on get", async () => {
      // Add multiple entries
      const dataUrl1 = createTestDataUrl("image1");
      const dataUrl2 = createTestDataUrl("image2");

      await nsfwCache.set(dataUrl1, mockResult);
      await nsfwCache.set(dataUrl2, mockResult);

      // Access first entry to move it to end of access order
      await nsfwCache.get(dataUrl1);

      // Fill cache to max to trigger eviction
      for (let i = 0; i < 99; i++) {
        await nsfwCache.set(createTestDataUrl(`filler${i}`), mockResult);
      }

      // dataUrl2 should be evicted (least recently used)
      const entry2 = await nsfwCache.get(dataUrl2);
      expect(entry2).toBeNull();

      // dataUrl1 should still exist (was accessed more recently)
      const entry1 = await nsfwCache.get(dataUrl1);
      expect(entry1).toEqual(mockResult);
    });
  });

  describe("clear", () => {
    it("should clear all cache entries", async () => {
      await nsfwCache.set(createTestDataUrl("image1"), mockResult);
      await nsfwCache.set(createTestDataUrl("image2"), mockResult);
      await nsfwCache.set(createTestDataUrl("image3"), mockResult);

      nsfwCache.clear();

      const stats = nsfwCache.getStats();
      expect(stats.size).toBe(0);

      const retrieved = await nsfwCache.get(createTestDataUrl("image1"));
      expect(retrieved).toBeNull();
    });
  });

  describe("getStats", () => {
    it("should return correct cache statistics", async () => {
      const stats1 = nsfwCache.getStats();
      expect(stats1.size).toBe(0);
      expect(stats1.maxSize).toBe(100);

      await nsfwCache.set(createTestDataUrl("image1"), mockResult);
      await nsfwCache.set(createTestDataUrl("image2"), mockResult);

      const stats2 = nsfwCache.getStats();
      expect(stats2.size).toBe(2);
      expect(stats2.maxSize).toBe(100);
    });
  });

  describe("edge cases", () => {
    it("should handle invalid data URLs gracefully", async () => {
      const invalidDataUrl = "not-a-valid-data-url";

      await nsfwCache.set(invalidDataUrl, mockResult);
      const retrieved = await nsfwCache.get(invalidDataUrl);

      // Should handle gracefully (likely returns null due to empty hash)
      expect(retrieved).toBeNull();
    });

    it("should handle empty data URLs", async () => {
      const emptyDataUrl = "data:image/png;base64,";

      await nsfwCache.set(emptyDataUrl, mockResult);
      const retrieved = await nsfwCache.get(emptyDataUrl);

      expect(retrieved).toBeNull();
    });

    it("should handle same image content with same hash", async () => {
      const dataUrl1 = createTestDataUrl("same-content");
      const dataUrl2 = createTestDataUrl("same-content");

      await nsfwCache.set(dataUrl1, mockResult);

      // Should retrieve the same result for same content
      const retrieved = await nsfwCache.get(dataUrl2);
      expect(retrieved).toEqual(mockResult);
    });

    it("should handle multiple result types", async () => {
      const neutralResult: NsfwDetectionResult = {
        label: "neutral",
        confidence: 0.95,
        model: "nsfwjs",
      };

      const suggestiveResult: NsfwDetectionResult = {
        label: "suggestive",
        confidence: 0.75,
        model: "nsfwjs",
      };

      const explicitResult: NsfwDetectionResult = {
        label: "explicit",
        confidence: 0.85,
        model: "nsfwjs",
      };

      await nsfwCache.set(createTestDataUrl("neutral"), neutralResult);
      await nsfwCache.set(createTestDataUrl("suggestive"), suggestiveResult);
      await nsfwCache.set(createTestDataUrl("explicit"), explicitResult);

      expect(await nsfwCache.get(createTestDataUrl("neutral"))).toEqual(neutralResult);
      expect(await nsfwCache.get(createTestDataUrl("suggestive"))).toEqual(suggestiveResult);
      expect(await nsfwCache.get(createTestDataUrl("explicit"))).toEqual(explicitResult);
    });
  });

  describe("performance considerations", () => {
    it("should handle rapid cache operations", async () => {
      const operations = [];

      for (let i = 0; i < 50; i++) {
        operations.push(nsfwCache.set(createTestDataUrl(`rapid${i}`), mockResult));
      }

      await Promise.all(operations);

      const stats = nsfwCache.getStats();
      expect(stats.size).toBe(50);
    });

    it("should handle concurrent get operations", async () => {
      const dataUrl = createTestDataUrl("concurrent");
      await nsfwCache.set(dataUrl, mockResult);

      const results = await Promise.all([
        nsfwCache.get(dataUrl),
        nsfwCache.get(dataUrl),
        nsfwCache.get(dataUrl),
        nsfwCache.get(dataUrl),
        nsfwCache.get(dataUrl),
      ]);

      results.forEach(result => {
        expect(result).toEqual(mockResult);
      });
    });
  });
});
