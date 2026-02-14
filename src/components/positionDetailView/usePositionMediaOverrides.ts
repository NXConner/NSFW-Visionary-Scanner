import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { uploadFile } from "@/lib/mediaUpload/upload";
import {
  deleteMyPositionMediaOverride,
  upsertMyPositionMediaOverride,
  type PositionMediaKind,
} from "@/lib/positions/userPositionMediaOverrides";
import { supabase } from "@/integrations/supabase/client";
import { fromExtended } from "@/lib/supabaseExtensions";
import { sanitizeForFolder } from "./utils";

type OverrideUrls = Partial<Record<PositionMediaKind, string>>;

function inferKind(file: File): PositionMediaKind {
  if (file.type === "image/gif") return "gif";
  if (file.type.startsWith("video/")) return "video";
  return "image";
}

function allowedTypesFor(kind: PositionMediaKind): string[] {
  if (kind === "video") return ["video/mp4", "video/webm", "video/quicktime"];
  if (kind === "gif") return ["image/gif"];
  return ["image/jpeg", "image/png", "image/webp", "image/avif", "image/heic", "image/heif"];
}

function maxSizeFor(kind: PositionMediaKind): number {
  return kind === "video" ? 500 * 1024 * 1024 : 25 * 1024 * 1024;
}

export function usePositionMediaOverrides(args: {
  positionId?: string;
  isOpen: boolean;
  onMediaOverrideChange?: (positionId: string) => void;
}): {
  overrideUrls: OverrideUrls;
  overrideLoading: boolean;
  uploadingKind: PositionMediaKind | null;
  reloadOverrides: () => Promise<void>;
  handleUpload: (file: File) => Promise<void>;
  handleRemoveOverride: (kind: PositionMediaKind) => Promise<void>;
} {
  const { positionId, isOpen, onMediaOverrideChange } = args;

  const [overrideUrls, setOverrideUrls] = useState<OverrideUrls>({});
  const [overrideLoading, setOverrideLoading] = useState(false);
  const [uploadingKind, setUploadingKind] = useState<PositionMediaKind | null>(null);

  const safePositionId = useMemo(() => String(positionId || "").trim(), [positionId]);

  const reloadOverrides = useCallback(async (): Promise<void> => {
    if (!safePositionId) return;
    setOverrideLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setOverrideUrls({});
        return;
      }

      const { data, error } = await fromExtended("user_position_media_overrides")
        .select("media_kind, public_url")
        .eq("user_id", user.id)
        .eq("position_key", safePositionId);

      if (error) {
        setOverrideUrls({});
        return;
      }

      const rows = Array.isArray(data) ? data : [];
      const next: OverrideUrls = {};
      for (const r of rows) {
        const kind = r?.media_kind as PositionMediaKind | undefined;
        const url = typeof r?.public_url === "string" ? String(r.public_url).trim() : "";
        if (kind && url) next[kind] = url;
      }
      setOverrideUrls(next);
    } finally {
      setOverrideLoading(false);
    }
  }, [safePositionId]);

  useEffect(() => {
    if (!isOpen) return;
    void reloadOverrides();
  }, [isOpen, reloadOverrides]);

  const handleUpload = useCallback(
    async (file: File): Promise<void> => {
      if (!safePositionId) return;
      const kind = inferKind(file);

      setUploadingKind(kind);
      try {
        const folder = `positions/${sanitizeForFolder(safePositionId)}`;
        const res = await uploadFile(file, {
          folder,
          allowedTypes: allowedTypesFor(kind),
          maxSize: maxSizeFor(kind),
        });

        if (!res?.publicUrl) {
          toast.error("Upload failed (no public URL returned). Check storage bucket permissions.");
          return;
        }

        const ok = await upsertMyPositionMediaOverride({
          positionKey: safePositionId,
          kind,
          bucket: res.bucket,
          storagePath: res.path,
          publicUrl: res.publicUrl,
          mimeType: res.mimeType,
        });

        if (!ok) {
          toast.error("Could not save override. Make sure you're signed in.");
          return;
        }

        toast.success("Media updated for this position.");
        await reloadOverrides();
        onMediaOverrideChange?.(safePositionId);
      } catch {
        toast.error("Upload failed.");
      } finally {
        setUploadingKind(null);
      }
    },
    [onMediaOverrideChange, reloadOverrides, safePositionId],
  );

  const handleRemoveOverride = useCallback(
    async (kind: PositionMediaKind): Promise<void> => {
      if (!safePositionId) return;
      const ok = await deleteMyPositionMediaOverride({ positionKey: safePositionId, kind });
      if (!ok) {
        toast.error("Could not remove override. Make sure you're signed in.");
        return;
      }
      toast.success("Override removed.");
      await reloadOverrides();
      onMediaOverrideChange?.(safePositionId);
    },
    [onMediaOverrideChange, reloadOverrides, safePositionId],
  );

  return {
    overrideUrls,
    overrideLoading,
    uploadingKind,
    reloadOverrides,
    handleUpload,
    handleRemoveOverride,
  };
}
