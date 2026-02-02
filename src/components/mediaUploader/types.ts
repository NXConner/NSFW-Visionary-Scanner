import type { UploadOptions, UploadResult } from "@/lib/mediaUpload";

export type MediaUploaderVariant = "default" | "compact" | "dropzone";

export type MediaUploaderProps = {
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  allowedTypes?: string[];
  bucket?: string;
  folder?: string;
  compressImages?: boolean;
  showPreview?: boolean;
  label?: string;
  variant?: MediaUploaderVariant;
  onUploadComplete?: (result: UploadResult | UploadResult[]) => void;
  onUploadError?: (error: Error) => void;
  /** Override upload options (advanced) */
  uploadOptions?: Omit<
    UploadOptions,
    "bucket" | "folder" | "maxSize" | "allowedTypes" | "compress"
  >;
};
