/**
 * AIHealthChatbot Component
 * Full-featured AI health chatbot with streaming responses, message history, and context awareness
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Bot,
  User,
  Send,
  Loader2,
  MessageCircle,
  Trash2,
  Copy,
  RefreshCw,
  AlertTriangle,
  Heart,
  Shield,
  Sparkles,
  Volume2,
  VolumeX,
  ChevronDown,
  Settings,
  History,
  Mic,
  MicOff
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/integrations/supabase/client'
import { logger } from '@/lib/logger'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  isStreaming?: boolean
  error?: boolean
}

interface ChatSession {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
}

interface AIHealthChatbotProps {
  className?: string
  compact?: boolean
  initialContext?: string
  showHistory?: boolean
}

const SUGGESTED_QUESTIONS = [
  'What are safe beginner PE exercises?',
  'How do I prevent injuries during pumping?',
  'What are signs of Peyronie\'s disease?',
  'How can I track my progress effectively?',
  'What is the best routine schedule?',
  'How do I choose the right equipment?'
]

const MEDICAL_DISCLAIMER = `I'm an AI health assistant providing educational information about men's health topics. I am NOT a medical professional and cannot diagnose conditions or replace professional medical advice. Always consult with a healthcare provider for medical concerns.`

export const AIHealthChatbot = ({ 
  className, 
  compact = false,
  initialContext,
  showHistory = true 
}: AIHealthChatbotProps) => {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showDisclaimer, setShowDisclaimer] = useState(true)
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [showSessions, setShowSessions] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(false)
  
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  // Check speech support
  useEffect(() => {
    setSpeechSupported('speechSynthesis' in window && 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
    
    // Initialize speech recognition
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = true
      recognitionRef.current.lang = 'en-US'
      
      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('')
        setInput(transcript)
      }
      
      recognitionRef.current.onend = () => {
        setIsListening(false)
      }
      
      recognitionRef.current.onerror = () => {
        setIsListening(false)
        toast.error('Speech recognition error')
      }
    }
  }, [])

  // Load chat history
  useEffect(() => {
    if (user) {
      loadChatHistory()
    }
  }, [user])

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Add initial context message if provided
  useEffect(() => {
    if (initialContext && messages.length === 0) {
      setMessages([{
        id: crypto.randomUUID(),
        role: 'system',
        content: `Context: ${initialContext}`,
        timestamp: new Date()
      }])
    }
  }, [initialContext])

  const loadChatHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_chat_sessions')
        .select('*')
        .eq('user_id', user?.id)
        .order('updated_at', { ascending: false })
        .limit(20)

      if (error && error.code !== 'PGRST116') {
        logger.error('Failed to load chat history', { error })
        return
      }

      if (data) {
        setSessions(data.map(s => ({
          id: s.id,
          title: s.title || 'New Chat',
          messages: s.messages || [],
          createdAt: new Date(s.created_at),
          updatedAt: new Date(s.updated_at)
        })))
      }
    } catch (error) {
      logger.error('Error loading chat history', { error })
    }
  }

  const saveSession = async (sessionMessages: Message[]) => {
    if (!user) return

    try {
      const sessionData = {
        user_id: user.id,
        title: sessionMessages[0]?.content?.substring(0, 50) || 'New Chat',
        messages: sessionMessages,
        updated_at: new Date().toISOString()
      }

      if (currentSessionId) {
        await supabase
          .from('ai_chat_sessions')
          .update(sessionData)
          .eq('id', currentSessionId)
      } else {
        const { data } = await supabase
          .from('ai_chat_sessions')
          .insert(sessionData)
          .select()
          .single()
        
        if (data) {
          setCurrentSessionId(data.id)
        }
      }
    } catch (error) {
      logger.error('Error saving chat session', { error })
    }
  }

  const handleSendMessage = async (messageContent?: string) => {
    const content = messageContent || input.trim()
    if (!content || isLoading) return

    setInput('')
    setShowDisclaimer(false)

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date()
    }

    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true
    }

    const newMessages = [...messages, userMessage, assistantMessage]
    setMessages(newMessages)
    setIsLoading(true)

    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController()

    try {
      const response = await supabase.functions.invoke('ai-health-chat', {
        body: {
          messages: newMessages
            .filter(m => m.role !== 'system' || m.content.startsWith('Context:'))
            .map(m => ({
              role: m.role,
              content: m.content
            }))
        }
      })

      if (response.error) {
        throw new Error(response.error.message)
      }

      // Handle streaming response
      if (response.data?.body) {
        const reader = response.data.body.getReader()
        const decoder = new TextDecoder()
        let fullContent = ''

        let isReading = true
        while (isReading) {
          const { done, value } = await reader.read()
          if (done) {
            isReading = false
            continue
          }

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6)
              if (data === '[DONE]') continue

              try {
                const parsed = JSON.parse(data)
                const content = parsed.choices?.[0]?.delta?.content || ''
                fullContent += content

                setMessages(prev => prev.map(m => 
                  m.id === assistantMessage.id 
                    ? { ...m, content: fullContent }
                    : m
                ))
              } catch {
                // Skip unparseable lines
              }
            }
          }
        }

        // Finalize message
        setMessages(prev => prev.map(m => 
          m.id === assistantMessage.id 
            ? { ...m, content: fullContent, isStreaming: false }
            : m
        ))

        // Save session
        const finalMessages = newMessages.map(m => 
          m.id === assistantMessage.id 
            ? { ...m, content: fullContent, isStreaming: false }
            : m
        )
        saveSession(finalMessages)
      }
    } catch (error) {
      logger.error('Chat error', { error })
      
      setMessages(prev => prev.map(m => 
        m.id === assistantMessage.id 
          ? { 
              ...m, 
              content: 'I apologize, but I encountered an error. Please try again.', 
              isStreaming: false,
              error: true
            }
          : m
      ))

      if (error instanceof Error && error.message.includes('Rate limit')) {
        toast.error('Rate limit exceeded. Please wait a moment.')
      } else {
        toast.error('Failed to get response. Please try again.')
      }
    } finally {
      setIsLoading(false)
      abortControllerRef.current = null
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      setIsLoading(false)
      
      setMessages(prev => prev.map(m => 
        m.isStreaming ? { ...m, isStreaming: false } : m
      ))
    }
  }

  const handleClearChat = () => {
    setMessages([])
    setCurrentSessionId(null)
    setShowDisclaimer(true)
    toast.success('Chat cleared')
  }

  const handleLoadSession = (session: ChatSession) => {
    setMessages(session.messages)
    setCurrentSessionId(session.id)
    setShowSessions(false)
    setShowDisclaimer(false)
  }

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content)
    toast.success('Copied to clipboard')
  }

  const handleSpeak = (content: string) => {
    if (!speechSupported) return

    if (isSpeaking) {
      speechSynthesis.cancel()
      setIsSpeaking(false)
      return
    }

    const utterance = new SpeechSynthesisUtterance(content)
    utterance.rate = 0.9
    utterance.pitch = 1
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)
    
    speechSynthesisRef.current = utterance
    speechSynthesis.speak(utterance)
    setIsSpeaking(true)
  }

  const handleVoiceInput = () => {
    if (!recognitionRef.current) {
      toast.error('Speech recognition not supported')
      return
    }

    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      recognitionRef.current.start()
      setIsListening(true)
    }
  }

  const handleRegenerateResponse = () => {
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user')
    if (lastUserMessage) {
      // Remove last assistant message
      setMessages(prev => prev.slice(0, -1))
      handleSendMessage(lastUserMessage.content)
    }
  }

  return (
    <Card className={cn('flex flex-col', compact ? 'h-[400px]' : 'h-[600px]', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10">
              <Bot className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                AI Health Assistant
                <Badge variant="outline" className="text-xs">
                  <Sparkles className="w-3 h-3 mr-1" />
                  AI Powered
                </Badge>
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Ask questions about men's health & PE
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {showHistory && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSessions(!showSessions)}
                className="h-8 w-8"
              >
                <History className="w-4 h-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClearChat}
              className="h-8 w-8"
              disabled={messages.length === 0}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <Separator />

      {/* Session History Drawer */}
      {showSessions && sessions.length > 0 && (
        <div className="p-3 border-b bg-muted/30 max-h-48 overflow-y-auto">
          <p className="text-xs font-medium text-muted-foreground mb-2">Recent Conversations</p>
          <div className="space-y-1">
            {sessions.slice(0, 5).map(session => (
              <Button
                key={session.id}
                variant="ghost"
                size="sm"
                className="w-full justify-start text-left h-auto py-2"
                onClick={() => handleLoadSession(session)}
              >
                <MessageCircle className="w-3 h-3 mr-2 flex-shrink-0" />
                <span className="truncate text-xs">{session.title}</span>
              </Button>
            ))}
          </div>
        </div>
      )}

      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full" ref={scrollRef}>
          <div className="p-4 space-y-4">
            {/* Medical Disclaimer */}
            {showDisclaimer && (
              <div className="p-3 rounded-lg bg-warning/10 border border-warning/30">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-warning mb-1">Medical Disclaimer</p>
                    <p className="text-xs text-muted-foreground">{MEDICAL_DISCLAIMER}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Welcome Message */}
            {messages.length === 0 && (
              <div className="text-center py-8">
                <div className="mx-auto mb-4 p-4 rounded-full bg-primary/10 w-fit">
                  <Heart className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">How can I help you today?</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Ask me anything about men's health, PE routines, or general wellness.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SUGGESTED_QUESTIONS.map((question, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      size="sm"
                      className="h-auto py-2 px-3 text-xs text-left justify-start whitespace-normal"
                      onClick={() => handleSendMessage(question)}
                    >
                      {question}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            {messages.filter(m => m.role !== 'system').map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex gap-3',
                  message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                )}
              >
                <Avatar className="w-8 h-8 flex-shrink-0">
                  {message.role === 'assistant' ? (
                    <>
                      <AvatarFallback className="bg-primary/10">
                        <Bot className="w-4 h-4 text-primary" />
                      </AvatarFallback>
                    </>
                  ) : (
                    <>
                      <AvatarImage src={user?.user_metadata?.avatar_url} />
                      <AvatarFallback className="bg-secondary">
                        <User className="w-4 h-4" />
                      </AvatarFallback>
                    </>
                  )}
                </Avatar>
                <div
                  className={cn(
                    'group relative max-w-[80%] rounded-lg px-4 py-2',
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted',
                    message.error && 'bg-destructive/10 border border-destructive/30'
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {message.content}
                    {message.isStreaming && (
                      <span className="inline-block w-2 h-4 ml-1 bg-current animate-pulse" />
                    )}
                  </p>
                  
                  {/* Message Actions */}
                  {message.role === 'assistant' && !message.isStreaming && (
                    <div className="absolute -bottom-6 left-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleCopyMessage(message.content)}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                      {speechSupported && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleSpeak(message.content)}
                        >
                          {isSpeaking ? (
                            <VolumeX className="w-3 h-3" />
                          ) : (
                            <Volume2 className="w-3 h-3" />
                          )}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Loading Indicator */}
            {isLoading && messages[messages.length - 1]?.content === '' && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Thinking...</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleStopGeneration}
                  className="h-6 text-xs"
                >
                  Stop
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>

      <Separator />

      {/* Input Area */}
      <div className="p-4 space-y-2">
        {/* Regenerate Button */}
        {messages.length > 1 && !isLoading && (
          <div className="flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRegenerateResponse}
              className="h-7 text-xs"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Regenerate response
            </Button>
          </div>
        )}
        
        <div className="flex gap-2">
          {speechSupported && (
            <Button
              variant={isListening ? 'default' : 'outline'}
              size="icon"
              onClick={handleVoiceInput}
              className={cn('flex-shrink-0', isListening && 'animate-pulse')}
            >
              {isListening ? (
                <MicOff className="w-4 h-4" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </Button>
          )}
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about health, PE routines, or wellness..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={() => handleSendMessage()}
            disabled={!input.trim() || isLoading}
            className="flex-shrink-0"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        
        <p className="text-xs text-center text-muted-foreground">
          <Shield className="w-3 h-3 inline mr-1" />
          Your conversations are private and encrypted
        </p>
      </div>
    </Card>
  )
}

// Speech Recognition type declaration
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition
    webkitSpeechRecognition: typeof SpeechRecognition
  }
}
