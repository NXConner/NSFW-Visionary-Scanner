import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BookOpen } from "lucide-react";
import type { LearningCourse, LearningEnrollment } from "@/lib/interactiveLearning";

export function MyCoursesTab({
  loading,
  enrollments,
  courses,
  onOpenCourse,
}: {
  loading: boolean;
  enrollments: LearningEnrollment[];
  courses: LearningCourse[];
  onOpenCourse: (course: LearningCourse) => void;
}): JSX.Element {
  return loading ? (
    <div className="text-center py-12 text-muted-foreground">Loading...</div>
  ) : enrollments.length > 0 ? (
    <div className="space-y-4">
      {enrollments.map(enrollment => {
        const course = courses.find(c => c.id === enrollment.course_id);
        if (!course) return null;

        return (
          <button
            key={enrollment.id}
            type="button"
            className="w-full text-left"
            onClick={() => onOpenCourse(course)}
            aria-label={`Open course ${course.title}`}
          >
            <Card variant="glass" className="cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">{course.title}</h3>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Progress</span>
                      <span className="font-semibold">
                        {enrollment.progress_percentage?.toFixed(0) || 0}%
                      </span>
                    </div>
                    <Progress value={enrollment.progress_percentage || 0} className="h-2 mb-2" />
                    <p className="text-xs text-muted-foreground">
                      Last accessed:{" "}
                      {enrollment.last_accessed_at
                        ? new Date(enrollment.last_accessed_at).toLocaleDateString()
                        : "Never"}
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Continue
                  </Button>
                </div>
              </CardContent>
            </Card>
          </button>
        );
      })}
    </div>
  ) : (
    <div className="text-center py-12 text-muted-foreground">
      <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
      <p>You haven't enrolled in any courses yet. Browse courses to get started!</p>
    </div>
  );
}
