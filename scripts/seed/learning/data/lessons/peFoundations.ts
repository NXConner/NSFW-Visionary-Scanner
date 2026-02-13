import type { LessonSeed } from "../../types";

export const learningLessonsPeFoundations: LessonSeed[] = [
  {
    key: "pe-contraindications",
    moduleKey: "pe-safety",
    title: "Contraindications and red flags",
    order_index: 1,
    estimated_duration_minutes: 15,
    content_type: "text",
    content_data: {
      text: [
        "Do not train through sharp pain, bruising, or numbness.",
        "If you have diagnosed Peyronie's or sudden curvature changes, seek medical guidance first.",
        "Stop immediately if you notice discoloration, loss of sensation, or swelling.",
      ].join("\n"),
      checklist: ["Review personal medical history", "Log any current pain or curvature changes"],
      deliverables: ["Safety checklist completed"],
    },
  },
  {
    key: "pe-warmup",
    moduleKey: "pe-safety",
    title: "Warm-up and tissue prep",
    order_index: 2,
    estimated_duration_minutes: 15,
    content_type: "text",
    content_data: {
      text: [
        "Warm tissue with a gentle heat source for 5-8 minutes.",
        "Use light massage to increase circulation before any technique.",
        "Hydrate and avoid rushing into higher intensity.",
      ].join("\n"),
      checklist: ["Heat applied", "Light massage completed", "Hydration check"],
    },
  },
  {
    key: "pe-stop-signals",
    moduleKey: "pe-safety",
    title: "Stop rules and recovery cues",
    order_index: 3,
    estimated_duration_minutes: 20,
    content_type: "text",
    content_data: {
      text: [
        "Treat discomfort as a signal to reduce intensity or stop.",
        "Healthy sessions should not cause persistent pain or bruising.",
        "Prioritize long-term safety over short-term intensity.",
      ].join("\n"),
      deliverables: ["Stop rules recorded in notes"],
    },
  },
  {
    key: "pe-goals",
    moduleKey: "pe-routine",
    title: "Goal setting and expectations",
    order_index: 1,
    estimated_duration_minutes: 15,
    content_type: "text",
    content_data: {
      text: [
        "Define realistic goals focused on health, confidence, and function.",
        "Track progress monthly rather than day-to-day.",
        "Avoid comparing to unrealistic standards.",
      ].join("\n"),
      checklist: ["Goal written", "Baseline measurements captured"],
    },
  },
  {
    key: "pe-technique-selection",
    moduleKey: "pe-routine",
    title: "Choosing low-risk techniques",
    order_index: 2,
    estimated_duration_minutes: 20,
    content_type: "text",
    content_data: {
      text: [
        "Start with gentle stretching and avoid high pressure early on.",
        "Build tolerance slowly and track response in your diary.",
        "If unsure, prioritize pelvic floor work and circulation-based routines.",
      ].join("\n"),
    },
  },
  {
    key: "pe-weekly-schedule",
    moduleKey: "pe-routine",
    title: "Weekly scheduling template",
    order_index: 3,
    estimated_duration_minutes: 15,
    content_type: "text",
    content_data: {
      text: [
        "Use 2-4 sessions per week with rest days between.",
        "Avoid stacking multiple intense techniques in one session.",
        "Log time, intensity, and recovery response.",
      ].join("\n"),
      deliverables: ["Weekly schedule saved in app"],
    },
  },
  {
    key: "pe-recovery-windows",
    moduleKey: "pe-recovery",
    title: "Recovery windows and deloads",
    order_index: 1,
    estimated_duration_minutes: 15,
    content_type: "text",
    content_data: {
      text: [
        "Plan at least one deload week every 4-6 weeks.",
        "Recovery is where adaptation happens; do not skip it.",
        "Sleep, hydration, and stress management support recovery.",
      ].join("\n"),
    },
  },
  {
    key: "pe-eq-check",
    moduleKey: "pe-recovery",
    title: "EQ checks and circulation",
    order_index: 2,
    estimated_duration_minutes: 15,
    content_type: "text",
    content_data: {
      text: [
        "Track morning and situational EQ for baseline comparison.",
        "Note any drop in quality and reduce intensity accordingly.",
        "Use gentle massage and rest if circulation feels reduced.",
      ].join("\n"),
    },
  },
  {
    key: "pe-adjustments",
    moduleKey: "pe-recovery",
    title: "Adjusting intensity safely",
    order_index: 3,
    estimated_duration_minutes: 20,
    content_type: "text",
    content_data: {
      text: [
        "Increase duration or intensity only after consistent recovery.",
        "If pain or discoloration appears, pause and reassess.",
        "Seek professional guidance for persistent symptoms.",
      ].join("\n"),
    },
  },
];
