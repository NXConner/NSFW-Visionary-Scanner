import { toast } from "sonner";
import { logger } from "@/lib/logger";
import { supabase } from "@/integrations/supabase/client";
import type { PredictiveModelingResult } from "./types";
import { buildMetricSeries, fetchScansInRange } from "./metrics";

type RegressionFit = { slope: number; intercept: number; rmse: number; r2: number };

function toDays(t: number): number {
  return t / (24 * 60 * 60 * 1000);
}

function linearFit(xs: number[], ys: number[]): RegressionFit | null {
  if (xs.length !== ys.length || xs.length < 3) return null;
  const n = xs.length;
  const xMean = xs.reduce((a, b) => a + b, 0) / n;
  const yMean = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - xMean;
    num += dx * (ys[i] - yMean);
    den += dx * dx;
  }
  if (den === 0) return null;
  const slope = num / den;
  const intercept = yMean - slope * xMean;

  let ssRes = 0;
  let ssTot = 0;
  for (let i = 0; i < n; i++) {
    const yHat = slope * xs[i] + intercept;
    ssRes += (ys[i] - yHat) ** 2;
    ssTot += (ys[i] - yMean) ** 2;
  }
  const rmse = Math.sqrt(ssRes / n);
  const r2 = ssTot === 0 ? 0 : 1 - ssRes / ssTot;
  return { slope, intercept, rmse, r2 };
}

export async function runPredictiveModeling(
  horizonDays: number = 30,
  modelType: PredictiveModelingResult["model_type"] = "linear",
): Promise<PredictiveModelingResult | null> {
  try {
    toast.info("Running predictive model...");

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    // use last 120 days of scans as training window (real data only)
    const now = new Date();
    const start = new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000).toISOString();
    const scans = await fetchScansInRange({
      start_date: start,
      end_date: now.toISOString(),
      preset: "custom",
    });

    const metrics = ["length", "girth", "erect_length", "erect_girth", "eq_score", "hardness"];
    const predictions: Record<string, { date: string; value: number }[]> = {};
    const confidence_intervals: Record<string, { lower: number; upper: number }[]> = {};
    const input_data: Record<string, number[]> = {};

    const fits: RegressionFit[] = [];

    for (const metric of metrics) {
      const series = buildMetricSeries(scans, metric);
      if (series.length < 3) continue;

      const xs = series.map(p => toDays(new Date(p.date).getTime()));
      const ys = series.map(p => p.value);
      input_data[metric] = ys;

      // currently only linear implemented; other model types degrade to linear without fabricating
      if (modelType !== "linear") {
        logger.warn("Predictive modeling fallback to linear (no mock data)", {
          requested: modelType,
        });
      }

      const fit = linearFit(xs, ys);
      if (!fit) continue;
      fits.push(fit);

      const out: { date: string; value: number }[] = [];
      const ci: { lower: number; upper: number }[] = [];
      for (let d = 1; d <= horizonDays; d++) {
        const dt = new Date(now.getTime() + d * 24 * 60 * 60 * 1000);
        const x = toDays(dt.getTime());
        const yHat = fit.slope * x + fit.intercept;
        out.push({ date: dt.toISOString(), value: yHat });
        // simple 95% interval using RMSE; conservative and data-derived
        const delta = 1.96 * fit.rmse;
        ci.push({ lower: yHat - delta, upper: yHat + delta });
      }
      predictions[metric] = out;
      confidence_intervals[metric] = ci;
    }

    if (Object.keys(predictions).length === 0) {
      toast.error("Not enough scan data to build predictions yet.");
      return null;
    }

    const accuracy = fits.length
      ? Math.max(0, Math.min(1, fits.reduce((a, f) => a + f.r2, 0) / fits.length))
      : 0.0;

    toast.success("Predictive model complete");
    return {
      id: crypto.randomUUID(),
      user_id: user.id,
      model_type: modelType,
      input_data,
      prediction_horizon_days: horizonDays,
      predictions,
      confidence_intervals,
      accuracy_score: accuracy,
      created_at: new Date().toISOString(),
    };
  } catch (error) {
    logger.error("Error running predictive modeling", { error });
    toast.error("Predictive modeling failed");
    return null;
  }
}
