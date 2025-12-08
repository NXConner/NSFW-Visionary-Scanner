/**
 * Supabase Edge Function: Predict Health Trends
 * Uses AI to predict future health metrics
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

    const { user_id, timeframe = '6_months' } = await req.json()

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'user_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check cache
    const { data: cached } = await supabaseClient
      .from('health_prediction_cache')
      .select('*')
      .eq('user_id', user_id)
      .eq('timeframe', timeframe)
      .gt('expires_at', new Date().toISOString())
      .order('generated_at', { ascending: false })
      .limit(1)
      .single()

    if (cached) {
      return new Response(
        JSON.stringify({ predictions: cached.prediction_data }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get historical data
    const [wellness, sexual] = await Promise.all([
      supabaseClient.from('sexual_wellness_scores').select('*').eq('user_id', user_id).order('entry_date', { ascending: false }).limit(180),
      supabaseClient.from('sexual_health_metrics').select('*').eq('user_id', user_id).order('entry_date', { ascending: false }).limit(180)
    ])

    const context = {
      wellness_scores: wellness.data || [],
      sexual_health: sexual.data || [],
      timeframe
    }

    // Call AI for predictions
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured')
    }

    const systemPrompt = `You are an AI health prediction assistant. Analyze historical health data and predict future trends.

Return JSON array of predictions:
[
  {
    "metric": "Metric name",
    "current_value": number,
    "predicted_value": number,
    "timeframe": "1_month|3_months|6_months|1_year",
    "confidence": 0.0-1.0,
    "factors": ["factor1", "factor2"]
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
          { role: 'user', content: `Predict health trends for ${timeframe}:\n${JSON.stringify(context, null, 2)}` }
        ],
        temperature: 0.5,
      }),
    })

    if (!response.ok) {
      throw new Error(`AI service error: ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || '[]'

    let predictions: any[]
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content]
      predictions = JSON.parse(jsonMatch[1] || content)
    } catch {
      predictions = []
    }

    // Cache results (expires in 7 days)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    await supabaseClient
      .from('health_prediction_cache')
      .insert({
        user_id,
        timeframe,
        prediction_data: predictions,
        expires_at: expiresAt.toISOString()
      })

    return new Response(
      JSON.stringify({ predictions }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

