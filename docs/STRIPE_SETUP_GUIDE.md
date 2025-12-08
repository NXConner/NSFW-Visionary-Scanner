# Stripe Setup Guide for Three-Version System

This guide explains how to set up Stripe products and prices for all three app versions.

## Overview

You need to create separate Stripe products and prices for:
- SFW Store pricing (Google Play / Apple App Store)
- SFW Direct pricing (Website direct download)
- NSFW Direct pricing (Website only)
- DLC pricing (Store and Direct variants)

## Step 1: Create Stripe Products

### SFW Products

1. **SFW App (One-Time)**
   - Name: "Visionary Scanner - SFW App"
   - Type: One-time payment
   - Description: "Safe for Work version - Store ready"

2. **SFW Pro (Subscription)**
   - Name: "Visionary Scanner - SFW Pro"
   - Type: Recurring subscription
   - Description: "Pro tier for SFW version"

3. **SFW Premium (Subscription)**
   - Name: "Visionary Scanner - SFW Premium"
   - Type: Recurring subscription
   - Description: "Premium tier for SFW version"

4. **SFW Lifetime (One-Time)**
   - Name: "Visionary Scanner - SFW Lifetime"
   - Type: One-time payment
   - Description: "Lifetime access to all SFW features"

### NSFW Products

1. **NSFW App (One-Time)**
   - Name: "Visionary Scanner - NSFW App"
   - Type: One-time payment
   - Description: "Adult content version - Direct download only"

2. **NSFW Pro (Subscription)**
   - Name: "Visionary Scanner - NSFW Pro"
   - Type: Recurring subscription
   - Description: "Pro tier for NSFW version"

3. **NSFW Premium (Subscription)**
   - Name: "Visionary Scanner - NSFW Premium"
   - Type: Recurring subscription
   - Description: "Premium tier for NSFW version"

4. **NSFW Lifetime (One-Time)**
   - Name: "Visionary Scanner - NSFW Lifetime"
   - Type: One-time payment
   - Description: "Lifetime access to all SFW + NSFW features"

### DLC Products

1. **NSFW DLC Upgrade (Store)**
   - Name: "NSFW Content DLC - Store Users"
   - Type: One-time payment
   - Description: "Unlock NSFW content for store-purchased app"

2. **NSFW DLC Upgrade (Direct)**
   - Name: "NSFW Content DLC - Direct Users"
   - Type: One-time payment
   - Description: "Unlock NSFW content for direct-purchased app"

## Step 2: Create Prices

For each product, create prices as follows:

### SFW Store Prices

| Product | Type | Amount | Interval | Price ID Variable |
|---------|------|--------|----------|-------------------|
| SFW App | One-time | $14.99 | - | `VITE_STRIPE_SFW_APP_STORE_PRICE_ID` |
| SFW Pro | Recurring | $12.99 | Monthly | `VITE_STRIPE_SFW_PRO_STORE_MONTHLY_PRICE_ID` |
| SFW Pro | Recurring | $124.99 | Yearly | `VITE_STRIPE_SFW_PRO_STORE_YEARLY_PRICE_ID` |
| SFW Premium | Recurring | $24.99 | Monthly | `VITE_STRIPE_SFW_PREMIUM_STORE_MONTHLY_PRICE_ID` |
| SFW Premium | Recurring | $239.99 | Yearly | `VITE_STRIPE_SFW_PREMIUM_STORE_YEARLY_PRICE_ID` |
| SFW Lifetime | One-time | $299.99 | - | `VITE_STRIPE_SFW_LIFETIME_STORE_PRICE_ID` |

### SFW Direct Prices

| Product | Type | Amount | Interval | Price ID Variable |
|---------|------|--------|----------|-------------------|
| SFW App | One-time | $9.99 | - | `VITE_STRIPE_SFW_APP_DIRECT_PRICE_ID` |
| SFW Pro | Recurring | $9.99 | Monthly | `VITE_STRIPE_SFW_PRO_DIRECT_MONTHLY_PRICE_ID` |
| SFW Pro | Recurring | $95.99 | Yearly | `VITE_STRIPE_SFW_PRO_DIRECT_YEARLY_PRICE_ID` |
| SFW Premium | Recurring | $19.99 | Monthly | `VITE_STRIPE_SFW_PREMIUM_DIRECT_MONTHLY_PRICE_ID` |
| SFW Premium | Recurring | $191.99 | Yearly | `VITE_STRIPE_SFW_PREMIUM_DIRECT_YEARLY_PRICE_ID` |
| SFW Lifetime | One-time | $199.99 | - | `VITE_STRIPE_SFW_LIFETIME_DIRECT_PRICE_ID` |

### NSFW Direct Prices

| Product | Type | Amount | Interval | Price ID Variable |
|---------|------|--------|----------|-------------------|
| NSFW App | One-time | $19.99 | - | `VITE_STRIPE_NSFW_APP_DIRECT_PRICE_ID` |
| NSFW Pro | Recurring | $14.99 | Monthly | `VITE_STRIPE_NSFW_PRO_DIRECT_MONTHLY_PRICE_ID` |
| NSFW Pro | Recurring | $143.99 | Yearly | `VITE_STRIPE_NSFW_PRO_DIRECT_YEARLY_PRICE_ID` |
| NSFW Premium | Recurring | $29.99 | Monthly | `VITE_STRIPE_NSFW_PREMIUM_DIRECT_MONTHLY_PRICE_ID` |
| NSFW Premium | Recurring | $287.99 | Yearly | `VITE_STRIPE_NSFW_PREMIUM_DIRECT_YEARLY_PRICE_ID` |
| NSFW Lifetime | One-time | $399.99 | - | `VITE_STRIPE_NSFW_LIFETIME_DIRECT_PRICE_ID` |

### DLC Prices

| Product | Type | Amount | Interval | Price ID Variable |
|---------|------|--------|----------|-------------------|
| NSFW DLC (Store) | One-time | $24.99 | - | `VITE_STRIPE_NSFW_DLC_STORE_PRICE_ID` |
| NSFW DLC (Direct) | One-time | $19.99 | - | `VITE_STRIPE_NSFW_DLC_DIRECT_PRICE_ID` |

## Step 3: Configure Environment Variables

After creating all prices in Stripe, copy the price IDs and add them to your `.env` file:

```env
# SFW Store Pricing
VITE_STRIPE_SFW_APP_STORE_PRICE_ID=price_xxxxx
VITE_STRIPE_SFW_PRO_STORE_MONTHLY_PRICE_ID=price_xxxxx
VITE_STRIPE_SFW_PRO_STORE_YEARLY_PRICE_ID=price_xxxxx
VITE_STRIPE_SFW_PREMIUM_STORE_MONTHLY_PRICE_ID=price_xxxxx
VITE_STRIPE_SFW_PREMIUM_STORE_YEARLY_PRICE_ID=price_xxxxx
VITE_STRIPE_SFW_LIFETIME_STORE_PRICE_ID=price_xxxxx

# SFW Direct Pricing
VITE_STRIPE_SFW_APP_DIRECT_PRICE_ID=price_xxxxx
VITE_STRIPE_SFW_PRO_DIRECT_MONTHLY_PRICE_ID=price_xxxxx
VITE_STRIPE_SFW_PRO_DIRECT_YEARLY_PRICE_ID=price_xxxxx
VITE_STRIPE_SFW_PREMIUM_DIRECT_MONTHLY_PRICE_ID=price_xxxxx
VITE_STRIPE_SFW_PREMIUM_DIRECT_YEARLY_PRICE_ID=price_xxxxx
VITE_STRIPE_SFW_LIFETIME_DIRECT_PRICE_ID=price_xxxxx

# NSFW Direct Pricing
VITE_STRIPE_NSFW_APP_DIRECT_PRICE_ID=price_xxxxx
VITE_STRIPE_NSFW_PRO_DIRECT_MONTHLY_PRICE_ID=price_xxxxx
VITE_STRIPE_NSFW_PRO_DIRECT_YEARLY_PRICE_ID=price_xxxxx
VITE_STRIPE_NSFW_PREMIUM_DIRECT_MONTHLY_PRICE_ID=price_xxxxx
VITE_STRIPE_NSFW_PREMIUM_DIRECT_YEARLY_PRICE_ID=price_xxxxx
VITE_STRIPE_NSFW_LIFETIME_DIRECT_PRICE_ID=price_xxxxx

# DLC Pricing
VITE_STRIPE_NSFW_DLC_STORE_PRICE_ID=price_xxxxx
VITE_STRIPE_NSFW_DLC_DIRECT_PRICE_ID=price_xxxxx
```

## Step 4: Test Mode vs Live Mode

### Test Mode
- Use test API keys: `pk_test_...` and `sk_test_...`
- Create test products and prices
- Use test cards: `4242 4242 4242 4242`

### Live Mode
- Use live API keys: `pk_live_...` and `sk_live_...`
- Create live products and prices
- Real payments will be processed

## Step 5: Webhook Configuration

Configure Stripe webhooks to handle:
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `checkout.session.completed`
- `payment_intent.succeeded`

Webhook endpoint: `https://your-project.supabase.co/functions/v1/stripe-webhook`

## Step 6: Verify Setup

1. Test checkout flow for each price type
2. Verify webhook events are received
3. Check database updates after successful payments
4. Test subscription cancellation
5. Test DLC purchase flow

## Quick Reference

### Creating a Price in Stripe Dashboard

1. Go to Products → Select product
2. Click "Add another price"
3. Set amount (in cents, e.g., $9.99 = 999)
4. Set billing period (monthly/yearly/one-time)
5. Copy the Price ID (starts with `price_`)
6. Add to environment variables

### Price ID Format
- Test mode: `price_1AbCdEfGhIjKlMnOpQrStUv`
- Live mode: `price_1AbCdEfGhIjKlMnOpQrStUv`

## Troubleshooting

### Price Not Found
- Verify price ID is correct
- Check if price is in test/live mode matching your API keys
- Ensure price is active (not archived)

### Checkout Fails
- Verify Stripe publishable key is set
- Check webhook endpoint is configured
- Verify price ID exists in Stripe

### Webhook Not Receiving Events
- Check webhook endpoint URL is correct
- Verify webhook secret is set
- Check Supabase Edge Function logs

## Next Steps

After Stripe setup:
1. Test all pricing flows
2. Update database with price IDs
3. Deploy to staging
4. Test end-to-end
5. Deploy to production

