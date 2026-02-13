import type { DevicePlatform } from "./device";

export type DLCInstallSource = "manual" | "auto_update" | "restore";

export type DLCInstallation = {
  id: string;
  userId: string;
  licenseId: string;
  packageId: string;
  deviceId: string;

  installedVersion: string;
  contentVersion?: string;
  installDate: Date;
  installSource?: DLCInstallSource;

  devicePlatform?: DevicePlatform;
  deviceModel?: string;
  appVersion?: string;

  storageUsedBytes?: number;
  cachedContentBytes?: number;

  isInstalled: boolean;
  isCorrupted: boolean;
  lastIntegrityCheck?: Date;
  lastUsedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
};

