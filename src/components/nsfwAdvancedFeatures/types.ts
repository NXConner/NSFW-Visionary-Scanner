import type {
  IntimateDateProposal,
  SeductiveAIMessageRow,
  SeductiveAISession,
} from "@/lib/nsfwAdvancedFeatures";

export type LocationType = NonNullable<IntimateDateProposal["location_type"]>;
export type AiPersonality = Exclude<SeductiveAISession["ai_personality"], "custom">;
export type AiIntensity = SeductiveAISession["ai_intensity"];

export type AiMessage = SeductiveAIMessageRow;
