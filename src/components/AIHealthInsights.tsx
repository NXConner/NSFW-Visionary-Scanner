/**
 * AI-Powered Health Insights Component
 * Displays daily insights, patterns, predictions, and "Ask AI" feature
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sparkles,
  Brain,
  TrendingUp,
  AlertTriangle,
  PartyPopper,
  Lightbulb,
  Send,
  Loader2,
  Calendar,
  Target,
  BarChart3,
} from "lucide-react";
import {
  getDailyInsights,
  getHealthPatterns,
  getHealthPredictions,
  askAIAboutProgress,
  markInsightRead,
  type DailyInsight,
  type HealthPattern,
  type HealthPrediction,
} from "@/lib/aiHealthInsights";
import { toast } from "sonner";
import { format } from "date-fns";

const insightIcons = {
  pattern: Brain,
  prediction: TrendingUp,
  recommendation: Lightbulb,
  warning: AlertTriangle,
  celebration: PartyPopper,
};

const insightColors = {
  pattern: "text-blue-500",
  prediction: "text-green-500",
  recommendation: "text-purple-500",
  warning: "text-yellow-500",
  celebration: "text-pink-500",
};

export const AIHealthInsights = () => {
  const [insights, setInsights] = useState<DailyInsight[]>([]);
  const [patterns, setPatterns] = useState<HealthPattern[]>([]);
  const [predictions, setPredictions] = useState<HealthPrediction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [askQuestion, setAskQuestion] = useState("");
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isAsking, setIsAsking] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const [insightsData, patternsData, predictionsData] = await Promise.all([
      getDailyInsights(),
      getHealthPatterns(),
      getHealthPredictions("6_months"),
    ]);
    setInsights(insightsData);
    setPatterns(patternsData);
    setPredictions(predictionsData);
    setIsLoading(false);
  };

  const handleAskAI = async () => {
    if (!askQuestion.trim()) {
      toast.error("Please enter a question");
      return;
    }

    setIsAsking(true);
    const response = await askAIAboutProgress(askQuestion);
    setAiResponse(response);
    setIsAsking(false);
    if (response) {
      setAskQuestion("");
    }
  };

  const handleMarkRead = async (insightId: string) => {
    await markInsightRead(insightId);
    await loadData();
  };

  const unreadInsights = insights.filter(i => !i.is_read);

  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Ask AI Section */}
      <Card className="glass-card border-primary/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Ask AI About Your Progress
          </CardTitle>
          <CardDescription>Get personalized insights about your health journey</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={askQuestion}
              onChange={e => setAskQuestion(e.target.value)}
              placeholder="e.g., 'Why is my wellness score improving?' or 'What should I focus on?'"
              onKeyPress={e => e.key === "Enter" && handleAskAI()}
              disabled={isAsking}
            />
            <Button
              onClick={handleAskAI}
              disabled={isAsking || !askQuestion.trim()}
              variant="gradient"
            >
              {isAsking ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          {aiResponse && (
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-4 h-4 text-primary" />
                <span className="font-semibold text-sm">AI Analysis</span>
              </div>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{aiResponse}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="insights" className="space-y-4">
        <TabsList>
          <TabsTrigger value="insights">
            Daily Insights
            {unreadInsights.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadInsights.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="patterns">Patterns</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Today's Insights
              </CardTitle>
              <CardDescription>Personalized health insights powered by AI</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {insights.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No insights yet. Keep tracking to receive personalized insights!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {insights.map(insight => {
                      const Icon = insightIcons[insight.insight_type];
                      const colorClass = insightColors[insight.insight_type];

                      return (
                        <div
                          key={insight.id}
                          className={`p-4 rounded-lg border ${
                            !insight.is_read ? "border-primary/50 bg-primary/5" : ""
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Icon className={`w-5 h-5 ${colorClass}`} />
                              <div>
                                <h4 className="font-semibold">{insight.title}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="outline" className="text-xs">
                                    {insight.category}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {insight.confidence}% confidence
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            {!insight.is_read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleMarkRead(insight.id)}
                              >
                                Mark Read
                              </Button>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">{insight.content}</p>
                          {insight.actionable && insight.action_items.length > 0 && (
                            <div className="mt-3 pt-3 border-t">
                              <div className="text-xs font-medium text-muted-foreground mb-2">
                                Action Items:
                              </div>
                              <ul className="space-y-1">
                                {insight.action_items.map((item, idx) => (
                                  <li
                                    key={idx}
                                    className="text-xs text-muted-foreground flex items-center gap-2"
                                  >
                                    <Target className="w-3 h-3" />
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                Health Patterns
              </CardTitle>
              <CardDescription>AI-identified patterns in your health data</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {patterns.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No patterns detected yet. More data needed for pattern recognition.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {patterns.map((pattern, idx) => (
                      <div key={idx} className="p-4 rounded-lg border">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold">{pattern.pattern_type}</h4>
                          <Badge variant="outline">
                            {(pattern.confidence * 100).toFixed(0)}% confidence
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{pattern.description}</p>
                        <div className="text-xs text-muted-foreground mb-2">
                          <span className="font-medium">Timeframe:</span> {pattern.timeframe}
                        </div>
                        <div className="text-xs text-muted-foreground mb-2">
                          <span className="font-medium">Affected Metrics:</span>{" "}
                          {pattern.affected_metrics.join(", ")}
                        </div>
                        <div className="mt-3 pt-3 border-t">
                          <div className="text-sm font-medium mb-1">Recommendation:</div>
                          <p className="text-sm text-muted-foreground">{pattern.recommendation}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Health Predictions
              </CardTitle>
              <CardDescription>AI-powered predictions for your health metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {predictions.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No predictions available yet. More tracking data needed.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {predictions.map((prediction, idx) => (
                      <div key={idx} className="p-4 rounded-lg border">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold capitalize">{prediction.metric}</h4>
                          <Badge variant="outline">
                            {(prediction.confidence * 100).toFixed(0)}% confidence
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mb-3">
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Current</div>
                            <div className="text-lg font-bold">{prediction.current_value}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">
                              Predicted ({prediction.timeframe})
                            </div>
                            <div className="text-lg font-bold text-primary">
                              {prediction.predicted_value}
                            </div>
                          </div>
                        </div>
                        {prediction.factors.length > 0 && (
                          <div className="text-xs text-muted-foreground">
                            <span className="font-medium">Key Factors:</span>{" "}
                            {prediction.factors.join(", ")}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
