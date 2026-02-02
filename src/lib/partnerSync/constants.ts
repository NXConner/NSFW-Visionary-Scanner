export const THOUGHT_PING_INTENSITIES = ["soft", "playful", "medium", "intense", "wild"] as const;

export const THOUGHT_PING_PRIORITIES = ["normal", "high"] as const;

export const THOUGHT_PING_DELIVERY_STATES = ["queued", "delivered", "failed"] as const;

export const THOUGHT_PING_TONE_TAGS = [
  "dirty",
  "nasty",
  "perverted",
  "sexy",
  "raunchy",
  "bad",
  "hardcore",
  "rough",
  "kinky",
  "romantic",
  "sensual",
  "playful",
  "teasing",
  "flirty",
  "intimate",
  "dominant",
  "submissive",
  "switch",
  "bdsm",
  "bondage",
  "primal",
  "slow burn",
  "quick and hungry",
  "adventurous",
  "experimental",
  "taboo",
  "power exchange",
  "massage",
  "oral focus",
  "anal",
  "voyeur",
  "exhibitionist",
  "roleplay",
  "fantasy",
  "all night",
  "aftercare",
] as const;

export const INTIMACY_THEMES = [
  "romantic",
  "sensual",
  "making love",
  "slow burn",
  "playful",
  "flirty",
  "teasing",
  "dominant",
  "submissive",
  "switch",
  "power exchange",
  "bdsm",
  "bondage",
  "rough",
  "hardcore",
  "primal",
  "kinky",
  "taboo",
  "adventurous",
  "experimental",
  "tantric",
  "roleplay",
  "fantasy",
  "oral",
  "anal",
  "massage",
  "shower",
  "outdoor",
  "quickie",
  "all night",
] as const;

export const DATE_NIGHT_SEGMENTS = ["night_out", "dinner", "night_in"] as const;

export const DATE_NIGHT_DISTRACTIONS = [
  "phones",
  "work emails",
  "social media",
  "tv",
  "notifications",
  "doorbell",
  "roommates",
  "kids",
  "pets",
  "noise",
  "temperature",
  "lighting",
  "music volume",
  "messy space",
  "late-night chores",
  "time pressure",
  "overbooking",
  "low energy",
  "stress",
  "other plans",
] as const;

export const DATE_NIGHT_CHECKLIST_PRESETS = [
  "Confirm timing",
  "Set the mood",
  "Prep playlist",
  "Hydration",
  "Comfort items",
  "Consent check-in",
  "Aftercare plan",
] as const;

export const DATE_NIGHT_PACKING_PRESETS = [
  "Comfortable clothes",
  "Snacks",
  "Water",
  "Charger",
  "Playlist device",
  "Personal items",
] as const;

export const DATE_NIGHT_AFTERCARE_PRESETS = [
  "Hydration",
  "Warm shower",
  "Cuddle time",
  "Debrief conversation",
  "Stretching",
] as const;

export const DATE_NIGHT_REMINDER_TYPES = ["reservation", "travel", "checkin", "custom"] as const;

export const PARTNER_CONSENT_VERSION = "2026-01-30";

export const PARTNER_AVAILABILITY_TAGS = [
  "time-flexible",
  "time-limited",
  "low-energy",
  "medium-energy",
  "high-energy",
  "small-space",
  "large-space",
  "quiet-required",
  "traveling",
] as const;

export const PARTNER_BOUNDARY_TAGS = [
  "gentle",
  "no-pressure",
  "slow-pace",
  "no-rough",
  "no-bdsm",
  "no-roleplay",
  "check-in-first",
  "aftercare-required",
  "public-avoid",
  "privacy-high",
] as const;

export const POSITION_SAFETY_CHECKLIST = [
  "Agree on boundaries",
  "Confirm comfort level",
  "Warm-up/stretch",
  "Check breathing",
  "Safe word agreed",
  "Pause if needed",
] as const;

export const POSITION_CONSTRAINT_LEVELS = ["none", "low", "moderate", "high"] as const;

export const POSITION_EQUIPMENT_TAGS = [
  "none",
  "pillows",
  "chair",
  "bedframe",
  "bench",
  "mirror",
  "restraints",
  "floor-mat",
] as const;

export const POSITION_PRIVACY_LEVELS = ["private", "shared", "public"] as const;

export const QUICK_REPLY_PRESETS = [
  { label: "Yes, please", message: "Yes, I want that." },
  { label: "Maybe later", message: "I like it, maybe later." },
  { label: "Need details", message: "Tell me more about what you want." },
  { label: "Set boundaries", message: "I am interested but want to discuss boundaries first." },
  { label: "Schedule it", message: "Let us plan a time for this." },
] as const;

export const THOUGHT_PING_REACTIONS = [
  { id: "heart", label: "Love" },
  { id: "fire", label: "Fire" },
  { id: "thumbs_up", label: "Agree" },
  { id: "sparkle", label: "Excited" },
  { id: "reply", label: "Reply" },
] as const;
