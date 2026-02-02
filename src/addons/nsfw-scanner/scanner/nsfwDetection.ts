// TensorFlow.js will be loaded dynamically when needed
import type { NsfwDetectionResult, NsfwLabel } from "./types";

type NsfwJsModule = {
  load: (
    modelUrl?: string,
    options?: Record<string, unknown>,
  ) => Promise<{
    classify: (
      img: any,
      topk?: number,
    ) => Promise<Array<{ className: string; probability: number }>>;
  }>;
};

let modelPromise: Promise<{
  classify: (img: any, topk?: number) => Promise<Array<{ className: string; probability: number }>>;
}> | null = null;

type NsfwModelSource = { kind: "env" | "local" | "default"; url?: string };

const dynamicImport: (specifier: string) => Promise<unknown> = (() => {
  try {
    // Avoid Vite/Vitest static import analysis by using Function.
    return new Function("s", "return import(s)") as (s: string) => Promise<unknown>;
  } catch {
    return async () => {
      throw new Error("Dynamic import unavailable");
    };
  }
})();

function envModelUrl(): string | null {
  try {
    const v = (import.meta as any)?.env?.VITE_NSFW_MODEL_URL;
    const s = typeof v === "string" ? v.trim() : "";
    return s ? s : null;
  } catch {
    return null;
  }
}

let localModelProbe: Promise<boolean> | null = null;
async function hasLocalBundledModel(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (!localModelProbe) {
    localModelProbe = (async () => {
      try {
        const resp = await fetch("/models/nsfwjs/model.json", {
          method: "HEAD",
          cache: "force-cache",
        });
        return resp.ok;
      } catch {
        return false;
      }
    })();
  }
  return localModelProbe;
}

async function resolveModelSource(): Promise<NsfwModelSource> {
  const envUrl = envModelUrl();
  if (envUrl) return { kind: "env", url: envUrl };
  if (await hasLocalBundledModel()) return { kind: "local", url: "/models/nsfwjs/model.json" };
  return { kind: "default" };
}

async function loadModel(): Promise<{
  classify: (img: any, topk?: number) => Promise<Array<{ className: string; probability: number }>>;
}> {
  if (!modelPromise) {
    modelPromise = (async () => {
      // Load TensorFlow.js dynamically
      await dynamicImport("@tensorflow/tfjs").catch(() => {
        throw new Error("TensorFlow.js unavailable");
      });

      // Optional dependency: if `nsfwjs` (or a compatible module) is not available in this environment,
      // we degrade gracefully to "unknown" detections.
      const mod = (await dynamicImport("nsfwjs").catch(
        () => null,
      )) as unknown as NsfwJsModule | null;
      if (!mod?.load) {
        throw new Error("NSFW model unavailable");
      }
      const src = await resolveModelSource();
      if (src.kind === "env" || src.kind === "local") {
        return await mod.load(src.url);
      }
      return await mod.load();
    })();
  }
  return modelPromise;
}

function mapLabel(
  raw: Record<string, number>,
  explicitThreshold: number,
  suggestiveThreshold: number,
) {
  // nsfwjs labels: "Porn", "Sexy", "Hentai", "Neutral", "Drawing"
  const porn = raw.Porn ?? 0;
  const hentai = raw.Hentai ?? 0;
  const sexy = raw.Sexy ?? 0;
  const neutral = raw.Neutral ?? 0;
  const drawing = raw.Drawing ?? 0;

  const explicitScore = Math.max(porn, hentai);
  const suggestiveScore = sexy;
  const neutralScore = Math.max(neutral, drawing);

  let label: NsfwLabel = "unknown";
  let confidence = 0;

  if (explicitScore >= explicitThreshold) {
    label = "explicit";
    confidence = explicitScore;
  } else if (suggestiveScore >= suggestiveThreshold) {
    label = "suggestive";
    confidence = suggestiveScore;
  } else if (neutralScore > 0) {
    label = "neutral";
    confidence = neutralScore;
  }

  return { label, confidence };
}

async function imageFromDataUrl(dataUrl: string): Promise<HTMLImageElement> {
  const img = new Image();
  img.decoding = "async";
  img.loading = "eager";
  img.referrerPolicy = "no-referrer";
  img.src = dataUrl;
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Failed to load image for NSFW detection"));
  });
  return img;
}

export type NsfwModelSelfTestResult = {
  ok: boolean;
  model: "nsfwjs";
  source: "env" | "local" | "default";
  modelUrl?: string;
  loadMs?: number;
  inferenceMs?: number;
  label?: NsfwLabel;
  confidence?: number;
  error?: string;
};

export async function runNsfwModelSelfTest(): Promise<NsfwModelSelfTestResult> {
  const started = performance.now();
  try {
    const src = await resolveModelSource();
    const model = await loadModel();
    const loadMs = Math.max(0, performance.now() - started);
    const img = await imageFromDataUrl(
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMB/yoCk9cAAAAASUVORK5CYII=",
    );
    const t0 = performance.now();
    const predictions = await model.classify(img, 3);
    const inferenceMs = Math.max(0, performance.now() - t0);
    const raw: Record<string, number> = {};
    for (const p of predictions) raw[String(p.className)] = Number(p.probability) || 0;
    const mapped = mapLabel(raw, 0.7, 0.7);
    return {
      ok: true,
      model: "nsfwjs",
      source: src.kind,
      modelUrl: src.url,
      loadMs,
      inferenceMs,
      label: mapped.label,
      confidence: mapped.confidence,
    };
  } catch (e) {
    const src = await resolveModelSource().catch(() => ({ kind: "default" as const }));
    return {
      ok: false,
      model: "nsfwjs",
      source: src.kind,
      modelUrl: (src as any).url,
      error: e instanceof Error ? e.message : "Unknown error",
    };
  }
}

export async function detectNsfwFromDataUrl(
  dataUrl: string,
  opts: { explicitThreshold: number; suggestiveThreshold: number },
): Promise<NsfwDetectionResult> {
  try {
    const model = await loadModel();
    const img = await imageFromDataUrl(dataUrl);
    const predictions = await model.classify(img, 3);
    const raw: Record<string, number> = {};
    for (const p of predictions) {
      raw[String(p.className)] = Number(p.probability) || 0;
    }
    const mapped = mapLabel(raw, opts.explicitThreshold, opts.suggestiveThreshold);
    return { model: "nsfwjs", raw, ...mapped };
  } catch {
    return { model: "nsfwjs", label: "unknown", confidence: 0, raw: {} };
  }
}
