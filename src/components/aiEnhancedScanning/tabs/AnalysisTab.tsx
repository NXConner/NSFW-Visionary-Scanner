import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AIScanAnalysis } from "@/lib/aiEnhancedScanning";
import { parseDetectedConditions, parseHealthAlerts } from "../types";

export function AnalysisTab({ analyses }: { analyses: AIScanAnalysis[] }): JSX.Element {
  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Scan Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {analyses.map(analysis => {
            const conditions = parseDetectedConditions(analysis.detected_conditions);
            const alerts = parseHealthAlerts(analysis.health_alerts);
            return (
              <Card key={analysis.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold capitalize">
                      {analysis.analysis_type.replace("_", " ")}
                    </h4>
                    {analysis.ai_model_confidence != null && (
                      <Badge variant="outline">
                        {Math.round(analysis.ai_model_confidence * 100)}% confidence
                      </Badge>
                    )}
                  </div>

                  {conditions.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-medium mb-1">Detected Conditions:</p>
                      <ul className="list-disc list-inside text-sm text-muted-foreground">
                        {conditions.map((c, idx) => (
                          <li key={idx}>
                            {c.condition} ({Math.round(c.confidence * 100)}%)
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {analysis.suggested_measurements && (
                    <div className="mt-2">
                      <p className="text-sm font-medium mb-1">Suggested Measurements:</p>
                      <pre className="text-xs bg-muted p-2 rounded">
                        {JSON.stringify(analysis.suggested_measurements, null, 2)}
                      </pre>
                    </div>
                  )}

                  {alerts.length > 0 && (
                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                      <p className="text-sm font-medium text-yellow-900">Health Alerts:</p>
                      <ul className="list-disc list-inside text-sm text-yellow-800">
                        {alerts.map((a, idx) => (
                          <li key={idx}>{a.message}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
          {analyses.length === 0 && (
            <p className="text-sm text-muted-foreground">No analysis yet. Run "Analyze Scan".</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
