import { supabase } from "@/integrations/supabase/client";
import { fromExtended } from "@/lib/supabaseExtensions";
import { logger } from "@/lib/logger";

export type PositionMediaKind = "image" | "gif" | "video";

export type UserPositionMediaOverride = {
  position_key: string;
  media_kind: PositionMediaKind;
  public_url: string | null;
  bucket: string | null;
  storage_path: string | null;
  mime_type: string | null;
  updated_at: string | null;
  created_at: string | null;
};

export type UserPositionMediaOverridesMap = Record<
  string,
  Partial<Record<PositionMediaKind, UserPositionMediaOverride>>
>;

export async function fetchMyPositionMediaOverrides(): Promise<UserPositionMediaOverridesMap> {
  try {
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();
    if (userErr || !user) return {};

    const { data, error } = await fromExtended("user_position_media_overrides")
      .select(
        "position_key, media_kind, public_url, bucket, storage_path, mime_type, updated_at, created_at",
      )
      .eq("user_id", user.id);

    if (error) {
      logger.error("fetchMyPositionMediaOverrides failed", { error: error.message });
      return {};
    }

    const map: UserPositionMediaOverridesMap = {};
    for (const row of (data || []) as UserPositionMediaOverride[]) {
      if (!row?.position_key || !row?.media_kind) continue;
      map[row.position_key] = map[row.position_key] || {};
      map[row.position_key]![row.media_kind] = row;
    }
    return map;
  } catch (error) {
    logger.error("fetchMyPositionMediaOverrides crashed", { error });
    return {};
  }
}

export async function upsertMyPositionMediaOverride(params: {
  positionKey: string;
  kind: PositionMediaKind;
  bucket?: string | null;
  storagePath?: string | null;
  publicUrl?: string | null;
  mimeType?: string | null;
}): Promise<boolean> {
  try {
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();
    if (userErr || !user) return false;

    const now = new Date().toISOString();
    const payload = {
      user_id: user.id,
      position_key: params.positionKey,
      media_kind: params.kind,
      bucket: params.bucket ?? null,
      storage_path: params.storagePath ?? null,
      public_url: params.publicUrl ?? null,
      mime_type: params.mimeType ?? null,
      updated_at: now,
    };

    const { error } = await fromExtended("user_position_media_overrides")
      .upsert(payload, { onConflict: "user_id,position_key,media_kind" });

    if (error) {
      logger.error("upsertMyPositionMediaOverride failed", { error: error.message });
      return false;
    }
    return true;
  } catch (error) {
    logger.error("upsertMyPositionMediaOverride crashed", { error });
    return false;
  }
}

export async function deleteMyPositionMediaOverride(params: {
  positionKey: string;
  kind: PositionMediaKind;
}): Promise<boolean> {
  try {
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();
    if (userErr || !user) return false;

    const { error } = await fromExtended("user_position_media_overrides")
      .delete()
      .eq("user_id", user.id)
      .eq("position_key", params.positionKey)
      .eq("media_kind", params.kind);

    if (error) {
      logger.error("deleteMyPositionMediaOverride failed", { error: error.message });
      return false;
    }
    return true;
  } catch (error) {
    logger.error("deleteMyPositionMediaOverride crashed", { error });
    return false;
  }
}
