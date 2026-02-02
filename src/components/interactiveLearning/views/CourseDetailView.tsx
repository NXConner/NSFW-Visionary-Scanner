import { useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Brain, FileText, Play, Video } from "lucide-react";
import {
  getLessonQuiz,
  updateLessonProgress,
  type LearningLesson,
} from "@/lib/interactiveLearning";
import type { LessonState, SelectedCourse } from "../types";

export function CourseDetailView({
  selectedCourse,
  onBack,
  onOpenLesson,
  setLoading,
}: {
  selectedCourse: SelectedCourse;
  onBack: () => void;
  onOpenLesson: (lessonState: LessonState) => void;
  setLoading: (v: boolean) => void;
}): JSX.Element {
  const handleLessonClick = useCallback(
    async (lesson: LearningLesson) => {
      setLoading(true);
      try {
        // Track access (best effort)
        await updateLessonProgress(lesson.id!, {});

        let quiz = null;
        if (lesson.content_type === "quiz" || lesson.content_type === "assessment") {
          quiz = await getLessonQuiz(lesson.id!);
        }
        onOpenLesson({ lesson, quiz });
      } finally {
        setLoading(false);
      }
    },
    [onOpenLesson, setLoading],
  );

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={onBack}>
        ← Back to Courses
      </Button>

      <Card variant="glass">
        <CardHeader>
          <CardTitle className="text-2xl mb-2">{selectedCourse.course.title}</CardTitle>
          <CardDescription>{selectedCourse.course.description}</CardDescription>
          <div className="flex gap-2 mt-4">
            <Badge variant="outline">{selectedCourse.course.category}</Badge>
            {selectedCourse.course.difficulty_level && (
              <Badge variant="outline">{selectedCourse.course.difficulty_level}</Badge>
            )}
          </div>
        </CardHeader>
      </Card>

      <div className="space-y-6">
        {selectedCourse.modules.map(module => {
          const moduleLessons = selectedCourse.lessons.filter(l => l.module_id === module.id);
          return (
            <Card key={module.id} variant="glass">
              <CardHeader>
                <CardTitle>{module.title}</CardTitle>
                <CardDescription>{module.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {moduleLessons.map(lesson => (
                    <button
                      key={lesson.id}
                      type="button"
                      className="w-full flex items-center justify-between p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                      onClick={() => void handleLessonClick(lesson)}
                      aria-label={`Open lesson ${lesson.title}`}
                    >
                      <div className="flex items-center gap-3">
                        {lesson.content_type === "video" ? (
                          <Video className="w-5 h-5 text-primary" />
                        ) : lesson.content_type === "quiz" ||
                          lesson.content_type === "assessment" ? (
                          <Brain className="w-5 h-5 text-primary" />
                        ) : (
                          <FileText className="w-5 h-5 text-primary" />
                        )}
                        <div className="text-left">
                          <p className="font-medium">{lesson.title}</p>
                          {lesson.estimated_duration_minutes && (
                            <p className="text-sm text-muted-foreground">
                              {lesson.estimated_duration_minutes} min
                            </p>
                          )}
                        </div>
                      </div>
                      <span className="inline-flex items-center justify-center rounded-md border border-border/50 bg-background/40 px-2 py-1">
                        <Play className="w-4 h-4" />
                      </span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
