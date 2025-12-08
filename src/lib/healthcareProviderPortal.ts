/**
 * Healthcare Provider Portal
 * Handles provider portal, doctor dashboard, patient data access, professional reporting, treatment planning, and HIPAA compliance
 */

import { supabase } from '@/integrations/supabase/client'
import { logger } from './logger'
import { toast } from 'sonner'

// ==================== Healthcare Providers ====================

export interface HealthcareProvider {
  id: string
  user_id: string
  provider_name: string
  provider_type: 'doctor' | 'clinic' | 'hospital' | 'organization'
  specialty: string[] | null
  credentials: string[] | null
  license_number: string | null
  license_state: string | null
  email: string
  phone: string | null
  address: string | null
  website: string | null
  subscription_tier: 'basic' | 'professional' | 'enterprise'
  subscription_status: 'active' | 'suspended' | 'cancelled'
  subscription_start_date: string | null
  subscription_end_date: string | null
  hipaa_compliant: boolean
  hipaa_certification_date: string | null
  baa_signed: boolean
  baa_signed_date: string | null
  max_patients: number
  current_patient_count: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export async function createHealthcareProvider(
  providerData: Partial<HealthcareProvider>
): Promise<HealthcareProvider | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in to create provider profile')
      return null
    }

    const { data, error } = await supabase
      .from('healthcare_providers')
      .insert({
        user_id: user.id,
        ...providerData
      })
      .select()
      .single()

    if (error) {
      logger.error('Error creating provider:', error)
      toast.error('Failed to create provider profile')
      return null
    }

    toast.success('Provider profile created!')
    return data as HealthcareProvider
  } catch (error) {
    logger.error('Error in createHealthcareProvider:', error)
    return null
  }
}

export async function getHealthcareProvider(): Promise<HealthcareProvider | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('healthcare_providers')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error) {
      logger.error('Error fetching provider:', error)
      return null
    }

    return data as HealthcareProvider | null
  } catch (error) {
    logger.error('Error in getHealthcareProvider:', error)
    return null
  }
}

// ==================== Patient-Provider Relationships ====================

export interface PatientProviderRelationship {
  id: string
  patient_id: string
  provider_id: string
  consent_granted: boolean
  consent_date: string | null
  consent_expires_date: string | null
  consent_scope: string[]
  relationship_type: 'primary' | 'consulting' | 'specialist' | 'temporary'
  status: 'active' | 'inactive' | 'revoked'
  access_level: 'read' | 'read_write' | 'full'
  can_view_scans: boolean
  can_view_diary: boolean
  can_view_analytics: boolean
  can_view_reports: boolean
  provider_notes: string | null
  created_at: string
  updated_at: string
}

export async function grantProviderAccess(
  providerId: string,
  consentScope: string[],
  accessLevel: PatientProviderRelationship['access_level'] = 'read'
): Promise<PatientProviderRelationship | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in to grant access')
      return null
    }

    const { data, error } = await supabase
      .from('patient_provider_relationships')
      .insert({
        patient_id: user.id,
        provider_id: providerId,
        consent_granted: true,
        consent_date: new Date().toISOString().split('T')[0],
        consent_scope: consentScope,
        access_level: accessLevel,
        status: 'active'
      })
      .select()
      .single()

    if (error) {
      logger.error('Error granting access:', error)
      toast.error('Failed to grant access')
      return null
    }

    toast.success('Access granted to provider!')
    return data as PatientProviderRelationship
  } catch (error) {
    logger.error('Error in grantProviderAccess:', error)
    return null
  }
}

export async function getPatientRelationships(): Promise<PatientProviderRelationship[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('patient_provider_relationships')
      .select('*')
      .eq('patient_id', user.id)
      .eq('status', 'active')

    if (error) {
      logger.error('Error fetching relationships:', error)
      return []
    }

    return (data || []) as PatientProviderRelationship[]
  } catch (error) {
    logger.error('Error in getPatientRelationships:', error)
    return []
  }
}

// ==================== Professional Reports ====================

export interface ProviderProfessionalReport {
  id: string
  provider_id: string
  patient_id: string
  report_type: 'assessment' | 'progress' | 'treatment_plan' | 'summary' | 'referral'
  report_title: string
  report_content: any
  findings: string[] | null
  recommendations: string[] | null
  treatment_plan: any
  report_status: 'draft' | 'final' | 'shared' | 'archived'
  is_shared_with_patient: boolean
  shared_at: string | null
  file_url: string | null
  file_format: 'pdf' | 'docx' | 'hl7_fhir' | null
  created_at: string
  updated_at: string
}

export async function createProfessionalReport(
  patientId: string,
  reportType: ProviderProfessionalReport['report_type'],
  reportTitle: string,
  reportContent: any
): Promise<ProviderProfessionalReport | null> {
  try {
    const provider = await getHealthcareProvider()
    if (!provider) {
      toast.error('Provider profile not found')
      return null
    }

    const { data, error } = await supabase
      .from('provider_professional_reports')
      .insert({
        provider_id: provider.id,
        patient_id: patientId,
        report_type: reportType,
        report_title: reportTitle,
        report_content: reportContent
      })
      .select()
      .single()

    if (error) {
      logger.error('Error creating report:', error)
      toast.error('Failed to create report')
      return null
    }

    toast.success('Report created!')
    return data as ProviderProfessionalReport
  } catch (error) {
    logger.error('Error in createProfessionalReport:', error)
    return null
  }
}

// ==================== Treatment Plans ====================

export interface TreatmentPlan {
  id: string
  provider_id: string
  patient_id: string
  plan_name: string
  plan_description: string | null
  plan_data: any
  goals: string[] | null
  milestones: string[] | null
  timeline_days: number | null
  plan_status: 'draft' | 'active' | 'completed' | 'cancelled'
  start_date: string | null
  end_date: string | null
  completed_at: string | null
  progress_percentage: number
  milestones_completed: number
  created_at: string
  updated_at: string
}

export async function createTreatmentPlan(
  patientId: string,
  planName: string,
  planData: any,
  goals?: string[],
  timelineDays?: number
): Promise<TreatmentPlan | null> {
  try {
    const provider = await getHealthcareProvider()
    if (!provider) {
      toast.error('Provider profile not found')
      return null
    }

    const { data, error } = await supabase
      .from('treatment_plans')
      .insert({
        provider_id: provider.id,
        patient_id: patientId,
        plan_name: planName,
        plan_data: planData,
        goals: goals || null,
        timeline_days: timelineDays || null,
        start_date: new Date().toISOString().split('T')[0]
      })
      .select()
      .single()

    if (error) {
      logger.error('Error creating treatment plan:', error)
      toast.error('Failed to create treatment plan')
      return null
    }

    toast.success('Treatment plan created!')
    return data as TreatmentPlan
  } catch (error) {
    logger.error('Error in createTreatmentPlan:', error)
    return null
  }
}

