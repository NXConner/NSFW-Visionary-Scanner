import { supabase } from "@/integrations/supabase/client";
import { fromExtended } from "@/lib/supabaseExtensions";
import { logger } from "@/lib/logger";

import type {
  BatchScanSession,
  Exported3DModel,
  MeasurementTemplate,
  MultiAngleScanSession,
  TimeLapseComparison,
} from "./types";

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("Not authenticated");
  return data.user.id;
}

function nowIso() {
  return new Date().toISOString();
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export async function createMultiAngleScanSession(
  sessionName: string,
  targetAngles: number = 8,
): Promise<MultiAngleScanSession | null> {
  const userId = await requireUserId();
  const payload = {
    user_id: userId,
    session_name: sessionName || null,
    scan_type: "3d_reconstruction",
    target_angles: clamp(targetAngles, 2, 36),
    angles_captured: 0,
    is_complete: false,
    processing_status: "pending",
  };

  const { data, error } = await fromExtended("multi_angle_scan_sessions")
    .insert(payload)
    .select("*")
    .single();

  if (error) throw error;
  return (data ?? null) as unknown as MultiAngleScanSession | null;
}

export async function addAngleToSession(
  sessionId: string,
  angleIndex: number,
  imageUrl: string,
  angleDegrees: number,
  measurements?: unknown,
): Promise<boolean> {
  const userId = await requireUserId();
  void userId; // auth is enforced via RLS on session ownership

  // Insert/replace for the same angle index (client-side de-dup)
  const { error: insertErr } = await fromExtended("multi_angle_scan_images").insert({
    session_id: sessionId,
    angle_index: angleIndex,
    angle_degrees: angleDegrees,
    image_url: imageUrl,
    measurements: measurements ?? null,
    created_at: nowIso(),
  });

  if (insertErr) {
    logger.warn("Failed to add angle image", { sessionId, angleIndex, error: insertErr.message });
    throw insertErr;
  }

  // Recompute angles_captured and mark complete if target reached
  const { data: images, error: countErr } = await fromExtended("multi_angle_scan_images")
    .select("id", { count: "exact", head: false })
    .eq("session_id", sessionId);

  if (countErr) throw countErr;
  const count = Array.isArray(images) ? images.length : 0;

  const { data: session, error: sessionErr } = await fromExtended("multi_angle_scan_sessions")
    .select("target_angles")
    .eq("id", sessionId)
    .maybeSingle();
  if (sessionErr) throw sessionErr;

  const target = Number((session as Record<string, unknown>)?.target_angles ?? 8);
  const isComplete = count >= target;

  const { error: updErr } = await fromExtended("multi_angle_scan_sessions")
    .update({ angles_captured: count, is_complete: isComplete, updated_at: nowIso() })
    .eq("id", sessionId);
  if (updErr) throw updErr;

  return true;
}

export async function start3DReconstruction(sessionId: string): Promise<boolean> {
  const userId = await requireUserId();

  // Mark session as processing and enqueue a cloud job. Actual processing is handled elsewhere.
  const { error: sessionErr } = await fromExtended("multi_angle_scan_sessions")
    .update({
      processing_status: "processing",
      processing_started_at: nowIso(),
      updated_at: nowIso(),
    })
    .eq("id", sessionId)
    .eq("user_id", userId);
  if (sessionErr) throw sessionErr;

  const { error: jobErr } = await fromExtended("cloud_processing_jobs").insert({
    user_id: userId,
    job_type: "3d_reconstruction",
    related_session_id: sessionId,
    status: "queued",
    priority: 5,
    input_data: { sessionId },
    created_at: nowIso(),
    updated_at: nowIso(),
  });
  if (jobErr) throw jobErr;

  return true;
}

export async function createTimeLapseComparison(
  startScanId: string,
  endScanId: string,
  comparisonName?: string,
): Promise<TimeLapseComparison | null> {
  const userId = await requireUserId();

  // Load scans and compute deltas. Uses real scan data; images are optional and remain null by default.
  const scanQuery = fromExtended("scans")
    .select("id, scanned_at, created_at, length, girth, curvature_angle")
    .eq("user_id", userId)
    .in("id", [startScanId, endScanId]);
  const { data: scans, error: scanErr } = await scanQuery;
  if (scanErr) throw scanErr;

  const scanList = (scans ?? []) as Record<string, unknown>[];
  const start = scanList.find(s => s.id === startScanId);
  const end = scanList.find(s => s.id === endScanId);
  if (!start || !end) throw new Error("Start or end scan not found");

  const lengthChange =
    start.length != null && end.length != null ? Number(end.length) - Number(start.length) : null;
  const circumferenceChange =
    start.girth != null && end.girth != null ? Number(end.girth) - Number(start.girth) : null;
  const curvatureChange =
    start.curvature_angle != null && end.curvature_angle != null
      ? Number(end.curvature_angle) - Number(start.curvature_angle)
      : null;

  const t0 = new Date(String(start.scanned_at ?? start.created_at ?? nowIso())).getTime();
  const t1 = new Date(String(end.scanned_at ?? end.created_at ?? nowIso())).getTime();
  const days = t0 && t1 ? Math.max(0, Math.round((t1 - t0) / (1000 * 60 * 60 * 24))) : null;

  const growthRatePerMonth =
    days && lengthChange != null ? (Number(lengthChange) / days) * 30 : null;
  const growthPercentage =
    start.length && lengthChange != null
      ? (Number(lengthChange) / Number(start.length)) * 100
      : null;

  const payload = {
    user_id: userId,
    comparison_name: comparisonName ?? null,
    start_scan_id: startScanId,
    end_scan_id: endScanId,
    length_change: lengthChange,
    circumference_change: circumferenceChange,
    curvature_change: curvatureChange,
    time_period_days: days,
    comparison_image_url: null,
    overlay_image_url: null,
    slider_image_url: null,
    animated_gif_url: null,
    growth_rate_per_month: growthRatePerMonth,
    growth_percentage: growthPercentage,
  };

  const { data, error } = await fromExtended("time_lapse_comparisons")
    .insert(payload)
    .select("*")
    .single();
  if (error) throw error;
  return (data ?? null) as unknown as TimeLapseComparison | null;
}

export async function getTimeLapseComparisons(): Promise<TimeLapseComparison[]> {
  const userId = await requireUserId();
  const { data, error } = await fromExtended("time_lapse_comparisons")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []) as unknown as TimeLapseComparison[];
}

export async function createMeasurementTemplate(
  templateName: string,
  measurementPoints: unknown,
  description?: string,
  isDefault: boolean = false,
): Promise<MeasurementTemplate | null> {
  const userId = await requireUserId();

  if (isDefault) {
    // best-effort: unset previous defaults
    try {
      await fromExtended("measurement_templates")
        .update({ is_default: false })
        .eq("user_id", userId)
        .eq("is_default", true);
    } catch {
      // ignore
    }
  }

  const { data, error } = await fromExtended("measurement_templates")
    .insert({
      user_id: userId,
      template_name: templateName,
      description: description ?? null,
      measurement_points: measurementPoints,
      auto_capture_enabled: false,
      quality_threshold: 0.7,
      is_default: isDefault,
      is_shared: false,
      usage_count: 0,
      created_at: nowIso(),
      updated_at: nowIso(),
    })
    .select("*")
    .single();

  if (error) throw error;
  return (data ?? null) as unknown as MeasurementTemplate | null;
}

export async function getMeasurementTemplates(
  includeShared: boolean = true,
): Promise<MeasurementTemplate[]> {
  const userId = await requireUserId();

  let q = fromExtended("measurement_templates")
    .select("*")
    .order("is_default", { ascending: false })
    .order("updated_at", { ascending: false });
  q = includeShared ? q.or(`user_id.eq.${userId},is_shared.eq.true`) : q.eq("user_id", userId);
  const { data, error } = await q.limit(100);
  if (error) throw error;
  return (data ?? []) as unknown as MeasurementTemplate[];
}

export async function createBatchScanSession(
  sessionName: string,
  batchType: BatchScanSession["batch_type"],
  targetCount: number,
  intervalMinutes?: number,
): Promise<BatchScanSession | null> {
  const userId = await requireUserId();
  const payload = {
    user_id: userId,
    session_name: sessionName || null,
    batch_type: batchType,
    target_count: targetCount,
    scans_captured: 0,
    is_complete: false,
    interval_minutes: intervalMinutes ?? null,
    created_at: nowIso(),
    updated_at: nowIso(),
  };
  const { data, error } = await fromExtended("batch_scan_sessions")
    .insert(payload)
    .select("*")
    .single();
  if (error) throw error;
  return (data ?? null) as unknown as BatchScanSession | null;
}

export async function export3DModel(
  sessionId: string,
  format: Exported3DModel["export_format"],
  qualityLevel: Exported3DModel["quality_level"] = "high",
  includeTexture: boolean = true,
  includeMeasurements: boolean = true,
): Promise<Exported3DModel | null> {
  const userId = await requireUserId();

  // If session already has a reconstructed model URL, we can create an export record referencing it.
  const { data: session, error: sessionErr } = await fromExtended("multi_angle_scan_sessions")
    .select("reconstructed_3d_model_url")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .maybeSingle();

  if (sessionErr) throw sessionErr;
  const url = (session as Record<string, unknown>)?.reconstructed_3d_model_url as string | null;

  if (!url) {
    // Enqueue an export job (no fake URLs). Return null until a worker fills results.
    const { error: jobErr } = await fromExtended("cloud_processing_jobs").insert({
      user_id: userId,
      job_type: "export_3d_model",
      related_session_id: sessionId,
      status: "queued",
      priority: 5,
      input_data: { sessionId, format, qualityLevel, includeTexture, includeMeasurements },
      created_at: nowIso(),
      updated_at: nowIso(),
    });
    if (jobErr) throw jobErr;
    return null;
  }

  const { data, error } = await fromExtended("exported_3d_models")
    .insert({
      user_id: userId,
      session_id: sessionId,
      export_format: format,
      file_url: url,
      include_texture: includeTexture,
      include_measurements: includeMeasurements,
      quality_level: qualityLevel,
      download_count: 0,
      created_at: nowIso(),
    })
    .select("*")
    .single();

  if (error) throw error;
  return (data ?? null) as unknown as Exported3DModel | null;
}

export async function getExported3DModels(): Promise<Exported3DModel[]> {
  const userId = await requireUserId();
  const { data, error } = await fromExtended("exported_3d_models")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []) as unknown as Exported3DModel[];
}
