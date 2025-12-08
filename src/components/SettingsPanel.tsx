/**
 * SFW Version - Settings Panel
 * App store compliant version without NSFW addon settings
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useSettings } from "@/contexts/SettingsContext";
import {
  useFeatureToggles,
  useSubscription,
  getTierBadgeColor,
  SubscriptionTier,
} from "@/hooks/useFeatureAccess";
import { triggerHaptic } from "@/lib/haptics";
import {
  Sun,
  Moon,
  Type,
  Eye,
  Vibrate,
  Bell,
  Clock,
  Shield,
  History,
  ChevronRight,
  Crown,
  Sparkles,
  Lock,
  ToggleLeft,
  Heart,
  Dumbbell,
  Camera,
  Brain,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ThemeGallery } from "@/components/settings/ThemeGallery";
import { WallpaperPicker } from "@/components/settings/WallpaperPicker";
import { themePresets } from "@/design-system";
import { MedicalDisclaimer } from "@/components/MedicalDisclaimer";
import { Separator } from "@/components/ui/separator";
import { NotificationSettings } from "@/components/NotificationSettings";

export const SettingsPanel = () => {
  const {
    theme,
    setTheme,
    themePreset,
    setThemePreset,
    customWallpaper,
    setCustomWallpaper,
    wallpaperBlur,
    setWallpaperBlur,
    wallpaperOpacity,
    setWallpaperOpacity,
    fontSize,
    setFontSize,
    colorBlindMode,
    setColorBlindMode,
    hapticEnabled,
    setHapticEnabled,
    notificationsEnabled,
    setNotificationsEnabled,
    reminderTime,
    setReminderTime,
    reminderDays,
    setReminderDays,
  } = useSettings();

  const { toggles, toggleFeature } = useFeatureToggles();
  const { tier, setTier } = useSubscription();

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const activeWallpaper = customWallpaper ?? themePresets[themePreset].wallpaper.fallback;

  const toggleDay = (day: number) => {
    if (reminderDays.includes(day)) {
      setReminderDays(reminderDays.filter(d => d !== day));
    } else {
      setReminderDays([...reminderDays, day].sort());
    }
    triggerHaptic("selection");
  };

  return (
    <div className="space-y-6">
      {/* Theme Settings */}
      <Card variant="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {theme === "dark" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            Appearance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Theme Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Theme</Label>
              <p className="text-sm text-muted-foreground">Choose light or dark mode</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant={theme === "light" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setTheme("light");
                  triggerHaptic("selection");
                }}
              >
                <Sun className="w-4 h-4 mr-1" />
                Light
              </Button>
              <Button
                variant={theme === "dark" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setTheme("dark");
                  triggerHaptic("selection");
                }}
              >
                <Moon className="w-4 h-4 mr-1" />
                Dark
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-base">Theme Presets</Label>
            <p className="text-sm text-muted-foreground">
              Curated color palettes tailored for different lighting environments.
            </p>
            <ThemeGallery
              currentPreset={themePreset}
              onSelect={preset => {
                setThemePreset(preset);
                triggerHaptic("selection");
              }}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-base">Wallpaper</Label>
            <p className="text-sm text-muted-foreground">
              Select a mesh gradient, upload a custom background, or use videos for live wallpapers.
            </p>
            <WallpaperPicker
              activeWallpaper={activeWallpaper}
              blur={wallpaperBlur}
              opacity={wallpaperOpacity}
              onBlurChange={v => {
                setWallpaperBlur(v);
                triggerHaptic("selection");
              }}
              onOpacityChange={v => {
                setWallpaperOpacity(v);
                triggerHaptic("selection");
              }}
              onChange={value => {
                setCustomWallpaper(value);
                triggerHaptic("selection");
              }}
            />
          </div>

          {/* Font Size */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base flex items-center gap-2">
                <Type className="w-4 h-4" />
                Font Size
              </Label>
              <p className="text-sm text-muted-foreground">Adjust text size</p>
            </div>
            <Select
              value={fontSize}
              onValueChange={value => {
                setFontSize(value as typeof fontSize);
                triggerHaptic("selection");
              }}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">Small</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="large">Large</SelectItem>
                <SelectItem value="xlarge">X-Large</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Accessibility */}
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

      {/* Reminders */}
      <Card variant="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Measurement Reminders
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable Notifications */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Enable Reminders</Label>
              <p className="text-sm text-muted-foreground">Get notified to log measurements</p>
            </div>
            <Switch
              checked={notificationsEnabled}
              onCheckedChange={v => {
                setNotificationsEnabled(v);
                triggerHaptic("selection");
              }}
            />
          </div>

          {notificationsEnabled && (
            <>
              {/* Reminder Time */}
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Reminder Time
                  </Label>
                </div>
                <Input
                  type="time"
                  value={reminderTime}
                  onChange={e => setReminderTime(e.target.value)}
                  className="w-32"
                />
              </div>

              {/* Reminder Days */}
              <div>
                <Label className="text-base mb-3 block">Reminder Days</Label>
                <div className="flex gap-2 flex-wrap">
                  {dayNames.map((day, index) => (
                    <Button
                      key={day}
                      variant={reminderDays.includes(index) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleDay(index)}
                      className="w-12"
                    >
                      {day}
                    </Button>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Privacy & Security */}
      <Card variant="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Privacy & Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Your data is encrypted and stored locally. No cloud sync, no tracking.
          </p>
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={() => {
                window.location.hash = "privacy";
                window.dispatchEvent(new CustomEvent("navigate-tab", { detail: "privacy" }));
              }}
            >
              <span className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Privacy Dashboard
              </span>
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={() => {
                window.location.hash = "activity";
                window.dispatchEvent(new CustomEvent("navigate-tab", { detail: "activity" }));
              }}
            >
              <span className="flex items-center gap-2">
                <History className="w-4 h-4" />
                Activity History
              </span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Subscription Tier */}
      <Card variant="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-yellow-400" />
            Subscription
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Select your subscription tier to unlock premium features.
          </p>
          <div className="grid grid-cols-3 gap-3">
            {(["free", "premium", "pro"] as SubscriptionTier[]).map(t => (
              <Button
                key={t}
                variant={tier === t ? "default" : "outline"}
                className={`flex flex-col h-auto py-3 ${tier === t ? getTierBadgeColor(t) : ""}`}
                onClick={() => {
                  setTier(t);
                  triggerHaptic("selection");
                }}
              >
                {t === "free" && <Lock className="w-5 h-5 mb-1" />}
                {t === "premium" && <Sparkles className="w-5 h-5 mb-1" />}
                {t === "pro" && <Crown className="w-5 h-5 mb-1" />}
                <span className="capitalize font-semibold">{t}</span>
              </Button>
            ))}
          </div>
          <div className="text-xs text-muted-foreground">
            {tier === "free" && "Basic features - Health tracking, Diary, Education"}
            {tier === "premium" && "Unlocks: Progress Photos, Routine Builder, Advanced Features"}
            {tier === "pro" && "All features + AI Assistant, Unlimited Access, Export"}
          </div>
        </CardContent>
      </Card>

      {/* Feature Toggles */}
      <Card variant="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ToggleLeft className="w-5 h-5" />
            Feature Toggles
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Enable or disable specific features. Disabled features won't appear in navigation.
          </p>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-pink-400" />
                <div>
                  <Label className="text-base">Wellness Guide</Label>
                  <p className="text-xs text-muted-foreground">Lifestyle tips and guidance</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  Premium
                </Badge>
                <Switch
                  checked={toggles.positions}
                  onCheckedChange={v => toggleFeature("positions", v)}
                />
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-blue-400" />
                <div>
                  <Label className="text-base">Progress Photos</Label>
                  <p className="text-xs text-muted-foreground">Track progress with photos</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  Premium
                </Badge>
                <Switch
                  checked={toggles.peProgressPhotos}
                  onCheckedChange={v => toggleFeature("peProgressPhotos", v)}
                />
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Dumbbell className="w-4 h-4 text-green-400" />
                <div>
                  <Label className="text-base">Routine Builder</Label>
                  <p className="text-xs text-muted-foreground">Custom workout plans</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  Premium
                </Badge>
                <Switch
                  checked={toggles.peRoutineBuilder}
                  onCheckedChange={v => toggleFeature("peRoutineBuilder", v)}
                />
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-purple-400" />
                <div>
                  <Label className="text-base">AI Assistant</Label>
                  <p className="text-xs text-muted-foreground">AI-powered health insights</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  Pro
                </Badge>
                <Switch
                  checked={toggles.aiAssistant}
                  onCheckedChange={v => toggleFeature("aiAssistant", v)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Push Notifications */}
      <NotificationSettings />

      {/* Medical Disclaimer */}
      <MedicalDisclaimer mode="inline" />
    </div>
  );
};
