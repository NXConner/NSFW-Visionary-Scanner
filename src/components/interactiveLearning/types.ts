import type {
  LearningCourse,
  LearningLesson,
  LearningModule,
  LearningQuiz,
  LearningCertificate,
} from "@/lib/interactiveLearning";

export type InteractiveLearningTab = "courses" | "my-courses" | "certificates";

export type SelectedCourse = {
  course: LearningCourse;
  modules: LearningModule[];
  lessons: LearningLesson[];
};

export type LessonState = {
  lesson: LearningLesson;
  quiz: LearningQuiz | null;
};

export type QuizAnswers = Record<string, string | string[]>;

export type Certificate = LearningCertificate;
