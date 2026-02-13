import type { AddonId, AddonModule, AddonManifest, AddonContributions } from "./types";

type AddonState = {
  module: AddonModule;
  manifest: AddonManifest;
  contributions?: AddonContributions;
  runtime: {
    status: "discovered" | "registering" | "ready" | "failed";
    lastError?: string | null;
    updatedAt: string;
  };
};

const addonMap = new Map<AddonId, AddonState>();

function notify(): void {
  try {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent("addons-changed"));
  } catch {
    // ignore
  }
}

export function registerAddonModule(mod: AddonModule): void {
  const id = String(mod?.manifest?.id || "").trim();
  if (!id) throw new Error("Addon module missing manifest.id");
  if (addonMap.has(id)) return; // idempotent
  addonMap.set(id, {
    module: mod,
    manifest: mod.manifest,
    runtime: { status: "discovered", lastError: null, updatedAt: new Date().toISOString() },
  });
  notify();
}

export function listAddons(): AddonManifest[] {
  return Array.from(addonMap.values())
    .map(s => s.manifest)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getAddon(id: AddonId): AddonState | undefined {
  return addonMap.get(id);
}

export function setAddonContributions(id: AddonId, contributions?: AddonContributions): void {
  const st = addonMap.get(id);
  if (!st) return;
  st.contributions = contributions;
  st.runtime = { ...st.runtime, status: "ready", lastError: null, updatedAt: new Date().toISOString() };
  notify();
}

export function listAddonContributions(): AddonContributions[] {
  return Array.from(addonMap.values())
    .map(s => s.contributions)
    .filter((c): c is AddonContributions => Boolean(c));
}

export function setAddonRuntimeStatus(
  id: AddonId,
  patch: Partial<AddonState["runtime"]>,
): void {
  const st = addonMap.get(id);
  if (!st) return;
  st.runtime = { ...st.runtime, ...patch, updatedAt: new Date().toISOString() };
  notify();
}

export function listAddonStates(): Array<{
  manifest: AddonManifest;
  runtime: AddonState["runtime"];
  hasContributions: boolean;
}> {
  return Array.from(addonMap.values())
    .map(s => ({ manifest: s.manifest, runtime: s.runtime, hasContributions: Boolean(s.contributions) }))
    .sort((a, b) => a.manifest.name.localeCompare(b.manifest.name));
}

