import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { RotateCcw } from "lucide-react";

import { getInteractiveContent, type InteractiveContent } from "@/lib/sexualHealthEducation";
import { InteractiveExerciseCard } from "./InteractiveExerciseCard";

export function InteractiveContentSection({
  moduleId,
  hasPrimaryContent,
  isAdmin,
}: {
  moduleId: string;
  hasPrimaryContent: boolean;
  isAdmin: boolean;
}): JSX.Element | null {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<InteractiveContent[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const next = await getInteractiveContent(moduleId);
      setItems(next);
    } catch {
      toast.error("Failed to load interactive content");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [moduleId]);

  useEffect(() => {
    void load();
  }, [load]);

  const showEmptyNotice = !loading && items.length === 0 && !hasPrimaryContent;
  if (loading && items.length === 0) {
    return (
      <Card variant="glass" className="border-border/50">
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading interactive exercises…
        </CardContent>
      </Card>
    );
  }

  if (showEmptyNotice) {
    return (
      <Card variant="glass" className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">This module is not yet published</CardTitle>
          <CardDescription>
            {isAdmin
              ? "Add article/video content or create an interactive exercise to publish this module."
              : "There is no content available for this module yet."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={load}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reload
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!loading && items.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">Interactive exercises</h3>
          <p className="text-sm text-muted-foreground">
            Quizzes and assessments are saved to your progress when you're signed in.
          </p>
        </div>
        <Button variant="outline" onClick={load} disabled={loading}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {items.map(item => (
        <InteractiveExerciseCard key={item.id ?? item.title} moduleId={moduleId} item={item} />
      ))}
    </div>
  );
}
