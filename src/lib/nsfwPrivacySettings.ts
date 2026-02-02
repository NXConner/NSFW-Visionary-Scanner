import { useMemo } from "react";
import { useGenericStorage } from "@/hooks/useGenericStorage";

export type NsfwPrivacyTier = "private" | "partner" | "trusted" | "public";

export type NsfwPrivacySettings = {
  incognitoMode: boolean;
  blurThumbnails: boolean;
  hideTitles: boolean;
  sessionLockEnabled: boolean;
  sessionLockMinutes: number; // 1..120
  requireBiometricIfAvailable: boolean;
  privacyTier: NsfwPrivacyTier;
  panicLockEnabled: boolean;
};

export const DEFAULT_NSFW_PRIVACY_SETTINGS: NsfwPrivacySettings = {
  incognitoMode: false,
  blurThumbnails: true,
  hideTitles: false,
  sessionLockEnabled: false,
  sessionLockMinutes: 10,
  requireBiometricIfAvailable: false,
  privacyTier: "private",
  panicLockEnabled: false,
};

const KEY = "morphoscan_nsfw_privacy_settings_v1";

function normalize(v: NsfwPrivacySettings): NsfwPrivacySettings {
  const minutes = Number(v.sessionLockMinutes);
  const tier = String(v.privacyTier || "private") as NsfwPrivacyTier;
  const allowed: NsfwPrivacyTier[] = ["private", "partner", "trusted", "public"];
  return {
    ...v,
    incognitoMode: Boolean(v.incognitoMode),
    blurThumbnails: Boolean(v.blurThumbnails),
    hideTitles: Boolean(v.hideTitles),
    sessionLockEnabled: Boolean(v.sessionLockEnabled),
    sessionLockMinutes: Math.max(1, Math.min(120, Number.isFinite(minutes) ? minutes : 10)),
    requireBiometricIfAvailable: Boolean(v.requireBiometricIfAvailable),
    privacyTier: allowed.includes(tier) ? tier : "private",
    panicLockEnabled: Boolean(v.panicLockEnabled),
  };
}

export function useNsfwPrivacySettings() {
  const [settingsRaw, setSettingsRaw] = useGenericStorage<NsfwPrivacySettings>(
    KEY,
    DEFAULT_NSFW_PRIVACY_SETTINGS,
  );

  const settings = useMemo(() => normalize(settingsRaw), [settingsRaw]);

  const setSettings = (
    next: NsfwPrivacySettings | ((prev: NsfwPrivacySettings) => NsfwPrivacySettings),
  ) => {
    setSettingsRaw(prev => normalize(typeof next === "function" ? (next as any)(prev) : next));
  };

  return { settings, setSettings };
}
