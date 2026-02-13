import type { BuildPositionsImportResult, PositionsImportItem } from "./types";
import { dedupeBySlug } from "./utils";
import { buildPositionsImportFromGitHubSources } from "./githubSources";
import { buildPositionsImportFromBuiltInGuides } from "./builtInSources";

export type { BuildPositionsImportResult, PositionsImportItem } from "./types";

export async function buildPositionsImportCatalog(params?: {
  includeGitHub?: boolean;
  includeBuiltInGuides?: boolean;
  maxItems?: number;
}): Promise<BuildPositionsImportResult> {
  const includeGitHub = params?.includeGitHub ?? true;
  const includeBuiltInGuides = params?.includeBuiltInGuides ?? true;
  const maxItems = params?.maxItems ?? 2000;

  const results: BuildPositionsImportResult[] = [];
  if (includeBuiltInGuides) results.push(await buildPositionsImportFromBuiltInGuides());
  if (includeGitHub) results.push(await buildPositionsImportFromGitHubSources());

  const sources = results.flatMap(r => r.sources);
  const merged: PositionsImportItem[] = results.flatMap(r => r.items);

  const deduped = dedupeBySlug(merged);
  const limited = deduped.slice(0, Math.max(1, maxItems));
  for (let i = 0; i < limited.length; i++) limited[i]!.sort_order = i + 1;

  return { items: limited, sources };
}

