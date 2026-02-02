import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Clock, TrendingUp, Users } from "lucide-react";
import type { LearningCourse, LearningEnrollment } from "@/lib/interactiveLearning";

export function CoursesTab({
  loading,
  courses,
  enrollments,
  recommendations,
  onEnroll,
  onOpenCourse,
}: {
  loading: boolean;
  courses: LearningCourse[];
  enrollments: LearningEnrollment[];
  recommendations: LearningCourse[];
  onEnroll: (courseId: string) => void;
  onOpenCourse: (course: LearningCourse) => void;
}): JSX.Element {
  const enrollmentByCourseId = useMemo(() => {
    const map = new Map<string, LearningEnrollment>();
    enrollments.forEach(e => map.set(e.course_id, e));
    return map;
  }, [enrollments]);

  const getProgress = (courseId: string) =>
    enrollmentByCourseId.get(courseId)?.progress_percentage || 0;
  const isEnrolled = (courseId: string) => enrollmentByCourseId.has(courseId);

  return (
    <div className="space-y-6">
      {recommendations.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Recommended for You
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {recommendations.slice(0, 3).map(course => (
              <Card key={course.id} variant="glass" className="border-primary/50">
                <CardHeader>
                  <CardTitle className="text-lg">{course.title}</CardTitle>
                  <CardDescription>{course.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => onEnroll(course.id!)}
                    className="w-full"
                    variant="gradient"
                  >
                    Enroll Now
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <h3 className="text-xl font-semibold mb-4">All Courses</h3>
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : courses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map(course => {
            const progress = getProgress(course.id!);
            const enrolled = isEnrolled(course.id!);

            return (
              <button
                key={course.id}
                type="button"
                className="text-left"
                onClick={() => onOpenCourse(course)}
                aria-label={`Open course ${course.title}`}
              >
                <Card variant="glass" className="hover:border-primary/50 transition-colors">
                  {course.thumbnail_url && (
                    <div className="aspect-video bg-secondary rounded-t-lg overflow-hidden">
                      <img
                        src={course.thumbnail_url}
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg line-clamp-2">{course.title}</CardTitle>
                      {course.is_featured && <Badge className="bg-yellow-500">Featured</Badge>}
                    </div>
                    <CardDescription className="line-clamp-2">{course.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {enrolled && progress > 0 && (
                        <div>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span>Progress</span>
                            <span>{progress.toFixed(0)}%</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                        </div>
                      )}
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {course.estimated_duration_minutes || 0} min
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {course.enrollment_count || 0}
                        </div>
                      </div>
                      {enrolled ? (
                        <Button variant="outline" className="w-full">
                          Continue Learning
                        </Button>
                      ) : (
                        <Button
                          onClick={e => {
                            e.stopPropagation();
                            onEnroll(course.id!);
                          }}
                          className="w-full"
                          variant="gradient"
                        >
                          Enroll
                        </Button>
                      )}
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
          <p>No courses available yet. Check back soon!</p>
        </div>
      )}
    </div>
  );
}
