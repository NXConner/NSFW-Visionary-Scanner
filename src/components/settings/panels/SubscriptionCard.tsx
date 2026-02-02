import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRoles } from "@/hooks/useUserRoles";
import { getSubscriptionStatus, createCustomerPortalSession } from "@/lib/stripe";
import { Crown, ExternalLink, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function SubscriptionCard() {
  const { user, subscription, subscriptionStatus } = useAuth();
  const { isAdmin, isSuperAdmin, isLoading: rolesLoading } = useUserRoles();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [sub, setSub] = useState<Awaited<ReturnType<typeof getSubscriptionStatus>>>(null);

  // Admin or super_admin = premium access
  const hasAdminPremium = isAdmin || isSuperAdmin;

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!user) {
        setSub(null);
        return;
      }
      // Skip loading subscription for admin/super_admin (already have premium)
      if (hasAdminPremium) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const next = await getSubscriptionStatus(user.id);
        if (!cancelled) setSub(next);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [user, hasAdminPremium]);

  // Admin roles use premium status
  const status = hasAdminPremium ? subscriptionStatus : (sub?.status ?? "free");
  const tier = hasAdminPremium
    ? subscription
    : ((sub?.subscription_tier || sub?.plan_id || "free") as string);

  const getTierLabel = () => {
    if (isSuperAdmin) return "Tier 3 Premium (Lifetime)";
    if (isAdmin) return "Tier 3 Premium (Admin)";
    return tier;
  };

  const getRoleLabel = () => {
    if (isSuperAdmin) return "Super Admin - All Features Unlocked";
    if (isAdmin) return "Admin - All Features Unlocked";
    return null;
  };

  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {hasAdminPremium ? (
            <Shield className="w-5 h-5 text-purple-400" />
          ) : (
            <Crown className="w-5 h-5 text-yellow-400" />
          )}
          Subscription
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!user ? (
          <>
            <p className="text-sm text-muted-foreground">
              Sign in to manage your subscription and billing.
            </p>
            <Button onClick={() => navigate("/auth")} className="w-full">
              Sign In
            </Button>
          </>
        ) : hasAdminPremium ? (
          // Admin/Super Admin Display
          <>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  {getTierLabel()}
                </p>
                <p className="text-xs text-muted-foreground">
                  {getRoleLabel()}
                </p>
              </div>
              <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
                <Shield className="w-3 h-3 mr-1" />
                Active
              </Badge>
            </div>

            <div className="p-3 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
              <p className="text-xs text-muted-foreground">
                You have {isSuperAdmin ? "lifetime" : "admin"} premium access with all features unlocked including:
              </p>
              <ul className="text-xs text-muted-foreground mt-2 space-y-1 ml-4">
                <li>• All DLC packages</li>
                <li>• NSFW Scanner & Advanced Features</li>
                <li>• Premium content library</li>
                <li>• {isSuperAdmin ? "No billing or expiration" : "Admin privileges"}</li>
              </ul>
            </div>
          </>
        ) : (
          // Regular User Display
          <>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium capitalize">{tier}</p>
                <p className="text-xs text-muted-foreground">
                  {sub?.current_period_end
                    ? `Next billing: ${new Date(sub.current_period_end).toLocaleDateString()}`
                    : "Manage plans and billing"}
                </p>
              </div>
              <Badge
                variant={
                  status === "active"
                    ? "default"
                    : status === "past_due"
                      ? "destructive"
                      : "secondary"
                }
              >
                {loading || rolesLoading ? "Loading" : status}
              </Badge>
            </div>

            <div className="flex flex-col gap-2">
              <Button onClick={() => navigate("/pricing")} className="w-full">
                View Plans / Change Plan
              </Button>
              <Button
                variant="outline"
                className="w-full"
                disabled={!sub?.stripe_customer_id}
                onClick={async () => {
                  const url = await createCustomerPortalSession(window.location.href);
                  if (url) window.location.href = url;
                }}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Manage Billing
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
