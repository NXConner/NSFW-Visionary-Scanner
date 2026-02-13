import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { completeLesson, submitQuizAttempt, type QuizQuestion } from "@/lib/interactiveLearning";
import { useUserRoles } from "@/hooks/useUserRoles";
import { EditLessonDialog } from "@/components/interactiveLearning/admin/EditLessonDialog";
import type { LessonState, QuizAnswers, SelectedCourse } from "../types";
import { buildLessonFallback } from "@/lib/learningFallbacks";

function getQuestionText(q: QuizQuestion): string {
  return q.question_text;
}

export function LessonView({
  lessonState,
  selectedCourse,
  loading,
  onBack,
  onReloadCourse,
  onReloadLists,
}: {
  lessonState: LessonState;
  selectedCourse: SelectedCourse | null;
  loading: boolean;
  onBack: () => void;
  onReloadCourse: (courseId: string) => Promise<void>;
  onReloadLists: () => Promise<void>;
}): JSX.Element {
  const { lesson, quiz } = lessonState;
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const { isAdmin } = useUserRoles();

  const questions = useMemo(() => quiz?.questions || [], [quiz?.questions]);
  const moduleTitle = useMemo(() => {
    const modules = selectedCourse?.modules ?? [];
    return modules.find(m => m.id === lesson.module_id)?.title ?? null;
  }, [lesson.module_id, selectedCourse?.modules]);
  const fallback = useMemo(
    () =>
      buildLessonFallback({
        title: lesson.title,
        contentType: lesson.content_type,
        estimatedMinutes: lesson.estimated_duration_minutes,
        moduleTitle,
      }),
    [lesson.content_type, lesson.estimated_duration_minutes, lesson.title, moduleTitle],
  );

  const handleSubmitQuiz = useCallback(async () => {
    if (!quiz) return;
    const attempt = await submitQuizAttempt(quiz.id!, answers);
    if (!attempt) return;

    // If passed, the library completes the lesson automatically.
    if (attempt.passed) {
      const courseId = selectedCourse?.course.id;
      if (courseId) await onReloadCourse(courseId);
      await onReloadLists();
      onBack();
      return;
    }

    toast.info("Quiz submitted. Review explanations and retry if needed.");
  }, [answers, onBack, onReloadCourse, onReloadLists, quiz, selectedCourse?.course.id]);

  const handleMarkComplete = useCallback(async () => {
    if (!lesson.id) return;
    await completeLesson(lesson.id);
    const courseId = selectedCourse?.course.id;
    if (courseId) await onReloadCourse(courseId);
    await onReloadLists();
    onBack();
  }, [lesson.id, onBack, onReloadCourse, onReloadLists, selectedCourse?.course.id]);

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={onBack}>
        ← Back to Course
      </Button>

      <Card variant="glass">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="text-2xl">{lesson.title}</CardTitle>
            {isAdmin && (
              <EditLessonDialog
                lesson={lesson}
                onSaved={async () => {
                  const courseId = selectedCourse?.course.id;
                  if (courseId) await onReloadCourse(courseId);
                  await onReloadLists();
                }}
              />
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {quiz ? (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Quiz: {quiz.title}</h3>
              {quiz.description && <p className="text-muted-foreground">{quiz.description}</p>}

              <div className="space-y-6">
                {questions.map((q, index) => (
                  <Card key={q.id || String(index)} variant="glass">
                    <CardContent className="p-6">
                      <h4 className="font-semibold mb-4">{getQuestionText(q)}</h4>
                      <div className="space-y-2">
                        {(q.options || []).map((option, optIndex) => {
                          const key = q.id;
                          const checked =
                            typeof answers[key] === "string" ? answers[key] === option : false;
                          return (
                            <label
                              key={`${q.id}-${optIndex}`}
                              className="flex items-center gap-2 p-2 rounded hover:bg-secondary/50 cursor-pointer"
                            >
                              <input
                                type="radio"
                                name={`question-${q.id}`}
                                value={option}
                                checked={checked}
                                onChange={() => setAnswers(prev => ({ ...prev, [key]: option }))}
                              />
                              <span>{option}</span>
                            </label>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Button
                onClick={handleSubmitQuiz}
                disabled={loading}
                className="w-full"
                variant="gradient"
              >
                {loading ? "Submitting..." : "Submit Quiz"}
              </Button>
            </div>
          ) : lesson.content_type === "video" &&
            (lesson.content_data as Record<string, unknown> | null)?.video_url ? (
            <div className="aspect-video rounded-lg overflow-hidden bg-secondary">
              <video
                src={(lesson.content_data as Record<string, unknown>).video_url as string}
                controls
                className="w-full h-full"
              >
                <track kind="captions" srcLang="en" label="English captions" />
              </video>
            </div>
          ) : (lesson.content_data as Record<string, unknown> | null)?.text ? (
            <div className="prose prose-invert max-w-none whitespace-pre-wrap">
              {(lesson.content_data as Record<string, unknown>).text as string}
            </div>
          ) : (
            <div className="space-y-5">
              <p className="text-muted-foreground">{fallback.summary}</p>
              {fallback.sections.map(section => (
                <div key={section.title} className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {section.title}
                  </h4>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    {section.bullets.map(item => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                  {section.note && (
                    <p className="text-xs text-muted-foreground">{section.note}</p>
                  )}
                </div>
              ))}
              {isAdmin && (
                <p className="text-xs text-muted-foreground">
                  Admin note: publish the lesson content to replace this default guidance.
                </p>
              )}
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t">
            <Button variant="outline" onClick={onBack}>
              Back
            </Button>
            <Button onClick={handleMarkComplete} disabled={loading} variant="gradient">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Mark Complete
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
