/**
 * Prostate & Testicular Health Focus
 * Educational content, assessments, guides, and screening reminders
 */

import { supabase } from '@/integrations/supabase/client'
import { logger } from './logger'
import { toast } from 'sonner'

export interface EducationContent {
  id: string
  title: string
  content_type: 'article' | 'video' | 'guide' | 'assessment' | 'tutorial' | 'faq'
  category: 'prostate' | 'testicular' | 'sexual' | 'urinary' | 'general' | 'prevention'
  content: string
  summary: string | null
  video_url: string | null
  image_url: string | null
  difficulty_level: 'beginner' | 'intermediate' | 'advanced' | null
  reading_time_minutes: number | null
  tags: string[]
  is_premium: boolean
  is_featured: boolean
  view_count: number
  created_at: string
  updated_at: string
}

export interface HealthAssessment {
  id: string
  title: string
  category: 'prostate' | 'testicular' | 'sexual' | 'urinary' | 'general'
  description: string | null
  questions: Array<{
    id: string
    question: string
    type: 'multiple_choice' | 'scale' | 'yes_no' | 'text'
    options?: string[]
    required: boolean
  }>
  scoring_logic: Record<string, any>
  risk_levels: Record<string, any>
  recommendations: Record<string, any>
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AssessmentResult {
  id: string
  user_id: string
  assessment_id: string
  answers: Record<string, any>
  score: number | null
  risk_level: 'low' | 'moderate' | 'high' | 'very_high' | null
  recommendations: string[]
  completed_at: string
  created_at: string
}

export interface SelfExamGuide {
  id: string
  title: string
  exam_type: 'testicular' | 'prostate' | 'general'
  step_by_step_instructions: string[]
  video_url: string | null
  image_urls: string[]
  frequency_recommendation: string | null
  warning_signs: string[]
  when_to_see_doctor: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ScreeningReminder {
  id: string
  user_id: string
  reminder_type: 'psa_test' | 'testicular_exam' | 'general_checkup' | 'specialist_visit'
  frequency_months: number | null
  last_reminder_date: string | null
  next_reminder_date: string
  is_active: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

/**
 * Get education content by category
 */
export async function getEducationContent(
  category: 'prostate' | 'testicular' | 'sexual' | 'urinary' | 'general' | 'prevention',
  limit: number = 20
): Promise<EducationContent[]> {
  try {
    const { data, error } = await supabase
      .from('health_education_content')
      .select('*')
      .eq('category', category)
      .order('is_featured', { ascending: false })
      .order('view_count', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      logger.error('Error fetching education content:', error)
      return []
    }

    return (data || []) as EducationContent[]
  } catch (error) {
    logger.error('Error getting education content:', error)
    return []
  }
}

/**
 * Get featured education content
 */
export async function getFeaturedEducationContent(limit: number = 10): Promise<EducationContent[]> {
  try {
    const { data, error } = await supabase
      .from('health_education_content')
      .select('*')
      .eq('is_featured', true)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      logger.error('Error fetching featured content:', error)
      return []
    }

    return (data || []) as EducationContent[]
  } catch (error) {
    logger.error('Error getting featured content:', error)
    return []
  }
}

/**
 * Get health assessments
 */
export async function getHealthAssessments(
  category?: 'prostate' | 'testicular' | 'sexual' | 'urinary' | 'general'
): Promise<HealthAssessment[]> {
  try {
    let query = supabase
      .from('health_assessments')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (category) {
      query = query.eq('category', category)
    }

    const { data, error } = await query

    if (error) {
      logger.error('Error fetching assessments:', error)
      return []
    }

    return (data || []) as HealthAssessment[]
  } catch (error) {
    logger.error('Error getting assessments:', error)
    return []
  }
}

/**
 * Submit assessment results
 */
export async function submitAssessmentResults(
  assessmentId: string,
  answers: Record<string, any>
): Promise<AssessmentResult | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in to complete assessment')
      return null
    }

    // Get assessment to calculate score
    const { data: assessment } = await supabase
      .from('health_assessments')
      .select('*')
      .eq('id', assessmentId)
      .single()

    if (!assessment) {
      toast.error('Assessment not found')
      return null
    }

    // Calculate score (simplified - would need actual scoring logic)
    const score = calculateAssessmentScore(assessment, answers)
    const riskLevel = determineRiskLevel(assessment, score)
    const recommendations = getRecommendations(assessment, riskLevel)

    const { data, error } = await supabase
      .from('user_assessment_results')
      .insert({
        user_id: user.id,
        assessment_id: assessmentId,
        answers,
        score,
        risk_level: riskLevel,
        recommendations
      })
      .select()
      .single()

    if (error) {
      logger.error('Error submitting assessment:', error)
      toast.error('Failed to submit assessment')
      return null
    }

    toast.success('Assessment completed!')
    return data as AssessmentResult
  } catch (error) {
    logger.error('Error in submitAssessmentResults:', error)
    return null
  }
}

function calculateAssessmentScore(assessment: any, answers: Record<string, any>): number {
  // Simplified scoring - would implement actual logic based on assessment.scoring_logic
  return Object.keys(answers).length * 10
}

function determineRiskLevel(assessment: any, score: number): 'low' | 'moderate' | 'high' | 'very_high' {
  // Simplified - would use assessment.risk_levels
  if (score >= 80) return 'very_high'
  if (score >= 60) return 'high'
  if (score >= 40) return 'moderate'
  return 'low'
}

function getRecommendations(assessment: any, riskLevel: string): string[] {
  // Simplified - would use assessment.recommendations
  return assessment.recommendations?.[riskLevel] || []
}

/**
 * Get self-examination guides
 */
export async function getSelfExamGuides(
  examType: 'testicular' | 'prostate' | 'general'
): Promise<SelfExamGuide[]> {
  try {
    const { data, error } = await supabase
      .from('self_examination_guides')
      .select('*')
      .eq('exam_type', examType)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('Error fetching self-exam guides:', error)
      return []
    }

    return (data || []) as SelfExamGuide[]
  } catch (error) {
    logger.error('Error getting self-exam guides:', error)
    return []
  }
}

/**
 * Get screening reminders
 */
export async function getScreeningReminders(): Promise<ScreeningReminder[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('screening_reminders')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('next_reminder_date', { ascending: true })

    if (error) {
      logger.error('Error fetching screening reminders:', error)
      return []
    }

    return (data || []) as ScreeningReminder[]
  } catch (error) {
    logger.error('Error getting screening reminders:', error)
    return []
  }
}

/**
 * Create screening reminder
 */
export async function createScreeningReminder(
  reminderType: ScreeningReminder['reminder_type'],
  frequencyMonths: number,
  nextReminderDate: string
): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in to create reminders')
      return false
    }

    const { error } = await supabase
      .from('screening_reminders')
      .insert({
        user_id: user.id,
        reminder_type: reminderType,
        frequency_months: frequencyMonths,
        next_reminder_date: nextReminderDate
      })

    if (error) {
      logger.error('Error creating reminder:', error)
      toast.error('Failed to create reminder')
      return false
    }

    toast.success('Screening reminder created')
    return true
  } catch (error) {
    logger.error('Error in createScreeningReminder:', error)
    return false
  }
}

/**
 * Update screening reminder
 */
export async function updateScreeningReminder(
  reminderId: string,
  updates: Partial<ScreeningReminder>
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('screening_reminders')
      .update(updates)
      .eq('id', reminderId)

    if (error) {
      logger.error('Error updating reminder:', error)
      return false
    }

    return true
  } catch (error) {
    logger.error('Error in updateScreeningReminder:', error)
    return false
  }
}

/**
 * Get user assessment results
 */
export async function getUserAssessmentResults(): Promise<AssessmentResult[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('user_assessment_results')
      .select('*')
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false })

    if (error) {
      logger.error('Error fetching assessment results:', error)
      return []
    }

    return (data || []) as AssessmentResult[]
  } catch (error) {
    logger.error('Error getting assessment results:', error)
    return []
  }
}

