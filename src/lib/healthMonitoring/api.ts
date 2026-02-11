import { supabase } from "@/integrations/supabase/client";
import { fromExtended } from "@/lib/supabaseExtensions";

import type {
  HealthAlert,
  HealthRiskFactor,
  HealthSummary,
  HormoneLevel,
  ProstateHealthEntry,
  SexualHealthEntry,
  SexualWellnessScore,
  TesticularHealthEntry,
  UrinaryHealthEntry,
} from "./types";

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("Not authenticated");
  return data.user.id;
}

function normalizeDate(d: string | undefined) {
  if (!d) return new Date().toISOString().slice(0, 10);
  // accept YYYY-MM-DD or ISO, normalize to YYYY-MM-DD
  return d.length >= 10 ? d.slice(0, 10) : d;
}

function computeTrendFromNumbers(a: number | null | undefined, b: number | null | undefined) {
  if (a == null || b == null) return "stable";
  const delta = b - a;
  if (Math.abs(delta) < 0.01) return "stable";
  return delta > 0 ? "increasing" : "decreasing";
}

export async function saveProstateHealthEntry(
  entry: Partial<ProstateHealthEntry>,
): Promise<boolean> {
  const userId = await requireUserId();
  const payload = {
    user_id: userId,
    entry_date: normalizeDate(entry.entry_date),
    psa_level: entry.psa_level ?? null,
    symptoms: entry.symptoms ?? [],
    pain_level: entry.pain_level ?? null,
    urination_frequency: entry.urination_frequency ?? null,
    urination_difficulty: entry.urination_difficulty ?? null,
    blood_in_urine: entry.blood_in_urine ?? false,
    notes: entry.notes ?? null,
  };
  const { error } = await fromExtended("prostate_health").upsert(payload, {
    onConflict: "user_id,entry_date",
  });
  if (error) throw error;
  return true;
}

export async function getProstateHealthEntries(limit: number = 30): Promise<ProstateHealthEntry[]> {
  const userId = await requireUserId();
  const { data, error } = await fromExtended("prostate_health")
    .select("*")
    .eq("user_id", userId)
    .order("entry_date", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as unknown as ProstateHealthEntry[];
}

export async function saveTesticularHealthEntry(
  entry: Partial<TesticularHealthEntry>,
): Promise<boolean> {
  const userId = await requireUserId();
  const payload = {
    user_id: userId,
    entry_date: normalizeDate(entry.entry_date),
    self_exam_performed: entry.self_exam_performed ?? false,
    abnormalities_found: entry.abnormalities_found ?? false,
    abnormality_description: entry.abnormality_description ?? null,
    pain_level: entry.pain_level ?? null,
    swelling: entry.swelling ?? false,
    lumps_detected: entry.lumps_detected ?? false,
    size_changes: entry.size_changes ?? null,
    notes: entry.notes ?? null,
  };
  const { error } = await fromExtended("testicular_health").upsert(payload, {
    onConflict: "user_id,entry_date",
  });
  if (error) throw error;
  return true;
}

export async function getTesticularHealthEntries(
  limit: number = 30,
): Promise<TesticularHealthEntry[]> {
  const userId = await requireUserId();
  const { data, error } = await fromExtended("testicular_health")
    .select("*")
    .eq("user_id", userId)
    .order("entry_date", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as unknown as TesticularHealthEntry[];
}

export async function saveSexualHealthEntry(entry: Partial<SexualHealthEntry>): Promise<boolean> {
  const userId = await requireUserId();
  const payload = {
    user_id: userId,
    entry_date: normalizeDate(entry.entry_date),
    erectile_function_score: entry.erectile_function_score ?? null,
    libido_level: entry.libido_level ?? null,
    satisfaction_level: entry.satisfaction_level ?? null,
    frequency_per_week: entry.frequency_per_week ?? null,
    orgasm_quality: entry.orgasm_quality ?? null,
    premature_ejaculation: entry.premature_ejaculation ?? false,
    delayed_ejaculation: entry.delayed_ejaculation ?? false,
    notes: entry.notes ?? null,
  };
  const { error } = await fromExtended("sexual_health_metrics").upsert(payload, {
    onConflict: "user_id,entry_date",
  });
  if (error) throw error;
  return true;
}

export async function getSexualHealthEntries(limit: number = 30): Promise<SexualHealthEntry[]> {
  const userId = await requireUserId();
  const { data, error } = await fromExtended("sexual_health_metrics")
    .select("*")
    .eq("user_id", userId)
    .order("entry_date", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as unknown as SexualHealthEntry[];
}

export async function getWellnessScores(limit: number = 30): Promise<SexualWellnessScore[]> {
  const userId = await requireUserId();
  const { data, error } = await fromExtended("sexual_wellness_scores")
    .select("*")
    .eq("user_id", userId)
    .order("entry_date", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as unknown as SexualWellnessScore[];
}

export async function saveHormoneLevels(levels: Partial<HormoneLevel>): Promise<boolean> {
  const userId = await requireUserId();
  const payload = {
    user_id: userId,
    test_date: normalizeDate(levels.test_date),
    testosterone_total: levels.testosterone_total ?? null,
    testosterone_free: levels.testosterone_free ?? null,
    lh: levels.lh ?? null,
    fsh: levels.fsh ?? null,
    prolactin: levels.prolactin ?? null,
    shbg: levels.shbg ?? null,
    notes: levels.notes ?? null,
    lab_name: levels.lab_name ?? null,
  };
  const { error } = await fromExtended("hormone_levels").insert(payload);
  if (error) throw error;
  return true;
}

export async function getHormoneLevels(limit: number = 10): Promise<HormoneLevel[]> {
  const userId = await requireUserId();
  const { data, error } = await fromExtended("hormone_levels")
    .select("*")
    .eq("user_id", userId)
    .order("test_date", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as unknown as HormoneLevel[];
}

export async function saveUrinaryHealthEntry(entry: Partial<UrinaryHealthEntry>): Promise<boolean> {
  const userId = await requireUserId();
  const payload = {
    user_id: userId,
    entry_date: normalizeDate(entry.entry_date),
    frequency_per_day: entry.frequency_per_day ?? null,
    urgency_level: entry.urgency_level ?? null,
    nocturia_count: entry.nocturia_count ?? null,
    incontinence: entry.incontinence ?? false,
    incontinence_type: entry.incontinence_type ?? null,
    stream_strength: entry.stream_strength ?? null,
    incomplete_emptying: entry.incomplete_emptying ?? false,
    pain_on_urination: entry.pain_on_urination ?? false,
    blood_in_urine: entry.blood_in_urine ?? false,
    notes: entry.notes ?? null,
  };
  const { error } = await fromExtended("urinary_health").upsert(payload, {
    onConflict: "user_id,entry_date",
  });
  if (error) throw error;
  return true;
}

export async function getUrinaryHealthEntries(limit: number = 30): Promise<UrinaryHealthEntry[]> {
  const userId = await requireUserId();
  const { data, error } = await fromExtended("urinary_health")
    .select("*")
    .eq("user_id", userId)
    .order("entry_date", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as unknown as UrinaryHealthEntry[];
}

export async function getHealthAlerts(unreadOnly: boolean = false): Promise<HealthAlert[]> {
  const userId = await requireUserId();

  let q = fromExtended("health_alerts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (unreadOnly) q = q.eq("is_read", false);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as HealthAlert[];
}

export async function markAlertRead(alertId: string): Promise<boolean> {
  const userId = await requireUserId();
  const { error } = await fromExtended("health_alerts")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("id", alertId)
    .eq("user_id", userId);
  if (error) throw error;
  return true;
}

export async function getHealthRiskFactors(): Promise<HealthRiskFactor[]> {
  const userId = await requireUserId();
  const { data, error } = await fromExtended("health_risk_factors")
    .select("*")
    .eq("user_id", userId)
    .order("assessed_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []) as unknown as HealthRiskFactor[];
}

export async function getHealthSummary(): Promise<HealthSummary> {
  const [prostate, testicular, sexual, urinary, wellness, alerts] = await Promise.all([
    getProstateHealthEntries(2),
    getTesticularHealthEntries(30),
    getSexualHealthEntries(30),
    getUrinaryHealthEntries(2),
    getWellnessScores(2),
    getHealthAlerts(true),
  ]);

  const prostateTrend = computeTrendFromNumbers(
    prostate[1]?.psa_level ?? null,
    prostate[0]?.psa_level ?? null,
  );
  const urinaryTrend = computeTrendFromNumbers(
    urinary[1]?.urgency_level ?? null,
    urinary[0]?.urgency_level ?? null,
  );
  const wellnessTrend = computeTrendFromNumbers(
    wellness[1]?.overall_score ?? null,
    wellness[0]?.overall_score ?? null,
  );

  const avgSexual = sexual.length
    ? Math.round(
        (sexual.reduce((sum, e) => sum + (e.erectile_function_score ?? 0), 0) / sexual.length) * 10,
      ) / 10
    : 0;

  const examsDone = testicular.filter(t => t.self_exam_performed).length;

  return {
    prostate: { latestEntry: prostate[0] ?? null, trend: prostateTrend },
    testicular: { latestEntry: testicular[0] ?? null, examsDone },
    sexual: { latestEntry: sexual[0] ?? null, averageScore: avgSexual },
    urinary: { latestEntry: urinary[0] ?? null, trend: urinaryTrend },
    wellness: { latestScore: wellness[0] ?? null, trend: wellnessTrend },
    alerts,
  };
}
