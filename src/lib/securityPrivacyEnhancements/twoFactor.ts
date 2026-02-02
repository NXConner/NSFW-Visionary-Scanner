import { supabase } from "@/integrations/supabase/client";
import { fromExtended } from "@/lib/supabaseExtensions";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import type { JsonObject, TwoFactorAuthentication, TwoFactorSetupResult } from "./types";
import { generateReadableCodes, sha256Hex } from "./crypto";

async function getUserIdOrThrow(): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
}

async function getLatestTotpFactorId(status: "unverified" | "verified"): Promise<string | null> {
  const { data, error } = await supabase.auth.mfa.listFactors();
  if (error || !data?.all) return null;
  const match = data.all
    .filter(f => f.factor_type === "totp" && f.status === status)
    .sort((a, b) => (a.updated_at || a.created_at).localeCompare(b.updated_at || b.created_at))
    .at(-1);
  return match?.id ?? null;
}

async function upsertTwoFactorRow(
  userId: string,
  patch: Partial<TwoFactorAuthentication> & { method: TwoFactorAuthentication["method"] },
) {
  const now = new Date().toISOString();

  const { error } = await fromExtended("two_factor_authentication").upsert(
    {
      user_id: userId,
      method: patch.method,
      totp_secret_encrypted: patch.totp_secret_encrypted ?? null,
      totp_backup_codes_encrypted: patch.totp_backup_codes_encrypted ?? null,
      phone_number_encrypted: patch.phone_number_encrypted ?? null,
      email_address: patch.email_address ?? null,
      is_enabled: Boolean(patch.is_enabled),
      is_verified: Boolean(patch.is_verified),
      verified_at: patch.verified_at ?? null,
      recovery_codes_encrypted: patch.recovery_codes_encrypted ?? null,
      recovery_codes_used: patch.recovery_codes_used ?? [],
      updated_at: now,
    },
    { onConflict: "user_id,method" },
  );
  if (error) logger.error("Failed to upsert 2FA row", { error: error.message });
}

export async function enable2FA(
  method: TwoFactorAuthentication["method"],
): Promise<TwoFactorSetupResult | null> {
  try {
    const userId = await getUserIdOrThrow();
    if (method !== "totp") {
      toast.error("Only authenticator-app (TOTP) is supported right now.");
      return null;
    }

    const backupCodes = generateReadableCodes(10);
    const recoveryCodes = generateReadableCodes(5);
    const backupHashes = await Promise.all(backupCodes.map(c => sha256Hex(c)));
    const recoveryHashes = await Promise.all(recoveryCodes.map(c => sha256Hex(c)));

    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "Authenticator",
      issuer: "MorphoScan Pro",
    });
    if (error || !data || data.type !== "totp") {
      logger.error("Failed to enroll MFA", { error: error?.message });
      toast.error("Failed to set up 2FA");
      return null;
    }

    await upsertTwoFactorRow(userId, {
      method: "totp",
      is_enabled: false,
      is_verified: false,
      verified_at: null,
      totp_secret_encrypted: null,
      totp_backup_codes_encrypted: backupHashes,
      recovery_codes_encrypted: recoveryHashes,
      recovery_codes_used: [],
    });

    toast.success("2FA setup started. Verify to enable.");
    return {
      qr_code: data.totp?.qr_code,
      secret: data.totp?.secret,
      backup_codes: backupCodes,
      recovery_codes: recoveryCodes,
    };
  } catch (err) {
    logger.error("Error enabling 2FA", { error: err });
    toast.error("Failed to set up 2FA");
    return null;
  }
}

export async function verify2FASetup(
  code: string,
  method: TwoFactorAuthentication["method"] = "totp",
): Promise<boolean> {
  try {
    const userId = await getUserIdOrThrow();
    if (method !== "totp") return false;

    const factorId = await getLatestTotpFactorId("unverified");
    if (!factorId) {
      toast.error("No pending 2FA enrollment found");
      return false;
    }

    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
    if (error) {
      toast.error("Invalid verification code");
      return false;
    }

    await upsertTwoFactorRow(userId, {
      method: "totp",
      is_enabled: true,
      is_verified: true,
      verified_at: new Date().toISOString(),
    });
    toast.success("2FA enabled successfully!");
    return true;
  } catch (err) {
    logger.error("Error verifying 2FA", { error: err });
    toast.error("Verification failed");
    return false;
  }
}

export async function disable2FA(
  method: TwoFactorAuthentication["method"] = "totp",
): Promise<boolean> {
  try {
    const userId = await getUserIdOrThrow();
    if (method !== "totp") return false;

    const factorId = await getLatestTotpFactorId("verified");
    if (factorId) {
      const { error } = await supabase.auth.mfa.unenroll({ factorId });
      if (error) {
        toast.error("Failed to disable 2FA");
        return false;
      }
    }

    await upsertTwoFactorRow(userId, {
      method: "totp",
      is_enabled: false,
      is_verified: false,
      verified_at: null,
    });
    toast.success("2FA disabled");
    return true;
  } catch (err) {
    logger.error("Error disabling 2FA", { error: err });
    toast.error("Failed to disable 2FA");
    return false;
  }
}

export async function verify2FALogin(
  code: string,
  method: TwoFactorAuthentication["method"] = "totp",
): Promise<boolean> {
  return await verify2FA(method, code);
}

export async function verify2FA(method: string, code: string): Promise<boolean> {
  try {
    const userId = await getUserIdOrThrow();
    if (method !== "totp") return false;

    // Allow backup/recovery codes (hashed in DB)
    const hashed = await sha256Hex(code);
    type TwoFactorRow = {
      totp_backup_codes_encrypted: string[] | null;
      recovery_codes_encrypted: string[] | null;
      recovery_codes_used: string[] | null;
    };

    const { data: row } = await fromExtended("two_factor_authentication")
      .select("id, totp_backup_codes_encrypted, recovery_codes_encrypted, recovery_codes_used")
      .eq("user_id", userId)
      .eq("method", "totp")
      .maybeSingle();

    const typed = (row as unknown as TwoFactorRow | null) ?? null;
    const recUsed = typed?.recovery_codes_used ?? [];
    const backup = typed?.totp_backup_codes_encrypted ?? null;
    const recovery = typed?.recovery_codes_encrypted ?? null;

    const isBackup = Boolean(backup?.includes(hashed));
    const isRecovery = Boolean(recovery?.includes(hashed) && !recUsed.includes(hashed));

    if (isBackup || isRecovery) {
      const nextUsed = isRecovery ? [...recUsed, hashed] : recUsed;
      await upsertTwoFactorRow(userId, { method: "totp", recovery_codes_used: nextUsed });
      return true;
    }

    const factorId = await getLatestTotpFactorId("verified");
    if (!factorId) return false;

    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
    if (error) return false;
    return true;
  } catch (err) {
    logger.error("Error verifying 2FA", { error: err });
    return false;
  }
}

export async function get2FAMethods(): Promise<TwoFactorAuthentication[]> {
  try {
    const userId = await getUserIdOrThrow();

    const { data, error } = await fromExtended("two_factor_authentication")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", {
        ascending: false,
      });
    if (error) {
      logger.error("Failed to get 2FA methods", { error: error.message });
      return [];
    }
    return (data || []) as unknown as TwoFactorAuthentication[];
  } catch {
    return [];
  }
}

export async function get2FAStatus(): Promise<TwoFactorAuthentication[]> {
  return await get2FAMethods();
}

export async function is2FARequired(): Promise<boolean> {
  const methods = await get2FAMethods();
  return methods.some(m => m.is_enabled);
}

export async function regenerateBackupCodes(
  method: TwoFactorAuthentication["method"] = "totp",
): Promise<string[] | null> {
  try {
    const userId = await getUserIdOrThrow();
    if (method !== "totp") return null;
    const newCodes = generateReadableCodes(10);
    const hashes = await Promise.all(newCodes.map(c => sha256Hex(c)));
    await upsertTwoFactorRow(userId, { method: "totp", totp_backup_codes_encrypted: hashes });
    toast.success("Backup codes regenerated");
    return newCodes;
  } catch (err) {
    logger.error("Error regenerating backup codes", { error: err });
    toast.error("Failed to regenerate backup codes");
    return null;
  }
}

export async function getAuthenticatorAssuranceLevel(): Promise<JsonObject> {
  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (error) return { error: error.message };
  return data as unknown as JsonObject;
}
