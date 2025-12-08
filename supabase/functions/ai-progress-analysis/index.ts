/**
 * Supabase Edge Function: AI Progress Analysis
 * Answers user questions about their health progress using AI
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { user_id, question, context } = await req.json()

    if (!user_id || !question) {
      return new Response(
        JSON.stringify({ error: 'user_id and question are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured')
    }

    const systemPrompt = `You are an AI health progress analysis assistant. Answer the user's question about their health progress based on their data.

Be:
- Specific and data-driven
- Encouraging and supportive
- Educational
- Actionable

Provide a clear, concise answer in natural language.`

    const userPrompt = `User Question: ${question}

Health Data Context:
${JSON.stringify(context || {}, null, 2)}

Please analyze this data and answer the user's question.`

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      throw new Error(`AI service error: ${response.status}`)
    }

    const data = await response.json()
    const answer = data.choices?.[0]?.message?.content || 'Unable to generate response.'

    return new Response(
      JSON.stringify({ response: answer }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

