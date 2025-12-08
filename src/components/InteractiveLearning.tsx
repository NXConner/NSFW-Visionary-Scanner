import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  getLearningCourses,
  getLearningCourse,
  enrollInCourse,
  getUserEnrollments,
  updateLessonProgress,
  completeLesson,
  getLessonQuiz,
  submitQuizAttempt,
  getUserCertificates,
  getCourseRecommendations,
  type LearningCourse,
  type LearningModule,
  type LearningLesson,
  type LearningEnrollment,
  type LearningQuiz,
  type LearningQuizAttempt
} from '@/lib/interactiveLearning'
import { BookOpen, Play, CheckCircle2, Award, Clock, Users, Star, TrendingUp, FileText, Video, Brain } from 'lucide-react'
import { toast } from 'sonner'

export const InteractiveLearning = () => {
  const [activeTab, setActiveTab] = useState('courses')
  const [loading, setLoading] = useState(false)
  const [courses, setCourses] = useState<LearningCourse[]>([])
  const [enrollments, setEnrollments] = useState<LearningEnrollment[]>([])
  const [selectedCourse, setSelectedCourse] = useState<{
    course: LearningCourse
    modules: LearningModule[]
    lessons: LearningLesson[]
  } | null>(null)
  const [selectedLesson, setSelectedLesson] = useState<LearningLesson | null>(null)
  const [currentQuiz, setCurrentQuiz] = useState<LearningQuiz | null>(null)
  const [quizAnswers, setQuizAnswers] = useState<any>({})
  const [certificates, setCertificates] = useState<any[]>([])
  const [recommendations, setRecommendations] = useState<LearningCourse[]>([])

  useEffect(() => {
    loadData()
  }, [activeTab])

  const loadData = async () => {
    setLoading(true)
    try {
      switch (activeTab) {
        case 'courses': {
          const coursesData = await getLearningCourses()
          setCourses(coursesData)
          const enrollmentsData = await getUserEnrollments()
          setEnrollments(enrollmentsData)
          const recommendationsData = await getCourseRecommendations()
          setRecommendations(recommendationsData)
          break
        }
        case 'certificates': {
          const certificatesData = await getUserCertificates()
          setCertificates(certificatesData)
          break
        }
      }
    } catch (error) {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleEnroll = async (courseId: string) => {
    setLoading(true)
    try {
      await enrollInCourse(courseId)
      toast.success('Enrolled in course!')
      await loadData()
    } catch (error) {
      toast.error('Failed to enroll in course')
    } finally {
      setLoading(false)
    }
  }

  const handleCourseClick = async (course: LearningCourse) => {
    setLoading(true)
    try {
      const courseData = await getLearningCourse(course.id!)
      setSelectedCourse(courseData)
    } catch (error) {
      toast.error('Failed to load course')
    } finally {
      setLoading(false)
    }
  }

  const handleLessonClick = async (lesson: LearningLesson) => {
    setSelectedLesson(lesson)
    // Load quiz if lesson has one
    if (lesson.content_type === 'quiz' || lesson.content_type === 'assessment') {
      const quiz = await getLessonQuiz(lesson.id!)
      if (quiz) {
        setCurrentQuiz(quiz)
      }
    }
  }

  const handleCompleteLesson = async () => {
    if (!selectedLesson) return

    setLoading(true)
    try {
      await completeLesson(selectedLesson.id!)
      toast.success('Lesson completed!')
      setSelectedLesson(null)
      if (selectedCourse) {
        const courseData = await getLearningCourse(selectedCourse.course.id!)
        setSelectedCourse(courseData)
      }
      await loadData()
    } catch (error) {
      toast.error('Failed to complete lesson')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitQuiz = async () => {
    if (!currentQuiz) return

    setLoading(true)
    try {
      const attempt = await submitQuizAttempt(currentQuiz.id!, quizAnswers)
      toast.success(attempt.passed ? 'Quiz passed!' : 'Quiz completed. Review your answers.')
      setCurrentQuiz(null)
      setQuizAnswers({})
      await handleCompleteLesson()
    } catch (error) {
      toast.error('Failed to submit quiz')
    } finally {
      setLoading(false)
    }
  }

  const getEnrollmentProgress = (courseId: string): number => {
    const enrollment = enrollments.find(e => e.course_id === courseId)
    return enrollment?.progress_percentage || 0
  }

  const isEnrolled = (courseId: string): boolean => {
    return enrollments.some(e => e.course_id === courseId)
  }

  if (selectedLesson) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => setSelectedLesson(null)}>
          ← Back to Course
        </Button>

        <Card variant="glass">
          <CardHeader>
            <CardTitle className="text-2xl">{selectedLesson.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {currentQuiz ? (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">Quiz: {currentQuiz.title}</h3>
                {currentQuiz.description && (
                  <p className="text-muted-foreground">{currentQuiz.description}</p>
                )}
                <div className="space-y-6">
                  {currentQuiz.questions?.map((question: any, index: number) => (
                    <Card key={index} variant="glass">
                      <CardContent className="p-6">
                        <h4 className="font-semibold mb-4">{question.question}</h4>
                        <div className="space-y-2">
                          {question.options?.map((option: string, optIndex: number) => (
                            <label key={optIndex} className="flex items-center gap-2 p-2 rounded hover:bg-secondary/50 cursor-pointer">
                              <input
                                type="radio"
                                name={`question-${index}`}
                                value={optIndex}
                                checked={quizAnswers[index] === optIndex}
                                onChange={() => setQuizAnswers({ ...quizAnswers, [index]: optIndex })}
                              />
                              <span>{option}</span>
                            </label>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <Button onClick={handleSubmitQuiz} disabled={loading} className="w-full" variant="gradient">
                  {loading ? 'Submitting...' : 'Submit Quiz'}
                </Button>
              </div>
            ) : selectedLesson.content_type === 'video' && selectedLesson.content_data?.video_url ? (
              <div className="aspect-video rounded-lg overflow-hidden bg-secondary">
                <video
                  src={selectedLesson.content_data.video_url}
                  controls
                  className="w-full h-full"
                />
              </div>
            ) : selectedLesson.content_data?.text ? (
              <div className="prose prose-invert max-w-none whitespace-pre-wrap">
                {selectedLesson.content_data.text}
              </div>
            ) : (
              <p className="text-muted-foreground">Content coming soon...</p>
            )}

            <div className="flex items-center justify-between pt-4 border-t">
              <Button variant="outline" onClick={() => setSelectedLesson(null)}>
                Back
              </Button>
              <Button onClick={handleCompleteLesson} disabled={loading} variant="gradient">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Mark Complete
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (selectedCourse) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => setSelectedCourse(null)}>
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
            const moduleLessons = selectedCourse.lessons.filter(l => l.module_id === module.id)
            
            return (
              <Card key={module.id} variant="glass">
                <CardHeader>
                  <CardTitle>{module.title}</CardTitle>
                  <CardDescription>{module.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {moduleLessons.map(lesson => (
                      <div
                        key={lesson.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 cursor-pointer hover:bg-secondary transition-colors"
                        onClick={() => handleLessonClick(lesson)}
                      >
                        <div className="flex items-center gap-3">
                          {lesson.content_type === 'video' ? (
                            <Video className="w-5 h-5 text-primary" />
                          ) : lesson.content_type === 'quiz' ? (
                            <Brain className="w-5 h-5 text-primary" />
                          ) : (
                            <FileText className="w-5 h-5 text-primary" />
                          )}
                          <div>
                            <p className="font-medium">{lesson.title}</p>
                            {lesson.estimated_duration_minutes && (
                              <p className="text-sm text-muted-foreground">
                                {lesson.estimated_duration_minutes} min
                              </p>
                            )}
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Play className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    )
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

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="my-courses">My Courses</TabsTrigger>
          <TabsTrigger value="certificates">Certificates</TabsTrigger>
        </TabsList>

        {/* Courses Tab */}
        <TabsContent value="courses" className="space-y-6">
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
                        onClick={() => handleEnroll(course.id!)}
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
                const progress = getEnrollmentProgress(course.id!)
                const enrolled = isEnrolled(course.id!)
                
                return (
                  <Card
                    key={course.id}
                    variant="glass"
                    className="cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => handleCourseClick(course)}
                  >
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
                        {course.is_featured && (
                          <Badge className="bg-yellow-500">Featured</Badge>
                        )}
                      </div>
                      <CardDescription className="line-clamp-2">
                        {course.description}
                      </CardDescription>
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
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEnroll(course.id!)
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
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No courses available yet. Check back soon!</p>
            </div>
          )}
        </TabsContent>

        {/* My Courses Tab */}
        <TabsContent value="my-courses" className="space-y-6">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading...</div>
          ) : enrollments.length > 0 ? (
            <div className="space-y-4">
              {enrollments.map(enrollment => {
                const course = courses.find(c => c.id === enrollment.course_id)
                if (!course) return null

                return (
                  <Card key={enrollment.id} variant="glass" className="cursor-pointer" onClick={() => handleCourseClick(course)}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-2">{course.title}</h3>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-muted-foreground">Progress</span>
                            <span className="font-semibold">{enrollment.progress_percentage?.toFixed(0) || 0}%</span>
                          </div>
                          <Progress value={enrollment.progress_percentage || 0} className="h-2 mb-2" />
                          <p className="text-xs text-muted-foreground">
                            Last accessed: {enrollment.last_accessed_at ? new Date(enrollment.last_accessed_at).toLocaleDateString() : 'Never'}
                          </p>
                        </div>
                        <Button variant="outline" size="sm">
                          Continue
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>You haven't enrolled in any courses yet. Browse courses to get started!</p>
            </div>
          )}
        </TabsContent>

        {/* Certificates Tab */}
        <TabsContent value="certificates" className="space-y-6">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading...</div>
          ) : certificates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {certificates.map(cert => {
                const course = courses.find(c => c.id === cert.course_id)
                
                return (
                  <Card key={cert.id} variant="glass">
                    <CardHeader>
                      <div className="flex items-center gap-2 mb-2">
                        <Award className="w-6 h-6 text-yellow-500" />
                        <CardTitle>Certificate of Completion</CardTitle>
                      </div>
                      <CardDescription>{course?.title}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        Certificate Number: {cert.certificate_number}
                      </p>
                      <p className="text-sm text-muted-foreground mb-4">
                        Issued: {new Date(cert.issued_at!).toLocaleDateString()}
                      </p>
                      {cert.pdf_url && (
                        <Button variant="outline" className="w-full" asChild>
                          <a href={cert.pdf_url} target="_blank" rel="noopener noreferrer">
                            Download Certificate
                          </a>
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Award className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No certificates yet. Complete courses to earn certificates!</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}


