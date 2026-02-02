import { supabase } from "@/integrations/supabase/client";
import { requireUserId } from "./utils";

export async function getRealTimeScanFeedback(
  _imageData: string,
  sessionId: string,
): Promise<{ quality_score: number; suggestions: string[]; warnings: string[] } | null> {
  const userId = await requireUserId();
  if (!userId) return null;

  // No image processing on client; store lightweight session feedback.
  const quality_score = 0.7;
  const suggestions = ["Hold camera steady", "Ensure sufficient lighting"];
  const warnings: string[] = [];

  await supabase.from("real_time_scan_feedback").insert({
    session_id: sessionId,
    user_id: userId,
    feedback_type: "quality",
    message: suggestions.join("; "),
    severity: "info",
  });

  return { quality_score, suggestions, warnings };
}
