import { toast } from "sonner";
import { logger } from "@/lib/logger";
import type { HealthRiskScore, RiskFactor, ScanRow } from "./types";
import { fetchScansInRange } from "./metrics";

// Local storage key for risk scores
const RISK_SCORES_KEY = "health_risk_scores";

function getStoredRiskScores(): HealthRiskScore[] {
  try {
    const stored = localStorage.getItem(RISK_SCORES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveRiskScoresToStorage(scores: HealthRiskScore[]): void {
  try {
    localStorage.setItem(RISK_SCORES_KEY, JSON.stringify(scores));
  } catch {
    // ignore
  }
}

function clampScore(score: number): number {
  if (!Number.isFinite(score)) return 0;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function riskLevelFromScore(score: number): HealthRiskScore["risk_level"] {
  if (score < 20) return "low";
  if (score < 45) return "moderate";
  if (score < 70) return "elevated";
  return "high";
}

function summarizeTrend(scans: ScanRow[]): HealthRiskScore["trend"] {
  if (scans.length < 4) return "stable";
  const recent = scans.slice(-2);
  const prior = scans.slice(-4, -2);
  const score = (s: ScanRow) => {
    let v = 0;
    if (s.overall_health === "concerning") v += 30;
    else if (s.overall_health === "needs_attention") v += 20;
    else if (s.overall_health === "fair") v += 10;

    if (s.urgency === "urgent") v += 20;
    else if (s.urgency === "soon") v += 10;

    if (s.curvature_detected) v += 10;
    if (s.curvature_severity === "severe") v += 15;
    else if (s.curvature_severity === "moderate") v += 10;
    else if (s.curvature_severity === "mild") v += 5;

    return v;
  };
  const recentAvg = recent.reduce((a, s) => a + score(s), 0) / recent.length;
  const priorAvg = prior.reduce((a, s) => a + score(s), 0) / prior.length;
  const delta = recentAvg - priorAvg;
  if (delta < -5) return "improving";
  if (delta > 5) return "declining";
  return "stable";
}

function computeRisk(
  scans: ScanRow[],
  category: string,
): { score: number; factors: RiskFactor[]; recommendations: string[] } {
  const factors: RiskFactor[] = [];
  const recs: string[] = [];

  const latest = scans.length ? scans[scans.length - 1] : null;
  if (!latest) return { score: 0, factors, recommendations: recs };

  let score = 0;

  if (latest.overall_health === "concerning") {
    score += 35;
    factors.push({
      factor_name: "Overall health flagged as concerning",
      score: 35,
      weight: 1,
      status: "critical",
      description: "Latest scan indicates concerning overall health.",
    });
    recs.push("Consider consulting a healthcare professional based on your latest scan.");
  } else if (latest.overall_health === "needs_attention") {
    score += 20;
    factors.push({
      factor_name: "Overall health needs attention",
      score: 20,
      weight: 1,
      status: "warning",
      description: "Latest scan indicates some items need attention.",
    });
    recs.push("Review recommendations from your scan and monitor changes over time.");
  }

  if (latest.urgency === "urgent") {
    score += 25;
    factors.push({
      factor_name: "Urgent scan urgency",
      score: 25,
      weight: 1,
      status: "critical",
      description: "Latest scan marked as urgent.",
    });
    recs.push("If you have symptoms, seek medical advice promptly.");
  } else if (latest.urgency === "soon") {
    score += 10;
    factors.push({
      factor_name: "Soon scan urgency",
      score: 10,
      weight: 1,
      status: "warning",
      description: "Latest scan suggests follow-up soon.",
    });
  }

  if (category === "peyronies" || category === "overall" || category === "general_sexual_health") {
    if (latest.curvature_detected) {
      const add =
        latest.curvature_severity === "severe"
          ? 25
          : latest.curvature_severity === "moderate"
            ? 18
            : 10;
      score += add;
      factors.push({
        factor_name: "Curvature detected",
        score: add,
        weight: 1,
        status: latest.curvature_severity === "severe" ? "critical" : "warning",
        description: "Curvature flags were detected in your scan.",
      });
      recs.push("Track curvature over time and consult a clinician if it worsens or causes pain.");
    }
  }

  if (Array.isArray(latest.conditions) && latest.conditions.length > 0) {
    const add = Math.min(20, latest.conditions.length * 5);
    score += add;
    factors.push({
      factor_name: "Conditions detected",
      score: add,
      weight: 1,
      status: add >= 15 ? "critical" : "warning",
      description: "Conditions were detected in scan analysis.",
    });
    recs.push("Review condition details in your scan analysis and follow recommendations.");
  }

  if (Array.isArray(latest.recommendations) && latest.recommendations.length > 0) {
    latest.recommendations.slice(0, 5).forEach(r => {
      if (typeof r === "string" && r.trim()) recs.push(r.trim());
    });
  }

  return {
    score: clampScore(score),
    factors,
    recommendations: Array.from(new Set(recs)).slice(0, 10),
  };
}

export async function calculateHealthRiskScore(
  riskCategory: string = "overall",
): Promise<HealthRiskScore | null> {
  try {
    toast.info("Calculating risk score...");

    const scans = await fetchScansInRange({
      start_date: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
      end_date: new Date().toISOString(),
      preset: "custom",
    });

    const { score, factors, recommendations } = computeRisk(scans, riskCategory);
    if (scans.length === 0) {
      toast.error("Not enough scan data to calculate risk score yet.");
      return null;
    }

    const risk_level = riskLevelFromScore(score);
    const trend = summarizeTrend(scans);

    const riskScore: HealthRiskScore = {
      id: crypto.randomUUID(),
      user_id: "local",
      risk_category: riskCategory,
      overall_risk_score: score,
      risk_level,
      risk_factors: factors,
      recommendations,
      trend,
      created_at: new Date().toISOString(),
    };

    // Store locally
    const scores = getStoredRiskScores();
    scores.unshift(riskScore);
    saveRiskScoresToStorage(scores.slice(0, 50)); // Keep last 50

    toast.success("Risk score calculated");
    return riskScore;
  } catch (error) {
    logger.error("calculateHealthRiskScore error", { error });
    toast.error("Risk score calculation failed");
    return null;
  }
}

export async function getHealthRiskHistory(): Promise<HealthRiskScore[]> {
  try {
    return getStoredRiskScores();
  } catch (error) {
    logger.error("getHealthRiskHistory error", { error });
    return [];
  }
}
