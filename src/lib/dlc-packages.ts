// DLC Package Definitions for MorphoScan Pro
// Centralized package configuration for the DLC Store

import { Library, Brain, Users, FileText, Microscope, Shield, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface DLCPackage {
  id: string;
  name: string;
  description: string;
  price: number;
  billingPeriod: "monthly" | "yearly" | "one-time" | "free";
  icon: LucideIcon;
  features: string[];
  category: "premium" | "advanced" | "professional" | "research";
  stripePriceIdMonthly?: string;
  stripePriceIdYearly?: string;
  isNew?: boolean;
  revenueProjection?: string;
  targetAudience?: string;
}

export const newDLCPackages: DLCPackage[] = [
  {
    id: "premium-positions",
    name: "Premium Position Collections",
    description:
      "Access our comprehensive library of 50+ advanced positions with detailed instructions, safety notes, and progress tracking.",
    price: 9.99,
    billingPeriod: "monthly",
    icon: Library,
    category: "premium",
    stripePriceIdMonthly: import.meta.env.VITE_STRIPE_PRICE_PREMIUM_POSITIONS_MONTHLY,
    stripePriceIdYearly: import.meta.env.VITE_STRIPE_PRICE_PREMIUM_POSITIONS_YEARLY,
    isNew: true,
    revenueProjection: "$8K-15K/month",
    targetAudience: "Beginners to advanced practitioners",
    features: [
      "50+ professional positions with step-by-step guides",
      "Searchable position library with filters by difficulty",
      "Favorite positions and create custom collections",
      "Video demonstrations for proper form",
      "Safety notes and contraindications",
      "Progress tracking and history",
      "Muscle group targeting and benefits breakdown",
      "Export your custom routines as PDF",
    ],
  },
  {
    id: "advanced-nsfw-detection",
    name: "Advanced NSFW Detection Modes",
    description:
      "Multi-model ensemble detection with confidence scoring and detailed analysis for maximum privacy and safety.",
    price: 14.99,
    billingPeriod: "monthly",
    icon: Shield,
    category: "advanced",
    stripePriceIdMonthly: import.meta.env.VITE_STRIPE_PRICE_ADVANCED_NSFW_DETECTION_MONTHLY,
    stripePriceIdYearly: import.meta.env.VITE_STRIPE_PRICE_ADVANCED_NSFW_DETECTION_YEARLY,
    isNew: true,
    revenueProjection: "$10K-20K/month",
    targetAudience: "Privacy-conscious users, professionals",
    features: [
      "Multi-model ensemble detection (3+ AI models)",
      "Confidence scoring with statistical breakdown",
      "Comparison mode to see different model results",
      "Advanced privacy settings and customization",
      "Detailed category breakdowns",
      "Historical trend analysis",
      "Custom confidence thresholds",
      "Priority support for detection issues",
    ],
  },
  {
    id: "wellness-coaching-ai",
    name: "Wellness Coaching AI",
    description:
      "AI-powered personalized coaching with goal setting, progress tracking, and weekly insights based on your scan history.",
    price: 19.99,
    billingPeriod: "monthly",
    icon: Brain,
    category: "professional",
    stripePriceIdMonthly: import.meta.env.VITE_STRIPE_PRICE_WELLNESS_COACHING_MONTHLY,
    stripePriceIdYearly: import.meta.env.VITE_STRIPE_PRICE_WELLNESS_COACHING_YEARLY,
    isNew: true,
    revenueProjection: "$15K-30K/month",
    targetAudience: "Goal-oriented users, serious practitioners",
    features: [
      "AI coaching sessions with personalized insights",
      "Goal setting and automated progress tracking",
      "Weekly and monthly coaching reports",
      "Pattern recognition in your wellness data",
      "Actionable recommendations based on trends",
      "Achievement tracking and milestones",
      "Priority alerts for important health signals",
      "Integration with all your health metrics",
    ],
  },
  {
    id: "partner-sync",
    name: "Partner Sync",
    description:
      "Collaborate with your partner through shared dashboards, comparison views, and real-time synchronization.",
    price: 24.99,
    billingPeriod: "monthly",
    icon: Users,
    category: "professional",
    stripePriceIdMonthly: import.meta.env.VITE_STRIPE_PRICE_PARTNER_SYNC_MONTHLY,
    stripePriceIdYearly: import.meta.env.VITE_STRIPE_PRICE_PARTNER_SYNC_YEARLY,
    isNew: true,
    revenueProjection: "$12K-25K/month",
    targetAudience: "Couples, partners working together",
    features: [
      "Secure partner invitation system",
      "Shared dashboard with customizable privacy",
      "Real-time data synchronization",
      "Comparison views and competitive tracking",
      "Partner comments and encouragement",
      "Granular permission controls",
      "Shared goals and milestones",
      "Activity feed with privacy filters",
    ],
  },
  {
    id: "medical-export",
    name: "Medical Export",
    description:
      "HIPAA-compliant medical reporting with secure provider sharing, anonymization options, and professional PDF reports.",
    price: 29.99,
    billingPeriod: "monthly",
    icon: FileText,
    category: "professional",
    stripePriceIdMonthly: import.meta.env.VITE_STRIPE_PRICE_MEDICAL_EXPORT_MONTHLY,
    stripePriceIdYearly: import.meta.env.VITE_STRIPE_PRICE_MEDICAL_EXPORT_YEARLY,
    isNew: true,
    revenueProjection: "$8K-15K/month",
    targetAudience: "Medical professionals, serious health trackers",
    features: [
      "HIPAA-compliant data export",
      "Professional medical report templates",
      "Secure provider sharing with access codes",
      "Data anonymization options",
      "Multiple export formats (PDF, CSV, JSON, HL7 FHIR)",
      "Complete audit trail for compliance",
      "Customizable report sections",
      "Automatic expiration and access control",
    ],
  },
  {
    id: "research-participation",
    name: "Research Participation",
    description:
      "Contribute anonymized data to scientific research and earn rewards. Full transparency on how your data helps advance men's health research.",
    price: 0,
    billingPeriod: "free",
    icon: Microscope,
    category: "research",
    isNew: true,
    revenueProjection: "$2K-5K/month (premium features)",
    targetAudience: "Altruistic users, research supporters",
    features: [
      "Contribute to IRB-approved research studies",
      "Complete data anonymization",
      "Earn points for contributions",
      "Redeem points for premium features",
      "Full transparency on data usage",
      "See published research using your data",
      "Withdraw participation anytime",
      "Quarterly impact reports",
    ],
  },
];

// Helper function to get package by ID
export const getDLCPackage = (id: string): DLCPackage | undefined => {
  return newDLCPackages.find(pkg => pkg.id === id);
};

// Helper function to get packages by category
export const getDLCPackagesByCategory = (category: DLCPackage["category"]): DLCPackage[] => {
  return newDLCPackages.filter(pkg => pkg.category === category);
};

// Calculate total potential monthly revenue
export const getTotalRevenueProjection = (): { min: number; max: number } => {
  return {
    min: 55, // $55K/month minimum
    max: 110, // $110K/month maximum
  };
};
