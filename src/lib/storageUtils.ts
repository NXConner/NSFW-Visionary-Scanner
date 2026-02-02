import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";

const DEFAULT_BUCKET = (import.meta as any).env?.VITE_USER_MEDIA_BUCKET ?? "user-media";

export function formatBytes(bytes: number): string {
  const b = Number(bytes || 0);
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  if (b < 1024 * 1024 * 1024) return `${(b / (1024 * 1024)).toFixed(1)} MB`;
  return `${(b / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

type ListItem = {
  name: string;
  metadata?: { size?: number } | null;
  id?: string;
};

async function listAllUnderPrefix(params: {
  bucket: string;
  prefix: string;
  maxNodes?: number;
}): Promise<ListItem[]> {
  const { bucket } = params;
  const maxNodes = Math.max(500, Math.min(50_000, Number(params.maxNodes ?? 10_000)));

  const results: ListItem[] = [];
  const queue: string[] = [params.prefix.replace(/^\/+/, "").replace(/\/+$/, "")];

  let visited = 0;

  while (queue.length > 0 && visited < maxNodes) {
    const current = queue.shift() || "";
    visited += 1;

    // Supabase list: prefix is a "path" within bucket.
    // It returns both files and "folders"; folders often have null metadata.
    const pageSize = 1000;
    let offset = 0;

    for (;;) {
      const { data, error } = await supabase.storage.from(bucket).list(current, {
        limit: pageSize,
        offset,
        sortBy: { column: "name", order: "asc" },
      });

      if (error) {
        logger.warn("storageUtils.list failed", { bucket, current, error: error.message });
        break;
      }

      const items = (data || []) as unknown as ListItem[];

      for (const it of items) {
        // If it's a directory-like entry, recurse.
        // Heuristic: folders often have metadata null/undefined.
        const isFolder = !it.metadata || typeof it.metadata.size !== "number";
        if (isFolder) {
          const next = current ? `${current}/${it.name}` : it.name;
          // Avoid runaway recursion.
          if (next && !next.includes("..") && !next.includes("\\") && queue.length < maxNodes) {
            queue.push(next);
          }
        } else {
          results.push({ name: it.name, metadata: it.metadata, id: it.id });
        }
      }

      if (items.length < pageSize) break;
      offset += pageSize;
      if (offset > 200_000) break;
    }
  }

  return results;
}

export async function getStorageUsage(userId: string, buckets?: string[]): Promise<number> {
  const bucketList = (buckets && buckets.length > 0 ? buckets : [DEFAULT_BUCKET]).map(String);
  const prefix = `${userId}`;

  let total = 0;
  for (const bucket of bucketList) {
    try {
      const items = await listAllUnderPrefix({ bucket, prefix });
      for (const it of items) {
        const size = Number(it.metadata?.size ?? 0);
        if (Number.isFinite(size) && size > 0) total += size;
      }
    } catch (error) {
      logger.warn("getStorageUsage failed for bucket", { bucket, error });
    }
  }

  return total;
}
