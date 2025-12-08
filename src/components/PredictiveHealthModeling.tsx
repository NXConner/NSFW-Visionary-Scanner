/**
 * Predictive Health Modeling
 * Advanced growth predictions, health risk predictions, optimal routine timing, outcome simulations, and long-term forecasting
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  generateGrowthPrediction,
  getGrowthPredictions,
  generateHealthRiskPrediction,
  generateRoutineTimingPrediction,
  createOutcomeSimulation,
  generateLongTermForecast,
  type GrowthPrediction,
  type HealthRiskPrediction,
  type RoutineTimingPrediction,
  type OutcomeSimulation,
  type LongTermHealthForecast
} from '@/lib/predictiveHealthModeling'
import { TrendingUp, AlertTriangle, Clock, Target, Calendar, Loader2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export const PredictiveHealthModeling = () => {
  const [activeTab, setActiveTab] = useState('growth')
  const [loading, setLoading] = useState(false)
  const [growthPredictions, setGrowthPredictions] = useState<GrowthPrediction[]>([])
  const [riskPredictions, setRiskPredictions] = useState<HealthRiskPrediction[]>([])
  const [timingPredictions, setTimingPredictions] = useState<RoutineTimingPrediction[]>([])
  const [simulations, setSimulations] = useState<OutcomeSimulation[]>([])
  const [forecasts, setForecasts] = useState<LongTermHealthForecast[]>([])

  useEffect(() => {
    loadData()
  }, [activeTab])

  const loadData = async () => {
    setLoading(true)
    try {
      switch (activeTab) {
        case 'growth': {
          const predictions = await getGrowthPredictions()
          setGrowthPredictions(predictions)
          break
        }
      }
    } catch (error) {
      toast.error('Failed to load predictions')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateGrowthPrediction = async () => {
    try {
      const prediction = await generateGrowthPrediction(90)
      if (prediction) {
        await loadData()
      }
    } catch (error) {
      toast.error('Failed to generate prediction')
    }
  }

  const handleGenerateRiskPrediction = async () => {
    try {
      const prediction = await generateHealthRiskPrediction('erectile_dysfunction', 365)
      if (prediction) {
        await loadData()
      }
    } catch (error) {
      toast.error('Failed to generate risk prediction')
    }
  }

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'moderate': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
      case 'very_high': return 'bg-red-500/20 text-red-400 border-red-500/30'
      default: return ''
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <Card className="glass-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-6 h-6" />
            Predictive Health Modeling
          </CardTitle>
          <CardDescription>
            Advanced AI-powered predictions for growth, health risks, routine timing, and long-term forecasting
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="growth">Growth</TabsTrigger>
              <TabsTrigger value="risks">Health Risks</TabsTrigger>
              <TabsTrigger value="timing">Routine Timing</TabsTrigger>
              <TabsTrigger value="simulations">Simulations</TabsTrigger>
              <TabsTrigger value="forecast">Long-Term</TabsTrigger>
            </TabsList>

            <TabsContent value="growth" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Growth Predictions</h3>
                <Button onClick={handleGenerateGrowthPrediction}>
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Generate Prediction
                </Button>
              </div>
              {growthPredictions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No growth predictions yet. Generate your first prediction to get started.
                </div>
              ) : (
                <div className="space-y-4">
                  {growthPredictions.map(prediction => (
                    <Card key={prediction.id} className="glass-card border-border/50">
                      <CardHeader>
                        <CardTitle className="text-lg">
                          {prediction.prediction_horizon_days}-Day Prediction
                        </CardTitle>
                        <CardDescription>
                          Generated: {new Date(prediction.prediction_date).toLocaleDateString()}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm text-muted-foreground mb-4">
                          Confidence: {(prediction.confidence_level * 100).toFixed(0)}%
                        </div>
                        {prediction.recommendations && prediction.recommendations.length > 0 && (
                          <div className="mt-4">
                            <h4 className="font-semibold mb-2">Recommendations:</h4>
                            <ul className="list-disc list-inside space-y-1">
                              {prediction.recommendations.map((rec, index) => (
                                <li key={index} className="text-sm">{rec}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="risks" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Health Risk Predictions</h3>
                <Button onClick={handleGenerateRiskPrediction}>
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Assess Risk
                </Button>
              </div>
              <div className="text-center py-12 text-muted-foreground">
                Risk predictions will appear here
              </div>
            </TabsContent>

            <TabsContent value="timing" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Optimal Routine Timing</h3>
                <Button onClick={async () => {
                  try {
                    const prediction = await generateRoutineTimingPrediction(30)
                    if (prediction) {
                      toast.success('Timing prediction generated!')
                    }
                  } catch (error) {
                    toast.error('Failed to generate timing prediction')
                  }
                }}>
                  <Clock className="w-4 h-4 mr-2" />
                  Predict Timing
                </Button>
              </div>
              <div className="text-center py-12 text-muted-foreground">
                Timing predictions will appear here
              </div>
            </TabsContent>

            <TabsContent value="simulations" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Outcome Simulations</h3>
                <Button onClick={async () => {
                  try {
                    const simulation = await createOutcomeSimulation(
                      'What-If Scenario',
                      'what_if',
                      { routine_changes: [] },
                      90
                    )
                    if (simulation) {
                      toast.success('Simulation created!')
                    }
                  } catch (error) {
                    toast.error('Failed to create simulation')
                  }
                }}>
                  <Target className="w-4 h-4 mr-2" />
                  Create Simulation
                </Button>
              </div>
              <div className="text-center py-12 text-muted-foreground">
                Outcome simulations will appear here
              </div>
            </TabsContent>

            <TabsContent value="forecast" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Long-Term Health Forecast</h3>
                <Button onClick={async () => {
                  try {
                    const forecast = await generateLongTermForecast(5)
                    if (forecast) {
                      toast.success('Long-term forecast generated!')
                    }
                  } catch (error) {
                    toast.error('Failed to generate forecast')
                  }
                }}>
                  <Calendar className="w-4 h-4 mr-2" />
                  Generate Forecast
                </Button>
              </div>
              <div className="text-center py-12 text-muted-foreground">
                Long-term forecasts will appear here
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

