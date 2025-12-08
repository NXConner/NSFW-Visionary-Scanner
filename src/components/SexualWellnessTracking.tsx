import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  upsertSexualWellnessEntry,
  getSexualWellnessEntries,
  getLatestSexualWellnessEntry,
  createSexualWellnessGoal,
  getSexualWellnessGoals,
  updateSexualWellnessGoal,
  deleteSexualWellnessGoal,
  getSexualWellnessPatterns,
  acknowledgeSexualWellnessPattern,
  getSexualWellnessStatistics,
  type SexualWellnessEntry,
  type SexualWellnessGoal,
  type SexualWellnessPattern
} from '@/lib/sexualWellness'
import { Heart, TrendingUp, TrendingDown, Minus, Target, AlertCircle, CheckCircle2, Calendar, BarChart3, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

export const SexualWellnessTracking = () => {
  const [activeTab, setActiveTab] = useState('entry')
  const [loading, setLoading] = useState(false)
  const [entries, setEntries] = useState<SexualWellnessEntry[]>([])
  const [goals, setGoals] = useState<SexualWellnessGoal[]>([])
  const [patterns, setPatterns] = useState<SexualWellnessPattern[]>([])
  const [statistics, setStatistics] = useState<any>(null)
  
  const [entry, setEntry] = useState<Partial<SexualWellnessEntry>>({
    entry_date: new Date().toISOString().split('T')[0],
    erectile_function_score: undefined,
    libido_level: undefined,
    overall_satisfaction: undefined,
    sexual_confidence: undefined,
    sexual_activity_count: 0,
    activity_type: 'none',
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [entriesData, goalsData, patternsData, statsData] = await Promise.all([
        getSexualWellnessEntries(),
        getSexualWellnessGoals(),
        getSexualWellnessPatterns(true),
        getSexualWellnessStatistics()
      ])
      setEntries(entriesData)
      setGoals(goalsData)
      setPatterns(patternsData)
      setStatistics(statsData)
      
      // Load latest entry for form
      const latest = await getLatestSexualWellnessEntry()
      if (latest) {
        setEntry(prev => ({ ...prev, ...latest }))
      }
    } catch (error) {
      toast.error('Failed to load sexual wellness data')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitEntry = async () => {
    if (!entry.entry_date) {
      toast.error('Please select a date')
      return
    }

    setLoading(true)
    try {
      await upsertSexualWellnessEntry(entry as any)
      toast.success('Sexual wellness entry saved')
      await loadData()
      // Reset form
      setEntry({
        entry_date: new Date().toISOString().split('T')[0],
        erectile_function_score: undefined,
        libido_level: undefined,
        overall_satisfaction: undefined,
        sexual_confidence: undefined,
        sexual_activity_count: 0,
        activity_type: 'none',
      })
    } catch (error) {
      toast.error('Failed to save entry')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateGoal = async () => {
    // This would open a modal or form - simplified for now
    toast.info('Goal creation feature coming soon')
  }

  const handleAcknowledgePattern = async (patternId: string) => {
    try {
      await acknowledgeSexualWellnessPattern(patternId)
      await loadData()
      toast.success('Pattern acknowledged')
    } catch (error) {
      toast.error('Failed to acknowledge pattern')
    }
  }

  // Prepare chart data
  const chartData = entries
    .slice(0, 30) // Last 30 entries
    .reverse()
    .map(e => ({
      date: new Date(e.entry_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      wellness: e.wellness_score || 0,
      erectile: e.erectile_function_score || 0,
      libido: e.libido_level || 0,
      satisfaction: e.overall_satisfaction || 0,
    }))

  const getScoreColor = (score?: number) => {
    if (!score) return 'text-muted-foreground'
    if (score >= 8) return 'text-green-500'
    if (score >= 6) return 'text-yellow-500'
    return 'text-red-500'
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="w-4 h-4 text-green-500" />
      case 'declining':
        return <TrendingDown className="w-4 h-4 text-red-500" />
      default:
        return <Minus className="w-4 h-4 text-muted-foreground" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
          <Heart className="w-4 h-4 text-primary" />
          <span className="text-sm text-primary font-medium">Sexual Wellness</span>
        </div>
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          <span className="gradient-text">Sexual Wellness</span> Tracking
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Track your sexual function, libido, satisfaction, and overall wellness over time.
        </p>
      </div>

      {/* Statistics Overview */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card variant="glass">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Wellness Score</p>
                  <p className={`text-2xl font-bold ${getScoreColor(statistics.averageWellnessScore)}`}>
                    {statistics.averageWellnessScore.toFixed(1)}
                  </p>
                </div>
                {getTrendIcon(statistics.trend)}
              </div>
            </CardContent>
          </Card>
          <Card variant="glass">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Erectile Function</p>
              <p className={`text-2xl font-bold ${getScoreColor(statistics.averageErectileFunction)}`}>
                {statistics.averageErectileFunction.toFixed(1)}
              </p>
            </CardContent>
          </Card>
          <Card variant="glass">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Libido Level</p>
              <p className={`text-2xl font-bold ${getScoreColor(statistics.averageLibido)}`}>
                {statistics.averageLibido.toFixed(1)}
              </p>
            </CardContent>
          </Card>
          <Card variant="glass">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Activities</p>
              <p className="text-2xl font-bold">{statistics.totalActivities}</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="entry">New Entry</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        {/* New Entry Tab */}
        <TabsContent value="entry">
          <Card variant="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                New Wellness Entry
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="entry_date">Date</Label>
                <Input
                  id="entry_date"
                  type="date"
                  value={entry.entry_date}
                  onChange={(e) => setEntry({ ...entry, entry_date: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Sexual Function */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Sexual Function</h3>
                  
                  <div>
                    <Label>Erectile Function (0-10)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="10"
                      value={entry.erectile_function_score || ''}
                      onChange={(e) => setEntry({ ...entry, erectile_function_score: parseInt(e.target.value) || undefined })}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label>Ejaculation Quality (0-10)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="10"
                      value={entry.ejaculation_quality_score || ''}
                      onChange={(e) => setEntry({ ...entry, ejaculation_quality_score: parseInt(e.target.value) || undefined })}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label>Stamina (minutes)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={entry.stamina_duration_minutes || ''}
                      onChange={(e) => setEntry({ ...entry, stamina_duration_minutes: parseInt(e.target.value) || undefined })}
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Libido & Satisfaction */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Libido & Satisfaction</h3>
                  
                  <div>
                    <Label>Libido Level (0-10)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="10"
                      value={entry.libido_level || ''}
                      onChange={(e) => setEntry({ ...entry, libido_level: parseInt(e.target.value) || undefined })}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label>Overall Satisfaction (0-10)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="10"
                      value={entry.overall_satisfaction || ''}
                      onChange={(e) => setEntry({ ...entry, overall_satisfaction: parseInt(e.target.value) || undefined })}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label>Sexual Confidence (0-10)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="10"
                      value={entry.sexual_confidence || ''}
                      onChange={(e) => setEntry({ ...entry, sexual_confidence: parseInt(e.target.value) || undefined })}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Activity Tracking */}
              <div>
                <Label>Activity Type</Label>
                <select
                  value={entry.activity_type || 'none'}
                  onChange={(e) => setEntry({ ...entry, activity_type: e.target.value as any })}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2"
                >
                  <option value="none">None</option>
                  <option value="intercourse">Intercourse</option>
                  <option value="masturbation">Masturbation</option>
                  <option value="oral">Oral</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <Label>Activity Count</Label>
                <Input
                  type="number"
                  min="0"
                  value={entry.sexual_activity_count || 0}
                  onChange={(e) => setEntry({ ...entry, sexual_activity_count: parseInt(e.target.value) || 0 })}
                  className="mt-1"
                />
              </div>

              <Button
                onClick={handleSubmitEntry}
                disabled={loading}
                className="w-full"
                variant="gradient"
              >
                {loading ? 'Saving...' : 'Save Entry'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <Card variant="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Wellness History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <div className="space-y-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={[0, 10]} />
                      <Tooltip />
                      <Line type="monotone" dataKey="wellness" stroke="#8884d8" strokeWidth={2} name="Wellness Score" />
                      <Line type="monotone" dataKey="erectile" stroke="#82ca9d" strokeWidth={2} name="Erectile Function" />
                      <Line type="monotone" dataKey="libido" stroke="#ffc658" strokeWidth={2} name="Libido" />
                      <Line type="monotone" dataKey="satisfaction" stroke="#ff7300" strokeWidth={2} name="Satisfaction" />
                    </LineChart>
                  </ResponsiveContainer>

                  <div className="space-y-2">
                    {entries.slice(0, 10).map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                        <div>
                          <p className="font-medium">{new Date(entry.entry_date).toLocaleDateString()}</p>
                          <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                            {entry.erectile_function_score !== undefined && (
                              <span>EF: {entry.erectile_function_score}/10</span>
                            )}
                            {entry.libido_level !== undefined && (
                              <span>Libido: {entry.libido_level}/10</span>
                            )}
                            {entry.overall_satisfaction !== undefined && (
                              <span>Satisfaction: {entry.overall_satisfaction}/10</span>
                            )}
                          </div>
                        </div>
                        {entry.wellness_score !== undefined && (
                          <Badge className={getScoreColor(entry.wellness_score)}>
                            {entry.wellness_score.toFixed(1)}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Heart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No entries yet. Start tracking your sexual wellness today!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Goals Tab */}
        <TabsContent value="goals">
          <Card variant="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Wellness Goals
              </CardTitle>
            </CardHeader>
            <CardContent>
              {goals.length > 0 ? (
                <div className="space-y-4">
                  {goals.map((goal) => (
                    <Card key={goal.id} variant="glass">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h4 className="font-semibold capitalize">{goal.goal_type.replace('_', ' ')}</h4>
                            <p className="text-sm text-muted-foreground">
                              Target: {goal.target_value} | Current: {goal.current_value || 0}
                            </p>
                          </div>
                          {goal.is_active ? (
                            <Badge variant="outline">Active</Badge>
                          ) : (
                            <Badge className="bg-green-500">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Completed
                            </Badge>
                          )}
                        </div>
                        {goal.progress_percentage !== undefined && (
                          <Progress value={goal.progress_percentage} className="mt-2" />
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No goals set yet. Create a goal to track your progress!</p>
                  <Button onClick={handleCreateGoal} className="mt-4" variant="outline">
                    Create Goal
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights">
          <Card variant="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                AI Insights & Patterns
              </CardTitle>
            </CardHeader>
            <CardContent>
              {patterns.length > 0 ? (
                <div className="space-y-4">
                  {patterns.map((pattern) => (
                    <Card key={pattern.id} variant="glass">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-primary" />
                            <Badge variant="outline" className="capitalize">
                              {pattern.pattern_type}
                            </Badge>
                          </div>
                          {!pattern.acknowledged_at && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleAcknowledgePattern(pattern.id!)}
                            >
                              Dismiss
                            </Button>
                          )}
                        </div>
                        <p className="text-sm mt-2">{pattern.pattern_description}</p>
                        {pattern.confidence_score !== undefined && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Confidence: {pattern.confidence_score.toFixed(0)}%
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No insights yet. Keep tracking to receive AI-powered insights!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

