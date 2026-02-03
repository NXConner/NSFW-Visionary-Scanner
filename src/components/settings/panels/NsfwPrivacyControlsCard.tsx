import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Shield, EyeOff, Lock, Image as ImageIcon, Fingerprint, AlertTriangle } from "lucide-react";
import { useNsfwPrivacySettings } from "@/lib/nsfwPrivacySettings";
import { clearNsfwSessionUnlocked, triggerNsfwPanicExit } from "@/lib/nsfwSessionLock";

export function NsfwPrivacyControlsCard(): JSX.Element {
  const { settings, setSettings } = useNsfwPrivacySettings();

  const summary = useMemo(() => {
    const bits: string[] = [];
    if (settings.incognitoMode) bits.push("Incognito");
    if (settings.sessionLockEnabled) bits.push(`Session lock ${settings.sessionLockMinutes}m`);
    if (settings.blurThumbnails) bits.push("Blur thumbs");
    if (settings.hideTitles) bits.push("Hide titles");
    if (settings.privacyTier) bits.push(`Privacy: ${settings.privacyTier}`);
    if (settings.panicLockEnabled) bits.push("Panic lock ready");
    return bits.length ? bits.join(" • ") : "Off";
  }, [
    settings.blurThumbnails,
    settings.hideTitles,
    settings.incognitoMode,
    settings.sessionLockEnabled,
    settings.sessionLockMinutes,
    settings.privacyTier,
    settings.panicLockEnabled,
  ]);

  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            NSFW Privacy Controls
          </span>
          <Badge variant="secondary">{summary}</Badge>
        </CardTitle>
        <CardDescription>
          Controls for adult-only areas: incognito browsing, thumbnail redaction, and session lock.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="font-medium flex items-center gap-2">
              <EyeOff className="w-4 h-4 text-muted-foreground" />
              Incognito mode
            </div>
            <div className="text-xs text-muted-foreground">
              Hides certain labels/titles and minimizes on-screen NSFW identifiers.
            </div>
          </div>
          <Switch
            checked={settings.incognitoMode}
            onCheckedChange={v => setSettings(prev => ({ ...prev, incognitoMode: v }))}
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="font-medium flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-muted-foreground" />
              Blur thumbnails
            </div>
            <div className="text-xs text-muted-foreground">
              Blurs NSFW thumbnails until you tap Play (recommended).
            </div>
          </div>
          <Switch
            checked={settings.blurThumbnails}
            onCheckedChange={v => setSettings(prev => ({ ...prev, blurThumbnails: v }))}
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="font-medium flex items-center gap-2">
              <EyeOff className="w-4 h-4 text-muted-foreground" />
              Hide titles
            </div>
            <div className="text-xs text-muted-foreground">
              Replaces titles with generic labels (extra discretion).
            </div>
          </div>
          <Switch
            checked={settings.hideTitles}
            onCheckedChange={v => setSettings(prev => ({ ...prev, hideTitles: v }))}
          />
        </div>

        <div className="pt-2 border-t border-border/50 space-y-3">
          <div>
            <div className="font-medium flex items-center gap-2">
              <Shield className="w-4 h-4 text-muted-foreground" />
              Privacy tier
            </div>
            <div className="text-xs text-muted-foreground">
              Controls default sharing behavior in NSFW community and partner features.
            </div>
          </div>
          <Select
            value={settings.privacyTier}
            onValueChange={value =>
              setSettings(prev => ({ ...prev, privacyTier: value as typeof settings.privacyTier }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select privacy tier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="private">Private (you only)</SelectItem>
              <SelectItem value="partner">Partner only</SelectItem>
              <SelectItem value="trusted">Trusted group</SelectItem>
              <SelectItem value="public">Public (anonymous)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="pt-2 border-t border-border/50 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-muted-foreground" />
                Panic lock
              </div>
              <div className="text-xs text-muted-foreground">
                Quick emergency lock for all NSFW areas (locks immediately).
              </div>
            </div>
            <Switch
              checked={settings.panicLockEnabled}
              onCheckedChange={v => setSettings(prev => ({ ...prev, panicLockEnabled: v }))}
            />
          </div>
          {settings.panicLockEnabled ? (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => {
                triggerNsfwPanicExit({ reason: "Panic lock engaged from privacy controls" });
                toast.success("Session locked");
              }}
            >
              Lock NSFW Now
            </Button>
          ) : null}
        </div>

        <div className="pt-2 border-t border-border/50 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="font-medium flex items-center gap-2">
                <Lock className="w-4 h-4 text-muted-foreground" />
                NSFW session lock
              </div>
              <div className="text-xs text-muted-foreground">
                Requires App Lock (PIN) or Biometric. Locks adult areas after inactivity.
              </div>
            </div>
            <Switch
              checked={settings.sessionLockEnabled}
              onCheckedChange={v => setSettings(prev => ({ ...prev, sessionLockEnabled: v }))}
            />
          </div>

          {settings.sessionLockEnabled ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium flex items-center gap-2">
                    <Fingerprint className="w-4 h-4 text-muted-foreground" />
                    Require biometric if available
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    If biometrics are available on this device, require biometric unlock for NSFW
                    areas (PIN fallback only when biometrics aren’t available).
                  </div>
                </div>
                <Switch
                  checked={settings.requireBiometricIfAvailable}
                  onCheckedChange={v =>
                    setSettings(prev => ({ ...prev, requireBiometricIfAvailable: v }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Auto-lock after</div>
                <Badge variant="outline">{settings.sessionLockMinutes} min</Badge>
              </div>
              <Slider
                value={[settings.sessionLockMinutes]}
                min={1}
                max={120}
                step={1}
                onValueChange={v =>
                  setSettings(prev => ({
                    ...prev,
                    sessionLockMinutes: v[0] ?? prev.sessionLockMinutes,
                  }))
                }
              />
              <div className="text-[10px] text-muted-foreground">
                Tip: enabling global App Lock + NSFW session lock gives the best protection.
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  clearNsfwSessionUnlocked();
                  toast.success("NSFW session locked");
                }}
              >
                Lock now
              </Button>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
