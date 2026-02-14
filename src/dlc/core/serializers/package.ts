import type { DLCFeature, DLCPackage, DLCPackageType, DLCPriceType } from "../dlcTypes";
import { asBoolean, asDate, asJson, asNumber, asString, asStringArray } from "./utils";

function normalizePackageType(value: unknown): DLCPackageType {
  const s = asString(value, "individual").trim().toLowerCase();
  if (s === "bundle") return "bundle";
  if (s === "subscription") return "subscription";
  return "individual";
}

function normalizePriceType(value: unknown): DLCPriceType {
  const s = asString(value, "one_time").trim().toLowerCase();
  if (s === "subscription" || s === "recurring") return "subscription";
  return "one_time";
}

function parseFeatures(value: unknown): DLCFeature[] {
  const raw = asJson(value);
  if (!Array.isArray(raw)) return [];
  const out: DLCFeature[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const id = asString(o.id, "").trim();
    const name = asString(o.name, "").trim();
    const description = asString(o.description, "").trim();
    const category = asString(o.category, "").trim();
    if (!id || !name || !category) continue;
    out.push({
      id,
      name,
      description,
      icon: o.icon ? asString(o.icon, undefined as unknown as string) : undefined,
      category: category as any,
    });
  }
  return out;
}

function parseRegionalPricing(value: unknown): Record<string, number> | undefined {
  const raw = asJson(value);
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    const key = asString(k, "").trim().toUpperCase();
    if (!key) continue;
    const num = asNumber(v, NaN);
    if (Number.isFinite(num) && num >= 0) out[key] = num;
  }
  return Object.keys(out).length ? out : undefined;
}

function parseChangelog(value: unknown): Array<{ version: string; changes: string[]; releasedAtIso?: string }> {
  const raw = asJson(value);
  if (!Array.isArray(raw)) return [];
  return raw
    .map(item => {
      if (!item || typeof item !== "object") return null;
      const o = item as Record<string, unknown>;
      const version = asString(o.version, "").trim();
      const changesRaw = o.changes ?? o.items ?? o.entries ?? [];
      const changes = asStringArray(changesRaw);
      if (!version) return null;
      const releasedAtIso = asString(o.releasedAtIso ?? o.released_at ?? o.releasedAt, "").trim();
      return { version, changes, releasedAtIso: releasedAtIso || undefined };
    })
    .filter((x): x is { version: string; changes: string[]; releasedAtIso?: string } => Boolean(x));
}

export function serializeDLCPackage(row: Record<string, unknown>): DLCPackage {
  const packageId = asString(row.package_id ?? row.packageId, "").trim();

  const createdAt = asDate(row.created_at ?? row.createdAt) ?? new Date();
  const updatedAt = asDate(row.updated_at ?? row.updatedAt) ?? createdAt;

  const featuresFromFeatures = parseFeatures(row.features);
  const featuresFromContentItems = parseFeatures(row.content_items ?? row.contentItems);
  const features = featuresFromFeatures.length > 0 ? featuresFromFeatures : featuresFromContentItems;

  const safeDescription = asString(
    row.safe_description ?? row.safeDescription ?? row.description,
    "",
  ).trim();

  const fullDescription = asString(row.full_description ?? row.fullDescription, "").trim() || undefined;

  const nameFromDb = asString(row.package_name ?? row.packageName ?? row.name, "").trim();
  const packageName = nameFromDb || packageId || "DLC Package";

  return {
    id: asString(row.id, crypto.randomUUID()),
    packageId,
    packageName,
    packageType: normalizePackageType(row.package_type ?? row.packageType ?? row.pack_type),

    safeDescription: safeDescription || packageName,
    fullDescription,
    marketingTagline: asString(row.marketing_tagline ?? row.marketingTagline, "").trim() || undefined,

    priceUsd: asNumber(row.price_usd ?? row.priceUsd ?? row.price, 0),
    priceType: normalizePriceType(row.price_type ?? row.priceType),
    subscriptionInterval: (asString(row.subscription_interval ?? row.subscriptionInterval, "").trim() ||
      undefined) as any,
    regionalPricing: parseRegionalPricing(row.regional_pricing ?? row.regionalPricing),

    features: Array.isArray(features) ? features : [],
    includedPackages: asStringArray(row.included_packages ?? row.includedPackages),

    downloadUrl: asString(row.download_url ?? row.downloadUrl, "").trim() || undefined,
    downloadSizeBytes: asNumber(row.download_size_bytes ?? row.downloadSizeBytes, 0) || undefined,
    checksumSha256: asString(row.checksum_sha256 ?? row.checksumSha256, "").trim() || undefined,
    encryptionKeyId: asString(row.encryption_key_id ?? row.encryptionKeyId, "").trim() || undefined,

    version: asString(row.version, "1.0.0").trim() || "1.0.0",
    contentVersion: asString(row.content_version ?? row.contentVersion, "").trim() || undefined,
    minAppVersion: asString(row.min_app_version ?? row.minAppVersion, "").trim() || undefined,
    maxAppVersion: asString(row.max_app_version ?? row.maxAppVersion, "").trim() || undefined,
    contentChangelog: parseChangelog(row.content_changelog ?? row.contentChangelog),

    isActive: asBoolean(row.is_active ?? row.isActive, true),
    isFeatured: asBoolean(row.is_featured ?? row.isFeatured, false),
    displayOrder: asNumber(row.display_order ?? row.displayOrder, 0),
    contentRating: (asString(row.content_rating ?? row.contentRating, "").trim() || undefined) as any,

    previewImages: asStringArray(row.preview_images ?? row.previewImages),
    previewVideoUrl: asString(row.preview_video_url ?? row.previewVideoUrl, "").trim() || undefined,

    localizedNames: (asJson(row.localized_names ?? row.localizedNames) as any) || undefined,
    localizedDescriptions:
      (asJson(row.localized_descriptions ?? row.localizedDescriptions) as any) || undefined,

    stripeProductId: asString(row.stripe_product_id ?? row.stripeProductId, "").trim() || undefined,
    stripePriceId: asString(row.stripe_price_id ?? row.stripePriceId, "").trim() || undefined,

    createdAt,
    updatedAt,
  };
}

