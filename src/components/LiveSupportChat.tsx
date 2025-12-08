import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  createSupportChatSession,
  getActiveSupportChatSession,
  getSupportChatSessions,
  getSupportChatMessages,
  sendSupportChatMessage,
  escalateToHuman,
  closeSupportChatSession,
  submitChatFeedback,
  markMessagesAsRead,
  getQuickResponses,
  type SupportChatSession,
  type SupportChatMessage,
  type QuickResponse
} from '@/lib/liveSupportChat'
import { MessageSquare, Send, User, Bot, Headphones, X, Star, ThumbsUp, ThumbsDown, AlertCircle, Clock, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'

export const LiveSupportChat = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [session, setSession] = useState<SupportChatSession | null>(null)
  const [messages, setMessages] = useState<SupportChatMessage[]>([])
  const [sessions, setSessions] = useState<SupportChatSession[]>([])
  const [quickResponses, setQuickResponses] = useState<QuickResponse[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [showFeedback, setShowFeedback] = useState(false)
  const [feedback, setFeedback] = useState({ rating: 0, text: '' })
  const [showSessions, setShowSessions] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (user) {
      loadActiveSession()
      loadQuickResponses()
    }
  }, [user])

  useEffect(() => {
    if (session) {
      loadMessages()
      // Poll for new messages every 2 seconds
      const interval = setInterval(() => {
        loadMessages()
      }, 2000)
      return () => clearInterval(interval)
    }
  }, [session])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadActiveSession = async () => {
    setLoading(true)
    try {
      const activeSession = await getActiveSupportChatSession()
      if (activeSession) {
        setSession(activeSession)
      }
    } catch (error) {
      toast.error('Failed to load chat session')
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async () => {
    if (!session) return
    try {
      const sessionMessages = await getSupportChatMessages(session.id)
      setMessages(sessionMessages)
      await markMessagesAsRead(session.id)
    } catch (error) {
      // Silent fail for polling
    }
  }

  const loadQuickResponses = async () => {
    try {
      const responses = await getQuickResponses()
      setQuickResponses(responses)
    } catch (error) {
      // Silent fail
    }
  }

  const loadSessions = async () => {
    setLoading(true)
    try {
      const allSessions = await getSupportChatSessions()
      setSessions(allSessions)
    } catch (error) {
      toast.error('Failed to load sessions')
    } finally {
      setLoading(false)
    }
  }

  const handleStartChat = async () => {
    setLoading(true)
    try {
      const newSession = await createSupportChatSession()
      if (newSession) {
        setSession(newSession)
        toast.success('Chat started!')
      }
    } catch (error) {
      toast.error('Failed to start chat')
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!session || !newMessage.trim()) return

    setLoading(true)
    try {
      const success = await sendSupportChatMessage(session.id, newMessage)
      if (success) {
        setNewMessage('')
        // Wait a bit for AI response
        setTimeout(() => {
          loadMessages()
        }, 1000)
      }
    } catch (error) {
      toast.error('Failed to send message')
    } finally {
      setLoading(false)
    }
  }

  const handleEscalate = async () => {
    if (!session) return

    if (!confirm('Are you sure you want to escalate to human support?')) return

    setLoading(true)
    try {
      const success = await escalateToHuman(session.id, 'User requested human support')
      if (success) {
        await loadActiveSession()
      }
    } catch (error) {
      toast.error('Failed to escalate')
    } finally {
      setLoading(false)
    }
  }

  const handleCloseChat = async () => {
    if (!session) return

    if (!confirm('Are you sure you want to close this chat?')) return

    setLoading(true)
    try {
      const success = await closeSupportChatSession(session.id)
      if (success) {
        setSession(null)
        setMessages([])
        setShowFeedback(true)
      }
    } catch (error) {
      toast.error('Failed to close chat')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitFeedback = async () => {
    if (!session || feedback.rating === 0) {
      toast.error('Please provide a rating')
      return
    }

    setLoading(true)
    try {
      const success = await submitChatFeedback(session.id, feedback.rating, feedback.text)
      if (success) {
        setShowFeedback(false)
        setFeedback({ rating: 0, text: '' })
      }
    } catch (error) {
      toast.error('Failed to submit feedback')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', icon: any }> = {
      active: { variant: 'default', icon: MessageSquare },
      waiting: { variant: 'default', icon: Clock },
      assigned: { variant: 'outline', icon: Headphones },
      resolved: { variant: 'outline', icon: CheckCircle },
      closed: { variant: 'secondary', icon: X }
    }

    const config = variants[status] || { variant: 'default' as const, icon: MessageSquare }
    const Icon = config.icon

    return (
      <Badge variant={config.variant}>
        {Icon && <Icon className="w-3 h-3 mr-1" />}
        {status.toUpperCase()}
      </Badge>
    )
  }

  if (!user) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Please sign in to use support chat</p>
        </CardContent>
      </Card>
    )
  }

  if (showFeedback && session) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Chat Feedback</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="mb-2">How would you rate your experience?</p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <Button
                  key={rating}
                  variant={feedback.rating >= rating ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFeedback({ ...feedback, rating })}
                >
                  <Star className={`w-4 h-4 ${feedback.rating >= rating ? 'fill-yellow-400' : ''}`} />
                </Button>
              ))}
            </div>
          </div>
          <Textarea
            placeholder="Additional feedback (optional)"
            value={feedback.text}
            onChange={(e) => setFeedback({ ...feedback, text: e.target.value })}
            rows={3}
          />
          <div className="flex gap-2">
            <Button onClick={handleSubmitFeedback} disabled={loading || feedback.rating === 0}>
              Submit Feedback
            </Button>
            <Button variant="outline" onClick={() => setShowFeedback(false)}>
              Skip
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!session) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Live Support Chat</CardTitle>
            <p className="text-muted-foreground">
              Get instant help with AI-powered responses. Escalate to human support anytime.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button onClick={handleStartChat} disabled={loading} className="flex-1">
                <MessageSquare className="w-4 h-4 mr-2" />
                Start New Chat
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowSessions(!showSessions)
                  if (!showSessions) {
                    loadSessions()
                  }
                }}
              >
                View History
              </Button>
            </div>

            {showSessions && (
              <div className="mt-4 space-y-2">
                <h3 className="font-semibold">Previous Sessions</h3>
                {sessions.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No previous sessions</p>
                ) : (
                  sessions.map((s) => (
                    <Card key={s.id} className="p-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(s.status)}
                            {s.is_premium_user && <Badge variant="outline">Premium</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {new Date(s.created_at).toLocaleString()}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSession(s)
                            setShowSessions(false)
                          }}
                        >
                          View
                        </Button>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            )}

            <div className="mt-6 p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">Features:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>AI-powered instant responses</li>
                <li>24/7 availability</li>
                <li>Escalate to human support anytime</li>
                <li>Priority support for Premium users</li>
                <li>Multi-language support</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Support Chat
              </CardTitle>
              <div className="flex items-center gap-2 mt-2">
                {getStatusBadge(session.status)}
                {session.is_premium_user && <Badge variant="outline">Premium Priority</Badge>}
                {session.escalated_to_human && <Badge variant="default">Human Support</Badge>}
              </div>
            </div>
            <div className="flex gap-2">
              {session.status === 'active' && !session.escalated_to_human && (
                <Button size="sm" variant="outline" onClick={handleEscalate}>
                  <Headphones className="w-4 h-4 mr-2" />
                  Escalate
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={handleCloseChat}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Messages */}
          <div className="space-y-4 mb-4 max-h-96 overflow-y-auto p-4 bg-muted rounded-lg">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Bot className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Start the conversation! I'm here to help.</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] flex gap-2 ${message.sender_type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.sender_type === 'user' ? 'bg-primary text-primary-foreground' :
                      message.sender_type === 'ai' ? 'bg-blue-500 text-white' :
                      'bg-green-500 text-white'
                    }`}>
                      {message.sender_type === 'user' ? (
                        <User className="w-4 h-4" />
                      ) : message.sender_type === 'ai' ? (
                        <Bot className="w-4 h-4" />
                      ) : (
                        <Headphones className="w-4 h-4" />
                      )}
                    </div>
                    <div className={`flex flex-col ${message.sender_type === 'user' ? 'items-end' : 'items-start'}`}>
                      <div className={`p-3 rounded-lg ${
                        message.sender_type === 'user' ? 'bg-primary text-primary-foreground' :
                        message.sender_type === 'ai' ? 'bg-white border' :
                        'bg-green-100 border border-green-300'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        {message.is_ai_generated && message.ai_confidence && (
                          <p className="text-xs opacity-70 mt-1">
                            AI Confidence: {Math.round(message.ai_confidence * 100)}%
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground mt-1">
                        {new Date(message.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Responses */}
          {quickResponses.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-muted-foreground mb-2">Quick Responses:</p>
              <div className="flex flex-wrap gap-2">
                {quickResponses.slice(0, 5).map((response) => (
                  <Button
                    key={response.id}
                    size="sm"
                    variant="outline"
                    onClick={() => setNewMessage(response.content)}
                  >
                    {response.title}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          {session.status === 'closed' ? (
            <div className="text-center text-muted-foreground py-4">
              <p>This chat has been closed.</p>
              <Button variant="outline" className="mt-2" onClick={handleStartChat}>
                Start New Chat
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Textarea
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage()
                  }
                }}
                rows={2}
                disabled={loading || session.status !== 'active'}
              />
              <Button
                onClick={handleSendMessage}
                disabled={loading || !newMessage.trim() || session.status !== 'active'}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          )}

          {session.escalated_to_human && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-blue-600" />
                <p className="text-sm text-blue-900">
                  Your chat has been escalated to human support. A support agent will respond shortly.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

