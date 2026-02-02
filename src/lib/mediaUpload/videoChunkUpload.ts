import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";

export type ChunkUploadOptions = {
  bucket: string;
  filePath: string; // final merged path
  blob: Blob;
  contentType: string;
  chunkSizeBytes?: number;
  onProgress?: (p: { uploadedChunks: number; totalChunks: number; percent: number }) => void;
};

function splitBlob(blob: Blob, chunkSizeBytes: number): Blob[] {
  const chunks: Blob[] = [];
  for (let start = 0; start < blob.size; start += chunkSizeBytes) {
    const end = Math.min(start + chunkSizeBytes, blob.size);
    chunks.push(blob.slice(start, end));
  }
  return chunks;
}

export async function uploadVideoInChunks(options: ChunkUploadOptions): Promise<{
  success: boolean;
  path?: string;
  publicUrl?: string;
  totalChunks?: number;
  error?: string;
}> {
  const {
    bucket,
    filePath,
    blob,
    contentType,
    chunkSizeBytes = 5 * 1024 * 1024, // 5MB
    onProgress,
  } = options;

  try {
    const chunks = splitBlob(blob, chunkSizeBytes);
    const totalChunks = chunks.length;
    if (totalChunks < 1) return { success: false, error: "Nothing to upload" };

    for (let i = 0; i < totalChunks; i++) {
      const chunkPath = `${filePath}.chunk.${i}`;
      const { error } = await supabase.storage
        .from(bucket)
        .upload(chunkPath, chunks[i], { upsert: true, contentType: "application/octet-stream" });

      if (error) {
        logger.error("uploadVideoInChunks: chunk upload failed", {
          chunk: i,
          error: error.message,
        });
        return { success: false, error: error.message };
      }

      const uploadedChunks = i + 1;
      const percent = Math.round((uploadedChunks / totalChunks) * 100);
      onProgress?.({ uploadedChunks, totalChunks, percent });
    }

    const { data: mergeData, error: mergeError } = await supabase.functions.invoke(
      "merge-video-chunks",
      {
        body: { file_path: filePath, total_chunks: totalChunks, bucket, content_type: contentType },
      },
    );

    if (mergeError || !mergeData?.success) {
      const msg = mergeError?.message || mergeData?.error || "Merge failed";
      logger.error("uploadVideoInChunks: merge failed", { error: msg });
      return { success: false, error: msg };
    }

    const publicUrl = supabase.storage.from(bucket).getPublicUrl(filePath).data.publicUrl;

    return { success: true, path: filePath, publicUrl, totalChunks };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    logger.error("uploadVideoInChunks: error", { error: message });
    return { success: false, error: message };
  }
}
