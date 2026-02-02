export type PelvicFloorGoal =
  | "erection_quality"
  | "ejaculation_control"
  | "urinary_control"
  | "pelvic_pain_relaxation"
  | "core_support"
  | "general_fitness";

export type PelvicFloorLevel = "beginner" | "intermediate" | "advanced";

export type KegelExerciseId =
  | "basic_kegels"
  | "quick_flicks"
  | "endurance_holds"
  | "elevator_kegels"
  | "reverse_kegels"
  | "co_contraction_breathing";

export type KegelRoutine = {
  id: string;
  title: string;
  level: PelvicFloorLevel;
  goals: PelvicFloorGoal[];
  estimatedMinutes: number;
  frequency: string;
  notes: string[];
  steps: Array<{
    id: KegelExerciseId;
    title: string;
    prescription: string;
    cues: string[];
    avoid: string[];
  }>;
};

export type CuratedResource = {
  id: string;
  title: string;
  description: string;
  href: string;
  kind: "evidence" | "clinic" | "guide" | "video-search";
};

export const PELVIC_FLOOR_QUICK_FAQ: Array<{ q: string; a: string }> = [
  {
    q: "What muscles are we talking about?",
    a: "Your pelvic floor is a sling of muscles that supports pelvic organs and helps control urinary/anal sphincters. In men, it also contributes to erection quality and ejaculation control; in women, it supports bladder/bowel function and pelvic stability.",
  },
  {
    q: "How do I find the right muscle without guessing?",
    a: "A safe starter cue is: gently tighten as if stopping gas, then relax fully. You can briefly test by stopping urine once to identify the muscle—but don’t make that your practice method.",
  },
  {
    q: "How long until results?",
    a: "Most people notice changes in 4–8 weeks with consistent practice, depending on baseline strength, technique, and whether relaxation (reverse kegels) is also needed.",
  },
  {
    q: "Can I overdo it?",
    a: "Yes. Overtraining can increase pelvic floor tension and cause discomfort, urinary urgency, or pain. Balance strengthening with full relaxation and rest days when needed.",
  },
];

export const PELVIC_FLOOR_COMMON_MISTAKES: Array<{ title: string; fix: string }> = [
  {
    title: "Clenching glutes, abs, or inner thighs",
    fix: "Keep your butt and belly soft. Place a hand on your abdomen—if it hardens, reduce intensity and focus on a smaller, internal lift.",
  },
  {
    title: "Holding your breath",
    fix: "Exhale gently during the lift and inhale during the release. Breath-holding spikes pressure and makes it harder to isolate the pelvic floor.",
  },
  {
    title: "Squeezing too hard (max effort every rep)",
    fix: "Aim for controlled, repeatable contractions (about 30–60% effort at first). Quality and full relaxation matter more than intensity.",
  },
  {
    title: "Not relaxing fully between reps",
    fix: "Treat the release as part of the exercise. Pause long enough to feel the muscle soften before the next repetition.",
  },
  {
    title: "Practicing by stopping urine repeatedly",
    fix: "Only use the “stop urine once” cue to identify the muscle. Doing it repeatedly can irritate the bladder and reinforce poor coordination.",
  },
];

export const PELVIC_FLOOR_SAFETY: {
  do: string[];
  avoid: string[];
  considerClinicianIf: string[];
} = {
  do: [
    "Start with small, pain-free contractions and build gradually.",
    "Prioritize full relaxation between reps and include reverse kegels if you feel tightness.",
    "Stop and rest if you get pelvic pain, burning, or worsening urinary symptoms.",
    "If you recently had surgery, severe pain, or neurological symptoms, follow clinician guidance first.",
  ],
  avoid: [
    "High-intensity squeezing all day long (especially while stressed).",
    "Training through sharp pain or numbness.",
    "Repeatedly stopping urine as a daily workout.",
    "Treating this as a “more is always better” exercise—recovery matters.",
  ],
  considerClinicianIf: [
    "Pelvic, testicular, penile, or rectal pain persists or worsens with training.",
    "You have significant urinary urgency, leakage, or retention.",
    "You suspect pelvic floor “overactivity” (tightness, pain, difficulty relaxing).",
    "You have a history of prostatitis, pelvic floor dysfunction, or pelvic surgery.",
  ],
};

export const PELVIC_FLOOR_ROUTINES: KegelRoutine[] = [
  {
    id: "pf-beginner-balance",
    title: "Beginner Balance (Strength + Relaxation)",
    level: "beginner",
    goals: ["general_fitness", "urinary_control", "erection_quality", "core_support"],
    estimatedMinutes: 6,
    frequency: "4–6 days/week",
    notes: [
      "Focus on technique first: small lift + full release.",
      "If you feel tightness, increase relaxation time and add more reverse kegels.",
    ],
    steps: [
      {
        id: "basic_kegels",
        title: "Basic Kegels",
        prescription: "2 sets × 8 reps • 3–5 sec hold • 5–7 sec relax",
        cues: ["Exhale gently as you lift", "Think: lift inward/upward—not squeeze outward"],
        avoid: ["Glute clench", "Breath-hold", "Max-effort squeezing"],
      },
      {
        id: "reverse_kegels",
        title: "Reverse Kegels (Relaxation)",
        prescription: "2 sets × 6 slow reps • 4–6 sec relax/expand",
        cues: ["Inhale into belly/pelvis", "Let the pelvic floor drop/soften"],
        avoid: ["Straining", "Pushing hard like bowel movement"],
      },
    ],
  },
  {
    id: "pf-control-quick-flicks",
    title: "Control & Coordination (Quick Flicks + Breath)",
    level: "intermediate",
    goals: ["ejaculation_control", "erection_quality", "general_fitness"],
    estimatedMinutes: 8,
    frequency: "3–5 days/week",
    notes: ["Use smaller contractions. Quick doesn’t mean hard."],
    steps: [
      {
        id: "co_contraction_breathing",
        title: "Breath-Coordinated Lifts",
        prescription: "1 set × 6 reps • 3 sec lift on exhale • 6 sec relax on inhale",
        cues: ["Exhale + lift", "Inhale + soften"],
        avoid: ["Rib flare", "Holding breath"],
      },
      {
        id: "quick_flicks",
        title: "Quick Flicks",
        prescription: "3 rounds × 10 quick reps • 20–30 sec rest between rounds",
        cues: ["Fast ON, fully OFF", "Stay relaxed everywhere else"],
        avoid: ["Tension creep", "Jaw/neck clenching"],
      },
      {
        id: "reverse_kegels",
        title: "Reverse Kegels (Reset)",
        prescription: "1–2 minutes of slow relaxation breaths",
        cues: ["Inhale: soften down", "Exhale: keep it neutral (no clench)"],
        avoid: ["Straining"],
      },
    ],
  },
  {
    id: "pf-endurance-elevator",
    title: "Endurance & “Elevator” Progression",
    level: "advanced",
    goals: ["erection_quality", "urinary_control", "core_support"],
    estimatedMinutes: 10,
    frequency: "3–4 days/week (with rest days)",
    notes: [
      "Only do long holds if you can relax completely after.",
      "If you feel pelvic heaviness/tension later in the day, reduce volume.",
    ],
    steps: [
      {
        id: "endurance_holds",
        title: "Endurance Holds",
        prescription: "3 sets × 5 reps • 8–12 sec hold • 10–15 sec relax",
        cues: ["Steady, not maximal", "Maintain normal breathing"],
        avoid: ["Shaking/straining", "Holding breath"],
      },
      {
        id: "elevator_kegels",
        title: "Elevator Kegels (3 levels)",
        prescription: "5 reps • Lift 1→2→3 (2 sec each), then descend 3→2→1",
        cues: ["Think of graded control", "Smooth steps, no jerks"],
        avoid: ["Jumping straight to max", "Losing the relax at the bottom"],
      },
      {
        id: "reverse_kegels",
        title: "Reverse Kegels (Cool-down)",
        prescription: "2 minutes",
        cues: ["Inhale expansion", "Exhale neutral"],
        avoid: ["Pushing"],
      },
    ],
  },
];

export const PELVIC_FLOOR_RESOURCES: CuratedResource[] = [
  {
    id: "medlineplus",
    title: "MedlinePlus (NIH) – Health information",
    description:
      "Evidence-based health info and references (search pelvic floor / Kegel exercises).",
    href: "https://medlineplus.gov/",
    kind: "evidence",
  },
  {
    id: "mayo",
    title: "Mayo Clinic – Kegel exercises overview",
    description: "Clinical overview and technique reminders (search within site if needed).",
    href: "https://www.mayoclinic.org/",
    kind: "clinic",
  },
  {
    id: "cleveland",
    title: "Cleveland Clinic – Pelvic floor exercises",
    description: "Patient education articles and common mistakes.",
    href: "https://my.clevelandclinic.org/",
    kind: "clinic",
  },
  {
    id: "youtube-search",
    title: "YouTube (search) – Pelvic floor exercises (educational)",
    description:
      "Search for “pelvic floor physical therapist kegel exercises” and choose non-explicit, clinician-led demos.",
    href: "https://www.youtube.com/results?search_query=pelvic+floor+physical+therapist+kegel+exercises",
    kind: "video-search",
  },
];
