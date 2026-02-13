/**
 * Subscription Tiers Expansion
 * UI component for viewing, comparing, and subscribing to expanded subscription tiers
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, Crown, Zap, Building2, GraduationCap, Loader2, Star } from "lucide-react";
import {
  getSubscriptionTiers,
  getTierComparisonFeatures,
  subscribeToTier,
  getUserSubscriptionPlan,
  type SubscriptionTier,
  type TierComparisonFeature,
} from "@/lib/subscriptionTiers";
import { toast } from "sonner";

export const SubscriptionTiers = () => {
  type CurrentPlan = Awaited<ReturnType<typeof getUserSubscriptionPlan>>;

  const [loading, setLoading] = useState(false);
  const [tiers, setTiers] = useState<SubscriptionTier[]>([]);
  const [comparisonFeatures, setComparisonFeatures] = useState<TierComparisonFeature[]>([]);
  const [currentPlan, setCurrentPlan] = useState<CurrentPlan>(null);
  const [selectedPlanType, setSelectedPlanType] = useState<"monthly" | "annual" | "lifetime">(
    "monthly",
  );

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tiersData, featuresData, planData] = await Promise.all([
        getSubscriptionTiers(),
        getTierComparisonFeatures(),
        getUserSubscriptionPlan(),
      ]);
      setTiers(tiersData);
      setComparisonFeatures(featuresData);
      setCurrentPlan(planData);
    } catch (error) {
      toast.error("Failed to load subscription tiers");
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (tierId: string) => {
    try {
      const success = await subscribeToTier(tierId, selectedPlanType);
      if (success) {
        await loadData();
      }
    } catch (error) {
      toast.error("Failed to start subscription");
    }
  };

  const getTierIcon = (tierId: string) => {
    switch (tierId) {
      case "free":
        return null;
      case "pro":
        return <Zap className="w-5 h-5" />;
      case "premium":
        return <Crown className="w-5 h-5" />;
      case "health_pro":
        return <Star className="w-5 h-5" />;
      case "enterprise":
        return <Building2 className="w-5 h-5" />;
      case "student":
        return <GraduationCap className="w-5 h-5" />;
      default:
        return null;
    }
  };

  const getPrice = (tier: SubscriptionTier) => {
    switch (selectedPlanType) {
      case "monthly":
        return tier.monthly_price;
      case "annual":
        return tier.annual_price || tier.monthly_price * 12;
      case "lifetime":
        return tier.lifetime_price || tier.monthly_price * 60;
    }
  };

  const formatPrice = (price: number) => {
    if (price === 0) return "Free";
    return `$${price.toFixed(2)}`;
  };

  const getBillingPeriod = () => {
    switch (selectedPlanType) {
      case "monthly":
        return "/month";
      case "annual":
        return "/year";
      case "lifetime":
        return " (one-time)";
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Card className="glass-card border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Loader2 className="w-12 h-12 text-muted-foreground animate-spin mb-4" />
            <p className="text-muted-foreground">Loading subscription tiers...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <Card className="glass-card border-border/50">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center mb-2">Choose Your Plan</CardTitle>
          <CardDescription className="text-center">
            Select the perfect plan for your needs. All plans include a 30-day money-back guarantee.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Plan Type Selector */}
          <div className="flex justify-center gap-2 mb-8">
            <Button
              variant={selectedPlanType === "monthly" ? "default" : "outline"}
              onClick={() => setSelectedPlanType("monthly")}
            >
              Monthly
            </Button>
            <Button
              variant={selectedPlanType === "annual" ? "default" : "outline"}
              onClick={() => setSelectedPlanType("annual")}
            >
              Annual
              {selectedPlanType === "annual" && (
                <Badge variant="secondary" className="ml-2">
                  Save 20%
                </Badge>
              )}
            </Button>
            <Button
              variant={selectedPlanType === "lifetime" ? "default" : "outline"}
              onClick={() => setSelectedPlanType("lifetime")}
            >
              Lifetime
              {selectedPlanType === "lifetime" && (
                <Badge variant="secondary" className="ml-2">
                  Best Value
                </Badge>
              )}
            </Button>
          </div>

          {/* Tier Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tiers.map(tier => {
              const price = getPrice(tier);
              const isCurrentPlan = currentPlan?.tier_id === tier.tier_id;
              const Icon = getTierIcon(tier.tier_id);

              return (
                <Card
                  key={tier.id}
                  className={`glass-card border-border/50 relative ${
                    tier.is_popular ? "border-primary ring-2 ring-primary/20" : ""
                  } ${isCurrentPlan ? "border-green-500" : ""}`}
                >
                  {tier.is_popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge variant="default" className="px-3 py-1">
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  {isCurrentPlan && (
                    <div className="absolute -top-3 right-4">
                      <Badge variant="secondary" className="px-3 py-1">
                        Current Plan
                      </Badge>
                    </div>
                  )}

                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      {Icon}
                      <CardTitle className="text-2xl">{tier.tier_name}</CardTitle>
                    </div>
                    <CardDescription>{tier.tier_description}</CardDescription>
                    <div className="mt-4">
                      <div className="text-4xl font-bold">
                        {formatPrice(price)}
                        {price > 0 && (
                          <span className="text-lg font-normal text-muted-foreground">
                            {getBillingPeriod()}
                          </span>
                        )}
                      </div>
                      {selectedPlanType === "annual" && tier.annual_discount_percentage > 0 && (
                        <div className="text-sm text-muted-foreground mt-1">
                          Save {tier.annual_discount_percentage}% vs monthly
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="space-y-2">
                      {tier.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2">
                          <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    {tier.limitations && tier.limitations.length > 0 && (
                      <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground mb-2">Limitations:</p>
                        <ul className="space-y-1">
                          {tier.limitations.map((limitation) => (
                            <li key={limitation} className="text-xs text-muted-foreground">
                              • {limitation}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <Button
                      className="w-full"
                      variant={tier.is_popular ? "default" : "outline"}
                      onClick={() => handleSubscribe(tier.tier_id)}
                      disabled={isCurrentPlan}
                    >
                      {isCurrentPlan ? "Current Plan" : "Subscribe"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Feature Comparison Table */}
          {comparisonFeatures.length > 0 && (
            <div className="mt-12">
              <h3 className="text-2xl font-bold mb-6 text-center">Feature Comparison</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4">Feature</th>
                      {tiers.map(tier => (
                        <th key={tier.id} className="text-center p-4">
                          {tier.tier_name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonFeatures.map(feature => (
                      <tr key={feature.id} className="border-b">
                        <td className="p-4">
                          <div>
                            <div className="font-medium">{feature.feature_name}</div>
                            {feature.feature_description && (
                              <div className="text-sm text-muted-foreground">
                                {feature.feature_description}
                              </div>
                            )}
                          </div>
                        </td>
                        {tiers.map(tier => (
                          <td key={tier.id} className="text-center p-4">
                            {feature.available_tiers.includes(tier.tier_id) ? (
                              <Check className="w-5 h-5 text-green-500 mx-auto" />
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
