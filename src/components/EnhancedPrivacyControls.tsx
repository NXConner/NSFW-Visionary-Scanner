/**
 * Enhanced Privacy Controls Component
 * Advanced privacy settings including content locking, hidden mode, and privacy dashboard
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Lock,
  Eye,
  EyeOff,
  Shield,
  Fingerprint,
  Key,
  Database,
  BarChart3,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import {
  getPrivacySettings,
  updatePrivacySettings,
  lockContent,
  unlockContent,
  enableHiddenMode,
  disableHiddenMode,
  enablePrivateBrowsing,
  enableIncognitoMode,
  getPrivacyDashboardData,
  type PrivacySettings,
} from "@/lib/enhancedPrivacy";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type PrivacyDashboardData = Awaited<ReturnType<typeof getPrivacyDashboardData>>;

export const EnhancedPrivacyControls = () => {
  const [settings, setSettings] = useState<PrivacySettings | null>(null);
  const [dashboardData, setDashboardData] = useState<PrivacyDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const [settingsData, dashboard] = await Promise.all([
      getPrivacySettings(),
      getPrivacyDashboardData(),
    ]);
    setSettings(settingsData);
    setDashboardData(dashboard);
    setIsLoading(false);
  };

  const handleToggle = async <K extends keyof PrivacySettings>(
    key: K,
    value: PrivacySettings[K],
  ) => {
    setIsSaving(true);
    const success = await updatePrivacySettings({ [key]: value });
    if (success) {
      setSettings(prev => (prev ? { ...prev, [key]: value } : null));
    }
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!settings) {
    return (
      <Card className="glass-card">
        <CardContent className="text-center py-12">
          <p className="text-muted-foreground">Failed to load privacy settings</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="app-lock" className="space-y-4">
        <TabsList>
          <TabsTrigger value="app-lock">App Lock</TabsTrigger>
          <TabsTrigger value="content-lock">Content Lock</TabsTrigger>
          <TabsTrigger value="privacy-modes">Privacy Modes</TabsTrigger>
          <TabsTrigger value="dashboard">Privacy Dashboard</TabsTrigger>
        </TabsList>

        <TabsContent value="app-lock" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                App Lock Settings
              </CardTitle>
              <CardDescription>Secure your app with PIN, biometric, or both</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable App Lock</Label>
                  <p className="text-sm text-muted-foreground">
                    Require authentication to open the app
                  </p>
                </div>
                <Switch
                  checked={settings.app_lock_enabled}
                  onCheckedChange={checked => handleToggle("app_lock_enabled", checked)}
                  disabled={isSaving}
                />
              </div>

              {settings.app_lock_enabled && (
                <div className="space-y-2 pl-4 border-l-2 border-primary/20">
                  <Label>Lock Method</Label>
                  <Select
                    value={settings.app_lock_method}
                    onValueChange={value =>
                      handleToggle("app_lock_method", value as "pin" | "biometric" | "both")
                    }
                    disabled={isSaving}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="biometric">
                        <div className="flex items-center gap-2">
                          <Fingerprint className="w-4 h-4" />
                          Biometric Only
                        </div>
                      </SelectItem>
                      <SelectItem value="pin">
                        <div className="flex items-center gap-2">
                          <Key className="w-4 h-4" />
                          PIN Only
                        </div>
                      </SelectItem>
                      <SelectItem value="both">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4" />
                          Both (Biometric + PIN)
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content-lock" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Content Locking
              </CardTitle>
              <CardDescription>
                Lock specific content that requires additional authentication
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Content Lock</Label>
                  <p className="text-sm text-muted-foreground">
                    Lock sensitive content with additional authentication
                  </p>
                </div>
                <Switch
                  checked={settings.content_lock_enabled}
                  onCheckedChange={checked => handleToggle("content_lock_enabled", checked)}
                  disabled={isSaving}
                />
              </div>

              {settings.content_lock_enabled && (
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground">
                    {settings.locked_content_ids?.length || 0} content items locked
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Lock content from individual features (scans, photos, diary entries, etc.)
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy-modes" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <EyeOff className="w-5 h-5" />
                Privacy Modes
              </CardTitle>
              <CardDescription>Advanced privacy options for maximum protection</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Hidden Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Hide the app completely from device
                  </p>
                </div>
                <Switch
                  checked={settings.hidden_mode_enabled}
                  onCheckedChange={checked => (checked ? enableHiddenMode() : disableHiddenMode())}
                  disabled={isSaving}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Private Browsing</Label>
                  <p className="text-sm text-muted-foreground">Don't save browsing history</p>
                </div>
                <Switch
                  checked={settings.private_browsing_enabled}
                  onCheckedChange={checked => handleToggle("private_browsing_enabled", checked)}
                  disabled={isSaving}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Incognito Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    No history tracking, completely anonymous
                  </p>
                </div>
                <Switch
                  checked={settings.incognito_mode_enabled}
                  onCheckedChange={checked => handleToggle("incognito_mode_enabled", checked)}
                  disabled={isSaving}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Data Anonymization</Label>
                  <p className="text-sm text-muted-foreground">Anonymize your data for analytics</p>
                </div>
                <Switch
                  checked={settings.data_anonymization_enabled}
                  onCheckedChange={checked => handleToggle("data_anonymization_enabled", checked)}
                  disabled={isSaving}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dashboard" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Privacy Dashboard
              </CardTitle>
              <CardDescription>View your privacy data and settings</CardDescription>
            </CardHeader>
            <CardContent>
              {dashboardData && (
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-primary/10">
                    <div className="text-2xl font-bold text-primary">
                      {dashboardData.privacy_score}/100
                    </div>
                    <div className="text-sm text-muted-foreground">Privacy Score</div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Data Collected</h3>
                    {dashboardData.data_collected.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No data collection tracked</p>
                    ) : (
                      <div className="space-y-2">
                        {dashboardData.data_collected.map(item => (
                          <div key={item.type} className="flex justify-between text-sm">
                            <span>{item.type}</span>
                            <span className="text-muted-foreground">{item.amount} items</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Data Retention</h3>
                    <p className="text-sm text-muted-foreground">
                      Policy: {dashboardData.data_retention.policy}
                    </p>
                    {dashboardData.data_retention.expiration && (
                      <p className="text-sm text-muted-foreground">
                        Expires:{" "}
                        {new Date(dashboardData.data_retention.expiration).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
