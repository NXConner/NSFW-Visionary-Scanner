/**
 * GDPR compliance utilities and data management
 * Uses localStorage for local-first privacy
 */

import { supabase } from "@/integrations/supabase/client";
import { logger } from "./logger";

export interface DataExport {
  userProfile: any;
  healthDiaries: any[];
  scanHistory: any[];
  userPreferences: any;
  exportDate: string;
  version: string;
}

export interface DataDeletionResult {
  success: boolean;
  deletedRecords: {
    profiles: number;
    healthDiaries: number;
    scanHistory: number;
    userRoles: number;
    userPreferences: number;
  };
  errors: string[];
}

// Data export functionality (GDPR Article 20)
export class DataExporter {
  static async exportUserData(userId: string): Promise<DataExport | null> {
    try {
      logger.info("Starting data export", { userId });

      const [profileResult, diariesResult, scansResult] = await Promise.allSettled([
        supabase.from("profiles").select("*").eq("user_id", userId).single(),
        supabase
          .from("health_diary")
          .select("*")
          .eq("user_id", userId)
          .order("entry_date", { ascending: false }),
        supabase
          .from("scan_history")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false }),
      ]);

      const extractData = (result: PromiseSettledResult<any>) => {
        if (result.status === "fulfilled") {
          const { data, error } = result.value;
          if (error) {
            logger.warn("Supabase query error in data export", {
              error: error.message,
              code: error.code,
            });
            return null;
          }
          return data;
        }
        return null;
      };

      // Get preferences from localStorage
      let userPreferences = null;
      try {
        const stored = localStorage.getItem("user_preferences");
        if (stored) userPreferences = JSON.parse(stored);
      } catch {
        // Ignore
      }

      const exportData: DataExport = {
        userProfile: extractData(profileResult),
        healthDiaries: extractData(diariesResult) || [],
        scanHistory: extractData(scansResult) || [],
        userPreferences,
        exportDate: new Date().toISOString(),
        version: "1.0",
      };

      logger.info("Data export completed", {
        userId,
        recordCount: exportData.healthDiaries.length + exportData.scanHistory.length,
      });

      return exportData;
    } catch (error) {
      logger.error("Data export failed", {
        userId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return null;
    }
  }

  static downloadAsJSON(data: DataExport, filename?: string): void {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = filename || `data-export-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);

    logger.info("Data export downloaded", {
      filename: filename || "data-export.json",
      size: jsonString.length,
    });
  }
}

// Data deletion functionality (GDPR Right to Erasure)
export class DataDeleter {
  static async deleteUserData(
    userId: string,
    reason: string = "User requested deletion",
  ): Promise<DataDeletionResult> {
    const result: DataDeletionResult = {
      success: true,
      deletedRecords: {
        profiles: 0,
        healthDiaries: 0,
        scanHistory: 0,
        userRoles: 0,
        userPreferences: 0,
      },
      errors: [],
    };

    try {
      logger.info("Starting user data deletion", { userId, reason });

      // Delete from scan_history
      const { count: scanCount, error: scanError } = await supabase
        .from("scan_history")
        .delete({ count: "exact" })
        .eq("user_id", userId);

      if (scanError) {
        result.errors.push(`Failed to delete scan_history: ${scanError.message}`);
      } else {
        result.deletedRecords.scanHistory = scanCount || 0;
      }

      // Delete from health_diary
      const { count: diaryCount, error: diaryError } = await supabase
        .from("health_diary")
        .delete({ count: "exact" })
        .eq("user_id", userId);

      if (diaryError) {
        result.errors.push(`Failed to delete health_diary: ${diaryError.message}`);
      } else {
        result.deletedRecords.healthDiaries = diaryCount || 0;
      }

      // Clear localStorage preferences
      try {
        localStorage.removeItem("user_preferences");
        localStorage.removeItem("privacy_settings");
        localStorage.removeItem("gdpr_consent");
        result.deletedRecords.userPreferences = 1;
      } catch {
        // Ignore localStorage errors
      }

      result.success = result.errors.length === 0;

      logger.info("User data deletion completed", {
        userId,
        success: result.success,
        deletedRecords: result.deletedRecords,
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.error("User data deletion failed", { userId, error: errorMessage });

      result.success = false;
      result.errors.push(`Deletion process failed: ${errorMessage}`);

      return result;
    }
  }

  static async scheduleDeletion(userId: string, deleteAfterDays: number = 30): Promise<boolean> {
    try {
      // Store scheduled deletion in localStorage
      const deletionDate = new Date();
      deletionDate.setDate(deletionDate.getDate() + deleteAfterDays);

      localStorage.setItem(
        "scheduled_deletion",
        JSON.stringify({
          userId,
          scheduledDate: deletionDate.toISOString(),
          reason: "Data retention policy",
        }),
      );

      logger.info("Data deletion scheduled", { userId, deleteAfterDays });
      return true;
    } catch (error) {
      logger.error("Failed to schedule data deletion", {
        userId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return false;
    }
  }
}

// Consent management
export class ConsentManager {
  private static readonly CONSENT_KEY = "gdpr_consent";

  static hasConsent(): boolean {
    try {
      const consent = localStorage.getItem(this.CONSENT_KEY);
      if (!consent) return false;

      const consentData = JSON.parse(consent);
      return consentData.analytics && consentData.marketing;
    } catch {
      return false;
    }
  }

  static grantConsent(analytics: boolean = true, marketing: boolean = false): void {
    const consentData = {
      analytics,
      marketing,
      timestamp: new Date().toISOString(),
      version: "1.0",
    };

    localStorage.setItem(this.CONSENT_KEY, JSON.stringify(consentData));
    logger.info("GDPR consent granted", { analytics, marketing });
  }

  static revokeConsent(): void {
    localStorage.removeItem(this.CONSENT_KEY);
    logger.info("GDPR consent revoked");
  }

  static getConsentStatus() {
    try {
      const consent = localStorage.getItem(this.CONSENT_KEY);
      return consent ? JSON.parse(consent) : null;
    } catch {
      return null;
    }
  }

  static showConsentBanner(): boolean {
    return !this.hasConsent();
  }
}

// Data retention utilities
export class DataRetentionManager {
  static readonly RETENTION_PERIODS = {
    health_data: 7 * 365,
    audit_logs: 10 * 365,
    user_sessions: 30,
    temporary_files: 7,
  };

  static async cleanupExpiredData(): Promise<{
    deletedRecords: number;
    errors: string[];
  }> {
    const result = { deletedRecords: 0, errors: [] as string[] };

    try {
      logger.info("Starting data retention cleanup");

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.RETENTION_PERIODS.health_data);

      const { count, error } = await supabase
        .from("health_diary")
        .delete({ count: "exact" })
        .lt("created_at", cutoffDate.toISOString());

      if (error) {
        result.errors.push(`Health diary cleanup failed: ${error.message}`);
      } else {
        result.deletedRecords += count || 0;
      }

      logger.info("Data retention cleanup completed", result);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.error("Data retention cleanup failed", { error: errorMessage });
      result.errors.push(errorMessage);
      return result;
    }
  }
}
