import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get all users with enabled health reminders
    const { data: users, error: usersError } = await supabaseClient
      .from('user_preferences')
      .select('user_id')
      .eq('health_reminders_enabled', true)

    if (usersError) {
      throw usersError
    }

    if (!users || users.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No users with health reminders enabled', sent: 0 }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    const userIds = users.map(u => u.user_id)

    // Get device tokens for these users
    const { data: tokens, error: tokensError } = await supabaseClient
      .from('device_tokens')
      .select('token, user_id')
      .in('user_id', userIds)

    if (tokensError) {
      throw tokensError
    }

    if (!tokens || tokens.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No device tokens found', sent: 0 }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // Send notifications via send-push-notification function
    const tokenList = tokens.map(t => t.token)
    const notificationResponse = await supabaseClient.functions.invoke('send-push-notification', {
      body: {
        tokens: tokenList,
        title: '📊 Health Check Reminder',
        body: 'Time for your daily health tracking!',
        data: {
          type: 'health_reminder',
          action: 'open_scanner',
        },
      },
    })

    return new Response(
      JSON.stringify({
        success: true,
        users_notified: userIds.length,
        tokens_sent: tokenList.length,
        notification_response: notificationResponse,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error sending health reminders:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

