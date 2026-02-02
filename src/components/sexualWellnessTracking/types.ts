import type {
  SexualWellnessEntry,
  SexualWellnessGoal,
  SexualWellnessPattern,
} from "@/lib/sexualWellness";

export type SexualWellnessTab = "entry" | "history" | "goals" | "insights";

export type SexualWellnessEntryDraft = Partial<
  Omit<SexualWellnessEntry, "id" | "user_id" | "created_at" | "updated_at" | "wellness_score">
>;

export type SexualWellnessStatistics = Awaited<
  ReturnType<typeof import("@/lib/sexualWellness").getSexualWellnessStatistics>
>;

export type { SexualWellnessEntry, SexualWellnessGoal, SexualWellnessPattern };
