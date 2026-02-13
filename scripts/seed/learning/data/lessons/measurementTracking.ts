import type { LessonSeed } from "../../types";

export const learningLessonsMeasurementTracking: LessonSeed[] = [
  {
    key: "measure-positions",
    moduleKey: "measure-standards",
    title: "Standard measurement positions",
    order_index: 1,
    estimated_duration_minutes: 15,
    content_type: "text",
    content_data: {
      text: [
        "Measure in the same body position and arousal state each time.",
        "Record length and girth in consistent units.",
        "Avoid measuring when fatigued or after intense sessions.",
      ].join("\n"),
    },
  },
  {
    key: "measure-tools",
    moduleKey: "measure-standards",
    title: "Tools and consistency",
    order_index: 2,
    estimated_duration_minutes: 15,
    content_type: "text",
    content_data: {
      text: [
        "Use a firm ruler for length and a flexible tape for girth.",
        "Confirm zero points and alignment before recording.",
        "Repeat measurements twice for accuracy.",
      ].join("\n"),
    },
  },
  {
    key: "measure-photos",
    moduleKey: "measure-standards",
    title: "Photo documentation basics",
    order_index: 3,
    estimated_duration_minutes: 10,
    content_type: "text",
    content_data: {
      text: [
        "Use consistent lighting and angles.",
        "Store photos securely with privacy settings enabled.",
        "Capture curvature angles if monitoring Peyronie's.",
      ].join("\n"),
    },
  },
  {
    key: "measure-variance",
    moduleKey: "measure-analysis",
    title: "Normal variance and error",
    order_index: 1,
    estimated_duration_minutes: 15,
    content_type: "text",
    content_data: {
      text: [
        "Small variations are normal; focus on trends.",
        "Track at consistent intervals (monthly or bi-monthly).",
        "Avoid frequent measurements that increase anxiety.",
      ].join("\n"),
    },
  },
  {
    key: "measure-trends",
    moduleKey: "measure-analysis",
    title: "Interpreting trends",
    order_index: 2,
    estimated_duration_minutes: 15,
    content_type: "text",
    content_data: {
      text: [
        "Use the progress charts to visualize changes.",
        "Compare with recovery and routine changes.",
        "Adjust routines only after multiple data points.",
      ].join("\n"),
    },
  },
  {
    key: "measure-goals",
    moduleKey: "measure-analysis",
    title: "Milestones and goals",
    order_index: 3,
    estimated_duration_minutes: 10,
    content_type: "text",
    content_data: {
      text: [
        "Set milestones based on health and function goals.",
        "Celebrate consistency rather than single measurements.",
        "Use goals to maintain safe pacing.",
      ].join("\n"),
    },
  },
  {
    key: "measure-privacy",
    moduleKey: "measure-data",
    title: "Data privacy essentials",
    order_index: 1,
    estimated_duration_minutes: 10,
    content_type: "text",
    content_data: {
      text: [
        "Enable app lock and secure backups.",
        "Avoid sharing sensitive data without consent.",
        "Review privacy settings regularly.",
      ].join("\n"),
    },
  },
  {
    key: "measure-export",
    moduleKey: "measure-data",
    title: "Exporting data for clinicians",
    order_index: 2,
    estimated_duration_minutes: 10,
    content_type: "text",
    content_data: {
      text: [
        "Use the export tool to generate a summary report.",
        "Include measurement history, notes, and symptom logs.",
        "Share only with trusted medical professionals.",
      ].join("\n"),
    },
  },
  {
    key: "measure-backup",
    moduleKey: "measure-data",
    title: "Backup and retention planning",
    order_index: 3,
    estimated_duration_minutes: 10,
    content_type: "text",
    content_data: {
      text: [
        "Schedule regular backups for long-term tracking.",
        "Review retention settings if you want automatic cleanup.",
        "Keep a secure copy before device changes.",
      ].join("\n"),
    },
  },
];
