import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
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

export const EmailVerificationGate = ({
  children,
  requireVerification = true,
}: EmailVerificationGateProps) => {
  const { user, loading, isSuperAdmin, hasFullAccess, allFeaturesUnlocked, rolesLoading } =
    useAuth();
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);

  // AGGRESSIVE fallback: 1s max for verification check
  useEffect(() => {
    const fallback = setTimeout(() => {
      if (checking) {
        logger.warn("[verify] Fallback triggered - allowing access");
        setChecking(false);
        setIsVerified(true);
      }
    }, 1000);

    return () => clearTimeout(fallback);
  }, [checking]);

  useEffect(() => {
    // Skip check if no user or still loading auth
    if (loading) return;

    if (!user) {
      setIsVerified(null);
      setChecking(false);
      return;
    }

    // Quick async check with 800ms timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 800);

    supabase.auth
      .getUser()
      .then(({ data: { user: currentUser } }) => {
        if (!controller.signal.aborted) {
          setIsVerified(!!currentUser?.email_confirmed_at);
        }
      })
      .catch(() => {
        // On error, allow access
        if (!controller.signal.aborted) {
          setIsVerified(true);
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
  }, [user, loading]);

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
  const stillCheckingAccess = loading || rolesLoading || checking;

  // Show loading while checking (auth, roles, or verification)
  if (stillCheckingAccess) {
    return <AppLoadingScreen message="Loading MorphoScan Pro..." />;
  }

  // If verification is not required, show children
  if (!requireVerification) {
    return <>{children}</>;
  }

  // Super admin bypass: never block on email verification (checked AFTER loading completes)
  if (isSuperAdmin || hasFullAccess || allFeaturesUnlocked) {
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
