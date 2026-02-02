import { Activity, Bug, Eye, Heart, Thermometer } from "lucide-react";

import type { HealthTopicCategory, HealthTopicSeverity } from "@/components/educationCenter/types";

export const categoryIcons: Record<HealthTopicCategory, typeof Activity> = {
  curvature: Activity,
  sti: Bug,
  infection: Thermometer,
  skin: Eye,
  general: Heart,
};

export const categoryLabels: Record<HealthTopicCategory, string> = {
  curvature: "Curvature & Structure",
  sti: "STIs & STDs",
  infection: "Infections",
  skin: "Skin Conditions",
  general: "General Health",
};

export const severityColors: Record<HealthTopicSeverity, string> = {
  informational: "bg-primary/20 text-primary border-primary/30",
  mild: "bg-success/20 text-success border-success/30",
  moderate: "bg-warning/20 text-warning border-warning/30",
  serious: "bg-destructive/20 text-destructive border-destructive/30",
};
