import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useSettings } from "@/contexts/SettingsContext";
import { triggerHaptic } from "@/lib/haptics";
import { Eye, Vibrate } from "lucide-react";

export function AccessibilitySettingsCard() {
  const { colorBlindMode, setColorBlindMode, hapticEnabled, setHapticEnabled } = useSettings();

  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="w-5 h-5" />
          Accessibility
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Color Blind Mode */}
        <div className="space-y-3">
          <div>
            <Label className="text-base">Color Blind Mode</Label>
            <p className="text-sm text-muted-foreground">
              Optimize colors for color vision deficiency
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: "none", label: "None", desc: "Default colors" },
              { value: "protanopia", label: "Protanopia", desc: "Red-blind" },
              { value: "deuteranopia", label: "Deuteranopia", desc: "Green-blind" },
              { value: "tritanopia", label: "Tritanopia", desc: "Blue-blind" },
            ].map(mode => (
              <Button
                key={mode.value}
                variant={colorBlindMode === mode.value ? "default" : "outline"}
                className="h-auto py-2 flex flex-col items-start"
                onClick={() => {
                  setColorBlindMode(mode.value as typeof colorBlindMode);
                  triggerHaptic("selection");
                }}
              >
                <span className="font-medium">{mode.label}</span>
                <span className="text-xs opacity-70">{mode.desc}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Haptic Feedback */}
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-base flex items-center gap-2">
              <Vibrate className="w-4 h-4" />
              Haptic Feedback
            </Label>
            <p className="text-sm text-muted-foreground">Vibration on interactions</p>
          </div>
          <Switch
            checked={hapticEnabled}
            onCheckedChange={v => {
              setHapticEnabled(v);
              if (v) triggerHaptic("success");
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
