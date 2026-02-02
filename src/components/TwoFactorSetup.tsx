import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Shield,
  ShieldCheck,
  ShieldOff,
  Copy,
  Check,
  Loader2,
  QrCode,
  Key,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  initiate2FASetup,
  verify2FACode,
  disable2FA,
  get2FAStatus,
  regenerateBackupCodes,
  TwoFactorSetup as TwoFactorSetupData,
  TwoFactorStatus,
} from "@/lib/twoFactorAuth";

export function TwoFactorSetup() {
  const { user } = useAuth();
  const [status, setStatus] = useState<TwoFactorStatus | null>(null);
  const [setupData, setSetupData] = useState<TwoFactorSetupData | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [showDisable, setShowDisable] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    const s = await get2FAStatus();
    setStatus(s);
  };

  const handleStartSetup = async () => {
    if (!user?.email) {
      toast.error("Please sign in first");
      return;
    }

    setLoading(true);
    try {
      const data = await initiate2FASetup(user.email);
      setSetupData(data);
      setShowSetup(true);
    } catch (error) {
      toast.error("Failed to initialize 2FA setup");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (verificationCode.length !== 6) {
      toast.error("Please enter a 6-digit code");
      return;
    }

    setLoading(true);
    try {
      const success = await verify2FACode(verificationCode);
      if (success) {
        await loadStatus();
        setShowSetup(false);
        setSetupData(null);
        setVerificationCode("");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    if (disableCode.length < 6) {
      toast.error("Please enter your verification code");
      return;
    }

    setLoading(true);
    try {
      const success = await disable2FA(disableCode);
      if (success) {
        await loadStatus();
        setShowDisable(false);
        setDisableCode("");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopySecret = async () => {
    if (setupData?.secret) {
      await navigator.clipboard.writeText(setupData.secret);
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
      toast.success("Secret copied to clipboard");
    }
  };

  const handleCopyBackupCodes = async () => {
    if (setupData?.backupCodes) {
      await navigator.clipboard.writeText(setupData.backupCodes.join("\n"));
      setCopiedCodes(true);
      setTimeout(() => setCopiedCodes(false), 2000);
      toast.success("Backup codes copied to clipboard");
    }
  };

  if (!status) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {status.enabled ? (
              <ShieldCheck className="w-6 h-6 text-green-500" />
            ) : (
              <Shield className="w-6 h-6 text-muted-foreground" />
            )}
            <div>
              <CardTitle>Two-Factor Authentication</CardTitle>
              <CardDescription>Add an extra layer of security to your account</CardDescription>
            </div>
          </div>
          <Badge variant={status.enabled ? "default" : "secondary"}>
            {status.enabled ? "Enabled" : "Disabled"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {status.enabled ? (
          <>
            <div className="flex items-center justify-between p-4 bg-green-500/10 rounded-lg border border-green-500/20">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-green-500" />
                <div>
                  <p className="font-medium">2FA is active</p>
                  <p className="text-sm text-muted-foreground">
                    {status.backupCodesRemaining} backup codes remaining
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowDisable(true)}>
                <ShieldOff className="w-4 h-4 mr-2" />
                Disable
              </Button>
            </div>

            {showDisable && (
              <div className="space-y-4 p-4 border rounded-lg bg-destructive/5">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="w-5 h-5" />
                  <p className="font-medium">Confirm Disable 2FA</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  Enter your 2FA code or backup code to disable two-factor authentication.
                </p>
                <div className="space-y-2">
                  <Label>Verification Code</Label>
                  <Input
                    value={disableCode}
                    onChange={e => setDisableCode(e.target.value)}
                    placeholder="Enter code"
                    maxLength={10}
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="destructive" onClick={handleDisable} disabled={loading}>
                    {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Disable 2FA
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDisable(false);
                      setDisableCode("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : showSetup && setupData ? (
          <div className="space-y-6">
            {/* Step 1: QR Code */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                  1
                </div>
                <h3 className="font-semibold">Scan QR Code</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
              </p>
              <div className="flex flex-col items-center gap-4 p-4 bg-white rounded-lg">
                <QrCode className="w-32 h-32 text-black" />
                <p className="text-xs text-muted-foreground text-center">
                  QR code preview - use the secret key below
                </p>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 p-2 bg-muted rounded text-sm font-mono break-all">
                  {setupData.secret}
                </code>
                <Button variant="outline" size="icon" onClick={handleCopySecret}>
                  {copiedSecret ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <Separator />

            {/* Step 2: Backup Codes */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                  2
                </div>
                <h3 className="font-semibold">Save Backup Codes</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Save these backup codes in a secure place. Each code can only be used once.
              </p>
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  {setupData.backupCodes.map((code, i) => (
                    <code key={i} className="text-sm font-mono">
                      {code}
                    </code>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-2"
                  onClick={handleCopyBackupCodes}
                >
                  {copiedCodes ? (
                    <Check className="w-4 h-4 mr-2" />
                  ) : (
                    <Copy className="w-4 h-4 mr-2" />
                  )}
                  Copy All Codes
                </Button>
              </div>
            </div>

            <Separator />

            {/* Step 3: Verify */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                  3
                </div>
                <h3 className="font-semibold">Verify Setup</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Enter the 6-digit code from your authenticator app to complete setup.
              </p>
              <div className="space-y-2">
                <Label>Verification Code</Label>
                <Input
                  value={verificationCode}
                  onChange={e => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  className="text-center text-2xl tracking-widest"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleVerify}
                  disabled={loading || verificationCode.length !== 6}
                  className="flex-1"
                >
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Enable 2FA
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowSetup(false);
                    setSetupData(null);
                    setVerificationCode("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Two-factor authentication adds an extra layer of security to your account by requiring
              a verification code in addition to your password when signing in.
            </p>
            <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
              <Key className="w-8 h-8 text-muted-foreground" />
              <div>
                <p className="font-medium">Use an authenticator app</p>
                <p className="text-sm text-muted-foreground">
                  Compatible with Google Authenticator, Authy, 1Password, and more
                </p>
              </div>
            </div>
            <Button onClick={handleStartSetup} disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <Shield className="w-4 h-4 mr-2" />
              Set Up Two-Factor Authentication
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default TwoFactorSetup;
