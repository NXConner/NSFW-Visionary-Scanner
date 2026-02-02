import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Fingerprint,
  Scan,
  Eye,
  Smartphone,
  ShieldCheck,
  ShieldOff,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { useBiometricAuth } from "@/hooks/useBiometricAuth";

export function BiometricSettings() {
  const {
    settings,
    isAvailable,
    isLoading,
    enableBiometric,
    disableBiometric,
    getBiometricTypeName,
    deleteCredentials,
  } = useBiometricAuth();

  const [loading, setLoading] = useState(false);

  const handleToggle = async (enabled: boolean) => {
    setLoading(true);
    try {
      if (enabled) {
        await enableBiometric();
        toast.success(
          "Biometric login enabled! Sign in with your credentials to save them for biometric access.",
        );
      } else {
        await disableBiometric();
        await deleteCredentials();
        toast.success("Biometric login disabled");
      }
    } catch (error) {
      toast.error("Failed to update biometric settings");
    } finally {
      setLoading(false);
    }
  };

  const getIcon = () => {
    switch (settings.type) {
      case "face":
        return <Scan className="w-6 h-6" />;
      case "iris":
        return <Eye className="w-6 h-6" />;
      default:
        return <Fingerprint className="w-6 h-6" />;
    }
  };

  if (isLoading) {
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
            {settings.enabled ? (
              <div className="p-2 rounded-lg bg-green-500/10">{getIcon()}</div>
            ) : (
              <div className="p-2 rounded-lg bg-muted">
                <Fingerprint className="w-6 h-6 text-muted-foreground" />
              </div>
            )}
            <div>
              <CardTitle>Biometric Login</CardTitle>
              <CardDescription>
                {isAvailable
                  ? `Use ${getBiometricTypeName()} to sign in quickly`
                  : "Not available on this device"}
              </CardDescription>
            </div>
          </div>
          {isAvailable && (
            <Badge variant={settings.enabled ? "default" : "secondary"}>
              {settings.enabled ? "Enabled" : "Disabled"}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isAvailable ? (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border border-border">
            <AlertTriangle className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="font-medium text-sm">Biometric Authentication Unavailable</p>
              <p className="text-sm text-muted-foreground">
                Your device doesn't support biometric authentication, or it's not set up. This
                feature is available on mobile devices with fingerprint or face recognition.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Smartphone className="w-5 h-5 text-muted-foreground" />
                <div>
                  <Label htmlFor="biometric-toggle" className="font-medium">
                    Enable {getBiometricTypeName()}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Sign in without typing your password
                  </p>
                </div>
              </div>
              <Switch
                id="biometric-toggle"
                checked={settings.enabled}
                onCheckedChange={handleToggle}
                disabled={loading}
              />
            </div>

            {settings.enabled && (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <ShieldCheck className="w-5 h-5 text-green-500" />
                <div>
                  <p className="font-medium text-sm">Biometric Login Active</p>
                  <p className="text-sm text-muted-foreground">
                    Your credentials are securely stored and protected by {getBiometricTypeName()}.
                  </p>
                </div>
              </div>
            )}

            {settings.enabled && (
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  setLoading(true);
                  await deleteCredentials();
                  toast.success(
                    "Saved credentials cleared. Sign in again to save new credentials.",
                  );
                  setLoading(false);
                }}
                disabled={loading}
                className="w-full"
              >
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                <ShieldOff className="w-4 h-4 mr-2" />
                Clear Saved Credentials
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default BiometricSettings;
