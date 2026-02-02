/**
 * Pricing Configuration
 * Manages pricing for SFW/NSFW versions and Store/Direct distribution
 */

import { getDistributionChannel, isSFW, isNSFW, isHybrid } from "./featureFlags";

export interface PricingTier {
  id: string;
  name: string;
  versionType: "sfw" | "nsfw" | "dlc";
  distributionChannel: "store" | "direct";
  priceType: "one-time" | "monthly" | "yearly" | "lifetime";
  price: number;
  stripePriceId?: string;
  stripeProductId?: string;
  features: string[];
  popular?: boolean;
}

/**
 * Get pricing tiers based on app version and distribution channel
 */
export const getPricingTiers = async (): Promise<PricingTier[]> => {
  const channel = getDistributionChannel();
  const version = isSFW() ? "sfw" : isNSFW() ? "nsfw" : "hybrid";

  // Fetch from database or use static configuration
  // For now, using static configuration based on comprehensive pricing structure

  const allTiers: PricingTier[] = [
    // SFW Store Pricing
    {
      id: "sfw-app-store",
      name: "SFW App",
      versionType: "sfw",
      distributionChannel: "store",
      priceType: "one-time",
      price: 14.99,
      stripePriceId: import.meta.env.VITE_STRIPE_SFW_APP_STORE_PRICE_ID,
      features: ["Basic 3D/2D Scanner", "Health Diary", "Education Center", "Emergency Guidance"],
    },
    {
      id: "sfw-pro-store-monthly",
      name: "SFW Pro",
      versionType: "sfw",
      distributionChannel: "store",
      priceType: "monthly",
      price: 12.99,
      stripePriceId: import.meta.env.VITE_STRIPE_SFW_PRO_STORE_MONTHLY_PRICE_ID,
      features: [
        "Everything in Free",
        "Unlimited Scans",
        "Advanced Analytics",
        "Cloud Backup",
        "Progress Photos",
        "PE Routine Builder",
      ],
    },
    {
      id: "sfw-premium-store-monthly",
      name: "SFW Premium",
      versionType: "sfw",
      distributionChannel: "store",
      priceType: "monthly",
      price: 24.99,
      stripePriceId: import.meta.env.VITE_STRIPE_SFW_PREMIUM_STORE_MONTHLY_PRICE_ID,
      popular: true,
      features: [
        "Everything in Pro",
        "AI Health Chatbot",
        "AI Scan Analysis",
        "Medical Export (HL7 FHIR)",
        "Priority Support",
        "Custom PE Routines",
        "Predictive Analytics",
      ],
    },
    {
      id: "sfw-pro-store-yearly",
      name: "SFW Pro",
      versionType: "sfw",
      distributionChannel: "store",
      priceType: "yearly",
      price: 124.99,
      stripePriceId: import.meta.env.VITE_STRIPE_SFW_PRO_STORE_YEARLY_PRICE_ID,
      features: ["Everything in Pro", "20% discount"],
    },
    {
      id: "sfw-premium-store-yearly",
      name: "SFW Premium",
      versionType: "sfw",
      distributionChannel: "store",
      priceType: "yearly",
      price: 239.99,
      stripePriceId: import.meta.env.VITE_STRIPE_SFW_PREMIUM_STORE_YEARLY_PRICE_ID,
      features: ["Everything in Premium", "20% discount"],
    },
    {
      id: "sfw-lifetime-store",
      name: "SFW Lifetime",
      versionType: "sfw",
      distributionChannel: "store",
      priceType: "lifetime",
      price: 299.99,
      stripePriceId: import.meta.env.VITE_STRIPE_SFW_LIFETIME_STORE_PRICE_ID,
      features: ["All SFW features forever", "All future SFW updates"],
    },

    // SFW Direct Pricing
    {
      id: "sfw-app-direct",
      name: "SFW App",
      versionType: "sfw",
      distributionChannel: "direct",
      priceType: "one-time",
      price: 9.99,
      stripePriceId: import.meta.env.VITE_STRIPE_SFW_APP_DIRECT_PRICE_ID,
      features: ["Basic 3D/2D Scanner", "Health Diary", "Education Center", "Emergency Guidance"],
    },
    {
      id: "sfw-pro-direct-monthly",
      name: "SFW Pro",
      versionType: "sfw",
      distributionChannel: "direct",
      priceType: "monthly",
      price: 9.99,
      stripePriceId: import.meta.env.VITE_STRIPE_SFW_PRO_DIRECT_MONTHLY_PRICE_ID,
      features: [
        "Everything in Free",
        "Unlimited Scans",
        "Advanced Analytics",
        "Cloud Backup",
        "Progress Photos",
        "PE Routine Builder",
      ],
    },
    {
      id: "sfw-premium-direct-monthly",
      name: "SFW Premium",
      versionType: "sfw",
      distributionChannel: "direct",
      priceType: "monthly",
      price: 19.99,
      stripePriceId: import.meta.env.VITE_STRIPE_SFW_PREMIUM_DIRECT_MONTHLY_PRICE_ID,
      popular: true,
      features: [
        "Everything in Pro",
        "AI Health Chatbot",
        "AI Scan Analysis",
        "Medical Export (HL7 FHIR)",
        "Priority Support",
        "Custom PE Routines",
        "Predictive Analytics",
      ],
    },
    {
      id: "sfw-pro-direct-yearly",
      name: "SFW Pro",
      versionType: "sfw",
      distributionChannel: "direct",
      priceType: "yearly",
      price: 95.99,
      stripePriceId: import.meta.env.VITE_STRIPE_SFW_PRO_DIRECT_YEARLY_PRICE_ID,
      features: ["Everything in Pro", "20% discount"],
    },
    {
      id: "sfw-premium-direct-yearly",
      name: "SFW Premium",
      versionType: "sfw",
      distributionChannel: "direct",
      priceType: "yearly",
      price: 191.99,
      stripePriceId: import.meta.env.VITE_STRIPE_SFW_PREMIUM_DIRECT_YEARLY_PRICE_ID,
      features: ["Everything in Premium", "20% discount"],
    },
    {
      id: "sfw-lifetime-direct",
      name: "SFW Lifetime",
      versionType: "sfw",
      distributionChannel: "direct",
      priceType: "lifetime",
      price: 199.99,
      stripePriceId: import.meta.env.VITE_STRIPE_SFW_LIFETIME_DIRECT_PRICE_ID,
      features: ["All SFW features forever", "All future SFW updates"],
    },

    // NSFW Direct Pricing (Store not available)
    {
      id: "nsfw-app-direct",
      name: "NSFW App",
      versionType: "nsfw",
      distributionChannel: "direct",
      priceType: "one-time",
      price: 19.99,
      stripePriceId: import.meta.env.VITE_STRIPE_NSFW_APP_DIRECT_PRICE_ID,
      features: [
        "All SFW features",
        "Positions Gallery",
        "NSFW Visual Content",
        "Complete visual content system",
      ],
    },
    {
      id: "nsfw-pro-direct-monthly",
      name: "NSFW Pro",
      versionType: "nsfw",
      distributionChannel: "direct",
      priceType: "monthly",
      price: 14.99,
      stripePriceId: import.meta.env.VITE_STRIPE_NSFW_PRO_DIRECT_MONTHLY_PRICE_ID,
      features: ["Everything in SFW Pro", "NSFW visual content", "Positions Gallery access"],
    },
    {
      id: "nsfw-premium-direct-monthly",
      name: "NSFW Premium",
      versionType: "nsfw",
      distributionChannel: "direct",
      priceType: "monthly",
      price: 29.99,
      stripePriceId: import.meta.env.VITE_STRIPE_NSFW_PREMIUM_DIRECT_MONTHLY_PRICE_ID,
      popular: true,
      features: [
        "Everything in SFW Premium",
        "All NSFW content",
        "Full visual content system",
        "Priority NSFW content updates",
      ],
    },
    {
      id: "nsfw-pro-direct-yearly",
      name: "NSFW Pro",
      versionType: "nsfw",
      distributionChannel: "direct",
      priceType: "yearly",
      price: 143.99,
      stripePriceId: import.meta.env.VITE_STRIPE_NSFW_PRO_DIRECT_YEARLY_PRICE_ID,
      features: ["Everything in NSFW Pro", "20% discount"],
    },
    {
      id: "nsfw-premium-direct-yearly",
      name: "NSFW Premium",
      versionType: "nsfw",
      distributionChannel: "direct",
      priceType: "yearly",
      price: 287.99,
      stripePriceId: import.meta.env.VITE_STRIPE_NSFW_PREMIUM_DIRECT_YEARLY_PRICE_ID,
      features: ["Everything in NSFW Premium", "20% discount"],
    },
    {
      id: "nsfw-lifetime-direct",
      name: "NSFW Lifetime",
      versionType: "nsfw",
      distributionChannel: "direct",
      priceType: "lifetime",
      price: 399.99,
      stripePriceId: import.meta.env.VITE_STRIPE_NSFW_LIFETIME_DIRECT_PRICE_ID,
      features: ["All SFW + NSFW features forever", "All future updates (SFW + NSFW)"],
    },

    // DLC Pricing
    {
      id: "nsfw-dlc-store",
      name: "NSFW DLC Upgrade",
      versionType: "dlc",
      distributionChannel: "store",
      priceType: "one-time",
      price: 24.99,
      stripePriceId: import.meta.env.VITE_STRIPE_NSFW_DLC_STORE_PRICE_ID,
      features: ["Unlocks all NSFW content", "Requires base SFW app"],
    },
    {
      id: "nsfw-dlc-direct",
      name: "NSFW DLC Upgrade",
      versionType: "dlc",
      distributionChannel: "direct",
      priceType: "one-time",
      price: 19.99,
      stripePriceId: import.meta.env.VITE_STRIPE_NSFW_DLC_DIRECT_PRICE_ID,
      features: [
        "Unlocks all NSFW content",
        "Requires base SFW app",
        "20% discount for direct users",
      ],
    },
  ];

  // Filter based on current version and channel
  return allTiers.filter(tier => {
    // For hybrid version, show SFW + DLC options
    if (version === "hybrid") {
      return tier.versionType === "sfw" || tier.versionType === "dlc";
    }

    // For SFW version, only show SFW options
    if (version === "sfw") {
      return tier.versionType === "sfw" && tier.distributionChannel === channel;
    }

    // For NSFW version, only show NSFW options
    if (version === "nsfw") {
      return tier.versionType === "nsfw" && tier.distributionChannel === channel;
    }

    return false;
  });
};

/**
 * Get subscription plans (backward compatibility)
 */
export const getSubscriptionPlans = async () => {
  const tiers = await getPricingTiers();
  return tiers.filter(tier => tier.priceType === "monthly" || tier.priceType === "yearly");
};

/**
 * Get one-time purchase options
 */
export const getOneTimePurchases = async () => {
  const tiers = await getPricingTiers();
  return tiers.filter(tier => tier.priceType === "one-time" || tier.priceType === "lifetime");
};

/**
 * Get DLC upgrade options
 */
export const getDLCOptions = async () => {
  const tiers = await getPricingTiers();
  return tiers.filter(tier => tier.versionType === "dlc");
};

/**
 * Format price for display
 */
export const formatPrice = (price: number, currency = "USD"): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(price);
};

/**
 * Calculate yearly savings
 */
export const calculateYearlySavings = (monthlyPrice: number): number => {
  const yearlyPrice = monthlyPrice * 12;
  const discountedYearlyPrice = yearlyPrice * 0.8; // 20% discount
  return yearlyPrice - discountedYearlyPrice;
};
