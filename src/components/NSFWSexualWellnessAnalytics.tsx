/**
 * NSFW Sexual Wellness Analytics
 * Enhanced sexual function tracking, libido monitoring, satisfaction tracking, frequency tracking, and wellness scoring
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  trackSexualFunction,
  getSexualFunctionTracking,
  trackLibido,
  trackSatisfaction,
  trackFrequency,
  calculateWellnessScore,
  getWellnessScores,
  type NSFWSexualFunctionTracking,
  type NSFWLibidoTracking,
  type NSFWSatisfactionTracking,
  type NSFWFrequencyTracking,
  type NSFWWellnessScore
} from '@/lib/nsfwSexualWellnessAnalytics'
import { hasNSFWContent, isSFW } from '@/lib/featureFlags'
import { Activity, Heart, TrendingUp, TrendingDown, BarChart3, Target, Loader2, Lock, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'

export const NSFWSexualWellnessAnalytics = () => {
  const [activeTab, setActiveTab] = useState('function')
  const [loading, setLoading] = useState(false)
  const [functionTracking, setFunctionTracking] = useState<NSFWSexualFunctionTracking[]>([])
  const [wellnessScores, setWellnessScores] = useState<NSFWWellnessScore[]>([])
  const [nsfwAvailable, setNsfwAvailable] = useState(false)
  const [isCheckingNsfw, setIsCheckingNsfw] = useState(true)

  const [functionEntry, setFunctionEntry] = useState<Partial<NSFWSexualFunctionTracking>>({
    entry_date: new Date().toISOString().split('T')[0],
    erectile_function_score: undefined,
    erection_quality: undefined,
    erection_duration_minutes: undefined,
    stamina_minutes: undefined
  })

  const [libidoEntry, setLibidoEntry] = useState<Partial<NSFWLibidoTracking>>({
    entry_date: new Date().toISOString().split('T')[0],
    libido_level: undefined
  })

  const [satisfactionEntry, setSatisfactionEntry] = useState<Partial<NSFWSatisfactionTracking>>({
    entry_date: new Date().toISOString().split('T')[0],
    overall_satisfaction: undefined
  })

  useEffect(() => {
    const checkNsfw = async () => {
      setIsCheckingNsfw(true)
      const available = await hasNSFWContent()
      setNsfwAvailable(available)
      setIsCheckingNsfw(false)
    }
    checkNsfw()
  }, [])

  useEffect(() => {
    if (nsfwAvailable) {
      loadData()
    }
  }, [activeTab, nsfwAvailable])

  const loadData = async () => {
    setLoading(true)
    try {
      switch (activeTab) {
        case 'function': {
          const data = await getSexualFunctionTracking()
          setFunctionTracking(data)
          break
        }
        case 'wellness': {
          const scores = await getWellnessScores()
          setWellnessScores(scores)
          break
        }
      }
    } catch (error) {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleTrackFunction = async () => {
    if (!functionEntry.entry_date) {
      toast.error('Please select a date')
      return
    }

    try {
      const result = await trackSexualFunction(functionEntry.entry_date, functionEntry)
      if (result) {
        setFunctionEntry({
          entry_date: new Date().toISOString().split('T')[0],
          erectile_function_score: undefined,
          erection_quality: undefined,
          erection_duration_minutes: undefined,
          stamina_minutes: undefined
        })
        await loadData()
      }
    } catch (error) {
      toast.error('Failed to track function')
    }
  }

  const handleCalculateWellness = async () => {
    try {
      const score = await calculateWellnessScore(30)
      if (score) {
        await loadData()
      }
    } catch (error) {
      toast.error('Failed to calculate wellness score')
    }
  }

  if (isCheckingNsfw) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Card className="glass-card border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Loader2 className="w-12 h-12 text-muted-foreground animate-spin mb-4" />
            <p className="text-muted-foreground">Loading...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isSFW() || !nsfwAvailable) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Card className="glass-card border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="p-4 rounded-full bg-muted/30 mb-4">
              <Lock className="w-12 h-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">NSFW Content Not Available</h3>
            <p className="text-muted-foreground max-w-md mb-4">
              NSFW sexual wellness analytics are only available in the NSFW version or with a DLC upgrade.
            </p>
            <Badge variant="secondary">Requires NSFW Version or DLC</Badge>
          </CardContent>
        </Card>
      </div>
    )
  }

  const functionChartData = functionTracking.slice(-30).map(entry => ({
    date: new Date(entry.entry_date).toLocaleDateString(),
    function: entry.erectile_function_score || 0,
    quality: entry.erection_quality === 'rigid' ? 10 : entry.erection_quality === 'full' ? 8 : entry.erection_quality === 'partial' ? 5 : 0,
    duration: entry.erection_duration_minutes || 0
  }))

  const wellnessChartData = wellnessScores.slice(-12).map(score => ({
    date: new Date(score.calculation_date).toLocaleDateString(),
    overall: score.overall_wellness_score,
    function: score.function_score || 0,
    libido: score.libido_score || 0,
    satisfaction: score.satisfaction_score || 0
  }))

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <Card className="glass-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-6 h-6" />
            NSFW Sexual Wellness Analytics
          </CardTitle>
          <CardDescription>
            Comprehensive tracking and analysis of sexual function, libido, satisfaction, and frequency
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="function">Function</TabsTrigger>
              <TabsTrigger value="libido">Libido</TabsTrigger>
              <TabsTrigger value="satisfaction">Satisfaction</TabsTrigger>
              <TabsTrigger value="wellness">Wellness Score</TabsTrigger>
            </TabsList>

            <TabsContent value="function" className="space-y-4">
              <Card className="glass-card border-border/50">
                <CardHeader>
                  <CardTitle>Track Sexual Function</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={functionEntry.entry_date}
                      onChange={(e) => setFunctionEntry({ ...functionEntry, entry_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Erectile Function Score (1-10)</Label>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      value={functionEntry.erectile_function_score || ''}
                      onChange={(e) => setFunctionEntry({ ...functionEntry, erectile_function_score: parseInt(e.target.value) || undefined })}
                    />
                  </div>
                  <div>
                    <Label>Erection Quality</Label>
                    <Select
                      value={functionEntry.erection_quality || ''}
                      onValueChange={(value) => setFunctionEntry({ ...functionEntry, erection_quality: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select quality" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="partial">Partial</SelectItem>
                        <SelectItem value="full">Full</SelectItem>
                        <SelectItem value="rigid">Rigid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Erection Duration (minutes)</Label>
                    <Input
                      type="number"
                      value={functionEntry.erection_duration_minutes || ''}
                      onChange={(e) => setFunctionEntry({ ...functionEntry, erection_duration_minutes: parseInt(e.target.value) || undefined })}
                    />
                  </div>
                  <Button onClick={handleTrackFunction} className="w-full">Track Function</Button>
                </CardContent>
              </Card>

              {functionTracking.length > 0 && (
                <Card className="glass-card border-border/50">
                  <CardHeader>
                    <CardTitle>Function Trends</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={functionChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="function" stroke="#8884d8" name="Function Score" />
                        <Line type="monotone" dataKey="quality" stroke="#82ca9d" name="Quality" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="libido" className="space-y-4">
              <Card className="glass-card border-border/50">
                <CardHeader>
                  <CardTitle>Track Libido</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={libidoEntry.entry_date}
                      onChange={(e) => setLibidoEntry({ ...libidoEntry, entry_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Libido Level (1-10)</Label>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      value={libidoEntry.libido_level || ''}
                      onChange={(e) => setLibidoEntry({ ...libidoEntry, libido_level: parseInt(e.target.value) || undefined })}
                    />
                  </div>
                  <Button
                    onClick={async () => {
                      if (!libidoEntry.entry_date || !libidoEntry.libido_level) {
                        toast.error('Please fill in all required fields')
                        return
                      }
                      try {
                        const result = await trackLibido(libidoEntry.entry_date, libidoEntry.libido_level, libidoEntry)
                        if (result) {
                          setLibidoEntry({ entry_date: new Date().toISOString().split('T')[0], libido_level: undefined })
                          toast.success('Libido tracked!')
                        }
                      } catch (error) {
                        toast.error('Failed to track libido')
                      }
                    }}
                    className="w-full"
                  >
                    Track Libido
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="satisfaction" className="space-y-4">
              <Card className="glass-card border-border/50">
                <CardHeader>
                  <CardTitle>Track Satisfaction</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={satisfactionEntry.entry_date}
                      onChange={(e) => setSatisfactionEntry({ ...satisfactionEntry, entry_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Overall Satisfaction (1-10)</Label>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      value={satisfactionEntry.overall_satisfaction || ''}
                      onChange={(e) => setSatisfactionEntry({ ...satisfactionEntry, overall_satisfaction: parseInt(e.target.value) || undefined })}
                    />
                  </div>
                  <Button
                    onClick={async () => {
                      if (!satisfactionEntry.entry_date || !satisfactionEntry.overall_satisfaction) {
                        toast.error('Please fill in all required fields')
                        return
                      }
                      try {
                        const result = await trackSatisfaction(satisfactionEntry.entry_date, satisfactionEntry.overall_satisfaction, satisfactionEntry)
                        if (result) {
                          setSatisfactionEntry({ entry_date: new Date().toISOString().split('T')[0], overall_satisfaction: undefined })
                          toast.success('Satisfaction tracked!')
                        }
                      } catch (error) {
                        toast.error('Failed to track satisfaction')
                      }
                    }}
                    className="w-full"
                  >
                    Track Satisfaction
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="wellness" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Wellness Scores</h3>
                <Button onClick={handleCalculateWellness}>
                  Calculate Score
                </Button>
              </div>

              {wellnessScores.length > 0 && (
                <Card className="glass-card border-border/50">
                  <CardHeader>
                    <CardTitle>Wellness Trends</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={wellnessChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="overall" stroke="#8884d8" name="Overall Score" />
                        <Line type="monotone" dataKey="function" stroke="#82ca9d" name="Function" />
                        <Line type="monotone" dataKey="libido" stroke="#ffc658" name="Libido" />
                        <Line type="monotone" dataKey="satisfaction" stroke="#ff7300" name="Satisfaction" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {wellnessScores.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  No wellness scores yet. Calculate your first score to get started.
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

