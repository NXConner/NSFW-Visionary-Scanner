import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Target } from "lucide-react";
import type { SexualWellnessGoal } from "../types";

export function GoalsTab({
  goals,
  onCreateGoal,
}: {
  goals: SexualWellnessGoal[];
  onCreateGoal: () => void;
}): JSX.Element {
  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5" />
          Wellness Goals
        </CardTitle>
      </CardHeader>
      <CardContent>
        {goals.length > 0 ? (
          <div className="space-y-4">
            {goals.map(goal => (
              <Card key={goal.id} variant="glass">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-semibold capitalize">
                        {goal.goal_type.replace("_", " ")}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Target: {goal.target_value} | Current: {goal.current_value || 0}
                      </p>
                    </div>
                    {goal.is_active ? (
                      <Badge variant="outline">Active</Badge>
                    ) : (
                      <Badge className="bg-green-500">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Completed
                      </Badge>
                    )}
                  </div>
                  {goal.progress_percentage !== undefined && (
                    <Progress value={Number(goal.progress_percentage)} className="mt-2" />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No goals set yet. Create a goal to track your progress!</p>
            <Button onClick={onCreateGoal} className="mt-4" variant="outline">
              Create Goal
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
