import { fromExtended } from "@/lib/supabaseExtensions";
import { supabase } from "@/integrations/supabase/client";
import type {
  DiaryAnalytics,
  DiaryTemplate,
  EnhancedDiaryEntry,
  MedicationSchedule,
} from "./types";

type JsonObject = Record<string, unknown>;

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("Not authenticated");
  return data.user.id;
}

function isoDate(d: string) {
  return d.trim().slice(0, 10);
}

function countArray(v: unknown) {
  return Array.isArray(v) ? v.length : 0;
}

function extractStrings(v: unknown): string[] {
  if (v == null) return [];
  if (typeof v === "string") return [v];
  if (Array.isArray(v)) return v.flatMap(x => extractStrings(x));
  if (typeof v === "object") {
    return Object.values(v as Record<string, unknown>).flatMap(x => extractStrings(x));
  }
  return [];
}

function buildSearchText(entry: Partial<EnhancedDiaryEntry>): {
  searchable_text: string;
  keywords: string[];
  categories: string[];
} {
  const parts: string[] = [];
  parts.push(...extractStrings(entry.notes));
  parts.push(...extractStrings(entry.mood_notes));
  parts.push(...extractStrings(entry.energy_notes));
  parts.push(...extractStrings(entry.sleep_notes));
  parts.push(...extractStrings(entry.diet_notes));
  parts.push(...extractStrings(entry.exercise_notes));
  parts.push(...extractStrings(entry.weather));
  parts.push(...extractStrings(entry.location));
  parts.push(...extractStrings(entry.tags));
  parts.push(...extractStrings(entry.mood_tags));
  parts.push(...extractStrings(entry.symptoms));
  parts.push(...extractStrings(entry.medications));
  parts.push(...extractStrings(entry.meals));
  parts.push(...extractStrings(entry.exercises));

  const searchable_text = parts
    .map(s => s.trim())
    .filter(Boolean)
    .join(" ")
    .slice(0, 40000);

  const keywords = Array.from(
    new Set(
      searchable_text
        .toLowerCase()
        .split(/[^a-z0-9]+/g)
        .filter(k => k.length >= 3)
        .slice(0, 500),
    ),
  );

  const categories: string[] = [];
  if (countArray(entry.symptoms) > 0) categories.push("symptoms");
  if (countArray(entry.medications) > 0) categories.push("medications");
  if (countArray(entry.photos) > 0) categories.push("photos");
  if (countArray(entry.voice_notes) > 0) categories.push("voice_notes");
  if (entry.mood_score != null) categories.push("mood");
  if (entry.sleep_hours != null || entry.sleep_quality != null) categories.push("sleep");
  if (entry.total_calories != null || entry.water_intake_ml != null) categories.push("diet");
  if (entry.total_exercise_minutes != null) categories.push("exercise");

  return { searchable_text, keywords, categories };
}

export async function createEnhancedDiaryEntry(
  entryDate: string,
  entryData: Partial<EnhancedDiaryEntry>,
): Promise<EnhancedDiaryEntry | null> {
  const userId = await requireUserId();
  const date = isoDate(entryDate);

  const symptomCount = countArray(entryData.symptoms);
  const medicationCount = countArray(entryData.medications);
  const photoCount = countArray(entryData.photos);
  const voiceCount = countArray(entryData.voice_notes);
  const totalExerciseMinutes =
    entryData.total_exercise_minutes ??
    (Array.isArray(entryData.exercises)
      ? entryData.exercises.reduce(
          (sum, ex) => sum + Number((ex as JsonObject).duration_minutes ?? 0),
          0,
        )
      : null);

  const payload: JsonObject = {
    user_id: userId,
    entry_date: date,
    base_entry_id: entryData.base_entry_id ?? null,
    entry_time: entryData.entry_time ?? null,
    symptoms: entryData.symptoms ?? null,
    symptom_count: symptomCount,
    medications: entryData.medications ?? null,
    medication_count: medicationCount,
    mood_score: entryData.mood_score ?? null,
    mood_label: entryData.mood_label ?? null,
    mood_notes: entryData.mood_notes ?? null,
    mood_tags: entryData.mood_tags ?? null,
    energy_level: entryData.energy_level ?? null,
    energy_notes: entryData.energy_notes ?? null,
    sleep_hours: entryData.sleep_hours ?? null,
    sleep_quality: entryData.sleep_quality ?? null,
    sleep_start_time: entryData.sleep_start_time ?? null,
    sleep_end_time: entryData.sleep_end_time ?? null,
    sleep_notes: entryData.sleep_notes ?? null,
    sleep_interruptions: entryData.sleep_interruptions ?? 0,
    meals: entryData.meals ?? null,
    total_calories: entryData.total_calories ?? null,
    water_intake_ml: entryData.water_intake_ml ?? null,
    diet_notes: entryData.diet_notes ?? null,
    exercises: entryData.exercises ?? null,
    total_exercise_minutes: totalExerciseMinutes,
    exercise_notes: entryData.exercise_notes ?? null,
    photos: entryData.photos ?? null,
    photo_count: photoCount,
    voice_notes: entryData.voice_notes ?? null,
    voice_note_count: voiceCount,
    notes: entryData.notes ?? null,
    tags: entryData.tags ?? null,
    weather: entryData.weather ?? null,
    temperature_celsius: entryData.temperature_celsius ?? null,
    location: entryData.location ?? null,
    is_private: entryData.is_private ?? true,
    updated_at: new Date().toISOString(),
  };

  const { data: entry, error } = await fromExtended("enhanced_diary_entries")
    .upsert(payload, { onConflict: "user_id,entry_date" })
    .select("*")
    .single();

  if (error) throw error;
  const entryRow = entry as Record<string, unknown>;
  if (!entryRow?.id) return null;

  // Maintain client-managed search index (allowed by RLS).
  const { searchable_text, keywords, categories } = buildSearchText(entryRow as unknown as EnhancedDiaryEntry);
  try {
    const { data: existing, error: existingErr } = await fromExtended("diary_search_index")
      .select("id")
      .eq("entry_id", entryRow.id)
      .eq("user_id", userId)
      .maybeSingle();
    if (existingErr && existingErr.code !== "PGRST116") throw existingErr;

    const existingRow = existing as Record<string, unknown> | null;
    if (existingRow?.id) {
      await fromExtended("diary_search_index")
        .update({
          searchable_text,
          keywords,
          entry_date: date,
          tags: entryRow.tags ?? null,
          categories,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingRow.id)
        .eq("user_id", userId);
    } else {
      await fromExtended("diary_search_index").insert({
        entry_id: entryRow.id,
        user_id: userId,
        searchable_text,
        keywords,
        entry_date: date,
        tags: entryRow.tags ?? null,
        categories,
        indexed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
  } catch {
    // Search index is best-effort; entry creation remains the source of truth.
  }

  return entryRow as unknown as EnhancedDiaryEntry;
}

export async function getEnhancedDiaryEntries(
  startDate?: string,
  endDate?: string,
): Promise<EnhancedDiaryEntry[]> {
  const userId = await requireUserId();
  let q = fromExtended("enhanced_diary_entries").select("*").eq("user_id", userId);
  if (startDate) q = q.gte("entry_date", isoDate(startDate));
  if (endDate) q = q.lte("entry_date", isoDate(endDate));
  const { data, error } = await q.order("entry_date", { ascending: false }).limit(365);
  if (error) throw error;
  return (data ?? []) as unknown as EnhancedDiaryEntry[];
}

export async function searchDiaryEntries(searchQuery: string): Promise<EnhancedDiaryEntry[]> {
  const userId = await requireUserId();
  const q = searchQuery.trim();
  if (!q) return [];

  const escapedQ = q.replace(/%/g, "\\%").replace(/_/g, "\\_");
  const { data: hits, error: hitErr } = await fromExtended("diary_search_index")
    .select("entry_id, entry_date")
    .eq("user_id", userId)
    .ilike("searchable_text", `%${escapedQ}%`)
    .order("entry_date", { ascending: false })
    .limit(100);
  if (hitErr) throw hitErr;
  const ids = ((hits ?? []) as Array<{ entry_id: string }>).map(h => h.entry_id).filter(Boolean);
  if (ids.length === 0) return [];

  const { data: entries, error } = await fromExtended("enhanced_diary_entries")
    .select("*")
    .in("id", ids)
    .eq("user_id", userId)
    .order("entry_date", { ascending: false });
  if (error) throw error;
  return (entries ?? []) as unknown as EnhancedDiaryEntry[];
}

export async function getDiaryTemplates(
  category?: DiaryTemplate["category"],
): Promise<DiaryTemplate[]> {
  const userId = await requireUserId();
  let q = fromExtended("diary_templates")
    .select("*")
    .or(`user_id.eq.${userId},user_id.is.null,is_shared.eq.true`);
  if (category) q = q.eq("category", category);
  const { data, error } = await q
    .order("is_default", { ascending: false })
    .order("usage_count", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(200);
  if (error) throw error;
  return (data ?? []) as unknown as DiaryTemplate[];
}

export async function createMedicationSchedule(
  medicationName: string,
  dosage: string,
  frequency: string,
  scheduleData: Partial<MedicationSchedule>,
): Promise<MedicationSchedule | null> {
  const userId = await requireUserId();

  const payload: JsonObject = {
    user_id: userId,
    medication_name: medicationName,
    dosage,
    frequency,
    times_per_day:
      scheduleData.times_per_day ??
      (scheduleData.specific_times ? scheduleData.specific_times.length : null),
    specific_times: scheduleData.specific_times ?? null,
    days_of_week: scheduleData.days_of_week ?? null,
    start_date: scheduleData.start_date ? isoDate(scheduleData.start_date) : null,
    end_date: scheduleData.end_date ? isoDate(scheduleData.end_date) : null,
    is_active: scheduleData.is_active ?? true,
    reminder_enabled: scheduleData.reminder_enabled ?? true,
    reminder_minutes_before: scheduleData.reminder_minutes_before ?? 15,
    total_doses: scheduleData.total_doses ?? 0,
    missed_doses: scheduleData.missed_doses ?? 0,
    adherence_percentage: scheduleData.adherence_percentage ?? null,
    notes: scheduleData.notes ?? null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await fromExtended("medication_schedules")
    .insert(payload)
    .select("*")
    .single();
  if (error) throw error;
  return (data ?? null) as unknown as MedicationSchedule | null;
}

export async function logMedicationTaken(
  scheduleId: string,
  takenAt: string,
  wasOnTime: boolean = true,
): Promise<boolean> {
  const userId = await requireUserId();
  const { data: schedule, error: scheduleErr } = await fromExtended("medication_schedules")
    .select("*")
    .eq("id", scheduleId)
    .eq("user_id", userId)
    .single();
  if (scheduleErr) throw scheduleErr;

  const scheduleRow = schedule as Record<string, unknown>;
  const { error: logErr } = await fromExtended("medication_log").insert({
    schedule_id: scheduleId,
    user_id: userId,
    medication_name: scheduleRow.medication_name,
    dosage: scheduleRow.dosage,
    taken_at: takenAt,
    scheduled_time: null,
    was_on_time: wasOnTime,
    was_missed: false,
    notes: null,
  });
  if (logErr) throw logErr;

  const total = Number(scheduleRow.total_doses ?? 0) + 1;
  const missed = Number(scheduleRow.missed_doses ?? 0);
  const adherence = total > 0 ? ((total - missed) / total) * 100 : null;

  const { error: updErr } = await fromExtended("medication_schedules")
    .update({
      total_doses: total,
      missed_doses: missed,
      adherence_percentage: adherence != null ? Number(adherence.toFixed(2)) : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", scheduleId)
    .eq("user_id", userId);
  if (updErr) throw updErr;

  return true;
}

export async function generateDiaryAnalytics(
  startDate: string,
  endDate: string,
): Promise<DiaryAnalytics | null> {
  const userId = await requireUserId();
  const start = isoDate(startDate);
  const end = isoDate(endDate);

  const { data: entries, error } = await fromExtended("enhanced_diary_entries")
    .select("*")
    .eq("user_id", userId)
    .gte("entry_date", start)
    .lte("entry_date", end)
    .order("entry_date", { ascending: true })
    .limit(400);
  if (error) throw error;
  const rows = (entries ?? []) as unknown[] as EnhancedDiaryEntry[];
  if (rows.length === 0) return null;

  const sum = (arr: Array<number | null | undefined>) =>
    arr.reduce((s, n) => s + (Number.isFinite(Number(n)) ? Number(n) : 0), 0);
  const avg = (arr: Array<number | null | undefined>) => {
    const nums = arr
      .map(n => (Number.isFinite(Number(n)) ? Number(n) : null))
      .filter((n): n is number => n != null);
    return nums.length ? sum(nums) / nums.length : null;
  };

  const totalEntries = rows.length;
  const withSymptoms = rows.filter(r => (r.symptom_count ?? 0) > 0).length;
  const withMeds = rows.filter(r => (r.medication_count ?? 0) > 0).length;
  const withPhotos = rows.filter(r => (r.photo_count ?? 0) > 0).length;
  const withVoice = rows.filter(r => (r.voice_note_count ?? 0) > 0).length;

  const moodAvg = avg(rows.map(r => r.mood_score));
  const energyAvg = avg(rows.map(r => r.energy_level));
  const sleepHoursAvg = avg(rows.map(r => r.sleep_hours));
  const sleepQualityAvg = avg(rows.map(r => r.sleep_quality));

  const totalCalories = sum(rows.map(r => r.total_calories));
  const totalWater = sum(rows.map(r => r.water_intake_ml));
  const totalExercise = sum(rows.map(r => r.total_exercise_minutes));

  const symptomFreq = new Map<string, number>();
  for (const r of rows) {
    for (const s of (r.symptoms ?? []) as Array<JsonObject>) {
      const name = String(s.symptom ?? s.name ?? "").trim();
      if (!name) continue;
      symptomFreq.set(name, (symptomFreq.get(name) ?? 0) + 1);
    }
  }
  const mostCommonSymptoms = Array.from(symptomFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([symptom, frequency]) => ({ symptom, frequency }));

  const moodFreq = new Map<string, number>();
  for (const r of rows) {
    if (!r.mood_label) continue;
    moodFreq.set(r.mood_label, (moodFreq.get(r.mood_label) ?? 0) + 1);
  }
  const mostCommonMoods = Array.from(moodFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([m]) => m)
    .slice(0, 5);

  const moodSeries = rows
    .map(r => (r.mood_score == null ? null : Number(r.mood_score)))
    .filter((n): n is number => n != null);
  const moodTrend: DiaryAnalytics["mood_trend"] =
    moodSeries.length >= 4
      ? moodSeries[moodSeries.length - 1] - moodSeries[0] > 1
        ? "improving"
        : moodSeries[moodSeries.length - 1] - moodSeries[0] < -1
          ? "declining"
          : "stable"
      : null;

  const activity_patterns = {
    by_day_of_week: rows.reduce((acc: Record<string, number>, r) => {
      const d = new Date(r.entry_date).getDay().toString();
      acc[d] = (acc[d] ?? 0) + 1;
      return acc;
    }, {}),
  };

  const insights: string[] = [];
  const recommendations: string[] = [];

  if (moodAvg != null) insights.push(`Average mood score: ${moodAvg.toFixed(1)}/10.`);
  if (energyAvg != null) insights.push(`Average energy level: ${energyAvg.toFixed(1)}/10.`);
  if (sleepHoursAvg != null)
    insights.push(`Average sleep duration: ${sleepHoursAvg.toFixed(1)} hours.`);
  if (mostCommonSymptoms.length)
    insights.push(`Most common symptom: ${mostCommonSymptoms[0].symptom}.`);
  if (moodTrend === "declining")
    recommendations.push(
      "Consider adjusting intensity and prioritizing sleep/recovery during low-mood periods.",
    );
  if (totalWater > 0 && totalEntries > 0 && totalWater / totalEntries < 1200)
    recommendations.push(
      "Hydration looks low on average; consider setting a water target and reminders.",
    );

  const { data: created, error: insertErr } = await fromExtended("diary_analytics")
    .insert({
      user_id: userId,
      analysis_period_start: start,
      analysis_period_end: end,
      total_entries: totalEntries,
      entries_with_symptoms: withSymptoms,
      entries_with_medications: withMeds,
      entries_with_photos: withPhotos,
      entries_with_voice_notes: withVoice,
      average_mood_score: moodAvg != null ? Number(moodAvg.toFixed(2)) : null,
      average_energy_level: energyAvg != null ? Number(energyAvg.toFixed(2)) : null,
      average_sleep_hours: sleepHoursAvg != null ? Number(sleepHoursAvg.toFixed(2)) : null,
      average_sleep_quality: sleepQualityAvg != null ? Number(sleepQualityAvg.toFixed(2)) : null,
      total_calories: totalCalories || null,
      total_water_intake_ml: totalWater || null,
      total_exercise_minutes: totalExercise || null,
      most_common_symptoms: mostCommonSymptoms,
      most_common_moods: mostCommonMoods.length ? mostCommonMoods : null,
      activity_patterns,
      mood_trend: moodTrend,
      energy_trend: null,
      sleep_trend: null,
      insights: insights.length ? insights : null,
      recommendations: recommendations.length ? recommendations : null,
    })
    .select("*")
    .single();
  if (insertErr) throw insertErr;
  return (created ?? null) as unknown as DiaryAnalytics | null;
}
