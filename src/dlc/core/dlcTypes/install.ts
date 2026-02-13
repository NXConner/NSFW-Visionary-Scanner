// ============================================
// Installation Types
// ============================================

import type { DevicePlatform } from "./license";

export type InstallSource = "manual" | "auto_update" | "restore";
export type InstallStatus =
  | "not_installed"
  | "downloading"
  | "installing"
  | "installed"
  | "failed"
  | "corrupted";

export interface DLCInstallation {
  id: string;
  userId: string;
  licenseId: string;
  packageId: string;
  deviceId: string;

  // Installation Info
  installedVersion: string;
  contentVersion?: string;
  installDate: Date;
  installSource: InstallSource;

  // Device Info
  devicePlatform?: DevicePlatform;
  deviceModel?: string;
  appVersion?: string;

  // Storage
  storageUsedBytes?: number;
  cachedContentBytes?: number;

  // Status
  isInstalled: boolean;
  isCorrupted: boolean;
  lastIntegrityCheck?: Date;
  lastUsedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}
