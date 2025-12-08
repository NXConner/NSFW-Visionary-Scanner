import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  createCustomReport,
  generateReport,
  scheduleReport,
  getReportTemplates,
  createComparativeAnalysis,
  generatePredictiveModel,
  calculateHealthRiskScore,
  getHealthRiskScores,
  type CustomReport,
  type ReportTemplate,
  type ComparativeAnalytics,
  type PredictiveModelingResult,
  type HealthRiskScore
} from '@/lib/advancedReporting'
import { FileText, Calendar, Share2, Download, TrendingUp, AlertTriangle, BarChart3, Settings, Star } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'

export const AdvancedReportingSystem = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('custom')
  const [loading, setLoading] = useState(false)

  // Custom Reports
  const [customReports, setCustomReports] = useState<CustomReport[]>([])
  const [templates, setTemplates] = useState<ReportTemplate[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newReport, setNewReport] = useState({
    name: '',
    description: '',
    type: 'health_summary' as CustomReport['report_type'],
    metrics: [] as string[]
  })

  // Risk Scores
  const [riskScores, setRiskScores] = useState<HealthRiskScore[]>([])

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user, activeTab])

  const loadData = async () => {
    setLoading(true)
    try {
      if (activeTab === 'templates') {
        const templatesData = await getReportTemplates()
        setTemplates(templatesData)
      } else if (activeTab === 'risks') {
        const risksData = await getHealthRiskScores()
        setRiskScores(risksData)
      }
    } catch (error) {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateReport = async () => {
    if (!newReport.name.trim()) {
      toast.error('Please enter a report name')
      return
    }

    setLoading(true)
    try {
      const report = await createCustomReport(
        newReport.name,
        newReport.type,
        { sections: [] }, // Would be configured via drag-and-drop UI
        newReport.metrics,
        { start_date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], end_date: new Date().toISOString().split('T')[0] },
        newReport.description
      )
      if (report) {
        setCustomReports([report, ...customReports])
        setShowCreateForm(false)
        setNewReport({ name: '', description: '', type: 'health_summary', metrics: [] })
      }
    } catch (error) {
      toast.error('Failed to create report')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateReport = async (reportId: string, format: 'pdf' | 'excel' | 'csv' = 'pdf') => {
    setLoading(true)
    try {
      const url = await generateReport(reportId, format)
      if (url) {
        window.open(url, '_blank')
      }
    } catch (error) {
      toast.error('Failed to generate report')
    } finally {
      setLoading(false)
    }
  }

  const handleCalculateRisk = async (category: HealthRiskScore['risk_category']) => {
    setLoading(true)
    try {
      const riskScore = await calculateHealthRiskScore(category)
      if (riskScore) {
        setRiskScores([riskScore, ...riskScores])
      }
    } catch (error) {
      toast.error('Failed to calculate risk score')
    } finally {
      setLoading(false)
    }
  }

  const getRiskLevelBadge = (level: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      low: 'outline',
      moderate: 'default',
      high: 'destructive',
      very_high: 'destructive'
    }
    return <Badge variant={variants[level] || 'default'}>{level.toUpperCase()}</Badge>
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Advanced Reporting System</h1>
        <p className="text-muted-foreground">Custom reports, scheduled reports, comparative analytics, predictive modeling, and health risk scoring</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="custom">
            <FileText className="w-4 h-4 mr-2" />
            Custom Reports
          </TabsTrigger>
          <TabsTrigger value="templates">
            <Settings className="w-4 h-4 mr-2" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="comparative">
            <BarChart3 className="w-4 h-4 mr-2" />
            Comparative
          </TabsTrigger>
          <TabsTrigger value="predictive">
            <TrendingUp className="w-4 h-4 mr-2" />
            Predictive
          </TabsTrigger>
          <TabsTrigger value="risks">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Risk Scores
          </TabsTrigger>
        </TabsList>

        {/* Custom Reports */}
        <TabsContent value="custom" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Custom Reports</CardTitle>
                <Button onClick={() => setShowCreateForm(!showCreateForm)}>
                  <FileText className="w-4 h-4 mr-2" />
                  New Report
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {showCreateForm && (
                <div className="mb-6 p-4 border rounded-lg space-y-3">
                  <Input
                    placeholder="Report Name"
                    value={newReport.name}
                    onChange={(e) => setNewReport({ ...newReport, name: e.target.value })}
                  />
                  <Textarea
                    placeholder="Description"
                    value={newReport.description}
                    onChange={(e) => setNewReport({ ...newReport, description: e.target.value })}
                    rows={2}
                  />
                  <select
                    className="w-full p-2 border rounded"
                    value={newReport.type}
                    onChange={(e) => setNewReport({ ...newReport, type: e.target.value as CustomReport['report_type'] })}
                  >
                    <option value="health_summary">Health Summary</option>
                    <option value="detailed_analysis">Detailed Analysis</option>
                    <option value="comparison">Comparison</option>
                    <option value="trend">Trend</option>
                    <option value="risk_assessment">Risk Assessment</option>
                    <option value="custom">Custom</option>
                  </select>
                  <Button onClick={handleCreateReport} className="w-full" disabled={loading}>
                    Create Report
                  </Button>
                </div>
              )}

              <div className="space-y-2">
                {customReports.map((report) => (
                  <Card key={report.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{report.report_name}</h4>
                            {report.is_favorite && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
                            {report.is_scheduled && <Badge variant="outline">Scheduled</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground">{report.description}</p>
                          <div className="flex gap-2 mt-2">
                            <Badge variant="secondary">{report.report_type.replace('_', ' ')}</Badge>
                            <Badge variant="outline">Generated {report.generation_count} times</Badge>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleGenerateReport(report.id, 'pdf')}
                            disabled={loading}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          {report.is_shared && (
                            <Button size="sm" variant="outline">
                              <Share2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates */}
        <TabsContent value="templates" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Report Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {templates.map((template) => (
                  <Card key={template.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{template.template_name}</h4>
                            {template.is_featured && <Badge variant="default">Featured</Badge>}
                            {template.is_premium && <Badge variant="outline">Premium</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground">{template.description}</p>
                          <Badge variant="secondary" className="mt-2">
                            Used {template.usage_count} times
                          </Badge>
                        </div>
                        <Button size="sm" variant="outline">
                          Use Template
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Comparative Analytics */}
        <TabsContent value="comparative" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Comparative Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                Compare your data across time periods, goals, or population averages.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Predictive Modeling */}
        <TabsContent value="predictive" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Predictive Modeling</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <Button
                  onClick={() => generatePredictiveModel('growth_prediction')}
                  disabled={loading}
                  variant="outline"
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Growth Prediction
                </Button>
                <Button
                  onClick={() => generatePredictiveModel('health_risk')}
                  disabled={loading}
                  variant="outline"
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Health Risk
                </Button>
                <Button
                  onClick={() => generatePredictiveModel('outcome_simulation')}
                  disabled={loading}
                  variant="outline"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Outcome Simulation
                </Button>
                <Button
                  onClick={() => generatePredictiveModel('trend_forecast')}
                  disabled={loading}
                  variant="outline"
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Trend Forecast
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Risk Scores */}
        <TabsContent value="risks" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Health Risk Scores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <Button
                  onClick={() => handleCalculateRisk('erectile_dysfunction')}
                  disabled={loading}
                  variant="outline"
                >
                  Erectile Dysfunction
                </Button>
                <Button
                  onClick={() => handleCalculateRisk('peyronies')}
                  disabled={loading}
                  variant="outline"
                >
                  Peyronie's
                </Button>
                <Button
                  onClick={() => handleCalculateRisk('prostate')}
                  disabled={loading}
                  variant="outline"
                >
                  Prostate
                </Button>
                <Button
                  onClick={() => handleCalculateRisk('testicular')}
                  disabled={loading}
                  variant="outline"
                >
                  Testicular
                </Button>
                <Button
                  onClick={() => handleCalculateRisk('general_sexual_health')}
                  disabled={loading}
                  variant="outline"
                >
                  General Sexual Health
                </Button>
                <Button
                  onClick={() => handleCalculateRisk('overall')}
                  disabled={loading}
                  variant="outline"
                >
                  Overall
                </Button>
              </div>

              <div className="space-y-2">
                {riskScores.map((risk) => (
                  <Card key={risk.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold capitalize">{risk.risk_category.replace('_', ' ')}</h4>
                            {getRiskLevelBadge(risk.risk_level)}
                            <Badge variant="outline">
                              Score: {risk.overall_risk_score.toFixed(1)}
                            </Badge>
                          </div>
                          {risk.recommendations && risk.recommendations.length > 0 && (
                            <div className="mt-2">
                              <p className="text-sm font-medium mb-1">Recommendations:</p>
                              <ul className="list-disc list-inside text-sm text-muted-foreground">
                                {risk.recommendations.map((rec, idx) => (
                                  <li key={idx}>{rec}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

