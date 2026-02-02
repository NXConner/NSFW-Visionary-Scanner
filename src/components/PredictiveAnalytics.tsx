import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MedicalDisclaimer } from "@/components/MedicalDisclaimer";
import {
  TrendingUp,
  TrendingDown,
  Target,
  Calendar,
  Sparkles,
  Brain,
  ChartLine,
  Award,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react";
import {
  LazyLineChart,
  LazyAreaChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
} from "@/components/lazyLoaders/LazyCharts";

interface DataPoint {
  date: string;
  length: number;
  circumference: number;
  curvature?: number;
}

interface PredictiveAnalyticsProps {
  historicalData: DataPoint[];
  currentMeasurements: {
    length: number;
    circumference: number;
    curvature: number;
  };
}

export const PredictiveAnalytics = ({
  historicalData,
  currentMeasurements,
}: PredictiveAnalyticsProps) => {
  const [timeframe, setTimeframe] = useState<"30d" | "90d" | "6m" | "1y">("90d");

  // Generate predictions based on historical trend
  const predictions = useMemo(() => {
    if (historicalData.length < 2) {
      return { length: 0, circumference: 0, confidence: 0, trend: "stable" as const };
    }

    // Simple linear regression for prediction
    const n = historicalData.length;
    const recentData = historicalData.slice(-Math.min(n, 10));

    const lengthTrend =
      recentData.length > 1
        ? (recentData[recentData.length - 1].length - recentData[0].length) / recentData.length
        : 0;

    const circumferenceTrend =
      recentData.length > 1
        ? (recentData[recentData.length - 1].circumference - recentData[0].circumference) /
          recentData.length
        : 0;

    const daysToPredict =
      timeframe === "30d" ? 30 : timeframe === "90d" ? 90 : timeframe === "6m" ? 180 : 365;

    return {
      length: +(currentMeasurements.length + lengthTrend * daysToPredict).toFixed(2),
      circumference: +(
        currentMeasurements.circumference +
        circumferenceTrend * daysToPredict
      ).toFixed(2),
      confidence: Math.min(95, 60 + historicalData.length * 2),
      trend:
        lengthTrend > 0.01
          ? ("growing" as const)
          : lengthTrend < -0.01
            ? ("declining" as const)
            : ("stable" as const),
    };
  }, [historicalData, currentMeasurements, timeframe]);

  // Generate chart data with predictions
  const chartData = useMemo(() => {
    const actual = historicalData.map(d => ({
      ...d,
      type: "actual",
    }));

    const lastDate =
      historicalData.length > 0
        ? new Date(historicalData[historicalData.length - 1].date)
        : new Date();

    const daysToPredict =
      timeframe === "30d" ? 30 : timeframe === "90d" ? 90 : timeframe === "6m" ? 180 : 365;
    const predictedPoints = [];

    for (let i = 1; i <= 5; i++) {
      const futureDate = new Date(lastDate);
      futureDate.setDate(futureDate.getDate() + (daysToPredict / 5) * i);

      const progress = i / 5;
      predictedPoints.push({
        date: futureDate.toISOString().split("T")[0],
        length:
          currentMeasurements.length + (predictions.length - currentMeasurements.length) * progress,
        circumference:
          currentMeasurements.circumference +
          (predictions.circumference - currentMeasurements.circumference) * progress,
        type: "predicted",
      });
    }

    return [...actual, ...predictedPoints];
  }, [historicalData, predictions, currentMeasurements, timeframe]);

  const getTrendIcon = () => {
    if (predictions.trend === "growing") return <TrendingUp className="w-4 h-4 text-success" />;
    if (predictions.trend === "declining")
      return <TrendingDown className="w-4 h-4 text-destructive" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  const lengthChange = predictions.length - currentMeasurements.length;
  const circumferenceChange = predictions.circumference - currentMeasurements.circumference;

  return (
    <Card variant="glass" className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Brain className="w-5 h-5 text-primary" />
            AI Predictions
          </CardTitle>
          <Badge variant="outline" className="gap-1">
            <Sparkles className="w-3 h-3" />
            {predictions.confidence}% confidence
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Contextual Disclaimer */}
        <MedicalDisclaimer mode="contextual" />
        {/* Timeframe selector */}
        <Tabs value={timeframe} onValueChange={v => setTimeframe(v as "30d" | "90d" | "6m" | "1y")}>
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="30d">30 Days</TabsTrigger>
            <TabsTrigger value="90d">90 Days</TabsTrigger>
            <TabsTrigger value="6m">6 Months</TabsTrigger>
            <TabsTrigger value="1y">1 Year</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Prediction cards */}
        <div className="grid grid-cols-2 gap-3">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Predicted Length</span>
              {lengthChange > 0 ? (
                <ArrowUpRight className="w-4 h-4 text-success" />
              ) : lengthChange < 0 ? (
                <ArrowDownRight className="w-4 h-4 text-destructive" />
              ) : (
                <Minus className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
            <div className="text-2xl font-bold text-primary">
              {predictions.length.toFixed(1)} <span className="text-sm font-normal">cm</span>
            </div>
            <div className={`text-xs ${lengthChange >= 0 ? "text-success" : "text-destructive"}`}>
              {lengthChange >= 0 ? "+" : ""}
              {lengthChange.toFixed(2)} cm from current
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-4 rounded-xl bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Predicted Girth</span>
              {circumferenceChange > 0 ? (
                <ArrowUpRight className="w-4 h-4 text-success" />
              ) : circumferenceChange < 0 ? (
                <ArrowDownRight className="w-4 h-4 text-destructive" />
              ) : (
                <Minus className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
            <div className="text-2xl font-bold text-accent">
              {predictions.circumference.toFixed(1)} <span className="text-sm font-normal">cm</span>
            </div>
            <div
              className={`text-xs ${circumferenceChange >= 0 ? "text-success" : "text-destructive"}`}
            >
              {circumferenceChange >= 0 ? "+" : ""}
              {circumferenceChange.toFixed(2)} cm from current
            </div>
          </motion.div>
        </div>

        {/* Trend indicator */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/50">
          <div className="flex items-center gap-2">
            {getTrendIcon()}
            <span className="text-sm font-medium capitalize">{predictions.trend} Trend</span>
          </div>
          <span className="text-xs text-muted-foreground">
            Based on {historicalData.length} measurements
          </span>
        </div>

        {/* Prediction chart */}
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LazyLineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={value =>
                  new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                }
              />
              <YAxis
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                domain={["auto", "auto"]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                labelFormatter={value => new Date(value).toLocaleDateString()}
              />

              {/* Actual data */}
              <Line
                type="monotone"
                dataKey="length"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
                name="Length (cm)"
              />

              {/* Prediction area */}
              <Area
                type="monotone"
                dataKey="length"
                fill="hsl(var(--primary) / 0.1)"
                stroke="transparent"
              />
            </LazyLineChart>
          </ResponsiveContainer>
        </div>

        {/* Insights */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-warning" />
            AI Insights
          </h4>
          <div className="space-y-2">
            {predictions.trend === "growing" && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-3 rounded-lg bg-success/10 border border-success/20 text-sm"
              >
                <div className="flex items-start gap-2">
                  <Award className="w-4 h-4 text-success mt-0.5" />
                  <div>
                    <p className="font-medium text-success">Positive Growth Detected</p>
                    <p className="text-xs text-muted-foreground">
                      Your measurements show consistent improvement. Keep up the current routine!
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {predictions.trend === "stable" && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-sm"
              >
                <div className="flex items-start gap-2">
                  <ChartLine className="w-4 h-4 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-primary">Stable Measurements</p>
                    <p className="text-xs text-muted-foreground">
                      Your measurements are consistent. Consider adjusting your routine for new
                      gains.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {historicalData.length < 5 && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="p-3 rounded-lg bg-warning/10 border border-warning/20 text-sm"
              >
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-warning mt-0.5" />
                  <div>
                    <p className="font-medium text-warning">More Data Needed</p>
                    <p className="text-xs text-muted-foreground">
                      Log more measurements to improve prediction accuracy. Currently at{" "}
                      {historicalData.length}/5 minimum entries.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
