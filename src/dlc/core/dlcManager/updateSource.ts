import { supabase } from "@/integrations/supabase/client";
import type { AppUpdateSource } from "../types";
import { CACHE_KEY_UPDATE_SOURCE } from "./cacheKeys";
import { getLocalStorageJson, setLocalStorageJson } from "./storage";

export function getUpdateSource(installationsSize: number): "store" | "website" {
  if (installationsSize > 0) return "website";
  const cached = getUpdateSourceFromCache();
  return cached?.currentUpdateSource || "store";
}

export function isUpdateSourceAcknowledged(): boolean {
  const cached = getUpdateSourceFromCache();
  return cached?.updateSourceAcknowledged === true;
}

export function acknowledgeUpdateSourceChange(deviceId: string): void {
  const now = new Date();
  const source: AppUpdateSource = {
    userId: "unknown",
    deviceId,
    originalInstallSource: "direct",
    currentUpdateSource: "website",
    sourceChangedAt: now,
    sourceChangeReason: "dlc_installed",
    updateSourceAcknowledged: true,
    acknowledgedAt: now,
  };

  saveUpdateSourceToCache(source);

  // Best-effort persistence to DB (non-fatal; fire-and-forget).
  // This is intentionally not awaited to keep UI responsive.
  void (async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user?.id) return;
       
      await (supabase as any).from("dlc_update_sources").upsert(
        {
          user_id: user.id,
          device_id: deviceId,
          original_install_source: "direct",
          current_update_source: "website",
          source_changed_at: now.toISOString(),
          source_change_reason: "dlc_installed",
          update_source_acknowledged: true,
          acknowledged_at: now.toISOString(),
          updated_at: now.toISOString(),
        },
        { onConflict: "user_id,device_id" },
      );
    } catch {
      // ignore
    }
  })();
}

export function getUpdateSourceFromCache(): AppUpdateSource | null {
  try {
    return (
      getLocalStorageJson<AppUpdateSource>(CACHE_KEY_UPDATE_SOURCE) ||
      getLocalStorageJson<AppUpdateSource>("dlc_update_source")
    );
  } catch {
    return null;
  }
}

export function saveUpdateSourceToCache(source: AppUpdateSource): void {
  try {
    setLocalStorageJson(CACHE_KEY_UPDATE_SOURCE, source);
    setLocalStorageJson("dlc_update_source", source);
  } catch {
    // ignore
  }
}
