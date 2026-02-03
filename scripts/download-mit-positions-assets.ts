import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, basename } from "node:path";

type RepoSpec = {
  owner: string;
  repo: string;
  branch: string;
};

type GitTreeItem = {
  path: string;
  type: "blob" | "tree" | string;
};

type Args = {
  outDir: string;
  limit?: number;
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
  const outDir = map.get("out") || "dlc-assets/mit-positions";
  const limitRaw = map.get("limit");
  const limit = limitRaw ? Number(limitRaw) : undefined;
  return { outDir, limit };
}

function optionalEnv(name: string): string | undefined {
  const v = process.env[name];
  return v && String(v).trim() ? String(v) : undefined;
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
  if (!res.ok) {
    throw new Error(`GitHub API error (${repo.owner}/${repo.repo}): ${res.status}`);
  }
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

async function downloadFile(url: string, outPath: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download ${url}`);
  const buf = new Uint8Array(await res.arrayBuffer());
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, buf);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const repo: RepoSpec = { owner: "raminr77", repo: "random-sex-position", branch: "main" };

  const tree = await fetchGitTree(repo);
  const images = tree.filter(t => t.type === "blob" && isImagePath(t.path));

  const filtered = images.filter(i => i.path.includes("public/images/positions/"));
  const limited = typeof args.limit === "number" ? filtered.slice(0, args.limit) : filtered;

  mkdirSync(args.outDir, { recursive: true });

  let count = 0;
  for (const item of limited) {
    const outPath = join(args.outDir, basename(item.path));
    await downloadFile(rawUrl(repo, item.path), outPath);
    count += 1;
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        downloaded: count,
        outDir: args.outDir,
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
