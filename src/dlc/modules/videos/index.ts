/**
 * Videos DLC Module
 * Contains all video content and components
 */

import type { DLCModule } from "../../core/types";

// Module manifest
export const VideosModule: DLCModule = {
  id: "videos",
  name: "Video Library",
  version: "1.0.0",
  packageId: "dlc-videos",

  // Components are loaded dynamically
  components: {},

  // Routes
  routes: [
    {
      path: "/videos",
      component: "VideoLibrary",
      protected: true,
    },
    {
      path: "/videos/:id",
      component: "VideoPlayer",
      protected: true,
    },
    {
      path: "/videos/playlists",
      component: "VideoPlaylists",
      protected: true,
    },
  ],

  // Navigation items
  navigationItems: [
    {
      id: "videos",
      label: "Videos",
      icon: "Video",
      path: "/videos",
      order: 20,
    },
  ],

  // Features
  features: [
    "video_library",
    "video_streaming",
    "video_downloads",
    "video_playlists",
    "video_progress",
  ],

  // Lifecycle
  onLoad: async () => {},

  onUnload: async () => {},
};

// Export types
export * from "./types";
