import serve from 'https://deno.land/std@0.168.0/http/server.ts'
import createClient from 'https://esm.sh/@supabase/supabase-js@2'
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

    const { planId, paymentMethodId } = await req.json()

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

    // Get the plan details
    const plans = {
      pro: { priceId: Deno.env.get('STRIPE_PRO_PRICE_ID'), amount: 999 },
      premium: { priceId: Deno.env.get('STRIPE_PREMIUM_PRICE_ID'), amount: 1999 }
    }

    const plan = plans[planId as keyof typeof plans]
    if (!plan) {
      throw new Error('Invalid plan ID')
    }

    // Create or retrieve customer
    let customer
    const { data: existingCustomer } = await supabaseClient
      .from('user_subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single()

    if (existingCustomer?.stripe_customer_id) {
      customer = await stripe.customers.retrieve(existingCustomer.stripe_customer_id)
    } else {
      customer = await stripe.customers.create({
        email: user.email,
        payment_method: paymentMethodId,
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
        metadata: {
          supabase_user_id: user.id,
        },
      })
    }

    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{
        price: plan.priceId,
      }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
    })

    // Store subscription in database
    const { error: dbError } = await supabaseClient
      .from('user_subscriptions')
      .upsert({
        user_id: user.id,
        stripe_customer_id: customer.id,
        stripe_subscription_id: subscription.id,
        plan_id: planId,
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000),
        current_period_end: new Date(subscription.current_period_end * 1000),
        cancel_at_period_end: false,
        created_at: new Date(),
        updated_at: new Date(),
      })

    if (dbError) {
      // If database insert fails, cancel the Stripe subscription
      await stripe.subscriptions.cancel(subscription.id)
      throw dbError
    }

    return new Response(
      JSON.stringify({
        subscriptionId: subscription.id,
        clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error creating subscription:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
