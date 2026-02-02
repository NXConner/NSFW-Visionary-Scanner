import { AlertTriangle, CheckCircle2, Target } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import type { KegelRoutine, PelvicFloorGoal } from "@/components/pelvicFloor/data/kegelHubContent";

function goalLabel(goal: PelvicFloorGoal): string {
  switch (goal) {
    case "erection_quality":
      return "Erection quality";
    case "ejaculation_control":
      return "Ejaculation control";
    case "urinary_control":
      return "Urinary control";
    case "pelvic_pain_relaxation":
      return "Relaxation / down-training";
    case "core_support":
      return "Core support";
    case "general_fitness":
      return "General fitness";
    default:
      return goal;
  }
}

export function RoutineCard({ routine }: { routine: KegelRoutine }) {
  return (
    <Card className="glass-morphism border-border/60">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              {routine.title}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {routine.frequency} • ~{routine.estimatedMinutes} min
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="capitalize">
              {routine.level}
            </Badge>
            {routine.goals.slice(0, 3).map(g => (
              <Badge key={g} variant="outline" className="text-xs">
                {goalLabel(g)}
              </Badge>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-border/60 bg-muted/10 p-4">
          <h4 className="font-semibold text-sm mb-2">Routine steps</h4>
          <ol className="space-y-3">
            {routine.steps.map((s, idx) => (
              <li key={s.id} className="text-sm">
                <div className="flex items-start gap-3">
                  <span className="bg-primary/15 text-primary rounded-full w-7 h-7 flex items-center justify-center text-xs font-semibold shrink-0">
                    {idx + 1}
                  </span>
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-foreground">{s.title}</span>
                      <Badge variant="outline" className="text-[11px]">
                        {s.prescription}
                      </Badge>
                    </div>
                    <div className="grid md:grid-cols-2 gap-3">
                      <div className="rounded-md border border-green-500/20 bg-green-500/5 p-3">
                        <div className="flex items-center gap-2 text-xs font-semibold text-green-400 mb-1">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Cues
                        </div>
                        <ul className="text-xs text-muted-foreground space-y-1">
                          {s.cues.map((c, i) => (
                            <li key={`${s.id}:cue:${i}`} className="flex items-start gap-2">
                              <span className="mt-1 h-1 w-1 rounded-full bg-green-400/70 shrink-0" />
                              <span>{c}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="rounded-md border border-orange-500/20 bg-orange-500/5 p-3">
                        <div className="flex items-center gap-2 text-xs font-semibold text-orange-300 mb-1">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          Avoid
                        </div>
                        <ul className="text-xs text-muted-foreground space-y-1">
                          {s.avoid.map((a, i) => (
                            <li key={`${s.id}:avoid:${i}`} className="flex items-start gap-2">
                              <span className="mt-1 h-1 w-1 rounded-full bg-orange-300/70 shrink-0" />
                              <span>{a}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {routine.notes.length > 0 ? (
          <div className="rounded-lg border border-border/60 bg-muted/10 p-4">
            <h4 className="font-semibold text-sm mb-2">Notes</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              {routine.notes.map((n, i) => (
                <li key={`${routine.id}:note:${i}`} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary/60 shrink-0" />
                  <span>{n}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
