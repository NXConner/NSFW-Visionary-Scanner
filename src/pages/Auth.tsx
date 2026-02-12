import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  Shield,
  Mail,
  Lock,
  Scan,
  ArrowLeft,
  KeyRound,
  Chrome,
  Apple,
  Fingerprint,
} from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { BiometricLoginButton } from "@/components/BiometricLoginButton";
import { useBiometricAuth } from "@/hooks/useBiometricAuth";
import { APP_SHORT_NAME, SUPPORT_CONTACT_EMAIL } from "@/config/brand";
import { EmailVerificationBanner } from "@/components/EmailVerificationBanner";
import { emitSupabaseInvalidApiKeyEvent, isInvalidSupabaseApiKeyError } from "@/integrations/supabase/events";

const authSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const emailSchema = z.object({
  email: z.string().email("Please enter a valid email"),
});

type AuthMode = "login" | "signup" | "forgot" | "reset";

const Auth = () => {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const { user, signIn, signUp, signInWithGoogle, signInWithApple } = useAuth();
  const navigate = useNavigate();
  const {
    isAvailable: biometricAvailable,
    settings: biometricSettings,
    storeCredentials,
  } = useBiometricAuth();

  useEffect(() => {
    if (user) navigate("/");
  }, [user, navigate]);

  // Check for password reset token or email verification in URL
  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const searchParams = new URLSearchParams(window.location.search);
    const type = hashParams.get("type");
    const verified = searchParams.get("verified");

    if (type === "recovery") {
      setMode("reset");
    }

    if (verified === "true") {
      toast.success("Email verified successfully! You can now sign in.");
      setNeedsVerification(false);
      setMode("login");
    }
  }, []);

  // Load remembered email
  useEffect(() => {
    const rememberedEmail = localStorage.getItem("remembered_email");
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "forgot") {
        const validation = emailSchema.safeParse({ email });
        if (!validation.success) {
          toast.error(validation.error.errors[0].message);
          setLoading(false);
          return;
        }

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth#type=recovery`,
        });

        if (error) throw error;
        toast.success("Password reset email sent! Check your inbox.");
        setMode("login");
      } else if (mode === "reset") {
        if (password !== confirmPassword) {
          toast.error("Passwords do not match");
          setLoading(false);
          return;
        }

        const validation = z
          .string()
          .min(6, "Password must be at least 6 characters")
          .safeParse(password);
        if (!validation.success) {
          toast.error(validation.error.errors[0].message);
          setLoading(false);
          return;
        }

        const { error } = await supabase.auth.updateUser({ password });

        if (error) throw error;
        toast.success("Password updated successfully!");
        navigate("/");
      } else {
        const validation = authSchema.safeParse({ email, password });
        if (!validation.success) {
          toast.error(validation.error.errors[0].message);
          setLoading(false);
          return;
        }

        if (rememberMe) {
          localStorage.setItem("remembered_email", email);
        } else {
          localStorage.removeItem("remembered_email");
        }

        if (mode === "signup") {
          const { error } = await signUp(email, password);
          if (error) {
            const message = error.message.includes("already registered")
              ? "This email is already registered. Please sign in."
              : error.message;
            throw new Error(message);
          }
          toast.success("Account created! Please check your email to verify your account.");
          setNeedsVerification(true);
          // Show verification message instead of navigating
          setMode("login");
          return;
        } else {
          const { error } = await signIn(email, password, rememberMe);
          if (error) {
            const message = error.message.includes("Invalid login")
              ? "Invalid email or password."
              : error.message.includes("Invalid API key")
                ? "Backend misconfigured (invalid Supabase API key). Tap the Supabase fix prompt to update keys."
              : error.message.includes("Email not confirmed")
                ? "Please verify your email address before signing in. Check your inbox for the verification link."
                : error.message;
            if (error.message.includes("Email not confirmed")) {
              setNeedsVerification(true);
            }
            throw new Error(message);
          }

          // Store credentials for biometric login if available
          if (biometricAvailable && biometricSettings.enabled) {
            await storeCredentials(email, password);
          }

          toast.success("Welcome back!");
          setNeedsVerification(false);
          navigate("/");
        }
      }
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error("An error occurred");
      if (isInvalidSupabaseApiKeyError(err)) {
        emitSupabaseInvalidApiKeyEvent();
      }
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    switch (mode) {
      case "forgot":
        return "Reset Password";
      case "reset":
        return "Set New Password";
      case "signup":
        return "Create Account";
      default:
        return "Welcome Back";
    }
  };

  const getSubtitle = () => {
    switch (mode) {
      case "forgot":
        return "Enter your email to receive a reset link";
      case "reset":
        return "Enter your new password";
      case "signup":
        return "Start tracking your health journey";
      default:
        return "Sign in to access your health data";
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 safe-area-inset">
      <div className="w-full max-w-md">
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4 sm:mb-6">
            <Scan className="w-5 h-5 text-primary" />
            <span className="text-primary font-semibold">{APP_SHORT_NAME}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold mb-2">{getTitle()}</h1>
          <p className="text-sm sm:text-base text-muted-foreground">{getSubtitle()}</p>
        </div>

        <Card variant="glass">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              {mode === "forgot" || mode === "reset" ? (
                <KeyRound className="w-5 h-5 text-primary" />
              ) : (
                <Shield className="w-5 h-5 text-primary" />
              )}
              {mode === "forgot"
                ? "Forgot Password"
                : mode === "reset"
                  ? "New Password"
                  : mode === "signup"
                    ? "Sign Up"
                    : "Sign In"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {needsVerification && email && (mode === "login" || mode === "signup") && (
              <div className="mb-4">
                <EmailVerificationBanner
                  email={email}
                  onVerified={() => setNeedsVerification(false)}
                />
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {mode !== "reset" && (
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder={SUPPORT_CONTACT_EMAIL}
                      className="pl-10 h-12 text-base"
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>
              )}

              {(mode === "login" || mode === "signup") && (
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pl-10 h-12 text-base"
                      required
                      autoComplete={mode === "login" ? "current-password" : "new-password"}
                    />
                  </div>
                </div>
              )}

              {mode === "reset" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="newPassword"
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="pl-10 h-12 text-base"
                        required
                        autoComplete="new-password"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="pl-10 h-12 text-base"
                        required
                        autoComplete="new-password"
                      />
                    </div>
                  </div>
                </>
              )}

              {mode === "login" && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="rememberMe"
                      checked={rememberMe}
                      onCheckedChange={checked => setRememberMe(checked === true)}
                    />
                    <Label
                      htmlFor="rememberMe"
                      className="text-sm text-muted-foreground cursor-pointer"
                    >
                      Remember me
                    </Label>
                  </div>
                  <Button
                    type="button"
                    variant="link"
                    className="text-sm text-primary p-0 h-auto"
                    onClick={() => setMode("forgot")}
                  >
                    Forgot password?
                  </Button>
                </div>
              )}

              <Button
                type="submit"
                variant="hero"
                className="w-full h-12 text-base"
                disabled={loading}
              >
                {loading
                  ? "Please wait..."
                  : mode === "forgot"
                    ? "Send Reset Link"
                    : mode === "reset"
                      ? "Update Password"
                      : mode === "signup"
                        ? "Create Account"
                        : "Sign In"}
              </Button>

              {(mode === "login" || mode === "signup") && (
                <>
                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-12"
                      onClick={async () => {
                        setLoading(true);
                        const { error } = await signInWithGoogle();
                        if (error) toast.error(error.message);
                        setLoading(false);
                      }}
                      disabled={loading}
                    >
                      <Chrome className="w-5 h-5 mr-2" />
                      Google
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-12"
                      onClick={async () => {
                        setLoading(true);
                        const { error } = await signInWithApple();
                        if (error) toast.error(error.message);
                        setLoading(false);
                      }}
                      disabled={loading}
                    >
                      <Apple className="w-5 h-5 mr-2" />
                      Apple
                    </Button>
                  </div>

                  {mode === "login" && (
                    <BiometricLoginButton
                      onSuccess={async credentials => {
                        setLoading(true);
                        try {
                          const { error } = await signIn(
                            credentials.username,
                            credentials.password,
                          );
                          if (error) throw error;
                          toast.success("Welcome back!");
                          navigate("/");
                        } catch (err: unknown) {
                          toast.error(err instanceof Error ? err.message : "Login failed");
                        } finally {
                          setLoading(false);
                        }
                      }}
                      className="mt-3"
                    />
                  )}
                </>
              )}
            </form>

            {(mode === "forgot" || mode === "reset") && (
              <div className="mt-4">
                <Button variant="ghost" className="w-full gap-2" onClick={() => setMode("login")}>
                  <ArrowLeft className="w-4 h-4" />
                  Back to Sign In
                </Button>
              </div>
            )}

            {(mode === "login" || mode === "signup") && (
              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  {mode === "login" ? "Don't have an account?" : "Already have an account?"}
                  <Button
                    variant="link"
                    className="px-2 text-primary"
                    onClick={() => setMode(mode === "login" ? "signup" : "login")}
                  >
                    {mode === "login" ? "Sign Up" : "Sign In"}
                  </Button>
                </p>
              </div>
            )}

            <div className="mt-4 p-3 rounded-lg bg-secondary/30 text-xs text-muted-foreground flex items-start gap-2">
              <Shield className="w-4 h-4 mt-0.5 text-success flex-shrink-0" />
              <span>
                Your health data is encrypted and stored securely. We never share your information.
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
