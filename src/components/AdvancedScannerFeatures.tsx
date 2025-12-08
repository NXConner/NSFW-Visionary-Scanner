import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  createMultiAngleScanSession,
  addAngleToSession,
  start3DReconstruction,
  createTimeLapseComparison,
  getTimeLapseComparisons,
  createMeasurementTemplate,
  getMeasurementTemplates,
  createBatchScanSession,
  export3DModel,
  getExported3DModels,
  type MultiAngleScanSession,
  type TimeLapseComparison,
  type MeasurementTemplate,
  type BatchScanSession,
  type Exported3DModel
} from '@/lib/advancedScannerFeatures'
import { Camera, Box, Clock, FileDown, Layers, Settings, Play, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'

export const AdvancedScannerFeatures = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('3d-reconstruction')
  const [loading, setLoading] = useState(false)

  // 3D Reconstruction
  const [multiAngleSessions, setMultiAngleSessions] = useState<MultiAngleScanSession[]>([])
  const [currentSession, setCurrentSession] = useState<MultiAngleScanSession | null>(null)
  const [newSessionName, setNewSessionName] = useState('')
  const [targetAngles, setTargetAngles] = useState(8)

  // Time-Lapse
  const [comparisons, setComparisons] = useState<TimeLapseComparison[]>([])
  const [selectedStartScan, setSelectedStartScan] = useState<string | null>(null)
  const [selectedEndScan, setSelectedEndScan] = useState<string | null>(null)

  // Templates
  const [templates, setTemplates] = useState<MeasurementTemplate[]>([])
  const [newTemplateName, setNewTemplateName] = useState('')

  // Batch Scanning
  const [batchSessions, setBatchSessions] = useState<BatchScanSession[]>([])
  const [newBatchName, setNewBatchName] = useState('')

  // 3D Exports
  const [exports, setExports] = useState<Exported3DModel[]>([])

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user, activeTab])

  const loadData = async () => {
    setLoading(true)
    try {
      switch (activeTab) {
        case '3d-reconstruction':
          // Load sessions would go here
          break
        case 'time-lapse':
          const comparisonsData = await getTimeLapseComparisons()
          setComparisons(comparisonsData)
          break
        case 'templates':
          const templatesData = await getMeasurementTemplates()
          setTemplates(templatesData)
          break
        case 'exports':
          const exportsData = await getExported3DModels()
          setExports(exportsData)
          break
      }
    } catch (error) {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate3DSession = async () => {
    if (!newSessionName.trim()) {
      toast.error('Please enter a session name')
      return
    }

    setLoading(true)
    try {
      const session = await createMultiAngleScanSession(newSessionName, targetAngles)
      if (session) {
        setCurrentSession(session)
        setMultiAngleSessions([session, ...multiAngleSessions])
        setNewSessionName('')
        toast.success('3D scan session created!')
      }
    } catch (error) {
      toast.error('Failed to create session')
    } finally {
      setLoading(false)
    }
  }

  const handleStartReconstruction = async () => {
    if (!currentSession) return

    setLoading(true)
    try {
      const success = await start3DReconstruction(currentSession.id)
      if (success) {
        toast.success('3D reconstruction started!')
        await loadData()
      }
    } catch (error) {
      toast.error('Failed to start reconstruction')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateComparison = async () => {
    if (!selectedStartScan || !selectedEndScan) {
      toast.error('Please select both start and end scans')
      return
    }

    setLoading(true)
    try {
      const comparison = await createTimeLapseComparison(selectedStartScan, selectedEndScan)
      if (comparison) {
        setComparisons([comparison, ...comparisons])
        setSelectedStartScan(null)
        setSelectedEndScan(null)
      }
    } catch (error) {
      toast.error('Failed to create comparison')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTemplate = async () => {
    if (!newTemplateName.trim()) {
      toast.error('Please enter a template name')
      return
    }

    setLoading(true)
    try {
      const template = await createMeasurementTemplate(
        newTemplateName,
        { points: [] }, // Would be configured in UI
        undefined,
        false
      )
      if (template) {
        setTemplates([template, ...templates])
        setNewTemplateName('')
      }
    } catch (error) {
      toast.error('Failed to create template')
    } finally {
      setLoading(false)
    }
  }

  const handleExport3D = async (sessionId: string, format: Exported3DModel['export_format']) => {
    setLoading(true)
    try {
      const exportModel = await export3DModel(sessionId, format)
      if (exportModel) {
        setExports([exportModel, ...exports])
      }
    } catch (error) {
      toast.error('Failed to export 3D model')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', icon: any }> = {
      pending: { variant: 'default', icon: Clock },
      processing: { variant: 'default', icon: Loader2 },
      completed: { variant: 'outline', icon: CheckCircle },
      failed: { variant: 'destructive', icon: XCircle }
    }

    const config = variants[status] || { variant: 'default' as const, icon: null }
    const Icon = config.icon

    return (
      <Badge variant={config.variant}>
        {Icon && <Icon className="w-3 h-3 mr-1" />}
        {status.toUpperCase()}
      </Badge>
    )
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Advanced Scanner Features</h1>
        <p className="text-muted-foreground">Multi-angle 3D reconstruction, time-lapse comparisons, measurement templates, and batch scanning</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="3d-reconstruction">
            <Box className="w-4 h-4 mr-2" />
            3D Reconstruction
          </TabsTrigger>
          <TabsTrigger value="time-lapse">
            <Clock className="w-4 h-4 mr-2" />
            Time-Lapse
          </TabsTrigger>
          <TabsTrigger value="templates">
            <Settings className="w-4 h-4 mr-2" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="batch">
            <Layers className="w-4 h-4 mr-2" />
            Batch Scan
          </TabsTrigger>
          <TabsTrigger value="exports">
            <FileDown className="w-4 h-4 mr-2" />
            Exports
          </TabsTrigger>
        </TabsList>

        {/* 3D Reconstruction */}
        <TabsContent value="3d-reconstruction" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Multi-Angle 3D Reconstruction</CardTitle>
                <Button onClick={handleCreate3DSession} disabled={loading}>
                  <Camera className="w-4 h-4 mr-2" />
                  New Session
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {!currentSession ? (
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <Input
                      placeholder="Session Name"
                      value={newSessionName}
                      onChange={(e) => setNewSessionName(e.target.value)}
                      className="mb-3"
                    />
                    <div className="flex items-center gap-4">
                      <label className="text-sm">Target Angles:</label>
                      <Input
                        type="number"
                        value={targetAngles}
                        onChange={(e) => setTargetAngles(parseInt(e.target.value) || 8)}
                        className="w-20"
                        min="4"
                        max="16"
                      />
                    </div>
                    <Button onClick={handleCreate3DSession} className="mt-4" disabled={loading}>
                      Create Session
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Capture multiple angles to create a detailed 3D model. Recommended: 8 angles for best results.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-semibold">{currentSession.session_name}</h3>
                      {getStatusBadge(currentSession.processing_status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Angles captured: {currentSession.angles_captured} / {currentSession.target_angles}
                    </p>
                    {currentSession.angles_captured >= currentSession.target_angles && (
                      <Button
                        onClick={handleStartReconstruction}
                        className="mt-4"
                        disabled={loading || currentSession.processing_status === 'processing'}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Start 3D Reconstruction
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Time-Lapse Comparison */}
        <TabsContent value="time-lapse" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Time-Lapse Comparisons</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mb-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Start Scan</label>
                    <Input
                      placeholder="Scan ID"
                      value={selectedStartScan || ''}
                      onChange={(e) => setSelectedStartScan(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">End Scan</label>
                    <Input
                      placeholder="Scan ID"
                      value={selectedEndScan || ''}
                      onChange={(e) => setSelectedEndScan(e.target.value)}
                    />
                  </div>
                </div>
                <Button onClick={handleCreateComparison} disabled={loading || !selectedStartScan || !selectedEndScan}>
                  Create Comparison
                </Button>
              </div>

              <div className="space-y-2">
                {comparisons.map((comparison) => (
                  <Card key={comparison.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">{comparison.comparison_name || 'Comparison'}</h4>
                          <p className="text-sm text-muted-foreground">
                            {comparison.time_period_days} days
                          </p>
                          {comparison.length_change && (
                            <p className="text-sm mt-1">
                              Length change: {comparison.length_change > 0 ? '+' : ''}{comparison.length_change.toFixed(2)} cm
                            </p>
                          )}
                          {comparison.growth_percentage && (
                            <p className="text-sm">
                              Growth: {comparison.growth_percentage > 0 ? '+' : ''}{comparison.growth_percentage.toFixed(1)}%
                            </p>
                          )}
                        </div>
                        {comparison.comparison_image_url && (
                          <img
                            src={comparison.comparison_image_url}
                            alt="Comparison"
                            className="w-32 h-32 object-cover rounded"
                          />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Measurement Templates */}
        <TabsContent value="templates" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Measurement Templates</CardTitle>
                <Button onClick={handleCreateTemplate} disabled={loading}>
                  <Settings className="w-4 h-4 mr-2" />
                  New Template
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Input
                  placeholder="Template Name"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  className="mb-2"
                />
              </div>

              <div className="space-y-2">
                {templates.map((template) => (
                  <Card key={template.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-semibold">{template.template_name}</h4>
                          <p className="text-sm text-muted-foreground">{template.description}</p>
                          <div className="flex gap-2 mt-2">
                            {template.is_default && <Badge variant="outline">Default</Badge>}
                            {template.is_shared && <Badge variant="outline">Shared</Badge>}
                            <Badge variant="secondary">Used {template.usage_count} times</Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Batch Scanning */}
        <TabsContent value="batch" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Batch Scan Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Create batch scanning sessions to capture multiple scans automatically.
              </p>
              <div className="space-y-2">
                {batchSessions.map((session) => (
                  <Card key={session.id}>
                    <CardContent className="p-4">
                      <h4 className="font-semibold">{session.session_name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {session.scans_captured} / {session.target_count} scans
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 3D Exports */}
        <TabsContent value="exports" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>3D Model Exports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {exports.map((exportModel) => (
                  <Card key={exportModel.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-semibold">Export {exportModel.export_format.toUpperCase()}</h4>
                          <p className="text-sm text-muted-foreground">
                            {exportModel.file_size_bytes ? `${(exportModel.file_size_bytes / 1024 / 1024).toFixed(2)} MB` : 'Unknown size'}
                          </p>
                          <Badge variant="outline" className="mt-2">{exportModel.quality_level}</Badge>
                        </div>
                        <Button
                          onClick={() => window.open(exportModel.file_url, '_blank')}
                          variant="outline"
                        >
                          <FileDown className="w-4 h-4 mr-2" />
                          Download
                        </Button>
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

