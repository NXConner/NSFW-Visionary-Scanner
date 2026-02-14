export type PlanTierKey = "free" | "pro" | "premium";

export type FeatureIconKey = "zap" | "star" | "crown";

export type FeatureComparisonRow = {
  label: string;
  icon?: FeatureIconKey;
  tiers: Record<PlanTierKey, boolean>;
};

export const FEATURE_COMPARISON_ROWS: FeatureComparisonRow[] = [
  {
    label: "3D/2D Morphology Scanner",
    tiers: { free: true, pro: true, premium: true },
  },
  {
    label: "Health Diary & Calendar",
    tiers: { free: true, pro: true, premium: true },
  },
  {
    label: "Education Center",
    tiers: { free: true, pro: true, premium: true },
  },
  {
    label: "Emergency Guidance",
    tiers: { free: true, pro: true, premium: true },
  },
  {
    label: "Positions Gallery",
    icon: "zap",
    tiers: { free: false, pro: true, premium: true },
  },
  {
    label: "PE Progress Photos",
    tiers: { free: false, pro: true, premium: true },
  },
  {
    label: "Cloud Backup & Sync",
    tiers: { free: false, pro: true, premium: true },
  },
  {
    label: "AI Health Chatbot",
    icon: "star",
    tiers: { free: false, pro: false, premium: true },
  },
  {
    label: "AI Scan Analysis",
    icon: "crown",
    tiers: { free: false, pro: false, premium: true },
  },
  {
    label: "Medical Export (HL7 FHIR)",
    tiers: { free: false, pro: false, premium: true },
  },
  {
    label: "Priority Support",
    tiers: { free: false, pro: false, premium: true },
  },
];

export type FaqItem = {
  question: string;
  answer: string;
  hybridOnly?: boolean;
};

export const FAQ_ITEMS: FaqItem[] = [
  {
    question: "Can I change plans anytime?",
    answer:
      "Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately for upgrades, or at the end of your current billing period for downgrades.",
  },
  {
    question: "Is my data secure?",
    answer:
      "Absolutely. Your data is encrypted and protected with modern security best practices, and we continuously harden access controls and privacy settings.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit cards and supported digital wallets through our secure Stripe integration.",
  },
  {
    question: "Can I cancel anytime?",
    answer:
      "Yes, you can cancel your subscription at any time. You'll retain access to premium features until the end of your billing period.",
  },
  {
    question: "What is the DLC upgrade?",
    hybridOnly: true,
    answer:
      "The DLC upgrade unlocks adult content and features. It's a one-time purchase that requires the base SFW app. Purchase from our website after installing the app.",
  },
  {
    question: "How do I activate my DLC license?",
    hybridOnly: true,
    answer:
      "After purchasing, you'll receive a license key via email. Go to the DLC page in the app and enter your license key to unlock adult content.",
  },
];
