import type { LessonSeed } from "../../types";

export const learningLessonsPelvicFloorEq: LessonSeed[] = [
  {
    key: "pf-identify",
    moduleKey: "pf-basics",
    title: "Identify pelvic floor muscles",
    order_index: 1,
    estimated_duration_minutes: 15,
    content_type: "text",
    content_data: {
      text: [
        "Gently contract as if stopping gas, then fully relax.",
        "Avoid clenching glutes or holding your breath.",
        "If unsure, consult a pelvic health professional.",
      ].join("\n"),
    },
  },
  {
    key: "pf-breath-coordination",
    moduleKey: "pf-basics",
    title: "Breathing coordination",
    order_index: 2,
    estimated_duration_minutes: 15,
    content_type: "text",
    content_data: {
      text: [
        "Inhale to relax, exhale to gently lift.",
        "Keep the abdomen relaxed and shoulders down.",
        "Use slow breathing to reduce tension.",
      ].join("\n"),
    },
  },
  {
    key: "pf-mistakes",
    moduleKey: "pf-basics",
    title: "Common mistakes to avoid",
    order_index: 3,
    estimated_duration_minutes: 10,
    content_type: "text",
    content_data: {
      text: [
        "Do not hold breath or strain.",
        "Avoid overtraining; soreness is a sign to rest.",
        "Balance contraction with full relaxation.",
      ].join("\n"),
    },
  },
  {
    key: "pf-beginner-routine",
    moduleKey: "pf-training",
    title: "Beginner routine",
    order_index: 1,
    estimated_duration_minutes: 15,
    content_type: "text",
    content_data: {
      text: [
        "Start with 5 gentle contractions, 5 seconds each.",
        "Rest 5-10 seconds between reps.",
        "Repeat for 2-3 sets, 3 times per week.",
      ].join("\n"),
    },
  },
  {
    key: "pf-progression",
    moduleKey: "pf-training",
    title: "Progressive overload",
    order_index: 2,
    estimated_duration_minutes: 20,
    content_type: "text",
    content_data: {
      text: [
        "Increase hold time gradually before adding more reps.",
        "Add quick pulses after steady holds for control.",
        "Log fatigue and adjust frequency as needed.",
      ].join("\n"),
    },
  },
  {
    key: "pf-integration-pe",
    moduleKey: "pf-training",
    title: "Integrating with PE routines",
    order_index: 3,
    estimated_duration_minutes: 15,
    content_type: "text",
    content_data: {
      text: [
        "Schedule pelvic floor work on lighter PE days.",
        "Avoid heavy pelvic floor work on the same day as intense sessions.",
        "Focus on quality of contraction rather than volume.",
      ].join("\n"),
    },
  },
  {
    key: "pf-sleep-stress",
    moduleKey: "pf-integration",
    title: "Sleep and stress impact",
    order_index: 1,
    estimated_duration_minutes: 15,
    content_type: "text",
    content_data: {
      text: [
        "Sleep quality directly affects recovery and EQ.",
        "Stress can increase pelvic floor tension and reduce comfort.",
        "Use relaxation routines on high-stress days.",
      ].join("\n"),
    },
  },
  {
    key: "pf-mobility",
    moduleKey: "pf-integration",
    title: "Mobility and hip support",
    order_index: 2,
    estimated_duration_minutes: 15,
    content_type: "text",
    content_data: {
      text: [
        "Stretch hips, glutes, and hamstrings to reduce tension.",
        "Avoid aggressive stretching if you feel pain.",
        "Combine mobility with gentle breathing exercises.",
      ].join("\n"),
    },
  },
  {
    key: "pf-when-to-pause",
    moduleKey: "pf-integration",
    title: "When to pause training",
    order_index: 3,
    estimated_duration_minutes: 10,
    content_type: "text",
    content_data: {
      text: [
        "Pause if you feel pelvic pain, spasms, or urinary discomfort.",
        "Rest for several days and reassess.",
        "Seek professional care if symptoms persist.",
      ].join("\n"),
    },
  },
];
