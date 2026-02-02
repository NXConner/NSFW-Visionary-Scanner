import React, { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  CreditCard,
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { subscriptionManager, formatPrice, getPlanById } from "@/lib/stripe";
import { useUserRoles } from "@/hooks/useUserRoles";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/lib/logger";
import { SubscriptionPlans } from "./SubscriptionPlans";

interface SubscriptionManagerProps {
  onClose?: () => void;
}

type CurrentSubscription = Awaited<
  ReturnType<(typeof subscriptionManager)["getCurrentSubscription"]>
>;

export const SubscriptionManager: React.FC<SubscriptionManagerProps> = ({ onClose }) => {
  const { user, isPremium, isAdmin } = useUserRoles();
  const { toast } = useToast();

  const [currentSubscription, setCurrentSubscription] = useState<CurrentSubscription>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showPlans, setShowPlans] = useState(false);

  const loadSubscription = useCallback(async () => {
    if (!user?.id) return;

    try {
      const subscription = await subscriptionManager.getCurrentSubscription(user.id);
      setCurrentSubscription(subscription);
    } catch (error) {
      logger.error("Failed to load subscription", {
        error: error instanceof Error ? error.message : "Unknown error",
        userId: user.id,
      });
      toast({
        title: "Error",
        description: "Failed to load subscription information.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast, user?.id]);

  useEffect(() => {
    void loadSubscription();
  }, [loadSubscription]);

  const handleCancelSubscription = async () => {
    if (!currentSubscription?.id) return;

    setCancelling(true);
    try {
      const success = await subscriptionManager.cancelSubscription(currentSubscription.id, true);
      if (success) {
        toast({
          title: "Subscription Cancelled",
          description:
            "Your subscription will remain active until the end of the current billing period.",
        });
        await loadSubscription();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel subscription. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCancelling(false);
    }
  };

  const handleManageBilling = async () => {
    try {
      const portalUrl = await subscriptionManager.createBillingPortalSession(window.location.href);
      if (portalUrl) {
        window.location.href = portalUrl;
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to open billing portal. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePlanSelect = (planId: string) => {
    if (planId === "free" && currentSubscription) {
      handleCancelSubscription();
    } else {
      // Navigate to upgrade flow
      setShowPlans(false);
      // This would typically navigate to a checkout page
      logger.info("Plan upgrade initiated", { planId, currentPlan: currentSubscription?.plan?.id });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading subscription...</span>
      </div>
    );
  }

  if (showPlans) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Choose Your Plan</h2>
          <Button variant="outline" onClick={() => setShowPlans(false)}>
            Back
          </Button>
        </div>
        <SubscriptionPlans
          currentPlanId={currentSubscription?.plan?.id || "free"}
          onSelectPlan={handlePlanSelect}
          onManageBilling={handleManageBilling}
        />
      </div>
    );
  }

  const plan = currentSubscription
    ? getPlanById(currentSubscription.plan?.id)
    : getPlanById("free");
  const isActive = currentSubscription?.status === "active";
  const isCancelled = currentSubscription?.cancelAtPeriodEnd;
  const isPastDue = currentSubscription?.status === "past_due";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Subscription Management</h2>
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        )}
      </div>

      {/* Current Subscription Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Current Plan
          </CardTitle>
          <CardDescription>Manage your subscription and billing information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">{plan?.name || "Free"}</h3>
              <p className="text-sm text-muted-foreground">
                {plan?.price ? formatPrice(plan.price) : "Free"} per month
              </p>
            </div>
            <Badge
              variant={
                isActive
                  ? "default"
                  : isCancelled
                    ? "secondary"
                    : isPastDue
                      ? "destructive"
                      : "outline"
              }
            >
              {isActive ? (
                <>
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Active
                </>
              ) : isCancelled ? (
                <>
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Cancelling
                </>
              ) : isPastDue ? (
                <>
                  <XCircle className="w-3 h-3 mr-1" />
                  Past Due
                </>
              ) : (
                "Inactive"
              )}
            </Badge>
          </div>

          {currentSubscription && (
            <>
              <Separator />
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Next billing date</p>
                  <p className="font-medium">
                    {new Date(currentSubscription.currentPeriodEnd * 1000).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Payment method</p>
                  <p className="font-medium">
                    {currentSubscription.paymentMethod?.card
                      ? `•••• •••• •••• ${currentSubscription.paymentMethod.card.last4}`
                      : "Not set"}
                  </p>
                </div>
              </div>
            </>
          )}

          {isCancelled && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Your subscription will end on{" "}
                {new Date(currentSubscription.currentPeriodEnd * 1000).toLocaleDateString()}. You'll
                retain access to premium features until then.
              </AlertDescription>
            </Alert>
          )}

          {isPastDue && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                Your payment is past due. Please update your payment method to avoid service
                interruption.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button onClick={() => setShowPlans(true)} className="flex-1">
          {currentSubscription ? "Change Plan" : "Upgrade Plan"}
        </Button>

        {currentSubscription && !isCancelled && (
          <Button variant="outline" onClick={handleManageBilling} className="flex-1">
            <ExternalLink className="w-4 h-4 mr-2" />
            Manage Billing
          </Button>
        )}

        {currentSubscription && !isCancelled && (
          <Button
            variant="destructive"
            onClick={handleCancelSubscription}
            disabled={cancelling}
            className="flex-1"
          >
            {cancelling ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <XCircle className="w-4 h-4 mr-2" />
            )}
            Cancel Subscription
          </Button>
        )}
      </div>

      {/* Admin Status */}
      {isAdmin && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            You have admin privileges and full access to all features.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
