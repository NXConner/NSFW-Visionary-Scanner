import {
  BUILD_ALLOW_ADULT_BUNDLE,
  BUILD_APP_VERSION,
  BUILD_DISTRIBUTION_CHANNEL,
} from "@/lib/buildFlags";
import type { AddonCompatibilityEntry, AddonCompatibilityStatus, AddonManifest } from "./types";

export const ADDON_MANIFEST_SCHEMA_VERSION = "1.1.0";

type Semver = {
  major: number;
  minor: number;
  patch: number;
  pre: string[];
};

export type AppRuntimeInfo = {
  appVersion: string;
  build: {
    appVersion: string;
    distribution: string;
    allowAdultBundle: boolean;
  };
};

export type AddonCompatibilityReport = {
  status: "compatible" | "warning" | "incompatible";
  label: AddonCompatibilityStatus;
  reasons: string[];
  matchedEntry?: AddonCompatibilityEntry;
};

const STATUS_SEVERITY: Record<AddonCompatibilityStatus, number> = {
  supported: 0,
  experimental: 1,
  deprecated: 2,
  blocked: 3,
  unsupported: 3,
};

function normalizeVersion(input?: string): string {
  if (!input) return "0.0.0";
  const trimmed = input.trim();
  if (!trimmed) return "0.0.0";
  return trimmed.startsWith("v") ? trimmed.slice(1) : trimmed;
}

function parseSemver(input: string): Semver | null {
  const clean = normalizeVersion(input).split("+")[0] || "";
  const [core, preRaw] = clean.split("-");
  const [majorRaw, minorRaw, patchRaw] = core.split(".");
  const major = Number(majorRaw ?? "0");
  const minor = Number(minorRaw ?? "0");
  const patch = Number(patchRaw ?? "0");
  if (Number.isNaN(major) || Number.isNaN(minor) || Number.isNaN(patch)) return null;
  const pre = preRaw ? preRaw.split(".").filter(Boolean) : [];
  return { major, minor, patch, pre };
}

function compareIdentifiers(a: string, b: string): number {
  const aNum = Number(a);
  const bNum = Number(b);
  const aIsNum = !Number.isNaN(aNum);
  const bIsNum = !Number.isNaN(bNum);
  if (aIsNum && bIsNum) return aNum === bNum ? 0 : aNum > bNum ? 1 : -1;
  if (aIsNum && !bIsNum) return -1;
  if (!aIsNum && bIsNum) return 1;
  return a === b ? 0 : a > b ? 1 : -1;
}

function compareSemver(a: string, b: string): number | null {
  const av = parseSemver(a);
  const bv = parseSemver(b);
  if (!av || !bv) return null;
  if (av.major !== bv.major) return av.major > bv.major ? 1 : -1;
  if (av.minor !== bv.minor) return av.minor > bv.minor ? 1 : -1;
  if (av.patch !== bv.patch) return av.patch > bv.patch ? 1 : -1;
  if (av.pre.length === 0 && bv.pre.length === 0) return 0;
  if (av.pre.length === 0) return 1;
  if (bv.pre.length === 0) return -1;
  const max = Math.max(av.pre.length, bv.pre.length);
  for (let i = 0; i < max; i += 1) {
    const aId = av.pre[i];
    const bId = bv.pre[i];
    if (aId === undefined) return -1;
    if (bId === undefined) return 1;
    const cmp = compareIdentifiers(aId, bId);
    if (cmp !== 0) return cmp;
  }
  return 0;
}

function satisfiesRange(version: string, min?: string, max?: string): boolean | null {
  if (min) {
    const cmpMin = compareSemver(version, min);
    if (cmpMin === null) return null;
    if (cmpMin < 0) return false;
  }
  if (max) {
    const cmpMax = compareSemver(version, max);
    if (cmpMax === null) return null;
    if (cmpMax > 0) return false;
  }
  return true;
}

function entryMatchesBuild(entry: AddonCompatibilityEntry, runtime: AppRuntimeInfo): boolean {
  if (!entry.buildVariants || entry.buildVariants.length === 0) return true;
  return entry.buildVariants.some(variant => {
    if (variant.appVersion && variant.appVersion !== runtime.build.appVersion) return false;
    if (variant.distribution && variant.distribution !== runtime.build.distribution) return false;
    if (
      typeof variant.allowAdultBundle === "boolean" &&
      variant.allowAdultBundle !== runtime.build.allowAdultBundle
    ) {
      return false;
    }
    return true;
  });
}

function entryMatchesVersion(entry: AddonCompatibilityEntry, version: string): boolean | null {
  if (entry.appVersions && entry.appVersions.length > 0) {
    for (const v of entry.appVersions) {
      const cmp = compareSemver(version, v);
      if (cmp !== null && cmp === 0) return true;
    }
    return false;
  }
  return satisfiesRange(version, entry.minAppVersion, entry.maxAppVersion);
}

function resolveStatus(entries: AddonCompatibilityEntry[]): AddonCompatibilityStatus {
  let status: AddonCompatibilityStatus = "supported";
  for (const entry of entries) {
    const entryStatus = entry.status ?? "supported";
    if (STATUS_SEVERITY[entryStatus] > STATUS_SEVERITY[status]) {
      status = entryStatus;
    }
  }
  return status;
}

function mapStatusToReport(
  status: AddonCompatibilityStatus,
): "compatible" | "warning" | "incompatible" {
  if (status === "supported") return "compatible";
  if (status === "experimental" || status === "deprecated") return "warning";
  return "incompatible";
}

export function getAppRuntimeInfo(): AppRuntimeInfo {
  const raw =
    typeof __APP_VERSION__ !== "undefined" && typeof __APP_VERSION__ === "string"
      ? __APP_VERSION__
      : "0.0.0";
  return {
    appVersion: normalizeVersion(raw),
    build: {
      appVersion: String(BUILD_APP_VERSION || ""),
      distribution: String(BUILD_DISTRIBUTION_CHANNEL || ""),
      allowAdultBundle: Boolean(BUILD_ALLOW_ADULT_BUNDLE),
    },
  };
}

export function evaluateAddonCompatibility(
  manifest: AddonManifest,
  runtime: AppRuntimeInfo = getAppRuntimeInfo(),
): AddonCompatibilityReport {
  const reasons: string[] = [];
  const appVersion = normalizeVersion(runtime.appVersion);
  const parsed = parseSemver(appVersion);

  if (!parsed) {
    reasons.push(`Unparseable app version "${runtime.appVersion}"`);
  }

  if (manifest.manifestVersion !== ADDON_MANIFEST_SCHEMA_VERSION) {
    reasons.push(
      `Manifest schema mismatch (expected ${ADDON_MANIFEST_SCHEMA_VERSION}, got ${manifest.manifestVersion})`,
    );
  }

  if (manifest.minAppVersion) {
    const cmpMin = compareSemver(appVersion, manifest.minAppVersion);
    if (cmpMin === null) {
      reasons.push(`Invalid minAppVersion "${manifest.minAppVersion}"`);
    } else if (cmpMin < 0) {
      return {
        status: "incompatible",
        label: "unsupported",
        reasons: [...reasons, `Requires app >= ${manifest.minAppVersion} (current ${appVersion})`],
      };
    }
  }

  const entries = manifest.compatibility?.entries ?? [];
  if (entries.length === 0) {
    const label = manifest.minAppVersion ? "supported" : "unsupported";
    return {
      status: mapStatusToReport(label),
      label,
      reasons,
    };
  }

  const matches: AddonCompatibilityEntry[] = [];
  for (const entry of entries) {
    const versionMatch = entryMatchesVersion(entry, appVersion);
    if (versionMatch === false) continue;
    if (versionMatch === null) {
      reasons.push(`Invalid compatibility entry version range for ${manifest.id}`);
      continue;
    }
    if (!entryMatchesBuild(entry, runtime)) continue;
    matches.push(entry);
  }

  if (matches.length === 0) {
    const label = manifest.compatibility?.defaultStatus ?? "unsupported";
    return {
      status: mapStatusToReport(label),
      label,
      reasons: [
        ...reasons,
        `No compatibility entry matched app ${appVersion} (${runtime.build.appVersion}/${runtime.build.distribution})`,
      ],
    };
  }

  const label = resolveStatus(matches);
  return {
    status: mapStatusToReport(label),
    label,
    reasons,
    matchedEntry: matches[0],
  };
}
