/**
 * useMediaUpload Hook
 * React hook for media upload with progress tracking
 */

import { useState, useCallback } from "react";
import {
  uploadFile,
  uploadFiles,
  uploadVideo,
  type UploadResult,
  type UploadOptions,
} from "@/lib/mediaUpload";
import { toast } from "sonner";

interface UseMediaUploadOptions extends Omit<UploadOptions, "onProgress"> {
  onUploadComplete?: (result: UploadResult | UploadResult[]) => void;
  onUploadError?: (error: Error) => void;
}

export const useMediaUpload = (options: UseMediaUploadOptions = {}) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<UploadResult[]>([]);

  const upload = useCallback(
    async (file: File) => {
      setUploading(true);
      setProgress(0);

      try {
        const result = await uploadFile(file, {
          ...options,
          onProgress: setProgress,
        });

        if (result) {
          setUploadedFiles(prev => [...prev, result]);
          options.onUploadComplete?.(result);
          return result;
        } else {
          throw new Error("Upload failed");
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error("Upload failed");
        options.onUploadError?.(err);
        throw err;
      } finally {
        setUploading(false);
        setProgress(0);
      }
    },
    [options],
  );

  const uploadMultiple = useCallback(
    async (files: File[]) => {
      setUploading(true);
      setProgress(0);

      try {
        const results = await uploadFiles(files, {
          ...options,
          onProgress: setProgress,
        });

        if (results.length > 0) {
          setUploadedFiles(prev => [...prev, ...results]);
          options.onUploadComplete?.(results);
          return results;
        } else {
          throw new Error("Upload failed");
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error("Upload failed");
        options.onUploadError?.(err);
        throw err;
      } finally {
        setUploading(false);
        setProgress(0);
      }
    },
    [options],
  );

  const uploadVideoFile = useCallback(
    async (file: File) => {
      setUploading(true);
      setProgress(0);

      try {
        const result = await uploadVideo(file, {
          ...options,
          onProgress: setProgress,
        });

        if (result) {
          setUploadedFiles(prev => [...prev, result]);
          options.onUploadComplete?.(result);
          return result;
        } else {
          throw new Error("Video upload failed");
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error("Video upload failed");
        options.onUploadError?.(err);
        throw err;
      } finally {
        setUploading(false);
        setProgress(0);
      }
    },
    [options],
  );

  const reset = useCallback(() => {
    setUploadedFiles([]);
    setProgress(0);
  }, []);

  return {
    upload,
    uploadMultiple,
    uploadVideo: uploadVideoFile,
    uploading,
    progress,
    uploadedFiles,
    reset,
  };
};
