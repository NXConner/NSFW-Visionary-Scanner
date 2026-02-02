import React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, Clock, TrendingDown } from "lucide-react";

import type { Milestone, MilestoneKind } from "@/components/progressCharts/types";

const iconFor = (kind: MilestoneKind) => {
  switch (kind) {
    case "first_measurement":
      return <Award className="w-4 h-4" />;
    case "lowest_curvature":
      return <TrendingDown className="w-4 h-4" />;
    case "tracking_consistency":
      return <Clock className="w-4 h-4" />;
  }
};

export function MilestonesCard({
  milestones,
  show,
  onHide,
}: {
  milestones: Milestone[];
  show: boolean;
  onHide: () => void;
}) {
  if (!show || milestones.length === 0) return null;

  return (
    <Card className="glass-card border-border/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Award className="w-4 h-4 text-warning" />
            Milestones & Achievements
          </CardTitle>
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onHide}>
            Hide
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {milestones.map((milestone, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 p-3 rounded-lg border ${
                milestone.type === "positive"
                  ? "bg-success/5 border-success/20"
                  : milestone.type === "negative"
                    ? "bg-destructive/5 border-destructive/20"
                    : "bg-muted/30 border-border/50"
              }`}
            >
              <div
                className={`p-2 rounded-full ${
                  milestone.type === "positive"
                    ? "bg-success/10 text-success"
                    : milestone.type === "negative"
                      ? "bg-destructive/10 text-destructive"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {iconFor(milestone.kind)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{milestone.label}</p>
                <p className="text-xs text-muted-foreground">{milestone.date}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
