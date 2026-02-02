import React from "react";

import { Badge } from "@/components/ui/badge";

import type { ExperienceLevel, RiskLevel } from "@/components/mensHealthGuide/types";

export function RiskBadge({ level }: { level: RiskLevel }) {
  const colors: Record<RiskLevel, string> = {
    low: "bg-green-500/20 text-green-400 border-green-500/30",
    medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    extreme: "bg-red-500/20 text-red-400 border-red-500/30",
  };

  return (
    <Badge
      className={`${colors[level]} border`}
    >{`${level.charAt(0).toUpperCase()}${level.slice(1)} Risk`}</Badge>
  );
}

export function ExperienceBadge({ levels }: { levels: ExperienceLevel[] }) {
  const colors: Record<Exclude<ExperienceLevel, "all">, string> = {
    beginner: "bg-green-500/20 text-green-400 border-green-500/30",
    intermediate: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    advanced: "bg-red-500/20 text-red-400 border-red-500/30",
  };

  return (
    <div className="flex gap-1 flex-wrap">
      {levels
        .filter((l): l is Exclude<ExperienceLevel, "all"> => l !== "all")
        .map(level => (
          <Badge key={level} className={`${colors[level]} border text-xs`}>
            {level}
          </Badge>
        ))}
    </div>
  );
}
