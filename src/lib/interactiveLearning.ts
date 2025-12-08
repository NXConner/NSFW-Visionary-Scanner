/**
 * Interactive Learning Modules System
 * Manages step-by-step courses, quizzes, assessments, progress tracking, and certificates
 */

import { supabase } from '@/integrations/supabase/client'
import { logger } from './logger'

export interface LearningCourse {
  id?: string
  title: string
  description?: string
  category?: string
  difficulty_level?: 'beginner' | 'intermediate' | 'advanced'
  estimated_duration_minutes?: number
  module_count?: number
  lesson_count?: number
  thumbnail_url?: string
  intro_video_url?: string
  order_index?: number
  is_featured?: boolean
  is_premium?: boolean
  enrollment_count?: number
  completion_count?: number
  average_rating?: number
  rating_count?: number
  created_at?: string
  updated_at?: string
}

export interface LearningModule {
  id?: string
  course_id: string
  title: string
  description?: string
  order_index?: number
  estimated_duration_minutes?: number
  lesson_count?: number
  created_at?: string
  updated_at?: string
}

export interface LearningLesson {
  id?: string
  module_id: string
  title: string
  content_type: 'text' | 'video' | 'interactive' | 'quiz' | 'assessment'
  content_data?: any
  order_index?: number
  estimated_duration_minutes?: number
  requires_completion_of?: string[]
  created_at?: string
  updated_at?: string
}

export interface LearningEnrollment {
  id?: string
  user_id?: string
  course_id: string
  progress_percentage?: number
  current_module_id?: string
  current_lesson_id?: string
  started_at?: string
  completed_at?: string
  last_accessed_at?: string
}

export interface LearningLessonProgress {
  id?: string
  user_id?: string
  lesson_id: string
  is_completed?: boolean
  completion_percentage?: number
  time_spent_minutes?: number
  attempts?: number
  completed_at?: string
  last_accessed_at?: string
}

export interface LearningQuiz {
  id?: string
  lesson_id?: string
  course_id?: string
  title: string
  description?: string
  quiz_type?: 'quiz' | 'assessment' | 'exam' | 'practice'
  questions: any
  passing_score?: number
  time_limit_minutes?: number
  attempt_limit?: number
  show_results_immediately?: boolean
  created_at?: string
  updated_at?: string
}

export interface LearningQuizAttempt {
  id?: string
  user_id?: string
  quiz_id: string
  answers: any
  score?: number
  percentage_score?: number
  passed?: boolean
  time_taken_seconds?: number
  started_at?: string
  completed_at?: string
  created_at?: string
}

export interface LearningCertificate {
  id?: string
  user_id?: string
  course_id: string
  certificate_number: string
  issued_at?: string
  pdf_url?: string
  created_at?: string
}

/**
 * Get learning courses
 */
export async function getLearningCourses(
  category?: string,
  featured?: boolean
): Promise<LearningCourse[]> {
  try {
    let query = supabase
      .from('learning_courses')
      .select('*')
      .order('is_featured', { ascending: false })
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: false })

    if (category) {
      query = query.eq('category', category)
    }
    if (featured) {
      query = query.eq('is_featured', true)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  } catch (error) {
    logger.error('Failed to get learning courses', { error })
    throw error
  }
}

/**
 * Get a single course with modules and lessons
 */
export async function getLearningCourse(courseId: string): Promise<{
  course: LearningCourse | null
  modules: LearningModule[]
  lessons: LearningLesson[]
}> {
  try {
    const { data: course, error: courseError } = await supabase
      .from('learning_courses')
      .select('*')
      .eq('id', courseId)
      .single()

    if (courseError) throw courseError

    const { data: modules, error: modulesError } = await supabase
      .from('learning_modules')
      .select('*')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true })

    if (modulesError) throw modulesError

    const moduleIds = modules?.map(m => m.id) || []
    let lessons: LearningLesson[] = []

    if (moduleIds.length > 0) {
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('learning_lessons')
        .select('*')
        .in('module_id', moduleIds)
        .order('order_index', { ascending: true })

      if (lessonsError) throw lessonsError
      lessons = lessonsData || []
    }

    return {
      course: course || null,
      modules: modules || [],
      lessons: lessons
    }
  } catch (error) {
    logger.error('Failed to get learning course', { error, courseId })
    throw error
  }
}

/**
 * Enroll in a course
 */
export async function enrollInCourse(courseId: string): Promise<LearningEnrollment> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('learning_enrollments')
      .insert({
        user_id: user.id,
        course_id: courseId,
        progress_percentage: 0,
      })
      .select()
      .single()

    if (error) throw error

    logger.info('Enrolled in course', { courseId, enrollmentId: data.id })
    return data
  } catch (error) {
    logger.error('Failed to enroll in course', { error, courseId })
    throw error
  }
}

/**
 * Get user's course enrollments
 */
export async function getUserEnrollments(): Promise<LearningEnrollment[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('learning_enrollments')
      .select('*')
      .eq('user_id', user.id)
      .order('last_accessed_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    logger.error('Failed to get user enrollments', { error })
    throw error
  }
}

/**
 * Update lesson progress
 */
export async function updateLessonProgress(
  lessonId: string,
  progress: Partial<LearningLessonProgress>
): Promise<LearningLessonProgress> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('learning_lesson_progress')
      .upsert({
        user_id: user.id,
        lesson_id: lessonId,
        ...progress,
        last_accessed_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,lesson_id',
        ignoreDuplicates: false
      })
      .select()
      .single()

    if (error) throw error

    // Update course enrollment progress if lesson is completed
    if (progress.is_completed) {
      // Calculate overall course progress
      // This would need to query all lessons in the course
    }

    return data
  } catch (error) {
    logger.error('Failed to update lesson progress', { error, lessonId })
    throw error
  }
}

/**
 * Complete a lesson
 */
export async function completeLesson(lessonId: string): Promise<void> {
  try {
    await updateLessonProgress(lessonId, {
      is_completed: true,
      completion_percentage: 100,
      completed_at: new Date().toISOString(),
    })
  } catch (error) {
    logger.error('Failed to complete lesson', { error, lessonId })
    throw error
  }
}

/**
 * Get quiz for a lesson
 */
export async function getLessonQuiz(lessonId: string): Promise<LearningQuiz | null> {
  try {
    const { data, error } = await supabase
      .from('learning_quizzes')
      .select('*')
      .eq('lesson_id', lessonId)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data || null
  } catch (error) {
    logger.error('Failed to get lesson quiz', { error, lessonId })
    return null
  }
}

/**
 * Submit quiz attempt
 */
export async function submitQuizAttempt(
  quizId: string,
  answers: any,
  timeTakenSeconds?: number
): Promise<LearningQuizAttempt> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Get quiz to calculate score
    const { data: quiz, error: quizError } = await supabase
      .from('learning_quizzes')
      .select('*')
      .eq('id', quizId)
      .single()

    if (quizError) throw quizError

    // Calculate score (simplified - would need proper scoring logic)
    const passingScore = quiz.passing_score || 70
    const score = calculateQuizScore(quiz.questions, answers)
    const percentageScore = score
    const passed = percentageScore >= passingScore

    const { data, error } = await supabase
      .from('learning_quiz_attempts')
      .insert({
        user_id: user.id,
        quiz_id: quizId,
        answers,
        score,
        percentage_score: percentageScore,
        passed,
        time_taken_seconds: timeTakenSeconds,
        completed_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error

    logger.info('Quiz attempt submitted', { quizId, score, passed })
    return data
  } catch (error) {
    logger.error('Failed to submit quiz attempt', { error, quizId })
    throw error
  }
}

/**
 * Calculate quiz score (simplified)
 */
function calculateQuizScore(questions: any[], answers: any): number {
  if (!questions || questions.length === 0) return 0

  let correct = 0
  questions.forEach((question, index) => {
    const userAnswer = answers[index]
    const correctAnswer = question.correct_answer

    if (userAnswer === correctAnswer) {
      correct++
    }
  })

  return (correct / questions.length) * 100
}

/**
 * Get user's certificates
 */
export async function getUserCertificates(): Promise<LearningCertificate[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('learning_certificates')
      .select('*')
      .eq('user_id', user.id)
      .order('issued_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    logger.error('Failed to get user certificates', { error })
    throw error
  }
}

/**
 * Get course recommendations
 */
export async function getCourseRecommendations(): Promise<LearningCourse[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('learning_recommendations')
      .select(`
        course_id,
        recommendation_reason,
        confidence_score,
        course:learning_courses(*)
      `)
      .eq('user_id', user.id)
      .eq('is_viewed', false)
      .order('priority', { ascending: false })
      .order('confidence_score', { ascending: false })
      .limit(10)

    if (error) throw error
    return (data || []).map((item: any) => item.course).filter(Boolean)
  } catch (error) {
    logger.error('Failed to get course recommendations', { error })
    throw error
  }
}


