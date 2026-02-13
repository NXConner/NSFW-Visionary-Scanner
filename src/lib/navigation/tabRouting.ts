export const HUB_TABS = ["home", "scanner", "progress", "learn", "community", "profile"] as const;

export type HubTab = (typeof HUB_TABS)[number];

export type HubSection = {
  hub: HubTab;
  section?: string;
};

const LEGACY_TAB_MAP: Record<string, HubSection> = {
  // Progress hub
  diary: { hub: "progress", section: "diary" },
  pumping: { hub: "progress", section: "pumping" },
  routines: { hub: "progress", section: "routines" },
  "pe-progress": { hub: "progress", section: "photos" },
  positions: { hub: "progress", section: "positions" },
  "video-capture": { hub: "progress", section: "video" },
  "photo-editor": { hub: "progress", section: "photos" },
  "partner-sync": { hub: "progress", section: "video" },
  "advanced-reporting": { hub: "progress", section: "reports" },
  "enhanced-diary": { hub: "progress", section: "diary" },
  "advanced-routines": { hub: "progress", section: "routines" },
  compare: { hub: "progress", section: "photos" },
  "health-monitoring": { hub: "progress", section: "health" },
  "health-dashboard": { hub: "progress", section: "health" },
  "prostate-testicular": { hub: "progress", section: "health" },
  "sexual-wellness": { hub: "progress", section: "health" },
  "pelvic-floor": { hub: "progress", section: "health" },
  "habit-tracker": { hub: "progress", section: "health" },
  "ai-insights": { hub: "progress", section: "health" },
  "predictive-modeling": { hub: "progress", section: "health" },

  // Learn hub
  guide: { hub: "learn", section: "guides" },
  "sexual-health-education": { hub: "learn", section: "health-education" },
  education: { hub: "learn", section: "health-info" },
  "interactive-learning": { hub: "learn", section: "courses" },
  "video-library": { hub: "learn", section: "videos" },
  learn: { hub: "learn", section: "library" },
  "ai-chat": { hub: "learn", section: "ai-chat" },
  "ai-enhancement": { hub: "learn", section: "ai-enhancement" },
  "expert-consultations": { hub: "learn", section: "expert" },
  emergency: { hub: "learn", section: "emergency" },
  questionnaire: { hub: "learn", section: "assessment" },
  doctors: { hub: "learn", section: "doctors" },

  // Community hub
  "community-forum": { hub: "community", section: "forum" },
  "progress-sharing": { hub: "community", section: "sharing" },
  "in-app-messaging": { hub: "community", section: "messaging" },
  "live-support": { hub: "community", section: "support" },

  // Profile hub
  profile: { hub: "profile", section: "account" },
  settings: { hub: "profile", section: "settings" },
  "security-privacy": { hub: "profile", section: "privacy" },
  privacy: { hub: "profile", section: "privacy" },
  activity: { hub: "profile", section: "activity" },
  "health-integrations": { hub: "profile", section: "integrations" },
  "api-webhooks": { hub: "profile", section: "integrations" },
  "export-import": { hub: "profile", section: "integrations" },
  "mobile-wearable": { hub: "profile", section: "integrations" },
  "provider-portal": { hub: "profile", section: "provider" },
  "subscription-tiers": { hub: "profile", section: "billing" },
  "dlc-system": { hub: "profile", section: "billing" },
  "premium-marketplace": { hub: "profile", section: "billing" },
  "premium-addons": { hub: "profile", section: "billing" },
  marketplace: { hub: "profile", section: "billing" },
  "3dviewer": { hub: "scanner", section: "viewer" },

  // NSFW mappings
  "nsfw-videos": { hub: "learn", section: "nsfw-videos" },
  "nsfw-cock-worshiping": { hub: "learn", section: "nsfw-education" },
  "nsfw-wellness-analytics": { hub: "progress", section: "nsfw-analytics" },
  "nsfw-advanced": { hub: "progress", section: "nsfw-advanced" },
  "nsfw-forum": { hub: "community", section: "nsfw-forum" },
};

export function resolveTabRequest(tabId: string): HubSection | null {
  const raw = String(tabId || "").trim();
  if (!raw) return null;
  if ((HUB_TABS as readonly string[]).includes(raw)) {
    return { hub: raw as HubTab };
  }
  return LEGACY_TAB_MAP[raw] ?? null;
}
