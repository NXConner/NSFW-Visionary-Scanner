import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Sparkles } from "lucide-react";
import type { SexualWellnessPattern } from "../types";

export function InsightsTab({
  patterns,
  onAcknowledge,
}: {
  patterns: SexualWellnessPattern[];
  onAcknowledge: (patternId: string) => void;
}): JSX.Element {
  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          AI Insights &amp; Patterns
        </CardTitle>
      </CardHeader>
      <CardContent>
        {patterns.length > 0 ? (
          <div className="space-y-4">
            {patterns.map(pattern => (
              <Card key={pattern.id} variant="glass">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2 gap-3">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-primary" />
                      <Badge variant="outline" className="capitalize">
                        {pattern.pattern_type}
                      </Badge>
                    </div>
                    {!pattern.acknowledged_at && (
                      <Button size="sm" variant="ghost" onClick={() => onAcknowledge(pattern.id!)}>
                        Dismiss
                      </Button>
                    )}
                  </div>
                  <p className="text-sm mt-2">{pattern.pattern_description}</p>
                  {pattern.confidence_score !== undefined && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Confidence: {Number(pattern.confidence_score).toFixed(0)}%
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No insights yet. Keep tracking to receive AI-powered insights!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
