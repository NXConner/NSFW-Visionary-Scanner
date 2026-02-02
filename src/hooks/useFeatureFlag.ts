import { useSyncExternalStore } from "react";
import { isFeatureFlagEnabled } from "@/lib/featureFlags";

const subscribe = (onStoreChange: () => void) => {
  if (typeof window === "undefined") return () => {};

  const onStorage = (e: StorageEvent) => {
    if (e.key === "morphoscan_feature_flag_overrides") onStoreChange();
  };
  const onCustom = () => onStoreChange();

  window.addEventListener("storage", onStorage);
  window.addEventListener("feature-flag-overrides-changed", onCustom as EventListener);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener("feature-flag-overrides-changed", onCustom as EventListener);
  };
};

export function useFeatureFlag(flag: string, fallback = false): boolean {
  const value = useSyncExternalStore(
    subscribe,
    () => isFeatureFlagEnabled(flag, fallback),
    () => fallback,
  );
  return typeof value === "boolean" ? value : fallback;
}
