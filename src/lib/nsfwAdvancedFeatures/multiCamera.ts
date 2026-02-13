import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import { logPartnerEvent } from "@/lib/partnerSync/analytics";
import type { MultiCameraSession } from "./types";

export async function getMultiCameraSessions(): Promise<MultiCameraSession[]> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("multi_camera_sessions")
      .select("*")
      .or(`user_id.eq.${user.id},partner_id.eq.${user.id}`)
      .order("updated_at", { ascending: false });

    if (error) {
      logger.error("Error fetching sessions", { error: error.message });
      return [];
    }

    return (data || []) as MultiCameraSession[];
  } catch (error) {
    logger.error("Error in getMultiCameraSessions", { error });
    return [];
  }
}

export async function createMultiCameraSession(
  sessionName: string,
  sessionType: MultiCameraSession["session_type"],
  partnerId: string | null = null,
  quality: MultiCameraSession["quality"] = "1080p",
): Promise<MultiCameraSession | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Please sign in to create session");
      return null;
    }

    const { data, error } = await supabase
      .from("multi_camera_sessions")
      .insert({
        user_id: user.id,
        partner_id: partnerId,
        session_name: sessionName,
        session_type: sessionType,
        quality,
        sync_enabled: partnerId !== null,
      })
      .select("*")
      .single();

    if (error) {
      logger.error("Error creating session", { error: error.message });
      toast.error("Failed to create session");
      return null;
    }

    toast.success("Recording session created!");
    return data as MultiCameraSession;
  } catch (error) {
    logger.error("Error in createMultiCameraSession", { error });
    return null;
  }
}

export async function createPartnerSyncSession(params: {
  sessionName: string;
  partnerId: string;
  connectionId: string;
  quality?: MultiCameraSession["quality"];
}): Promise<MultiCameraSession | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Please sign in to create session");
      return null;
    }
    const session = await createMultiCameraSession(
      params.sessionName,
      "partner_sync",
      params.partnerId,
      params.quality ?? "1080p",
    );
    if (session && params.connectionId) {
      await logPartnerEvent(params.connectionId, user.id, "partner_recording_session_created", {
        session_id: session.id,
        session_name: session.session_name,
        quality: session.quality,
      });
    }
    return session;
  } catch (error) {
    logger.error("Error in createPartnerSyncSession", { error });
    return null;
  }
}

export async function getMultiCameraSessionById(
  sessionId: string,
): Promise<MultiCameraSession | null> {
  try {
    const { data, error } = await supabase
      .from("multi_camera_sessions")
      .select("*")
      .eq("id", sessionId)
      .maybeSingle();
    if (error || !data) {
      logger.error("Error fetching session by id", { error: error?.message });
      return null;
    }
    return data as MultiCameraSession;
  } catch (error) {
    logger.error("Error in getMultiCameraSessionById", { error });
    return null;
  }
}

export async function startRecording(sessionId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("multi_camera_sessions")
      .update({ recording_status: "recording", started_at: new Date().toISOString() })
      .eq("id", sessionId);

    if (error) {
      logger.error("Error starting recording", { error: error.message });
      toast.error("Failed to start recording");
      return false;
    }

    toast.success("Recording started!");
    return true;
  } catch (error) {
    logger.error("Error in startRecording", { error });
    return false;
  }
}

export async function stopRecording(sessionId: string, durationSeconds: number): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("multi_camera_sessions")
      .update({
        recording_status: "completed",
        completed_at: new Date().toISOString(),
        duration_seconds: durationSeconds,
      })
      .eq("id", sessionId);

    if (error) {
      logger.error("Error stopping recording", { error: error.message });
      toast.error("Failed to stop recording");
      return false;
    }

    toast.success("Recording completed!");
    return true;
  } catch (error) {
    logger.error("Error in stopRecording", { error });
    return false;
  }
}

export async function updateMultiCameraSessionMetadata(
  sessionId: string,
  patch: {
    session_name?: string;
    quality?: MultiCameraSession["quality"];
  },
): Promise<MultiCameraSession | null> {
  try {
    const update: Partial<Pick<MultiCameraSession, "session_name" | "quality" | "updated_at">> = {
      updated_at: new Date().toISOString(),
    };
    if (typeof patch.session_name === "string") update.session_name = patch.session_name;
    if (patch.quality) update.quality = patch.quality;

    // No-op updates should not hit the DB.
    if (!update.session_name && !update.quality) return await getMultiCameraSessionById(sessionId);

    const { data, error } = await supabase
      .from("multi_camera_sessions")
      .update(update)
      .eq("id", sessionId)
      .select("*")
      .maybeSingle();

    if (error || !data) {
      logger.error("Error updating session metadata", { error: error?.message });
      return null;
    }

    return data as MultiCameraSession;
  } catch (error) {
    logger.error("Error in updateMultiCameraSessionMetadata", { error });
    return null;
  }
}
