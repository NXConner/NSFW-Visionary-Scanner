import type { EducationContent } from "./types";

/**
 * IMPORTANT CONTENT POLICY (in-app):
 * - This module is education/consent/safety-focused.
 * - It focuses on the historical, philosophical, and relational aspects of the Kama Sutra.
 * - Keep language respectful and educational; prioritize connection and consent.
 */
export const KAMA_SUTRA_CONTENT: EducationContent = {
  title: "Kama Sutra",
  subtitle: "Ancient wisdom on love, pleasure, and intimate connection—beyond just positions.",
  contentRating: "18+",
  icon: "book-open",
  disclaimer: {
    title: "Educational & Historical Disclaimer",
    body: [
      "This module provides an educational introduction to the Kama Sutra as a historical text.",
      "The Kama Sutra is about much more than sexual positions—it covers relationships, courtship, and life philosophy.",
      "All intimate activities should be consensual and comfortable for all parties.",
      "Physical limitations are normal—modify positions to suit your bodies.",
    ].join(" "),
  },
  sections: [
    {
      id: "overview",
      title: "What is the Kama Sutra?",
      summary:
        "The Kama Sutra is an ancient Indian Sanskrit text on sexuality, eroticism, and emotional fulfillment in life, written by Vātsyāyana around the 3rd century CE.",
      bullets: [
        {
          id: "overview-1",
          tone: "education",
          text: "'Kama' means desire or pleasure; 'Sutra' means thread or aphorism.",
        },
        {
          id: "overview-2",
          tone: "education",
          text: "Only about 20% of the text discusses sexual positions—the rest covers relationships, ethics, and lifestyle.",
        },
        {
          id: "overview-3",
          tone: "education",
          text: "It was written as a guide for the educated urban elite of ancient India.",
        },
      ],
      callouts: [
        {
          id: "overview-callout",
          title: "More than positions",
          body: "The Kama Sutra is a philosophy of living well, not just a sex manual. Understanding this context enriches the practice.",
          tone: "note",
        },
      ],
    },
    {
      id: "history",
      title: "Historical context",
      summary: "Understanding the Kama Sutra in its original cultural context.",
      bullets: [
        {
          id: "hist-1",
          tone: "education",
          text: "Written during the Gupta Empire, a golden age of Indian culture.",
        },
        {
          id: "hist-2",
          tone: "education",
          text: "Part of a tradition of 'Kama Shastra' (science of love) texts.",
        },
        {
          id: "hist-3",
          tone: "education",
          text: "Originally intended for both men and women as equal participants.",
        },
        {
          id: "hist-4",
          tone: "education",
          text: "Victorian-era translations often distorted the original egalitarian spirit.",
        },
      ],
    },
    {
      id: "philosophy",
      title: "Philosophy of Kama",
      summary: "The Kama Sutra's teachings on pleasure as part of a balanced life.",
      bullets: [
        {
          id: "ph-1",
          tone: "spiritual",
          text: "Kama (pleasure) is one of four life goals: Dharma (virtue), Artha (prosperity), Kama, and Moksha (liberation).",
        },
        {
          id: "ph-2",
          tone: "education",
          text: "Pleasure should be pursued ethically and in balance with other life goals.",
        },
        {
          id: "ph-3",
          tone: "education",
          text: "Mutual pleasure and satisfaction are emphasized—not just male pleasure.",
        },
        {
          id: "ph-4",
          tone: "communication",
          text: "Understanding your partner's desires is as important as knowing your own.",
        },
      ],
    },
    {
      id: "how-to",
      title: "Approaching Kama Sutra practices",
      summary: "How to incorporate Kama Sutra wisdom into modern relationships.",
      bullets: [
        {
          id: "how-1",
          tone: "communication",
          text: "Discuss interests with your partner—explore the text together.",
        },
        {
          id: "how-2",
          tone: "practical",
          text: "Focus on connection and presence, not just achieving specific positions.",
        },
        {
          id: "how-3",
          tone: "consent",
          text: "Modify positions to suit your bodies—the goal is pleasure, not performance.",
        },
        {
          id: "how-4",
          tone: "communication",
          text: "Use the text as a starting point for conversations about desire.",
        },
        {
          id: "how-5",
          tone: "practical",
          text: "Incorporate elements like massage, aromatherapy, and setting the mood.",
        },
      ],
      callouts: [
        {
          id: "how-callout",
          title: "Flexibility is key",
          body: "Not every position works for every body. Adapt, modify, and communicate.",
          tone: "tip",
        },
      ],
    },
    {
      id: "positions",
      title: "Categories of positions",
      summary: "An overview of how positions are organized in the Kama Sutra.",
      bullets: [
        {
          id: "pos-1",
          tone: "education",
          text: "Positions are categorized by body types and compatibility.",
        },
        {
          id: "pos-2",
          tone: "education",
          text: "Some emphasize deep connection; others prioritize sensation.",
        },
        {
          id: "pos-3",
          tone: "practical",
          text: "The text describes 64 'arts' of love, including foreplay, embrace, and kissing.",
        },
        {
          id: "pos-4",
          tone: "education",
          text: "Modern interpretations often add variations suited to contemporary needs.",
        },
      ],
    },
    {
      id: "preparation",
      title: "Setting & preparation",
      summary: "The Kama Sutra emphasizes the importance of environment and mood.",
      bullets: [
        {
          id: "prep-1",
          tone: "practical",
          text: "Create a comfortable, private, aesthetically pleasing space.",
        },
        { id: "prep-2", tone: "practical", text: "Attend to personal hygiene and grooming." },
        {
          id: "prep-3",
          tone: "practical",
          text: "Use sensory elements: soft lighting, pleasant scents, music.",
        },
        {
          id: "prep-4",
          tone: "communication",
          text: "Take time for connection before intimacy—conversation, touch, appreciation.",
        },
      ],
    },
    {
      id: "boundaries-safety",
      title: "Safety & consent",
      bullets: [
        {
          id: "bs-1",
          tone: "consent",
          text: "All activities require enthusiastic consent from all parties.",
        },
        {
          id: "bs-2",
          tone: "safety",
          text: "Be aware of physical limitations—stop if anything causes pain.",
        },
        {
          id: "bs-3",
          tone: "communication",
          text: "Communicate throughout—check in about comfort and pleasure.",
        },
        {
          id: "bs-4",
          tone: "practical",
          text: "Use pillows and supports to make positions comfortable.",
        },
      ],
      callouts: [
        {
          id: "bs-callout",
          title: "Honor your body",
          body: "The Kama Sutra was written for ancient bodies. Modify for your flexibility, age, and comfort.",
          tone: "tip",
        },
      ],
    },
    {
      id: "faq",
      title: "Frequently asked questions",
      bullets: [
        {
          id: "faq-1",
          tone: "education",
          text: "Is the Kama Sutra religious? It's a secular text, though it references Hindu concepts.",
        },
        {
          id: "faq-2",
          tone: "education",
          text: "Do I need to be flexible? No—adapt positions to your body's capabilities.",
        },
        {
          id: "faq-3",
          tone: "communication",
          text: "How do I introduce this to my partner? Share the text together and discuss what interests you both.",
        },
        {
          id: "faq-4",
          tone: "education",
          text: "Are there other Kama Shastra texts? Yes—the Ananga Ranga and Ratirahasya are related works.",
        },
      ],
    },
  ],
  resources: [
    {
      id: "res-reading",
      title: "Recommended translations",
      description: "Scholarly translations that preserve the original context and philosophy.",
      tags: ["reading", "history", "education"],
    },
    {
      id: "res-positions",
      title: "Beginner-friendly positions",
      description: "A curated list of accessible positions for those new to exploring.",
      tags: ["practical", "beginner", "positions"],
    },
    {
      id: "res-mood",
      title: "Setting the mood guide",
      description: "How to create an environment conducive to intimate connection.",
      tags: ["preparation", "atmosphere", "ritual"],
    },
  ],
};
