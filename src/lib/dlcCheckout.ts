import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";

export async function createDLCCheckoutSession(
  packageId: string,
  opts?: { promoCode?: string },
): Promise<string | null> {
  try {
    const origin = window.location.origin;
    const successUrl = `${origin}/store?purchase=success&package=${encodeURIComponent(packageId)}`;
    const cancelUrl = `${origin}/store?purchase=cancel&package=${encodeURIComponent(packageId)}`;
    const promoCode = opts?.promoCode?.trim() ? String(opts.promoCode).trim().toUpperCase() : null;

    const { data, error } = await supabase.functions.invoke("create-dlc-checkout-session", {
      body: { packageId, successUrl, cancelUrl, promoCode },
    });

    if (error) {
      logger.error("Failed to create DLC checkout session", { packageId, error: error.message });
      return null;
    }

    return data?.url || null;
  } catch (error) {
    logger.error("DLC checkout session creation failed", {
      packageId,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return null;
  }
}
