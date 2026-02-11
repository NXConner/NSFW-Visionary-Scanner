/**
 * Email Verification Component
 *
 * Displays email verification status and allows users to resend verification emails.
 * Matches the UI design from the MorphoScan Pro app.
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  Mail,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Shield,
  Cloud,
  Bell,
  Star,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { EmailService } from "@/lib/email";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface EmailVerificationProps {
  onVerified?: () => void;
  showBenefits?: boolean;
  className?: string;
}

export const EmailVerification: React.FC<EmailVerificationProps> = ({
  onVerified,
  showBenefits = true,
  className = "",
}) => {
  const { user } = useAuth();
  const [isVerified, setIsVerified] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  const email = user?.email || "";
  const maskedEmail = email ? `${email.substring(0, 3)}***@${email.split("@")[1] || ""}` : "";

  // Check verification status
  const checkVerificationStatus = useCallback(async () => {
    setIsChecking(true);
    try {
      const verified = await EmailService.checkEmailVerificationStatus();
      setIsVerified(verified);
      if (verified && onVerified) {
        onVerified();
      }
    } catch (error) {
      console.error("Error checking verification status:", error);
    } finally {
      setIsChecking(false);
    }
  }, [onVerified]);

  // Initial check and polling
  useEffect(() => {
    checkVerificationStatus();

    // Poll every 5 seconds to check if user verified
    const interval = setInterval(checkVerificationStatus, 5000);
    return () => clearInterval(interval);
  }, [checkVerificationStatus]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  // Handle resend verification email
  const handleResendEmail = async () => {
    if (!email || cooldown > 0) return;

    setIsResending(true);
    setResendSuccess(false);
    setResendError(null);

    try {
      const result = await EmailService.sendVerificationEmail(email);

      if (result.success) {
        setResendSuccess(true);
        setCooldown(60); // 60 second cooldown
      } else {
        setResendError(result.error || "Failed to send verification email");
      }
    } catch (error) {
      setResendError("An unexpected error occurred");
    } finally {
      setIsResending(false);
    }
  };

  // If already verified, show success state
  if (isVerified) {
    return (
      <Card
        className={`bg-gradient-to-br from-green-900/20 to-green-800/10 border-green-500/30 ${className}`}
      >
        <CardContent className="p-6">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Email Verified!</h2>
            <p className="text-white/70 text-sm">
              Your email address has been verified. You now have full access to all features.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Verification Card */}
      <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-orange-500/30">
        <CardContent className="p-6">
          <div className="flex flex-col items-center text-center">
            {/* Icon */}
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center mb-4 shadow-lg shadow-orange-500/20">
              <Mail className="w-8 h-8 text-white" />
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-white mb-2">Email Verification Required</h2>

            {/* Description */}
            <p className="text-white/70 text-sm mb-6">
              Please verify your email address to access all features of MorphoScan Pro.
            </p>

            {/* Alert Box */}
            <Alert className="bg-orange-500/10 border-orange-500/30 mb-6">
              <AlertCircle className="h-4 w-4 text-orange-500" />
              <AlertTitle className="text-orange-400 font-semibold">
                Email Verification Required
              </AlertTitle>
              <AlertDescription className="text-white/80">
                Please verify your email address ({maskedEmail}) to access all features. Check your
                inbox for the verification link.
              </AlertDescription>
            </Alert>

            {/* Status and Actions */}
            <div className="flex items-center justify-center gap-4 w-full">
              {/* Checking Status */}
              <div className="flex items-center gap-2 text-white/60 text-sm">
                {isChecking ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Checking...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    <span>Not verified</span>
                  </>
                )}
              </div>

              {/* Resend Button */}
              <Button
                onClick={handleResendEmail}
                disabled={isResending || cooldown > 0}
                className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-semibold"
              >
                {isResending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : cooldown > 0 ? (
                  `Resend in ${cooldown}s`
                ) : (
                  "Resend Email"
                )}
              </Button>
            </div>

            {/* Success/Error Messages */}
            {resendSuccess && (
              <p className="mt-4 text-green-400 text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Verification email sent! Check your inbox.
              </p>
            )}
            {resendError && (
              <p className="mt-4 text-red-400 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {resendError}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Why Verify Section */}
      {showBenefits && (
        <Card className="bg-slate-900/50 border-slate-700/50">
          <CardContent className="p-6">
            <h3 className="text-amber-500 font-semibold flex items-center gap-2 mb-4">
              <AlertCircle className="w-4 h-4" />
              Why verify?
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-white/80 text-sm">
                <Shield className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                <span>Secure access to your health data</span>
              </li>
              <li className="flex items-start gap-3 text-white/80 text-sm">
                <Cloud className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                <span>Enable cloud backup and sync</span>
              </li>
              <li className="flex items-start gap-3 text-white/80 text-sm">
                <Bell className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                <span>Receive important notifications</span>
              </li>
              <li className="flex items-start gap-3 text-white/80 text-sm">
                <Star className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                <span>Access premium features</span>
              </li>
            </ul>

            <p className="mt-4 text-white/50 text-xs">
              Didn't receive the email? Check your spam folder or click "Resend Email" above.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EmailVerification;
