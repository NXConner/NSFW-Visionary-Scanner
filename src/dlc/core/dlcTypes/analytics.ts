// ============================================
// Analytics Types
// ============================================

export type DLCAnalyticsEvent =
  | "dlc_store_viewed"
  | "dlc_package_viewed"
  | "dlc_package_details_opened"
  | "dlc_preview_started"
  | "dlc_purchase_started"
  | "dlc_purchase_completed"
  | "dlc_purchase_failed"
  | "dlc_download_started"
  | "dlc_download_completed"
  | "dlc_download_failed"
  | "dlc_install_started"
  | "dlc_install_completed"
  | "dlc_install_failed"
  | "dlc_feature_first_use"
  | "dlc_upgrade_offered"
  | "dlc_upgrade_accepted"
  | "dlc_promo_applied"
  | "dlc_gift_redeemed";

export interface DLCAnalyticsEventData {
  eventType: DLCAnalyticsEvent;
  packageId?: string;
  data?: Record<string, unknown>;
  timestamp: Date;
}
