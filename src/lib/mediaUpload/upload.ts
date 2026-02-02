import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import { uploadVideoInChunks } from "@/lib/mediaUpload/videoChunkUpload";
import { compressImageFile } from "@/lib/mediaUpload/imageCompress";
import { joinPath, randomId, sanitizeFileName, sanitizeFolder } from "@/lib/mediaUpload/path";
import type { UploadOptions, UploadResult } from "@/lib/mediaUpload/types";

const DEFAULT_BUCKET = (import.meta as any).env?.VITE_USER_MEDIA_BUCKET ?? "user-media";

function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("Please sign in");
  return data.user.id;
}

function validateFile(file: File, opts: UploadOptions): void {
  const maxSize = Number(opts.maxSize ?? 100 * 1024 * 1024);
  if (file.size > maxSize)
    throw new Error(`File is too large (max ${(maxSize / 1024 / 1024).toFixed(0)}MB)`);

  const allowed = opts.allowedTypes && opts.allowedTypes.length > 0 ? opts.allowedTypes : null;
  if (allowed && !allowed.includes(file.type)) {
    throw new Error("File type not allowed");
  }
}

function inferContentType(file: File, override?: string): string {
  if (override) return override;
  return file.type || "application/octet-stream";
}

function buildStoragePath(params: {
  userId: string;
  folder?: string;
  fileName: string;
  userScoped: boolean;
}): string {
  const folder = sanitizeFolder(params.folder);
  const name = sanitizeFileName(params.fileName);
  const base = joinPath(folder, name);
  return params.userScoped ? joinPath(params.userId, base) : base;
}

async function publicUrlFor(bucket: string, path: string): Promise<string | undefined> {
  try {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    const url = data?.publicUrl ? String(data.publicUrl) : "";
    return url && isHttpUrl(url) ? url : undefined;
  } catch {
    return undefined;
  }
}

export async function uploadFile(
  file: File,
  options: UploadOptions = {},
): Promise<UploadResult | null> {
  try {
    validateFile(file, options);

    const userId = await requireUserId();
    const bucket = String(options.bucket || DEFAULT_BUCKET);
    const userScoped = options.userScoped !== false;

    const baseName = options.fileName
      ? sanitizeFileName(options.fileName)
      : sanitizeFileName(file.name);
    const stamped = `${Date.now()}-${randomId(8)}-${baseName}`;

    const path = buildStoragePath({
      userId,
      folder: options.folder,
      fileName: stamped,
      userScoped,
    });

    options.onProgress?.(0);

    // Optional image compression (client-side)
    let uploadBlob: Blob = file;
    let contentType = inferContentType(file);

    if (options.compress !== false && file.type.startsWith("image/")) {
      const compressed = await compressImageFile(file);
      if (compressed) {
        uploadBlob = compressed.blob;
        contentType = compressed.mimeType;
      }
    }

    const isVideo = file.type.startsWith("video/");

    // For large videos, use chunked upload + merge.
    if (isVideo && uploadBlob.size > 8 * 1024 * 1024) {
      const chunked = await uploadVideoInChunks({
        bucket,
        filePath: path,
        blob: uploadBlob,
        contentType,
        onProgress: p => options.onProgress?.(p.percent),
      });

      if (!chunked.success || !chunked.path) throw new Error(chunked.error || "Upload failed");

      const publicUrl = chunked.publicUrl || (await publicUrlFor(bucket, chunked.path));
      options.onProgress?.(100);

      return {
        bucket,
        path: chunked.path,
        publicUrl,
        sizeBytes: uploadBlob.size,
        mimeType: contentType,
        originalName: file.name,
        createdAt: new Date().toISOString(),
      };
    }

    const { error } = await supabase.storage.from(bucket).upload(path, uploadBlob, {
      upsert: options.upsert ?? true,
      cacheControl: options.cacheControl ?? "3600",
      contentType,
    });

    if (error) throw new Error(error.message);

    const publicUrl = await publicUrlFor(bucket, path);

    options.onProgress?.(100);

    return {
      bucket,
      path,
      publicUrl,
      sizeBytes: uploadBlob.size,
      mimeType: contentType,
      originalName: file.name,
      createdAt: new Date().toISOString(),
    };
  } catch (error) {
    logger.error("uploadFile failed", { error });
    return null;
  }
}

export async function uploadFiles(
  files: File[],
  options: UploadOptions = {},
): Promise<UploadResult[]> {
  const list = Array.isArray(files) ? files : [];
  if (list.length === 0) return [];

  const results: UploadResult[] = [];
  for (let i = 0; i < list.length; i++) {
    const perStart = Math.round((i / list.length) * 100);
    options.onProgress?.(perStart);

    const r = await uploadFile(list[i]!, {
      ...options,
      onProgress: p => {
        // Blend per-file progress into overall progress
        const base = (i / list.length) * 100;
        const span = 100 / list.length;
        const overall = Math.min(100, Math.round(base + (p / 100) * span));
        options.onProgress?.(overall);
      },
    });

    if (r) results.push(r);
  }

  options.onProgress?.(100);
  return results;
}

export async function uploadVideo(
  file: File,
  options: UploadOptions = {},
): Promise<UploadResult | null> {
  return await uploadFile(file, { ...options, compress: false });
}
