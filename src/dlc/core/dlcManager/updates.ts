import type { DLCInstallation, DLCUpdate, DLCRegistry } from "../types";

export async function checkForUpdates(
  registry: DLCRegistry,
  installations: Map<string, DLCInstallation>,
): Promise<DLCUpdate[]> {
  const updates: DLCUpdate[] = [];

  for (const [packageId, installation] of installations) {
    const pkg = registry.getPackage(packageId);
    if (!pkg) continue;

    if (
      pkg.version !== installation.installedVersion ||
      pkg.contentVersion !== installation.contentVersion
    ) {
      updates.push({
        packageId,
        currentVersion: installation.installedVersion,
        latestVersion: pkg.version,
        updateType: determineUpdateType(installation.installedVersion, pkg.version),
        updatePolicy: "notify",
        changelog: pkg.contentChangelog?.find(c => c.version === pkg.contentVersion)?.changes || [],
        downloadSizeBytes: pkg.downloadSizeBytes || 0,
        isRequired: false,
        releaseDate: pkg.updatedAt,
      });
    }
  }

  return updates;
}

export function determineUpdateType(current: string, latest: string): DLCUpdate["updateType"] {
  const [currentMajor, currentMinor] = current.split(".").map(Number);
  const [latestMajor, latestMinor] = latest.split(".").map(Number);

  if (latestMajor > currentMajor) return "major";
  if (latestMinor > currentMinor) return "minor";
  return "patch";
}
