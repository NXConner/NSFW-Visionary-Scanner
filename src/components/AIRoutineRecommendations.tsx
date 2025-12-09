/**
 * AI Routine Recommendations Component
 * Provides AI-powered routine recommendations based on user goals and progress
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Sparkles,
  Dumbbell,
  Clock,
  Target,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Loader2,
  Brain,
  Zap
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/integrations/supabase/client'
import { logger } from '@/lib/logger'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Recommendation {
  id: string
  title: string
  description: string
  duration: number // minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  exercises: {
    name: string
    sets: number
    reps: number | string
    rest: number
  }[]
  benefits: string[]
  priority: 'high' | 'medium' | 'low'
  matchScore: number // 0-100
}

interface AIRoutineRecommendationsProps {
  className?: string
  goals?: string[]
  experienceLevel?: string
  onSelectRoutine?: (routine: Recommendation) => void
}

export const AIRoutineRecommendations = ({
  className,
  goals = [],
  experienceLevel = 'beginner',
  onSelectRoutine
}: AIRoutineRecommendationsProps) => {
  const { user } = useAuth()
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchRecommendations()
  }, [goals, experienceLevel])

  const fetchRecommendations = async () => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: invokeError } = await supabase.functions.invoke('ai-routine-recommendations', {
        body: {
          userId: user?.id,
          goals,
          experienceLevel
        }
      })

      if (invokeError) {
        throw invokeError
      }

      if (data?.recommendations) {
        setRecommendations(data.recommendations)
      } else {
        // Use default recommendations
        setRecommendations(getDefaultRecommendations(experienceLevel))
      }
    } catch (err) {
      logger.error('Failed to fetch AI recommendations', { error: err })
      // Fallback to default recommendations
      setRecommendations(getDefaultRecommendations(experienceLevel))
    } finally {
      setLoading(false)
    }
  }

  const getDefaultRecommendations = (level: string): Recommendation[] => {
    const isBegineer = level === 'beginner'
    
    return [
      {
        id: 'rec-1',
        title: isBegineer ? 'Beginner Foundation' : 'Advanced Growth',
        description: isBegineer 
          ? 'A gentle introduction to PE with focus on safety and proper technique'
          : 'Intensive routine for experienced practitioners',
        duration: isBegineer ? 15 : 30,
        difficulty: isBegineer ? 'beginner' : 'advanced',
        exercises: [
          { name: 'Warm-up', sets: 1, reps: '5 min', rest: 0 },
          { name: isBegineer ? 'Basic Stretches' : 'Advanced Stretches', sets: 3, reps: '30 sec', rest: 30 },
          { name: isBegineer ? 'Jelqs' : 'Pumping', sets: isBegineer ? 2 : 3, reps: isBegineer ? 50 : 100, rest: 60 },
          { name: 'Cool-down', sets: 1, reps: '5 min', rest: 0 }
        ],
        benefits: [
          'Gradual progression',
          'Injury prevention',
          'Consistent gains'
        ],
        priority: 'high',
        matchScore: 95
      },
      {
        id: 'rec-2',
        title: 'Quick Daily Routine',
        description: 'Perfect for busy schedules - effective results in minimal time',
        duration: 10,
        difficulty: 'beginner',
        exercises: [
          { name: 'Warm-up', sets: 1, reps: '3 min', rest: 0 },
          { name: 'Stretches', sets: 2, reps: '20 sec', rest: 20 },
          { name: 'Jelqs', sets: 1, reps: 30, rest: 0 }
        ],
        benefits: [
          'Time-efficient',
          'Easy to maintain',
          'Good for habit building'
        ],
        priority: 'medium',
        matchScore: 85
      },
      {
        id: 'rec-3',
        title: 'Recovery Focus',
        description: 'Light routine emphasizing recovery and conditioning',
        duration: 20,
        difficulty: 'beginner',
        exercises: [
          { name: 'Hot Wrap', sets: 1, reps: '10 min', rest: 0 },
          { name: 'Light Stretches', sets: 2, reps: '30 sec', rest: 30 },
          { name: 'Massage', sets: 1, reps: '5 min', rest: 0 }
        ],
        benefits: [
          'Promotes recovery',
          'Reduces soreness',
          'Improves circulation'
        ],
        priority: 'low',
        matchScore: 75
      }
    ]
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-success/10 text-success'
      case 'intermediate': return 'bg-warning/10 text-warning'
      case 'advanced': return 'bg-destructive/10 text-destructive'
      default: return 'bg-muted text-muted-foreground'
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <Zap className="w-4 h-4 text-warning" />
      case 'medium': return <Target className="w-4 h-4 text-primary" />
      default: return <Clock className="w-4 h-4 text-muted-foreground" />
    }
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Generating personalized recommendations...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Brain className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                AI Recommendations
                <Badge variant="secondary" className="text-xs">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Personalized
                </Badge>
              </CardTitle>
              <CardDescription>
                Tailored routines based on your goals and experience
              </CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={fetchRecommendations}
            disabled={loading}
          >
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <ScrollArea className="h-80">
          <div className="space-y-4">
            {recommendations.map((rec) => (
              <Card 
                key={rec.id} 
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => onSelectRoutine?.(rec)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {getPriorityIcon(rec.priority)}
                        <h4 className="font-medium">{rec.title}</h4>
                        <Badge className={getDifficultyColor(rec.difficulty)}>
                          {rec.difficulty}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {rec.description}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{rec.matchScore}%</p>
                      <p className="text-xs text-muted-foreground">match</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm mb-3">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span>{rec.duration} min</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Dumbbell className="w-4 h-4 text-muted-foreground" />
                      <span>{rec.exercises.length} exercises</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {rec.benefits.slice(0, 3).map((benefit, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {benefit}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}

            {recommendations.length === 0 && !loading && (
              <div className="text-center py-8">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground">
                  No recommendations available. Try adjusting your goals.
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

export default AIRoutineRecommendations
