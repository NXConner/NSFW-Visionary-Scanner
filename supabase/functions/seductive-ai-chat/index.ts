/**
 * Seductive AI Chat Edge Function
 * Handles AI chat with seductive/flirty personalities using LLM
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') || ''
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') || ''

interface Personality {
  name: string
  systemPrompt: string
  temperature: number
}

const PERSONALITIES: Record<string, Personality> = {
  seductive: {
    name: 'Seductive',
    systemPrompt: `You are a seductive, charming AI companion. You speak in a smooth, alluring manner that is playful and enticing. You use suggestive language and innuendo while remaining tasteful. You're confident, mysterious, and know how to build tension. Keep responses engaging and flirtatious.`,
    temperature: 0.9
  },
  flirty: {
    name: 'Flirty',
    systemPrompt: `You are a flirty, playful AI companion. You're lighthearted, fun, and enjoy teasing. You use playful banter, winks, and suggestive comments. You're confident but not overwhelming. Keep it fun and engaging.`,
    temperature: 0.85
  },
  dirty: {
    name: 'Dirty',
    systemPrompt: `You are a dirty, naughty AI companion. You speak explicitly and use adult language. You're direct, bold, and unapologetic about your desires. You enjoy talking about intimate topics openly.`,
    temperature: 0.95
  },
  nasty: {
    name: 'Nasty',
    systemPrompt: `You are a nasty, explicit AI companion. You use very explicit language and talk about adult topics without reservation. You're bold, direct, and enjoy pushing boundaries.`,
    temperature: 1.0
  },
  romantic: {
    name: 'Romantic',
    systemPrompt: `You are a romantic, passionate AI companion. You speak with emotion, passion, and tenderness. You use romantic language, talk about feelings, and create an intimate, loving atmosphere.`,
    temperature: 0.8
  },
  kinky: {
    name: 'Kinky',
    systemPrompt: `You are a kinky, adventurous AI companion. You enjoy exploring fantasies, fetishes, and unconventional desires. You're open-minded, creative, and enjoy talking about adventurous intimate topics.`,
    temperature: 0.9
  }
}

const INTENSITY_MODIFIERS: Record<string, string> = {
  light: 'Keep it subtle and suggestive.',
  medium: 'Be more direct and engaging.',
  strong: 'Be bold and explicit.',
  extreme: 'Be very explicit and uninhibited.'
}

serve(async (req) => {
  try {
    const { session_id, user_message, media, personality = 'seductive', intensity = 'medium' } = await req.json()

    if (!session_id || !user_message) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Get session context from database
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: session } = await supabase
      .from('seductive_ai_sessions')
      .select('*')
      .eq('id', session_id)
      .single()

    if (!session) {
      return new Response(
        JSON.stringify({ error: 'Session not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Get conversation history
    const { data: messages } = await supabase
      .from('seductive_ai_messages')
      .select('*')
      .eq('session_id', session_id)
      .order('created_at', { ascending: true })
      .limit(20) // Last 20 messages for context

    // Build conversation context
    const conversationHistory = messages?.map(msg => ({
      role: msg.message_type === 'user' ? 'user' : 'assistant',
      content: msg.message_content
    })) || []

    // Get personality
    const personalityConfig = PERSONALITIES[personality] || PERSONALITIES.seductive
    const intensityModifier = INTENSITY_MODIFIERS[intensity] || INTENSITY_MODIFIERS.medium

    // Build system prompt
    const systemPrompt = `${personalityConfig.systemPrompt}\n\n${intensityModifier}\n\nRemember to stay in character and respond naturally to the conversation.`

    // Prepare messages for LLM
    const llmMessages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: user_message }
    ]

    // Call LLM (OpenAI or Anthropic)
    let aiResponse = ''
    let confidence = 0.8
    let sentiment = 'positive'

    if (OPENAI_API_KEY) {
      // Use OpenAI
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: llmMessages,
          temperature: personalityConfig.temperature,
          max_tokens: 500
        })
      })

      const data = await response.json()
      aiResponse = data.choices?.[0]?.message?.content || 'I apologize, I had trouble processing that.'
    } else if (ANTHROPIC_API_KEY) {
      // Use Anthropic Claude
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-opus-20240229',
          max_tokens: 500,
          messages: llmMessages.slice(1) // Remove system message for Claude
        })
      })

      const data = await response.json()
      aiResponse = data.content?.[0]?.text || 'I apologize, I had trouble processing that.'
    } else {
      // Fallback response
      aiResponse = `*${personalityConfig.name.toLowerCase()} voice* ${user_message}... that's interesting. Tell me more.`
    }

    // Analyze sentiment and confidence (simplified)
    const positiveWords = ['love', 'enjoy', 'excited', 'happy', 'pleasure', 'desire']
    const negativeWords = ['hate', 'disgust', 'angry', 'sad', 'disappointed']
    
    const lowerResponse = aiResponse.toLowerCase()
    const positiveCount = positiveWords.filter(word => lowerResponse.includes(word)).length
    const negativeCount = negativeWords.filter(word => lowerResponse.includes(word)).length
    
    sentiment = positiveCount > negativeCount ? 'positive' : negativeCount > positiveCount ? 'negative' : 'neutral'
    confidence = Math.min(0.9, 0.7 + (positiveCount + negativeCount) * 0.05)

    // Generate suggestions (simplified)
    const suggestions = [
      'Ask about their preferences',
      'Share a fantasy',
      'Talk about desires'
    ]

    return new Response(
      JSON.stringify({
        message: aiResponse,
        confidence,
        sentiment,
        suggestions,
        context: {
          personality: personalityConfig.name,
          intensity,
          messageCount: conversationHistory.length
        }
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in seductive-ai-chat:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

