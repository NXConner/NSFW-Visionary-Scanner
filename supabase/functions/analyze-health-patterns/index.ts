/**
 * Supabase Edge Function: Analyze Health Patterns
 * Uses AI to identify patterns in user's health data
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

    const { user_id } = await req.json()

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'user_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check cache first
    const { data: cached } = await supabaseClient
      .from('health_pattern_cache')
      .select('*')
      .eq('user_id', user_id)
      .gt('expires_at', new Date().toISOString())
      .order('analyzed_at', { ascending: false })
      .limit(1)
      .single()

    if (cached) {
      return new Response(
        JSON.stringify({ patterns: cached.pattern_data }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get health data
    const [prostate, testicular, sexual, urinary, wellness] = await Promise.all([
      supabaseClient.from('prostate_health').select('*').eq('user_id', user_id).order('entry_date', { ascending: false }).limit(90),
      supabaseClient.from('testicular_health').select('*').eq('user_id', user_id).order('entry_date', { ascending: false }).limit(90),
      supabaseClient.from('sexual_health_metrics').select('*').eq('user_id', user_id).order('entry_date', { ascending: false }).limit(90),
      supabaseClient.from('urinary_health').select('*').eq('user_id', user_id).order('entry_date', { ascending: false }).limit(90),
      supabaseClient.from('sexual_wellness_scores').select('*').eq('user_id', user_id).order('entry_date', { ascending: false }).limit(90)
    ])

    const context = {
      prostate_health: prostate.data || [],
      testicular_health: testicular.data || [],
      sexual_health: sexual.data || [],
      urinary_health: urinary.data || [],
      wellness_scores: wellness.data || []
    }

    // Call AI to analyze patterns
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured')
    }

    const systemPrompt = `You are an AI health pattern analysis assistant. Analyze the user's health data and identify meaningful patterns.

Return JSON array of patterns:
[
  {
    "pattern_type": "Pattern name",
    "description": "Detailed description",
    "confidence": 0.0-1.0,
    "affected_metrics": ["metric1", "metric2"],
    "timeframe": "e.g., Last 30 days",
    "recommendation": "Actionable recommendation"
  }
]`

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
          { role: 'user', content: `Analyze patterns in this health data:\n${JSON.stringify(context, null, 2)}` }
        ],
        temperature: 0.5,
      }),
    })

    if (!response.ok) {
      throw new Error(`AI service error: ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || '[]'

    let patterns: any[]
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content]
      patterns = JSON.parse(jsonMatch[1] || content)
    } catch {
      patterns = []
    }

    // Cache results (expires in 24 hours)
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24)

    await supabaseClient
      .from('health_pattern_cache')
      .insert({
        user_id,
        pattern_data: patterns,
        expires_at: expiresAt.toISOString()
      })

    return new Response(
      JSON.stringify({ patterns }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

