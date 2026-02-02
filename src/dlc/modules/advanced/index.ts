/**
 * Advanced Features DLC Module
 * Premium advanced features
 */

import type { DLCModule } from "../../core/types";

// Module manifest
export const AdvancedModule: DLCModule = {
  id: "advanced",
  name: "Advanced Features",
  version: "1.0.0",
  packageId: "dlc-advanced",

  // Components are loaded dynamically
  components: {},

  // Routes
  routes: [
    {
      path: "/advanced",
      component: "AdvancedHub",
      protected: true,
    },
    {
      path: "/advanced/recording",
      component: "MultiCameraRecording",
      protected: true,
    },
    {
      path: "/advanced/date-planner",
      component: "IntimacyDatePlanner",
      protected: true,
    },
    {
      path: "/advanced/ai-companion",
      component: "AICompanion",
      protected: true,
    },
    {
      path: "/advanced/partner-sync",
      component: "PartnerVideoSync",
      protected: true,
    },
  ],

  // Navigation items
  navigationItems: [
    {
      id: "advanced",
      label: "Advanced",
      icon: "Sparkles",
      path: "/advanced",
      order: 50,
    },
  ],

  // Features
  features: ["multi_camera", "intimate_dates", "ai_companion", "partner_video_sync"],

  // Lifecycle
  onLoad: async () => {},

  onUnload: async () => {},
};

// Export types
export * from "./types";
