import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  clearContentPolicyOverride,
  getContentPolicyOverride,
  isAdultContentEnabled,
  isDirectVersion,
  isLovableHost,
  isLovablePolicyBuild,
  setContentPolicyOverride,
  type ContentPolicy,
} from "@/lib/featureFlags";

export function ContentPolicyOverrideCard(): JSX.Element | null {
  const { isSuperAdmin } = useAuth();

  // Only allow this override in direct builds on non-Lovable hosts.
  // Store builds and Lovable-hosted builds are hard-forced to safe mode by `isLovablePolicyBuild()`.
  const canOverride = Boolean(isSuperAdmin && isDirectVersion() && !isLovableHost());
  const initial = useMemo<ContentPolicy | "none">(() => getContentPolicyOverride() ?? "none", []);
  const [value, setValue] = useState<ContentPolicy | "none">(initial);

  const effectiveMode = isLovablePolicyBuild() ? "lovable" : "direct";
  const adultEnabled = isAdultContentEnabled();

  const apply = (next: ContentPolicy | "none") => {
    if (next === "none") clearContentPolicyOverride();
    else setContentPolicyOverride(next);
    // This affects routing/gating at module load; reload is the safest way.
    window.location.reload();
  };

  if (!canOverride) return null;

  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Content Policy (Super Admin)
          </span>
          <Badge variant="outline" className={effectiveMode === "lovable" ? "text-warning" : ""}>
            Effective: {effectiveMode === "lovable" ? "Safe" : "Direct"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          Toggle the app’s local policy mode for this device/browser. This only affects the UI
          gating; server-side features still require direct-deployment secrets (e.g.
          <code className="mx-1">CONTENT_POLICY=direct</code>).
        </div>

        <div className="rounded-xl border border-warning/30 bg-warning/10 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-warning mt-0.5" />
            <div className="space-y-1">
              <div className="font-semibold">Do not use for store submissions</div>
              <div className="text-sm text-muted-foreground">
                Store builds and Lovable-hosted builds are hard-forced to Safe mode. This card is
                intentionally hidden there.
              </div>
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <Label className="text-base">Override</Label>
          <RadioGroup
            value={value}
            onValueChange={v => setValue((v as ContentPolicy) || "none")}
            className="gap-3"
          >
            <div className="flex items-center gap-3 rounded-lg border border-border/60 p-3">
              <RadioGroupItem id="cp-none" value="none" />
              <Label htmlFor="cp-none" className="cursor-pointer">
                Default (auto-detect)
                <div className="text-xs text-muted-foreground">
                  Uses env + host. Non-store/non-Lovable defaults to Direct.
                </div>
              </Label>
            </div>

            <div className="flex items-center gap-3 rounded-lg border border-border/60 p-3">
              <RadioGroupItem id="cp-safe" value="lovable" />
              <Label htmlFor="cp-safe" className="cursor-pointer">
                Safe mode
                <div className="text-xs text-muted-foreground">
                  Hides NSFW routes/features and disables risky AI surfaces.
                </div>
              </Label>
            </div>

            <div className="flex items-center gap-3 rounded-lg border border-border/60 p-3">
              <RadioGroupItem id="cp-direct" value="direct" />
              <Label htmlFor="cp-direct" className="cursor-pointer">
                Direct mode
                <div className="text-xs text-muted-foreground">
                  Enables adult surfaces for hybrid/NSFW builds (still requires entitlements and
                  server enablement).
                </div>
              </Label>
            </div>
          </RadioGroup>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            className="flex-1"
            onClick={() => apply(value)}
            disabled={value === initial}
            title={value === initial ? "No changes to apply" : "Apply and reload"}
          >
            Apply (reload)
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => apply("none")}
            disabled={value === "none" && initial === "none"}
          >
            Reset to default
          </Button>
        </div>

        <div className="text-xs text-muted-foreground">
          Current: adult surfaces {adultEnabled ? "enabled" : "disabled"}.
        </div>
      </CardContent>
    </Card>
  );
}
