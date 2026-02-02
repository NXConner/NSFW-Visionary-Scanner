/**
 * Community DLC Module
 * Private forum and community features
 */

import type { DLCModule } from "../../core/types";

// Module manifest
export const CommunityModule: DLCModule = {
  id: "community",
  name: "Community & Forum",
  version: "1.0.0",
  // Primary package for this module; bundles that include community are mapped in `MODULE_PACKAGE_MAP`.
  packageId: "dlc-community",

  // Components are loaded dynamically
  components: {},

  // Routes
  routes: [
    {
      path: "/community",
      component: "CommunityHub",
      protected: true,
    },
    {
      path: "/community/forum",
      component: "PrivateForum",
      protected: true,
    },
    {
      path: "/community/forum/:topicId",
      component: "ForumTopic",
      protected: true,
    },
    {
      path: "/community/groups",
      component: "PrivateGroups",
      protected: true,
    },
    {
      path: "/community/experts",
      component: "ExpertQA",
      protected: true,
    },
    {
      path: "/community/marketplace",
      component: "CreatorMarketplace",
      protected: true,
    },
  ],

  // Navigation items
  navigationItems: [
    {
      id: "community",
      label: "Community",
      icon: "Users",
      path: "/community",
      order: 40,
    },
  ],

  // Features
  features: [
    "private_forum",
    "private_groups",
    "expert_qa",
    "creator_marketplace",
    "exclusive_content",
  ],

  // Lifecycle
  onLoad: async () => {},

  onUnload: async () => {},
};

// Export types
export * from "./types";
