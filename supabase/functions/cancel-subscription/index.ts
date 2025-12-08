import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@12.0.0'

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

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2023-10-16',
    })

    // Get the user from the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      throw new Error('Invalid user token')
    }

    const { subscriptionId, cancelAtPeriodEnd = true } = await req.json()

    if (!subscriptionId) {
      throw new Error('Subscription ID is required')
    }

    // Verify the subscription belongs to the user
    const { data: subscription, error: subError } = await supabaseClient
      .from('user_subscriptions')
      .select('stripe_subscription_id, user_id')
      .eq('stripe_subscription_id', subscriptionId)
      .eq('user_id', user.id)
      .single()

    if (subError || !subscription) {
      throw new Error('Subscription not found or does not belong to user')
    }

    // Cancel the subscription in Stripe
    const canceledSubscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: cancelAtPeriodEnd,
    })

    // Update the subscription in the database
    const { error: dbError } = await supabaseClient
      .from('user_subscriptions')
      .update({
        cancel_at_period_end: cancelAtPeriodEnd,
        status: cancelAtPeriodEnd ? 'active' : 'canceled',
        updated_at: new Date(),
      })
      .eq('stripe_subscription_id', subscriptionId)

    if (dbError) {
      console.error('Error updating subscription in database:', dbError)
      throw dbError
    }

    return new Response(
      JSON.stringify({
        success: true,
        subscription: {
          id: canceledSubscription.id,
          status: canceledSubscription.status,
          cancel_at_period_end: canceledSubscription.cancel_at_period_end,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error canceling subscription:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

