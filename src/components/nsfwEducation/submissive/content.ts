import type { EducationContent } from "./types";

/**
 * IMPORTANT CONTENT POLICY (in-app):
 * - This module is education/consent/safety-focused.
 * - It focuses on healthy submission in consensual power exchange dynamics.
 * - Keep language respectful and non-arousing; prioritize consent, safety, and communication.
 */
export const SUBMISSIVE_CONTENT: EducationContent = {
  title: "Submissive Dynamics",
  subtitle: "Understanding healthy submission in consensual power exchange relationships.",
  contentRating: "18+",
  icon: "heart-handshake",
  disclaimer: {
    title: "Educational & Consent Disclaimer",
    body: [
      "This module is for adult educational purposes only.",
      "Healthy submission is ALWAYS consensual, negotiated, and can be withdrawn at any time.",
      "Submission is a gift given by choice—it should never be demanded or coerced.",
      "If you feel pressured, unsafe, or unable to use your safe word—this is not healthy D/s.",
    ].join(" "),
  },
  sections: [
    {
      id: "overview",
      title: "What is submission?",
      summary:
        "In consensual power exchange, submission is the voluntary giving of control to a trusted partner within negotiated boundaries.",
      bullets: [
        {
          id: "overview-1",
          tone: "education",
          text: "Submission is a choice, not a personality trait or weakness.",
        },
        {
          id: "overview-2",
          tone: "consent",
          text: "True submission requires a trustworthy dominant who respects boundaries.",
        },
        {
          id: "overview-3",
          tone: "education",
          text: "Submission can be sexual, service-oriented, or emotional—or any combination.",
        },
      ],
      callouts: [
        {
          id: "overview-callout",
          title: "Submission ≠ Weakness",
          body: "Choosing to submit takes strength, self-knowledge, and trust. It's an active choice, not passive acceptance.",
          tone: "note",
        },
      ],
    },
    {
      id: "why",
      title: "Why people enjoy submission",
      summary: "Understanding the appeal of submissive dynamics.",
      bullets: [
        {
          id: "why-1",
          tone: "education",
          text: "Freedom from decision-making: relaxing into being led.",
        },
        {
          id: "why-2",
          tone: "education",
          text: "Deep trust: the intimacy of surrendering to someone trustworthy.",
        },
        {
          id: "why-3",
          tone: "education",
          text: "Heightened sensation: vulnerability can intensify physical and emotional experiences.",
        },
        {
          id: "why-4",
          tone: "education",
          text: "Service and pleasing: finding joy in providing for a partner's needs.",
        },
        {
          id: "why-5",
          tone: "education",
          text: "Structure and guidance: some find comfort in rules and expectations.",
        },
      ],
    },
    {
      id: "key-components",
      title: "Elements of healthy submission",
      bullets: [
        {
          id: "kc-1",
          tone: "consent",
          text: "Negotiation: All dynamics are discussed and agreed upon beforehand.",
        },
        {
          id: "kc-2",
          tone: "consent",
          text: "Limits: Hard and soft limits are respected absolutely.",
        },
        {
          id: "kc-3",
          tone: "communication",
          text: "Safe words: Always available and honored immediately.",
        },
        {
          id: "kc-4",
          tone: "consent",
          text: "Revocability: Consent can be withdrawn at any time for any reason.",
        },
        {
          id: "kc-5",
          tone: "communication",
          text: "Regular check-ins: Outside of scenes, discuss how the dynamic is working.",
        },
      ],
    },
    {
      id: "how-to",
      title: "Exploring submission safely",
      summary: "A framework for those interested in submissive roles.",
      bullets: [
        {
          id: "how-1",
          tone: "communication",
          text: "Self-reflection: Understand your desires, fears, and boundaries.",
        },
        {
          id: "how-2",
          tone: "communication",
          text: "Communicate: Share your interests with a trusted partner.",
        },
        {
          id: "how-3",
          tone: "consent",
          text: "Negotiate: Discuss what submission looks like for you both.",
        },
        {
          id: "how-4",
          tone: "practical",
          text: "Start small: Begin with low-stakes power exchange exercises.",
        },
        {
          id: "how-5",
          tone: "communication",
          text: "Debrief: After each experience, discuss what worked and what didn't.",
        },
      ],
      callouts: [
        {
          id: "how-callout",
          title: "Trust is earned",
          body: "Don't rush into intense submission. Build trust gradually with a consistent partner.",
          tone: "tip",
        },
      ],
    },
    {
      id: "communication",
      title: "Communication in D/s",
      summary: "How to communicate effectively in power exchange relationships.",
      bullets: [
        {
          id: "comm-1",
          tone: "communication",
          text: "Be honest about desires, even if they feel vulnerable to share.",
        },
        {
          id: "comm-2",
          tone: "communication",
          text: "Speak up about discomfort—good dominants want to know.",
        },
        {
          id: "comm-3",
          tone: "communication",
          text: "Regular relationship check-ins outside of scenes.",
        },
        { id: "comm-4", tone: "consent", text: "Never apologize for using a safe word." },
      ],
    },
    {
      id: "boundaries-safety",
      title: "Safety & red flags",
      bullets: [
        {
          id: "bs-1",
          tone: "safety",
          text: "A good dominant respects limits and never punishes safe word use.",
        },
        {
          id: "bs-2",
          tone: "safety",
          text: "Isolation from friends/family is a red flag, not a kink.",
        },
        {
          id: "bs-3",
          tone: "consent",
          text: "Pressure to submit faster or deeper than you're ready is coercion.",
        },
        {
          id: "bs-4",
          tone: "safety",
          text: "Financial control without explicit consent is abuse, not D/s.",
        },
        {
          id: "bs-5",
          tone: "communication",
          text: "You always have the right to renegotiate or end the dynamic.",
        },
      ],
      callouts: [
        {
          id: "bs-callout",
          title: "Trust your instincts",
          body: "If something feels wrong, it probably is. Healthy D/s should feel safe, even when it's intense.",
          tone: "warning",
        },
      ],
    },
    {
      id: "aftercare",
      title: "Aftercare for submissives",
      summary: "Caring for yourself after scenes and power exchange.",
      bullets: [
        {
          id: "ac-1",
          tone: "communication",
          text: "Communicate what you need: comfort, space, reassurance, touch.",
        },
        { id: "ac-2", tone: "practical", text: "Physical care: water, snacks, warmth, rest." },
        {
          id: "ac-3",
          tone: "education",
          text: "Sub drop is real: you may feel emotional or low hours/days later.",
        },
        {
          id: "ac-4",
          tone: "communication",
          text: "Stay connected with your dominant for support after intense scenes.",
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
          text: "Is submission 24/7? Only if negotiated—most dynamics are scene-based or part-time.",
        },
        {
          id: "faq-2",
          tone: "education",
          text: "Can I be submissive sometimes and dominant others? Yes—switching is common.",
        },
        {
          id: "faq-3",
          tone: "communication",
          text: "What if my partner doesn't want to dominate? Explore other dynamics or find compatible partners.",
        },
        {
          id: "faq-4",
          tone: "consent",
          text: "Can I change my limits? Absolutely—boundaries evolve. Renegotiate as needed.",
        },
      ],
    },
  ],
  resources: [
    {
      id: "res-checklist",
      title: "Submissive self-assessment",
      description: "Questions to help you understand your desires and boundaries.",
      tags: ["self-reflection", "boundaries", "beginner"],
    },
    {
      id: "res-redflags",
      title: "Red flags checklist",
      description: "Warning signs of unhealthy or abusive dynamics.",
      tags: ["safety", "awareness", "protection"],
    },
    {
      id: "res-aftercare",
      title: "Aftercare planning worksheet",
      description: "Plan what you need after intense scenes.",
      tags: ["aftercare", "self-care", "communication"],
    },
  ],
};
