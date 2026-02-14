import React from "react";

import { PricingCard } from "@/components/PricingCard";
import type { PricingTier } from "@/lib/pricing";

export function PricingCardsSection({
  groupedTiers,
  currentTier,
}: {
  groupedTiers: Record<string, PricingTier[]>;
  currentTier: string | null | undefined;
}) {
  return (
    <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto mb-16">
      {Object.values(groupedTiers).map(tierGroup => {
        const tier = tierGroup[0]; // Use first tier for display
        if (!tier) return null;
        const isPopular = tier.popular || false;

        return (
          <PricingCard
            key={tier.id}
            plan={{
              id: tier.id,
              name: tier.name,
              price: tier.price,
              interval:
                tier.priceType === "yearly"
                  ? "year"
                  : tier.priceType === "monthly"
                    ? "month"
                    : "one-time",
              stripePriceId: tier.stripePriceId || "",
              features: tier.features,
              popular: isPopular,
            }}
            isPopular={isPopular}
            currentPlan={currentTier ?? null}
          />
        );
      })}
    </div>
  );
}
