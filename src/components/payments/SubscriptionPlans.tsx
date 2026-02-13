import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Star } from "lucide-react";
import { SUBSCRIPTION_PLANS, formatPrice, getPlanById } from "@/lib/stripe";
import { useUserRoles } from "@/hooks/useUserRoles";
import { logger } from "@/lib/logger";

interface SubscriptionPlansProps {
  currentPlanId?: string;
  onSelectPlan: (planId: string) => void;
  onManageBilling?: () => void;
  showFreeTrial?: boolean;
}

export const SubscriptionPlans: React.FC<SubscriptionPlansProps> = ({
  currentPlanId = "free",
  onSelectPlan,
  onManageBilling,
  showFreeTrial = true,
}) => {
  const { isPremium, isAdmin } = useUserRoles();
  const [billingInterval, setBillingInterval] = useState<"month" | "year">("month");

  const currentPlan = getPlanById(currentPlanId);

  const handlePlanSelect = (planId: string) => {
    logger.info("Plan selected", { planId, currentPlanId });
    onSelectPlan(planId);
  };

  const getPlanPrice = (plan: (typeof SUBSCRIPTION_PLANS)[0]) => {
    const price = billingInterval === "year" ? plan.price * 12 * 0.8 : plan.price;
    return formatPrice(price);
  };

  const getPlanInterval = (plan: (typeof SUBSCRIPTION_PLANS)[0]) => {
    return billingInterval === "year" ? "year" : "month";
  };

  return (
    <div className="space-y-6">
      {/* Billing Toggle */}
      <div className="flex justify-center">
        <div className="bg-muted p-1 rounded-lg flex">
          <button
            onClick={() => setBillingInterval("month")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              billingInterval === "month"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingInterval("year")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors relative ${
              billingInterval === "year"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Yearly
            <Badge variant="secondary" className="ml-2 text-xs">
              Save 20%
            </Badge>
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {SUBSCRIPTION_PLANS.map(plan => {
          const isCurrentPlan = plan.id === currentPlanId;
          const isPopular = plan.popular;

          return (
            <Card
              key={plan.id}
              className={`relative ${
                isPopular ? "border-primary shadow-lg" : ""
              } ${isCurrentPlan ? "ring-2 ring-primary" : ""}`}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">
                    <Star className="w-3 h-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2">
                  {plan.name}
                  {plan.id === "premium" && <Crown className="w-4 h-4 text-yellow-500" />}
                </CardTitle>
                <CardDescription>
                  {plan.id === "free"
                    ? "Perfect for getting started"
                    : plan.id === "pro"
                      ? "For serious users"
                      : "Full access to all features"}
                </CardDescription>
                <div className="text-3xl font-bold">
                  {plan.price === 0 ? (
                    "Free"
                  ) : (
                    <>
                      {getPlanPrice(plan)}
                      <span className="text-sm font-normal text-muted-foreground">
                        /{getPlanInterval(plan)}
                      </span>
                    </>
                  )}
                </div>
              </CardHeader>

              <CardContent>
                <ul className="space-y-2">
                  {plan.features.map(feature => (
                    <li key={feature} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                {isCurrentPlan ? (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={onManageBilling}
                    disabled={!onManageBilling}
                  >
                    {plan.id === "free" ? "Current Plan" : "Manage Billing"}
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    variant={isPopular ? "default" : "outline"}
                    onClick={() => handlePlanSelect(plan.id)}
                  >
                    {plan.id === "free"
                      ? "Get Started"
                      : currentPlanId === "free"
                        ? "Upgrade"
                        : "Switch Plan"}
                  </Button>
                )}

                {showFreeTrial && plan.id !== "free" && currentPlanId === "free" && (
                  <p className="text-xs text-center text-muted-foreground mt-2">
                    14-day free trial, cancel anytime
                  </p>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Current Plan Indicator */}
      {currentPlan && (
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Current plan: <span className="font-medium">{currentPlan.name}</span>
            {currentPlan.price > 0 && (
              <span className="ml-1">
                ({formatPrice(currentPlan.price)}/{currentPlan.interval})
              </span>
            )}
          </p>
        </div>
      )}

      {/* Admin Notice */}
      {isAdmin && (
        <div className="bg-muted p-4 rounded-lg">
          <p className="text-sm text-muted-foreground text-center">
            🔧 Admin users have access to all features regardless of subscription tier
          </p>
        </div>
      )}
    </div>
  );
};
