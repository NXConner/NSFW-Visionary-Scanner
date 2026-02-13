import type { DLCPackage } from "./package";
import type { DownloadProgress } from "./download";

export type DLCStoreState = {
  packages: DLCPackage[];
  ownedPackages: string[]; // packageId[]
  installedPackages: string[]; // packageId[]
  downloads: Record<string, DownloadProgress>;
  isLoading: boolean;
  error: string | null;
};

