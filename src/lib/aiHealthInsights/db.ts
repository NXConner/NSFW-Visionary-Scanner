import { supabase } from "@/integrations/supabase/client";

export interface DailyInsight {
  id: string;
  user_id: string;
  insight_date: string;
  insight_type: "pattern" | "prediction" | "recommendation" | "warning" | "celebration";
  title: string;
  content: string;
  category: "prostate" | "testicular" | "sexual" | "urinary" | "general" | "routine";
  confidence: number;
  actionable: boolean;
  action_items: string[];
  is_read: boolean;
  created_at: string;
}

export interface HealthPattern {
  pattern_type: string;
  description: string;
  confidence: number;
  affected_metrics: string[];
  timeframe: string;
  recommendation: string;
}

export interface HealthPrediction {
  metric: string;
  current_value: number;
  predicted_value: number;
  timeframe: string;
  confidence: number;
  factors: string[];
}

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("Not authenticated");
  return data.user.id;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

export async function getDailyInsights(date?: string): Promise<DailyInsight[]> {
  const userId = await requireUserId();
  const day = (date ?? today()).slice(0, 10);
  const { data, error } = await supabase

    .from("daily_health_insights" as any)
    .select("*")
    .eq("user_id", userId)
    .eq("insight_date", day)
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw error;
  return (data ?? []) as unknown as DailyInsight[];
}

export async function generateDailyInsights(): Promise<boolean> {
  const userId = await requireUserId();
  const { error } = await supabase.functions.invoke("generate-health-insights", {
    body: { user_id: userId },
  });
  if (error) throw error;
  return true;
}

export async function markInsightRead(insightId: string): Promise<boolean> {
  const userId = await requireUserId();
  const { error } = await supabase

    .from("daily_health_insights" as any)
    .update({ is_read: true })
    .eq("id", insightId)
    .eq("user_id", userId);
  if (error) throw error;
  return true;
}

export async function getHealthPatterns(): Promise<HealthPattern[]> {
  const userId = await requireUserId();
  // Use edge function to generate + refresh cache.
  const { data, error } = await supabase.functions.invoke("analyze-health-patterns", {
    body: { user_id: userId },
  });
  if (error) throw error;
  return (data?.patterns ?? []) as HealthPattern[];
}

export async function getHealthPredictions(
  timeframe: "1_month" | "3_months" | "6_months" | "1_year" = "6_months",
): Promise<HealthPrediction[]> {
  const userId = await requireUserId();
  const { data, error } = await supabase.functions.invoke("predict-health-trends", {
    body: { user_id: userId, timeframe },
  });
  if (error) throw error;
  return (data?.predictions ?? []) as HealthPrediction[];
}

export async function askAIAboutProgress(question: string): Promise<string | null> {
  const userId = await requireUserId();
  const { data, error } = await supabase.functions.invoke("ai-progress-analysis", {
    body: { user_id: userId, question },
  });
  if (error) throw error;
  return (data?.response as string | undefined) ?? null;
}
