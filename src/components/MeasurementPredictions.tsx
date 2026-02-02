import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useData } from "@/contexts/DataContext";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  Calendar,
  Brain,
  ChevronRight,
  AlertCircle,
} from "lucide-react";

interface Prediction {
  metric: string;
  current: number | null;
  predicted30: number | null;
  predicted90: number | null;
  trend: "improving" | "stable" | "declining";
  confidence: number;
}

export const MeasurementPredictions = () => {
  const { scans } = useData();

  const predictions = useMemo((): Prediction[] => {
    if (scans.length < 3) return [];

    // Get last 10 scans for trend analysis
    const recentScans = scans.slice(0, 10).reverse();

    const calculateTrend = (values: (number | null)[]) => {
      const validValues = values.filter((v): v is number => v !== null);
      if (validValues.length < 2) return { slope: 0, confidence: 0 };

      const n = validValues.length;
      const sumX = (n * (n - 1)) / 2;
      const sumY = validValues.reduce((a, b) => a + b, 0);
      const sumXY = validValues.reduce((sum, y, x) => sum + x * y, 0);
      const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;

      const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
      const avgY = sumY / n;
      const variance = validValues.reduce((sum, y) => sum + Math.pow(y - avgY, 2), 0) / n;
      const confidence = Math.max(0, Math.min(100, 100 - variance * 2));

      return { slope, confidence };
    };

    const metrics = [
      { key: "curvature_angle", label: "Curvature Angle", unit: "°", invertTrend: true },
      { key: "length", label: "Length", unit: "cm", invertTrend: false },
      { key: "circumference", label: "Circumference", unit: "cm", invertTrend: false },
    ];

    return metrics.map(metric => {
      const values = recentScans.map(s => s[metric.key as keyof typeof s] as number | null);
      const { slope, confidence } = calculateTrend(values);
      const current = scans[0]?.[metric.key as keyof (typeof scans)[0]] as number | null;

      let trend: "improving" | "stable" | "declining";
      if (Math.abs(slope) < 0.1) {
        trend = "stable";
      } else if (metric.invertTrend) {
        trend = slope < 0 ? "improving" : "declining";
      } else {
        trend = slope > 0 ? "improving" : "declining";
      }

      const predicted30 = current !== null ? Math.max(0, current + slope * 4) : null; // ~4 weeks
      const predicted90 = current !== null ? Math.max(0, current + slope * 12) : null; // ~12 weeks

      return {
        metric: metric.label,
        current,
        predicted30: predicted30 !== null ? Math.round(predicted30 * 10) / 10 : null,
        predicted90: predicted90 !== null ? Math.round(predicted90 * 10) / 10 : null,
        trend,
        confidence: Math.round(confidence),
      };
    });
  }, [scans]);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "improving":
        return <TrendingDown className="w-4 h-4 text-success" />;
      case "declining":
        return <TrendingUp className="w-4 h-4 text-destructive" />;
      default:
        return <Minus className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case "improving":
        return "bg-success/10 text-success border-success/20";
      case "declining":
        return "bg-destructive/10 text-destructive border-destructive/20";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  if (scans.length < 3) {
    return (
      <Card variant="glass">
        <CardContent className="p-8 text-center">
          <Brain className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
          <p className="text-muted-foreground">Need at least 3 scans to generate predictions</p>
          <p className="text-sm text-muted-foreground mt-2">
            {3 - scans.length} more scan(s) required
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          AI Measurement Predictions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Disclaimer */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20">
          <AlertCircle className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
          <p className="text-xs text-muted-foreground">
            Predictions are based on your historical data trends and are for informational purposes
            only. Consult a healthcare provider for medical advice.
          </p>
        </div>

        {/* Predictions Grid */}
        <div className="space-y-4">
          {predictions.map((pred, index) => (
            <div
              key={pred.metric}
              className="p-4 rounded-xl bg-secondary/30 border border-border/50"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" />
                  <span className="font-medium">{pred.metric}</span>
                </div>
                <Badge variant="outline" className={getTrendColor(pred.trend)}>
                  {getTrendIcon(pred.trend)}
                  <span className="ml-1 capitalize">{pred.trend}</span>
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 rounded-lg bg-background/50">
                  <p className="text-xs text-muted-foreground mb-1">Current</p>
                  <p className="text-xl font-bold">{pred.current !== null ? pred.current : "-"}</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-primary/5 border border-primary/10">
                  <p className="text-xs text-muted-foreground mb-1 flex items-center justify-center gap-1">
                    <Calendar className="w-3 h-3" />
                    30 days
                  </p>
                  <p className="text-xl font-bold text-primary">
                    {pred.predicted30 !== null ? pred.predicted30 : "-"}
                  </p>
                </div>
                <div className="text-center p-3 rounded-lg bg-accent/5 border border-accent/10">
                  <p className="text-xs text-muted-foreground mb-1 flex items-center justify-center gap-1">
                    <Calendar className="w-3 h-3" />
                    90 days
                  </p>
                  <p className="text-xl font-bold text-accent">
                    {pred.predicted90 !== null ? pred.predicted90 : "-"}
                  </p>
                </div>
              </div>

              {/* Confidence Bar */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>Confidence</span>
                  <span>{pred.confidence}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all"
                    style={{ width: `${pred.confidence}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="p-4 rounded-xl gradient-primary text-primary-foreground">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="w-5 h-5" />
            <span className="font-semibold">AI Analysis Summary</span>
          </div>
          <p className="text-sm opacity-90">
            {predictions.filter(p => p.trend === "improving").length > 0
              ? `${predictions.filter(p => p.trend === "improving").length} metric(s) showing improvement. `
              : ""}
            {predictions.filter(p => p.trend === "stable").length > 0
              ? `${predictions.filter(p => p.trend === "stable").length} metric(s) stable. `
              : ""}
            Continue regular monitoring for best results.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
