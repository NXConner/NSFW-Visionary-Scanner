import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { MeasurementSuggestion } from "@/lib/aiEnhancedScanning";

export function SuggestionsTab({
  suggestions,
  loading,
  onApply,
}: {
  suggestions: MeasurementSuggestion[];
  loading: boolean;
  onApply: (suggestionId: string) => void;
}): JSX.Element {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Measurement Suggestions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {suggestions.map(suggestion => (
            <Card key={suggestion.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold capitalize">
                        {suggestion.suggestion_type.replace("_", " ")}
                      </h4>
                      <Badge variant={suggestion.priority === "high" ? "destructive" : "default"}>
                        {suggestion.priority}
                      </Badge>
                    </div>
                    {suggestion.reasoning && (
                      <p className="text-sm text-muted-foreground mb-2">{suggestion.reasoning}</p>
                    )}
                    {suggestion.current_value !== null && (
                      <p className="text-sm">
                        Current: {suggestion.current_value} → Suggested:{" "}
                        {suggestion.suggested_value}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Expected improvement: {Math.round(suggestion.improvement_expected * 100)}%
                    </p>
                  </div>
                  {!suggestion.is_applied && (
                    <Button size="sm" onClick={() => onApply(suggestion.id)} disabled={loading}>
                      Apply
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          {suggestions.length === 0 && (
            <p className="text-sm text-muted-foreground">No suggestions found for this scan.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
