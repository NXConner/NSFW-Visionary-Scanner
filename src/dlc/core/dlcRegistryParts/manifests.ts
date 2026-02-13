// Bundle manifest type definition
export interface DLCBundleManifest {
  id: string;
  name: string;
  version: string;
  contentVersion: string;
  description: {
    safe: string;
    full: string;
  };
  includes: Array<{
    module: string;
    features: string[];
  }>;
  dependencies: string[];
  pricing: {
    type: "one_time" | "subscription";
    price: number;
    currency: string;
  };
  requirements: {
    minAppVersion: string;
    ageVerification: boolean;
  };
  distribution: {
    downloadSize: string;
    installSize: string;
    checksum: string;
  };
}

// Topic-specific bundle manifests (empty by default)
const TOPIC_BUNDLE_MANIFESTS: Record<string, DLCBundleManifest> = {};

export const BUNDLE_MANIFESTS: Record<string, DLCBundleManifest> = {
  "dlc-positions": {
    id: "dlc-positions",
    name: "Positions Collection",
    version: "1.0.0",
    contentVersion: "2024.12.1",
    description: {
      safe: "Comprehensive guide to partner connection techniques with visual instructions",
      full: "100+ intimate positions with detailed instructions, images, and expert tips",
    },
    includes: [
      {
        module: "core/positions",
        features: ["gallery", "details", "favorites", "filters", "playlists"],
      },
    ],
    dependencies: [],
    pricing: { type: "one_time", price: 9.99, currency: "USD" },
    requirements: { minAppVersion: "1.0.0", ageVerification: true },
    distribution: { downloadSize: "15MB", installSize: "25MB", checksum: "" },
  },

  "dlc-videos": {
    id: "dlc-videos",
    name: "Video Library",
    version: "1.0.0",
    contentVersion: "2024.12.1",
    description: {
      safe: "Premium video library featuring expert demonstrations and educational content",
      full: "Extensive library of adult educational videos with HD streaming and downloads",
    },
    includes: [
      {
        module: "core/videos",
        features: ["library", "streaming", "downloads", "playlists", "progress"],
      },
    ],
    dependencies: [],
    pricing: { type: "one_time", price: 14.99, currency: "USD" },
    requirements: { minAppVersion: "1.0.0", ageVerification: true },
    distribution: { downloadSize: "20MB", installSize: "35MB", checksum: "" },
  },

  "dlc-intimate": {
    id: "dlc-intimate",
    name: "Intimate Experience Pack",
    version: "1.0.0",
    contentVersion: "2024.12.1",
    description: {
      safe: "Complete intimate wellness toolkit with guides, tracking, and partner features",
      full: "Positions + Analytics + Partner Sync for the complete couples experience",
    },
    includes: [
      {
        module: "core/positions",
        features: ["gallery", "details", "favorites", "filters", "playlists"],
      },
      {
        module: "core/analytics",
        features: ["wellness", "partner_sync", "reports", "trends", "insights"],
      },
    ],
    dependencies: [],
    pricing: { type: "one_time", price: 14.99, currency: "USD" },
    requirements: { minAppVersion: "1.0.0", ageVerification: true },
    distribution: { downloadSize: "25MB", installSize: "40MB", checksum: "" },
  },

  "dlc-advanced": {
    id: "dlc-advanced",
    name: "Advanced Features Pack",
    version: "1.0.0",
    contentVersion: "2024.12.1",
    description: {
      safe: "Premium suite of advanced features for the complete intimate experience",
      full: "Positions + Videos + Recording + Date Planning + AI Chat",
    },
    includes: [
      {
        module: "core/positions",
        features: ["gallery", "details", "favorites", "filters", "playlists"],
      },
      {
        module: "core/videos",
        features: ["library", "streaming", "downloads", "playlists", "progress"],
      },
      {
        module: "core/advanced",
        features: ["multi_camera", "date_planner", "ai_chat", "partner_sync"],
      },
    ],
    dependencies: [],
    pricing: { type: "one_time", price: 29.99, currency: "USD" },
    requirements: { minAppVersion: "1.0.0", ageVerification: true },
    distribution: { downloadSize: "50MB", installSize: "80MB", checksum: "" },
  },

  "dlc-complete": {
    id: "dlc-complete",
    name: "Ultimate Complete Pack",
    version: "1.0.0",
    contentVersion: "2024.12.1",
    description: {
      safe: "The complete experience - all premium features unlocked forever",
      full: "Everything included: Positions, Videos, Analytics, Community, Advanced Features",
    },
    includes: [
      {
        module: "core/positions",
        features: ["gallery", "details", "favorites", "filters", "playlists"],
      },
      {
        module: "core/videos",
        features: ["library", "streaming", "downloads", "playlists", "progress"],
      },
      {
        module: "core/analytics",
        features: ["wellness", "partner_sync", "reports", "trends", "insights"],
      },
      {
        module: "core/community",
        features: ["forum", "groups", "expert_qa", "marketplace", "exclusive"],
      },
      {
        module: "core/advanced",
        features: ["multi_camera", "date_planner", "ai_chat", "partner_sync"],
      },
    ],
    dependencies: [],
    pricing: { type: "one_time", price: 39.99, currency: "USD" },
    requirements: { minAppVersion: "1.0.0", ageVerification: true },
    distribution: { downloadSize: "75MB", installSize: "120MB", checksum: "" },
  },
  // Topic packs (metadata-only; content delivered via Topics Library)
  "dlc-topic-power-dynamics": {
    id: "dlc-topic-power-dynamics",
    name: "Power Dynamics Pack",
    version: "1.0.0",
    contentVersion: "2025.12.20",
    description: {
      safe: "Consent-first guidance and educational resources for adult power dynamics.",
      full: "Consent, boundaries, communication, and safety-focused resources delivered via Topics Library.",
    },
    includes: [{ module: "core/topics", features: ["topics_library", "topic_power_dynamics"] }],
    dependencies: [],
    pricing: { type: "one_time", price: 4.99, currency: "USD" },
    requirements: { minAppVersion: "1.0.0", ageVerification: true },
    distribution: { downloadSize: "0MB", installSize: "0MB", checksum: "" },
  },
  "dlc-topic-tantric": {
    id: "dlc-topic-tantric",
    name: "Tantric Pack",
    version: "1.0.0",
    contentVersion: "2025.12.20",
    description: {
      safe: "Mindfulness-focused intimacy education and breathwork resources (adult).",
      full: "Tantric and mindful intimacy practices delivered via Topics Library.",
    },
    includes: [{ module: "core/topics", features: ["topics_library", "topic_tantric"] }],
    dependencies: [],
    pricing: { type: "one_time", price: 4.99, currency: "USD" },
    requirements: { minAppVersion: "1.0.0", ageVerification: true },
    distribution: { downloadSize: "0MB", installSize: "0MB", checksum: "" },
  },
  "dlc-topic-kama-sutra": {
    id: "dlc-topic-kama-sutra",
    name: "Classic Texts & Positions Pack",
    version: "1.0.0",
    contentVersion: "2025.12.20",
    description: {
      safe: "Classic text context and position reference (adult).",
      full: "Classic position references and historical context delivered via Topics Library.",
    },
    includes: [{ module: "core/topics", features: ["topics_library", "topic_kama_sutra"] }],
    dependencies: [],
    pricing: { type: "one_time", price: 4.99, currency: "USD" },
    requirements: { minAppVersion: "1.0.0", ageVerification: true },
    distribution: { downloadSize: "0MB", installSize: "0MB", checksum: "" },
  },
  "dlc-topic-roleplay": {
    id: "dlc-topic-roleplay",
    name: "Roleplay Pack",
    version: "1.0.0",
    contentVersion: "2025.12.20",
    description: {
      safe: "Consent-forward roleplay education and scenario frameworks (adult).",
      full: "Roleplay communication and scenario frameworks delivered via Topics Library.",
    },
    includes: [{ module: "core/topics", features: ["topics_library", "topic_roleplay"] }],
    dependencies: [],
    pricing: { type: "one_time", price: 4.99, currency: "USD" },
    requirements: { minAppVersion: "1.0.0", ageVerification: true },
    distribution: { downloadSize: "0MB", installSize: "0MB", checksum: "" },
  },
  "dlc-topic-male-pleasure": {
    id: "dlc-topic-male-pleasure",
    name: "Male Pleasure & Pelvic Health Pack",
    version: "1.0.0",
    contentVersion: "2025.12.20",
    description: {
      safe: "Adult education with anatomy and safety framing for male pleasure and pelvic health.",
      full: "Anatomy-forward resources and pelvic health education delivered via Topics Library.",
    },
    includes: [{ module: "core/topics", features: ["topics_library", "topic_male_pleasure"] }],
    dependencies: [],
    pricing: { type: "one_time", price: 4.99, currency: "USD" },
    requirements: { minAppVersion: "1.0.0", ageVerification: true },
    distribution: { downloadSize: "0MB", installSize: "0MB", checksum: "" },
  },
  ...TOPIC_BUNDLE_MANIFESTS,
};