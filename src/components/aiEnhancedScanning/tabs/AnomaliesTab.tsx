import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import type { AnomalyDetection } from "@/lib/aiEnhancedScanning";

export function AnomaliesTab({
  selectedScanId,
  loading,
  anomalies,
  onDetect,
}: {
  selectedScanId: string | null;
  loading: boolean;
  anomalies: AnomalyDetection[];
  onDetect: () => void;
}): JSX.Element {
  const getSeverityBadge = (severity: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      low: "outline",
      medium: "default",
      high: "destructive",
      critical: "destructive",
    };
    return <Badge variant={variants[severity] || "default"}>{severity.toUpperCase()}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Anomaly Detection</CardTitle>
          <Button onClick={onDetect} disabled={loading || !selectedScanId}>
            <AlertTriangle className="w-4 h-4 mr-2" />
            Detect Anomalies
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {anomalies.map(anomaly => (
            <Card key={anomaly.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold capitalize">
                        {anomaly.anomaly_type.replace("_", " ")}
                      </h4>
                      {getSeverityBadge(anomaly.severity)}
                      <Badge variant="outline">
                        {Math.round(anomaly.confidence * 100)}% confidence
                      </Badge>
                    </div>
                    <p className="text-sm mb-2">{anomaly.description}</p>
                    {anomaly.recommendation && (
                      <p className="text-sm text-muted-foreground">
                        <strong>Recommendation:</strong> {anomaly.recommendation}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {anomalies.length === 0 && (
            <p className="text-sm text-muted-foreground">No anomalies loaded for this scan.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
