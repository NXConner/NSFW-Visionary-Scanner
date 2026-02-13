import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Lock, Fingerprint, Shield } from "lucide-react";
import { toast } from "sonner";
import { useBiometricAuth } from "@/hooks/useBiometricAuth";
import { useNsfwPrivacySettings } from "@/lib/nsfwPrivacySettings";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRoles } from "@/hooks/useUserRoles";
import {
  clearNsfwSessionUnlocked,
  isNsfwSessionLocked,
  isNsfwPanicLocked,
  clearNsfwPanicLock,
  markNsfwSessionUnlocked,
} from "@/lib/nsfwSessionLock";

type AppLockSettings = { enabled: boolean; pin: string; useBiometric: boolean };
const APP_LOCK_KEY = "morphoscan_lock_settings";

function readAppLockSettings(): AppLockSettings | null {
  try {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(APP_LOCK_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AppLockSettings>;
    const enabled = Boolean(parsed.enabled);
    const pin = String(parsed.pin ?? "");
    const useBiometric = Boolean(parsed.useBiometric);
    return { enabled, pin, useBiometric };
  } catch {
    return null;
  }
}

export function NsfwSessionGate({
  title = "NSFW Session Locked",
  description = "Unlock to access adult-only content. Session re-locks automatically.",
  children,
}: {
  title?: string;
  description?: string;
  children: React.ReactNode;
}): JSX.Element {
  const { isSuperAdmin, hasFullAccess, allFeaturesUnlocked, loading: authLoading, rolesLoading } = useAuth();
  const { isAdmin, isSuperAdmin: isSuperAdminRole, isLoading: rolesHookLoading } = useUserRoles();
  const { settings } = useNsfwPrivacySettings();
  const {
    isAvailable: bioAvailable,
    settings: bioSettings,
    authenticate,
    isLoading,
  } = useBiometricAuth();

  const [enteredPin, setEnteredPin] = useState("");
  const isPrivileged =
    isSuperAdmin || hasFullAccess || allFeaturesUnlocked || isAdmin || isSuperAdminRole;
  const [locked, setLocked] = useState<boolean>(() =>
    isPrivileged ? false : isNsfwSessionLocked(settings),
  );

  const appLock = useMemo(() => readAppLockSettings(), []);

  const hasBiometric = Boolean(bioAvailable && bioSettings.enabled);
  const requireBiometric = Boolean(settings.requireBiometricIfAvailable && hasBiometric);
  const hasPin = Boolean(
    !requireBiometric && appLock?.enabled && appLock?.pin && appLock.pin.length === 4,
  );
  const canUnlock = hasPin || hasBiometric;
  
  // Combined loading state for access checks
  const stillCheckingAccess = authLoading || rolesLoading || rolesHookLoading || isLoading;

  useEffect(() => {
    const onChange = () => setLocked(isNsfwSessionLocked(settings));
    window.addEventListener("nsfw-session-lock-changed", onChange as EventListener);
    return () => window.removeEventListener("nsfw-session-lock-changed", onChange as EventListener);
  }, [settings]);

  useEffect(() => {
    setLocked(isNsfwSessionLocked(settings));
  }, [settings]);

  // Super admin bypass: NSFW session lock never applies.
  useEffect(() => {
    if (!isPrivileged) return;
    markNsfwSessionUnlocked();
    setLocked(false);
    setEnteredPin("");
  }, [isPrivileged]);

  // Extend session on activity; lock immediately when backgrounded/hidden.
  const lastTouchMs = useRef(0);
  useEffect(() => {
    if (!settings.sessionLockEnabled) return;

    const lockNow = () => {
      clearNsfwSessionUnlocked();
      setLocked(true);
      setEnteredPin("");
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") lockNow();
    };

    const onBlur = () => lockNow();

    const onActivity = () => {
      if (locked) return;
      const now = Date.now();
      // Throttle writes/events.
      if (now - lastTouchMs.current < 15_000) return;
      lastTouchMs.current = now;
      markNsfwSessionUnlocked();
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    window.addEventListener("mousemove", onActivity, { passive: true });
    window.addEventListener("keydown", onActivity, { passive: true });
    window.addEventListener("touchstart", onActivity, { passive: true });
    window.addEventListener("scroll", onActivity, { passive: true });

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("mousemove", onActivity as any);
      window.removeEventListener("keydown", onActivity as any);
      window.removeEventListener("touchstart", onActivity as any);
      window.removeEventListener("scroll", onActivity as any);
    };
  }, [locked, settings.sessionLockEnabled]);

  const unlock = useCallback(() => {
    clearNsfwPanicLock();
    markNsfwSessionUnlocked();
    setLocked(false);
    setEnteredPin("");
  }, []);

  const handleBiometricUnlock = useCallback(async () => {
    if (!hasBiometric) return;
    const ok = await authenticate("Unlock NSFW content");
    if (ok) {
      unlock();
      toast.success("NSFW session unlocked");
    } else {
      toast.error("Biometric unlock failed");
    }
  }, [authenticate, hasBiometric, unlock]);

  const handlePinUnlock = useCallback(() => {
    if (!hasPin) return;
    if (enteredPin === appLock?.pin) {
      unlock();
      toast.success("NSFW session unlocked");
    } else {
      setEnteredPin("");
      toast.error("Incorrect PIN");
    }
  }, [appLock?.pin, enteredPin, hasPin, unlock]);

  useEffect(() => {
    if (enteredPin.length === 4 && hasPin) {
      handlePinUnlock();
    }
  }, [enteredPin, handlePinUnlock, hasPin]);

  if (!settings.sessionLockEnabled) {
    return <>{children}</>;
  }

  // Wait for loading states before checking super admin access
  if (stillCheckingAccess) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Super admin bypass: checked AFTER loading completes
  if (isPrivileged) {
    return <>{children}</>;
  }

  if (!locked) {
    return <>{children}</>;
  }

  const panicActive = isNsfwPanicLocked();

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-10">
      <Card className="glass-card border-border/50 w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-muted/30 flex items-center justify-center mb-3">
            <Lock className="w-8 h-8 text-muted-foreground" />
          </div>
          <CardTitle>{panicActive ? "Panic Lock Active" : title}</CardTitle>
          <CardDescription>
            {panicActive
              ? "NSFW access is temporarily locked. Unlock to continue."
              : description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {!canUnlock ? (
            <div className="rounded-xl border border-border/60 bg-secondary/20 p-4 space-y-2">
              <div className="text-sm text-muted-foreground">
                To use NSFW session lock, enable App Lock (PIN) or Biometric login.
              </div>
              <Badge variant="secondary" className="gap-1">
                <Shield className="w-3 h-3" /> Security required
              </Badge>
            </div>
          ) : null}

          {requireBiometric ? (
            <div className="rounded-xl border border-border/60 bg-secondary/20 p-4 space-y-2">
              <div className="text-sm text-muted-foreground">
                Biometric unlock is required (your NSFW privacy setting enforces it when available).
              </div>
              <Badge variant="secondary" className="gap-1">
                <Fingerprint className="w-3 h-3" /> Biometric required
              </Badge>
            </div>
          ) : null}

          {hasPin && (
            <div className="space-y-2">
              <div className="text-sm font-medium">Enter App PIN</div>
              <div className="flex justify-center">
                <InputOTP maxLength={4} value={enteredPin} onChange={setEnteredPin}>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} className="w-12 h-12 text-xl border-border/50" />
                    <InputOTPSlot index={1} className="w-12 h-12 text-xl border-border/50" />
                    <InputOTPSlot index={2} className="w-12 h-12 text-xl border-border/50" />
                    <InputOTPSlot index={3} className="w-12 h-12 text-xl border-border/50" />
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </div>
          )}

          {hasBiometric && (
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => void handleBiometricUnlock()}
              disabled={isLoading}
            >
              <Fingerprint className="w-4 h-4" />
              Unlock with Biometric
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
