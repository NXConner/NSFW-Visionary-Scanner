import { supabase } from "@/integrations/supabase/client";
import type { AgeVerification } from "../types";
import { serializeAgeVerification } from "../serializers";
import { CACHE_KEY_AGE_VERIFICATION } from "./cacheKeys";
import { getLocalStorageJson, setLocalStorageJson } from "./storage";

export async function isAgeVerified(): Promise<boolean> {
  // Fast path: local cache
  if (isAgeVerifiedFromCache()) return true;

  // Best-effort DB check for signed-in users (no hard dependency)
  try {
    const getUserPromise = supabase.auth.getUser();
    const timeoutPromise = new Promise<{ data: { user: null } }>((resolve) =>
      setTimeout(() => resolve({ data: { user: null } }), 2000),
    );
    const {
      data: { user },
    } = await Promise.race([getUserPromise, timeoutPromise]);

    if (!user) return false;
     
    const { data, error } = await (supabase as any)
      .from("dlc_age_verifications")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    if (error || !data) return false;

    const verification = serializeAgeVerification(data);
    if (verification.isVerified && verification.adultContentConsent && verification.termsAccepted) {
      saveAgeVerificationToCache(verification);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export async function verifyAge(declaredAge: number, consent: boolean): Promise<boolean> {
  if (declaredAge < 18 || !consent) return false;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id || "anonymous";

  const now = new Date();
  const verification: AgeVerification = {
    id: crypto.randomUUID(),
    userId,
    verifiedAt: now,
    verificationMethod: "self_declared",
    declaredAge,
    isVerified: true,
    termsAccepted: true,
    termsAcceptedAt: now,
    termsVersion: "1.0",
    adultContentConsent: true,
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
  };

  // Persist to DB when authenticated; still cache locally for offline-first behavior.
  try {
    if (user?.id) {
       
      await (supabase as any).from("dlc_age_verifications").upsert(
        {
          user_id: user.id,
          verified_at: now.toISOString(),
          verification_method: "self_declared",
          declared_age: declaredAge,
          is_verified: true,
          terms_accepted: true,
          terms_accepted_at: now.toISOString(),
          terms_version: "1.0",
          adult_content_consent: true,
          user_agent: verification.userAgent ?? null,
        },
        { onConflict: "user_id" },
      );
    }
  } catch {
    // Non-fatal (offline/rls/missing migration). Local cache still enables gating.
  }

  saveAgeVerificationToCache(verification);
  return true;
}

export function saveAgeVerificationToCache(verification: AgeVerification): void {
  try {
    setLocalStorageJson(CACHE_KEY_AGE_VERIFICATION, verification);
    setLocalStorageJson("dlc_age_verified", verification);
  } catch {
    // ignore
  }
}

export function isAgeVerifiedFromCache(): boolean {
  try {
    const verification =
      getLocalStorageJson<AgeVerification>(CACHE_KEY_AGE_VERIFICATION) ||
      getLocalStorageJson<AgeVerification>("dlc_age_verified");
    if (!verification) return false;
    return Boolean(verification.isVerified && verification.adultContentConsent);
  } catch {
    return false;
  }
}
