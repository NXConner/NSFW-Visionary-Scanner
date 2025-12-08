// GDPR compliance utilities and data management

import { supabase } from '@/integrations/supabase/client'
import { logger } from './logger'

export interface DataExport {
  userProfile: any
  healthDiaries: any[]
  scanHistory: any[]
  userPreferences: any
  auditLogs: any[]
  exportDate: string
  version: string
}

export interface DataDeletionResult {
  success: boolean
  deletedRecords: {
    profiles: number
    healthDiaries: number
    scanHistory: number
    userRoles: number
    userPreferences: number
    auditLogs: number
  }
  errors: string[]
}

// Data export functionality (GDPR Article 20)
export class DataExporter {
  static async exportUserData(userId: string): Promise<DataExport | null> {
    try {
      logger.info('Starting data export', { userId })

      const [
        profileResult,
        diariesResult,
        scansResult,
        preferencesResult,
        auditResult
      ] = await Promise.allSettled([
        supabase.from('profiles').select('*').eq('user_id', userId).single(),
        supabase.from('health_diary').select('*').eq('user_id', userId).order('entry_date', { ascending: false }),
        supabase.from('scan_history').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('user_preferences').select('*').eq('user_id', userId).single(),
        supabase.from('audit_logs').select('*').eq('user_id', userId).order('created_at', { ascending: false })
      ])

      // Helper function to safely extract data from Supabase results
      const extractData = (result: PromiseSettledResult<any>) => {
        if (result.status === 'fulfilled') {
          const { data, error } = result.value
          if (error) {
            logger.warn('Supabase query error in data export', {
              error: error.message,
              code: error.code
            })
            return null
          }
          return data
        }
        return null
      }

      const exportData: DataExport = {
        userProfile: extractData(profileResult),
        healthDiaries: extractData(diariesResult) || [],
        scanHistory: extractData(scansResult) || [],
        userPreferences: extractData(preferencesResult),
        auditLogs: extractData(auditResult) || [],
        exportDate: new Date().toISOString(),
        version: '1.0'
      }

      logger.info('Data export completed', {
        userId,
        recordCount: exportData.healthDiaries.length + exportData.scanHistory.length
      })

      return exportData
    } catch (error) {
      logger.error('Data export failed', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      return null
    }
  }

  static downloadAsJSON(data: DataExport, filename?: string): void {
    const jsonString = JSON.stringify(data, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = filename || `morphoscan-data-export-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    URL.revokeObjectURL(url)

    logger.info('Data export downloaded', {
      filename: filename || 'morphoscan-data-export.json',
      size: jsonString.length
    })
  }
}

// Data deletion functionality (GDPR Right to Erasure)
export class DataDeleter {
  static async deleteUserData(userId: string, reason: string = 'User requested deletion'): Promise<DataDeletionResult> {
    const result: DataDeletionResult = {
      success: true,
      deletedRecords: {
        profiles: 0,
        healthDiaries: 0,
        scanHistory: 0,
        userRoles: 0,
        userPreferences: 0,
        auditLogs: 0
      },
      errors: []
    }

    try {
      logger.info('Starting user data deletion', { userId, reason })

      // Create deletion audit log before deleting data
      await supabase.from('audit_logs').insert({
        user_id: userId,
        action: 'data_deletion_requested',
        details: { reason, timestamp: new Date().toISOString() },
        ip_address: 'system', // In a real app, you'd get the actual IP
        user_agent: navigator.userAgent
      })

      // Delete data in order of dependencies (reverse of creation)
      const deletionOperations = [
        {
          table: 'audit_logs',
          field: 'user_id',
          countField: 'auditLogs' as keyof typeof result.deletedRecords
        },
        {
          table: 'user_preferences',
          field: 'user_id',
          countField: 'userPreferences' as keyof typeof result.deletedRecords
        },
        {
          table: 'user_roles',
          field: 'user_id',
          countField: 'userRoles' as keyof typeof result.deletedRecords
        },
        {
          table: 'scan_history',
          field: 'user_id',
          countField: 'scanHistory' as keyof typeof result.deletedRecords
        },
        {
          table: 'health_diary',
          field: 'user_id',
          countField: 'healthDiaries' as keyof typeof result.deletedRecords
        },
        {
          table: 'profiles',
          field: 'user_id',
          countField: 'profiles' as keyof typeof result.deletedRecords
        }
      ]

      for (const operation of deletionOperations) {
        try {
          const { data, error, count } = await supabase
            .from(operation.table)
            .delete({ count: 'exact' })
            .eq(operation.field, userId)

          if (error) {
            result.errors.push(`Failed to delete from ${operation.table}: ${error.message}`)
            result.success = false
          } else {
            result.deletedRecords[operation.countField] = count || 0
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          result.errors.push(`Failed to delete from ${operation.table}: ${errorMessage}`)
          result.success = false
        }
      }

      // Log the deletion result
      await supabase.from('audit_logs').insert({
        user_id: userId,
        action: 'data_deletion_completed',
        details: {
          reason,
          success: result.success,
          deletedRecords: result.deletedRecords,
          errors: result.errors,
          timestamp: new Date().toISOString()
        },
        ip_address: 'system',
        user_agent: navigator.userAgent
      })

      logger.info('User data deletion completed', {
        userId,
        success: result.success,
        deletedRecords: result.deletedRecords,
        errorCount: result.errors.length
      })

      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('User data deletion failed', { userId, error: errorMessage })

      result.success = false
      result.errors.push(`Deletion process failed: ${errorMessage}`)

      return result
    }
  }

  // Schedule data deletion (for data retention compliance)
  static async scheduleDeletion(userId: string, deleteAfterDays: number = 30): Promise<boolean> {
    try {
      const deletionDate = new Date()
      deletionDate.setDate(deletionDate.getDate() + deleteAfterDays)

      await supabase.from('deletion_schedules').insert({
        user_id: userId,
        scheduled_deletion_date: deletionDate.toISOString(),
        reason: 'Data retention policy',
        created_at: new Date().toISOString()
      })

      logger.info('Data deletion scheduled', { userId, deleteAfterDays })
      return true
    } catch (error) {
      logger.error('Failed to schedule data deletion', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      return false
    }
  }
}

// Consent management
export class ConsentManager {
  private static readonly CONSENT_KEY = 'gdpr_consent'

  static hasConsent(): boolean {
    try {
      const consent = localStorage.getItem(this.CONSENT_KEY)
      if (!consent) return false

      const consentData = JSON.parse(consent)
      return consentData.analytics && consentData.marketing
    } catch {
      return false
    }
  }

  static grantConsent(analytics: boolean = true, marketing: boolean = false): void {
    const consentData = {
      analytics,
      marketing,
      timestamp: new Date().toISOString(),
      version: '1.0'
    }

    localStorage.setItem(this.CONSENT_KEY, JSON.stringify(consentData))
    logger.info('GDPR consent granted', { analytics, marketing })
  }

  static revokeConsent(): void {
    localStorage.removeItem(this.CONSENT_KEY)
    logger.info('GDPR consent revoked')
  }

  static getConsentStatus() {
    try {
      const consent = localStorage.getItem(this.CONSENT_KEY)
      return consent ? JSON.parse(consent) : null
    } catch {
      return null
    }
  }

  static showConsentBanner(): boolean {
    return !this.hasConsent()
  }
}

// Data retention utilities
export class DataRetentionManager {
  static readonly RETENTION_PERIODS = {
    health_data: 7 * 365, // 7 years for health data
    audit_logs: 10 * 365, // 10 years for audit logs
    user_sessions: 30, // 30 days for sessions
    temporary_files: 7 // 7 days for temp files
  }

  static async cleanupExpiredData(): Promise<{
    deletedRecords: number
    errors: string[]
  }> {
    const result = { deletedRecords: 0, errors: [] }

    try {
      logger.info('Starting data retention cleanup')

      // Clean up old health diary entries beyond retention period
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - this.RETENTION_PERIODS.health_data)

      const { count, error } = await supabase
        .from('health_diary')
        .delete({ count: 'exact' })
        .lt('created_at', cutoffDate.toISOString())

      if (error) {
        result.errors.push(`Health diary cleanup failed: ${error.message}`)
      } else {
        result.deletedRecords += count || 0
      }

      // Clean up old audit logs (keep only last 10 years)
      const auditCutoff = new Date()
      auditCutoff.setDate(auditCutoff.getDate() - this.RETENTION_PERIODS.audit_logs)

      const { count: auditCount, error: auditError } = await supabase
        .from('audit_logs')
        .delete({ count: 'exact' })
        .lt('created_at', auditCutoff.toISOString())

      if (auditError) {
        result.errors.push(`Audit log cleanup failed: ${auditError.message}`)
      } else {
        result.deletedRecords += auditCount || 0
      }

      logger.info('Data retention cleanup completed', result)
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Data retention cleanup failed', { error: errorMessage })
      result.errors.push(errorMessage)
      return result
    }
  }
}