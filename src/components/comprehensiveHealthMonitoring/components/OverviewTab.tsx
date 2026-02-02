import React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Activity, AlertTriangle, Shield } from "lucide-react";
import { format } from "date-fns";

import type {
  HealthAlert,
  HealthRiskFactor,
  SexualWellnessScore,
} from "@/components/comprehensiveHealthMonitoring/types";

export function OverviewTab({
  latestScore,
  unreadAlerts,
  riskFactors,
  onDismissAlert,
  onHideMilestones,
  showRiskAssessment = true,
}: {
  latestScore: SexualWellnessScore | undefined;
  unreadAlerts: HealthAlert[];
  riskFactors: HealthRiskFactor[];
  onDismissAlert: (id: string) => void;
  onHideMilestones?: () => void;
  showRiskAssessment?: boolean;
}) {
  return (
    <div className="space-y-4">
      {/* Wellness Score */}
      {latestScore && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Overall Wellness Score
            </CardTitle>
            <CardDescription>
              Last updated: {format(new Date(latestScore.entry_date), "MMM d, yyyy")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Overall Score</span>
                  <span className="font-bold text-primary">{latestScore.overall_score}/100</span>
                </div>
                <Progress value={latestScore.overall_score} className="h-3" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Physical</div>
                  <div className="text-2xl font-bold">{latestScore.physical_score}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Emotional</div>
                  <div className="text-2xl font-bold">{latestScore.emotional_score}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Relationship</div>
                  <div className="text-2xl font-bold">{latestScore.relationship_score}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Health Alerts */}
      {unreadAlerts.length > 0 && (
        <Card className="glass-card border-yellow-500/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              Health Alerts ({unreadAlerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              <div className="space-y-2">
                {unreadAlerts.map(alert => (
                  <div
                    key={alert.id}
                    className="p-3 rounded-lg border border-yellow-500/30 bg-yellow-500/10"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {alert.category}
                          </Badge>
                          {alert.action_required && (
                            <Badge variant="destructive" className="text-xs">
                              Action Required
                            </Badge>
                          )}
                        </div>
                        <h4 className="font-semibold text-sm">{alert.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => onDismissAlert(alert.id)}>
                        Dismiss
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Risk Factors */}
      {showRiskAssessment && riskFactors.length > 0 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Risk Assessment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {riskFactors.map(risk => (
                <div key={risk.id} className="p-3 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold capitalize">{risk.risk_type}</span>
                    <Badge
                      variant={
                        risk.risk_level === "very_high" || risk.risk_level === "high"
                          ? "destructive"
                          : risk.risk_level === "moderate"
                            ? "default"
                            : "secondary"
                      }
                    >
                      {risk.risk_level}
                    </Badge>
                  </div>
                  {risk.recommendations.length > 0 && (
                    <ul className="text-sm text-muted-foreground list-disc list-inside">
                      {risk.recommendations.map((rec, idx) => (
                        <li key={idx}>{rec}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
