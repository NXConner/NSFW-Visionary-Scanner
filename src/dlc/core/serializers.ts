/**
 * DLC DB Serializers
 * Converts Supabase rows (snake_case) into strongly typed DLC models.
 *
 * These helpers are intentionally schema-tolerant:
 * - Some environments have legacy columns (expiration_date/content_version)
 * - Others use the newer package-based schema
 */
import type {
  AgeVerification,
  AgeVerificationMethod,
  AppUpdateSource,
  ContentChangelogEntry,
  ContentRating,
  DevicePlatform,
  DLCFeature,
  DLCFeatureCategory,
  DLCLicense,
  DLCPackage,
  DLCInstallation,
  DLCPriceType,
  DLCPackageType,
  InstallSource,
  LicenseType,
  SubscriptionInterval,
  SubscriptionStatus,
  UpdateSource,
} from "./types";
import {
  ADVANCED_FEATURES,
  ADVANCED_NSFW_DETECTION_FEATURES,
  ANALYTICS_FEATURES,
  COMMUNITY_FEATURES,
  NSFW_SCANNER_FEATURES,
  POSITIONS_FEATURES,
  TOPICS_LIBRARY_FEATURE,
  TOPIC_PACK_FEATURES,
  VIDEO_FEATURES,
} from "./dlcRegistryParts/features";

type SupabaseRow = Record<string, unknown>;

const asDate = (value: unknown): Date | undefined => {
  if (!value) return undefined;
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? undefined : d;
};

const asNumber = (value: unknown): number | undefined => {
  if (value === null || value === undefined) return undefined;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : undefined;
};

const asBoolean = (value: unknown, fallback: boolean = false): boolean => {
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return fallback;
};

const isRecord = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object";

const asString = (value: unknown, fallback: string = ""): string => {
  if (value === null || value === undefined) return fallback;
  return String(value);
};

const asStringArray = (value: unknown): string[] | undefined => {
  if (!Array.isArray(value)) return undefined;
  const arr = value.map(v => asString(v, "")).filter(Boolean);
  return arr.length ? arr : undefined;
};

const prettifyId = (id: string): string => {
  // "video_library" => "Video Library", "topic-power-dynamics" => "Topic Power Dynamics"
  return id
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, c => c.toUpperCase());
};

const FEATURE_BY_ID: ReadonlyMap<string, DLCFeature> = (() => {
  const all: DLCFeature[] = [
    ...POSITIONS_FEATURES,
    ...VIDEO_FEATURES,
    ...ANALYTICS_FEATURES,
    ...COMMUNITY_FEATURES,
    ...ADVANCED_FEATURES,
    TOPICS_LIBRARY_FEATURE,
    ...Object.values(TOPIC_PACK_FEATURES),
    ...NSFW_SCANNER_FEATURES,
    ...ADVANCED_NSFW_DETECTION_FEATURES,
  ];
  const m = new Map<string, DLCFeature>();
  for (const f of all) m.set(f.id, f);
  return m;
})();

const asNumberRecord = (value: unknown): Record<string, number> | undefined => {
  if (!isRecord(value)) return undefined;
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(value)) {
    const n = asNumber(v);
    if (n !== undefined) out[String(k)] = n;
  }
  return Object.keys(out).length ? out : undefined;
};

const asDLCFeatureCategory = (value: unknown): DLCFeatureCategory => {
  const v = asString(value, "marketplace");
  const allowed: ReadonlySet<DLCFeatureCategory> = new Set([
    "positions",
    "videos",
    "analytics",
    "community",
    "advanced",
    "topics",
    "marketplace",
  ]);
  return (allowed.has(v as DLCFeatureCategory) ? (v as DLCFeatureCategory) : "marketplace");
};

const asContentRating = (value: unknown): ContentRating => {
  const v = asString(value, "18+");
  const allowed: ReadonlySet<ContentRating> = new Set(["18+", "adult", "mature"]);
  return (allowed.has(v as ContentRating) ? (v as ContentRating) : "18+");
};

const asPackageType = (value: unknown): DLCPackageType => {
  const v = asString(value, "individual");
  const allowed: ReadonlySet<DLCPackageType> = new Set(["individual", "bundle", "subscription"]);
  return (allowed.has(v as DLCPackageType) ? (v as DLCPackageType) : "individual");
};

const asPriceType = (value: unknown): DLCPriceType => {
  const v = asString(value, "one_time");
  const allowed: ReadonlySet<DLCPriceType> = new Set(["one_time", "subscription"]);
  return (allowed.has(v as DLCPriceType) ? (v as DLCPriceType) : "one_time");
};

const asSubscriptionInterval = (value: unknown): SubscriptionInterval | undefined => {
  const v = asString(value, "");
  const allowed: ReadonlySet<SubscriptionInterval> = new Set(["monthly", "yearly"]);
  return allowed.has(v as SubscriptionInterval) ? (v as SubscriptionInterval) : undefined;
};

const asInstallSource = (value: unknown): InstallSource => {
  const v = asString(value, "manual");
  const allowed: ReadonlySet<InstallSource> = new Set(["manual", "auto_update", "restore"]);
  return (allowed.has(v as InstallSource) ? (v as InstallSource) : "manual");
};

const asDevicePlatform = (value: unknown): DevicePlatform | undefined => {
  const v = asString(value, "");
  const allowed: ReadonlySet<DevicePlatform> = new Set(["android", "ios", "web"]);
  return allowed.has(v as DevicePlatform) ? (v as DevicePlatform) : undefined;
};

const asLicenseType = (value: unknown): LicenseType => {
  const v = asString(value, "one_time");
  const allowed: ReadonlySet<LicenseType> = new Set(["one_time", "subscription", "gift", "promo"]);
  return (allowed.has(v as LicenseType) ? (v as LicenseType) : "one_time");
};

const asSubscriptionStatus = (value: unknown): SubscriptionStatus | undefined => {
  const v = asString(value, "");
  const allowed: ReadonlySet<SubscriptionStatus> = new Set(["active", "cancelled", "expired", "paused"]);
  return allowed.has(v as SubscriptionStatus) ? (v as SubscriptionStatus) : undefined;
};

const asAgeVerificationMethod = (value: unknown): AgeVerificationMethod => {
  const v = asString(value, "self_declared");
  const allowed: ReadonlySet<AgeVerificationMethod> = new Set(["self_declared", "id_check", "credit_card"]);
  return (allowed.has(v as AgeVerificationMethod) ? (v as AgeVerificationMethod) : "self_declared");
};

const asUpdateSource = (value: unknown): UpdateSource => {
  const v = asString(value, "store");
  const allowed: ReadonlySet<UpdateSource> = new Set(["store", "website"]);
  return (allowed.has(v as UpdateSource) ? (v as UpdateSource) : "store");
};

const asOriginalInstallSource = (
  value: unknown,
): AppUpdateSource["originalInstallSource"] => {
  const v = asString(value, "direct");
  const allowed: ReadonlySet<AppUpdateSource["originalInstallSource"]> = new Set([
    "google_play",
    "app_store",
    "website",
    "direct",
  ]);
  return allowed.has(v as AppUpdateSource["originalInstallSource"])
    ? (v as AppUpdateSource["originalInstallSource"])
    : "direct";
};

const asContentChangelog = (value: unknown): ContentChangelogEntry[] | undefined => {
  if (!Array.isArray(value)) return undefined;
  const items: ContentChangelogEntry[] = [];
  for (const entry of value) {
    if (!isRecord(entry)) continue;
    const version = asString(entry.version, "");
    const date = asString(entry.date, "");
    const changes = Array.isArray(entry.changes)
      ? entry.changes.map(c => asString(c, "")).filter(Boolean)
      : [];
    if (!version) continue;
    items.push({ version, date, changes });
  }
  return items.length ? items : undefined;
};

const asDLCFeature = (value: unknown): DLCFeature | null => {
  // Accept either:
  // - { id, name, description, icon, category } objects (newer schema)
  // - "feature_id" strings (common in legacy dlc_* schemas)
  if (typeof value === "string") {
    const id = value.trim();
    if (!id) return null;
    return (
      FEATURE_BY_ID.get(id) ?? {
        id,
        name: prettifyId(id),
        description: "",
        category: "marketplace",
      }
    );
  }

  if (!isRecord(value)) return null;
  const id = asString(value.id, "");
  if (!id) return null;

  const known = FEATURE_BY_ID.get(id);
  const name = asString(value.name, known?.name ?? id);
  const description = asString(value.description, known?.description ?? "");
  const category = asDLCFeatureCategory(value.category ?? known?.category ?? "marketplace");
  const icon = value.icon ? asString(value.icon, "") : known?.icon;

  return { id, name, description, icon, category };
};

export const serializeDLCPackage = (row: SupabaseRow): DLCPackage => {
  const featuresRaw = Array.isArray(row.features) ? row.features : [];
  const features: DLCFeature[] = (featuresRaw as unknown[])
    .map(asDLCFeature)
    .filter((f): f is DLCFeature => Boolean(f));

  // Support both "new" package schema and legacy dlc_* schemas.
  // Supabase environments may have:
  // - dlc_packages: { package_id, name, description, price, currency, pack_type, features(json) }
  // - dlc_packs:    { package_id, pack_name, description, price, content_rating, features(json) }
  // - newer schema: { package_id, package_name, safe_description, price_usd, price_type, ... }
  const packageId = asString(row.package_id ?? (row as SupabaseRow).packageId, "");
  const packageName =
    asString(row.package_name, "") ||
    asString((row as SupabaseRow).pack_name, "") ||
    asString((row as SupabaseRow).name, "") ||
    packageId;

  const packageType = asPackageType(row.package_type ?? (row as SupabaseRow).pack_type);
  const priceUsd = asNumber(row.price_usd) ?? asNumber((row as SupabaseRow).price) ?? 0;
  const priceType = asPriceType(
    row.price_type ?? (packageType === "subscription" ? "subscription" : "one_time"),
  );

  const safeDescription =
    asString(row.safe_description, "") ||
    asString((row as SupabaseRow).preview_description, "") ||
    asString((row as SupabaseRow).description, "");

  const fullDescription =
    row.full_description
      ? asString(row.full_description)
      : (row as SupabaseRow).fullDescription
        ? asString((row as SupabaseRow).fullDescription)
        : undefined;

  // If DB schema stores feature IDs (string[]) instead of full objects,
  // the enhanced `asDLCFeature` above will populate them.
  // Some legacy schemas store IDs under alternate column names.
  const featureIdsFallback =
    asStringArray((row as SupabaseRow).feature_ids) ?? asStringArray((row as SupabaseRow).featureIds);
  const mergedFeatures =
    features.length > 0
      ? features
      : (featureIdsFallback || [])
          .map(id => asDLCFeature(id))
          .filter((f): f is DLCFeature => Boolean(f));

  return {
    id: asString(row.id),
    packageId,
    packageName,
    packageType,
    safeDescription,
    fullDescription,
    marketingTagline: row.marketing_tagline ? asString(row.marketing_tagline) : undefined,
    priceUsd,
    priceType,
    subscriptionInterval: asSubscriptionInterval(row.subscription_interval),
    regionalPricing: asNumberRecord(row.regional_pricing),
    features: mergedFeatures,
    includedPackages: asStringArray(row.included_packages),
    downloadUrl: row.download_url ? asString(row.download_url) : undefined,
    downloadSizeBytes: asNumber(row.download_size_bytes),
    checksumSha256: row.checksum_sha256 ? asString(row.checksum_sha256) : undefined,
    encryptionKeyId: row.encryption_key_id ? asString(row.encryption_key_id) : undefined,
    version: asString(row.version, "1.0.0"),
    contentVersion: asString(row.content_version, "1.0.0"),
    minAppVersion: row.min_app_version ? asString(row.min_app_version) : undefined,
    maxAppVersion: row.max_app_version ? asString(row.max_app_version) : undefined,
    contentChangelog: asContentChangelog(row.content_changelog),
    isActive: asBoolean(row.is_active, true),
    isFeatured: asBoolean(row.is_featured, false),
    displayOrder: asNumber(row.display_order) ?? 0,
    contentRating: asContentRating((row as SupabaseRow).content_rating),
    previewImages: asStringArray(row.preview_images),
    previewVideoUrl: row.preview_video_url ? asString(row.preview_video_url) : undefined,
    localizedNames: isRecord(row.localized_names) ? (row.localized_names as Record<string, string>) : undefined,
    localizedDescriptions: isRecord(row.localized_descriptions)
      ? (row.localized_descriptions as Record<string, string>)
      : undefined,
    createdAt: asDate(row.created_at) ?? new Date(0),
    updatedAt: asDate(row.updated_at) ?? new Date(0),
  };
};

export const serializeDLCLicense = (row: SupabaseRow): DLCLicense => ({
  id: asString(row.id),
  userId: asString(row.user_id),
  packageId: asString(row.package_id ?? (row as SupabaseRow).packageId ?? ""),
  licenseKey: asString(row.license_key),
  licenseType: asLicenseType(row.license_type ?? (row as SupabaseRow).licenseType),
  purchaseDate: asDate(row.purchase_date) ?? new Date(),
  purchasePrice: asNumber(row.purchase_price),
  purchaseCurrency: asString(row.purchase_currency, "USD"),
  paymentProvider: row.payment_provider ? asString(row.payment_provider) : undefined,
  paymentId: row.payment_id ? asString(row.payment_id) : undefined,
  subscriptionStatus: asSubscriptionStatus(row.subscription_status),
  subscriptionStart: asDate(row.subscription_start),
  subscriptionEnd: asDate(row.subscription_end) ?? asDate(row.expiration_date),
  subscriptionPauseUntil: asDate(row.subscription_pause_until),
  autoRenew: asBoolean(row.auto_renew, true),
  isActive: asBoolean(row.is_active, true),
  activatedAt: asDate(row.activated_at),
  deactivatedAt: asDate(row.deactivated_at),
  maxDevices: asNumber(row.max_devices) ?? 3,
  offlineCacheExpiresAt: asDate(row.offline_cache_expires_at),
  lastOnlineValidation: asDate(row.last_online_validation),
  gracePeriodUntil: asDate(row.grace_period_until),
  refundedAt: asDate(row.refunded_at),
  refundReason: row.refund_reason ? asString(row.refund_reason) : undefined,
  createdAt: asDate(row.created_at) ?? new Date(),
  updatedAt: asDate(row.updated_at) ?? new Date(),
});

export const serializeDLCInstallation = (row: SupabaseRow): DLCInstallation => {
  const validPlatform = asDevicePlatform(row.device_platform);
  return {
    id: asString(row.id),
    userId: asString(row.user_id),
    licenseId: asString(row.license_id),
    packageId: asString(row.package_id),
    deviceId: asString(row.device_id),
    installedVersion: asString(row.installed_version ?? (row as SupabaseRow).installedVersion, "1.0.0"),
    contentVersion: row.content_version ? asString(row.content_version) : undefined,
    installDate: asDate(row.install_date) ?? new Date(),
    installSource: asInstallSource(row.install_source),
    devicePlatform: validPlatform,
    deviceModel: row.device_model ? asString(row.device_model) : undefined,
    appVersion: row.app_version ? asString(row.app_version) : undefined,
    storageUsedBytes: asNumber(row.storage_used_bytes),
    cachedContentBytes: asNumber(row.cached_content_bytes),
    isInstalled: asBoolean(row.is_installed, true),
    isCorrupted: asBoolean(row.is_corrupted, false),
    lastIntegrityCheck: asDate(row.last_integrity_check),
    lastUsedAt: asDate(row.last_used_at),
    createdAt: asDate(row.created_at) ?? new Date(),
    updatedAt: asDate(row.updated_at) ?? new Date(),
  };
};

export const serializeAgeVerification = (row: SupabaseRow): AgeVerification => ({
  id: asString(row.id),
  userId: asString(row.user_id),
  verifiedAt: asDate(row.verified_at) ?? new Date(),
  verificationMethod: asAgeVerificationMethod(row.verification_method),
  declaredAge: asNumber(row.declared_age),
  dateOfBirth: asDate(row.date_of_birth),
  isVerified: asBoolean(row.is_verified, false),
  termsAccepted: asBoolean(row.terms_accepted, false),
  termsAcceptedAt: asDate(row.terms_accepted_at),
  termsVersion: row.terms_version ? asString(row.terms_version) : undefined,
  adultContentConsent: asBoolean(row.adult_content_consent, false),
  ipAddress: row.ip_address ? asString(row.ip_address) : undefined,
  userAgent: row.user_agent ? asString(row.user_agent) : undefined,
  countryCode: row.country_code ? asString(row.country_code) : undefined,
});

export const serializeUpdateSource = (row: SupabaseRow): AppUpdateSource => ({
  userId: asString(row.user_id),
  deviceId: asString(row.device_id),
  originalInstallSource: asOriginalInstallSource(row.original_install_source),
  currentUpdateSource: asUpdateSource(row.current_update_source),
  sourceChangedAt: asDate(row.source_changed_at),
  sourceChangeReason: row.source_change_reason ? asString(row.source_change_reason) : undefined,
  currentAppVersion: row.current_app_version ? asString(row.current_app_version) : undefined,
  lastUpdateCheck: asDate(row.last_update_check),
  lastUpdateInstalled: asDate(row.last_update_installed),
  availableUpdateVersion: row.available_update_version ? asString(row.available_update_version) : undefined,
  updateSourceAcknowledged: asBoolean(row.update_source_acknowledged, false),
  acknowledgedAt: asDate(row.acknowledged_at),
});

