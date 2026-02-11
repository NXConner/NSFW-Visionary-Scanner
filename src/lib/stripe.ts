// Stripe payment processing and subscription management
import { loadStripe, Stripe, StripeElements, StripeCardElement } from "@stripe/stripe-js";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "./logger";

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  interval: "month" | "year";
  features: string[];
  stripePriceId: string;
  popular?: boolean;
}

export interface PaymentMethod {
  id: string;
  type: "card";
  card: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
}

export interface Subscription {
  id: string;
  status: "active" | "canceled" | "past_due" | "unpaid";
  currentPeriodStart: number;
  currentPeriodEnd: number;
  cancelAtPeriodEnd: boolean;
  plan: SubscriptionPlan;
  paymentMethod?: PaymentMethod;
}

// Available subscription plans
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    interval: "month",
    stripePriceId: "",
    features: [
      "Basic 3D/2D Scanner",
      "Health Diary (Limited)",
      "Education Center",
      "Emergency Guidance",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: 9.99,
    interval: "month",
    stripePriceId: import.meta.env.VITE_STRIPE_PRO_PRICE_ID || "",
    features: [
      "Everything in Free",
      "Unlimited Scans",
      "Advanced Analytics",
      "Cloud Backup",
      "Progress Photos",
      "PE Routine Builder",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    price: 19.99,
    interval: "month",
    stripePriceId: import.meta.env.VITE_STRIPE_PREMIUM_PRICE_ID || "",
    popular: true,
    features: [
      "Everything in Pro",
      "AI Health Chatbot",
      "AI Scan Analysis",
      "Medical Export (HL7 FHIR)",
      "Priority Support",
      "Custom PE Routines",
      "Predictive Analytics",
    ],
  },
];

// Stripe instance management
let stripePromise: Promise<Stripe | null> | null = null;

export const getStripe = (): Promise<Stripe | null> => {
  if (!stripePromise) {
    const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    if (publishableKey && publishableKey !== "pk_test_placeholder") {
      stripePromise = loadStripe(publishableKey);
    } else {
      stripePromise = Promise.resolve(null);
      // Only log warning in development to avoid console noise in production
      if (import.meta.env.DEV) {
        logger.warn("Stripe publishable key not configured - payment features disabled", {
          component: "stripe",
        });
      }
    }
  }
  return stripePromise;
};

// Subscription management
export class SubscriptionManager {
  private stripe: Stripe | null = null;

  constructor() {
    getStripe().then(stripe => {
      this.stripe = stripe;
    });
  }

  // Create subscription
  async createSubscription(
    planId: string,
    paymentMethodId: string,
  ): Promise<{ subscriptionId: string } | null> {
    try {
      const { data, error } = await supabase.functions.invoke("create-subscription", {
        body: {
          planId,
          paymentMethodId,
        },
      });

      if (error) {
        logger.error("Failed to create subscription", { error: error.message, planId });
        throw error;
      }

      logger.info("Subscription created", { subscriptionId: data.subscriptionId, planId });
      return data;
    } catch (error) {
      logger.error("Subscription creation failed", {
        error: error instanceof Error ? error.message : "Unknown error",
        planId,
      });
      return null;
    }
  }

  // Update subscription
  async updateSubscription(subscriptionId: string, newPlanId: string): Promise<boolean> {
    try {
      const { error } = await supabase.functions.invoke("update-subscription", {
        body: {
          subscriptionId,
          newPlanId,
        },
      });

      if (error) {
        logger.error("Failed to update subscription", {
          error: error.message,
          subscriptionId,
          newPlanId,
        });
        throw error;
      }

      logger.info("Subscription updated", { subscriptionId, newPlanId });
      return true;
    } catch (error) {
      logger.error("Subscription update failed", {
        error: error instanceof Error ? error.message : "Unknown error",
        subscriptionId,
        newPlanId,
      });
      return false;
    }
  }

  // Cancel subscription
  async cancelSubscription(subscriptionId: string, cancelAtPeriodEnd = true): Promise<boolean> {
    try {
      const { error } = await supabase.functions.invoke("cancel-subscription", {
        body: {
          subscriptionId,
          cancelAtPeriodEnd,
        },
      });

      if (error) {
        logger.error("Failed to cancel subscription", { error: error.message, subscriptionId });
        throw error;
      }

      logger.info("Subscription cancelled", { subscriptionId, cancelAtPeriodEnd });
      return true;
    } catch (error) {
      logger.error("Subscription cancellation failed", {
        error: error instanceof Error ? error.message : "Unknown error",
        subscriptionId,
      });
      return false;
    }
  }

  // Get current subscription
  async getCurrentSubscription(userId: string): Promise<Subscription | null> {
    try {
      const { data, error } = await supabase
        .from("user_subscriptions")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        // PGRST116 = no rows returned
        logger.error("Failed to get subscription", { error: error.message, userId });
        throw error;
      }

      if (!data) return null;

      // Map database fields to Subscription interface
      return {
        id: data.id,
        status: (data.status as Subscription["status"]) ?? "canceled",
        currentPeriodStart: data.current_period_start
          ? new Date(data.current_period_start).getTime()
          : 0,
        currentPeriodEnd: data.current_period_end ? new Date(data.current_period_end).getTime() : 0,
        cancelAtPeriodEnd: Boolean(data.cancel_at_period_end),
        plan:
          SUBSCRIPTION_PLANS.find(
            p => p.id === (data.subscription_tier ?? (data as any).plan_id),
          ) ||
          ((data as any).stripe_price_id
            ? SUBSCRIPTION_PLANS.find(p => p.stripePriceId === (data as any).stripe_price_id)
            : undefined) ||
          SUBSCRIPTION_PLANS[0],
      };
    } catch (error) {
      logger.error("Failed to retrieve subscription", {
        error: error instanceof Error ? error.message : "Unknown error",
        userId,
      });
      return null;
    }
  }

  // Payment method management
  async createPaymentMethod(cardElement: StripeCardElement): Promise<string | null> {
    if (!this.stripe) {
      logger.error("Stripe not initialized");
      return null;
    }

    try {
      const { error, paymentMethod } = await this.stripe.createPaymentMethod({
        type: "card",
        card: cardElement,
      });

      if (error) {
        logger.error("Failed to create payment method", { error: error.message });
        return null;
      }

      logger.info("Payment method created", { paymentMethodId: paymentMethod.id });
      return paymentMethod.id;
    } catch (error) {
      logger.error("Payment method creation failed", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return null;
    }
  }

  // Handle payment confirmation
  async confirmPayment(clientSecret: string): Promise<{ success: boolean; error?: string }> {
    if (!this.stripe) {
      return { success: false, error: "Stripe not initialized" };
    }

    try {
      const { error, paymentIntent } = await this.stripe.confirmCardPayment(clientSecret);

      if (error) {
        logger.error("Payment confirmation failed", { error: error.message });
        return { success: false, error: error.message };
      }

      logger.info("Payment confirmed", { paymentIntentId: paymentIntent.id });
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.error("Payment confirmation error", { error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }

  // Billing portal
  async createBillingPortalSession(returnUrl: string): Promise<string | null> {
    try {
      const { data, error } = await supabase.functions.invoke("create-billing-portal-session", {
        body: { returnUrl },
      });

      if (error) {
        logger.error("Failed to create billing portal session", { error: error.message });
        throw error;
      }

      return data.url;
    } catch (error) {
      logger.error("Billing portal session creation failed", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return null;
    }
  }
}

// Singleton instance
export const subscriptionManager = new SubscriptionManager();

// Utility functions
export const formatPrice = (price: number, currency = "USD"): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(price);
};

export const getPlanById = (planId: string): SubscriptionPlan | undefined => {
  return SUBSCRIPTION_PLANS.find(plan => plan.id === planId);
};

export const getUpgradeOptions = (currentPlanId: string): SubscriptionPlan[] => {
  const currentPlan = getPlanById(currentPlanId);
  if (!currentPlan) return SUBSCRIPTION_PLANS;

  const currentIndex = SUBSCRIPTION_PLANS.findIndex(plan => plan.id === currentPlanId);
  return SUBSCRIPTION_PLANS.slice(currentIndex + 1);
};

export const calculateProration = (
  currentPlan: SubscriptionPlan,
  newPlan: SubscriptionPlan,
  daysRemaining: number,
  totalDays: number,
): { credit: number; charge: number } => {
  const currentDailyRate = currentPlan.price / totalDays;
  const newDailyRate = newPlan.price / totalDays;

  const credit = currentDailyRate * daysRemaining;
  const charge = Math.max(0, newDailyRate * daysRemaining - credit);

  return { credit, charge };
};

// Get subscription status for a user
export type UserSubscriptionRow = {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  subscription_tier: string | null;
  plan_id: string | null;
  status: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
  canceled_at: string | null;
  updated_at?: string | null;
};

export const getSubscriptionStatus = async (
  userId: string,
): Promise<UserSubscriptionRow | null> => {
  try {
    const { data, error } = await supabase
      .from("user_subscriptions")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows returned
      logger.error("Failed to get subscription status", { error: error.message, userId });
      throw error;
    }

    return (data as unknown as UserSubscriptionRow | null) ?? null;
  } catch (error) {
    logger.error("Failed to retrieve subscription status", {
      error: error instanceof Error ? error.message : "Unknown error",
      userId,
    });
    return null;
  }
};

// Cancel subscription
export const cancelSubscription = async (subscriptionId: string, userId: string): Promise<void> => {
  try {
    const { error } = await supabase.functions.invoke("cancel-subscription", {
      body: {
        subscriptionId,
        cancelAtPeriodEnd: true,
      },
    });

    if (error) {
      logger.error("Failed to cancel subscription", {
        error: error.message,
        subscriptionId,
        userId,
      });
      throw error;
    }

    logger.info("Subscription cancelled", { subscriptionId, userId });
  } catch (error) {
    logger.error("Subscription cancellation failed", {
      error: error instanceof Error ? error.message : "Unknown error",
      subscriptionId,
      userId,
    });
    throw error;
  }
};

// Reactivate subscription
export const reactivateSubscription = async (
  subscriptionId: string,
  userId: string,
): Promise<void> => {
  try {
    const { error } = await supabase.functions.invoke("reactivate-subscription", {
      body: {
        subscriptionId,
      },
    });

    if (error) {
      logger.error("Failed to reactivate subscription", {
        error: error.message,
        subscriptionId,
        userId,
      });
      throw error;
    }

    logger.info("Subscription reactivated", { subscriptionId, userId });
  } catch (error) {
    logger.error("Subscription reactivation failed", {
      error: error instanceof Error ? error.message : "Unknown error",
      subscriptionId,
      userId,
    });
    throw error;
  }
};

// Create customer portal session
export const createCustomerPortalSession = async (returnUrl: string): Promise<string | null> => {
  try {
    const { data, error } = await supabase.functions.invoke("create-billing-portal-session", {
      body: { returnUrl },
    });

    if (error) {
      logger.error("Failed to create customer portal session", { error: error.message });
      throw error;
    }

    return data?.url || null;
  } catch (error) {
    logger.error("Customer portal session creation failed", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return null;
  }
};

// Create checkout session for subscription
export const createCheckoutSession = async (
  priceId: string,
  successUrl: string,
  cancelUrl: string,
): Promise<string | null> => {
  try {
    const { data, error } = await supabase.functions.invoke("create-checkout-session", {
      body: {
        priceId,
        successUrl,
        cancelUrl,
      },
    });

    if (error) {
      logger.error("Failed to create checkout session", { error: error.message, priceId });
      throw error;
    }

    return data?.url || null;
  } catch (error) {
    logger.error("Checkout session creation failed", {
      error: error instanceof Error ? error.message : "Unknown error",
      priceId,
    });
    return null;
  }
};
