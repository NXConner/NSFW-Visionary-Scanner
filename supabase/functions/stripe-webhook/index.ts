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

    const signature = req.headers.get('stripe-signature')
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

    if (!signature || !webhookSecret) {
      throw new Error('Missing webhook signature or secret')
    }

    const body = await req.text()
    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return new Response('Webhook signature verification failed', { status: 400 })
    }

    console.log('Received webhook event:', event.type)

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        // Get the price ID to determine plan
        const priceId = subscription.items.data[0]?.price?.id
        let planId = 'free'
        if (priceId) {
          const proPriceId = Deno.env.get('STRIPE_PRO_PRICE_ID')
          const premiumPriceId = Deno.env.get('STRIPE_PREMIUM_PRICE_ID')
          if (priceId === premiumPriceId) {
            planId = 'premium'
          } else if (priceId === proPriceId) {
            planId = 'pro'
          }
        }

        // Find user by customer ID from existing subscription or customer metadata
        const { data: existingSubscription } = await supabaseClient
          .from('user_subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single()

        let userId = existingSubscription?.user_id

        if (!userId) {
          // Try to get user_id from customer metadata
          const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer
          userId = customer.metadata?.supabase_user_id

          if (!userId && customer.email) {
            // Fallback: find user by email (less reliable but better than nothing)
            const { data: profiles } = await supabaseClient
              .from('profiles')
              .select('user_id')
              .eq('email', customer.email)
              .limit(1)
            userId = profiles?.[0]?.user_id
          }
        }

        if (!userId) {
          console.warn('Could not find user for customer:', customerId, 'Subscription will be updated without user_id')
        }

        const { error } = await supabaseClient
          .from('user_subscriptions')
          .upsert({
            user_id: userId,
            stripe_subscription_id: subscription.id,
            stripe_customer_id: customerId,
            plan_id: planId,
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000),
            current_period_end: new Date(subscription.current_period_end * 1000),
            cancel_at_period_end: subscription.cancel_at_period_end,
            updated_at: new Date(),
          }, {
            onConflict: 'stripe_subscription_id'
          })

        if (error) {
          console.error('Error updating subscription:', error)
          throw error
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription

        const { error } = await supabaseClient
          .from('user_subscriptions')
          .update({
            status: 'canceled',
            cancel_at_period_end: true,
            updated_at: new Date(),
          })
          .eq('stripe_subscription_id', subscription.id)

        if (error) {
          console.error('Error canceling subscription:', error)
          throw error
        }
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice

        if (invoice.subscription) {
          // Update subscription status on successful payment
          const { error } = await supabaseClient
            .from('user_subscriptions')
            .update({
              status: 'active',
              updated_at: new Date(),
            })
            .eq('stripe_subscription_id', invoice.subscription as string)

          if (error) {
            console.error('Error updating subscription status:', error)
            throw error
          }
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice

        if (invoice.subscription) {
          // Update subscription status on failed payment
          const { error } = await supabaseClient
            .from('user_subscriptions')
            .update({
              status: 'past_due',
              updated_at: new Date(),
            })
            .eq('stripe_subscription_id', invoice.subscription as string)

          if (error) {
            console.error('Error updating subscription status:', error)
            throw error
          }
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})