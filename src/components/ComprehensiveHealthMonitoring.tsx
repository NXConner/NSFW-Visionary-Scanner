/**
 * Comprehensive Health Monitoring Component
 * Tracks prostate, testicular, sexual health, hormones, and urinary health
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Heart, AlertTriangle, TrendingUp, Calendar, Save, Loader2,
  Activity, Droplet, TestTube, Shield
} from 'lucide-react'
import {
  saveProstateHealthEntry,
  getProstateHealthEntries,
  saveTesticularHealthEntry,
  getTesticularHealthEntries,
  saveSexualHealthEntry,
  getSexualHealthEntries,
  saveHormoneLevels,
  getHormoneLevels,
  saveUrinaryHealthEntry,
  getUrinaryHealthEntries,
  getWellnessScores,
  getHealthAlerts,
  markHealthAlertRead,
  getHealthRiskFactors,
  type ProstateHealthEntry,
  type TesticularHealthEntry,
  type SexualHealthEntry,
  type HormoneLevel,
  type UrinaryHealthEntry,
  type SexualWellnessScore,
  type HealthAlert
} from '@/lib/healthMonitoring'
import { toast } from 'sonner'
import { format } from 'date-fns'

export const ComprehensiveHealthMonitoring = () => {
  const [activeTab, setActiveTab] = useState('overview')
  const [isLoading, setIsLoading] = useState(false)
  const [wellnessScores, setWellnessScores] = useState<SexualWellnessScore[]>([])
  const [alerts, setAlerts] = useState<HealthAlert[]>([])
  const [riskFactors, setRiskFactors] = useState<any[]>([])

  // Form states
  const [prostateForm, setProstateForm] = useState<Partial<ProstateHealthEntry>>({})
  const [testicularForm, setTesticularForm] = useState<Partial<TesticularHealthEntry>>({})
  const [sexualForm, setSexualForm] = useState<Partial<SexualHealthEntry>>({})
  const [hormoneForm, setHormoneForm] = useState<Partial<HormoneLevel>>({})
  const [urinaryForm, setUrinaryForm] = useState<Partial<UrinaryHealthEntry>>({})

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    const [scores, alertsData, risks] = await Promise.all([
      getWellnessScores(7),
      getHealthAlerts(true),
      getHealthRiskFactors()
    ])
    setWellnessScores(scores)
    setAlerts(alertsData)
    setRiskFactors(risks)
    setIsLoading(false)
  }

  const handleSaveProstate = async () => {
    setIsLoading(true)
    const success = await saveProstateHealthEntry(prostateForm)
    if (success) {
      setProstateForm({})
      await loadData()
    }
    setIsLoading(false)
  }

  const handleSaveTesticular = async () => {
    setIsLoading(true)
    const success = await saveTesticularHealthEntry(testicularForm)
    if (success) {
      setTesticularForm({})
      await loadData()
    }
    setIsLoading(false)
  }

  const handleSaveSexual = async () => {
    setIsLoading(true)
    const success = await saveSexualHealthEntry(sexualForm)
    if (success) {
      setSexualForm({})
      await loadData()
    }
    setIsLoading(false)
  }

  const handleSaveHormone = async () => {
    setIsLoading(true)
    const success = await saveHormoneLevels(hormoneForm)
    if (success) {
      setHormoneForm({})
      await loadData()
    }
    setIsLoading(false)
  }

  const handleSaveUrinary = async () => {
    setIsLoading(true)
    const success = await saveUrinaryHealthEntry(urinaryForm)
    if (success) {
      setUrinaryForm({})
      await loadData()
    }
    setIsLoading(false)
  }

  const handleMarkAlertRead = async (alertId: string) => {
    await markHealthAlertRead(alertId)
    await loadData()
  }

  const latestScore = wellnessScores[0]
  const unreadAlerts = alerts.filter(a => !a.is_read)

  return (
    <div className="space-y-6">
      {/* Overview Dashboard */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-2 md:grid-cols-6 w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="prostate">Prostate</TabsTrigger>
          <TabsTrigger value="testicular">Testicular</TabsTrigger>
          <TabsTrigger value="sexual">Sexual</TabsTrigger>
          <TabsTrigger value="hormones">Hormones</TabsTrigger>
          <TabsTrigger value="urinary">Urinary</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Wellness Score */}
          {latestScore && (
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Overall Wellness Score
                </CardTitle>
                <CardDescription>
                  Last updated: {format(new Date(latestScore.entry_date), 'MMM d, yyyy')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Overall Score</span>
                      <span className="font-bold text-primary">{latestScore.overall_score}/100</span>
                    </div>
                    <Progress value={latestScore.overall_score} className="h-3" />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Physical</div>
                      <div className="text-2xl font-bold">{latestScore.physical_score}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Emotional</div>
                      <div className="text-2xl font-bold">{latestScore.emotional_score}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Relationship</div>
                      <div className="text-2xl font-bold">{latestScore.relationship_score}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Health Alerts */}
          {unreadAlerts.length > 0 && (
            <Card className="glass-card border-yellow-500/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  Health Alerts ({unreadAlerts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2">
                    {unreadAlerts.map((alert) => (
                      <div
                        key={alert.id}
                        className="p-3 rounded-lg border border-yellow-500/30 bg-yellow-500/10"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-xs">
                                {alert.category}
                              </Badge>
                              {alert.action_required && (
                                <Badge variant="destructive" className="text-xs">
                                  Action Required
                                </Badge>
                              )}
                            </div>
                            <h4 className="font-semibold text-sm">{alert.title}</h4>
                            <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkAlertRead(alert.id)}
                          >
                            Dismiss
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* Risk Factors */}
          {riskFactors.length > 0 && (
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Risk Assessment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {riskFactors.map((risk) => (
                    <div key={risk.id} className="p-3 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold capitalize">{risk.risk_type}</span>
                        <Badge
                          variant={
                            risk.risk_level === 'very_high' || risk.risk_level === 'high'
                              ? 'destructive'
                              : risk.risk_level === 'moderate'
                              ? 'default'
                              : 'secondary'
                          }
                        >
                          {risk.risk_level}
                        </Badge>
                      </div>
                      {risk.recommendations.length > 0 && (
                        <ul className="text-sm text-muted-foreground list-disc list-inside">
                          {risk.recommendations.map((rec: string, idx: number) => (
                            <li key={idx}>{rec}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Prostate Health Tab */}
        <TabsContent value="prostate" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Prostate Health Tracking</CardTitle>
              <CardDescription>
                Track your prostate health symptoms and metrics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">PSA Level (ng/mL)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={prostateForm.psa_level || ''}
                    onChange={(e) => setProstateForm({ ...prostateForm, psa_level: parseFloat(e.target.value) || null })}
                    placeholder="Enter PSA level"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Pain Level (0-10)</label>
                  <Input
                    type="number"
                    min="0"
                    max="10"
                    value={prostateForm.pain_level || ''}
                    onChange={(e) => setProstateForm({ ...prostateForm, pain_level: parseInt(e.target.value) || null })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Urination Frequency (per day)</label>
                  <Input
                    type="number"
                    value={prostateForm.urination_frequency || ''}
                    onChange={(e) => setProstateForm({ ...prostateForm, urination_frequency: parseInt(e.target.value) || null })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Urination Difficulty</label>
                  <Select
                    value={prostateForm.urination_difficulty || ''}
                    onValueChange={(value) => setProstateForm({ ...prostateForm, urination_difficulty: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="mild">Mild</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="severe">Severe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="blood_urine"
                  checked={prostateForm.blood_in_urine || false}
                  onChange={(e) => setProstateForm({ ...prostateForm, blood_in_urine: e.target.checked })}
                />
                <label htmlFor="blood_urine" className="text-sm">Blood in urine</label>
              </div>
              <div>
                <label className="text-sm font-medium">Notes</label>
                <Textarea
                  value={prostateForm.notes || ''}
                  onChange={(e) => setProstateForm({ ...prostateForm, notes: e.target.value })}
                  placeholder="Additional notes..."
                  className="min-h-[100px]"
                />
              </div>
              <Button
                onClick={handleSaveProstate}
                disabled={isLoading}
                className="w-full"
                variant="gradient"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Entry
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Testicular Health Tab */}
        <TabsContent value="testicular" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Testicular Health Tracking</CardTitle>
              <CardDescription>
                Track self-examinations and testicular health
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="self_exam"
                  checked={testicularForm.self_exam_performed || false}
                  onChange={(e) => setTesticularForm({ ...testicularForm, self_exam_performed: e.target.checked })}
                />
                <label htmlFor="self_exam" className="text-sm">Self-examination performed</label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="abnormalities"
                  checked={testicularForm.abnormalities_found || false}
                  onChange={(e) => setTesticularForm({ ...testicularForm, abnormalities_found: e.target.checked })}
                />
                <label htmlFor="abnormalities" className="text-sm">Abnormalities found</label>
              </div>
              {testicularForm.abnormalities_found && (
                <div>
                  <label className="text-sm font-medium">Abnormality Description</label>
                  <Textarea
                    value={testicularForm.abnormality_description || ''}
                    onChange={(e) => setTesticularForm({ ...testicularForm, abnormality_description: e.target.value })}
                    placeholder="Describe any abnormalities..."
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Pain Level (0-10)</label>
                  <Input
                    type="number"
                    min="0"
                    max="10"
                    value={testicularForm.pain_level || ''}
                    onChange={(e) => setTesticularForm({ ...testicularForm, pain_level: parseInt(e.target.value) || null })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Notes</label>
                  <Textarea
                    value={testicularForm.notes || ''}
                    onChange={(e) => setTesticularForm({ ...testicularForm, notes: e.target.value })}
                    placeholder="Additional notes..."
                  />
                </div>
              </div>
              <Button
                onClick={handleSaveTesticular}
                disabled={isLoading}
                className="w-full"
                variant="gradient"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Entry
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sexual Health Tab */}
        <TabsContent value="sexual" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Sexual Health Tracking</CardTitle>
              <CardDescription>
                Monitor sexual function, libido, and satisfaction
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Erectile Function (0-10)</label>
                  <Input
                    type="number"
                    min="0"
                    max="10"
                    value={sexualForm.erectile_function_score || ''}
                    onChange={(e) => setSexualForm({ ...sexualForm, erectile_function_score: parseInt(e.target.value) || null })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Libido Level (0-10)</label>
                  <Input
                    type="number"
                    min="0"
                    max="10"
                    value={sexualForm.libido_level || ''}
                    onChange={(e) => setSexualForm({ ...sexualForm, libido_level: parseInt(e.target.value) || null })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Satisfaction (0-10)</label>
                  <Input
                    type="number"
                    min="0"
                    max="10"
                    value={sexualForm.satisfaction_level || ''}
                    onChange={(e) => setSexualForm({ ...sexualForm, satisfaction_level: parseInt(e.target.value) || null })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Frequency (per week)</label>
                  <Input
                    type="number"
                    value={sexualForm.frequency_per_week || ''}
                    onChange={(e) => setSexualForm({ ...sexualForm, frequency_per_week: parseInt(e.target.value) || null })}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Notes</label>
                <Textarea
                  value={sexualForm.notes || ''}
                  onChange={(e) => setSexualForm({ ...sexualForm, notes: e.target.value })}
                  placeholder="Additional notes..."
                />
              </div>
              <Button
                onClick={handleSaveSexual}
                disabled={isLoading}
                className="w-full"
                variant="gradient"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Entry
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Hormones Tab */}
        <TabsContent value="hormones" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Hormone Level Tracking</CardTitle>
              <CardDescription>
                Record hormone test results (user-provided data)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Test Date</label>
                <Input
                  type="date"
                  value={hormoneForm.test_date || ''}
                  onChange={(e) => setHormoneForm({ ...hormoneForm, test_date: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Total Testosterone (ng/dL)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={hormoneForm.testosterone_total || ''}
                    onChange={(e) => setHormoneForm({ ...hormoneForm, testosterone_total: parseFloat(e.target.value) || null })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Free Testosterone (pg/mL)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={hormoneForm.testosterone_free || ''}
                    onChange={(e) => setHormoneForm({ ...hormoneForm, testosterone_free: parseFloat(e.target.value) || null })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">LH (mIU/mL)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={hormoneForm.lh || ''}
                    onChange={(e) => setHormoneForm({ ...hormoneForm, lh: parseFloat(e.target.value) || null })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">FSH (mIU/mL)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={hormoneForm.fsh || ''}
                    onChange={(e) => setHormoneForm({ ...hormoneForm, fsh: parseFloat(e.target.value) || null })}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Lab Name</label>
                <Input
                  value={hormoneForm.lab_name || ''}
                  onChange={(e) => setHormoneForm({ ...hormoneForm, lab_name: e.target.value })}
                  placeholder="Lab or clinic name"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Notes</label>
                <Textarea
                  value={hormoneForm.notes || ''}
                  onChange={(e) => setHormoneForm({ ...hormoneForm, notes: e.target.value })}
                  placeholder="Additional notes..."
                />
              </div>
              <Button
                onClick={handleSaveHormone}
                disabled={isLoading}
                className="w-full"
                variant="gradient"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Hormone Levels
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Urinary Health Tab */}
        <TabsContent value="urinary" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Urinary Health Tracking</CardTitle>
              <CardDescription>
                Monitor urinary function and symptoms
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Frequency (per day)</label>
                  <Input
                    type="number"
                    value={urinaryForm.frequency_per_day || ''}
                    onChange={(e) => setUrinaryForm({ ...urinaryForm, frequency_per_day: parseInt(e.target.value) || null })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Urgency Level (0-10)</label>
                  <Input
                    type="number"
                    min="0"
                    max="10"
                    value={urinaryForm.urgency_level || ''}
                    onChange={(e) => setUrinaryForm({ ...urinaryForm, urgency_level: parseInt(e.target.value) || null })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Nocturia (times per night)</label>
                  <Input
                    type="number"
                    value={urinaryForm.nocturia_count || ''}
                    onChange={(e) => setUrinaryForm({ ...urinaryForm, nocturia_count: parseInt(e.target.value) || null })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Stream Strength (0-10)</label>
                  <Input
                    type="number"
                    min="0"
                    max="10"
                    value={urinaryForm.stream_strength || ''}
                    onChange={(e) => setUrinaryForm({ ...urinaryForm, stream_strength: parseInt(e.target.value) || null })}
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="incontinence"
                    checked={urinaryForm.incontinence || false}
                    onChange={(e) => setUrinaryForm({ ...urinaryForm, incontinence: e.target.checked })}
                  />
                  <label htmlFor="incontinence" className="text-sm">Incontinence</label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="incomplete_emptying"
                    checked={urinaryForm.incomplete_emptying || false}
                    onChange={(e) => setUrinaryForm({ ...urinaryForm, incomplete_emptying: e.target.checked })}
                  />
                  <label htmlFor="incomplete_emptying" className="text-sm">Incomplete Emptying</label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="pain_urination"
                    checked={urinaryForm.pain_on_urination || false}
                    onChange={(e) => setUrinaryForm({ ...urinaryForm, pain_on_urination: e.target.checked })}
                  />
                  <label htmlFor="pain_urination" className="text-sm">Pain on Urination</label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="blood_urine_urinary"
                    checked={urinaryForm.blood_in_urine || false}
                    onChange={(e) => setUrinaryForm({ ...urinaryForm, blood_in_urine: e.target.checked })}
                  />
                  <label htmlFor="blood_urine_urinary" className="text-sm">Blood in Urine</label>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Notes</label>
                <Textarea
                  value={urinaryForm.notes || ''}
                  onChange={(e) => setUrinaryForm({ ...urinaryForm, notes: e.target.value })}
                  placeholder="Additional notes..."
                />
              </div>
              <Button
                onClick={handleSaveUrinary}
                disabled={isLoading}
                className="w-full"
                variant="gradient"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Entry
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

