import * as React from "react";
import { Image, Video, File as FileIcon } from "lucide-react";

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getFileIcon(file: File): React.ReactElement {
  // Keep this file as `.ts` (no JSX) to avoid parser issues in tooling.
  if (file.type.startsWith("image/")) return React.createElement(Image, { className: "w-8 h-8" });
  if (file.type.startsWith("video/")) return React.createElement(Video, { className: "w-8 h-8" });
  return React.createElement(FileIcon, { className: "w-8 h-8" });
}
