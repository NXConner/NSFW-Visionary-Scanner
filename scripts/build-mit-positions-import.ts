import { writeFileSync } from "node:fs";
import { basename } from "node:path";
import { nsfwPositionImagesAll } from "../src/data/nsfwPositions/generated";

type Args = {
  out: string;
};

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
  return { out: map.get("out") || "docs/product/dlc/dlc-content/seed/positions_mit_generated.csv" };
}

function slugify(value: string): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function mapDifficulty(tags: string[]): string {
  const t = new Set(tags.map(x => x.toLowerCase()));
  if (t.has("expert") || t.has("advanced") || t.has("hard")) return "advanced";
  if (t.has("beginner") || t.has("easy")) return "beginner";
  return "intermediate";
}

function mapFlexibility(tags: string[]): string {
  const t = new Set(tags.map(x => x.toLowerCase()));
  if (t.has("acrobatic") || t.has("flexible") || t.has("stretch")) return "high";
  if (t.has("standing") || t.has("balance")) return "moderate";
  return "some";
}

function mapIntimacy(tags: string[]): string {
  const t = new Set(tags.map(x => x.toLowerCase()));
  if (t.has("romantic") || t.has("close") || t.has("cuddle")) return "high";
  return "medium";
}

function instructionsFor(name: string, tags: string[]): string {
  const t = new Set(tags.map(x => x.toLowerCase()));
  const lines: string[] = [
    "Confirm mutual consent and boundaries before starting.",
    "Choose a stable, comfortable surface and add support cushions if needed.",
  ];
  if (t.has("standing")) {
    lines.push("Use a wall or chair for balance and keep movements controlled.");
  } else if (t.has("floor")) {
    lines.push("Use a mat or blanket to reduce pressure on knees and elbows.");
  } else {
    lines.push("Align your bodies slowly and adjust angles for comfort and stability.");
  }
  lines.push("Pause to check in and stop immediately if there is pain or discomfort.");
  return lines.join("\n");
}

function benefitsFor(tags: string[]): string[] {
  const t = new Set(tags.map(x => x.toLowerCase()));
  const out = [
    "Encourages communication and teamwork between partners.",
    "Can be adapted with props for comfort and accessibility.",
  ];
  if (t.has("standing")) out.push("Supports full-body engagement with compact setup.");
  if (t.has("romantic") || t.has("close")) out.push("Supports closeness and eye contact.");
  return out.slice(0, 6);
}

function tipsFor(tags: string[]): string[] {
  const t = new Set(tags.map(x => x.toLowerCase()));
  const out = [
    "Move slowly at first and adjust posture to avoid joint strain.",
    "Use steady breathing to stay relaxed and coordinated.",
    "Hydrate and take breaks as needed.",
  ];
  if (t.has("standing")) out.unshift("Keep a stable base and use a support surface if available.");
  return out.slice(0, 6);
}

function csvEscape(value: string | null | undefined): string {
  const v = String(value ?? "");
  if (v.includes(",") || v.includes("\n") || v.includes("\"")) {
    return `"${v.replace(/\"/g, "\"\"")}"`;
  }
  return v;
}

function pipeList(values: string[]): string {
  return values.filter(Boolean).join("|");
}

function buildRows(): string[] {
  const rows: string[] = [];
  const used = new Set<string>();

  for (const entry of nsfwPositionImagesAll) {
    const fileName = basename(entry.path);
    const slugBase = slugify(entry.path.replace(/^public\/images\/positions\//, "").replace(/\.[^/.]+$/, ""));
    let slug = slugBase;
    let suffix = 1;
    while (used.has(slug)) {
      suffix += 1;
      slug = `${slugBase}-${suffix}`;
    }
    used.add(slug);

    const tags = Array.from(new Set([entry.category || "positions", ...(entry.tags || [])]));
    const name = entry.name || slug;
    const description = `Illustrated ${name} position with comfort-first guidance.`;
    const detailed = instructionsFor(name, tags);

    const row = [
      slug,
      name,
      description,
      detailed,
      entry.category || "positions",
      mapDifficulty(tags),
      mapIntimacy(tags),
      mapFlexibility(tags),
      pipeList(tags),
      pipeList(benefitsFor(tags)),
      pipeList(tipsFor(tags)),
      "",
      "",
      "",
      "",
      "",
      fileName,
      "",
      "",
      "",
      "",
      "",
      "false",
      "true",
      "true",
    ].map(csvEscape);

    rows.push(row.join(","));
  }

  return rows;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const header =
    "position_slug,position_name,description,detailed_instructions,category,difficulty_level,intimacy_level,required_flexibility,tags,benefits,tips,image_url,image_url_illustrated,thumbnail_url,video_tutorial_url,animation_url,image_file,image_illustrated_file,thumbnail_file,video_tutorial_file,animation_file,sort_order,is_premium,requires_dlc,is_active";
  const rows = buildRows();
  const csv = [header, ...rows].join("\n");
  writeFileSync(args.out, csv, "utf8");
  console.log(JSON.stringify({ ok: true, rows: rows.length, out: args.out }, null, 2));
}

main();
