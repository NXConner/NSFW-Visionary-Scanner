import { useEffect, useMemo, useState } from "react";
import { useOptionalDLC, useOptionalDLCFeature } from "@/dlc/context/DLCContext";
import {
  readAdvancedNsfwDetectionPolicy,
  writeAdvancedNsfwDetectionPolicy,
} from "../settings/storage";
import type { AdvancedNsfwDetectionPolicy } from "../types";

export function useAdvancedNsfwDetectionAddon() {
  const dlc = useOptionalDLC();
  const isAgeVerified = Boolean(dlc?.isAgeVerified);
  const { isAvailable: hasEntitlement, isLoading } =
    useOptionalDLCFeature("advanced_nsfw_detection");

  const [policy, setPolicy] = useState<AdvancedNsfwDetectionPolicy>(() =>
    readAdvancedNsfwDetectionPolicy(),
  );

  useEffect(() => {
    const onChange = () => setPolicy(readAdvancedNsfwDetectionPolicy());
    window.addEventListener("nsfw-advanced-detection-policy-changed", onChange as EventListener);
    return () =>
      window.removeEventListener(
        "nsfw-advanced-detection-policy-changed",
        onChange as EventListener,
      );
  }, []);

  const isUnlocked = Boolean(hasEntitlement && isAgeVerified);

  const effectivePolicy = useMemo<AdvancedNsfwDetectionPolicy>(() => {
    if (!isUnlocked) {
      // Never allow advanced mode when not entitled/age verified.
      return {
        ...policy,
        enabled: false,
        storeDetectionHistory: false,
        enableComparisonMode: false,
      };
    }
    return policy;
  }, [isUnlocked, policy]);

  const updatePolicy = (next: AdvancedNsfwDetectionPolicy) => {
    setPolicy(next);
    writeAdvancedNsfwDetectionPolicy(next);
  };

  return {
    isUnlocked,
    isAgeVerified,
    hasEntitlement,
    isLoading,
    policy: effectivePolicy,
    rawPolicy: policy,
    setPolicy: updatePolicy,
  };
}
