import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Shield, Zap } from "lucide-react";
import { createCheckoutSession, getStripe } from "@/lib/stripe";
import { formatPrice } from "@/lib/pricing";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import { useAnalytics } from "@/lib/analytics";
import { TiltCard } from "@/components/premium";

interface Plan {
  id: string;
  name: string;
  price: number;
  interval: "month" | "year" | "one-time";
  stripePriceId?: string;
  features: string[];
  popular?: boolean;
}

interface PricingCardProps {
  plan: Plan;
  isPopular?: boolean;
  currentPlan?: string;
}

export const PricingCard = ({ plan, isPopular, currentPlan }: PricingCardProps) => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { trackUserAction } = useAnalytics();
  const isCurrentPlan = currentPlan === plan.id;

  const handleSubscribe = async () => {
    if (!user) {
      toast.error("Please sign in to subscribe");
      return;
    }

    if (isCurrentPlan) {
      toast.info("You are already on this plan");
      return;
    }

    if (plan.price === 0) {
      toast.info("Free plan is always available");
      return;
    }

    setLoading(true);
    try {
      logger.userAction("subscription_initiated", user.id, { planId: plan.id });
      trackUserAction("checkout_started", "funnel", {
        planId: plan.id,
        interval: plan.interval,
        price: plan.price,
        isPopular: Boolean(isPopular),
        stripePriceIdPresent: Boolean(plan.stripePriceId),
      });

      const stripe = await getStripe();
      if (!stripe) throw new Error("Stripe not configured");

      if (!plan.stripePriceId) {
        toast.error("Price ID not configured for this plan");
        trackUserAction("checkout_blocked_missing_price_id", "funnel", { planId: plan.id });
        return;
      }

      const successUrl = `${window.location.origin}/pricing?success=true`;
      const cancelUrl = `${window.location.origin}/pricing?canceled=true`;
      const checkoutUrl = await createCheckoutSession(plan.stripePriceId, successUrl, cancelUrl);

      if (!checkoutUrl) {
        throw new Error("Failed to create checkout session");
      }

      window.location.href = checkoutUrl;
    } catch (error) {
      logger.error("Subscription checkout failed", {
        userId: user.id,
        planId: plan.id,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      trackUserAction("checkout_failed", "funnel", {
        planId: plan.id,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      toast.error("Failed to start checkout. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getPlanIcon = () => {
    switch (plan.id) {
      case "premium":
        return <Crown className="h-6 w-6 text-yellow-500" />;
      case "pro":
        return <Zap className="h-6 w-6 text-blue-500" />;
      default:
        return <Shield className="h-6 w-6 text-gray-500" />;
    }
  };

  return (
    <TiltCard
      className={`relative ${isPopular ? "border-2 border-primary shadow-lg" : ""}`}
      maxTilt={isPopular ? 12 : 9}
      glow={Boolean(isPopular)}
      variant="interactive"
    >
      {isPopular && (
        <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary">
          Most Popular
        </Badge>
      )}

      <CardHeader className="text-center">
        <div className="flex justify-center mb-2">{getPlanIcon()}</div>
        <CardTitle className="flex items-center justify-center gap-2">
          {plan.name}
          {isCurrentPlan && (
            <Badge variant="secondary" className="text-xs">
              Current
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          <span className="text-3xl font-bold">{formatPrice(plan.price)}</span>
          {plan.price > 0 && plan.interval !== "one-time" && (
            <span className="text-muted-foreground">/{plan.interval}</span>
          )}
          {plan.interval === "one-time" && (
            <span className="text-muted-foreground text-sm ml-2">one-time</span>
          )}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <ul className="space-y-2">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter>
        <Button
          className="w-full"
          variant={isPopular ? "default" : isCurrentPlan ? "secondary" : "outline"}
          onClick={handleSubscribe}
          disabled={loading || isCurrentPlan}
        >
          {loading
            ? "Processing..."
            : isCurrentPlan
              ? "Current Plan"
              : plan.price === 0
                ? "Get Started"
                : plan.interval === "one-time"
                  ? `Purchase ${plan.name}`
                  : `Subscribe to ${plan.name}`}
        </Button>
      </CardFooter>
    </TiltCard>
  );
};
