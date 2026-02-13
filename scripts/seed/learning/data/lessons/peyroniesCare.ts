import type { LessonSeed } from "../../types";

export const learningLessonsPeyroniesCare: LessonSeed[] = [
  {
    key: "pd-overview",
    moduleKey: "pd-understanding",
    title: "What Peyronie's disease is",
    order_index: 1,
    estimated_duration_minutes: 15,
    content_type: "text",
    content_data: {
      text: [
        "Peyronie's involves scar tissue that can cause curvature or pain.",
        "Early detection helps track changes and guide care.",
        "Medical advice is recommended if curvature progresses quickly.",
      ].join("\n"),
    },
  },
  {
    key: "pd-symptoms",
    moduleKey: "pd-understanding",
    title: "Common symptoms and warning signs",
    order_index: 2,
    estimated_duration_minutes: 15,
    content_type: "text",
    content_data: {
      text: [
        "Look for curvature changes, palpable plaques, or persistent pain.",
        "Track changes monthly with consistent photos.",
        "Note any functional impact on erections or comfort.",
      ].join("\n"),
    },
  },
  {
    key: "pd-assessment-basics",
    moduleKey: "pd-understanding",
    title: "Baseline assessment",
    order_index: 3,
    estimated_duration_minutes: 15,
    content_type: "text",
    content_data: {
      text: [
        "Measure length, girth, and curvature angle in a consistent state.",
        "Use the same lighting and angle for documentation photos.",
        "Record pain levels and frequency.",
      ].join("\n"),
    },
  },
  {
    key: "pd-medical-options",
    moduleKey: "pd-options",
    title: "Medical treatment overview",
    order_index: 1,
    estimated_duration_minutes: 20,
    content_type: "text",
    content_data: {
      text: [
        "Discuss medical options with a urologist if symptoms persist.",
        "Treatments vary by stage and severity.",
        "Do not attempt aggressive self-treatment during acute pain.",
      ].join("\n"),
    },
  },
  {
    key: "pd-noninvasive",
    moduleKey: "pd-options",
    title: "Non-invasive support strategies",
    order_index: 2,
    estimated_duration_minutes: 15,
    content_type: "text",
    content_data: {
      text: [
        "Gentle stretching and traction may be recommended by clinicians.",
        "Avoid high pressure or painful techniques.",
        "Log response and pause if discomfort increases.",
      ].join("\n"),
    },
  },
  {
    key: "pd-lifestyle",
    moduleKey: "pd-options",
    title: "Lifestyle factors that help",
    order_index: 3,
    estimated_duration_minutes: 15,
    content_type: "text",
    content_data: {
      text: [
        "Prioritize sleep, reduce smoking, and manage stress.",
        "Address cardiovascular health for better tissue recovery.",
        "Maintain open communication with partners.",
      ].join("\n"),
    },
  },
  {
    key: "pd-curvature-tracking",
    moduleKey: "pd-monitoring",
    title: "Curvature tracking workflow",
    order_index: 1,
    estimated_duration_minutes: 15,
    content_type: "text",
    content_data: {
      text: [
        "Use consistent photo angles and measurement tools.",
        "Record curvature angle monthly, not daily.",
        "Note changes in pain or function.",
      ].join("\n"),
    },
  },
  {
    key: "pd-pain-log",
    moduleKey: "pd-monitoring",
    title: "Pain and symptom log",
    order_index: 2,
    estimated_duration_minutes: 15,
    content_type: "text",
    content_data: {
      text: [
        "Track pain intensity, duration, and triggers.",
        "Use the diary to note medication or therapy changes.",
        "Share logs with your clinician if symptoms persist.",
      ].join("\n"),
    },
  },
  {
    key: "pd-clinician-prep",
    moduleKey: "pd-monitoring",
    title: "Preparing for clinician visits",
    order_index: 3,
    estimated_duration_minutes: 15,
    content_type: "text",
    content_data: {
      text: [
        "Bring measurement data, photos, and symptom notes.",
        "List current treatments and questions in advance.",
        "Ask about next steps and realistic timelines.",
      ].join("\n"),
    },
  },
];
