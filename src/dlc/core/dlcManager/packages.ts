import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import type { DLCPackage, DLCRegistry } from "../types";
import { CACHE_KEY_PACKAGES } from "./cacheKeys";
import { getLocalStorageJson, reviveDates, setLocalStorageJson } from "./storage";
import { serializeDLCPackage } from "../serializers";

function normalizeCachedPackage(raw: unknown): DLCPackage | null {
  if (!raw || typeof raw !== "object") return null;
  const pkg = raw as Record<string, unknown>;

  const packageId = String((pkg.packageId ?? pkg.package_id ?? pkg.id ?? "") as string).trim();
  if (!packageId) return null;

  const packageName =
    String((pkg.packageName ?? pkg.package_name ?? pkg.name ?? pkg.pack_name ?? packageId) as string)
      .trim() || packageId;

  // Legacy caches sometimes stored snake_case keys or omitted newer fields.
  // We normalize only the minimum required for correct UI entitlement display.
  const safeDescription = String((pkg.safeDescription ?? pkg.safe_description ?? pkg.description ?? "") as string);

  // contentRating used for NSFW gating + package list filtering
  const contentRatingRaw = String((pkg.contentRating ?? pkg.content_rating ?? "18+") as string).trim();
  const contentRating =
    contentRatingRaw === "adult" || contentRatingRaw === "mature" || contentRatingRaw === "18+"
      ? (contentRatingRaw as DLCPackage["contentRating"])
      : ("18+" as DLCPackage["contentRating"]);

  // Ensure dates are revived for downstream sorting/serialization stability.
  reviveDates(pkg, ["createdAt", "updatedAt", "created_at", "updated_at"]);

  // Prefer existing values; fill missing fields with safe fallbacks.
  const normalized = {
    ...(raw as DLCPackage),
    packageId,
    packageName,
    safeDescription,
    contentRating,
    // Keep createdAt/updatedAt as Dates when possible
    createdAt:
      (pkg.createdAt instanceof Date
        ? (pkg.createdAt as Date)
        : pkg.created_at instanceof Date
          ? (pkg.created_at as Date)
          : (raw as any).createdAt) ?? new Date(0),
    updatedAt:
      (pkg.updatedAt instanceof Date
        ? (pkg.updatedAt as Date)
        : pkg.updated_at instanceof Date
          ? (pkg.updated_at as Date)
          : (raw as any).updatedAt) ?? new Date(0),
  } as DLCPackage;

  // Hard fallback to prevent blank badges (reported in NSFW Add-ons enabled packages list)
  if (!normalized.packageName || !normalized.packageName.trim()) {
    normalized.packageName = normalized.packageId;
  }
  if (!normalized.safeDescription || !normalized.safeDescription.trim()) {
    normalized.safeDescription = "";
  }

  return normalized;
}

export function getAvailablePackages(
  registry: DLCRegistry,
  packages: Map<string, DLCPackage>,
): DLCPackage[] {
  // Important: `packages` may be populated from localStorage cache before the DB fetch completes.
  // If the cache is stale, it can *hide* newer registry/DB packages unless we merge.
  // Strategy:
  // - Start with registry (fallback + newest known-in-code catalog)
  // - Overlay cached/DB rows (source of truth when present)
  // - Return active packages ordered by displayOrder
  const merged = new Map<string, DLCPackage>();

  for (const pkg of registry.getAllPackages()) {
    merged.set(pkg.packageId, pkg);
  }

  for (const pkg of Array.from(packages.values())) {
    merged.set(pkg.packageId, pkg);
  }

  return Array.from(merged.values())
    .filter(p => p.isActive)
    .sort((a, b) => a.displayOrder - b.displayOrder);
}

export function getFeaturedPackages(
  registry: DLCRegistry,
  packages: Map<string, DLCPackage>,
): DLCPackage[] {
  const available = getAvailablePackages(registry, packages);
  const featured = available.filter(p => p.isFeatured);
  if (featured.length > 0) return featured;
  return registry.getFeaturedPackages();
}

export function getPackage(
  registry: DLCRegistry,
  packages: Map<string, DLCPackage>,
  packageId: string,
): DLCPackage | undefined {
  return packages.get(packageId) || registry.getPackage(packageId);
}

export async function loadPackages(
  registry: DLCRegistry,
  packages: Map<string, DLCPackage>,
): Promise<void> {
  packages.clear();
  loadPackagesFromCache(packages);

  try {
    // dlc_packages is publicly readable (RLS: anyone can view active)
    // Use timeout to avoid blocking first paint in degraded network states.
    const timeoutPromise = new Promise<{ data: any[] | null; error: { message: string } | null }>(
      (resolve) => setTimeout(() => resolve({ data: null, error: { message: "timeout" } }), 2500),
    );
     
    const queryPromise = (supabase as any)
      .from("dlc_packages")
      .select("*")
      .eq("is_active", true);
    const { data, error } = await Promise.race([queryPromise, timeoutPromise]);

    if (error || !data) {
      if (packages.size > 0) {
        logger.warn("DLCManager: Using cached packages (DB unavailable)", { error: error?.message });
        return;
      }
      logger.warn("DLCManager: Package DB unavailable, falling back to registry", {
        error: error?.message,
      });
      registry.getAllPackages().forEach((pkg) => packages.set(pkg.packageId, pkg));
      return;
    }

    for (const row of data) {
      const pkg = serializeDLCPackage(row);
      packages.set(pkg.packageId, pkg);
    }

    savePackagesToCache(packages);
    logger.info(`DLCManager: Loaded ${packages.size} packages from DB`);
    return;
  } catch (error) {
    logger.warn("DLCManager: Failed to load packages from DB", { error });
  }

  if (packages.size === 0) {
    registry.getAllPackages().forEach((pkg) => packages.set(pkg.packageId, pkg));
  }

  logger.info(`DLCManager: Loaded ${packages.size} packages`);
}

export function savePackagesToCache(packages: Map<string, DLCPackage>): void {
  try {
    setLocalStorageJson(CACHE_KEY_PACKAGES, Array.from(packages.values()));
  } catch {
    // ignore
  }
}

export function loadPackagesFromCache(packages: Map<string, DLCPackage>): void {
  try {
    const stored = getLocalStorageJson<unknown[]>(CACHE_KEY_PACKAGES);
    if (!stored) return;
    let didNormalize = false;
    const normalizedForCache: DLCPackage[] = [];

    for (const raw of stored) {
      const normalized = normalizeCachedPackage(raw);
      if (!normalized) continue;
      // Detect if cache entry was missing critical fields
      const rawAny = raw as any;
      if (
        !rawAny?.packageName ||
        !String(rawAny.packageName).trim() ||
        rawAny?.packageName === rawAny?.packageId ||
        !rawAny?.contentRating
      ) {
        didNormalize = true;
      }
      packages.set(normalized.packageId, normalized);
      normalizedForCache.push(normalized);
    }

    // Write back a normalized cache to prevent persistent blank UI labels.
    if (didNormalize && normalizedForCache.length > 0) {
      try {
        setLocalStorageJson(CACHE_KEY_PACKAGES, normalizedForCache);
      } catch {
        // ignore
      }
    }
  } catch {
    // ignore
  }
}
