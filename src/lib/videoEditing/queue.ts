import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import type { VideoEditQueueRequest, VideoEditQueueResponse } from "./types";
import { normalizeTimeline } from "./validate";

export async function queueVideoEdit(req: VideoEditQueueRequest): Promise<VideoEditQueueResponse> {
  try {
    const timeline = normalizeTimeline(req.timeline);

    const { data, error } = await supabase.functions.invoke("video-editing", {
      body: {
        recording_id: req.recordingId,
        edit_type: req.editType,
        edit_name: req.editName ?? null,
        edit_config: timeline,
        camera_switches: timeline.cameraSwitches,
        masking_data: { masks: timeline.masks },
        transitions: {
          default: "cut",
          switches: timeline.cameraSwitches.map(s => ({
            atSeconds: s.atSeconds,
            transition: s.transition,
            durationMs: s.transitionDurationMs ?? 0,
          })),
        },
      },
    });

    if (error) {
      return { ok: false, error: error.message || "Failed to queue edit" };
    }

    const editId = (data as any)?.edit_id ? String((data as any).edit_id) : "";
    const status = (data as any)?.status ? String((data as any).status) : "pending";
    if (!editId) return { ok: false, error: "Unexpected response from edit queue" };
    return { ok: true, editId, status };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to queue edit";
    logger.error("queueVideoEdit failed", { error: message });
    return { ok: false, error: message };
  }
}

