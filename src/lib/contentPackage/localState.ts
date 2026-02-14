import type { ContentPackageManifest } from "./types";

function lsKeyManifest(packageId: string): string {
  return `dlc_content_manifest:${packageId}`;
}

function lsKeyVersion(packageId: string): string {
  return `dlc_content_version:${packageId}`;
}

function lsKeyInstalledAt(packageId: string): string {
  return `dlc_content_installed_at:${packageId}`;
}

export function setInstalledManifest(packageId: string, manifest: ContentPackageManifest): void {
  localStorage.setItem(lsKeyManifest(packageId), JSON.stringify(manifest));
}

export function setInstalledVersion(packageId: string, version: string): void {
  localStorage.setItem(lsKeyVersion(packageId), version);
}

export function setInstalledAt(packageId: string, iso: string): void {
  localStorage.setItem(lsKeyInstalledAt(packageId), iso);
}

export const getInstalledContentVersion = (packageId: string): string | null => {
  return localStorage.getItem(lsKeyVersion(packageId));
};

export const isContentInstalled = (packageId: string): boolean => {
  return !!localStorage.getItem(lsKeyInstalledAt(packageId));
};

export async function getInstalledManifest(
  packageId: string,
): Promise<ContentPackageManifest | null> {
  try {
    const raw = localStorage.getItem(lsKeyManifest(packageId));
    if (!raw) return null;
    return JSON.parse(raw) as ContentPackageManifest;
  } catch {
    return null;
  }
}
