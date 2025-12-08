/**
 * Enhanced Export & Import System
 * Handles Excel, PDF, CSV exports, cloud integrations, and data import from various sources
 */

import { supabase } from '@/integrations/supabase/client'
import { logger } from './logger'
import { toast } from 'sonner'

// ==================== Export Jobs ====================

export interface ExportJob {
  id: string
  user_id: string
  export_type: 'excel' | 'pdf' | 'csv' | 'json' | 'hl7_fhir' | 'google_sheets' | 'onedrive' | 'dropbox' | 'email'
  export_name: string
  export_config: any
  data_sources: string[]
  export_status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  progress_percentage: number
  file_url: string | null
  file_format: string | null
  file_size_bytes: number | null
  file_name: string | null
  cloud_service: string | null
  cloud_file_id: string | null
  cloud_file_url: string | null
  email_recipients: string[] | null
  email_sent: boolean
  email_sent_at: string | null
  started_at: string | null
  completed_at: string | null
  failed_at: string | null
  error_message: string | null
  created_at: string
  updated_at: string
}

export async function createExportJob(
  exportType: ExportJob['export_type'],
  exportName: string,
  exportConfig: any,
  dataSources: string[],
  options?: {
    cloudService?: string
    emailRecipients?: string[]
  }
): Promise<ExportJob | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in to export data')
      return null
    }

    const { data, error } = await supabase
      .from('export_jobs')
      .insert({
        user_id: user.id,
        export_type: exportType,
        export_name: exportName,
        export_config: exportConfig,
        data_sources: dataSources,
        cloud_service: options?.cloudService || null,
        email_recipients: options?.emailRecipients || null
      })
      .select()
      .single()

    if (error) {
      logger.error('Error creating export job:', error)
      toast.error('Failed to create export job')
      return null
    }

    // Trigger export via Edge Function
    const { error: exportError } = await supabase.functions.invoke('generate-export', {
      body: {
        export_job_id: data.id
      }
    })

    if (exportError) {
      logger.error('Error triggering export:', exportError)
    }

    toast.success('Export job created!')
    return data as ExportJob
  } catch (error) {
    logger.error('Error in createExportJob:', error)
    return null
  }
}

export async function getExportJobs(): Promise<ExportJob[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('export_jobs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('Error fetching export jobs:', error)
      return []
    }

    return (data || []) as ExportJob[]
  } catch (error) {
    logger.error('Error in getExportJobs:', error)
    return []
  }
}

// ==================== Import Jobs ====================

export interface ImportJob {
  id: string
  user_id: string
  import_type: 'csv' | 'excel' | 'json' | 'other_app' | 'bulk'
  import_name: string
  source_app: string | null
  file_url: string | null
  file_name: string | null
  file_size_bytes: number | null
  file_format: string | null
  import_config: any
  data_mapping: any | null
  import_status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  progress_percentage: number
  records_total: number
  records_imported: number
  records_failed: number
  records_skipped: number
  validation_errors: any | null
  import_errors: any | null
  started_at: string | null
  completed_at: string | null
  failed_at: string | null
  error_message: string | null
  created_at: string
  updated_at: string
}

export async function createImportJob(
  importType: ImportJob['import_type'],
  importName: string,
  fileUrl: string,
  importConfig: any,
  dataMapping?: any
): Promise<ImportJob | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in to import data')
      return null
    }

    const { data, error } = await supabase
      .from('import_jobs')
      .insert({
        user_id: user.id,
        import_type: importType,
        import_name: importName,
        file_url: fileUrl,
        import_config: importConfig,
        data_mapping: dataMapping || null
      })
      .select()
      .single()

    if (error) {
      logger.error('Error creating import job:', error)
      toast.error('Failed to create import job')
      return null
    }

    // Trigger import via Edge Function
    const { error: importError } = await supabase.functions.invoke('process-import', {
      body: {
        import_job_id: data.id
      }
    })

    if (importError) {
      logger.error('Error triggering import:', importError)
    }

    toast.success('Import job created!')
    return data as ImportJob
  } catch (error) {
    logger.error('Error in createImportJob:', error)
    return null
  }
}

export async function getImportJobs(): Promise<ImportJob[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('import_jobs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('Error fetching import jobs:', error)
      return []
    }

    return (data || []) as ImportJob[]
  } catch (error) {
    logger.error('Error in getImportJobs:', error)
    return []
  }
}

// ==================== Cloud Service Connections ====================

export interface CloudServiceConnection {
  id: string
  user_id: string
  service_type: 'google_drive' | 'google_sheets' | 'onedrive' | 'dropbox' | 'other'
  service_name: string
  access_token_encrypted: string | null
  refresh_token_encrypted: string | null
  is_connected: boolean
  connection_status: string
  last_sync_at: string | null
  permissions_granted: string[] | null
  created_at: string
  updated_at: string
}

export async function connectCloudService(
  serviceType: CloudServiceConnection['service_type'],
  serviceName: string
): Promise<CloudServiceConnection | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in to connect cloud service')
      return null
    }

    // Call OAuth Edge Function
    const { data: oauthData, error: oauthError } = await supabase.functions.invoke('oauth-cloud-service', {
      body: {
        service_type: serviceType,
        service_name: serviceName
      }
    })

    if (oauthError) {
      logger.error('Error initiating OAuth:', oauthError)
      toast.error('Failed to connect cloud service')
      return null
    }

    // Redirect to OAuth URL
    if (oauthData.auth_url) {
      window.location.href = oauthData.auth_url
      return null
    }

    toast.success('Cloud service connected!')
    return null
  } catch (error) {
    logger.error('Error in connectCloudService:', error)
    return null
  }
}

export async function getCloudServiceConnections(): Promise<CloudServiceConnection[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('cloud_service_connections')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('Error fetching cloud connections:', error)
      return []
    }

    return (data || []) as CloudServiceConnection[]
  } catch (error) {
    logger.error('Error in getCloudServiceConnections:', error)
    return []
  }
}

