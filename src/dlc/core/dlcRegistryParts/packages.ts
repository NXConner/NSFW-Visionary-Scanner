import type { DLCPackage } from "../types";

/**
 * DLC package catalog (pure data).
 *
 * This module is intentionally dependency-free (no browser/Vite env usage) so it can be
 * imported from Node-based scripts (tsx) like `scripts/validate-dlc-catalog.ts`.
 *
 * The application-level registry (DLCRegistry.ts) can enrich these entries with features/routes.
 */

export type DlcCatalogEntry = Pick<
  DLCPackage,
  "packageId" | "packageName" | "priceUsd" | "priceType" | "packageType" | "subscriptionInterval"
> & {
  isActive?: boolean;
};

export const DLC_PACKAGES: Record<string, DlcCatalogEntry> = {
  "dlc-positions": {
    packageId: "dlc-positions",
    packageName: "Positions Collection",
    priceUsd: 0,
    priceType: "one-time",
    packageType: "individual",
  },
  "dlc-videos": {
    packageId: "dlc-videos",
    packageName: "Video Library",
    priceUsd: 0,
    priceType: "one-time",
    packageType: "individual",
  },
  "dlc-analytics": {
    packageId: "dlc-analytics",
    packageName: "Wellness Analytics",
    priceUsd: 0,
    priceType: "one-time",
    packageType: "individual",
  },
  "dlc-community": {
    packageId: "dlc-community",
    packageName: "Community",
    priceUsd: 0,
    priceType: "one-time",
    packageType: "individual",
  },
  "dlc-advanced": {
    packageId: "dlc-advanced",
    packageName: "Advanced Toolkit",
    priceUsd: 0,
    priceType: "one-time",
    packageType: "bundle",
  },
  "dlc-intimate": {
    packageId: "dlc-intimate",
    packageName: "Intimate Bundle",
    priceUsd: 0,
    priceType: "one-time",
    packageType: "bundle",
  },
  "dlc-creator": {
    packageId: "dlc-creator",
    packageName: "Creator Suite",
    priceUsd: 0,
    priceType: "one-time",
    packageType: "bundle",
  },
  "dlc-complete": {
    packageId: "dlc-complete",
    packageName: "Complete Bundle",
    priceUsd: 0,
    priceType: "one-time",
    packageType: "bundle",
  },
  "dlc-subscription": {
    packageId: "dlc-subscription",
    packageName: "DLC Subscription",
    priceUsd: 0,
    priceType: "subscription",
    packageType: "subscription",
    subscriptionInterval: "monthly",
  },
};
