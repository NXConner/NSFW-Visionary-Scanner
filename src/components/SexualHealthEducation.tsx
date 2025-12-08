import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  getEducationModules,
  getEducationModule,
  getInteractiveContent,
  getUserProgress,
  updateUserProgress,
  completeModule,
  getEducationQA,
  markQAHelpful,
  getExpertContent,
  getResearchUpdates,
  getUserEducationCompletion,
  bookmarkContent,
  getBookmarks,
  type EducationModule,
  type UserProgress,
  type EducationQA,
  type ExpertContent,
  type ResearchUpdate
} from '@/lib/sexualHealthEducation'
import { BookOpen, Search, Play, CheckCircle2, Clock, Star, Bookmark, BookmarkCheck, Users, TrendingUp, FileText, Video, Brain } from 'lucide-react'
import { toast } from 'sonner'

export const SexualHealthEducation = () => {
  const [activeTab, setActiveTab] = useState('modules')
  const [loading, setLoading] = useState(false)
  const [modules, setModules] = useState<EducationModule[]>([])
  const [selectedModule, setSelectedModule] = useState<EducationModule | null>(null)
  const [progress, setProgress] = useState<UserProgress[]>([])
  const [qa, setQA] = useState<EducationQA[]>([])
  const [expertContent, setExpertContent] = useState<ExpertContent[]>([])
  const [researchUpdates, setResearchUpdates] = useState<ResearchUpdate[]>([])
  const [completionPercentage, setCompletionPercentage] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const categories = [
    { id: 'all', label: 'All Categories' },
    { id: 'anatomy', label: 'Anatomy' },
    { id: 'function', label: 'Function' },
    { id: 'conditions', label: 'Conditions' },
    { id: 'treatment', label: 'Treatment' },
    { id: 'prevention', label: 'Prevention' },
    { id: 'wellness', label: 'Wellness' },
    { id: 'relationships', label: 'Relationships' },
    { id: 'myths', label: 'Myths & Facts' },
  ]

  useEffect(() => {
    loadData()
  }, [activeTab, selectedCategory])

  const loadData = async () => {
    setLoading(true)
    try {
      switch (activeTab) {
        case 'modules': {
          const modulesData = await getEducationModules(
            selectedCategory === 'all' ? undefined : selectedCategory,
            false,
            false // Only free modules for now
          )
          setModules(modulesData)
          const progressData = await getUserProgress()
          setProgress(progressData)
          const completion = await getUserEducationCompletion()
          setCompletionPercentage(completion)
          break
        }
        case 'qa': {
          const qaData = await getEducationQA(undefined, searchQuery || undefined)
          setQA(qaData)
          break
        }
        case 'experts': {
          const expertData = await getExpertContent(20)
          setExpertContent(expertData)
          break
        }
        case 'research': {
          const researchData = await getResearchUpdates(undefined, 20)
          setResearchUpdates(researchData)
          break
        }
      }
    } catch (error) {
      toast.error('Failed to load education content')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleModuleClick = async (module: EducationModule) => {
    try {
      const moduleData = await getEducationModule(module.id!)
      if (moduleData) {
        setSelectedModule(moduleData)
        // Update progress
        await updateUserProgress(module.id!, {
          last_accessed_at: new Date().toISOString(),
        })
        await loadData()
      }
    } catch (error) {
      toast.error('Failed to load module')
    }
  }

  const handleCompleteModule = async () => {
    if (!selectedModule) return
    try {
      await completeModule(selectedModule.id!)
      toast.success('Module completed!')
      setSelectedModule(null)
      await loadData()
    } catch (error) {
      toast.error('Failed to complete module')
    }
  }

  const handleBookmark = async (contentType: string, contentId: string) => {
    try {
      await bookmarkContent(contentType as any, contentId)
      toast.success('Bookmarked!')
    } catch (error) {
      toast.error('Failed to bookmark')
    }
  }

  const getModuleProgress = (moduleId: string): number => {
    const moduleProgress = progress.find(p => p.module_id === moduleId)
    return moduleProgress?.progress_percentage || 0
  }

  const isModuleCompleted = (moduleId: string): boolean => {
    const moduleProgress = progress.find(p => p.module_id === moduleId)
    return moduleProgress?.is_completed || false
  }

  if (selectedModule) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => setSelectedModule(null)}>
          ← Back to Modules
        </Button>
        
        <Card variant="glass">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl mb-2">{selectedModule.title}</CardTitle>
                <CardDescription>{selectedModule.description}</CardDescription>
                <div className="flex gap-2 mt-4">
                  <Badge variant="outline">{selectedModule.category}</Badge>
                  {selectedModule.difficulty_level && (
                    <Badge variant="outline">{selectedModule.difficulty_level}</Badge>
                  )}
                  {selectedModule.expert_reviewed && (
                    <Badge className="bg-green-500">Expert Reviewed</Badge>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleBookmark('module', selectedModule.id!)}
              >
                <Bookmark className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {selectedModule.video_url && (
              <div className="aspect-video rounded-lg overflow-hidden bg-secondary">
                <iframe
                  src={selectedModule.video_url}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}
            
            {selectedModule.content_html ? (
              <div
                className="prose prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: selectedModule.content_html }}
              />
            ) : selectedModule.content_text ? (
              <div className="prose prose-invert max-w-none whitespace-pre-wrap">
                {selectedModule.content_text}
              </div>
            ) : (
              <p className="text-muted-foreground">Content coming soon...</p>
            )}

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {selectedModule.estimated_duration_minutes && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {selectedModule.estimated_duration_minutes} min
                  </div>
                )}
                {selectedModule.view_count !== undefined && (
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {selectedModule.view_count} views
                  </div>
                )}
              </div>
              <Button onClick={handleCompleteModule} variant="gradient">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Mark Complete
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
          <BookOpen className="w-4 h-4 text-primary" />
          <span className="text-sm text-primary font-medium">Education</span>
        </div>
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          <span className="gradient-text">Sexual Health</span> Education
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Comprehensive educational content on sexual health, anatomy, function, and wellness.
        </p>
        {completionPercentage > 0 && (
          <div className="mt-4 max-w-md mx-auto">
            <div className="flex items-center justify-between text-sm mb-2">
              <span>Your Progress</span>
              <span className="font-semibold">{completionPercentage.toFixed(0)}%</span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="modules">Modules</TabsTrigger>
          <TabsTrigger value="qa">Q&A</TabsTrigger>
          <TabsTrigger value="experts">Experts</TabsTrigger>
          <TabsTrigger value="research">Research</TabsTrigger>
        </TabsList>

        {/* Modules Tab */}
        <TabsContent value="modules" className="space-y-6">
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.label}
              </Button>
            ))}
          </div>

          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading...</div>
          ) : modules.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {modules.map(module => {
                const moduleProgress = getModuleProgress(module.id!)
                const isCompleted = isModuleCompleted(module.id!)
                
                return (
                  <Card
                    key={module.id}
                    variant="glass"
                    className="cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => handleModuleClick(module)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg mb-2">{module.title}</CardTitle>
                          <CardDescription className="line-clamp-2">
                            {module.description}
                          </CardDescription>
                        </div>
                        {isCompleted && (
                          <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 ml-2" />
                        )}
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {module.category}
                        </Badge>
                        {module.difficulty_level && (
                          <Badge variant="outline" className="text-xs">
                            {module.difficulty_level}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {moduleProgress > 0 && (
                          <div>
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span>Progress</span>
                              <span>{moduleProgress.toFixed(0)}%</span>
                            </div>
                            <Progress value={moduleProgress} className="h-1" />
                          </div>
                        )}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          {module.content_type && (
                            <div className="flex items-center gap-1">
                              {module.content_type === 'video' ? (
                                <Video className="w-3 h-3" />
                              ) : (
                                <FileText className="w-3 h-3" />
                              )}
                              {module.content_type}
                            </div>
                          )}
                          {module.estimated_duration_minutes && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {module.estimated_duration_minutes} min
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No modules available yet. Check back soon!</p>
            </div>
          )}
        </TabsContent>

        {/* Q&A Tab */}
        <TabsContent value="qa" className="space-y-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                loadData()
              }}
              className="pl-10"
            />
          </div>

          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading...</div>
          ) : qa.length > 0 ? (
            <div className="space-y-4">
              {qa.map(item => (
                <Card key={item.id} variant="glass">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-semibold text-lg mb-2">{item.question}</h3>
                        <p className="text-muted-foreground">{item.answer}</p>
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t">
                        <div className="flex gap-2">
                          {item.category && (
                            <Badge variant="outline">{item.category}</Badge>
                          )}
                          {item.expert_verified && (
                            <Badge className="bg-green-500">Expert Verified</Badge>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markQAHelpful(item.id!, true)}
                          >
                            Helpful ({item.helpful_count || 0})
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleBookmark('qa', item.id!)}
                          >
                            <Bookmark className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No Q&A found. Try a different search.</p>
            </div>
          )}
        </TabsContent>

        {/* Experts Tab */}
        <TabsContent value="experts" className="space-y-6">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading...</div>
          ) : expertContent.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {expertContent.map(expert => (
                <Card key={expert.id} variant="glass">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{expert.title}</CardTitle>
                        <CardDescription>{expert.expert_name} - {expert.expert_title}</CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleBookmark('expert_content', expert.id!)}
                      >
                        <Bookmark className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                      {expert.description}
                    </p>
                    {expert.video_url && (
                      <Button variant="outline" className="w-full" asChild>
                        <a href={expert.video_url} target="_blank" rel="noopener noreferrer">
                          <Play className="w-4 h-4 mr-2" />
                          Watch {expert.content_type}
                        </a>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No expert content available yet.</p>
            </div>
          )}
        </TabsContent>

        {/* Research Tab */}
        <TabsContent value="research" className="space-y-6">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading...</div>
          ) : researchUpdates.length > 0 ? (
            <div className="space-y-4">
              {researchUpdates.map(update => (
                <Card key={update.id} variant="glass">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{update.title}</CardTitle>
                        <CardDescription>
                          {update.source_name} • {update.published_date && new Date(update.published_date).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleBookmark('research_update', update.id!)}
                      >
                        <Bookmark className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">{update.summary}</p>
                    {update.source_url && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={update.source_url} target="_blank" rel="noopener noreferrer">
                          Read Full Article
                        </a>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No research updates available yet.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

