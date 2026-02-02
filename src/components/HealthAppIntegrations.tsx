/**
 * Health App Integrations
 * UI component for connecting and managing health app integrations (Apple Health, Google Fit, Fitbit, etc.)
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  getHealthAppIntegrations,
  connectHealthApp,
  syncHealthAppData,
  disconnectHealthApp,
  type HealthAppIntegration,
} from "@/lib/healthAppIntegrations";
import {
  Activity,
  Apple,
  Smartphone,
  Heart,
  Moon,
  UtensilsCrossed,
  Loader2,
  RefreshCw,
  X,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

const healthApps: Array<{
  type: HealthAppIntegration["integration_type"];
  name: string;
  icon: typeof Apple;
  color: string;
}> = [
  { type: "apple_health", name: "Apple Health", icon: Apple, color: "text-red-500" },
  { type: "google_fit", name: "Google Fit", icon: Smartphone, color: "text-blue-500" },
  { type: "fitbit", name: "Fitbit", icon: Heart, color: "text-green-500" },
  { type: "myfitnesspal", name: "MyFitnessPal", icon: UtensilsCrossed, color: "text-orange-500" },
  {
    type: "nutrition_app",
    name: "Nutrition Apps",
    icon: UtensilsCrossed,
    color: "text-yellow-500",
  },
  { type: "sleep_app", name: "Sleep Apps", icon: Moon, color: "text-purple-500" },
];

export const HealthAppIntegrations = () => {
  const [loading, setLoading] = useState(false);
  const [integrations, setIntegrations] = useState<HealthAppIntegration[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getHealthAppIntegrations();
      setIntegrations(data);
    } catch (error) {
      toast.error("Failed to load integrations");
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (
    appType: HealthAppIntegration["integration_type"],
    appName: string,
  ) => {
    try {
      const integration = await connectHealthApp(appType, appName, [
        "steps",
        "heart_rate",
        "sleep",
      ]);
      if (integration) {
        await loadData();
      }
    } catch (error) {
      toast.error("Failed to connect app");
    }
  };

  const handleSync = async (integrationId: string) => {
    try {
      const success = await syncHealthAppData(integrationId);
      if (success) {
        await loadData();
      }
    } catch (error) {
      toast.error("Failed to sync data");
    }
  };

  const handleDisconnect = async (integrationId: string) => {
    try {
      const success = await disconnectHealthApp(integrationId);
      if (success) {
        await loadData();
      }
    } catch (error) {
      toast.error("Failed to disconnect");
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Card className="glass-card border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Loader2 className="w-12 h-12 text-muted-foreground animate-spin mb-4" />
            <p className="text-muted-foreground">Loading health app integrations...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <Card className="glass-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-6 h-6" />
            Health App Integrations
          </CardTitle>
          <CardDescription>
            Connect your health and fitness apps to sync data automatically
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {healthApps.map(app => {
              const Icon = app.icon;
              const integration = integrations.find(i => i.integration_type === app.type);
              const isConnected = integration?.is_connected || false;

              return (
                <Card key={app.type} className="glass-card border-border/50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className={`w-5 h-5 ${app.color}`} />
                        <CardTitle className="text-lg">{app.name}</CardTitle>
                      </div>
                      {isConnected && (
                        <Badge variant="default">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Connected
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isConnected && integration && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Auto Sync</span>
                          <Switch checked={integration.auto_sync_enabled} disabled />
                        </div>
                        {integration.last_sync_at && (
                          <p className="text-xs text-muted-foreground">
                            Last sync: {new Date(integration.last_sync_at).toLocaleString()}
                          </p>
                        )}
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => handleSync(integration.id)}
                          >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Sync Now
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDisconnect(integration.id)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                    {!isConnected && (
                      <Button className="w-full" onClick={() => handleConnect(app.type, app.name)}>
                        Connect
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
