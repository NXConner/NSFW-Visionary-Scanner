import { useEffect, useRef, useState, type ImgHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import {
  getEnabledFilters,
  loadSettings,
  shouldApplyVisualEffectsToUI,
} from "@/lib/visualEffectsSettings";

type ImgProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src: string;
  alt: string;
};

const MAX_CACHE_ENTRIES = 60;
const cache = new Map<string, string>();
const cacheOrder: string[] = [];

function stableSettingsKey(): string {
  // Avoid importing hashing libs; stringify a small stable subset.
  const settings = loadSettings();
  const enabled = getEnabledFilters();
  return JSON.stringify({ scope: settings.scope, enabled });
}

function isFilterableSrc(src: string): boolean {
  return src.startsWith("data:") || src.startsWith("blob:") || src.startsWith("http:");
}

function isRemoteHttpSrc(src: string): boolean {
  return src.startsWith("http:");
}

async function tryFetchToDataUrl(src: string): Promise<string | null> {
  try {
    // This will only succeed if the origin allows CORS. If it fails, we safely fall back.
    const res = await fetch(src, { mode: "cors", credentials: "omit" });
    if (!res.ok) return null;
    const blob = await res.blob();
    if (!blob || !blob.type.startsWith("image/")) return null;

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("Failed to read image blob"));
      reader.readAsDataURL(blob);
    });
    return dataUrl || null;
  } catch {
    return null;
  }
}

function cacheGet(key: string): string | null {
  return cache.get(key) ?? null;
}

function cacheSet(key: string, value: string): void {
  if (cache.has(key)) return;
  cache.set(key, value);
  cacheOrder.push(key);
  while (cacheOrder.length > MAX_CACHE_ENTRIES) {
    const oldest = cacheOrder.shift();
    if (oldest) cache.delete(oldest);
  }
}

export function FilteredImage(props: ImgProps) {
  const { src, alt, className, ...rest } = props;
  const [renderSrc, setRenderSrc] = useState<string>(src);
  const [settingsKey, setSettingsKey] = useState<string>(() => stableSettingsKey());
  const inflightKeyRef = useRef<string | null>(null);

  useEffect(() => {
    // Recompute a new settings key when the settings change.
    const onChanged = () => {
      setSettingsKey(stableSettingsKey());
      setRenderSrc(src);
    };
    window.addEventListener("visual-effects-changed", onChanged as EventListener);
    return () => window.removeEventListener("visual-effects-changed", onChanged as EventListener);
  }, [src]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      // Fast-path: no UI scope or no enabled filters.
      if (!shouldApplyVisualEffectsToUI() || getEnabledFilters().length === 0) {
        setRenderSrc(src);
        return;
      }

      // If src is remote, we attempt a CORS fetch → data URL so canvas processing is allowed.
      // If the fetch fails, fall back to rendering the original src unmodified.
      let filterInputSrc = src;
      if (!isFilterableSrc(src)) {
        setRenderSrc(src);
        return;
      }
      if (isRemoteHttpSrc(src)) {
        const fetched = await tryFetchToDataUrl(src);
        if (!fetched) {
          setRenderSrc(src);
          return;
        }
        filterInputSrc = fetched;
      }

      const key = `${stableSettingsKey()}::${src}`;
      inflightKeyRef.current = key;

      const cached = cacheGet(key);
      if (cached) {
        setRenderSrc(cached);
        return;
      }

      try {
        const { applyVisualEffectsToDataURL } = await import("@/lib/applyVisualEffects");
        const out = await applyVisualEffectsToDataURL(filterInputSrc);
        if (cancelled) return;
        if (inflightKeyRef.current !== key) return;
        cacheSet(key, out);
        setRenderSrc(out);
      } catch {
        if (!cancelled) setRenderSrc(src);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [settingsKey, src]);

  return (
    <img
      {...rest}
      src={renderSrc}
      alt={alt}
      className={cn(className)}
      crossOrigin={rest.crossOrigin ?? "anonymous"}
    />
  );
}
