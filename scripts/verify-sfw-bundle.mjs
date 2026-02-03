import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const distDir = process.argv[2] ? path.resolve(process.argv[2]) : path.resolve(root, "dist");

const textExtensions = new Set([".js", ".mjs", ".cjs", ".css", ".html", ".json", ".map"]);
const bannedTokens = [
  "nsfw",
  "pornmd",
  "kamasutra",
  "bondage",
  "cock-worshiping",
  "seductive-ai",
  "nsfw-advanced",
  "nsfw-videos",
  "nsfw-forum",
  "nsfw-education",
  "intimate education",
];

const bannedRegex = new RegExp(
  bannedTokens
    .map(token => token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|"),
  "i",
);

const results = [];

async function scanDir(dirPath) {
  const entries = await readdir(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      await scanDir(fullPath);
      continue;
    }

    const ext = path.extname(entry.name).toLowerCase();
    if (!textExtensions.has(ext)) continue;

    const fileStats = await stat(fullPath);
    if (!fileStats.isFile()) continue;

    const content = await readFile(fullPath, "utf8");
    const match = content.match(bannedRegex);
    if (match) {
      results.push({
        file: path.relative(root, fullPath),
        token: match[0],
      });
    }
  }
}

try {
  await scanDir(distDir);
  if (results.length > 0) {
    console.error("SFW bundle verification failed. NSFW tokens found:");
    for (const hit of results) {
      console.error(`- ${hit.file} -> ${hit.token}`);
    }
    process.exit(1);
  }
  console.log("SFW bundle verification passed.");
} catch (error) {
  console.error("SFW bundle verification failed:", error?.message || error);
  process.exit(1);
}
