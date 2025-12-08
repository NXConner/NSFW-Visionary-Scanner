/**
 * Expert Content & Consultations Component
 * Complete Phase 5.8 implementation
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  getExpertProfiles,
  getExpertArticles,
  bookConsultation,
  submitExpertQuestion,
  rateExpert,
  type ExpertProfile,
  type ExpertArticle,
  type ExpertConsultation
} from '@/lib/expertContent'
import { ExpertProfileCard } from '@/components/ExpertProfileCard'
import { Calendar, Clock, DollarSign, Star, MessageSquare, Video, Book, Users, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export const ExpertContentConsultations = () => {
  const [activeTab, setActiveTab] = useState('experts')
  const [experts, setExperts] = useState<ExpertProfile[]>([])
  const [articles, setArticles] = useState<ExpertArticle[]>([])
  const [selectedExpert, setSelectedExpert] = useState<ExpertProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [bookingForm, setBookingForm] = useState({
    consultationType: 'individual' as 'individual' | 'group',
    scheduledAt: '',
    durationMinutes: 60
  })
  const [questionForm, setQuestionForm] = useState({
    question: '',
    category: ''
  })

  useEffect(() => {
    loadData()
  }, [activeTab])

  const loadData = async () => {
    setLoading(true)
    try {
      if (activeTab === 'experts') {
        const expertList = await getExpertProfiles()
        setExperts(expertList)
      } else if (activeTab === 'articles') {
        const articleList = await getExpertArticles()
        setArticles(articleList)
      }
    } catch (error) {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleBookConsultation = async () => {
    if (!selectedExpert || !bookingForm.scheduledAt) {
      toast.error('Please fill in all fields')
      return
    }

    const consultation = await bookConsultation(
      selectedExpert.id,
      bookingForm.consultationType,
      bookingForm.scheduledAt,
      bookingForm.durationMinutes
    )

    if (consultation) {
      setBookingForm({
        consultationType: 'individual',
        scheduledAt: '',
        durationMinutes: 60
      })
      toast.success('Consultation booked! Complete payment to confirm.')
    }
  }

  const handleSubmitQuestion = async () => {
    if (!selectedExpert || !questionForm.question) {
      toast.error('Please enter a question')
      return
    }

    const success = await submitExpertQuestion(
      selectedExpert.id,
      questionForm.question,
      questionForm.category || undefined
    )

    if (success) {
      setQuestionForm({ question: '', category: '' })
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-6 h-6" />
            Expert Content & Consultations
          </CardTitle>
          <CardDescription>
            Connect with verified experts, read articles, and book consultations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="experts">Experts</TabsTrigger>
              <TabsTrigger value="articles">Articles</TabsTrigger>
              <TabsTrigger value="book">Book Consultation</TabsTrigger>
              <TabsTrigger value="ask">Ask Question</TabsTrigger>
            </TabsList>

            <TabsContent value="experts" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {experts.map(expert => (
                  <ExpertProfileCard
                    key={expert.id}
                    expert={expert}
                    onBookConsultation={() => setSelectedExpert(expert)}
                    onAskQuestion={() => setSelectedExpert(expert)}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="articles" className="space-y-4">
              <div className="space-y-4">
                {articles.map(article => (
                  <Card key={article.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold">{article.title}</h3>
                        {article.is_featured && (
                          <Badge variant="default">Featured</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-3">
                        {article.content}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{article.view_count} views</span>
                        <span>{article.like_count} likes</span>
                        {article.category && (
                          <Badge variant="outline">{article.category}</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="book" className="space-y-4">
              {selectedExpert ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Book Consultation with {selectedExpert.display_name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Consultation Type</label>
                      <Select
                        value={bookingForm.consultationType}
                        onValueChange={(value) => setBookingForm({ ...bookingForm, consultationType: value as any })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="individual">
                            Individual (${selectedExpert.consultation_rate_per_hour}/hr)
                          </SelectItem>
                          <SelectItem value="group">
                            Group Workshop (${selectedExpert.group_workshop_rate_per_person}/person)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Date & Time</label>
                      <Input
                        type="datetime-local"
                        value={bookingForm.scheduledAt}
                        onChange={(e) => setBookingForm({ ...bookingForm, scheduledAt: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Duration (minutes)</label>
                      <Input
                        type="number"
                        value={bookingForm.durationMinutes}
                        onChange={(e) => setBookingForm({ ...bookingForm, durationMinutes: parseInt(e.target.value) })}
                        min={15}
                        max={120}
                        step={15}
                      />
                    </div>
                    <Button onClick={handleBookConsultation} className="w-full">
                      <Calendar className="w-4 h-4 mr-2" />
                      Book Consultation
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="py-8 text-center">
                    <p className="text-muted-foreground">
                      Please select an expert from the Experts tab first
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="ask" className="space-y-4">
              {selectedExpert ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Ask {selectedExpert.display_name} a Question</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Category (optional)</label>
                      <Input
                        value={questionForm.category}
                        onChange={(e) => setQuestionForm({ ...questionForm, category: e.target.value })}
                        placeholder="e.g., Technique, Health, Relationship"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Your Question</label>
                      <Textarea
                        value={questionForm.question}
                        onChange={(e) => setQuestionForm({ ...questionForm, question: e.target.value })}
                        placeholder="Ask your question here..."
                        rows={6}
                      />
                    </div>
                    <Button onClick={handleSubmitQuestion} className="w-full">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Submit Question
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="py-8 text-center">
                    <p className="text-muted-foreground">
                      Please select an expert from the Experts tab first
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

