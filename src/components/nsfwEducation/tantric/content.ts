import type { EducationContent } from "./types";

/**
 * IMPORTANT CONTENT POLICY (in-app):
 * - This module is education/consent/safety-focused.
 * - It focuses on the spiritual and connection aspects of Tantric practices.
 * - Keep language respectful and non-arousing; prioritize connection, mindfulness, and safety.
 */
export const TANTRIC_CONTENT: EducationContent = {
  title: "Tantric Practices",
  subtitle:
    "Mindful intimacy rooted in ancient traditions, focusing on connection, energy, and presence.",
  contentRating: "18+",
  icon: "heart",
  disclaimer: {
    title: "Educational & Spiritual Disclaimer",
    body: [
      "This module provides an educational introduction to Tantric intimacy practices.",
      "Tantra is a spiritual tradition with many interpretations—this focuses on consensual partner practices.",
      "These practices are not a substitute for therapy or medical advice.",
      "Always prioritize consent, comfort, and open communication with your partner.",
    ].join(" "),
  },
  sections: [
    {
      id: "overview",
      title: "What is Tantra?",
      summary:
        "Tantra is an ancient spiritual tradition that includes practices for deepening intimacy, cultivating energy, and achieving greater presence and connection with a partner.",
      bullets: [
        {
          id: "overview-1",
          tone: "education",
          text: "Tantra originated in Hindu and Buddhist traditions over 1,500 years ago.",
        },
        {
          id: "overview-2",
          tone: "spiritual",
          text: "Modern 'Neo-Tantra' focuses on intimacy and connection rather than religious practice.",
        },
        {
          id: "overview-3",
          tone: "education",
          text: "Tantric practices emphasize breath, energy, eye contact, and slow, mindful touch.",
        },
      ],
      callouts: [
        {
          id: "overview-callout",
          title: "Beyond the physical",
          body: "Tantra is about connection—emotional, energetic, and spiritual—not just physical techniques.",
          tone: "note",
        },
      ],
    },
    {
      id: "philosophy",
      title: "Core philosophy",
      summary: "The foundational principles that guide Tantric practice.",
      bullets: [
        {
          id: "ph-1",
          tone: "spiritual",
          text: "Presence: Being fully in the moment with your partner.",
        },
        {
          id: "ph-2",
          tone: "spiritual",
          text: "Energy: Cultivating and circulating life force (prana/chi) between partners.",
        },
        {
          id: "ph-3",
          tone: "spiritual",
          text: "Sacred sexuality: Viewing intimacy as a path to spiritual growth.",
        },
        {
          id: "ph-4",
          tone: "communication",
          text: "Non-goal orientation: Releasing attachment to specific outcomes.",
        },
      ],
    },
    {
      id: "how-to",
      title: "Beginning Tantric practice",
      summary: "Simple exercises for partners new to Tantric intimacy.",
      bullets: [
        {
          id: "how-1",
          tone: "practical",
          text: "Create a sacred space: soft lighting, comfortable seating, minimal distractions.",
        },
        {
          id: "how-2",
          tone: "communication",
          text: "Begin with intention setting: share what you hope to experience together.",
        },
        {
          id: "how-3",
          tone: "spiritual",
          text: "Synchronized breathing: Sit facing each other, breathe together for 5-10 minutes.",
        },
        {
          id: "how-4",
          tone: "spiritual",
          text: "Eye gazing: Maintain soft eye contact for several minutes without speaking.",
        },
        {
          id: "how-5",
          tone: "practical",
          text: "Slow, intentional touch: Take turns giving non-sexual, mindful touch.",
        },
      ],
      callouts: [
        {
          id: "how-callout",
          title: "Start with connection, not sex",
          body: "Many Tantric exercises are non-sexual. Build connection before moving to intimate touch.",
          tone: "tip",
        },
      ],
    },
    {
      id: "techniques",
      title: "Key techniques",
      bullets: [
        {
          id: "tech-1",
          tone: "spiritual",
          text: "Breath of Fire: Rapid, rhythmic breathing to build energy.",
        },
        {
          id: "tech-2",
          tone: "spiritual",
          text: "Chakra meditation: Visualizing energy moving through energy centers.",
        },
        {
          id: "tech-3",
          tone: "practical",
          text: "Yab-Yum position: Partner sits in the other's lap, hearts aligned, breathing together.",
        },
        {
          id: "tech-4",
          tone: "communication",
          text: "Verbal appreciation: Speaking genuine compliments and gratitude during practice.",
        },
        {
          id: "tech-5",
          tone: "spiritual",
          text: "Energy circulation: Visualizing energy flowing between partners.",
        },
      ],
    },
    {
      id: "benefits",
      title: "Benefits of Tantric practice",
      bullets: [
        { id: "ben-1", tone: "education", text: "Deeper emotional intimacy and connection." },
        {
          id: "ben-2",
          tone: "education",
          text: "Reduced performance anxiety through non-goal orientation.",
        },
        {
          id: "ben-3",
          tone: "education",
          text: "Enhanced sensation through mindfulness and slowing down.",
        },
        { id: "ben-4", tone: "spiritual", text: "Spiritual growth and expanded consciousness." },
        {
          id: "ben-5",
          tone: "communication",
          text: "Improved communication and vulnerability with partners.",
        },
      ],
    },
    {
      id: "boundaries-safety",
      title: "Boundaries & consent",
      bullets: [
        {
          id: "bs-1",
          tone: "consent",
          text: "Tantra requires enthusiastic consent—check in frequently.",
        },
        {
          id: "bs-2",
          tone: "communication",
          text: "Discuss comfort levels before beginning any practice.",
        },
        {
          id: "bs-3",
          tone: "safety",
          text: "Stop if either partner feels uncomfortable or overwhelmed.",
        },
        {
          id: "bs-4",
          tone: "consent",
          text: "Emotional intensity can arise—have a plan for grounding.",
        },
      ],
      callouts: [
        {
          id: "bs-callout",
          title: "Emotional safety",
          body: "Tantric practices can bring up deep emotions. Create a safe container for whatever arises.",
          tone: "note",
        },
      ],
    },
    {
      id: "aftercare",
      title: "Integration & aftercare",
      bullets: [
        { id: "ac-1", tone: "communication", text: "Rest together in silence after practice." },
        { id: "ac-2", tone: "practical", text: "Share what you experienced—without judgment." },
        {
          id: "ac-3",
          tone: "spiritual",
          text: "Ground yourselves: stretch, drink water, eat something light.",
        },
        {
          id: "ac-4",
          tone: "communication",
          text: "Journal about insights or emotions that arose.",
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
          text: "Do I need to be spiritual? No—you can practice Tantra as a connection tool without religious belief.",
        },
        {
          id: "faq-2",
          tone: "education",
          text: "Is Tantra always sexual? No—many practices are non-sexual and focus on energy and connection.",
        },
        {
          id: "faq-3",
          tone: "communication",
          text: "How long should we practice? Start with 15-30 minutes and build from there.",
        },
        {
          id: "faq-4",
          tone: "education",
          text: "Can I practice alone? Yes—solo Tantric practices exist for self-connection.",
        },
      ],
    },
  ],
  resources: [
    {
      id: "res-breathing",
      title: "Synchronized breathing guide",
      description: "Step-by-step instructions for breathing together with a partner.",
      tags: ["breathwork", "connection", "beginner"],
    },
    {
      id: "res-ritual",
      title: "Creating sacred space",
      description: "How to prepare your environment for Tantric practice.",
      tags: ["ritual", "preparation", "atmosphere"],
    },
    {
      id: "res-meditation",
      title: "Partner meditation scripts",
      description: "Guided meditations for couples to practice together.",
      tags: ["meditation", "spiritual", "connection"],
    },
  ],
};
