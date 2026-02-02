import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lock, Shield, Activity } from "lucide-react";
import { AgeVerificationModal } from "@/dlc/components/AgeVerificationModal";
import { useNsfwScannerAddon } from "../hooks/useNsfwScannerAddon";
import { DEFAULT_NSFW_SCANNER_POLICY, type NsfwScannerPolicy } from "../scanner/types";
import { runNsfwModelSelfTest, type NsfwModelSelfTestResult } from "../scanner/nsfwDetection";

export function NsfwScannerSettingsCard(): JSX.Element {
  const { isUnlocked, isAgeVerified, hasEntitlement, isLoading, policy, setPolicy } =
    useNsfwScannerAddon();
  const [showAgeModal, setShowAgeModal] = useState(false);
  const [selfTest, setSelfTest] = useState<NsfwModelSelfTestResult | null>(null);
  const [selfTestLoading, setSelfTestLoading] = useState(false);

  const disabledReason = useMemo(() => {
    if (isLoading) return "Loading entitlement…";
    if (!hasEntitlement) return "Requires NSFW Scanner DLC";
    if (!isAgeVerified) return "Requires age verification";
    return null;
  }, [hasEntitlement, isAgeVerified, isLoading]);

  const set = (patch: Partial<NsfwScannerPolicy>) => setPolicy({ ...policy, ...patch });

  return (
    <Card className="glass-card border-border/50">
      <AgeVerificationModal
        isOpen={showAgeModal}
        onClose={() => setShowAgeModal(false)}
        onVerified={() => {
          setShowAgeModal(false);
        }}
      />
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-3">
          <span>NSFW Scanner DLC</span>
          {isUnlocked ? (
            <Badge className="bg-pink-500 text-black">Unlocked</Badge>
          ) : (
            <Badge variant="secondary" className="gap-1">
              <Lock className="w-3 h-3" /> Locked
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Adult-only scanning mode with on-device explicit-content detection controls. Disabled by
          default for safety and store compliance.
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
          </div>
        )}

        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="font-medium">Enable NSFW scanning mode</div>
            <div className="text-xs text-muted-foreground">
              When enabled, the scanner runs an on-device model after capture and applies your
              policy.
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
            <div className="font-medium">Run detection on-device</div>
            <div className="text-xs text-muted-foreground">
              Uses TensorFlow.js locally. No image is uploaded for classification.
            </div>
          </div>
          <Switch
            checked={policy.enableOnDeviceDetection}
            disabled={!isUnlocked || !policy.enabled}
            onCheckedChange={v => set({ enableOnDeviceDetection: v })}
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="font-medium">Store classification metadata</div>
            <div className="text-xs text-muted-foreground">
              If enabled, saves only label/confidence with your scan (never the image itself for
              this setting). Off by default for privacy.
            </div>
          </div>
          <Switch
            checked={policy.storeClassificationMetadata}
            disabled={!isUnlocked || !policy.enabled}
            onCheckedChange={v => set({ storeClassificationMetadata: v })}
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="font-medium">Allow explicit saves</div>
            <div className="text-xs text-muted-foreground">
              If disabled, scans detected as explicit will be blocked from saving.
            </div>
          </div>
          <Switch
            checked={policy.allowExplicit}
            disabled={!isUnlocked || !policy.enabled}
            onCheckedChange={v => set({ allowExplicit: v })}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Explicit threshold</div>
              <div className="text-xs text-muted-foreground">
                Higher = fewer “explicit” detections.
              </div>
            </div>
            <Badge variant="outline">{policy.explicitThreshold.toFixed(2)}</Badge>
          </div>
          <Slider
            value={[policy.explicitThreshold]}
            min={0.5}
            max={0.99}
            step={0.01}
            disabled={!isUnlocked || !policy.enabled}
            onValueChange={v =>
              set({ explicitThreshold: v[0] ?? DEFAULT_NSFW_SCANNER_POLICY.explicitThreshold })
            }
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Suggestive threshold</div>
              <div className="text-xs text-muted-foreground">
                Higher = fewer “suggestive” detections.
              </div>
            </div>
            <Badge variant="outline">{policy.suggestiveThreshold.toFixed(2)}</Badge>
          </div>
          <Slider
            value={[policy.suggestiveThreshold]}
            min={0.5}
            max={0.99}
            step={0.01}
            disabled={!isUnlocked || !policy.enabled}
            onValueChange={v =>
              set({ suggestiveThreshold: v[0] ?? DEFAULT_NSFW_SCANNER_POLICY.suggestiveThreshold })
            }
          />
        </div>

        <Button
          variant="outline"
          disabled={!isUnlocked}
          onClick={() => setPolicy(DEFAULT_NSFW_SCANNER_POLICY)}
        >
          Reset to defaults
        </Button>

        <div className="pt-2 border-t border-border/50 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="font-medium">Model self-test</div>
              <div className="text-xs text-muted-foreground">
                Runs a quick on-device load + inference check to confirm the NSFW model works in
                this build. Uses a 1×1 pixel test image.
              </div>
            </div>
            <Button
              variant="outline"
              disabled={
                !isUnlocked || selfTestLoading || !policy.enabled || !policy.enableOnDeviceDetection
              }
              onClick={() => {
                setSelfTestLoading(true);
                void runNsfwModelSelfTest()
                  .then(r => setSelfTest(r))
                  .finally(() => setSelfTestLoading(false));
              }}
              className="gap-2"
            >
              <Activity className="w-4 h-4" />
              {selfTestLoading ? "Testing…" : "Run test"}
            </Button>
          </div>

          {selfTest ? (
            <div className="rounded-xl border border-border/60 bg-secondary/20 p-4 space-y-1">
              <div className="text-sm font-medium">
                {selfTest.ok ? "Model OK" : "Model unavailable"}
              </div>
              <div className="text-xs text-muted-foreground">
                Source: {selfTest.source}
                {selfTest.modelUrl ? ` • ${selfTest.modelUrl}` : ""}
              </div>
              {selfTest.ok ? (
                <div className="text-xs text-muted-foreground">
                  Load: {Math.round(selfTest.loadMs ?? 0)}ms • Inference:{" "}
                  {Math.round(selfTest.inferenceMs ?? 0)}ms • Result: {selfTest.label} (
                  {Math.round((selfTest.confidence ?? 0) * 100)}%)
                </div>
              ) : (
                <div className="text-xs text-muted-foreground">
                  {selfTest.error ?? "Unknown error"}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
