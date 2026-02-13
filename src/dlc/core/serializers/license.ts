import type { DLCLicense, DLCLicenseType } from "../dlcTypes";
import { asBoolean, asDate, asNumber, asString } from "./utils";

function normalizeLicenseType(row: Record<string, unknown>): DLCLicenseType {
  const raw = asString(row.license_type ?? row.licenseType, "").trim().toLowerCase();
  if (raw === "subscription") return "subscription";
  if (raw === "gift") return "gift";
  if (raw === "promo") return "promo";
  return "one_time";
}

export function serializeDLCLicense(row: Record<string, unknown>): DLCLicense {
  const createdAt = asDate(row.created_at ?? row.createdAt) ?? new Date();
  const updatedAt = asDate(row.updated_at ?? row.updatedAt) ?? createdAt;

  const refundedAt = asDate(row.refunded_at ?? row.refundedAt);
  const deactivatedAt = asDate(row.deactivated_at ?? row.deactivatedAt);

  const subscriptionEnd =
    asDate(row.subscription_end ?? row.subscriptionEnd) ??
    asDate(row.expires_at ?? row.expiresAt) ??
    asDate(row.expiration_date ?? row.expirationDate);

  const purchaseDate =
    asDate(row.purchase_date ?? row.purchaseDate) ??
    asDate(row.activated_at ?? row.activatedAt) ??
    createdAt;

  const isActiveFlag = asBoolean(row.is_active ?? row.isActive, true);
  const isActive = isActiveFlag && !refundedAt && !deactivatedAt;

  const packageId = asString(row.package_id ?? row.packageId, "").trim();
  const purchasePriceNumber = asNumber(row.purchase_price ?? row.purchasePrice, NaN);

  return {
    id: asString(row.id, crypto.randomUUID()),
    userId: asString(row.user_id ?? row.userId, ""),
    packageId,

    licenseKey: asString(row.license_key ?? row.licenseKey, "").trim(),
    licenseType: normalizeLicenseType(row),

    purchaseDate,
    purchasePrice: Number.isFinite(purchasePriceNumber) ? purchasePriceNumber : undefined,
    purchaseCurrency: asString(row.purchase_currency ?? row.purchaseCurrency, "").trim() || undefined,
    paymentProvider: asString(row.payment_provider ?? row.paymentProvider, "").trim() || undefined,
    paymentId: asString(row.payment_id ?? row.paymentId, "").trim() || undefined,

    subscriptionStatus:
      asString(row.subscription_status ?? row.subscriptionStatus, "").trim() || undefined,
    subscriptionStart: asDate(row.subscription_start ?? row.subscriptionStart) || undefined,
    subscriptionEnd: subscriptionEnd || undefined,
    subscriptionPauseUntil:
      asDate(row.subscription_pause_until ?? row.subscriptionPauseUntil) || undefined,
    autoRenew: row.auto_renew != null ? asBoolean(row.auto_renew, true) : undefined,

    isActive,
    activatedAt: asDate(row.activated_at ?? row.activatedAt) || undefined,
    deactivatedAt: deactivatedAt || undefined,

    maxDevices: row.max_devices != null ? asNumber(row.max_devices, 3) : undefined,

    offlineCacheExpiresAt:
      asDate(row.offline_cache_expires_at ?? row.offlineCacheExpiresAt) || undefined,
    lastOnlineValidation:
      asDate(row.last_online_validation ?? row.lastOnlineValidation) || undefined,
    gracePeriodUntil: asDate(row.grace_period_until ?? row.gracePeriodUntil) || undefined,

    refundedAt: refundedAt || undefined,
    refundReason: asString(row.refund_reason ?? row.refundReason, "").trim() || undefined,

    createdAt,
    updatedAt,
  };
}

