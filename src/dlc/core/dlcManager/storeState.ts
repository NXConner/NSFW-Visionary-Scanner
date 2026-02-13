import type { DLCStoreState, DownloadProgress, DLCPackage } from "../types";

export function getStoreState(params: {
  packages: DLCPackage[];
  ownedPackageIds: string[];
  installedPackageIds: string[];
  downloads: Map<string, DownloadProgress>;
}): DLCStoreState {
  return {
    packages: params.packages,
    ownedPackages: params.ownedPackageIds,
    installedPackages: params.installedPackageIds,
    downloads: Object.fromEntries(params.downloads),
    isLoading: false,
    error: null,
  };
}
