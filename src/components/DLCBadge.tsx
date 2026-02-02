/**
 * DLC Badge Component
 * Shows premium/DLC badge on content
 */

import React from "react";
import { Crown, Sparkles, Lock, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface DLCBadgeProps {
  type?: "premium" | "dlc" | "locked" | "featured" | "new";
  size?: "sm" | "md" | "lg";
  className?: string;
  showLabel?: boolean;
}

const badgeConfig = {
  premium: {
    icon: Crown,
    label: "Premium",
    className: "bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-amber-400",
  },
  dlc: {
    icon: Sparkles,
    label: "DLC",
    className: "bg-gradient-to-r from-purple-500 to-pink-500 text-white border-purple-400",
  },
  locked: {
    icon: Lock,
    label: "Locked",
    className: "bg-muted text-muted-foreground border-border",
  },
  featured: {
    icon: Star,
    label: "Featured",
    className: "bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-blue-400",
  },
  new: {
    icon: Sparkles,
    label: "New",
    className: "bg-gradient-to-r from-green-500 to-emerald-500 text-white border-green-400",
  },
};

const sizeConfig = {
  sm: {
    badge: "text-xs px-1.5 py-0.5",
    icon: "h-3 w-3",
  },
  md: {
    badge: "text-sm px-2 py-1",
    icon: "h-4 w-4",
  },
  lg: {
    badge: "text-base px-3 py-1.5",
    icon: "h-5 w-5",
  },
};

export const DLCBadge: React.FC<DLCBadgeProps> = ({
  type = "dlc",
  size = "md",
  className,
  showLabel = true,
}) => {
  const config = badgeConfig[type];
  const sizes = sizeConfig[size];
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn(
        "inline-flex items-center gap-1 font-medium",
        config.className,
        sizes.badge,
        className,
      )}
    >
      <Icon className={sizes.icon} />
      {showLabel && <span>{config.label}</span>}
    </Badge>
  );
};

export default DLCBadge;
