import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { EmailVerificationBanner } from "./EmailVerificationBanner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import { APP_NAME } from "@/config/brand";
import { useUserRoles } from "@/hooks/useUserRoles";

interface EmailVerificationGateProps {
  children: React.ReactNode;
  requireVerification?: boolean;
}

export const EmailVerificationGate = ({
  children,
  requireVerification = true,
}: EmailVerificationGateProps) => {
  const { user, loading, isSuperAdmin, hasFullAccess, allFeaturesUnlocked, rolesLoading } =
    useAuth();
  const { isAdmin, isSuperAdmin: isSuperAdminRole, isLoading: rolesHookLoading } = useUserRoles();
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);

  // Fallback: avoid indefinite loading, but keep verification strict
  useEffect(() => {
    if (!requireVerification) return;
    if (!user) return;
    // Privileged users must never be blocked by email verification checks.
    if (isSuperAdmin || hasFullAccess || allFeaturesUnlocked || isAdmin || isSuperAdminRole) return;
    const fallback = setTimeout(() => {
      if (checking) {
        logger.warn("[verify] Verification check timed out");
        setChecking(false);
        setIsVerified(false);
      }
    }, 4000);

    return () => clearTimeout(fallback);
  }, [
    checking,
    requireVerification,
    user,
    isSuperAdmin,
    hasFullAccess,
    allFeaturesUnlocked,
    isAdmin,
    isSuperAdminRole,
  ]);

  useEffect(() => {
    if (!requireVerification) {
      setChecking(false);
      setIsVerified(true);
      return;
    }

    // Skip check if no user or still loading auth
    if (loading) return;

    if (!user) {
      setIsVerified(null);
      setChecking(false);
      return;
    }

    // Privileged bypass: do not block on verification checks.
    if (isSuperAdmin || hasFullAccess || allFeaturesUnlocked || isAdmin || isSuperAdminRole) {
      setIsVerified(true);
      setChecking(false);
      return;
    }

    // Quick async check with 2s timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);

    supabase.auth
      .getUser()
      .then(({ data: { user: currentUser } }) => {
        if (!controller.signal.aborted) {
          setIsVerified(!!currentUser?.email_confirmed_at);
        }
      })
      .catch(() => {
        // On error, keep strict (do not allow access)
        if (!controller.signal.aborted) {
          setIsVerified(false);
        }
      })
      .finally(() => {
        clearTimeout(timeout);
        if (!controller.signal.aborted) {
          setChecking(false);
        }
      });

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [
    user,
    loading,
    requireVerification,
    isSuperAdmin,
    hasFullAccess,
    allFeaturesUnlocked,
    isAdmin,
    isSuperAdminRole,
  ]);

  // Listen for auth state changes
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        // Privileged bypass: never block on email verification.
        if (isSuperAdmin || hasFullAccess || allFeaturesUnlocked) {
          setIsVerified(true);
        } else {
          setIsVerified(!!session?.user?.email_confirmed_at);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [allFeaturesUnlocked, hasFullAccess, isSuperAdmin]);

  const isPrivileged =
    isSuperAdmin || hasFullAccess || allFeaturesUnlocked || isAdmin || isSuperAdminRole;

  // Combined loading state for role checks (email verification itself is skipped for privileged users)
  const stillCheckingRoles = loading || rolesLoading || rolesHookLoading;

  if (stillCheckingRoles) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // If verification is not required, show children
  if (!requireVerification) {
    return <>{children}</>;
  }

  // Privileged bypass: never block on email verification (checked AFTER roles resolve)
  if (isPrivileged) {
    return <>{children}</>;
  }

  // If no user, show children (auth will handle it)
  if (!user) {
    return <>{children}</>;
  }

  // Show loading while checking verification (only for non-privileged users)
  if (checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // If verified, show children
  if (isVerified) {
    return <>{children}</>;
  }

  // If not verified, show verification required UI
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 rounded-full bg-warning/10 w-fit">
            <Mail className="w-8 h-8 text-warning" />
          </div>
          <CardTitle>Email Verification Required</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            Please verify your email address to access all features of {APP_NAME}.
          </p>

          <EmailVerificationBanner
            email={user.email || ""}
            onVerified={() => setIsVerified(true)}
          />

          <div className="p-4 rounded-lg bg-muted/30 space-y-2">
            <div className="flex items-start gap-2">
              <Shield className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium mb-1">Why verify?</p>
                <ul className="text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Secure access to your health data</li>
                  <li>Enable cloud backup and sync</li>
                  <li>Receive important notifications</li>
                  <li>Access premium features</li>
                </ul>
              </div>
            </div>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Didn't receive the email? Check your spam folder or click "Resend Email" above.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
