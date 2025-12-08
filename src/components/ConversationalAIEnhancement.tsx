/**
 * Conversational AI Enhancement
 * Enhanced AI chatbot with voice interaction, multi-modal AI, contextual memory, and emotional intelligence
 */

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Label } from '@/components/ui/label'
import {
  createAIConversationSession,
  getAIConversationSessions,
  sendAIMessage,
  getAIConversationMessages,
  getAIProactiveSuggestions,
  acceptAISuggestion,
  type AIConversationSession,
  type AIConversationMessage,
  type AIProactiveSuggestion
} from '@/lib/conversationalAIEnhancement'
import { Bot, Mic, Image, MessageSquare, Loader2, Send, Sparkles, Brain } from 'lucide-react'
import { toast } from 'sonner'

export const ConversationalAIEnhancement = () => {
  const [activeTab, setActiveTab] = useState('chat')
  const [loading, setLoading] = useState(false)
  const [sessions, setSessions] = useState<AIConversationSession[]>([])
  const [currentSession, setCurrentSession] = useState<AIConversationSession | null>(null)
  const [messages, setMessages] = useState<AIConversationMessage[]>([])
  const [suggestions, setSuggestions] = useState<AIProactiveSuggestion[]>([])
  const [messageInput, setMessageInput] = useState('')
  const [conversationMode, setConversationMode] = useState<'casual' | 'expert' | 'medical' | 'support'>('casual')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (currentSession) {
      loadMessages()
    }
  }, [currentSession])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadData = async () => {
    setLoading(true)
    try {
      const [sessionsData, suggestionsData] = await Promise.all([
        getAIConversationSessions(),
        getAIProactiveSuggestions()
      ])
      setSessions(sessionsData)
      setSuggestions(suggestionsData)
      if (sessionsData.length > 0 && !currentSession) {
        setCurrentSession(sessionsData[0])
      }
    } catch (error) {
      toast.error('Failed to load AI data')
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async () => {
    if (!currentSession) return

    try {
      const messagesData = await getAIConversationMessages(currentSession.id)
      setMessages(messagesData)
    } catch (error) {
      toast.error('Failed to load messages')
    }
  }

  const handleStartNewSession = async () => {
    try {
      const newSession = await createAIConversationSession(undefined, conversationMode)
      if (newSession) {
        setCurrentSession(newSession)
        setMessages([])
        await loadData()
      }
    } catch (error) {
      toast.error('Failed to start new session')
    }
  }

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !currentSession) return

    try {
      const message = await sendAIMessage(currentSession.id, messageInput)
      if (message) {
        setMessageInput('')
        await loadMessages()
        await loadData() // Refresh suggestions
      }
    } catch (error) {
      toast.error('Failed to send message')
    }
  }

  const handleAcceptSuggestion = async (suggestionId: string) => {
    try {
      const success = await acceptAISuggestion(suggestionId)
      if (success) {
        await loadData()
      }
    } catch (error) {
      toast.error('Failed to accept suggestion')
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  if (loading && !currentSession) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="glass-card border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Loader2 className="w-12 h-12 text-muted-foreground animate-spin mb-4" />
            <p className="text-muted-foreground">Loading AI chat...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!currentSession) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="glass-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="w-6 h-6" />
              Enhanced AI Chat
            </CardTitle>
            <CardDescription>
              Start a conversation with our enhanced AI assistant
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Conversation Mode</Label>
              <select
                className="w-full p-2 border rounded"
                value={conversationMode}
                onChange={(e) => setConversationMode(e.target.value as any)}
              >
                <option value="casual">Casual</option>
                <option value="expert">Expert</option>
                <option value="medical">Medical</option>
                <option value="support">Support</option>
              </select>
            </div>
            <Button onClick={handleStartNewSession} className="w-full">
              Start New Conversation
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <Card className="glass-card border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bot className="w-6 h-6" />
                Enhanced AI Chat
              </CardTitle>
              <CardDescription>
                Mode: {currentSession.conversation_mode} • Language: {currentSession.language}
              </CardDescription>
            </div>
            <Button size="sm" variant="outline" onClick={handleStartNewSession}>
              New Session
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="chat">Chat</TabsTrigger>
              <TabsTrigger value="suggestions">Proactive Suggestions</TabsTrigger>
            </TabsList>

            <TabsContent value="chat" className="space-y-4">
              <ScrollArea className="h-[500px] border rounded-lg p-4">
                <div className="space-y-4">
                  {messages.map(message => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.sender_type === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm">{message.content_text}</p>
                        {message.emotional_tone && (
                          <Badge variant="outline" className="mt-2 text-xs">
                            Tone: {message.emotional_tone}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
              <div className="flex gap-2">
                <Input
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type your message..."
                  className="flex-1"
                />
                <Button onClick={handleSendMessage}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="suggestions" className="space-y-4">
              {suggestions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No proactive suggestions at this time
                </div>
              ) : (
                <div className="space-y-2">
                  {suggestions.map(suggestion => (
                    <Card key={suggestion.id} className="glass-card border-border/50">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{suggestion.suggestion_title}</CardTitle>
                          <Badge variant="secondary">{suggestion.suggestion_type}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">{suggestion.suggestion_content}</p>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleAcceptSuggestion(suggestion.id)}
                          >
                            Accept
                          </Button>
                          <Button size="sm" variant="outline">
                            Dismiss
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

