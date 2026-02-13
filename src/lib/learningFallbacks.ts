export type ModuleFallbackInput = {
  title: string;
  description?: string | null;
  category?: string | null;
  difficultyLevel?: string | null;
  estimatedMinutes?: number | null;
};

export type LessonFallbackInput = {
  title: string;
  contentType?: string | null;
  estimatedMinutes?: number | null;
  moduleTitle?: string | null;
};

export type FallbackSection = {
  title: string;
  bullets: string[];
  note?: string;
};

export type FallbackContent = {
  summary: string;
  sections: FallbackSection[];
};

function normalize(value: unknown): string {
  return String(value ?? "").trim();
}

function toLabel(value: string | null | undefined, fallback: string): string {
  const v = normalize(value);
  return v || fallback;
}

function formatMinutes(minutes?: number | null): string | null {
  const n = Number(minutes ?? 0);
  if (!Number.isFinite(n) || n <= 0) return null;
  if (n < 60) return `${Math.round(n)} min`;
  const hrs = Math.floor(n / 60);
  const mins = Math.round(n % 60);
  return mins > 0 ? `${hrs} hr ${mins} min` : `${hrs} hr`;
}

export function buildModuleFallback(input: ModuleFallbackInput): FallbackContent {
  const topic = toLabel(input.category, "this topic");
  const difficulty = toLabel(input.difficultyLevel, "standard");
  const duration = formatMinutes(input.estimatedMinutes);

  const summaryParts = [
    normalize(input.description),
    `This module provides a structured walkthrough of ${topic} with clear steps, safety checks, and documentation guidance.`,
    `Difficulty: ${difficulty}.`,
  ].filter(Boolean);

  if (duration) summaryParts.push(`Estimated time: ${duration}.`);

  return {
    summary: summaryParts.join(" "),
    sections: [
      {
        title: "Objectives",
        bullets: [
          `Clarify key terms and decision points for ${topic}.`,
          "Use the in-app checklist to document findings consistently.",
          "Identify follow-up actions and required approvals.",
        ],
      },
      {
        title: "Checklist",
        bullets: [
          "Confirm prerequisites, tools, and safety requirements.",
          "Capture photos or measurements in the recommended order.",
          "Record notes and tag any blockers or risks.",
        ],
        note:
          "If you are working with a partner or team, align on the handoff steps before you close out the module.",
      },
      {
        title: "Next steps",
        bullets: [
          "Review the related lesson for deeper technique guidance.",
          "Add any follow-up tasks to the project tracker.",
          "Share findings with stakeholders using the export tools.",
        ],
      },
    ],
  };
}

export function buildLessonFallback(input: LessonFallbackInput): FallbackContent {
  const contentType = normalize(input.contentType || "guide");
  const duration = formatMinutes(input.estimatedMinutes);
  const moduleLabel = toLabel(input.moduleTitle, "this module");

  const summaryParts = [
    `This lesson supports ${moduleLabel} with focused, practical guidance.`,
    `Format: ${contentType}.`,
  ];
  if (duration) summaryParts.push(`Estimated time: ${duration}.`);

  return {
    summary: summaryParts.join(" "),
    sections: [
      {
        title: "Lesson goals",
        bullets: [
          `Apply the core steps covered in "${input.title}".`,
          "Document observations in a consistent, repeatable way.",
          "Identify any corrective actions or escalation points.",
        ],
      },
      {
        title: "Try this",
        bullets: [
          "Complete the steps in the order presented.",
          "Capture key evidence (photos, measurements, notes).",
          "Compare results to the baseline or prior record.",
        ],
      },
      {
        title: "After action",
        bullets: [
          "Log outcomes and confirm the next milestone.",
          "Share updates with the project team or client.",
          "Move to the next lesson when ready.",
        ],
      },
    ],
  };
}
