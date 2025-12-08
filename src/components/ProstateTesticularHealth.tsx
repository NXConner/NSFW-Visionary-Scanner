/**
 * Prostate & Testicular Health Focus Component
 * Educational content, assessments, guides, and screening reminders
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  BookOpen, ClipboardList, Calendar, AlertCircle, Video,
  FileText, Loader2, CheckCircle2, Play
} from 'lucide-react'
import {
  getEducationContent,
  getFeaturedEducationContent,
  getHealthAssessments,
  submitAssessmentResults,
  getSelfExamGuides,
  getScreeningReminders,
  createScreeningReminder,
  getUserAssessmentResults,
  type EducationContent,
  type HealthAssessment,
  type SelfExamGuide,
  type ScreeningReminder,
  type AssessmentResult
} from '@/lib/prostateTesticularHealth'
import { toast } from 'sonner'
import { format } from 'date-fns'

export const ProstateTesticularHealth = () => {
  const [activeTab, setActiveTab] = useState('education')
  const [educationContent, setEducationContent] = useState<EducationContent[]>([])
  const [assessments, setAssessments] = useState<HealthAssessment[]>([])
  const [examGuides, setExamGuides] = useState<SelfExamGuide[]>([])
  const [reminders, setReminders] = useState<ScreeningReminder[]>([])
  const [assessmentResults, setAssessmentResults] = useState<AssessmentResult[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<'prostate' | 'testicular'>('prostate')

  useEffect(() => {
    loadData()
  }, [selectedCategory])

  const loadData = async () => {
    setIsLoading(true)
    const [content, assessmentsData, guides, remindersData, results] = await Promise.all([
      getEducationContent(selectedCategory, 20),
      getHealthAssessments(selectedCategory),
      getSelfExamGuides(selectedCategory === 'prostate' ? 'prostate' : 'testicular'),
      getScreeningReminders(),
      getUserAssessmentResults()
    ])
    setEducationContent(content)
    setAssessments(assessmentsData)
    setExamGuides(guides)
    setReminders(remindersData)
    setAssessmentResults(results)
    setIsLoading(false)
  }

  const handleStartAssessment = async (assessmentId: string) => {
    // This would open an assessment modal/component
    toast.info('Assessment feature coming soon')
  }

  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="education">Education</TabsTrigger>
            <TabsTrigger value="assessments">Assessments</TabsTrigger>
            <TabsTrigger value="guides">Self-Exam Guides</TabsTrigger>
            <TabsTrigger value="reminders">Screening Reminders</TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <Button
              variant={selectedCategory === 'prostate' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('prostate')}
            >
              Prostate
            </Button>
            <Button
              variant={selectedCategory === 'testicular' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('testicular')}
            >
              Testicular
            </Button>
          </div>
        </div>

        <TabsContent value="education" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                {selectedCategory === 'prostate' ? 'Prostate' : 'Testicular'} Health Education
              </CardTitle>
              <CardDescription>
                Comprehensive educational content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                {educationContent.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No educational content available yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {educationContent.map((content) => (
                      <Card key={content.id} className="border">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold">{content.title}</h3>
                                {content.is_featured && (
                                  <Badge variant="default" className="text-xs">
                                    Featured
                                  </Badge>
                                )}
                                {content.is_premium && (
                                  <Badge variant="outline" className="text-xs">
                                    Premium
                                  </Badge>
                                )}
                              </div>
                              {content.summary && (
                                <p className="text-sm text-muted-foreground mb-2">{content.summary}</p>
                              )}
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Badge variant="outline">{content.content_type}</Badge>
                                {content.reading_time_minutes && (
                                  <span>{content.reading_time_minutes} min read</span>
                                )}
                                {content.difficulty_level && (
                                  <Badge variant="outline">{content.difficulty_level}</Badge>
                                )}
                              </div>
                            </div>
                            {content.video_url && (
                              <Button variant="ghost" size="icon">
                                <Play className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assessments" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5" />
                Health Assessments
              </CardTitle>
              <CardDescription>
                Take assessments to evaluate your health
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                {assessments.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No assessments available yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {assessments.map((assessment) => (
                      <Card key={assessment.id} className="border">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h3 className="font-semibold mb-1">{assessment.title}</h3>
                              {assessment.description && (
                                <p className="text-sm text-muted-foreground mb-2">{assessment.description}</p>
                              )}
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">{assessment.category}</Badge>
                                <span className="text-xs text-muted-foreground">
                                  {assessment.questions.length} questions
                                </span>
                              </div>
                            </div>
                          </div>
                          <Button
                            onClick={() => handleStartAssessment(assessment.id)}
                            className="w-full mt-3"
                            variant="gradient"
                          >
                            Start Assessment
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="guides" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Self-Examination Guides
              </CardTitle>
              <CardDescription>
                Step-by-step guides for self-examinations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                {examGuides.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No guides available yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {examGuides.map((guide) => (
                      <Card key={guide.id} className="border">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h3 className="font-semibold mb-2">{guide.title}</h3>
                              {guide.frequency_recommendation && (
                                <Badge variant="outline" className="mb-2">
                                  {guide.frequency_recommendation}
                                </Badge>
                              )}
                            </div>
                            {guide.video_url && (
                              <Button variant="ghost" size="icon">
                                <Video className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                          <div className="space-y-2 mb-3">
                            {guide.step_by_step_instructions.map((step, idx) => (
                              <div key={idx} className="flex items-start gap-2 text-sm">
                                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold shrink-0">
                                  {idx + 1}
                                </div>
                                <p className="text-muted-foreground">{step}</p>
                              </div>
                            ))}
                          </div>
                          {guide.warning_signs.length > 0 && (
                            <div className="mt-3 pt-3 border-t">
                              <div className="flex items-center gap-2 mb-2">
                                <AlertCircle className="w-4 h-4 text-yellow-500" />
                                <span className="text-sm font-medium">Warning Signs:</span>
                              </div>
                              <ul className="space-y-1">
                                {guide.warning_signs.map((sign, idx) => (
                                  <li key={idx} className="text-sm text-muted-foreground">
                                    • {sign}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {guide.when_to_see_doctor && (
                            <div className="mt-3 pt-3 border-t">
                              <div className="text-sm">
                                <span className="font-medium">When to see a doctor:</span>{' '}
                                <span className="text-muted-foreground">{guide.when_to_see_doctor}</span>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reminders" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Screening Reminders
              </CardTitle>
              <CardDescription>
                Manage your health screening reminders
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {reminders.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No reminders set. Create one to get started!</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {reminders.map((reminder) => (
                      <div
                        key={reminder.id}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div className="flex-1">
                          <div className="font-medium capitalize">{reminder.reminder_type.replace('_', ' ')}</div>
                          <div className="text-sm text-muted-foreground">
                            Next: {format(new Date(reminder.next_reminder_date), 'MMM d, yyyy')}
                          </div>
                          {reminder.frequency_months && (
                            <div className="text-xs text-muted-foreground">
                              Every {reminder.frequency_months} months
                            </div>
                          )}
                        </div>
                        <Badge variant={reminder.is_active ? 'default' : 'secondary'}>
                          {reminder.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

