import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

type Args = {
  file: string;
  dryRun: boolean;
};

function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing ${name}`);
  return v;
}

function parseArgs(argv: string[]): Args {
  const map = new Map<string, string>();
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i] ?? "";
    if (!a.startsWith("--")) continue;
    const key = a.slice(2);
    const value = argv[i + 1];
    if (!value || value.startsWith("--")) continue;
    map.set(key, value);
    i += 1;
  }
  const file = map.get("file") ?? "";
  const dryRun = map.get("dry-run") === "true";
  if (!file) throw new Error("Missing --file");
  return { file, dryRun };
}

const expertContentSchema = z.object({
  expert_name: z.string().min(1),
  expert_title: z.string().optional().nullable(),
  expert_credentials: z.string().optional().nullable(),
  expert_bio: z.string().optional().nullable(),
  expert_image_url: z.string().optional().nullable(),
  content_type: z.enum(["interview", "article", "video", "webinar"]).default("article"),
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  content_text: z.string().optional().nullable(),
  video_url: z.string().optional().nullable(),
  thumbnail_url: z.string().optional().nullable(),
  duration_minutes: z.number().optional().nullable(),
  transcript: z.string().optional().nullable(),
  topics: z.array(z.string()).optional().default([]),
  tags: z.array(z.string()).optional().default([]),
  is_premium: z.boolean().optional().default(false),
  published_at: z.string().optional().nullable(),
});

const payloadSchema = z.array(expertContentSchema);

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const url = env("SUPABASE_URL");
  const key = env("SUPABASE_SERVICE_ROLE_KEY");

  const raw = readFileSync(args.file, "utf8");
  const parsed = JSON.parse(raw);
  const items = payloadSchema.parse(parsed);

  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const now = new Date().toISOString();

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const item of items) {
    const { data: existing } = await supabase
      .from("education_expert_content")
      .select("id")
      .eq("title", item.title)
      .eq("expert_name", item.expert_name)
      .maybeSingle();

    const payload = {
      expert_name: item.expert_name,
      expert_title: item.expert_title ?? null,
      expert_credentials: item.expert_credentials ?? null,
      expert_bio: item.expert_bio ?? null,
      expert_image_url: item.expert_image_url ?? null,
      content_type: item.content_type ?? "article",
      title: item.title,
      description: item.description ?? null,
      content_text: item.content_text ?? null,
      video_url: item.video_url ?? null,
      thumbnail_url: item.thumbnail_url ?? null,
      duration_minutes: item.duration_minutes ?? null,
      transcript: item.transcript ?? null,
      topics: item.topics ?? [],
      tags: item.tags ?? [],
      is_premium: Boolean(item.is_premium ?? false),
      published_at: item.published_at ?? now,
      updated_at: now,
    };

    if (args.dryRun) {
      if (existing?.id) updated += 1;
      else created += 1;
      continue;
    }

    if (existing?.id) {
      const { error } = await supabase
        .from("education_expert_content")
        .update(payload)
        .eq("id", existing.id);
      if (error) {
        skipped += 1;
        continue;
      }
      updated += 1;
    } else {
      const { error } = await supabase.from("education_expert_content").insert({
        ...payload,
        created_at: now,
      });
      if (error) {
        skipped += 1;
        continue;
      }
      created += 1;
    }
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        dryRun: args.dryRun,
        total: items.length,
        created,
        updated,
        skipped,
      },
      null,
      2,
    ),
  );
}

main().catch(error => {
  console.error(
    JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) }, null, 2),
  );
  process.exit(1);
});
