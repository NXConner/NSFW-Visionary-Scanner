/**
 * Positions DLC Module
 * Contains all positions-related content and components
 */

import type { DLCModule } from "../../core/types";

// Module manifest
export const PositionsModule: DLCModule = {
  id: "positions",
  name: "Positions Collection",
  version: "1.0.0",
  packageId: "dlc-positions",

  // Components are loaded dynamically
  components: {},

  // Routes
  routes: [
    {
      path: "/positions",
      component: "PositionsGallery",
      protected: true,
    },
    {
      path: "/positions/:id",
      component: "PositionDetail",
      protected: true,
    },
  ],

  // Navigation items
  navigationItems: [
    {
      id: "positions",
      label: "Positions",
      icon: "Heart",
      path: "/positions",
      order: 10,
    },
  ],

  // Features
  features: [
    "positions_gallery",
    "position_details",
    "position_favorites",
    "position_filters",
    "position_playlists",
  ],

  // Lifecycle
  onLoad: async () => {},

  onUnload: async () => {},
};

// Export types
export * from "./types";
