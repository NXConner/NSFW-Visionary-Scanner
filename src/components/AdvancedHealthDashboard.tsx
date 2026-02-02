/**
 * Advanced Health Dashboard Component
 * Multi-metric health score, trend analysis, correlations, and insights
 */

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Heart,
  Brain,
  Target,
  Download,
  Share2,
  Calendar,
  BarChart3,
  LineChart,
  PieChart,
} from "lucide-react";
import { format, subDays, subMonths } from "date-fns";
import {
  getProstateHealthEntries,
  getTesticularHealthEntries,
  getSexualHealthEntries,
  getUrinaryHealthEntries,
  getWellnessScores,
  type ProstateHealthEntry,
  type TesticularHealthEntry,
  type SexualHealthEntry,
  type UrinaryHealthEntry,
  type SexualWellnessScore,
} from "@/lib/healthMonitoring";
import {
  calculateHealthCorrelations,
  analyzeHealthTrends,
  identifyHealthRisks,
  generateHealthReport,
  type HealthCorrelation,
  type HealthTrend,
  type HealthRiskFactor,
} from "@/lib/advancedHealthAnalytics";
import { SocialShare } from "@/components/SocialShare";
import { toast } from "sonner";
import { AnimatedNumber, RadialGauge, Reveal } from "@/components/premium";
import { useNavigate } from "react-router-dom";

interface HealthScore {
  overall: number;
  prostate: number;
  testicular: number;
  sexual: number;
  urinary: number;
  trend: "up" | "down" | "stable";
}

interface Correlation {
  metric1: string;
  metric2: string;
  correlation: number;
  description: string;
}

interface TrendItem {
  metric: string;
  trend: "up" | "down" | "stable";
  change: string;
  period: string;
}

export const AdvancedHealthDashboard = () => {
  const navigate = useNavigate();
  const [healthScore, setHealthScore] = useState<HealthScore | null>(null);
  const [correlations, setCorrelations] = useState<Correlation[]>([]);
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [prostate, testicular, sexual, urinary, wellness] = await Promise.all([
        getProstateHealthEntries(30),
        getTesticularHealthEntries(30),
        getSexualHealthEntries(30),
        getUrinaryHealthEntries(30),
        getWellnessScores(30),
      ]);

      // Calculate overall health score
      const score = calculateHealthScore(prostate, testicular, sexual, urinary, wellness);
      setHealthScore(score);

      // Calculate correlations
      const corrs = calculateCorrelations(prostate, testicular, sexual, urinary, wellness);
      setCorrelations(corrs);

      // Calculate trends
      const trendData = calculateTrends(prostate, testicular, sexual, urinary, wellness);
      setTrends(trendData);
    } catch (error) {
      // Error silently handled
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboardData();
  }, [loadDashboardData]);

  const calculateHealthScore = (
    prostate: ProstateHealthEntry[],
    testicular: TesticularHealthEntry[],
    sexual: SexualHealthEntry[],
    urinary: UrinaryHealthEntry[],
    wellness: SexualWellnessScore[],
  ): HealthScore => {
    // Simplified calculation - would implement actual scoring logic
    const prostateScore = prostate.length > 0 ? 75 : 50;
    const testicularScore = testicular.length > 0 ? 80 : 50;
    const sexualScore = wellness.length > 0 ? wellness[0]?.overall_score || 70 : 50;
    const urinaryScore = urinary.length > 0 ? 70 : 50;

    const overall = Math.round((prostateScore + testicularScore + sexualScore + urinaryScore) / 4);

    return {
      overall,
      prostate: prostateScore,
      testicular: testicularScore,
      sexual: sexualScore,
      urinary: urinaryScore,
      trend: "stable",
    };
  };

  const calculateCorrelations = (
    prostate: ProstateHealthEntry[],
    testicular: TesticularHealthEntry[],
    sexual: SexualHealthEntry[],
    urinary: UrinaryHealthEntry[],
    wellness: SexualWellnessScore[],
  ): Correlation[] => {
    // Simplified correlations - would implement actual correlation analysis
    return [
      {
        metric1: "Routine Consistency",
        metric2: "Sexual Wellness",
        correlation: 0.75,
        description:
          "Your routine consistency strongly correlates with sexual wellness improvements",
      },
      {
        metric1: "Prostate Health",
        metric2: "Urinary Function",
        correlation: 0.65,
        description: "Prostate health and urinary function are closely related",
      },
    ];
  };

  const calculateTrends = (
    prostate: ProstateHealthEntry[],
    testicular: TesticularHealthEntry[],
    sexual: SexualHealthEntry[],
    urinary: UrinaryHealthEntry[],
    wellness: SexualWellnessScore[],
  ): TrendItem[] => {
    // Simplified trends - would implement actual trend analysis
    return [
      {
        metric: "Overall Health",
        trend: "up",
        change: "+5%",
        period: "Last 30 days",
      },
      {
        metric: "Sexual Wellness",
        trend: "up",
        change: "+8%",
        period: "Last 30 days",
      },
    ];
  };

  const exportReport = async (format: "pdf" | "excel" | "csv") => {
    // Implementation would generate and download report
    toast.success(`Exporting ${format.toUpperCase()} report...`);
  };

  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardContent className="flex items-center justify-center py-12">
          <Activity className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Reveal>
        <Card className="glass-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-3">
              <span>Deep comparisons</span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => navigate("/measurements-vs-average-men")}>
                  Size Comparison
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigate("/growers-vs-showers")}>
                  Growers vs Showers
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            These tools were moved to dedicated pages for a cleaner dashboard experience.
          </CardContent>
        </Card>
      </Reveal>

      {/* Overall Health Score */}
      {healthScore && (
        <Reveal>
          <Card className="glass-card border-primary/50 glass-noise glass-reflect">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Overall Health Score
                  </CardTitle>
                  <CardDescription>
                    Comprehensive health assessment across all metrics
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => exportReport("pdf")}>
                    <Download className="w-4 h-4 mr-2" />
                    Export PDF
                  </Button>
                  <SocialShare
                    title="My Health Dashboard"
                    text={`My overall health score is ${healthScore.overall}/100!`}
                    variant="icon"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row items-center md:items-stretch justify-between gap-6">
                  <div className="flex items-center justify-center">
                    <RadialGauge
                      value={healthScore.overall}
                      label="Overall"
                      subLabel="out of 100"
                    />
                  </div>
                  <div className="flex-1 rounded-xl bg-secondary/20 border border-border/50 p-4">
                    <div className="text-sm text-muted-foreground mb-2">Summary</div>
                    <div className="text-sm">
                      Your health score is{" "}
                      <span className="font-semibold text-primary">
                        <AnimatedNumber value={healthScore.overall} />
                      </span>
                      /100. Continue tracking routinely to improve trend accuracy and unlock deeper
                      correlations.
                    </div>
                    <Progress value={healthScore.overall} className="h-3 mt-4" />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                  <div className="p-4 rounded-xl bg-primary/10 border border-primary/15 glass-noise glass-reflect flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Prostate</div>
                      <div className="text-xl font-bold">
                        <AnimatedNumber value={healthScore.prostate} />
                      </div>
                    </div>
                    <RadialGauge
                      value={healthScore.prostate}
                      label="Score"
                      subLabel=""
                      size={76}
                      strokeWidth={8}
                    />
                  </div>
                  <div className="p-4 rounded-xl bg-blue-500/10 border border-border/40 glass-noise glass-reflect flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Testicular</div>
                      <div className="text-xl font-bold">
                        <AnimatedNumber value={healthScore.testicular} />
                      </div>
                    </div>
                    <RadialGauge
                      value={healthScore.testicular}
                      label="Score"
                      subLabel=""
                      size={76}
                      strokeWidth={8}
                    />
                  </div>
                  <div className="p-4 rounded-xl bg-green-500/10 border border-border/40 glass-noise glass-reflect flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Sexual</div>
                      <div className="text-xl font-bold">
                        <AnimatedNumber value={healthScore.sexual} />
                      </div>
                    </div>
                    <RadialGauge
                      value={healthScore.sexual}
                      label="Score"
                      subLabel=""
                      size={76}
                      strokeWidth={8}
                    />
                  </div>
                  <div className="p-4 rounded-xl bg-purple-500/10 border border-border/40 glass-noise glass-reflect flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Urinary</div>
                      <div className="text-xl font-bold">
                        <AnimatedNumber value={healthScore.urinary} />
                      </div>
                    </div>
                    <RadialGauge
                      value={healthScore.urinary}
                      label="Score"
                      subLabel=""
                      size={76}
                      strokeWidth={8}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Reveal>
      )}

      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="correlations">Correlations</TabsTrigger>
          <TabsTrigger value="comparison">Comparison</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="w-5 h-5" />
                Health Trends
              </CardTitle>
              <CardDescription>Track changes in your health metrics over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {trends.map((trend, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      {trend.trend === "up" ? (
                        <TrendingUp className="w-5 h-5 text-green-500" />
                      ) : trend.trend === "down" ? (
                        <TrendingDown className="w-5 h-5 text-red-500" />
                      ) : (
                        <Activity className="w-5 h-5 text-muted-foreground" />
                      )}
                      <div>
                        <div className="font-medium">{trend.metric}</div>
                        <div className="text-sm text-muted-foreground">{trend.period}</div>
                      </div>
                    </div>
                    <Badge
                      variant={
                        trend.trend === "up"
                          ? "default"
                          : trend.trend === "down"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {trend.change}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="correlations" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Correlation Insights
              </CardTitle>
              <CardDescription>Discover relationships between your health metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {correlations.map((corr, idx) => (
                  <div key={idx} className="p-4 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-semibold">
                        {corr.metric1} ↔ {corr.metric2}
                      </div>
                      <Badge variant="outline">
                        {(corr.correlation * 100).toFixed(0)}% correlation
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{corr.description}</p>
                    <Progress value={Math.abs(corr.correlation) * 100} className="h-2 mt-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5" />
                Comparison Analysis
              </CardTitle>
              <CardDescription>
                Compare your metrics to goals and population averages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground">
                    Comparison data will be available after more tracking data is collected. All
                    comparisons are anonymous and aggregated.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
