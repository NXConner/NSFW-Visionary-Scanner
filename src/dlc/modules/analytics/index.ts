/**
 * Analytics DLC Module
 * Intimate wellness analytics and tracking
 */

import type { DLCModule } from "../../core/types";

// Module manifest
export const AnalyticsModule: DLCModule = {
  id: "analytics",
  name: "Intimate Analytics",
  version: "1.0.0",
  // Primary package for this module; bundles that include analytics are mapped in `MODULE_PACKAGE_MAP`.
  packageId: "dlc-analytics",

  // Components are loaded dynamically
  components: {},

  // Routes
  routes: [
    {
      path: "/analytics",
      component: "WellnessAnalytics",
      protected: true,
    },
    {
      path: "/analytics/reports",
      component: "AnalyticsReports",
      protected: true,
    },
    {
      path: "/analytics/partner",
      component: "PartnerSync",
      protected: true,
    },
  ],

  // Navigation items
  navigationItems: [
    {
      id: "analytics",
      label: "Analytics",
      icon: "BarChart",
      path: "/analytics",
      order: 30,
    },
  ],

  // Features
  features: [
    "wellness_analytics",
    "partner_sync",
    "intimate_reports",
    "trend_analysis",
    "relationship_insights",
  ],

  // Lifecycle
  onLoad: async () => {},

  onUnload: async () => {},
};

// Export types
export * from "./types";
