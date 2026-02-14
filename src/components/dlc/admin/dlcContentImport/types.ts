export type ImportType = "positions" | "videos" | "topics";

export type TopicsPackageId =
  | "dlc-topic-power-dynamics"
  | "dlc-topic-tantric"
  | "dlc-topic-kama-sutra"
  | "dlc-topic-roleplay"
  | "dlc-topic-male-pleasure";

export type ImportResult = {
  jobId: string;
  dryRun: boolean;
  summary: { completed: number; failed: number; skipped: number; itemCount: number };
  results: Array<{ key: string; status: string; error?: string }>;
};

export type ParsedCsvRow = Record<string, string>;

export type ImportPayload = {
  importType: ImportType;
  items: unknown[];
  sourceFileName?: string;
  dryRun?: boolean;
};
