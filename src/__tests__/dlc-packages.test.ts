import { describe, it, expect } from "vitest";
import {
  newDLCPackages,
  getDLCPackage,
  getDLCPackagesByCategory,
  getTotalRevenueProjection,
} from "@/lib/dlc-packages";

describe("DLC Packages", () => {
  describe("newDLCPackages", () => {
    it("should have 6 DLC packages", () => {
      expect(newDLCPackages).toHaveLength(6);
    });

    it("should have unique IDs", () => {
      const ids = newDLCPackages.map(pkg => pkg.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it("should have all required fields", () => {
      newDLCPackages.forEach(pkg => {
        expect(pkg).toHaveProperty("id");
        expect(pkg).toHaveProperty("name");
        expect(pkg).toHaveProperty("description");
        expect(pkg).toHaveProperty("price");
        expect(pkg).toHaveProperty("billingPeriod");
        expect(pkg).toHaveProperty("icon");
        expect(pkg).toHaveProperty("features");
        expect(pkg).toHaveProperty("category");
      });
    });

    it("should have at least 5 features per package", () => {
      newDLCPackages.forEach(pkg => {
        expect(pkg.features.length).toBeGreaterThanOrEqual(5);
      });
    });

    it("should mark all packages as new", () => {
      newDLCPackages.forEach(pkg => {
        expect(pkg.isNew).toBe(true);
      });
    });
  });

  describe("getDLCPackage", () => {
    it("should return package by ID", () => {
      const pkg = getDLCPackage("premium-positions");
      expect(pkg).toBeDefined();
      expect(pkg?.name).toBe("Premium Position Collections");
    });

    it("should return undefined for non-existent ID", () => {
      const pkg = getDLCPackage("non-existent");
      expect(pkg).toBeUndefined();
    });
  });

  describe("getDLCPackagesByCategory", () => {
    it("should return packages by category", () => {
      const premiumPackages = getDLCPackagesByCategory("premium");
      expect(premiumPackages.length).toBeGreaterThan(0);
      premiumPackages.forEach(pkg => {
        expect(pkg.category).toBe("premium");
      });
    });

    it("should return professional packages", () => {
      const professionalPackages = getDLCPackagesByCategory("professional");
      expect(professionalPackages.length).toBe(3); // Partner Sync, Wellness Coaching, Medical Export
    });

    it("should return research packages", () => {
      const researchPackages = getDLCPackagesByCategory("research");
      expect(researchPackages.length).toBe(1); // Research Participation
    });
  });

  describe("getTotalRevenueProjection", () => {
    it("should return min and max revenue projections", () => {
      const projection = getTotalRevenueProjection();
      expect(projection).toHaveProperty("min");
      expect(projection).toHaveProperty("max");
      expect(projection.min).toBe(55);
      expect(projection.max).toBe(110);
    });
  });

  describe("Pricing validation", () => {
    it("should have increasing prices for higher tiers", () => {
      const premiumPositions = getDLCPackage("premium-positions");
      const advancedNSFW = getDLCPackage("advanced-nsfw-detection");
      const wellnessCoaching = getDLCPackage("wellness-coaching-ai");
      const partnerSync = getDLCPackage("partner-sync");
      const medicalExport = getDLCPackage("medical-export");

      expect(premiumPositions?.price).toBe(9.99);
      expect(advancedNSFW?.price).toBe(14.99);
      expect(wellnessCoaching?.price).toBe(19.99);
      expect(partnerSync?.price).toBe(24.99);
      expect(medicalExport?.price).toBe(29.99);
    });

    it("should have research participation as free", () => {
      const researchParticipation = getDLCPackage("research-participation");
      expect(researchParticipation?.price).toBe(0);
      expect(researchParticipation?.billingPeriod).toBe("free");
    });
  });

  describe("Stripe price ID validation", () => {
    it("should have stripe price IDs defined for paid packages", () => {
      const paidPackages = newDLCPackages.filter(pkg => pkg.price > 0);
      paidPackages.forEach(pkg => {
        // In test environment, these are undefined (expected)
        // In production with .env.local, they should be strings
        expect(pkg).toHaveProperty("stripePriceIdMonthly");
        expect(pkg).toHaveProperty("stripePriceIdYearly");
        // Only test the type if the value exists (production environment)
        if (pkg.stripePriceIdMonthly) {
          expect(typeof pkg.stripePriceIdMonthly).toBe("string");
        }
      });
    });
  });
});
