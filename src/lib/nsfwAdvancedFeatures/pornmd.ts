import { supabase } from "@/integrations/supabase/client";
import { fromExtended } from "@/lib/supabaseExtensions";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import type { PornMDIntegration, PornMDPreferences } from "./types";

export async function enablePornMDIntegration(
  apiKey: string,
  apiSecret: string,
  preferences: PornMDPreferences,
): Promise<PornMDIntegration | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Please sign in to enable PornMD integration");
      return null;
    }

    const { data: encryptedData, error: encryptError } = await supabase.functions.invoke(
      "encrypt-credentials",
      {
        body: { api_key: apiKey, api_secret: apiSecret },
      },
    );

    if (encryptError || !encryptedData) {
      logger.error("Error encrypting credentials", { error: encryptError?.message });
      toast.error("Failed to encrypt credentials");
      return null;
    }

    const { data, error } = await fromExtended("pornmd_integration")
      .upsert(
        {
          user_id: user.id,
          is_enabled: true,
          api_key_encrypted:
            (encryptedData as { api_key_encrypted?: string }).api_key_encrypted ?? null,
          api_secret_encrypted:
            (encryptedData as { api_secret_encrypted?: string }).api_secret_encrypted ?? null,
          content_preferences: preferences,
          sync_enabled: true,
        },
        { onConflict: "user_id" },
      )
      .select("*")
      .single();

    if (error) {
      logger.error("Error enabling PornMD integration", { error: error.message });
      toast.error("Failed to enable integration");
      return null;
    }

    toast.success("PornMD integration enabled!");
    return data as unknown as PornMDIntegration;
  } catch (error) {
    logger.error("Error in enablePornMDIntegration", { error });
    return null;
  }
}

export async function getPornMDIntegration(): Promise<PornMDIntegration | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("pornmd_integration")
      .select("*")
      .eq("user_id", user.id)
      .single();

    // PGRST116 = no rows
    if (error && (error as { code?: string }).code !== "PGRST116") {
      logger.error("Error fetching PornMD integration", { error: error.message });
      return null;
    }

    return (data || null) as unknown as PornMDIntegration | null;
  } catch (error) {
    logger.error("Error in getPornMDIntegration", { error });
    return null;
  }
}
