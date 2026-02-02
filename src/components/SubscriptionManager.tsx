import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CreditCard,
  Calendar,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  Crown,
  Zap,
  Shield,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getSubscriptionStatus,
  cancelSubscription,
  reactivateSubscription,
  createCustomerPortalSession,
  SUBSCRIPTION_PLANS,
} from "@/lib/stripe";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import { format } from "date-fns";

interface SubscriptionData {
  id: string;
  status: string;
  current_period_end: string;
  stripe_subscription_id: string;
  stripe_price_id: string;
  canceled_at?: string;
}

export const SubscriptionManager = () => {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const { user } = useAuth();

  const loadSubscriptionStatus = useCallback(async () => {
    if (!user) return;

    try {
      const data = await getSubscriptionStatus(user.id);
      setSubscription(data);
    } catch (error) {
      logger.error("Failed to load subscription status", { userId: user.id, error });
      toast.error("Failed to load subscription information");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadSubscriptionStatus();
  }, [loadSubscriptionStatus]);

  const handleCancelSubscription = async () => {
    if (!subscription || !user) return;

    const confirmed = window.confirm(
      "Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your current billing period.",
    );

    if (!confirmed) return;

    setActionLoading(true);
    try {
      await cancelSubscription(subscription.stripe_subscription_id, user.id);
      toast.success(
        "Subscription cancelled. You will retain access until the end of your billing period.",
      );
      await loadSubscriptionStatus();
      logger.userAction("subscription_cancelled", user.id, {
        subscriptionId: subscription.stripe_subscription_id,
      });
    } catch (error) {
      logger.error("Subscription cancellation failed", {
        userId: user.id,
        subscriptionId: subscription.stripe_subscription_id,
        error,
      });
      toast.error("Failed to cancel subscription. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReactivateSubscription = async () => {
    if (!subscription || !user) return;

    setActionLoading(true);
    try {
      await reactivateSubscription(subscription.stripe_subscription_id, user.id);
      toast.success("Subscription reactivated successfully!");
      await loadSubscriptionStatus();
      logger.userAction("subscription_reactivated", user.id, {
        subscriptionId: subscription.stripe_subscription_id,
      });
    } catch (error) {
      logger.error("Subscription reactivation failed", {
        userId: user.id,
        subscriptionId: subscription.stripe_subscription_id,
        error,
      });
      toast.error("Failed to reactivate subscription. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleManageBilling = async () => {
    if (!user) return;

    try {
      const url = await createCustomerPortalSession(user.id);
      window.open(url, "_blank");
      logger.userAction("billing_portal_accessed", user.id);
    } catch (error) {
      logger.error("Failed to access billing portal", { userId: user.id, error });
      toast.error("Failed to open billing portal. Please try again.");
    }
  };

  const getCurrentPlan = () => {
    if (!subscription) return SUBSCRIPTION_PLANS[0]; // Free plan

    const plan = SUBSCRIPTION_PLANS.find(
      p =>
        p.stripePriceId === subscription.stripe_price_id ||
        (subscription.stripe_price_id && subscription.stripe_price_id.includes(p.id)),
    );

    return plan || SUBSCRIPTION_PLANS[0];
  };

  const getStatusBadge = () => {
    if (!subscription) return <Badge variant="secondary">Free</Badge>;

    switch (subscription.status) {
      case "active":
        return subscription.canceled_at ? (
          <Badge variant="destructive">Cancelling</Badge>
        ) : (
          <Badge variant="default" className="bg-green-500">
            Active
          </Badge>
        );
      case "canceled":
        return <Badge variant="destructive">Cancelled</Badge>;
      case "past_due":
        return <Badge variant="destructive">Past Due</Badge>;
      default:
        return <Badge variant="secondary">{subscription.status}</Badge>;
    }
  };

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case "premium":
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case "pro":
        return <Zap className="h-5 w-5 text-blue-500" />;
      default:
        return <Shield className="h-5 w-5 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentPlan = getCurrentPlan();
  const isCancelled = subscription?.canceled_at;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Subscription Management
          </CardTitle>
          <CardDescription>Manage your subscription and billing information</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getPlanIcon(currentPlan.id)}
              <div>
                <h3 className="font-semibold">{currentPlan.name} Plan</h3>
                <p className="text-sm text-muted-foreground">
                  ${currentPlan.price}/{currentPlan.interval}
                </p>
              </div>
            </div>
            {getStatusBadge()}
          </div>

          {subscription && (
            <div className="space-y-2 text-sm">
              {subscription.current_period_end && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {isCancelled ? "Access until: " : "Next billing: "}
                    {format(new Date(subscription.current_period_end), "PPP")}
                  </span>
                </div>
              )}

              {isCancelled && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Your subscription is set to cancel. You will lose access to premium features at
                    the end of your current billing period.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-4">
            {subscription?.status === "active" && !isCancelled && (
              <Button
                variant="outline"
                onClick={handleManageBilling}
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Manage Billing
              </Button>
            )}

            {subscription?.status === "active" && !isCancelled && currentPlan.price > 0 && (
              <Button
                variant="destructive"
                onClick={handleCancelSubscription}
                disabled={actionLoading}
                className="flex items-center gap-2"
              >
                <AlertTriangle className="h-4 w-4" />
                {actionLoading ? "Cancelling..." : "Cancel Subscription"}
              </Button>
            )}

            {isCancelled && (
              <Button
                onClick={handleReactivateSubscription}
                disabled={actionLoading}
                className="flex items-center gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                {actionLoading ? "Reactivating..." : "Reactivate Subscription"}
              </Button>
            )}

            {!subscription && (
              <p className="text-sm text-muted-foreground py-2">
                Upgrade to access premium features and AI-powered insights.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {subscription?.status === "past_due" && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Your payment is past due. Please update your payment method to avoid service
            interruption.
            <Button variant="link" className="p-0 h-auto ml-2" onClick={handleManageBilling}>
              Update payment method
            </Button>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
