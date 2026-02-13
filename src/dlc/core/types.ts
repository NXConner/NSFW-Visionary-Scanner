export * from "./dlcTypes";

// Re-export DLCRegistry interface for backward compatibility
export interface DLCRegistry {
  getPackage(packageId: string): import("./dlcTypes").DLCPackage | undefined;
  getAllPackages(): import("./dlcTypes").DLCPackage[];
  getFeaturedPackages(): import("./dlcTypes").DLCPackage[];
}
