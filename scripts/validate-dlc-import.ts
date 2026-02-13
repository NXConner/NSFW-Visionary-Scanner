import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { z } from "zod";
import {
  importTypeSchema,
  parseCsvFile,
  positionsCsvRowSchema,
  videosCsvRowSchema,
  topicsCsvRowSchema,
  positionsItemSchema,
  videosItemSchema,
  topicsItemSchema,
  type ImportType,
} from "./dlcImportValidation";

type Args = {
  type: ImportType;
  file: string;
};

function parseArgs(argv: string[]): Args {
  const map = new Map<string, string>();
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if (!a.startsWith("--")) continue;
    const key = a.slice(2);
    const value = argv[i + 1];
    if (!value || value.startsWith("--")) continue;
    map.set(key, value);
    i++;
  }

  const typeRaw = map.get("type") ?? "";
  const file = map.get("file") ?? "";
  const type = importTypeSchema.parse(typeRaw);
  if (!file) throw new Error("Missing --file");
  return { type, file };
}

function sha256File(filePath: string): string {
  const buf = readFileSync(filePath);
  return createHash("sha256").update(buf).digest("hex");
}

function isJsonPath(filePath: string): boolean {
  return filePath.toLowerCase().endsWith(".json");
}

function isCsvPath(filePath: string): boolean {
  return filePath.toLowerCase().endsWith(".csv");
}

function fail(message: string, details?: unknown): never {
  const payload = { ok: false, message, details };
  console.error(JSON.stringify(payload, null, 2));
  process.exit(1);
}

function ok(payload: unknown): void {
  console.log(JSON.stringify(payload, null, 2));
}

function normalizeCsvRows(type: ImportType, rows: Record<string, string>[]) {
  if (type === "positions") {
    const parsed = rows.map((r, idx) => {
      const row = positionsCsvRowSchema.safeParse(r);
      if (!row.success) {
        return { idx, ok: false as const, issues: row.error.issues };
      }
      const v = row.data;
      const item = positionsItemSchema.safeParse({
        position_slug: v.position_slug,
        position_name: v.position_name || undefined,
        description: v.description || "",
        detailed_instructions: v.detailed_instructions ? v.detailed_instructions : null,
        category: v.category || "classic",
        difficulty_level: (v.difficulty_level as any) || null,
        intimacy_level: (v.intimacy_level as any) || null,
        required_flexibility: (v.required_flexibility as any) || null,
        tags: v.tags,
        benefits: v.benefits,
        tips: v.tips,
        image_url: v.image_url || null,
        image_url_illustrated: v.image_url_illustrated || null,
        thumbnail_url: v.thumbnail_url || null,
        video_tutorial_url: v.video_tutorial_url || null,
        animation_url: v.animation_url || null,
        image_file: v.image_file || null,
        image_illustrated_file: v.image_illustrated_file || null,
        thumbnail_file: v.thumbnail_file || null,
        video_tutorial_file: v.video_tutorial_file || null,
        animation_file: v.animation_file || null,
        sort_order: v.sort_order ? Number(v.sort_order) : 0,
        is_premium: Boolean(v.is_premium ?? false),
        requires_dlc: Boolean(v.requires_dlc ?? false),
        is_active: v.is_active == null ? true : Boolean(v.is_active),
      });
      if (!item.success) return { idx, ok: false as const, issues: item.error.issues };
      return { idx, ok: true as const, item: item.data };
    });
    return parsed;
  }

  if (type === "videos") {
    const parsed = rows.map((r, idx) => {
      const row = videosCsvRowSchema.safeParse(r);
      if (!row.success) return { idx, ok: false as const, issues: row.error.issues };
      const v = row.data;
      const item = videosItemSchema.safeParse({
        content_slug: v.content_slug || null,
        source_import_key: v.source_import_key || null,
        title: v.title,
        description: v.description || "",
        category: v.category,
        video_url_sd: v.video_url_sd || null,
        video_url_hd: v.video_url_hd || null,
        video_url_4k: v.video_url_4k || null,
        thumbnail_url: v.thumbnail_url || null,
        preview_gif_url: v.preview_gif_url || null,
        tags: v.tags,
        difficulty_level: (v.difficulty_level as any) || null,
        content_rating: (v.content_rating as any) || null,
        expert_name: v.expert_name || null,
        expert_credentials: v.expert_credentials || null,
        key_points: v.key_points,
        warnings: v.warnings,
        prerequisites: v.prerequisites,
        is_premium: Boolean(v.is_premium ?? false),
        is_featured: Boolean(v.is_featured ?? false),
        requires_dlc: Boolean(v.requires_dlc ?? false),
        dlc_pack_id: v.dlc_pack_id || null,
        is_approved: Boolean(v.is_approved ?? false),
        is_active: v.is_active == null ? true : Boolean(v.is_active),
      });
      if (!item.success) return { idx, ok: false as const, issues: item.error.issues };
      return { idx, ok: true as const, item: item.data };
    });
    return parsed;
  }

  const parsed = rows.map((r, idx) => {
    const row = topicsCsvRowSchema.safeParse(r);
    if (!row.success) return { idx, ok: false as const, issues: row.error.issues };
    const v = row.data;
    let resources: unknown = [];
    if (v.resources && String(v.resources).trim()) {
      try {
        resources = JSON.parse(String(v.resources));
      } catch {
        resources = "__INVALID_JSON__";
      }
    }
    const item = topicsItemSchema.safeParse({
      topic_id: v.topic_id,
      title: v.title,
      summary: v.summary || null,
      body: v.body || null,
      resources,
      tags: v.tags,
      content_rating: (v.content_rating as any) || null,
      source_import_key: v.source_import_key || null,
      requires_feature_id: v.requires_feature_id || null,
      requires_dlc: v.requires_dlc == null ? true : Boolean(v.requires_dlc),
      is_active: v.is_active == null ? true : Boolean(v.is_active),
    });
    if (!item.success) return { idx, ok: false as const, issues: item.error.issues };
    if (resources === "__INVALID_JSON__") {
      return {
        idx,
        ok: false as const,
        issues: [{ code: "custom", message: "resources must be valid JSON", path: ["resources"] }],
      };
    }
    return { idx, ok: true as const, item: item.data };
  });
  return parsed;
}

function validateJson(type: ImportType, filePath: string) {
  const raw = readFileSync(filePath, "utf8");
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    fail("Invalid JSON");
  }
  const objSchema = z.object({
    importType: importTypeSchema,
    items: z.array(z.unknown()),
  });
  const base = objSchema.safeParse(parsed);
  if (!base.success)
    fail("Invalid JSON shape (must include importType + items[])", base.error.issues);
  if (base.data.importType !== type) {
    fail(`importType mismatch: file has ${base.data.importType} but --type is ${type}`);
  }

  const itemsRaw = base.data.items;
  const itemSchema =
    type === "positions"
      ? positionsItemSchema
      : type === "videos"
        ? videosItemSchema
        : topicsItemSchema;

  const out = itemsRaw.map((it, idx) => {
    const res = itemSchema.safeParse(it);
    if (!res.success) return { idx, ok: false as const, issues: res.error.issues };
    return { idx, ok: true as const };
  });

  return { count: itemsRaw.length, results: out };
}

function main() {
  try {
    const args = parseArgs(process.argv.slice(2));
    const hash = sha256File(args.file);

    if (!isJsonPath(args.file) && !isCsvPath(args.file)) {
      fail("File must end with .csv or .json");
    }

    if (isJsonPath(args.file)) {
      const res = validateJson(args.type, args.file);
      const failed = res.results.filter(r => !r.ok).length;
      if (failed > 0) {
        fail("Validation failed", { sha256: hash, ...res });
      }
      ok({ ok: true, sha256: hash, type: args.type, format: "json", count: res.count });
      return;
    }

    const rows = parseCsvFile(args.file);
    const normalized = normalizeCsvRows(args.type, rows);
    const failed = normalized.filter((r: any) => !r.ok).length;
    if (failed > 0) {
      fail("Validation failed", {
        sha256: hash,
        type: args.type,
        format: "csv",
        count: rows.length,
        failed,
        failures: normalized.filter((r: any) => !r.ok).slice(0, 50),
      });
    }

    ok({ ok: true, sha256: hash, type: args.type, format: "csv", count: rows.length });
  } catch (e) {
    fail(e instanceof Error ? e.message : "Unknown error");
  }
}

main();
