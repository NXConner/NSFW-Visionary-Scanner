import type { AgeVerification } from "../dlcTypes";
import { asBoolean, asDate, asNumber, asString } from "./utils";

export function serializeAgeVerification(row: Record<string, unknown>): AgeVerification {
  const verifiedAt = asDate(row.verified_at ?? row.verifiedAt) ?? new Date();
  return {
    id: asString(row.id, crypto.randomUUID()),
    userId: asString(row.user_id ?? row.userId, ""),
    verifiedAt,
    expiresAt: asDate(row.expires_at ?? row.expiresAt) || undefined,
    verificationMethod: asString(row.verification_method ?? row.verificationMethod, "self_declared"),
    declaredAge: row.declared_age != null ? asNumber(row.declared_age, 0) : undefined,
    termsAccepted: asBoolean(row.terms_accepted ?? row.termsAccepted, false),
    termsAcceptedAt: asDate(row.terms_accepted_at ?? row.termsAcceptedAt) || undefined,
    termsVersion: asString(row.terms_version ?? row.termsVersion, "").trim() || undefined,
    adultContentConsent: asBoolean(row.adult_content_consent ?? row.adultContentConsent, false),
    ipAddress: asString(row.ip_address ?? row.ipAddress, "").trim() || undefined,
    userAgent: asString(row.user_agent ?? row.userAgent, "").trim() || undefined,
  };
}

