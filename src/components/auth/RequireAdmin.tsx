import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Shield, LogIn, ArrowLeft } from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { useUserRoles } from "@/hooks/useUserRoles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function RequireAdmin(props: { children: React.ReactNode }): React.ReactElement {
  const { children } = props;
  const navigate = useNavigate();
  const location = useLocation();

  const {
    user,
    loading: authLoading,
    isSuperAdmin,
    hasFullAccess,
    allFeaturesUnlocked,
    rolesLoading,
  } = useAuth();
  const {
    isAdmin,
    isSuperAdmin: isSuperAdminRole,
    isLoading: rolesHookLoading,
    error,
  } = useUserRoles();

  const isPrivileged = Boolean(
    isSuperAdmin || hasFullAccess || allFeaturesUnlocked || isAdmin || isSuperAdminRole,
  );

  // Security: never allow admin surfaces without an authenticated session.
  const allowed = Boolean(user && isPrivileged);

  const loading = Boolean(authLoading || rolesLoading || rolesHookLoading);
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="flex items-center gap-3 text-muted-foreground">
          <div className="w-5 h-5 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
          <span className="text-sm">Checking admin access…</span>
        </div>
      </div>
    );
  }

  if (allowed) return <>{children}</>;

  const goBack = () => {
    try {
      // Prefer SPA back navigation; if unavailable, fall back to home.
      navigate(-1);
    } catch {
      navigate("/app");
    }
  };

  const goSignIn = () => {
    navigate("/auth", { state: { from: location.pathname + location.search } });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md glass-card border-border/50">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 p-3 rounded-full bg-primary/10 w-fit">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <CardTitle>Admin access required</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!user ? (
            <p className="text-sm text-muted-foreground text-center">
              Sign in with an admin account to access this page.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground text-center">
              Your account does not have admin privileges.
            </p>
          )}

          {error ? (
            <p className="text-xs text-muted-foreground text-center">
              Roles check error: <span className="font-mono">{error}</span>
            </p>
          ) : null}

          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" className="flex-1 gap-2" onClick={goBack}>
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            {!user ? (
              <Button className="flex-1 gap-2" onClick={goSignIn}>
                <LogIn className="w-4 h-4" />
                Sign in
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
