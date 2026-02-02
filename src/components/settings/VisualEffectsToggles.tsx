import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  clearFeatureFlagOverride,
  getFeatureFlagOverride,
  setFeatureFlagOverride,
} from "@/lib/featureFlags";
import { useFeatureFlag } from "@/hooks/useFeatureFlag";
import { useSettings } from "@/contexts/SettingsContext";
import { Sparkles, Waves, Hand, MousePointer2, Droplets, Wallpaper } from "lucide-react";

export function VisualEffectsToggles() {
  const premiumMesh = useFeatureFlag("premium_mesh");
  const premiumParticles = useFeatureFlag("premium_particles");

  const meshOverride = getFeatureFlagOverride("premium_mesh");
  const particlesOverride = getFeatureFlagOverride("premium_particles");

  const hasAnyOverride =
    typeof meshOverride === "boolean" || typeof particlesOverride === "boolean";

  const {
    uiFxEnabled,
    setUiFxEnabled,
    uiFxCardsEnabled,
    setUiFxCardsEnabled,
    uiFxCardTiltEnabled,
    setUiFxCardTiltEnabled,
    uiFxButtonsEnabled,
    setUiFxButtonsEnabled,
    uiFxGlowEnabled,
    setUiFxGlowEnabled,
    uiFxRippleEnabled,
    setUiFxRippleEnabled,
    uiFxWallpaperMotionEnabled,
    setUiFxWallpaperMotionEnabled,
  } = useSettings();

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-base flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          Visual Effects
        </Label>
        <p className="text-sm text-muted-foreground">
          Apply interactive visuals across the entire app (cards, buttons, wallpaper/background, and
          UI).
        </p>
      </div>

      <Card variant="glass">
        <CardContent className="pt-6 space-y-4">
          {/* Global UI Effects */}
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <Label className="text-base">Enable UI effects</Label>
              <p className="text-xs text-muted-foreground">
                Master switch for interactive card/button motion, glows, ripples, and wallpaper
                motion.
              </p>
            </div>
            <Switch
              checked={uiFxEnabled}
              onCheckedChange={setUiFxEnabled}
              aria-label="Toggle global UI effects"
            />
          </div>

          <Separator className="bg-border/50" />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <Label className="text-base flex items-center gap-2">
                  <MousePointer2 className="w-4 h-4" />
                  Interactive cards
                </Label>
                <p className="text-xs text-muted-foreground">Hover/touch lift + glow on cards.</p>
              </div>
              <Switch
                checked={uiFxCardsEnabled}
                onCheckedChange={setUiFxCardsEnabled}
                aria-label="Toggle interactive cards"
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <Label className="text-base flex items-center gap-2">
                  <Hand className="w-4 h-4" />
                  Card tilt (3D)
                </Label>
                <p className="text-xs text-muted-foreground">
                  Subtle 3D tilt that follows cursor or touch while pressing.
                </p>
              </div>
              <Switch
                checked={uiFxCardTiltEnabled}
                onCheckedChange={setUiFxCardTiltEnabled}
                aria-label="Toggle card tilt"
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <Label className="text-base">Interactive buttons</Label>
                <p className="text-xs text-muted-foreground">Hover/press lift + accent glow.</p>
              </div>
              <Switch
                checked={uiFxButtonsEnabled}
                onCheckedChange={setUiFxButtonsEnabled}
                aria-label="Toggle interactive buttons"
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <Label className="text-base flex items-center gap-2">
                  <Droplets className="w-4 h-4" />
                  Ripple taps/clicks
                </Label>
                <p className="text-xs text-muted-foreground">Disable for battery/performance.</p>
              </div>
              <Switch
                checked={uiFxRippleEnabled}
                onCheckedChange={setUiFxRippleEnabled}
                aria-label="Toggle ripple effects"
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <Label className="text-base">Glows</Label>
                <p className="text-xs text-muted-foreground">Cursor-follow highlights on UI.</p>
              </div>
              <Switch
                checked={uiFxGlowEnabled}
                onCheckedChange={setUiFxGlowEnabled}
                aria-label="Toggle glow effects"
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <Label className="text-base flex items-center gap-2">
                  <Wallpaper className="w-4 h-4" />
                  Wallpaper motion
                </Label>
                <p className="text-xs text-muted-foreground">
                  Controls animated wallpapers and background motion.
                </p>
              </div>
              <Switch
                checked={uiFxWallpaperMotionEnabled}
                onCheckedChange={setUiFxWallpaperMotionEnabled}
                aria-label="Toggle wallpaper motion"
              />
            </div>
          </div>

          <Separator className="bg-border/50" />

          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <Label className="text-base">Mesh gradients</Label>
              <p className="text-xs text-muted-foreground">
                Animated background blobs on key sections.
              </p>
              {typeof meshOverride === "boolean" && (
                <p className="text-[11px] text-muted-foreground mt-1">
                  Override active (build default ignored)
                </p>
              )}
            </div>
            <Switch
              checked={premiumMesh}
              onCheckedChange={v => setFeatureFlagOverride("premium_mesh", v)}
              aria-label="Toggle premium mesh gradients"
            />
          </div>

          <div className="h-px bg-border/50" />

          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <Label className="text-base flex items-center gap-2">
                <Waves className="w-4 h-4" />
                Particle field
              </Label>
              <p className="text-xs text-muted-foreground">
                Subtle interactive particles behind scanner/dashboard.
              </p>
              {typeof particlesOverride === "boolean" && (
                <p className="text-[11px] text-muted-foreground mt-1">
                  Override active (build default ignored)
                </p>
              )}
            </div>
            <Switch
              checked={premiumParticles}
              onCheckedChange={v => setFeatureFlagOverride("premium_particles", v)}
              aria-label="Toggle premium particle background"
            />
          </div>

          {hasAnyOverride && (
            <div className="pt-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  clearFeatureFlagOverride("premium_mesh");
                  clearFeatureFlagOverride("premium_particles");
                }}
              >
                Use build defaults
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
