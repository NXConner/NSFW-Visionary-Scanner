export type CourseSeed = {
  key: string;
  title: string;
  description: string;
  category: string;
  difficulty_level: "beginner" | "intermediate" | "advanced";
  estimated_duration_minutes: number;
  order_index: number;
  is_featured?: boolean;
};

export type ModuleSeed = {
  key: string;
  courseKey: string;
  title: string;
  description: string;
  order_index: number;
  estimated_duration_minutes: number;
};

export type LessonSeed = {
  key: string;
  moduleKey: string;
  title: string;
  order_index: number;
  estimated_duration_minutes: number;
  content_type: "text";
  content_data: { text: string; checklist?: string[]; deliverables?: string[] };
};

export type QuizSeed = {
  courseKey: string;
  lessonKey: string;
  title: string;
  description: string;
  questions: Array<{
    id: string;
    question_text: string;
    question_type: "multiple_choice";
    options: string[];
    correct_answer: string;
    explanation: string;
    points: number;
  }>;
};
