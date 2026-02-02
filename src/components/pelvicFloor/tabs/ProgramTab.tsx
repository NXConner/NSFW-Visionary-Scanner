import { Target } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { RoutineCard } from "@/components/pelvicFloor/components/RoutineCard";
import type { KegelRoutine } from "@/components/pelvicFloor/data/kegelHubContent";

export function ProgramTab({ routines }: { routines: KegelRoutine[] }): JSX.Element {
  return (
    <div className="space-y-4">
      <Card className="glass-morphism">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Starter routines (balanced)
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Choose one routine and run it for 2 weeks before increasing volume. If you get tight or
          sore, reduce the total reps/holds and increase relaxation (reverse Kegels).
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {routines.map(r => (
          <RoutineCard key={r.id} routine={r} />
        ))}
      </div>
    </div>
  );
}
