export type JsonObject = Record<string, unknown>;

export interface LearningCourse {
  id: string;
  title: string;
  description?: string | null;
  category?: string | null;
  difficulty_level?: string | null;
  estimated_duration_minutes?: number | null;
  module_count?: number | null;
  lesson_count?: number | null;
  thumbnail_url?: string | null;
  intro_video_url?: string | null;
  order_index?: number | null;
  is_featured?: boolean | null;
  is_premium?: boolean | null;
  is_published?: boolean | null;
  enrollment_count?: number | null;
  completion_count?: number | null;
  average_rating?: number | null;
  rating_count?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface LearningModule {
  id: string;
  course_id: string;
  title: string;
  description?: string | null;
  order_index?: number | null;
  estimated_duration_minutes?: number | null;
  lesson_count?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  lessons?: LearningLesson[];
}

export interface LearningLesson {
  id: string;
  module_id: string;
  title: string;
  content_type: string;
  content_data?: JsonObject | null;
  order_index?: number | null;
  estimated_duration_minutes?: number | null;
  requires_completion_of?: string[] | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface LearningEnrollment {
  id: string;
  user_id: string;
  course_id: string;
  progress_percentage?: number | null;
  current_module_id?: string | null;
  current_lesson_id?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  last_accessed_at?: string | null;
  course?: LearningCourse;
}

export interface LearningLessonProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  is_completed?: boolean | null;
  completion_percentage?: number | null;
  time_spent_minutes?: number | null;
  attempts?: number | null;
  completed_at?: string | null;
  last_accessed_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface LearningQuiz {
  id: string;
  lesson_id?: string | null;
  course_id?: string | null;
  title: string;
  description?: string | null;
  quiz_type?: string | null;
  questions: QuizQuestion[];
  passing_score?: number | null;
  time_limit_minutes?: number | null;
  attempt_limit?: number | null;
  show_results_immediately?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface QuizQuestion {
  id: string;
  question_text: string;
  question_type: string;
  options?: string[];
  correct_answer: string | string[];
  explanation?: string;
  points?: number;
}

export interface LearningQuizAttempt {
  id: string;
  user_id: string;
  quiz_id: string;
  answers: Record<string, string | string[]>;
  score?: number | null;
  percentage_score?: number | null;
  passed?: boolean | null;
  time_taken_seconds?: number | null;
  started_at?: string | null;
  completed_at?: string | null;
  created_at?: string | null;
}

export interface LearningCertificate {
  id: string;
  user_id: string;
  course_id: string;
  certificate_number: string;
  certificate_data?: JsonObject | null;
  pdf_url?: string | null;
  issued_at?: string | null;
  created_at?: string | null;
  course?: LearningCourse;
}

export interface LearningPath {
  id?: string;
  user_id?: string;
  name: string;
  description?: string | null;
  path_type?: string | null;
  course_ids: string[];
  current_course_index?: number | null;
  progress_percentage?: number | null;
  started_at?: string | null;
  completed_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}
