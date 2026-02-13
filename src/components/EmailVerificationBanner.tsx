import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import { isEmailPreVerified } from "@/lib/email/emailConfig";

interface EmailVerificationBannerProps {
  email: string;
  onVerified?: () => void;
}

export const EmailVerificationBanner = ({ email, onVerified }: EmailVerificationBannerProps) => {
  const [isResending, setIsResending] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const preVerified = isEmailPreVerified(email);

  useEffect(() => {
    if (preVerified) onVerified?.();
  }, [preVerified, onVerified]);

  const handleResendVerification = async () => {
    if (preVerified) {
      toast.success("Email already verified.");
      onVerified?.();
      return;
    }
    setIsResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth?verified=true`,
        },
      });

      if (error) throw error;

      toast.success("Verification email sent! Check your inbox.");
      logger.userAction("verification_email_resent", undefined, { email });
    } catch (error) {
      logger.error("Failed to resend verification email", { error, email });
      toast.error(error instanceof Error ? error.message : "Failed to send verification email");
    } finally {
      setIsResending(false);
    }
  };

  const handleCheckVerification = async () => {
    setIsChecking(true);
    try {
      if (preVerified) {
        toast.success("Email verified!");
        onVerified?.();
        return;
      }
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) throw error;

      if (user?.email_confirmed_at) {
        toast.success("Email verified!");
        onVerified?.();
        logger.userAction("email_verified", user.id);
      } else {
        toast.info("Email not yet verified. Please check your inbox.");
      }
    } catch (error) {
      logger.error("Failed to check verification status", { error });
      toast.error("Failed to check verification status");
    } finally {
      setIsChecking(false);
    }
  };

  if (preVerified) {
    return (
      <Alert className="border-success/50 bg-success/5">
        <CheckCircle2 className="h-4 w-4 text-success" />
        <AlertDescription className="flex-1">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex-1">
              <p className="font-medium text-success mb-1">Email Verified</p>
              <p className="text-sm text-muted-foreground">
                {email} is pre-verified and does not require email confirmation.
              </p>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="border-warning/50 bg-warning/5">
      <AlertCircle className="h-4 w-4 text-warning" />
      <AlertDescription className="flex-1">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex-1">
            <p className="font-medium text-warning mb-1">Email Verification Required</p>
            <p className="text-sm text-muted-foreground">
              Please verify your email address ({email}) to access all features. Check your inbox
              for the verification link.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCheckVerification}
              disabled={isChecking}
            >
              {isChecking ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Check Status
                </>
              )}
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleResendVerification}
              disabled={isResending}
            >
              {isResending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Resend Email
                </>
              )}
            </Button>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
};
