/**
 * Enhanced Diary Features
 * Handles symptom tracking, medication tracking, mood tracking, energy levels, sleep, diet, exercise, photo diary, voice notes, and diary templates
 */

import { supabase } from '@/integrations/supabase/client'
import { logger } from './logger'
import { toast } from 'sonner'

// ==================== Enhanced Diary Entries ====================

export interface EnhancedDiaryEntry {
  id: string
  user_id: string
  base_entry_id: string | null
  entry_date: string
  entry_time: string | null
  symptoms: any[] | null
  symptom_count: number
  medications: any[] | null
  medication_count: number
  mood_score: number | null
  mood_label: 'excellent' | 'good' | 'okay' | 'poor' | 'terrible' | null
  mood_notes: string | null
  mood_tags: string[] | null
  energy_level: number | null
  energy_notes: string | null
  sleep_hours: number | null
  sleep_quality: number | null
  sleep_start_time: string | null
  sleep_end_time: string | null
  sleep_notes: string | null
  sleep_interruptions: number
  meals: any[] | null
  total_calories: number | null
  water_intake_ml: number | null
  diet_notes: string | null
  exercises: any[] | null
  total_exercise_minutes: number | null
  exercise_notes: string | null
  photos: any[] | null
  photo_count: number
  voice_notes: any[] | null
  voice_note_count: number
  notes: string | null
  tags: string[] | null
  weather: string | null
  temperature_celsius: number | null
  location: string | null
  is_private: boolean
  created_at: string
  updated_at: string
}

export async function createEnhancedDiaryEntry(
  entryDate: string,
  entryData: Partial<EnhancedDiaryEntry>
): Promise<EnhancedDiaryEntry | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in to create diary entry')
      return null
    }

    // Calculate counts
    const symptomCount = entryData.symptoms?.length || 0
    const medicationCount = entryData.medications?.length || 0
    const photoCount = entryData.photos?.length || 0
    const voiceNoteCount = entryData.voice_notes?.length || 0

    const { data, error } = await supabase
      .from('enhanced_diary_entries')
      .insert({
        user_id: user.id,
        entry_date: entryDate,
        ...entryData,
        symptom_count: symptomCount,
        medication_count: medicationCount,
        photo_count: photoCount,
        voice_note_count: voiceNoteCount
      })
      .select()
      .single()

    if (error) {
      logger.error('Error creating diary entry:', error)
      toast.error('Failed to create diary entry')
      return null
    }

    toast.success('Diary entry created!')
    return data as EnhancedDiaryEntry
  } catch (error) {
    logger.error('Error in createEnhancedDiaryEntry:', error)
    return null
  }
}

export async function getEnhancedDiaryEntries(
  startDate?: string,
  endDate?: string
): Promise<EnhancedDiaryEntry[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    let query = supabase
      .from('enhanced_diary_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('entry_date', { ascending: false })

    if (startDate) {
      query = query.gte('entry_date', startDate)
    }
    if (endDate) {
      query = query.lte('entry_date', endDate)
    }

    const { data, error } = await query

    if (error) {
      logger.error('Error fetching diary entries:', error)
      return []
    }

    return (data || []) as EnhancedDiaryEntry[]
  } catch (error) {
    logger.error('Error in getEnhancedDiaryEntries:', error)
    return []
  }
}

export async function searchDiaryEntries(searchQuery: string): Promise<EnhancedDiaryEntry[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    // Use full-text search
    const { data, error } = await supabase
      .from('diary_search_index')
      .select('entry_id, searchable_text')
      .eq('user_id', user.id)
      .textSearch('search_vector', searchQuery)
      .limit(50)

    if (error) {
      logger.error('Error searching diary:', error)
      return []
    }

    if (!data || data.length === 0) return []

    // Get full entries
    const entryIds = data.map(d => d.entry_id)
    const { data: entries, error: entriesError } = await supabase
      .from('enhanced_diary_entries')
      .select('*')
      .in('id', entryIds)

    if (entriesError) {
      logger.error('Error fetching entries:', entriesError)
      return []
    }

    return (entries || []) as EnhancedDiaryEntry[]
  } catch (error) {
    logger.error('Error in searchDiaryEntries:', error)
    return []
  }
}

// ==================== Diary Templates ====================

export interface DiaryTemplate {
  id: string
  user_id: string | null
  template_name: string
  description: string | null
  category: 'daily' | 'weekly' | 'health_focus' | 'symptom_tracking' | 'medication' | 'exercise' | 'custom' | null
  template_config: any
  required_fields: string[] | null
  optional_fields: string[] | null
  default_values: any
  usage_count: number
  is_default: boolean
  is_shared: boolean
  created_at: string
  updated_at: string
}

export async function getDiaryTemplates(category?: DiaryTemplate['category']): Promise<DiaryTemplate[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    let query = supabase
      .from('diary_templates')
      .select('*')
      .or(`user_id.eq.${user.id},is_shared.eq.true,user_id.is.null`)
      .order('is_default', { ascending: false })
      .order('usage_count', { ascending: false })

    if (category) {
      query = query.eq('category', category)
    }

    const { data, error } = await query

    if (error) {
      logger.error('Error fetching templates:', error)
      return []
    }

    return (data || []) as DiaryTemplate[]
  } catch (error) {
    logger.error('Error in getDiaryTemplates:', error)
    return []
  }
}

// ==================== Medication Schedules ====================

export interface MedicationSchedule {
  id: string
  user_id: string
  medication_name: string
  dosage: string
  frequency: string
  times_per_day: number | null
  specific_times: string[] | null
  days_of_week: number[] | null
  start_date: string | null
  end_date: string | null
  is_active: boolean
  reminder_enabled: boolean
  reminder_minutes_before: number
  total_doses: number
  missed_doses: number
  adherence_percentage: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

export async function createMedicationSchedule(
  medicationName: string,
  dosage: string,
  frequency: string,
  scheduleData: Partial<MedicationSchedule>
): Promise<MedicationSchedule | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in to create medication schedule')
      return null
    }

    const { data, error } = await supabase
      .from('medication_schedules')
      .insert({
        user_id: user.id,
        medication_name: medicationName,
        dosage,
        frequency,
        ...scheduleData
      })
      .select()
      .single()

    if (error) {
      logger.error('Error creating medication schedule:', error)
      toast.error('Failed to create schedule')
      return null
    }

    toast.success('Medication schedule created!')
    return data as MedicationSchedule
  } catch (error) {
    logger.error('Error in createMedicationSchedule:', error)
    return null
  }
}

export async function logMedicationTaken(
  scheduleId: string,
  takenAt: string,
  wasOnTime: boolean = true
): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in to log medication')
      return false
    }

    // Get schedule
    const { data: schedule } = await supabase
      .from('medication_schedules')
      .select('medication_name, dosage')
      .eq('id', scheduleId)
      .single()

    if (!schedule) {
      toast.error('Schedule not found')
      return false
    }

    // Log medication
    const { error } = await supabase
      .from('medication_log')
      .insert({
        schedule_id: scheduleId,
        user_id: user.id,
        medication_name: schedule.medication_name,
        dosage: schedule.dosage,
        taken_at: takenAt,
        was_on_time: wasOnTime,
        was_missed: false
      })

    if (error) {
      logger.error('Error logging medication:', error)
      toast.error('Failed to log medication')
      return false
    }

    // Update schedule statistics
    await supabase.rpc('increment', {
      table_name: 'medication_schedules',
      column_name: 'total_doses',
      id: scheduleId
    })

    toast.success('Medication logged!')
    return true
  } catch (error) {
    logger.error('Error in logMedicationTaken:', error)
    return false
  }
}

// ==================== Diary Analytics ====================

export interface DiaryAnalytics {
  id: string
  user_id: string
  analysis_period_start: string
  analysis_period_end: string
  total_entries: number
  entries_with_symptoms: number
  entries_with_medications: number
  entries_with_photos: number
  entries_with_voice_notes: number
  average_mood_score: number | null
  average_energy_level: number | null
  average_sleep_hours: number | null
  average_sleep_quality: number | null
  total_calories: number | null
  total_water_intake_ml: number | null
  total_exercise_minutes: number | null
  most_common_symptoms: any
  most_common_moods: string[] | null
  activity_patterns: any
  mood_trend: 'improving' | 'stable' | 'declining' | 'fluctuating' | null
  energy_trend: string | null
  sleep_trend: string | null
  insights: string[] | null
  recommendations: string[] | null
  calculated_at: string
  created_at: string
}

export async function generateDiaryAnalytics(
  startDate: string,
  endDate: string
): Promise<DiaryAnalytics | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    // Call analytics generation Edge Function
    const { data, error } = await supabase.functions.invoke('generate-diary-analytics', {
      body: {
        start_date: startDate,
        end_date: endDate
      }
    })

    if (error) {
      logger.error('Error generating analytics:', error)
      return null
    }

    // Save analytics
    const { data: analytics, error: saveError } = await supabase
      .from('diary_analytics')
      .insert({
        user_id: user.id,
        analysis_period_start: startDate,
        analysis_period_end: endDate,
        ...data
      })
      .select()
      .single()

    if (saveError) {
      logger.error('Error saving analytics:', saveError)
      return null
    }

    return analytics as DiaryAnalytics
  } catch (error) {
    logger.error('Error in generateDiaryAnalytics:', error)
    return null
  }
}

