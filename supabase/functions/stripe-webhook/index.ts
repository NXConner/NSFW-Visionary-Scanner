import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@13.0.0";
import { applyRateLimit, DEFAULT_EDGE_RATE_LIMIT } from "../_shared/rateLimit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async req => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const rateLimitResponse = await applyRateLimit({
    req,
    endpoint: "stripe-webhook",
    ...DEFAULT_EDGE_RATE_LIMIT,
    headers: corsHeaders,
  });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
      apiVersion: "2023-10-16",
    });

    const signature = req.headers.get("stripe-signature");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    if (!signature || !webhookSecret) {
      throw new Error("Missing webhook signature or secret");
    }

    const body = await req.text();
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return new Response("Webhook signature verification failed", { status: 400 });
    }

    console.log("Received webhook event:", event.type);

    const eventId = event.id;
    const stripeCreatedAt =
      typeof (event as any).created === "number"
        ? new Date((event as any).created * 1000).toISOString()
        : null;

    const upsertWebhookEvent = async (
      status: "received" | "processing" | "processed" | "failed" | "skipped",
      errorMessage?: string,
    ) => {
      try {
        await supabaseClient.from("stripe_webhook_events").upsert(
          {
            event_id: eventId,
            event_type: event.type,
            stripe_created_at: stripeCreatedAt,
            status,
            processed_at:
              status === "processed" || status === "failed" || status === "skipped"
                ? new Date().toISOString()
                : null,
            error_message: errorMessage ?? null,
            metadata: {
              livemode: (event as any).livemode ?? null,
              request: (event as any).request ?? null,
            },
          },
          { onConflict: "event_id" },
        );
      } catch (e) {
        console.warn("Failed to upsert stripe_webhook_events (non-fatal):", e);
      }
    };

    // Idempotency short-circuit: if already processed/skipped, return 200 immediately.
    try {
      const { data: existing } = await supabaseClient
        .from("stripe_webhook_events")
        .select("status")
        .eq("event_id", eventId)
        .maybeSingle();
      if (existing?.status === "processed" || existing?.status === "skipped") {
        return new Response(JSON.stringify({ received: true, idempotent: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
    } catch {
      // If the idempotency table doesn't exist yet (migration not run), continue without short-circuit.
    }

    // Atomic claim (prevents concurrent double-processing under retries)
    try {
      const { data: claimed, error: claimErr } = await supabaseClient.rpc(
        "claim_stripe_webhook_event",
        {
          _event_id: eventId,
          _event_type: event.type,
          _stripe_created_at: stripeCreatedAt,
          _metadata: {
            livemode: (event as any).livemode ?? null,
            request: (event as any).request ?? null,
          },
        },
      );
      if (claimErr) throw claimErr;
      if (claimed === false) {
        // Someone else is (or already did) processing this event.
        return new Response(JSON.stringify({ received: true, idempotent: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
    } catch {
      // Backwards compatible: if RPC isn't present yet, proceed with best-effort idempotency.
    }

    await upsertWebhookEvent("processing");

    const generateLicenseKey = () => {
      // Format: XXXX-XXXX-XXXX-XXXX using A-Z0-9
      const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      const segment = () =>
        Array.from(crypto.getRandomValues(new Uint8Array(4)))
          .map(b => alphabet[b % alphabet.length])
          .join("");
      return `${segment()}-${segment()}-${segment()}-${segment()}`;
    };

    const nowIso = new Date().toISOString();
    const revokeDlcByPaymentIds = async (
      paymentIds: Array<string | null | undefined>,
      reason: string,
      refundedAtIso?: string,
    ) => {
      const ids = paymentIds.filter(Boolean) as string[];
      if (!ids.length) return;
      const orClause = ids.map(id => `payment_id.eq.${id}`).join(",");
      const { error } = await supabaseClient
        .from("dlc_licenses")
        .update({
          refunded_at: refundedAtIso ?? nowIso,
          refund_reason: reason,
          is_active: false,
          deactivated_at: nowIso,
          updated_at: nowIso,
        })
        .eq("payment_provider", "stripe")
        .or(orClause);
      if (error) {
        console.warn("Failed to revoke DLC licenses:", { reason, error });
      }
    };

    const revokeMarketplaceByPaymentIds = async (
      paymentIds: Array<string | null | undefined>,
      reason: string,
      refundedAtIso?: string,
    ) => {
      const ids = paymentIds.filter(Boolean) as string[];
      if (!ids.length) return;
      const orClause = ids.map(id => `payment_intent_id.eq.${id}`).join(",");
      const { error } = await supabaseClient
        .from("marketplace_purchases")
        .update({
          is_active: false,
          access_expires_at: refundedAtIso ?? nowIso,
        })
        .or(orClause);
      if (error) {
        console.warn("Failed to revoke marketplace purchases:", { reason, error });
      }
    };

    const revokeRoutineMarketplaceByPaymentIds = async (
      paymentIds: Array<string | null | undefined>,
      reason: string,
      refundedAtIso?: string,
    ) => {
      const ids = paymentIds.filter(Boolean) as string[];
      if (!ids.length) return;
      const orClause = ids.map(id => `payment_intent_id.eq.${id}`).join(",");
      const { error } = await supabaseClient
        .from("routine_purchases")
        .update({
          is_active: false,
          access_expires_at: refundedAtIso ?? nowIso,
        })
        .or(orClause);
      if (error) {
        console.warn("Failed to revoke routine purchases:", { reason, error });
      }
    };

    const revokePremiumContentByPaymentIds = async (
      paymentIds: Array<string | null | undefined>,
      reason: string,
      refundedAtIso?: string,
    ) => {
      const ids = paymentIds.filter(Boolean) as string[];
      if (!ids.length) return;
      const orClause = ids.map(id => `payment_intent_id.eq.${id}`).join(",");
      const { error } = await supabaseClient
        .from("premium_content_purchases")
        .update({
          is_active: false,
          access_expires_at: refundedAtIso ?? nowIso,
        })
        .or(orClause);
      if (error) {
        console.warn("Failed to revoke premium content purchases:", { reason, error });
      }
    };

    const revokeAddOnsByPaymentIds = async (
      paymentIds: Array<string | null | undefined>,
      reason: string,
      refundedAtIso?: string,
    ) => {
      const ids = paymentIds.filter(Boolean) as string[];
      if (!ids.length) return;
      const orClause = ids
        .map(
          id =>
            `stripe_subscription_id.eq.${id},stripe_payment_intent_id.eq.${id},stripe_price_id.eq.${id}`,
        )
        .join(",");
      const { error } = await supabaseClient
        .from("user_add_ons")
        .update({
          status: "canceled",
          canceled_at: refundedAtIso ?? nowIso,
          cancel_at_period_end: true,
          updated_at: nowIso,
        })
        .or(orClause);
      if (error) {
        console.warn("Failed to revoke add-ons:", { reason, error });
      }
    };

    const syncAddOnsForStripeSubscription = async (subscription: Stripe.Subscription) => {
      const startIso = subscription.current_period_start
        ? new Date(subscription.current_period_start * 1000).toISOString()
        : null;
      const endIso = subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000).toISOString()
        : null;
      const { error } = await supabaseClient
        .from("user_add_ons")
        .update({
          status: subscription.status,
          current_period_start: startIso,
          current_period_end: endIso,
          cancel_at_period_end: Boolean(subscription.cancel_at_period_end),
          updated_at: nowIso,
        })
        .eq("stripe_subscription_id", subscription.id);
      if (error) console.warn("Failed to sync user_add_ons for subscription:", error);
    };

    let didHandle = true;
    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;
          const metadata = (session.metadata || {}) as Record<string, string>;

          if (
            metadata.purchase_type !== "dlc" &&
            metadata.purchase_type !== "marketplace" &&
            metadata.purchase_type !== "routine_marketplace" &&
            metadata.purchase_type !== "premium_content" &&
            metadata.purchase_type !== "addon"
          )
            break;

          if (metadata.purchase_type === "marketplace") {
            const userId = metadata.supabase_user_id;
            const itemId = metadata.marketplace_item_id;
            if (!userId || !itemId) {
              console.warn("Marketplace checkout missing metadata", { userId, itemId });
              break;
            }

            const paymentId = session.payment_intent
              ? String(session.payment_intent)
              : session.id || null;
            if (!paymentId) {
              console.warn("Marketplace checkout missing payment id", { itemId });
              break;
            }

            // Idempotent: do not insert if purchase with same payment_intent_id already exists.
            const { data: existingPurchase } = await supabaseClient
              .from("marketplace_purchases")
              .select("id")
              .eq("payment_intent_id", paymentId)
              .maybeSingle();
            if (existingPurchase?.id) break;

            // Load item row
            const { data: item, error: itemErr } = await supabaseClient
              .from("marketplace_items")
              .select(
                "id, price, currency, is_subscription, subscription_duration_days, purchase_count, revenue_total",
              )
              .eq("id", itemId)
              .maybeSingle();
            if (itemErr || !item) {
              console.warn("Marketplace item not found during webhook", { itemId, itemErr });
              break;
            }

            const now = new Date();
            const paid = session.amount_total
              ? Number(session.amount_total) / 100
              : Number(item.price ?? 0);
            const purchaseType = session.mode === "subscription" ? "subscription" : "one_time";
            const expires =
              purchaseType === "subscription" && item.subscription_duration_days
                ? new Date(
                    now.getTime() + Number(item.subscription_duration_days) * 24 * 60 * 60 * 1000,
                  )
                : null;

            const { error: insErr } = await supabaseClient.from("marketplace_purchases").insert({
              item_id: itemId,
              user_id: userId,
              purchase_type: purchaseType,
              price_paid: paid,
              payment_intent_id: paymentId,
              access_granted_at: now.toISOString(),
              access_expires_at: expires ? expires.toISOString() : null,
              is_active: true,
              purchased_at: now.toISOString(),
            });
            if (insErr) {
              console.error("Error inserting marketplace purchase:", insErr);
              throw insErr;
            }

            // Best-effort item counters
            try {
              await supabaseClient
                .from("marketplace_items")
                .update({
                  purchase_count: Number(item.purchase_count ?? 0) + 1,
                  revenue_total: Number(item.revenue_total ?? 0) + Number(paid ?? 0),
                  updated_at: now.toISOString(),
                })
                .eq("id", itemId);
            } catch (e) {
              console.warn("Failed to update marketplace item counters (non-fatal):", e);
            }

            break;
          }

          if (metadata.purchase_type === "routine_marketplace") {
            const userId = metadata.supabase_user_id;
            const marketplaceId = metadata.routine_marketplace_id;
            if (!userId || !marketplaceId) {
              console.warn("Routine marketplace checkout missing metadata", {
                userId,
                marketplaceId,
              });
              break;
            }

            const paymentId = session.payment_intent
              ? String(session.payment_intent)
              : session.id || null;
            if (!paymentId) {
              console.warn("Routine marketplace checkout missing payment id", { marketplaceId });
              break;
            }

            const { data: existingPurchase } = await supabaseClient
              .from("routine_purchases")
              .select("id")
              .eq("payment_intent_id", paymentId)
              .maybeSingle();
            if (existingPurchase?.id) break;

            const { data: item, error: itemErr } = await supabaseClient
              .from("routine_marketplace")
              .select(
                "id, price, currency, is_subscription, subscription_duration_days, sales_count, revenue_total",
              )
              .eq("id", marketplaceId)
              .maybeSingle();
            if (itemErr || !item) {
              console.warn("Routine marketplace item not found during webhook", {
                marketplaceId,
                itemErr,
              });
              break;
            }

            const now = new Date();
            const paid = session.amount_total
              ? Number(session.amount_total) / 100
              : Number(item.price ?? 0);
            const purchaseType = session.mode === "subscription" ? "subscription" : "one_time";
            const expires =
              purchaseType === "subscription" && item.subscription_duration_days
                ? new Date(
                    now.getTime() + Number(item.subscription_duration_days) * 24 * 60 * 60 * 1000,
                  )
                : null;

            const { error: insErr } = await supabaseClient.from("routine_purchases").insert({
              marketplace_id: marketplaceId,
              user_id: userId,
              purchase_type: purchaseType,
              price_paid: paid,
              payment_intent_id: paymentId,
              access_granted_at: now.toISOString(),
              access_expires_at: expires ? expires.toISOString() : null,
              is_active: true,
              purchased_at: now.toISOString(),
            });
            if (insErr) {
              console.error("Error inserting routine purchase:", insErr);
              throw insErr;
            }

            try {
              await supabaseClient
                .from("routine_marketplace")
                .update({
                  sales_count: Number(item.sales_count ?? 0) + 1,
                  revenue_total: Number(item.revenue_total ?? 0) + Number(paid ?? 0),
                  updated_at: now.toISOString(),
                })
                .eq("id", marketplaceId);
            } catch (e) {
              console.warn("Failed to update routine marketplace counters (non-fatal):", e);
            }

            break;
          }

          if (metadata.purchase_type === "premium_content") {
            const userId = metadata.supabase_user_id;
            const contentId = metadata.premium_content_id;
            if (!userId || !contentId) {
              console.warn("Premium content checkout missing metadata", { userId, contentId });
              break;
            }

            const paymentId = session.payment_intent
              ? String(session.payment_intent)
              : session.id || null;
            if (!paymentId) {
              console.warn("Premium content checkout missing payment id", { contentId });
              break;
            }

            const { data: existingPurchase } = await supabaseClient
              .from("premium_content_purchases")
              .select("id")
              .eq("payment_intent_id", paymentId)
              .maybeSingle();
            if (existingPurchase?.id) break;

            const { data: item, error: itemErr } = await supabaseClient
              .from("premium_content_items")
              .select(
                "id, price, currency, is_subscription, subscription_duration_days, purchase_count, revenue_total",
              )
              .eq("id", contentId)
              .maybeSingle();
            if (itemErr || !item) {
              console.warn("Premium content not found during webhook", { contentId, itemErr });
              break;
            }

            const now = new Date();
            const paid = session.amount_total
              ? Number(session.amount_total) / 100
              : Number(item.price ?? 0);
            const purchaseType = session.mode === "subscription" ? "subscription" : "one_time";
            const expires =
              purchaseType === "subscription" && item.subscription_duration_days
                ? new Date(
                    now.getTime() + Number(item.subscription_duration_days) * 24 * 60 * 60 * 1000,
                  )
                : null;

            const { error: insErr } = await supabaseClient
              .from("premium_content_purchases")
              .insert({
                content_id: contentId,
                user_id: userId,
                purchase_type: purchaseType,
                price_paid: paid,
                payment_intent_id: paymentId,
                access_granted_at: now.toISOString(),
                access_expires_at: expires ? expires.toISOString() : null,
                is_active: true,
                download_enabled: true,
                stream_enabled: true,
                purchased_at: now.toISOString(),
              });
            if (insErr) {
              console.error("Error inserting premium content purchase:", insErr);
              throw insErr;
            }

            try {
              await supabaseClient
                .from("premium_content_items")
                .update({
                  purchase_count: Number(item.purchase_count ?? 0) + 1,
                  revenue_total: Number(item.revenue_total ?? 0) + Number(paid ?? 0),
                  updated_at: now.toISOString(),
                })
                .eq("id", contentId);
            } catch (e) {
              console.warn("Failed to update premium content counters (non-fatal):", e);
            }

            break;
          }

          if (metadata.purchase_type === "addon") {
            const userId = metadata.supabase_user_id;
            const addonId = metadata.addon_id;
            const planType = metadata.plan_type || "monthly";
            if (!userId || !addonId) {
              console.warn("Add-on checkout missing metadata", { userId, addonId });
              break;
            }

            const now = new Date();

            // Determine identifiers
            const subscriptionId =
              session.mode === "subscription" && session.subscription
                ? String(session.subscription)
                : null;
            const paymentIntentId = !subscriptionId
              ? session.payment_intent
                ? String(session.payment_intent)
                : session.id || null
              : null;

            const { data: addon, error: addonErr } = await supabaseClient
              .from("premium_add_ons")
              .select("addon_id, monthly_price, annual_price, lifetime_price")
              .eq("addon_id", addonId)
              .maybeSingle();
            if (addonErr || !addon) {
              console.warn("Add-on not found during webhook", { addonId, addonErr });
              break;
            }

            // Best-effort: resolve Stripe price id from line items for audit + refunds.
            let stripePriceId: string | null = null;
            try {
              const items = await stripe.checkout.sessions.listLineItems(session.id, { limit: 1 });
              stripePriceId = items.data?.[0]?.price?.id ? String(items.data[0].price.id) : null;
            } catch (e) {
              console.warn("Failed to resolve addon price id from Stripe session (non-fatal):", e);
            }

            const paid = session.amount_total ? Number(session.amount_total) / 100 : 0;
            let status = "active";
            let currentPeriodStart: string | null = null;
            let currentPeriodEnd: string | null = null;
            if (subscriptionId) {
              try {
                const sub = await stripe.subscriptions.retrieve(subscriptionId);
                status = sub.status;
                currentPeriodStart = new Date(sub.current_period_start * 1000).toISOString();
                currentPeriodEnd = new Date(sub.current_period_end * 1000).toISOString();
              } catch (e) {
                console.warn("Failed to retrieve addon subscription details (non-fatal):", e);
              }
            }

            const { error: upErr } = await supabaseClient.from("user_add_ons").upsert(
              {
                user_id: userId,
                addon_id: addonId,
                plan_type: planType,
                stripe_subscription_id: subscriptionId,
                stripe_payment_intent_id: paymentIntentId,
                stripe_price_id: stripePriceId,
                status,
                current_period_start:
                  currentPeriodStart ?? (subscriptionId ? now.toISOString() : null),
                current_period_end: currentPeriodEnd,
                cancel_at_period_end: false,
                canceled_at: null,
                price_paid: paid,
                currency: (session.currency || "usd").toUpperCase(),
                updated_at: now.toISOString(),
              },
              { onConflict: "user_id,addon_id" },
            );
            if (upErr) {
              console.error("Error upserting user_add_ons:", upErr);
              throw upErr;
            }

            break;
          }

          const userId = metadata.supabase_user_id;
          const packageId = metadata.dlc_package_id;
          if (!userId || !packageId) {
            console.warn("DLC checkout missing metadata", { userId, packageId });
            break;
          }

          const recordPromoUsage = async (args: {
            promoCodeId: string;
            promoCode: string;
            purchaseId: string;
            userId: string;
            packageId: string;
            currency: string;
            originalPrice: number;
            discountApplied: number;
            finalPrice: number;
          }) => {
            const {
              promoCodeId,
              promoCode,
              purchaseId,
              userId,
              packageId,
              currency,
              originalPrice,
              discountApplied,
              finalPrice,
            } = args;

            // Best-effort insert. Different migrations used different table names/columns.
            // 1) dlc_promo_redemptions (package_id/original_price/discount_applied/final_price)
            try {
              await supabaseClient.from("dlc_promo_redemptions").insert({
                promo_code_id: promoCodeId,
                user_id: userId,
                package_id: packageId,
                original_price: originalPrice,
                discount_applied: discountApplied,
                final_price: finalPrice,
                redeemed_at: nowIso,
              });
              return;
            } catch {
              // ignore and try next schema
            }

            // 2) dlc_promo_code_usage (purchase_id + discount_applied)
            try {
              await supabaseClient.from("dlc_promo_code_usage").insert({
                promo_code_id: promoCodeId,
                user_id: userId,
                purchase_id: null,
                discount_applied: discountApplied,
                used_at: nowIso,
              });
            } catch {
              // ignore
            }

            // Best-effort counter update (schema differs)
            try {
              const { data: promo } = await supabaseClient
                .from("dlc_promo_codes")
                .select("id, current_redemptions, current_uses")
                .eq("id", promoCodeId)
                .maybeSingle();
              const current =
                promo && (promo as any).current_redemptions != null
                  ? Number((promo as any).current_redemptions)
                  : promo && (promo as any).current_uses != null
                    ? Number((promo as any).current_uses)
                    : 0;
              await supabaseClient
                .from("dlc_promo_codes")
                .update({
                  current_redemptions: current + 1,
                  current_uses: current + 1,
                  updated_at: nowIso,
                } as any)
                .eq("id", promoCodeId);
            } catch {
              // ignore
            }
          };

          // Pull package row for pricing/type
          const { data: pkg, error: pkgError } = await supabaseClient
            .from("dlc_packages")
            .select("package_id, price_type, subscription_interval, price_usd, content_version")
            .eq("package_id", packageId)
            .maybeSingle();

          if (pkgError || !pkg) {
            console.warn("DLC package not found during webhook", { packageId, pkgError });
            break;
          }

          const isSubscription = session.mode === "subscription";
          const now = new Date();

          let subscriptionStart: Date | null = null;
          let subscriptionEnd: Date | null = null;
          let subscriptionStatus: string | null = null;
          let paymentId: string | null = null;

          if (isSubscription && session.subscription) {
            const sub = await stripe.subscriptions.retrieve(String(session.subscription));
            subscriptionStart = new Date(sub.current_period_start * 1000);
            subscriptionEnd = new Date(sub.current_period_end * 1000);
            subscriptionStatus = sub.status;
            paymentId = sub.id;
          } else {
            paymentId = session.payment_intent
              ? String(session.payment_intent)
              : session.id || null;
          }

          // Upsert license (idempotent per user_id/package_id)
          // Keep license_key stable if already issued
          const { data: existingLicense } = await supabaseClient
            .from("dlc_licenses")
            .select("license_key")
            .eq("user_id", userId)
            .eq("package_id", packageId)
            .maybeSingle();

          const licenseKey = existingLicense?.license_key || generateLicenseKey();

          const { error: upsertError } = await supabaseClient.from("dlc_licenses").upsert(
            {
              user_id: userId,
              package_id: packageId,
              license_key: licenseKey,
              license_type: isSubscription ? "subscription" : "one_time",
              purchase_date: now.toISOString(),
              purchase_price: session.amount_total
                ? Number(session.amount_total) / 100
                : Number(pkg.price_usd),
              purchase_currency: (session.currency || "usd").toUpperCase(),
              payment_provider: "stripe",
              payment_id: paymentId,
              subscription_status: isSubscription ? subscriptionStatus : null,
              subscription_start: subscriptionStart ? subscriptionStart.toISOString() : null,
              subscription_end: subscriptionEnd ? subscriptionEnd.toISOString() : null,
              auto_renew: isSubscription ? true : null,
              is_active: true,
              activated_at: now.toISOString(),
              max_devices: 3,
              offline_cache_expires_at: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
              last_online_validation: now.toISOString(),
              content_version: pkg.content_version || null,
              updated_at: now.toISOString(),
            },
            { onConflict: "user_id,package_id" },
          );

          if (upsertError) {
            console.error("Error upserting DLC license:", upsertError);
            throw upsertError;
          }

          // Record promo code usage if promo metadata is present.
          try {
            const promoCodeId = metadata.promo_code_id ? String(metadata.promo_code_id) : "";
            const promoCode = metadata.promo_code ? String(metadata.promo_code) : "";
            if (promoCodeId && promoCode) {
              const original = Number(pkg.price_usd ?? 0);
              const paid = session.amount_total ? Number(session.amount_total) / 100 : original;
              const discount = session.total_details?.amount_discount
                ? Number(session.total_details.amount_discount) / 100
                : Math.max(0, original - paid);
              await recordPromoUsage({
                promoCodeId,
                promoCode,
                purchaseId: paymentId ?? session.id,
                userId,
                packageId,
                currency: (session.currency || "usd").toUpperCase(),
                originalPrice: original,
                discountApplied: discount,
                finalPrice: paid,
              });
            }
          } catch {
            // non-fatal
          }

          break;
        }

        case "charge.refunded": {
          const charge = event.data.object as Stripe.Charge;
          const refundedAtIso = charge.created
            ? new Date(charge.created * 1000).toISOString()
            : nowIso;
          const reason = charge.refunds?.data?.[0]?.reason ?? "refunded";
          const paymentIntentId =
            typeof (charge as any).payment_intent === "string"
              ? (charge as any).payment_intent
              : null;
          await revokeDlcByPaymentIds(
            [paymentIntentId, charge.id],
            `charge_refunded:${reason}`,
            refundedAtIso,
          );
          await revokeMarketplaceByPaymentIds(
            [paymentIntentId, charge.id],
            `charge_refunded:${reason}`,
            refundedAtIso,
          );
          await revokeRoutineMarketplaceByPaymentIds(
            [paymentIntentId, charge.id],
            `charge_refunded:${reason}`,
            refundedAtIso,
          );
          await revokePremiumContentByPaymentIds(
            [paymentIntentId, charge.id],
            `charge_refunded:${reason}`,
            refundedAtIso,
          );
          await revokeAddOnsByPaymentIds(
            [paymentIntentId, charge.id],
            `charge_refunded:${reason}`,
            refundedAtIso,
          );
          break;
        }

        case "refund.updated": {
          const refund = event.data.object as Stripe.Refund;
          const refundedAtIso = refund.created
            ? new Date(refund.created * 1000).toISOString()
            : nowIso;
          const reason = (refund as any).reason ?? "refund_updated";
          const chargeId = typeof refund.charge === "string" ? refund.charge : null;
          await revokeDlcByPaymentIds([chargeId], `refund_updated:${reason}`, refundedAtIso);
          await revokeMarketplaceByPaymentIds(
            [chargeId],
            `refund_updated:${reason}`,
            refundedAtIso,
          );
          await revokeRoutineMarketplaceByPaymentIds(
            [chargeId],
            `refund_updated:${reason}`,
            refundedAtIso,
          );
          await revokePremiumContentByPaymentIds(
            [chargeId],
            `refund_updated:${reason}`,
            refundedAtIso,
          );
          await revokeAddOnsByPaymentIds([chargeId], `refund_updated:${reason}`, refundedAtIso);
          break;
        }

        case "charge.dispute.created": {
          const dispute = event.data.object as Stripe.Dispute;
          const createdIso = dispute.created
            ? new Date(dispute.created * 1000).toISOString()
            : nowIso;
          const chargeId = typeof dispute.charge === "string" ? dispute.charge : null;
          await revokeDlcByPaymentIds([chargeId], "dispute_created", createdIso);
          await revokeMarketplaceByPaymentIds([chargeId], "dispute_created", createdIso);
          await revokeRoutineMarketplaceByPaymentIds([chargeId], "dispute_created", createdIso);
          await revokePremiumContentByPaymentIds([chargeId], "dispute_created", createdIso);
          await revokeAddOnsByPaymentIds([chargeId], "dispute_created", createdIso);
          break;
        }

        case "charge.dispute.closed": {
          const dispute = event.data.object as Stripe.Dispute;
          const chargeId = typeof dispute.charge === "string" ? dispute.charge : null;
          // If dispute was won, we can re-activate; otherwise keep revoked.
          if (chargeId && dispute.status === "won") {
            const { error } = await supabaseClient
              .from("dlc_licenses")
              .update({
                is_active: true,
                deactivated_at: null,
                refund_reason: null,
                refunded_at: null,
                updated_at: nowIso,
              })
              .eq("payment_provider", "stripe")
              .eq("payment_id", chargeId);
            if (error) console.warn("Failed to reactivate DLC after dispute won:", error);
          } else if (chargeId) {
            await revokeDlcByPaymentIds([chargeId], "dispute_closed", nowIso);
            await revokeMarketplaceByPaymentIds([chargeId], "dispute_closed", nowIso);
            await revokeRoutineMarketplaceByPaymentIds([chargeId], "dispute_closed", nowIso);
            await revokePremiumContentByPaymentIds([chargeId], "dispute_closed", nowIso);
            await revokeAddOnsByPaymentIds([chargeId], "dispute_closed", nowIso);
          }
          break;
        }

        case "customer.subscription.created":
        case "customer.subscription.updated": {
          const subscription = event.data.object as Stripe.Subscription;
          const customerId = subscription.customer as string;

          // Get the price ID to determine plan
          const priceId = subscription.items.data[0]?.price?.id;
          let planId = "free";
          if (priceId) {
            const proPriceId = Deno.env.get("STRIPE_PRO_PRICE_ID");
            const premiumPriceId = Deno.env.get("STRIPE_PREMIUM_PRICE_ID");
            if (priceId === premiumPriceId) {
              planId = "premium";
            } else if (priceId === proPriceId) {
              planId = "pro";
            }
          }

          // Find user by customer ID from existing subscription or customer metadata
          const { data: existingSubscription } = await supabaseClient
            .from("user_subscriptions")
            .select("user_id")
            .eq("stripe_customer_id", customerId)
            .single();

          let userId = existingSubscription?.user_id;

          if (!userId) {
            // Try to get user_id from customer metadata
            const customer = (await stripe.customers.retrieve(customerId)) as Stripe.Customer;
            userId = customer.metadata?.supabase_user_id;

            if (!userId && customer.email) {
              // Fallback: find user by email (less reliable but better than nothing)
              const { data: profiles } = await supabaseClient
                .from("profiles")
                .select("user_id")
                .eq("email", customer.email)
                .limit(1);
              userId = profiles?.[0]?.user_id;
            }
          }

          if (!userId) {
            console.warn(
              "Could not find user for customer:",
              customerId,
              "Subscription will be updated without user_id",
            );
          }

          const { error } = await supabaseClient.from("user_subscriptions").upsert(
            {
              user_id: userId,
              stripe_subscription_id: subscription.id,
              stripe_customer_id: customerId,
              plan_id: planId,
              subscription_tier: planId,
              stripe_price_id: priceId ?? null,
              status: subscription.status,
              current_period_start: new Date(
                subscription.current_period_start * 1000,
              ).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              cancel_at_period_end: subscription.cancel_at_period_end,
              updated_at: new Date(),
            },
            {
              onConflict: "stripe_subscription_id",
            },
          );

          if (error) {
            console.error("Error updating subscription:", error);
            throw error;
          }

          // Keep add-on subscriptions in sync with Stripe (status + current_period)
          await syncAddOnsForStripeSubscription(subscription);

          // Also update DLC subscription license if this Stripe subscription is used for DLC
          // (We key it by payment_id == subscription.id)
          try {
            const customer = (await stripe.customers.retrieve(customerId)) as Stripe.Customer;
            const dlcUserId = customer.metadata?.supabase_user_id;
            if (dlcUserId) {
              await supabaseClient
                .from("dlc_licenses")
                .update({
                  subscription_status: subscription.status,
                  subscription_start: new Date(
                    subscription.current_period_start * 1000,
                  ).toISOString(),
                  subscription_end: new Date(subscription.current_period_end * 1000).toISOString(),
                  is_active: subscription.status === "active" || subscription.status === "trialing",
                  updated_at: new Date().toISOString(),
                })
                .eq("payment_provider", "stripe")
                .eq("payment_id", subscription.id)
                .eq("license_type", "subscription");
            }
          } catch (e) {
            console.warn("DLC subscription sync failed (non-fatal):", e);
          }

          break;
        }

        case "customer.subscription.deleted": {
          const subscription = event.data.object as Stripe.Subscription;

          const { error } = await supabaseClient
            .from("user_subscriptions")
            .update({
              status: "canceled",
              cancel_at_period_end: true,
              canceled_at: new Date().toISOString(),
              updated_at: new Date(),
            })
            .eq("stripe_subscription_id", subscription.id);

          if (error) {
            console.error("Error canceling subscription:", error);
            throw error;
          }

          // Also mark any DLC subscription license inactive
          await supabaseClient
            .from("dlc_licenses")
            .update({
              subscription_status: "cancelled",
              is_active: false,
              updated_at: new Date().toISOString(),
            })
            .eq("payment_provider", "stripe")
            .eq("payment_id", subscription.id)
            .eq("license_type", "subscription");

          // Also mark any add-on subscription inactive
          await supabaseClient
            .from("user_add_ons")
            .update({
              status: "canceled",
              cancel_at_period_end: true,
              canceled_at: nowIso,
              updated_at: nowIso,
            })
            .eq("stripe_subscription_id", subscription.id);

          break;
        }

        case "invoice.payment_succeeded": {
          const invoice = event.data.object as Stripe.Invoice;

          if (invoice.subscription) {
            // Update subscription status on successful payment
            const { error } = await supabaseClient
              .from("user_subscriptions")
              .update({
                status: "active",
                updated_at: new Date(),
              })
              .eq("stripe_subscription_id", invoice.subscription as string);

            if (error) {
              console.error("Error updating subscription status:", error);
              throw error;
            }

            // Add-ons billed by subscription should be active too
            await supabaseClient
              .from("user_add_ons")
              .update({ status: "active", updated_at: nowIso })
              .eq("stripe_subscription_id", invoice.subscription as string);
          }
          break;
        }

        case "invoice.payment_failed": {
          const invoice = event.data.object as Stripe.Invoice;

          if (invoice.subscription) {
            // Update subscription status on failed payment
            const { error } = await supabaseClient
              .from("user_subscriptions")
              .update({
                status: "past_due",
                updated_at: new Date(),
              })
              .eq("stripe_subscription_id", invoice.subscription as string);

            if (error) {
              console.error("Error updating subscription status:", error);
              throw error;
            }

            // Add-ons billed by subscription should reflect payment failure
            await supabaseClient
              .from("user_add_ons")
              .update({ status: "past_due", updated_at: nowIso })
              .eq("stripe_subscription_id", invoice.subscription as string);
          }
          break;
        }

        default:
          console.log(`Unhandled event type: ${event.type}`);
          didHandle = false;
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      await upsertWebhookEvent("failed", msg);
      throw e;
    }

    await upsertWebhookEvent(didHandle ? "processed" : "skipped");

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Webhook error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
