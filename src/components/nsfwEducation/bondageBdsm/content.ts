import type { EducationContent } from "./types";

/**
 * IMPORTANT CONTENT POLICY (in-app):
 * - This module is education/consent/safety-focused.
 * - It intentionally avoids explicit, graphic, or step-by-step sexual instructions.
 * - Keep language neutral and non-arousing; prioritize consent, communication, and safety.
 */
export const BONDAGE_BDSM_CONTENT: EducationContent = {
  title: "Bondage & BDSM",
  subtitle: "Consent-first, safety-focused guidance for exploring power exchange and restraint play.",
  contentRating: "18+",
  icon: "link",
  disclaimer: {
    title: "Educational & Safety Disclaimer",
    body: [
      "This module is for adult educational purposes only and is not a substitute for professional guidance.",
      "BDSM activities carry inherent risks. Always prioritize safety, consent, and communication.",
      "Never engage in activities without clear consent from all parties.",
      "If there is pain beyond agreed limits, numbness, difficulty breathing, or emotional distress—stop immediately.",
    ].join(" "),
  },
  sections: [
    {
      id: "overview",
      title: "What is BDSM?",
      summary:
        "BDSM stands for Bondage/Discipline, Dominance/Submission, and Sadism/Masochism. It encompasses a wide range of consensual activities involving power exchange, restraint, and sensation play.",
      bullets: [
        {
          id: "overview-1",
          tone: "education",
          text: "BDSM is an umbrella term covering many different practices and dynamics.",
        },
        {
          id: "overview-2",
          tone: "consent",
          text: "All BDSM activities must be Safe, Sane, and Consensual (SSC) or Risk-Aware Consensual Kink (RACK).",
        },
        {
          id: "overview-3",
          tone: "education",
          text: "Power exchange can be emotional, psychological, or physical—depending on boundaries.",
        },
      ],
      callouts: [
        {
          id: "overview-callout",
          title: "Consent is non-negotiable",
          body: "Without enthusiastic, informed consent from all parties, it's not BDSM—it's abuse. Consent must be ongoing and can be withdrawn at any time.",
          tone: "warning",
        },
      ],
    },
    {
      id: "key-components",
      title: "Core principles",
      bullets: [
        { id: "kc-1", tone: "consent", text: "Negotiate boundaries, limits, and safe words before any scene." },
        { id: "kc-2", tone: "safety", text: "Never restrain someone in a way that restricts breathing or blood flow." },
        { id: "kc-3", tone: "communication", text: "Use a traffic light system: Green (continue), Yellow (slow/check-in), Red (stop immediately)." },
        { id: "kc-4", tone: "safety", text: "Always have safety shears nearby for rope bondage." },
        { id: "kc-5", tone: "consent", text: "Discuss hard limits (absolutely not) and soft limits (maybe with negotiation)." },
      ],
    },
    {
      id: "how-to",
      title: "Getting started safely",
      summary: "A beginner's framework for exploring BDSM with a partner.",
      bullets: [
        { id: "how-1", tone: "communication", text: "Have a thorough discussion about interests, limits, and expectations outside of any sexual context." },
        { id: "how-2", tone: "consent", text: "Establish safe words: one to slow down, one to stop completely." },
        { id: "how-3", tone: "practical", text: "Start with light activities: blindfolds, soft restraints, or roleplay scenarios." },
        { id: "how-4", tone: "safety", text: "Never leave a restrained person alone. Check circulation and comfort frequently." },
        { id: "how-5", tone: "communication", text: "Debrief after each scene: what worked, what didn't, what to try next time." },
      ],
      callouts: [
        {
          id: "how-callout",
          title: "Start slow",
          body: "Begin with activities you're both comfortable with. BDSM is a journey, not a race.",
          tone: "tip",
        },
      ],
    },
    {
      id: "equipment",
      title: "Common equipment",
      summary: "Overview of beginner-friendly BDSM equipment.",
      bullets: [
        { id: "eq-1", tone: "practical", text: "Blindfolds: Reduce one sense to heighten others. Scarves or sleep masks work well." },
        { id: "eq-2", tone: "practical", text: "Soft restraints: Velcro cuffs, silk ties, or purpose-made bondage tape are beginner-friendly." },
        { id: "eq-3", tone: "safety", text: "Safety shears: Essential for quickly releasing rope or restraints in emergencies." },
        { id: "eq-4", tone: "practical", text: "Sensation toys: Feathers, wartenberg wheels, ice cubes for temperature play." },
      ],
      callouts: [
        {
          id: "eq-callout",
          title: "Quality matters",
          body: "Invest in quality equipment from reputable vendors. Cheap restraints can cause injury.",
          tone: "warning",
        },
      ],
    },
    {
      id: "boundaries-safety",
      title: "Safety essentials",
      bullets: [
        { id: "bs-1", tone: "safety", text: "Never use restraints around the neck or in ways that restrict breathing." },
        { id: "bs-2", tone: "safety", text: "Check for numbness, tingling, or color changes in restrained limbs every few minutes." },
        { id: "bs-3", tone: "consent", text: "Honor safe words immediately—no questions, no hesitation." },
        { id: "bs-4", tone: "safety", text: "Avoid alcohol or substances before scenes—impaired judgment increases risk." },
        { id: "bs-5", tone: "communication", text: "Have a plan for accidental injuries: first aid kit nearby, know when to seek medical help." },
      ],
      callouts: [
        {
          id: "bs-callout",
          title: "Red flags",
          body: "If a partner dismisses your limits, ignores safe words, or pressures you—this is not healthy BDSM. Trust your instincts.",
          tone: "warning",
        },
      ],
    },
    {
      id: "aftercare",
      title: "Aftercare",
      summary: "Emotional and physical care after a scene is essential for both partners.",
      bullets: [
        { id: "ac-1", tone: "communication", text: "Check in emotionally: How are you feeling? What do you need right now?" },
        { id: "ac-2", tone: "practical", text: "Physical care: water, snacks, blankets, gentle touch if wanted." },
        { id: "ac-3", tone: "education", text: "Sub drop and top drop are real: hormonal shifts can cause emotional lows hours or days later." },
        { id: "ac-4", tone: "communication", text: "Stay together until both partners feel stable and reconnected." },
      ],
    },
    {
      id: "faq",
      title: "Frequently asked questions",
      bullets: [
        { id: "faq-1", tone: "education", text: "Is BDSM abuse? No—when practiced with informed consent, it's a healthy form of adult intimacy." },
        { id: "faq-2", tone: "education", text: "Do I have to do everything? No—you can explore only the aspects that interest both partners." },
        { id: "faq-3", tone: "communication", text: "What if I change my mind? Consent can be withdrawn at any time. Use your safe word." },
        { id: "faq-4", tone: "education", text: "Is it normal to be interested in BDSM? Yes—many healthy adults explore power dynamics." },
      ],
    },
  ],
  resources: [
    {
      id: "res-negotiation",
      title: "Scene negotiation template",
      description: "A structured checklist for discussing limits, interests, and safe words before play.",
      tags: ["consent", "communication", "safety"],
    },
    {
      id: "res-aftercare",
      title: "Aftercare guide",
      description: "Tips for emotional and physical care after BDSM activities.",
      tags: ["aftercare", "safety", "connection"],
    },
    {
      id: "res-limits",
      title: "Yes/No/Maybe list for BDSM",
      description: "A comprehensive list of activities to discuss with your partner.",
      tags: ["boundaries", "communication"],
    },
  ],
};
