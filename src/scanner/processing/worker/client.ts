import type { Calibration, MeasurementResult, ScanInputs } from "@/scanner/measurement/types";
import type { ProcessingOptions } from "@/scanner/processing/types";
import type { WorkerRequest, WorkerResponse, WorkerResponseError } from "./protocol";
import { blobToDataUrl, dataUrlToBlob } from "@/scanner/utils/image";

type Pending = {
  resolve: (value: MeasurementResult) => void;
  reject: (err: Error) => void;
  timeoutId: number | null;
};

let workerSingleton: Worker | null = null;
let pending: Map<string, Pending> | null = null;

function canUseWorker(): boolean {
  return typeof Worker !== "undefined";
}

function ensureWorker(): Worker {
  if (workerSingleton) return workerSingleton;
  const w = new Worker(new URL("./scannerWorker.ts", import.meta.url), { type: "module" });
  workerSingleton = w;
  pending = new Map();

  w.onmessage = async (ev: MessageEvent<WorkerResponse>) => {
    const msg = ev.data;
    if (!msg || typeof msg !== "object" || typeof (msg as any).id !== "string") return;
    const id = msg.id;
    const p = pending?.get(id);
    if (!p) return;
    pending?.delete(id);
    if (p.timeoutId) window.clearTimeout(p.timeoutId);

    if (!msg.ok) {
      const errMsg = (msg as WorkerResponseError).error?.message || "Worker failed";
      p.reject(new Error(errMsg));
      return;
    }

    if (msg.kind !== "measure") {
      p.reject(new Error("Worker returned unexpected response"));
      return;
    }

    const annotatedBlob = new Blob([msg.annotated.bytes], {
      type: msg.annotated.mimeType || "image/jpeg",
    });
    const annotatedImageDataUrl = await blobToDataUrl(annotatedBlob);

    p.resolve({
      ...msg.result,
      annotatedImageDataUrl,
    });
  };

  w.onerror = e => {
    // Fail all pending requests.
    const err = new Error(e?.message || "Worker error");
    for (const [, p] of pending ?? []) {
      if (p.timeoutId) window.clearTimeout(p.timeoutId);
      p.reject(err);
    }
    pending?.clear();
  };

  return w;
}

function makeId(): string {
  // Not crypto-critical.
  return `${Date.now().toString(36)}-${Math.random().toString(16).slice(2)}`;
}

export async function measureImageInWorker(
  input: ScanInputs,
  opts: ProcessingOptions = {},
  cfg: { timeoutMs?: number } = {},
): Promise<MeasurementResult | null> {
  if (!canUseWorker()) return null;
  if (!input?.imageDataUrl) return null;

  const timeoutMs = Math.max(1000, Math.min(45000, Number(cfg.timeoutMs ?? 15000)));
  const w = ensureWorker();
  const id = makeId();

  // Prefer bytes transfer to avoid base64 work inside the worker.
  const blob = await dataUrlToBlob(input.imageDataUrl);
  return await measureBlobInWorker(blob, input.calibration, opts, cfg);
}

export async function measureBlobInWorker(
  blob: Blob,
  calibration: Calibration | undefined,
  opts: ProcessingOptions = {},
  cfg: { timeoutMs?: number } = {},
): Promise<MeasurementResult | null> {
  if (!canUseWorker()) return null;

  const timeoutMs = Math.max(1000, Math.min(45000, Number(cfg.timeoutMs ?? 15000)));
  const w = ensureWorker();
  const id = makeId();

  const bytes = await blob.arrayBuffer();
  const mimeType = blob.type || "image/jpeg";

  const req: WorkerRequest = {
    id,
    kind: "measure",
    image: { bytes, mimeType },
    calibration,
    opts,
  };

  return await new Promise<MeasurementResult>((resolve, reject) => {
    const timeoutId =
      typeof window !== "undefined"
        ? window.setTimeout(() => {
            pending?.delete(id);
            reject(new Error("Scanner worker timed out"));
          }, timeoutMs)
        : null;

    pending?.set(id, { resolve, reject, timeoutId });
    w.postMessage(req, [bytes]);
  });
}
