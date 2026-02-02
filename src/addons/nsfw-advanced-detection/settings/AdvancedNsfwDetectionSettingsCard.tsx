import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lock, Sparkles, Shield } from "lucide-react";
import { AgeVerificationModal } from "@/dlc/components/AgeVerificationModal";
import { useAdvancedNsfwDetectionAddon } from "../hooks/useAdvancedNsfwDetectionAddon";
import { DEFAULT_ADVANCED_NSFW_DETECTION_POLICY, type AdvancedNsfwDetectionPolicy } from "../types";

export function AdvancedNsfwDetectionSettingsCard(): JSX.Element {
  const { isUnlocked, isAgeVerified, hasEntitlement, isLoading, policy, setPolicy } =
    useAdvancedNsfwDetectionAddon();
  const [showAgeModal, setShowAgeModal] = useState(false);

  const disabledReason = useMemo(() => {
    if (isLoading) return "Loading entitlement…";
    if (!hasEntitlement) return "Requires Advanced NSFW Detection DLC";
    if (!isAgeVerified) return "Requires age verification";
    return null;
  }, [hasEntitlement, isAgeVerified, isLoading]);

  const set = (patch: Partial<AdvancedNsfwDetectionPolicy>) => setPolicy({ ...policy, ...patch });

  return (
    <Card className="glass-card border-border/50">
      <AgeVerificationModal
        isOpen={showAgeModal}
        onClose={() => setShowAgeModal(false)}
        onVerified={() => setShowAgeModal(false)}
      />
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-3">
          <span>Advanced NSFW Detection</span>
          {isUnlocked ? (
            <Badge className="bg-purple-500 text-black">Unlocked</Badge>
          ) : (
            <Badge variant="secondary" className="gap-1">
              <Lock className="w-3 h-3" /> Locked
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Advanced detection modes for the scanner: richer breakdowns and optional detection history
          logging (no image content stored).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {!isUnlocked && (
          <div className="rounded-xl border border-border/60 bg-secondary/20 p-4 space-y-3">
            <div className="text-sm text-muted-foreground">{disabledReason}</div>
            {!isAgeVerified ? (
              <Button onClick={() => setShowAgeModal(true)} className="gap-2">
                <Shield className="w-4 h-4" />
                Verify Age
              </Button>
            ) : null}
            {!hasEntitlement ? (
              <Button
                variant="outline"
                onClick={() => {
                  window.location.assign("/store?package=dlc-advanced-nsfw-detection");
                }}
              >
                View in DLC Store
              </Button>
            ) : null}
          </div>
        )}

        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="font-medium">Enable advanced detection</div>
            <div className="text-xs text-muted-foreground">
              Turns on advanced behavior for NSFW detection when available.
            </div>
          </div>
          <Switch
            checked={policy.enabled}
            disabled={!isUnlocked}
            onCheckedChange={v => set({ enabled: v })}
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="font-medium">Show detailed breakdown</div>
            <div className="text-xs text-muted-foreground">
              Enables more verbose breakdown in UI and logs.
            </div>
          </div>
          <Switch
            checked={policy.showDetailedBreakdown}
            disabled={!isUnlocked || !policy.enabled}
            onCheckedChange={v => set({ showDetailedBreakdown: v })}
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="font-medium">Comparison mode</div>
            <div className="text-xs text-muted-foreground">
              Allows comparing multiple model outputs (additional models require configuration).
            </div>
          </div>
          <Switch
            checked={policy.enableComparisonMode}
            disabled={!isUnlocked || !policy.enabled}
            onCheckedChange={v => set({ enableComparisonMode: v })}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Confidence threshold</div>
              <div className="text-xs text-muted-foreground">
                Used for “high confidence” labeling and filtering.
              </div>
            </div>
            <Badge variant="outline">{Math.round(policy.confidenceThreshold * 100)}%</Badge>
          </div>
          <Slider
            value={[policy.confidenceThreshold]}
            min={0}
            max={1}
            step={0.01}
            disabled={!isUnlocked || !policy.enabled}
            onValueChange={v =>
              set({
                confidenceThreshold:
                  v[0] ?? DEFAULT_ADVANCED_NSFW_DETECTION_POLICY.confidenceThreshold,
              })
            }
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="font-medium">Store detection history (opt-in)</div>
            <div className="text-xs text-muted-foreground">
              Saves only detection metadata (label/confidence/raw category scores) to your account.
              No image data is stored by this feature.
            </div>
          </div>
          <Switch
            checked={policy.storeDetectionHistory}
            disabled={!isUnlocked || !policy.enabled}
            onCheckedChange={v => set({ storeDetectionHistory: v })}
          />
        </div>

        <div className="rounded-xl border border-border/60 bg-secondary/20 p-4 text-xs text-muted-foreground">
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 mt-0.5 text-purple-400" />
            <div className="space-y-1">
              <div className="font-medium text-foreground">What this unlocks</div>
              <div>- Advanced detection policy controls</div>
              <div>- Optional detection history records for diagnostics</div>
              <div>- Comparison-ready architecture for multi-model support</div>
            </div>
          </div>
        </div>

        <Button
          variant="outline"
          disabled={!isUnlocked}
          onClick={() => setPolicy(DEFAULT_ADVANCED_NSFW_DETECTION_POLICY)}
        >
          Reset to defaults
        </Button>
      </CardContent>
    </Card>
  );
}
