/**
 * Admin Settings Panel
 * System-wide settings and feature flags
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Settings,
  Save,
  RotateCcw,
  Globe,
  Shield,
  Bell,
  Palette,
  Zap,
  Users,
  Lock,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  category: string;
}

const featureFlags: FeatureFlag[] = [
  {
    id: "1",
    name: "multi_camera_recording",
    description: "Enable multi-camera video recording",
    enabled: true,
    category: "Features",
  },
  {
    id: "2",
    name: "ai_health_insights",
    description: "AI-powered health analysis and recommendations",
    enabled: true,
    category: "AI",
  },
  {
    id: "3",
    name: "partner_sync",
    description: "Real-time partner data synchronization",
    enabled: true,
    category: "Features",
  },
  {
    id: "4",
    name: "beta_features",
    description: "Show beta features to all users",
    enabled: false,
    category: "Testing",
  },
  {
    id: "5",
    name: "maintenance_mode",
    description: "Enable site-wide maintenance mode",
    enabled: false,
    category: "System",
  },
  {
    id: "6",
    name: "new_onboarding",
    description: "New user onboarding flow",
    enabled: true,
    category: "Testing",
  },
  {
    id: "7",
    name: "premium_trial",
    description: "14-day premium trial for new users",
    enabled: true,
    category: "Features",
  },
  {
    id: "8",
    name: "anonymous_analytics",
    description: "Collect anonymous usage analytics",
    enabled: true,
    category: "Privacy",
  },
];

export function AdminSettingsPanel() {
  const [activeTab, setActiveTab] = useState("general");
  const [flags, setFlags] = useState(featureFlags);
  const [settings, setSettings] = useState({
    siteName: "HealthTracker Pro",
    supportEmail: "support@healthtracker.app",
    maxUploadSize: 50,
    sessionTimeout: 30,
    defaultLanguage: "en",
    requireEmailVerification: true,
    allow2FA: true,
    requireStrongPasswords: true,
    enableRateLimiting: true,
    maxLoginAttempts: 5,
  });

  const toggleFlag = (id: string) => {
    setFlags(prev => prev.map(f => (f.id === id ? { ...f, enabled: !f.enabled } : f)));
    toast.success("Feature flag updated");
  };

  const handleSave = () => {
    toast.success("Settings saved successfully");
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="features">Feature Flags</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <Button variant="outline">
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>

        <TabsContent value="general" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Site Settings
                </CardTitle>
                <CardDescription>Basic site configuration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Site Name</Label>
                  <Input
                    value={settings.siteName}
                    onChange={e => setSettings(prev => ({ ...prev, siteName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Support Email</Label>
                  <Input
                    type="email"
                    value={settings.supportEmail}
                    onChange={e => setSettings(prev => ({ ...prev, supportEmail: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Default Language</Label>
                  <Select
                    value={settings.defaultLanguage}
                    onValueChange={value =>
                      setSettings(prev => ({ ...prev, defaultLanguage: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Performance
                </CardTitle>
                <CardDescription>System performance settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Max Upload Size (MB)</Label>
                    <span className="text-sm text-muted-foreground">
                      {settings.maxUploadSize} MB
                    </span>
                  </div>
                  <Slider
                    value={[settings.maxUploadSize]}
                    onValueChange={([value]) =>
                      setSettings(prev => ({ ...prev, maxUploadSize: value }))
                    }
                    min={10}
                    max={200}
                    step={10}
                  />
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Session Timeout (minutes)</Label>
                    <span className="text-sm text-muted-foreground">
                      {settings.sessionTimeout} min
                    </span>
                  </div>
                  <Slider
                    value={[settings.sessionTimeout]}
                    onValueChange={([value]) =>
                      setSettings(prev => ({ ...prev, sessionTimeout: value }))
                    }
                    min={5}
                    max={120}
                    step={5}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security" className="mt-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
              <CardDescription>Configure authentication and security options</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Require Email Verification</Label>
                      <p className="text-sm text-muted-foreground">
                        Users must verify email before accessing features
                      </p>
                    </div>
                    <Switch
                      checked={settings.requireEmailVerification}
                      onCheckedChange={checked =>
                        setSettings(prev => ({ ...prev, requireEmailVerification: checked }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Allow Two-Factor Auth</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable 2FA option for user accounts
                      </p>
                    </div>
                    <Switch
                      checked={settings.allow2FA}
                      onCheckedChange={checked =>
                        setSettings(prev => ({ ...prev, allow2FA: checked }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Require Strong Passwords</Label>
                      <p className="text-sm text-muted-foreground">
                        Enforce minimum 8 chars with special characters
                      </p>
                    </div>
                    <Switch
                      checked={settings.requireStrongPasswords}
                      onCheckedChange={checked =>
                        setSettings(prev => ({ ...prev, requireStrongPasswords: checked }))
                      }
                    />
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Enable Rate Limiting</Label>
                      <p className="text-sm text-muted-foreground">Limit API requests per user</p>
                    </div>
                    <Switch
                      checked={settings.enableRateLimiting}
                      onCheckedChange={checked =>
                        setSettings(prev => ({ ...prev, enableRateLimiting: checked }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Max Login Attempts</Label>
                    <Input
                      type="number"
                      value={settings.maxLoginAttempts}
                      onChange={e =>
                        setSettings(prev => ({
                          ...prev,
                          maxLoginAttempts: parseInt(e.target.value) || 5,
                        }))
                      }
                      min={3}
                      max={10}
                    />
                    <p className="text-xs text-muted-foreground">
                      Lock account after this many failed attempts
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="mt-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Feature Flags
              </CardTitle>
              <CardDescription>Enable or disable features across the application</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-4">
                  {["Features", "AI", "Testing", "System", "Privacy"].map(category => {
                    const categoryFlags = flags.filter(f => f.category === category);
                    if (categoryFlags.length === 0) return null;
                    return (
                      <div key={category}>
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                          <Badge variant="outline">{category}</Badge>
                        </h3>
                        <div className="space-y-3">
                          {categoryFlags.map(flag => (
                            <div
                              key={flag.id}
                              className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                            >
                              <div>
                                <p className="font-medium font-mono text-sm">{flag.name}</p>
                                <p className="text-sm text-muted-foreground">{flag.description}</p>
                              </div>
                              <Switch
                                checked={flag.enabled}
                                onCheckedChange={() => toggleFlag(flag.id)}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { name: "Stripe", desc: "Payment processing", connected: true, icon: "💳" },
              { name: "SendGrid", desc: "Email delivery", connected: true, icon: "📧" },
              { name: "Google Analytics", desc: "Usage analytics", connected: true, icon: "📊" },
              { name: "Sentry", desc: "Error monitoring", connected: true, icon: "🐛" },
              { name: "AWS S3", desc: "File storage", connected: true, icon: "☁️" },
              { name: "Twilio", desc: "SMS notifications", connected: false, icon: "📱" },
            ].map(integration => (
              <Card key={integration.name} className="glass-card">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{integration.icon}</span>
                      <div>
                        <p className="font-semibold">{integration.name}</p>
                        <p className="text-sm text-muted-foreground">{integration.desc}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={integration.connected ? "default" : "secondary"}>
                        {integration.connected ? "Connected" : "Disconnected"}
                      </Badge>
                      <Button variant="outline" size="sm">
                        {integration.connected ? "Configure" : "Connect"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
