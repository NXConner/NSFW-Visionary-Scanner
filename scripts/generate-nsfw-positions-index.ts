import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

type GitTreeItem = {
  path: string;
  type: "blob" | "tree" | string;
};

type RepoSpec = {
  owner: string;
  repo: string;
  branch: string;
};

type ImageIndexEntry = {
  /** Stable id (used as a position id suffix) */
  key: string;
  /** Repo-relative path */
  path: string;
  /** Raw GitHub URL */
  url: string;
  /** Derived name from filename */
  name: string;
  /** Derived category from directory */
  category?: string;
  /** Derived tags from filename */
  tags: string[];
};

function optionalEnv(name: string): string | undefined {
  const v = process.env[name];
  return v && String(v).trim() ? String(v) : undefined;
}

function toTitleCase(value: string): string {
  return value
    .trim()
    .split(/[\s_-]+/g)
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function stripExtension(fileName: string): string {
  return fileName.replace(/\.[^/.]+$/, "");
}

function parseFromPath(path: string): { name: string; category?: string; tags: string[] } {
  const parts = path.split("/");
  const fileName = parts[parts.length - 1] ?? path;
  const category = parts.length >= 2 ? parts[parts.length - 2] : undefined;
  const base = stripExtension(fileName);
  const tokens = base
    .split(/[-_]+/g)
    .map(t => t.trim())
    .filter(t => t.length >= 2);

  // Use the whole base as the display name for best matching.
  const name = toTitleCase(base);

  // Tags should be reasonably sized and de-duped.
  const tags = Array.from(new Set(tokens.map(t => t.toLowerCase()))).slice(0, 12);

  return { name, category, tags };
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function fetchGitTree(repo: RepoSpec): Promise<GitTreeItem[]> {
  const url = `https://api.github.com/repos/${repo.owner}/${repo.repo}/git/trees/${repo.branch}?recursive=1`;
  const token = optionalEnv("GITHUB_TOKEN");
  const res = await fetch(url, {
    headers: {
      accept: "application/vnd.github.v3+json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) throw new Error(`GitHub API error (${repo.owner}/${repo.repo}): ${res.status}`);
  const data = (await res.json()) as { tree?: GitTreeItem[] };
  return Array.isArray(data.tree) ? data.tree : [];
}

function isImagePath(path: string): boolean {
  const ext = (path.split(".").pop() ?? "").toLowerCase();
  return ["png", "jpg", "jpeg", "gif", "webp"].includes(ext);
}

function rawUrl(repo: RepoSpec, path: string): string {
  return `https://raw.githubusercontent.com/${repo.owner}/${repo.repo}/${repo.branch}/${path}`;
}

function tsExportFile(params: { exportName: string; entries: ImageIndexEntry[] }): string {
  // Intentionally compact to keep file line counts low.
  return (
    `/* AUTO-GENERATED. DO NOT EDIT. */\n` +
    `import type { NsfwPositionImageIndexEntry } from "./types";\n\n` +
    `export const ${params.exportName}: NsfwPositionImageIndexEntry[] = ${JSON.stringify(params.entries)};\n`
  );
}

async function main(): Promise<void> {
  // Keep chunk size low to stay under the repo's "few hundred lines" preference.
  const CHUNK_SIZE = 175;

  const imageRepo: RepoSpec = { owner: "raminr77", repo: "random-sex-position", branch: "main" };

  const tree = await fetchGitTree(imageRepo);
  const images = tree
    .filter(t => t.type === "blob" && isImagePath(t.path))
    .map(t => {
      const parsed = parseFromPath(t.path);
      const entry: ImageIndexEntry = {
        key: `${imageRepo.owner}/${imageRepo.repo}@${imageRepo.branch}:${t.path}`,
        path: t.path,
        url: rawUrl(imageRepo, t.path),
        name: parsed.name,
        category: parsed.category,
        tags: parsed.tags,
      };
      return entry;
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const baseDir = join(process.cwd(), "src", "data", "nsfwPositions", "generated");
  mkdirSync(baseDir, { recursive: true });

  const typesFile = join(baseDir, "types.ts");
  const typesContents =
    `/* AUTO-GENERATED. DO NOT EDIT. */\n\n` +
    `export type NsfwPositionImageIndexEntry = {\n` +
    `  key: string;\n` +
    `  path: string;\n` +
    `  url: string;\n` +
    `  name: string;\n` +
    `  category?: string;\n` +
    `  tags: string[];\n` +
    `};\n`;
  writeFileSync(typesFile, typesContents, "utf8");

  const chunks = chunk(images, CHUNK_SIZE);
  const exportNames: string[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const exportName = `nsfwPositionImagesPart${i + 1}`;
    exportNames.push(exportName);
    const filePath = join(baseDir, `images_part${i + 1}.ts`);
    mkdirSync(dirname(filePath), { recursive: true });
    writeFileSync(filePath, tsExportFile({ exportName, entries: chunks[i] ?? [] }), "utf8");
  }

  const indexFile = join(baseDir, "index.ts");
  const indexContents =
    `/* AUTO-GENERATED. DO NOT EDIT. */\n\n` +
    `export type { NsfwPositionImageIndexEntry } from "./types";\n` +
    `\n` +
    exportNames.map((n, i) => `export { ${n} } from "./images_part${i + 1}";`).join("\n") +
    `\n\nexport const nsfwPositionImagesAll = [\n` +
    exportNames.map(n => `  ...${n},`).join("\n") +
    `\n] as const;\n`;
  writeFileSync(indexFile, indexContents, "utf8");

  console.log(
    `Generated ${images.length} NSFW position image entries across ${chunks.length} files.`,
  );
  console.log(`Output: ${baseDir}`);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
