/**
 * NSFW Advanced Features
 * UI component for pornmd.com integration, multi-camera recording, intimate date planning, seductive AI chat, and sex positions
 */

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  getPornMDIntegration,
  enablePornMDIntegration,
  createMultiCameraSession,
  startRecording,
  stopRecording,
  createIntimateDateProposal,
  respondToProposal,
  createSeductiveAISession,
  sendSeductiveAIMessage,
  getSexPositions,
  savePosition,
  type PornMDIntegration,
  type MultiCameraSession,
  type IntimateDateProposal,
  type SeductiveAISession,
  type SexPosition
} from '@/lib/nsfwAdvancedFeatures'
import { recordVideo, uploadRecordedVideo } from '@/lib/videoProcessing'
import { MediaUploader } from '@/components/MediaUploader'
import { STORAGE_BUCKETS } from '@/lib/mediaUpload'
import { Video, Camera, Heart, MessageSquare, Loader2, Play, Square, Mic, Image as ImageIcon, Send, CheckCircle2, X, Star } from 'lucide-react'
import { toast } from 'sonner'
import { logger } from '@/lib/logger'

export const NSFWAdvancedFeatures = () => {
  const [activeTab, setActiveTab] = useState('pornmd')
  const [loading, setLoading] = useState(false)
  
  // PornMD
  const [pornmdIntegration, setPornmdIntegration] = useState<PornMDIntegration | null>(null)
  const [pornmdApiKey, setPornmdApiKey] = useState('')
  const [pornmdApiSecret, setPornmdApiSecret] = useState('')
  
  // Multi-Camera
  const [sessions, setSessions] = useState<MultiCameraSession[]>([])
  const [currentSession, setCurrentSession] = useState<MultiCameraSession | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [cameraStreams, setCameraStreams] = useState<MediaStream[]>([])
  const [recorders, setRecorders] = useState<MediaRecorder[]>([])
  const videoRefs = useRef<{ [key: number]: HTMLVideoElement | null }>({})
  
  // Intimate Dates
  const [proposals, setProposals] = useState<IntimateDateProposal[]>([])
  const [newProposal, setNewProposal] = useState({
    title: '',
    date: '',
    time: '',
    location: '',
    locationType: 'home' as const,
    message: '',
    positions: [] as string[]
  })
  
  // Seductive AI
  const [aiSession, setAiSession] = useState<SeductiveAISession | null>(null)
  const [aiMessages, setAiMessages] = useState<any[]>([])
  const [aiInput, setAiInput] = useState('')
  const [aiPersonality, setAiPersonality] = useState<'seductive' | 'flirty' | 'dirty' | 'nasty' | 'romantic' | 'kinky'>('seductive')
  const [aiIntensity, setAiIntensity] = useState<'light' | 'medium' | 'strong' | 'extreme'>('medium')
  
  // Sex Positions
  const [positions, setPositions] = useState<SexPosition[]>([])
  const [positionCategory, setPositionCategory] = useState<string>('all')
  const [positionDifficulty, setPositionDifficulty] = useState<string>('all')

  useEffect(() => {
    loadData()
  }, [activeTab])

  const loadData = async () => {
    setLoading(true)
    try {
      switch (activeTab) {
        case 'pornmd': {
          const integration = await getPornMDIntegration()
          setPornmdIntegration(integration)
          break
        }
        case 'recording': {
          // Load sessions would go here
          break
        }
        case 'dates': {
          // Load proposals would go here
          break
        }
        case 'ai-chat': {
          // Load AI session would go here
          break
        }
        case 'positions': {
          const pos = await getSexPositions()
          setPositions(pos)
          break
        }
      }
    } catch (error) {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleEnablePornMD = async () => {
    if (!pornmdApiKey || !pornmdApiSecret) {
      toast.error('Please enter API credentials')
      return
    }

    try {
      const integration = await enablePornMDIntegration(
        pornmdApiKey,
        pornmdApiSecret,
        {}
      )
      if (integration) {
        setPornmdIntegration(integration)
        setPornmdApiKey('')
        setPornmdApiSecret('')
      }
    } catch (error) {
      toast.error('Failed to enable integration')
    }
  }

  const [recorders, setRecorders] = useState<MediaRecorder[]>([])

  const handleStartRecording = async () => {
    if (!currentSession) {
      // Create new session
      const session = await createMultiCameraSession(
        `Recording ${new Date().toLocaleString()}`,
        'multi_camera',
        null,
        '1080p'
      )
      if (session) {
        setCurrentSession(session)
        await startRecording(session.id)
        setIsRecording(true)
        await initializeCameras()
      }
    } else {
      await startRecording(currentSession.id)
      setIsRecording(true)
      await initializeCameras()
    }
  }

  const initializeCameras = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter(device => device.kind === 'videoinput')
      
      const streams: MediaStream[] = []
      const newRecorders: MediaRecorder[] = []
      
      for (let i = 0; i < Math.min(videoDevices.length, 4); i++) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: videoDevices[i].deviceId },
          audio: true
        })
        streams.push(stream)
        
        // Create MediaRecorder for each stream
        const recorder = new MediaRecorder(stream, {
          mimeType: 'video/webm;codecs=vp9,opus'
        })
        newRecorders.push(recorder)
      }
      
      setCameraStreams(streams)
      setRecorders(newRecorders)
      
      // Start recording on all recorders
      newRecorders.forEach(recorder => {
        if (recorder.state === 'inactive') {
          recorder.start()
        }
      })
      
      // Attach streams to video elements
      streams.forEach((stream, index) => {
        if (videoRefs.current[index]) {
          videoRefs.current[index]!.srcObject = stream
        }
      })
    } catch (error) {
      logger.error('Error initializing cameras:', error)
      toast.error('Failed to access cameras')
    }
  }

  const handleStopRecording = async () => {
    if (!currentSession) return

    // Stop all recorders and collect recordings
    const recordings: Blob[] = []
    for (const recorder of recorders) {
      if (recorder.state === 'recording') {
        const chunks: Blob[] = []
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data)
        }
        recorder.stop()
        
        // Wait for data to be available
        await new Promise(resolve => setTimeout(resolve, 1000))
        if (chunks.length > 0) {
          recordings.push(new Blob(chunks, { type: 'video/webm' }))
        }
      }
    }

    // Stop all camera streams
    cameraStreams.forEach(stream => {
      stream.getTracks().forEach(track => track.stop())
    })
    setCameraStreams([])
    setRecorders([])

    // Upload recordings
    if (recordings.length > 0 && currentSession) {
      for (let i = 0; i < recordings.length; i++) {
        const recording = {
          id: `recording-${Date.now()}-${i}`,
          blob: recordings[i],
          duration: 0, // Would calculate from metadata
          startTime: Date.now(),
          endTime: Date.now()
        }
        await uploadRecordedVideo(recording, currentSession.id, `camera-${i}`)
      }
    }

    await stopRecording(currentSession.id, 0) // Duration would be calculated
    setIsRecording(false)
    toast.success('Recording stopped and uploaded!')
  }

  const handleCreateProposal = async () => {
    if (!newProposal.title || !newProposal.date || !newProposal.time) {
      toast.error('Please fill in required fields')
      return
    }

    // In real implementation, partner_id would be selected
    const partnerId = 'partner-id-here' // Would come from user selection

    try {
      const proposal = await createIntimateDateProposal(partnerId, {
        title: newProposal.title,
        date: newProposal.date,
        time: newProposal.time,
        location: newProposal.location,
        locationType: newProposal.locationType,
        activities: { positions: newProposal.positions },
        positions: newProposal.positions,
        message: newProposal.message
      })

      if (proposal) {
        setNewProposal({
          title: '',
          date: '',
          time: '',
          location: '',
          locationType: 'home',
          message: '',
          positions: []
        })
        toast.success('Proposal sent!')
      }
    } catch (error) {
      toast.error('Failed to create proposal')
    }
  }

  const handleStartAIChat = async () => {
    try {
      const session = await createSeductiveAISession(aiPersonality, aiIntensity)
      if (session) {
        setAiSession(session)
        setAiMessages([])
      }
    } catch (error) {
      toast.error('Failed to start AI chat')
    }
  }

  const handleSendAIMessage = async () => {
    if (!aiInput.trim() || !aiSession) return

    try {
      const result = await sendSeductiveAIMessage(aiSession.id, aiInput)
      if (result) {
        setAiMessages(prev => [...prev, result.userMessage, result.aiResponse])
        setAiInput('')
      }
    } catch (error) {
      toast.error('Failed to send message')
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Card className="glass-card border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Loader2 className="w-12 h-12 text-muted-foreground animate-spin mb-4" />
            <p className="text-muted-foreground">Loading NSFW features...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <Card className="glass-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-6 h-6" />
            NSFW Advanced Features
          </CardTitle>
          <CardDescription>
            PornMD integration, multi-camera recording, intimate date planning, seductive AI chat, and sex positions library
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="pornmd">PornMD</TabsTrigger>
              <TabsTrigger value="recording">Recording</TabsTrigger>
              <TabsTrigger value="dates">Intimate Dates</TabsTrigger>
              <TabsTrigger value="ai-chat">AI Chat</TabsTrigger>
              <TabsTrigger value="positions">Positions</TabsTrigger>
            </TabsList>

            <TabsContent value="pornmd" className="space-y-4">
              <Card className="glass-card border-border/50">
                <CardHeader>
                  <CardTitle>PornMD.com Integration</CardTitle>
                  <CardDescription>
                    Connect with PornMD for enhanced content discovery and potential partnership opportunities
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {pornmdIntegration?.is_enabled ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <p className="font-medium">PornMD Integration</p>
                          <p className="text-sm text-muted-foreground">Status: Active</p>
                          {pornmdIntegration.is_partner && (
                            <Badge variant="default" className="mt-2">
                              Partner: {pornmdIntegration.partner_tier}
                            </Badge>
                          )}
                        </div>
                        <Badge variant="default">Enabled</Badge>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <Label>API Key</Label>
                        <Input
                          type="password"
                          value={pornmdApiKey}
                          onChange={(e) => setPornmdApiKey(e.target.value)}
                          placeholder="Enter PornMD API Key"
                        />
                      </div>
                      <div>
                        <Label>API Secret</Label>
                        <Input
                          type="password"
                          value={pornmdApiSecret}
                          onChange={(e) => setPornmdApiSecret(e.target.value)}
                          placeholder="Enter PornMD API Secret"
                        />
                      </div>
                      <Button onClick={handleEnablePornMD} className="w-full">
                        Enable PornMD Integration
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="recording" className="space-y-4">
              <Card className="glass-card border-border/50">
                <CardHeader>
                  <CardTitle>Multi-Camera Recording</CardTitle>
                  <CardDescription>
                    Record with multiple cameras, sync with partner, and create professional content
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Button
                      onClick={handleStartRecording}
                      disabled={isRecording}
                      className="flex-1"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Start Recording
                    </Button>
                    <Button
                      onClick={handleStopRecording}
                      disabled={!isRecording}
                      variant="destructive"
                      className="flex-1"
                    >
                      <Square className="w-4 h-4 mr-2" />
                      Stop Recording
                    </Button>
                  </div>

                  {isRecording && (
                    <div className="grid grid-cols-2 gap-4">
                      {cameraStreams.map((stream, index) => (
                        <div key={index} className="relative aspect-video bg-black rounded overflow-hidden">
                          <video
                            ref={(el) => { videoRefs.current[index] = el }}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-sm">
                            Camera {index + 1}
                          </div>
                          {isRecording && (
                            <div className="absolute top-2 right-2 flex items-center gap-1 bg-red-500 text-white px-2 py-1 rounded text-sm">
                              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                              REC
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="dates" className="space-y-4">
              <Card className="glass-card border-border/50">
                <CardHeader>
                  <CardTitle>Intimate Date Planning</CardTitle>
                  <CardDescription>
                    Plan and propose intimate dates with your partner, including positions, activities, and special requests
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Upload Media (Optional)</Label>
                    <MediaUploader
                      accept="image/*,video/*"
                      multiple
                      bucket={STORAGE_BUCKETS.USER_UPLOADS}
                      folder="intimate-dates"
                      variant="compact"
                      onUploadComplete={(result) => {
                        const results = Array.isArray(result) ? result : [result]
                        const images = results.filter(r => r.type.startsWith('image/')).map(r => r.url)
                        const videos = results.filter(r => r.type.startsWith('video/')).map(r => r.url)
                        setNewProposal({
                          ...newProposal,
                          // Store URLs for later use in proposal
                        })
                        toast.success(`Uploaded ${results.length} file(s)`)
                      }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Proposal Title</Label>
                      <Input
                        value={newProposal.title}
                        onChange={(e) => setNewProposal({ ...newProposal, title: e.target.value })}
                        placeholder="Romantic Evening..."
                      />
                    </div>
                    <div>
                      <Label>Date</Label>
                      <Input
                        type="date"
                        value={newProposal.date}
                        onChange={(e) => setNewProposal({ ...newProposal, date: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Time</Label>
                      <Input
                        type="time"
                        value={newProposal.time}
                        onChange={(e) => setNewProposal({ ...newProposal, time: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Location Type</Label>
                      <Select
                        value={newProposal.locationType}
                        onValueChange={(value) => setNewProposal({ ...newProposal, locationType: value as any })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="home">Home</SelectItem>
                          <SelectItem value="hotel">Hotel</SelectItem>
                          <SelectItem value="outdoor">Outdoor</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Message</Label>
                    <Textarea
                      value={newProposal.message}
                      onChange={(e) => setNewProposal({ ...newProposal, message: e.target.value })}
                      placeholder="Write a flirty, sexy message to your partner..."
                      rows={4}
                    />
                  </div>
                  <Button onClick={handleCreateProposal} className="w-full">
                    <Heart className="w-4 h-4 mr-2" />
                    Send Proposal
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ai-chat" className="space-y-4">
              <Card className="glass-card border-border/50">
                <CardHeader>
                  <CardTitle>Seductive AI Chat</CardTitle>
                  <CardDescription>
                    Chat with an AI specialized in seductive, flirty, and intimate conversations
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!aiSession ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>AI Personality</Label>
                          <Select value={aiPersonality} onValueChange={(value) => setAiPersonality(value as any)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="seductive">Seductive</SelectItem>
                              <SelectItem value="flirty">Flirty</SelectItem>
                              <SelectItem value="dirty">Dirty</SelectItem>
                              <SelectItem value="nasty">Nasty</SelectItem>
                              <SelectItem value="romantic">Romantic</SelectItem>
                              <SelectItem value="kinky">Kinky</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Intensity</Label>
                          <Select value={aiIntensity} onValueChange={(value) => setAiIntensity(value as any)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="light">Light</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="strong">Strong</SelectItem>
                              <SelectItem value="extreme">Extreme</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <Button onClick={handleStartAIChat} className="w-full">
                        Start AI Chat Session
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="h-96 overflow-y-auto border rounded p-4 space-y-2">
                        {aiMessages.map((msg, idx) => (
                          <div
                            key={idx}
                            className={`p-3 rounded ${
                              msg.message_type === 'user'
                                ? 'bg-primary/20 ml-auto max-w-[80%]'
                                : 'bg-muted mr-auto max-w-[80%]'
                            }`}
                          >
                            <p>{msg.message_content}</p>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          value={aiInput}
                          onChange={(e) => setAiInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleSendAIMessage()}
                          placeholder="Type your message..."
                        />
                        <Button onClick={handleSendAIMessage}>
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="positions" className="space-y-4">
              <div className="flex gap-4 mb-4">
                <Select value={positionCategory} onValueChange={setPositionCategory}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                    <SelectItem value="kinky">Kinky</SelectItem>
                    <SelectItem value="romantic">Romantic</SelectItem>
                    <SelectItem value="adventurous">Adventurous</SelectItem>
                    <SelectItem value="acrobatic">Acrobatic</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={positionDifficulty} onValueChange={setPositionDifficulty}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Difficulties</SelectItem>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                    <SelectItem value="expert">Expert</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {positions.map(position => (
                  <Card key={position.id} className="glass-card border-border/50">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold">{position.position_name}</h4>
                        <Badge variant="secondary">{position.difficulty_level}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{position.description}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{position.position_category}</Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => savePosition(position.id)}
                        >
                          <Star className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

