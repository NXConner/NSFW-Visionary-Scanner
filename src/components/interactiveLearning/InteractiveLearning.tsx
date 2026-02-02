import { useCallback, useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen } from "lucide-react";
import { toast } from "sonner";
import {
  enrollInCourse,
  getCourseRecommendations,
  getLearningCourse,
  getLearningCourses,
  getUserCertificates,
  getUserEnrollments,
  type LearningCourse,
  type LearningEnrollment,
} from "@/lib/interactiveLearning";
import { CoursesTab } from "./tabs/CoursesTab";
import { MyCoursesTab } from "./tabs/MyCoursesTab";
import { CertificatesTab } from "./tabs/CertificatesTab";
import { CourseDetailView } from "./views/CourseDetailView";
import { LessonView } from "./views/LessonView";
import type { Certificate, InteractiveLearningTab, LessonState, SelectedCourse } from "./types";

export const InteractiveLearning = (): JSX.Element => {
  const [activeTab, setActiveTab] = useState<InteractiveLearningTab>("courses");
  const [loading, setLoading] = useState(false);

  const [courses, setCourses] = useState<LearningCourse[]>([]);
  const [enrollments, setEnrollments] = useState<LearningEnrollment[]>([]);
  const [recommendations, setRecommendations] = useState<LearningCourse[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);

  const [selectedCourse, setSelectedCourse] = useState<SelectedCourse | null>(null);
  const [lessonState, setLessonState] = useState<LessonState | null>(null);

  const reloadCoursesTab = useCallback(async () => {
    const [coursesData, enrollmentsData, recommendationsData] = await Promise.all([
      getLearningCourses(),
      getUserEnrollments(),
      getCourseRecommendations(),
    ]);
    setCourses(coursesData);
    setEnrollments(enrollmentsData);
    setRecommendations(recommendationsData);
  }, []);

  const reloadCertificatesTab = useCallback(async () => {
    const certificatesData = await getUserCertificates();
    setCertificates(certificatesData);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case "courses":
        case "my-courses": {
          await reloadCoursesTab();
          break;
        }
        case "certificates": {
          await Promise.all([reloadCoursesTab(), reloadCertificatesTab()]);
          break;
        }
      }
    } catch {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [activeTab, reloadCertificatesTab, reloadCoursesTab]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const reloadCourse = useCallback(async (courseId: string) => {
    const data = await getLearningCourse(courseId);
    if (!data.course) {
      toast.error("Failed to load course");
      return;
    }
    setSelectedCourse({ course: data.course, modules: data.modules, lessons: data.lessons });
  }, []);

  const handleOpenCourse = useCallback(
    async (course: LearningCourse) => {
      if (!course.id) return;
      setLoading(true);
      try {
        await reloadCourse(course.id);
      } finally {
        setLoading(false);
      }
    },
    [reloadCourse],
  );

  const handleEnroll = useCallback(
    async (courseId: string) => {
      setLoading(true);
      try {
        await enrollInCourse(courseId);
        toast.success("Enrolled in course!");
        await loadData();
      } catch {
        toast.error("Failed to enroll in course");
      } finally {
        setLoading(false);
      }
    },
    [loadData],
  );

  // Lesson view
  if (lessonState) {
    return (
      <LessonView
        lessonState={lessonState}
        selectedCourse={selectedCourse}
        loading={loading}
        onBack={() => setLessonState(null)}
        onReloadCourse={reloadCourse}
        onReloadLists={loadData}
      />
    );
  }

  // Course detail view
  if (selectedCourse) {
    return (
      <CourseDetailView
        selectedCourse={selectedCourse}
        onBack={() => setSelectedCourse(null)}
        onOpenLesson={setLessonState}
        setLoading={setLoading}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
          <BookOpen className="w-4 h-4 text-primary" />
          <span className="text-sm text-primary font-medium">Learning</span>
        </div>
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          <span className="gradient-text">Interactive</span> Learning
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Step-by-step courses, interactive lessons, quizzes, and certificates of completion.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={v => setActiveTab(v as InteractiveLearningTab)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="my-courses">My Courses</TabsTrigger>
          <TabsTrigger value="certificates">Certificates</TabsTrigger>
        </TabsList>

        <TabsContent value="courses" className="space-y-6">
          <CoursesTab
            loading={loading}
            courses={courses}
            enrollments={enrollments}
            recommendations={recommendations}
            onEnroll={id => void handleEnroll(id)}
            onOpenCourse={c => void handleOpenCourse(c)}
          />
        </TabsContent>

        <TabsContent value="my-courses" className="space-y-6">
          <MyCoursesTab
            loading={loading}
            enrollments={enrollments}
            courses={courses}
            onOpenCourse={c => void handleOpenCourse(c)}
          />
        </TabsContent>

        <TabsContent value="certificates" className="space-y-6">
          <CertificatesTab loading={loading} certificates={certificates} courses={courses} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
