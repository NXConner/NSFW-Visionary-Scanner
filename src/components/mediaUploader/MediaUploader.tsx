import React, { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, Loader2, X, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { uploadFile, uploadFiles, type UploadResult } from "@/lib/mediaUpload";
import type { MediaUploaderProps } from "@/components/mediaUploader/types";
import { formatFileSize, getFileIcon } from "@/components/mediaUploader/utils";

export const MediaUploader = ({
  accept = "*/*",
  multiple = false,
  maxSize = 100 * 1024 * 1024,
  allowedTypes = [],
  bucket,
  folder,
  onUploadComplete,
  onUploadError,
  compressImages = true,
  showPreview = true,
  label = "Upload Files",
  variant = "default",
  uploadOptions,
}: MediaUploaderProps): JSX.Element => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewFiles, setPreviewFiles] = useState<File[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadResult[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const effectiveAllowedTypes = useMemo(
    () => (allowedTypes && allowedTypes.length > 0 ? allowedTypes : undefined),
    [allowedTypes],
  );

  const clear = () => {
    setPreviewFiles([]);
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    setPreviewFiles(fileArray);
    setUploading(true);
    setProgress(0);

    try {
      let results: UploadResult[] = [];

      if (multiple) {
        results = await uploadFiles(fileArray, {
          bucket,
          folder,
          maxSize,
          allowedTypes: effectiveAllowedTypes,
          compress: compressImages,
          onProgress: setProgress,
          ...(uploadOptions || {}),
        });
      } else {
        const result = await uploadFile(fileArray[0]!, {
          bucket,
          folder,
          maxSize,
          allowedTypes: effectiveAllowedTypes,
          compress: compressImages,
          onProgress: setProgress,
          ...(uploadOptions || {}),
        });
        results = result ? [result] : [];
      }

      if (results.length === 0) throw new Error("Upload failed");

      setUploadedFiles(results);
      onUploadComplete?.(multiple ? results : results[0]!);
      toast.success(multiple ? "Uploads complete" : "Upload complete");
      clear();
    } catch (error) {
      const err = error instanceof Error ? error : new Error("Upload failed");
      onUploadError?.(err);
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    void handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  if (variant === "dropzone") {
    return (
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging
            ? "border-primary bg-primary/10"
            : "border-muted-foreground/25 hover:border-primary/50"
        } ${uploading ? "opacity-50 pointer-events-none" : "cursor-pointer"}`}
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={e => {
          if (uploading) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        aria-label={label}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={e => void handleFileSelect(e.target.files)}
          className="hidden"
        />
        <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-sm text-muted-foreground mb-2">
          {isDragging ? "Drop files here" : "Drag and drop files here, or click to select"}
        </p>
        <p className="text-xs text-muted-foreground">
          Max size: {(maxSize / 1024 / 1024).toFixed(0)}MB
        </p>
        {uploading && (
          <div className="mt-4">
            <Progress value={progress} className="mb-2" />
            <p className="text-sm text-muted-foreground">{Math.round(progress)}%</p>
          </div>
        )}
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={e => void handleFileSelect(e.target.files)}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              {label}
            </>
          )}
        </Button>
        {uploading && <Progress value={progress} className="w-24" />}
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <label className="text-sm font-medium">{label}</label>
            <input
              ref={fileInputRef}
              type="file"
              accept={accept}
              multiple={multiple}
              onChange={e => void handleFileSelect(e.target.files)}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <Upload className="w-4 h-4 mr-2" />
              Select Files
            </Button>
          </div>

          {uploading && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-xs text-muted-foreground text-center">
                Uploading... {Math.round(progress)}%
              </p>
            </div>
          )}

          {showPreview && previewFiles.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Selected Files:</p>
              <div className="space-y-2">
                {previewFiles.map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    className="flex items-center gap-3 p-2 rounded-lg border"
                  >
                    <div className="text-muted-foreground">{getFileIcon(file)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {file.type || "unknown"} · {formatFileSize(file.size)}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => clear()}
                      aria-label="Clear selection"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {uploadedFiles.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Uploaded:</p>
              <div className="space-y-2">
                {uploadedFiles.slice(0, 3).map(f => (
                  <div key={f.path} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span className="truncate">{f.originalName}</span>
                  </div>
                ))}
                {uploadedFiles.length > 3 && (
                  <p className="text-xs text-muted-foreground">+{uploadedFiles.length - 3} more</p>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
