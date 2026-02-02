export type ResourceTag =
  | "research"
  | "medical"
  | "education"
  | "measurement"
  | "psychology"
  | "myths"
  | "body-image"
  | "statistics"
  | "video"
  | "playlist"
  | "tools";

export type ExternalResource = {
  id: string;
  title: string;
  description: string;
  url: string;
  tags: ResourceTag[];
  provider?: string;
  cautionNote?: string;
};

/**
 * Curated, non-explicit references that are appropriate for an educational / health context.
 * Keep links stable (primary org sites, PubMed, reputable clinics).
 */
export const GVS_RESOURCES: {
  research: ExternalResource[];
  measurementGuides: ExternalResource[];
  bodyImageAndAnxiety: ExternalResource[];
  videosAndPlaylists: ExternalResource[];
} = {
  research: [
    {
      id: "veale-2015",
      title:
        "Systematic review & nomograms for penis size (length and circumference) — Veale et al. (2015)",
      description:
        "Large meta-analysis (up to 15,521 men) reporting mean erect length and circumference with distribution curves.",
      url: "https://pubmed.ncbi.nlm.nih.gov/25487360/",
      tags: ["research", "statistics"],
      provider: "PubMed",
      cautionNote:
        "Different studies use different measurement protocols; compare trends, not single-number absolutes.",
    },
    {
      id: "pubmed-size-search",
      title: "PubMed: search for research on penile size & measurement",
      description:
        "Explore peer-reviewed papers on penile measurement protocol, variability, and population statistics.",
      url: "https://pubmed.ncbi.nlm.nih.gov/?term=penile+length+circumference+measurement",
      tags: ["research", "statistics"],
      provider: "PubMed",
    },
  ],
  measurementGuides: [
    {
      id: "pubmed-cold-stress-physiology-search",
      title: "PubMed: temperature/stress effects on genital physiology (search)",
      description:
        "Educational starting point for how temperature and sympathetic tone can influence flaccid appearance and measurement variability.",
      url: "https://pubmed.ncbi.nlm.nih.gov/?term=cold+temperature+sympathetic+tone+penile+physiology",
      tags: ["research", "measurement", "education"],
      provider: "PubMed",
      cautionNote:
        "Use peer-reviewed sources and clinician guidance; avoid sensationalized claims.",
    },
    {
      id: "issm-size-myths",
      title: "ISSM: evidence-based sexual health resources",
      description:
        "International Society for Sexual Medicine — patient education articles (varies by topic availability).",
      url: "https://www.issm.info/sexual-health-qa",
      tags: ["medical", "education", "myths"],
      provider: "ISSM",
      cautionNote: "Use for general education; consult a clinician for concerns or symptoms.",
    },
    {
      id: "pubmed-measurement-protocol",
      title: "PubMed: measurement protocol & variability (search)",
      description:
        "Find research discussing bone-pressed vs non-bone-pressed, erect quality, and intra-person variability.",
      url: "https://pubmed.ncbi.nlm.nih.gov/?term=penile+measurement+protocol+bone+pressed",
      tags: ["research", "measurement", "tools"],
      provider: "PubMed",
    },
  ],
  bodyImageAndAnxiety: [
    {
      id: "apa-body-image",
      title: "APA: body image and mental health (overview)",
      description:
        "Body image concerns are common; learn about healthy coping and when to seek help.",
      url: "https://www.apa.org/topics/body-image",
      tags: ["psychology", "body-image", "education"],
      provider: "American Psychological Association",
    },
    {
      id: "nimh-anxiety",
      title: "NIMH: anxiety disorders (overview)",
      description:
        "If measurements trigger anxiety or obsessive checking, this is a good starting point for support options.",
      url: "https://www.nimh.nih.gov/health/topics/anxiety-disorders",
      tags: ["psychology", "education"],
      provider: "NIMH",
    },
  ],
  videosAndPlaylists: [
    {
      id: "youtube-search-measurement",
      title: "Video search: measurement protocol & consistency (non-explicit)",
      description:
        "Search YouTube for educational videos on measurement technique and variability (avoid explicit content).",
      url: "https://www.youtube.com/results?search_query=measurement+protocol+penile+length+circumference+educational",
      tags: ["video", "measurement", "education"],
      provider: "YouTube (search)",
      cautionNote:
        "Prefer clinician/academic channels; avoid unverified “miracle” claims and explicit content.",
    },
    {
      id: "youtube-search-body-image",
      title: "Video search: body image, anxiety, and sexual health confidence",
      description:
        "Educational talks on body image and confidence that can help contextualize size concerns.",
      url: "https://www.youtube.com/results?search_query=body+image+anxiety+sexual+health+confidence",
      tags: ["video", "playlist", "body-image", "education"],
      provider: "YouTube (search)",
    },
  ],
};

export const GVS_KEY_TOPICS: Array<{
  id: string;
  title: string;
  bullets: string[];
}> = [
  {
    id: "what-it-is",
    title: "What “Grower vs Shower” means (and what it does NOT mean)",
    bullets: [
      "It describes how much size changes from flaccid → erect (a delta), not “better” or “worse.”",
      "Two people can have the same erect size and different flaccid size (and vice versa).",
      "It’s normal to vary day-to-day due to temperature, stress, hydration, and arousal quality.",
    ],
  },
  {
    id: "why-flaccid-varies",
    title: "Why flaccid measurements vary so much",
    bullets: [
      "Temperature and sympathetic nervous system activity can change baseline tone.",
      "Cold/stress can cause retraction/tightness that makes flaccid size look much smaller (especially for growers).",
      "Exercise, caffeine, nicotine, and stress can change circulation and perceived size.",
      "Measurement tool choice (tape vs ruler) and protocol (bone-pressed vs not) changes results.",
    ],
  },
  {
    id: "pros-cons",
    title: "Benefits & trade-offs (practical, non-judgmental)",
    bullets: [
      "Showers often look more consistent in flaccid state (less variation across situations).",
      "Growers can appear smaller when flaccid yet reach similar erect dimensions.",
      "Neither pattern predicts sexual satisfaction, performance, or relationship quality by itself.",
    ],
  },
  {
    id: "preference-and-outcomes",
    title: "“Which is preferred?” and “Who improves more?” (important caveats)",
    bullets: [
      "There isn’t strong scientific evidence that one pattern is broadly “more preferred.” Preferences vary by culture and context.",
      "There isn’t robust evidence that grower/shower status predicts better enhancement outcomes; consistency + safety matter more.",
      "Use the label to reduce confusion, not to rank yourself.",
    ],
  },
  {
    id: "measurement-best-practices",
    title: "Best practices for measurement (for clean comparisons)",
    bullets: [
      "Use a consistent protocol each time (position, tool, method).",
      "Prefer paired entries (flaccid + erect logged close together).",
      "Track context (time-of-day, temperature, arousal quality) if you want to explain variance.",
    ],
  },
  {
    id: "myths",
    title: "Common myths (debunked)",
    bullets: [
      "Myth: “Growers are always bigger when erect.” Reality: growth pattern is independent of final size.",
      "Myth: “Flaccid size predicts erect size.” Reality: correlation is imperfect; there’s wide overlap.",
      "Myth: “One measurement tells the truth.” Reality: variability and protocol differences matter.",
    ],
  },
];
