import { supabase } from "@/integrations/supabase/client";
import { getDeviceId, getDevicePlatform } from "@/dlc/core/device";
import { logger } from "@/lib/logger";

export async function fetchDlcKey(params: {
  packageId: string;
}): Promise<{ keyId: string; keyB64: string } | null> {
  try {
    const deviceId = getDeviceId();
    const devicePlatform = getDevicePlatform();

    const { data, error } = await supabase.functions.invoke("get-dlc-key", {
      body: { packageId: params.packageId, deviceId, devicePlatform },
    });

    if (error) {
      logger.error("fetchDlcKey failed", { packageId: params.packageId, error: error.message });
      return null;
    }

    if (!data?.keyId || !data?.keyB64) return null;

    return { keyId: String(data.keyId), keyB64: String(data.keyB64) };
  } catch (e) {
    logger.error("fetchDlcKey crashed", {
      packageId: params.packageId,
      error: e instanceof Error ? e.message : String(e),
    });
    return null;
  }
}
