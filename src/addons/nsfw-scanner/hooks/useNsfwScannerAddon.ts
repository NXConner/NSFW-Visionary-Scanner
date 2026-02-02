import { useEffect, useMemo, useState } from "react";
import { useOptionalDLC, useOptionalDLCFeature } from "@/dlc/context/DLCContext";
import { readNsfwScannerPolicy, writeNsfwScannerPolicy } from "../settings/storage";
import type { NsfwScannerPolicy } from "../scanner/types";

export function useNsfwScannerAddon() {
  const dlc = useOptionalDLC();
  const isAgeVerified = Boolean(dlc?.isAgeVerified);
  const { isAvailable: hasEntitlement, isLoading: dlcLoading } =
    useOptionalDLCFeature("nsfw_scanner_mode");

  const [policy, setPolicy] = useState<NsfwScannerPolicy>(() => readNsfwScannerPolicy());

  useEffect(() => {
    const onChange = () => setPolicy(readNsfwScannerPolicy());
    window.addEventListener("nsfw-scanner-policy-changed", onChange as EventListener);
    return () => window.removeEventListener("nsfw-scanner-policy-changed", onChange as EventListener);
  }, []);

  const isUnlocked = Boolean(hasEntitlement && isAgeVerified);

  const effectivePolicy = useMemo<NsfwScannerPolicy>(() => {
    // Always hard-disable if not unlocked; still keep stored policy for when it becomes available.
    if (!isUnlocked) {
      return { ...policy, enabled: false, allowExplicit: false };
    }
    return policy;
  }, [isUnlocked, policy]);

  const updatePolicy = (next: NsfwScannerPolicy) => {
    setPolicy(next);
    writeNsfwScannerPolicy(next);
  };

  return {
    isUnlocked,
    isAgeVerified,
    hasEntitlement,
    isLoading: dlcLoading,
    policy: effectivePolicy,
    rawPolicy: policy,
    setPolicy: updatePolicy,
  };
}

