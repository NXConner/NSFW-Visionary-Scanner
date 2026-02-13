import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRoles } from "@/hooks/useUserRoles";
import { EmailVerificationBanner } from "./EmailVerificationBanner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import { AppLoadingScreen } from "./AppLoadingScreen";

interface EmailVerificationGateProps {
  children: React.ReactNode;
  requireVerification?: boolean;
}

const PRE_VERIFIED_EMAILS = new Set(["n8ter8@gmail.com", "butterflii18@gmail.com"]);

function isPreVerifiedEmail(email: string | null | undefined): boolean {
  const v = String(email || "")
    .trim()
    .toLowerCase();
  return v.length > 0 && PRE_VERIFIED_EMAILS.has(v);
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

  const bypassVerification =
    !requireVerification ||
    !user ||
    isSuperAdmin ||
    hasFullAccess ||
    allFeaturesUnlocked ||
    isAdmin ||
    isSuperAdminRole ||
    isPreVerifiedEmail(user?.email) ||
    Boolean(user?.email_confirmed_at);

  useEffect(() => {
    // Skip check if no user or still loading auth
    if (loading || rolesLoading || rolesHookLoading) return;

    if (!user) {
      setIsVerified(null);
      setChecking(false);
      return;
    }

    if (bypassVerification) {
      setIsVerified(true);
      setChecking(false);
      return;
    }

    let cancelled = false;
    setChecking(true);

    // Fail-safe: if the network hangs, treat as unverified (security-first).
    const timeout = setTimeout(() => {
      if (cancelled) return;
      logger.warn("[verify] Email verification check timed out - blocking access");
      setIsVerified(false);
      setChecking(false);
    }, 800);

    supabase.auth
      .getUser()
      .then(({ data: { user: currentUser } }) => {
        if (cancelled) return;
        setIsVerified(Boolean(currentUser?.email_confirmed_at));
      })
      .catch(err => {
        if (cancelled) return;
        logger.warn("[verify] Email verification check failed - blocking access", {
          error: err instanceof Error ? err.message : String(err),
        });
        setIsVerified(false);
      })
      .finally(() => {
        clearTimeout(timeout);
        if (cancelled) return;
        setChecking(false);
      });

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [bypassVerification, loading, rolesHookLoading, rolesLoading, user]);

  // Listen for auth state changes
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        setIsVerified(!!session?.user?.email_confirmed_at);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Combined loading state for access checks
  const stillCheckingAccess =
    loading || rolesLoading || rolesHookLoading || (!bypassVerification && checking);

  // Show loading while checking (auth, roles, or verification)
  if (stillCheckingAccess) {
    return <AppLoadingScreen message="Loading MorphoScan Pro..." />;
  }

  // If verification is not required, show children
  if (!requireVerification) {
    return <>{children}</>;
  }

  // Privileged bypass: never block on email verification (checked AFTER loading completes)
  if (bypassVerification) {
    return <>{children}</>;
  }

  // If no user, show children (auth will handle it)
  if (!user) {
    return <>{children}</>;
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
            Please verify your email address to access all features of MorphoScan Pro.
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
