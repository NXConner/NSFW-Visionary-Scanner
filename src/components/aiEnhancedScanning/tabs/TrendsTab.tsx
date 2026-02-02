import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, TrendingUp } from "lucide-react";
import type { HealthTrendVisualization } from "@/lib/aiEnhancedScanning";

export function TrendsTab({
  loading,
  visualizations,
  onGenerate,
}: {
  loading: boolean;
  visualizations: HealthTrendVisualization[];
  onGenerate: (type: HealthTrendVisualization["visualization_type"]) => void;
}): JSX.Element {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Health Trend Visualizations</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <Button onClick={() => onGenerate("growth_trend")} disabled={loading} variant="outline">
            <TrendingUp className="w-4 h-4 mr-2" />
            Growth Trend
          </Button>
          <Button
            onClick={() => onGenerate("measurement_trend")}
            disabled={loading}
            variant="outline"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Measurement Trend
          </Button>
          <Button
            onClick={() => onGenerate("health_score_trend")}
            disabled={loading}
            variant="outline"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Health Score Trend
          </Button>
          <Button
            onClick={() => onGenerate("comparison_trend")}
            disabled={loading}
            variant="outline"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Comparison Trend
          </Button>
        </div>

        <div className="space-y-2">
          {visualizations.map(viz => (
            <Card key={viz.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold capitalize">
                      {viz.visualization_type.replace("_", " ")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(viz.generated_at).toLocaleString()}
                    </p>
                  </div>
                  <pre className="text-xs bg-muted p-2 rounded max-w-[60%] overflow-auto">
                    {JSON.stringify(viz.trend_data, null, 2)}
                  </pre>
                </div>
              </CardContent>
            </Card>
          ))}
          {visualizations.length === 0 && (
            <p className="text-sm text-muted-foreground">No visualizations generated yet.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
