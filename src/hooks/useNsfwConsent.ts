import { useCallback, useMemo, useState } from "react";
import {
  fetchActiveConsentPolicies,
  fetchUserConsentEvents,
  recordConsent,
  type NsfwConsentPolicy,
} from "@/lib/nsfwConsent";

type ConsentState = {
  policies: NsfwConsentPolicy[];
  acceptedKeys: Set<string>;
};

const NSFW_BASE_FEATURE = "nsfw";

function policyRequiredForFeatures(policy: NsfwConsentPolicy, features: string[]): boolean {
  if (policy.required_for_features.includes(NSFW_BASE_FEATURE)) return true;
  for (const feature of features) {
    if (policy.required_for_features.includes(feature)) return true;
  }
  return false;
}

export function useNsfwConsent(requiredFeatureIds: string[]) {
  const [state, setState] = useState<ConsentState>({ policies: [], acceptedKeys: new Set() });
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [policies, events] = await Promise.all([
        fetchActiveConsentPolicies(),
        fetchUserConsentEvents(),
      ]);
      const acceptedKeys = new Set(
        events.filter(e => !e.revoked_at).map(e => e.policy_key),
      );
      setState({ policies, acceptedKeys });
    } finally {
      setLoading(false);
    }
  }, []);

  const requiredPolicies = useMemo(() => {
    if (!requiredFeatureIds.length) return [];
    return state.policies.filter(p => policyRequiredForFeatures(p, requiredFeatureIds));
  }, [requiredFeatureIds, state.policies]);

  const missingPolicies = useMemo(
    () => requiredPolicies.filter(p => !state.acceptedKeys.has(p.policy_key)),
    [requiredPolicies, state.acceptedKeys],
  );

  const hasConsent = missingPolicies.length === 0;

  const acceptPolicy = useCallback(
    async (policy: NsfwConsentPolicy) => {
      const ok = await recordConsent({
        policyKey: policy.policy_key,
        policyVersion: policy.version,
      });
      if (ok) await load();
      return ok;
    },
    [load],
  );

  const acceptAll = useCallback(async () => {
    if (missingPolicies.length === 0) return true;
    const results = await Promise.all(missingPolicies.map(p => acceptPolicy(p)));
    return results.every(Boolean);
  }, [acceptPolicy, missingPolicies]);

  return {
    loading,
    load,
    policies: state.policies,
    requiredPolicies,
    missingPolicies,
    hasConsent,
    acceptPolicy,
    acceptAll,
  };
}
