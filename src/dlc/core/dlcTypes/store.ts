// ============================================
// Store Types
// ============================================

import type { DLCPackage } from "./package";
import type { DownloadProgress } from "./download";

export interface DLCStoreState {
  packages: DLCPackage[];
  ownedPackages: string[];
  installedPackages: string[];
  downloads: Record<string, DownloadProgress>;
  isLoading: boolean;
  error: string | null;
}

export interface DLCPurchaseRequest {
  packageId: string;
  promoCode?: string;
  giftCode?: string;
  paymentMethod: "stripe" | "paypal";
}

export interface DLCPurchaseResult {
  success: boolean;
  licenseKey?: string;
  error?: string;
  redirectUrl?: string;
}
