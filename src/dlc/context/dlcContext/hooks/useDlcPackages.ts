import { useCallback, useMemo } from "react";

import { dlcRegistry } from "@/dlc/core/DLCRegistry";
import type { DLCPackage, DLCStoreState } from "@/dlc/core/types";

export function useDlcPackages(storeState: DLCStoreState | null): {
  packages: DLCPackage[];
  packageById: Map<string, DLCPackage>;
  isAdultPackage: (packageId: string) => boolean;
} {
  // Prefer DB-backed catalog, but always merge registry metadata as a fallback.
  // This prevents "blank package name" UI when an older cached schema is present.
  const packages = useMemo<DLCPackage[]>(() => {
    const registryPackages = dlcRegistry.getAllPackages();
    const regById = new Map(registryPackages.map(p => [p.packageId, p] as const));

    const base =
      storeState?.packages && storeState.packages.length > 0
        ? storeState.packages
        : registryPackages;

    const mergedById = new Map<string, DLCPackage>();
    for (const p of base) {
      const reg = regById.get(p.packageId);
      if (!reg) {
        mergedById.set(p.packageId, p);
        continue;
      }

      const merged: DLCPackage = {
        ...reg,
        ...p,
        packageName:
          p.packageName && p.packageName.trim() && p.packageName.trim() !== p.packageId
            ? p.packageName
            : reg.packageName,
        safeDescription:
          p.safeDescription && p.safeDescription.trim() ? p.safeDescription : reg.safeDescription,
        fullDescription:
          p.fullDescription && p.fullDescription.trim() ? p.fullDescription : reg.fullDescription,
        contentRating: (p.contentRating || reg.contentRating) as DLCPackage["contentRating"],
        features: p.features && p.features.length > 0 ? p.features : reg.features,
      };
      mergedById.set(merged.packageId, merged);
    }

    // Super-admin override and entitlement UI expect a complete catalog (even if DB/cache is partial).
    for (const reg of registryPackages) {
      if (!mergedById.has(reg.packageId)) mergedById.set(reg.packageId, reg);
    }

    return Array.from(mergedById.values())
      .filter(p => p.isActive)
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }, [storeState]);

  const packageById = useMemo(() => {
    const map = new Map<string, DLCPackage>();
    for (const p of packages) map.set(p.packageId, p);
    return map;
  }, [packages]);

  const isAdultPackage = useCallback(
    (packageId: string): boolean => {
      const p = packageById.get(packageId);
      const rating = String(p?.contentRating ?? "");
      return rating === "18+" || rating === "adult" || rating === "mature";
    },
    [packageById],
  );

  return { packages, packageById, isAdultPackage };
}
