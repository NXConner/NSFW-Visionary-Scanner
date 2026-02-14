import type {
  DLCPackage,
  DLCInstallation,
  DLCLicense,
  DLCStoreState,
  DLCUpdate,
  DownloadProgress,
  LicenseValidationResult,
} from "@/dlc/core/types";

export interface DLCContextValue {
  // State
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;

  // Packages
  packages: DLCPackage[];
  featuredPackages: DLCPackage[];
  ownedPackages: DLCPackage[];
  installedPackages: DLCPackage[];

  // Status Checks
  ownsPackage: (packageId: string) => boolean;
  isPackageInstalled: (packageId: string) => boolean;
  hasFeature: (featureId: string) => boolean;

  // License Operations
  getLicense: (packageId: string) => DLCLicense | undefined;
  validateLicense: (packageId: string) => Promise<LicenseValidationResult>;
  activateLicense: (
    licenseKey: string,
  ) => Promise<{ success: boolean; packageId?: string; error?: string }>;

  // Installation Operations
  getInstallation: (packageId: string) => DLCInstallation | undefined;
  installPackage: (packageId: string) => Promise<{ success: boolean; error?: string }>;
  uninstallPackage: (packageId: string) => Promise<{ success: boolean; error?: string }>;

  // Download Operations
  getDownloadProgress: (packageId: string) => DownloadProgress | undefined;
  getActiveDownloads: () => DownloadProgress[];

  // Updates
  checkForUpdates: () => Promise<DLCUpdate[]>;
  availableUpdates: DLCUpdate[];

  // Age Verification
  isAgeVerified: boolean;
  verifyAge: (age: number, consent: boolean) => Promise<boolean>;

  // Update Source
  updateSource: "store" | "website";
  isUpdateSourceAcknowledged: boolean;
  acknowledgeUpdateSourceChange: () => void;

  // Pricing
  calculateUpgradePrice: (targetPackageId: string) => number;
  getRegionalPrice: (packageId: string, currency: string) => number;

  // Refresh
  refresh: () => Promise<void>;
}

export type DLCProviderProps = { children: React.ReactNode };

export type DlcContextInternals = {
  storeState: DLCStoreState | null;
  packages: DLCPackage[];
};
