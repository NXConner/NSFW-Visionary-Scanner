import type React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useFeatureToggles } from "@/hooks/useFeatureAccess";
import {
  Activity,
  BarChart3,
  Brain,
  Camera,
  Cloud,
  Dumbbell,
  FileDown,
  Headphones,
  ShieldCheck,
  Sparkles,
  ToggleLeft,
} from "lucide-react";

export function FeatureTogglesCard() {
  const { toggles, toggleFeature } = useFeatureToggles();

  const items: Array<{
    key: string;
    label: string;
    description: string;
    badge?: "Core" | "Premium" | "Pro";
    Icon: React.ComponentType<{ className?: string }>;
  }> = [
    {
      key: "unlimitedScans",
      label: "Unlimited Scans",
      description: "Remove scanner usage limits (access still depends on your plan)",
      badge: "Premium",
      Icon: Activity,
    },
    {
      key: "aiScanAnalysis",
      label: "AI Scan Analysis",
      description: "AI-assisted scan interpretation and insights",
      badge: "Premium",
      Icon: Brain,
    },
    {
      key: "advancedCalibration",
      label: "Advanced Calibration",
      description: "Enhanced calibration tools for improved accuracy",
      badge: "Pro",
      Icon: ShieldCheck,
    },
    {
      key: "aiHealthChatbot",
      label: "AI Assistant",
      description: "AI-powered health guidance and Q&A",
      badge: "Pro",
      Icon: Brain,
    },
    {
      key: "predictiveAnalytics",
      label: "Predictive Analytics",
      description: "Trends, forecasting, and actionable predictions",
      badge: "Premium",
      Icon: BarChart3,
    },
    {
      key: "medicalExport",
      label: "Medical Export",
      description: "Export reports for sharing with professionals",
      badge: "Premium",
      Icon: FileDown,
    },
    {
      key: "positionsGallery",
      label: "Positions Gallery",
      description: "Illustrated positions with guidance and details",
      badge: "Premium",
      Icon: Sparkles,
    },
    {
      key: "peProgressPhotos",
      label: "Progress Photos",
      description: "Track progress with photo history",
      badge: "Premium",
      Icon: Camera,
    },
    {
      key: "customRoutines",
      label: "Routine Builder",
      description: "Create and manage custom routines",
      badge: "Premium",
      Icon: Dumbbell,
    },
    {
      key: "cloudBackup",
      label: "Cloud Backup",
      description: "Secure cloud sync and backups",
      badge: "Pro",
      Icon: Cloud,
    },
    {
      key: "advancedAnalytics",
      label: "Advanced Analytics",
      description: "Deeper dashboards and analysis",
      badge: "Pro",
      Icon: BarChart3,
    },
    {
      key: "dataExport",
      label: "Data Export",
      description: "Export your data (JSON/CSV where supported)",
      badge: "Core",
      Icon: FileDown,
    },
    {
      key: "prioritySupport",
      label: "Priority Support",
      description: "Faster support response times",
      badge: "Premium",
      Icon: Headphones,
    },
    {
      key: "customWorkouts",
      label: "Custom Workouts",
      description: "Expanded workout customization options",
      badge: "Premium",
      Icon: Dumbbell,
    },
  ];

  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ToggleLeft className="w-5 h-5" />
          Feature Toggles
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Enable or disable specific features. Disabled features won&apos;t appear in navigation.
        </p>

        <div className="space-y-4">
          {items.map((item, idx) => {
            const Icon = item.Icon;
            return (
              <div key={item.key}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-primary/80" />
                    <div>
                      <Label className="text-base">{item.label}</Label>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.badge ? (
                      <Badge variant="outline" className="text-xs">
                        {item.badge}
                      </Badge>
                    ) : null}
                    <Switch
                      checked={typeof toggles[item.key] === "boolean" ? toggles[item.key] : true}
                      onCheckedChange={v => toggleFeature(item.key, v)}
                    />
                  </div>
                </div>
                {idx < items.length - 1 ? <Separator className="mt-4" /> : null}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
