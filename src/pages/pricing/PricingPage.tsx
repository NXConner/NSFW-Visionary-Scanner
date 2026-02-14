import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { useAuth } from "@/contexts/AuthContext";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { useAnalytics } from "@/lib/analytics";
import { useBetaAccess } from "@/lib/betaAccess";
import { BUILD_ALLOW_ADULT_BUNDLE } from "@/lib/buildFlags";
import { getDistributionChannel, isHybrid } from "@/lib/featureFlags";
import { getDLCOptions, getPricingTiers, type PricingTier } from "@/lib/pricing";

import { UnauthedHero } from "./sections/UnauthedHero";
import { BetaAccessNotice } from "./sections/BetaAccessNotice";
import { PricingHeader } from "./sections/PricingHeader";
import { PricingCardsSection } from "./sections/PricingCardsSection";
import { DlcUpgradeSection } from "./sections/DlcUpgradeSection";
import { FeatureComparisonSection } from "./sections/FeatureComparisonSection";
import { FaqSection } from "./sections/FaqSection";

export default function PricingPage() {
  const [billingInterval, setBillingInterval] = useState<"month" | "year">("month");
  const [priceType, setPriceType] = useState<"subscription" | "one-time">("subscription");

  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>([]);
  const [dlcOptions, setDlcOptions] = useState<PricingTier[]>([]);
  const [loading, setLoading] = useState(true);

  const { user } = useAuth();
  const { tier: currentTier } = useFeatureAccess();
  const { status: betaStatus } = useBetaAccess(user?.id);
  const navigate = useNavigate();
  const channel = getDistributionChannel();
  const isHybridVersion = isHybrid();
  const { trackUserAction } = useAnalytics();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const loadPricing = async () => {
      setLoading(true);
      try {
        const tiers = await getPricingTiers();
        setPricingTiers(tiers);

        if (isHybridVersion) {
          const dlc = await getDLCOptions();
          setDlcOptions(dlc);
        }
      } catch {
        // intentionally quiet: pricing UI still renders with empty lists
      } finally {
        setLoading(false);
      }
    };
    void loadPricing();
  }, [isHybridVersion]);

  useEffect(() => {
    if (!user) return;
    trackUserAction("paywall_view", "funnel", {
      page: "pricing",
      channel,
      isHybridVersion,
      currentTier,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;
    const success = searchParams.get("success") === "true";
    const canceled = searchParams.get("canceled") === "true";
    if (success) trackUserAction("checkout_return_success", "funnel", { page: "pricing" });
    if (canceled) trackUserAction("checkout_return_canceled", "funnel", { page: "pricing" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, searchParams]);

  if (!user) {
    return <UnauthedHero onSignIn={() => navigate("/auth")} />;
  }

  if (betaStatus.active) {
    return <BetaAccessNotice expiresAt={betaStatus.expiresAt ?? null} />;
  }

  const filteredTiers = pricingTiers.filter(tier => {
    if (priceType === "subscription") {
      return (
        (tier.priceType === "monthly" || tier.priceType === "yearly") &&
        (billingInterval === "month" ? tier.priceType === "monthly" : tier.priceType === "yearly")
      );
    }
    return tier.priceType === "one-time" || tier.priceType === "lifetime";
  });

  const groupedTiers = filteredTiers.reduce(
    (acc, tier) => {
      const key = tier.name;
      if (!acc[key]) acc[key] = [];
      acc[key].push(tier);
      return acc;
    },
    {} as Record<string, PricingTier[]>,
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <PricingHeader
          channel={channel}
          priceType={priceType}
          onPriceTypeChange={setPriceType}
          billingInterval={billingInterval}
          onBillingIntervalChange={setBillingInterval}
        />

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading pricing...</p>
          </div>
        ) : (
          <>
            <PricingCardsSection groupedTiers={groupedTiers} currentTier={currentTier} />

            {/* DLC Upgrade Section (Direct bundles only) */}
            {BUILD_ALLOW_ADULT_BUNDLE && isHybridVersion && dlcOptions.length > 0 ? (
              <DlcUpgradeSection dlcOptions={dlcOptions} />
            ) : null}

            <FeatureComparisonSection />
            <FaqSection isHybridVersion={isHybridVersion} />
          </>
        )}
      </div>
    </div>
  );
}
