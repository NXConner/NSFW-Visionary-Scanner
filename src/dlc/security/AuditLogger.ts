/**
 * Audit Logger for DLC & NSFW Features
 * Logs security-relevant events for compliance and debugging
 */

import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";

export type AuditEventType =
  | "age_verification_attempt"
  | "age_verification_success"
  | "age_verification_failure"
  | "license_activation"
  | "license_validation_failure"
  | "nsfw_content_access"
  | "nsfw_detection_run"
  | "dlc_purchase_initiated"
  | "dlc_purchase_completed"
  | "dlc_install"
  | "dlc_uninstall";

interface AuditLogEntry {
  eventType: AuditEventType;
  userId?: string;
  packageId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export class AuditLogger {
  private static async getUserInfo() {
    const { data } = await supabase.auth.getUser();
    return {
      userId: data.user?.id,
      userAgent: navigator.userAgent,
    };
  }

  /**
   * Log an audit event
   */
  static async log(entry: Omit<AuditLogEntry, "userId" | "userAgent">): Promise<void> {
    try {
      const userInfo = await this.getUserInfo();

      const fullEntry: AuditLogEntry = {
        eventType: entry.eventType,
        packageId: entry.packageId,
        metadata: entry.metadata,
        ipAddress: entry.ipAddress,
        userId: userInfo.userId,
        userAgent: userInfo.userAgent,
      };

      // Log to console in development
      logger.info("Audit Event", { ...fullEntry } as Record<string, unknown>);

      // Store in database (if audit table exists)
      // This is optional - uncomment if you add dlc_audit_logs table
      /*
      await supabase.from("dlc_audit_logs").insert({
        event_type: fullEntry.eventType,
        user_id: fullEntry.userId,
        package_id: fullEntry.packageId,
        metadata: fullEntry.metadata,
        user_agent: fullEntry.userAgent,
      });
      */
    } catch (error) {
      // Never throw - audit logging should not break app
      logger.error("Audit logging failed", { error });
    }
  }

  /**
   * Log age verification attempt
   */
  static async logAgeVerification(success: boolean, age?: number): Promise<void> {
    await this.log({
      eventType: success ? "age_verification_success" : "age_verification_failure",
      metadata: { age: age ? "18+" : undefined }, // Never log actual age
    });
  }

  /**
   * Log license activation
   */
  static async logLicenseActivation(packageId: string, success: boolean): Promise<void> {
    await this.log({
      eventType: "license_activation",
      packageId,
      metadata: { success },
    });
  }

  /**
   * Log NSFW content access
   */
  static async logNSFWAccess(contentType: string): Promise<void> {
    await this.log({
      eventType: "nsfw_content_access",
      metadata: { contentType },
    });
  }

  /**
   * Log NSFW detection run
   */
  static async logNSFWDetection(
    result: "explicit" | "suggestive" | "neutral" | "unknown",
    confidence: number,
  ): Promise<void> {
    await this.log({
      eventType: "nsfw_detection_run",
      metadata: { result, confidence },
    });
  }
}
