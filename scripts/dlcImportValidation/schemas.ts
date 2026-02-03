import { z } from "zod";

// Shared primitives
const nonEmpty = z.string().trim().min(1);
const optionalString = z
  .string()
  .trim()
  .optional()
  .transform(v => (v && v.length ? v : undefined));

const boolish = z
  .union([
    z.boolean(),
    z.literal("true"),
    z.literal("false"),
    z.literal("1"),
    z.literal("0"),
    z.literal("yes"),
    z.literal("no"),
  ])
  .optional()
  .transform(v => {
    if (v === undefined) return undefined;
    if (typeof v === "boolean") return v;
    const s = String(v).trim().toLowerCase();
    return s === "true" || s === "1" || s === "yes";
  });

const pipeList = z
  .string()
  .optional()
  .transform(v =>
    String(v ?? "")
      .split("|")
      .map(x => x.trim())
      .filter(Boolean),
  );

export const importTypeSchema = z.enum(["positions", "videos", "topics"]);
export type ImportType = z.infer<typeof importTypeSchema>;

// Positions (matches admin importer + UI CSV mapping)
export const positionsItemSchema = z.object({
  position_slug: nonEmpty,
  position_name: optionalString,
  description: z.string().default(""),
  detailed_instructions: z.string().nullable().optional(),
  category: z.string().default("classic"),
  difficulty_level: z
    .enum(["beginner", "intermediate", "advanced", "expert"])
    .nullable()
    .optional(),
  intimacy_level: z.enum(["low", "medium", "high", "very_high"]).nullable().optional(),
  required_flexibility: z.enum(["none", "some", "moderate", "high"]).nullable().optional(),
  tags: z.array(z.string()).optional().default([]),
  benefits: z.array(z.string()).optional().default([]),
  tips: z.array(z.string()).optional().default([]),
  image_url: z.string().nullable().optional(),
  image_url_illustrated: z.string().nullable().optional(),
  thumbnail_url: z.string().nullable().optional(),
  video_tutorial_url: z.string().nullable().optional(),
  animation_url: z.string().nullable().optional(),
  image_file: z.string().nullable().optional(),
  image_illustrated_file: z.string().nullable().optional(),
  thumbnail_file: z.string().nullable().optional(),
  video_tutorial_file: z.string().nullable().optional(),
  animation_file: z.string().nullable().optional(),
  sort_order: z.coerce.number().optional().default(0),
  is_premium: z.boolean().optional().default(false),
  requires_dlc: z.boolean().optional().default(false),
  is_active: z.boolean().optional().default(true),
});

export const positionsCsvRowSchema = z.object({
  position_slug: nonEmpty,
  position_name: z.string().optional(),
  description: z.string().optional(),
  detailed_instructions: z.string().optional(),
  category: z.string().optional(),
  difficulty_level: z.string().optional(),
  intimacy_level: z.string().optional(),
  required_flexibility: z.string().optional(),
  tags: pipeList,
  benefits: pipeList,
  tips: pipeList,
  image_url: z.string().optional(),
  image_url_illustrated: z.string().optional(),
  thumbnail_url: z.string().optional(),
  video_tutorial_url: z.string().optional(),
  animation_url: z.string().optional(),
  image_file: z.string().optional(),
  image_illustrated_file: z.string().optional(),
  thumbnail_file: z.string().optional(),
  video_tutorial_file: z.string().optional(),
  animation_file: z.string().optional(),
  sort_order: z.string().optional(),
  is_premium: boolish,
  requires_dlc: boolish,
  is_active: boolish,
});

// Videos
export const videosItemSchema = z.object({
  content_slug: z.string().nullable().optional(),
  source_import_key: z.string().nullable().optional(),
  license_key: z.string().nullable().optional(),
  license_id: z.string().nullable().optional(),
  compliance_record_key: z.string().nullable().optional(),
  compliance_record_id: z.string().nullable().optional(),
  title: nonEmpty,
  description: z.string().default(""),
  category: z.enum([
    "technique",
    "tutorial",
    "expert_interview",
    "educational",
    "demonstration",
    "advanced",
    "beginner",
  ]),
  video_url_sd: z.string().nullable().optional(),
  video_url_hd: z.string().nullable().optional(),
  video_url_4k: z.string().nullable().optional(),
  thumbnail_url: z.string().nullable().optional(),
  preview_gif_url: z.string().nullable().optional(),
  tags: z.array(z.string()).optional().default([]),
  difficulty_level: z
    .enum(["beginner", "intermediate", "advanced", "expert"])
    .nullable()
    .optional(),
  content_rating: z.enum(["educational", "demonstrative", "explicit"]).nullable().optional(),
  expert_name: z.string().nullable().optional(),
  expert_credentials: z.string().nullable().optional(),
  key_points: z.array(z.string()).optional().default([]),
  warnings: z.array(z.string()).optional().default([]),
  prerequisites: z.array(z.string()).optional().default([]),
  is_premium: z.boolean().optional().default(false),
  is_featured: z.boolean().optional().default(false),
  requires_dlc: z.boolean().optional().default(false),
  dlc_pack_id: z.string().nullable().optional(),
  is_approved: z.boolean().optional().default(false),
  is_active: z.boolean().optional().default(true),
});

export const videosCsvRowSchema = z.object({
  content_slug: z.string().optional(),
  source_import_key: z.string().optional(),
  license_key: z.string().optional(),
  license_id: z.string().optional(),
  compliance_record_key: z.string().optional(),
  compliance_record_id: z.string().optional(),
  title: nonEmpty,
  description: z.string().optional(),
  category: nonEmpty,
  video_url_sd: z.string().optional(),
  video_url_hd: z.string().optional(),
  video_url_4k: z.string().optional(),
  thumbnail_url: z.string().optional(),
  preview_gif_url: z.string().optional(),
  video_sd_file: z.string().optional(),
  video_hd_file: z.string().optional(),
  video_4k_file: z.string().optional(),
  thumbnail_file: z.string().optional(),
  preview_gif_file: z.string().optional(),
  tags: pipeList,
  difficulty_level: z.string().optional(),
  content_rating: z.string().optional(),
  expert_name: z.string().optional(),
  expert_credentials: z.string().optional(),
  key_points: pipeList,
  warnings: pipeList,
  prerequisites: pipeList,
  is_premium: boolish,
  is_featured: boolish,
  requires_dlc: boolish,
  dlc_pack_id: z.string().optional(),
  is_approved: boolish,
  is_active: boolish,
});

// Topics
export const topicsItemSchema = z.object({
  topic_id: nonEmpty,
  title: nonEmpty,
  summary: z.string().nullable().optional(),
  body: z.string().nullable().optional(),
  resources: z.unknown().optional(),
  tags: z.array(z.string()).optional().default([]),
  content_rating: z.enum(["educational", "demonstrative", "explicit"]).nullable().optional(),
  source_import_key: z.string().nullable().optional(),
  requires_feature_id: z.string().nullable().optional(),
  requires_dlc: z.boolean().optional().default(true),
  is_active: z.boolean().optional().default(true),
});

export const topicsCsvRowSchema = z.object({
  topic_id: nonEmpty,
  title: nonEmpty,
  summary: z.string().optional(),
  body: z.string().optional(),
  resources: z.string().optional(), // JSON text
  tags: pipeList,
  content_rating: z.string().optional(),
  source_import_key: z.string().optional(),
  requires_feature_id: z.string().optional(),
  requires_dlc: boolish,
  is_active: boolish,
});
