import { useCallback, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  analyzeScanWithAI,
  applyMeasurementSuggestion,
  assessScanQuality,
  detectAnomalies,
  generateHealthTrendVisualization,
  getAnomalies,
  getMeasurementSuggestions,
  type AIScanAnalysis,
  type MeasurementSuggestion,
  type QualityAssessment,
  type AnomalyDetection,
  type HealthTrendVisualization,
} from "@/lib/aiEnhancedScanning";
import { AlertTriangle, Brain, CheckCircle, Lightbulb, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { AnalysisTab } from "./tabs/AnalysisTab";
import { SuggestionsTab } from "./tabs/SuggestionsTab";
import { QualityTab } from "./tabs/QualityTab";
import { AnomaliesTab } from "./tabs/AnomaliesTab";
import { TrendsTab } from "./tabs/TrendsTab";

type TabKey = "analysis" | "suggestions" | "quality" | "anomalies" | "trends";

export const AIEnhancedScanning = (): JSX.Element => {
  const [activeTab, setActiveTab] = useState<TabKey>("analysis");
  const [loading, setLoading] = useState(false);
  const [selectedScanId, setSelectedScanId] = useState<string | null>(null);

  const [analyses, setAnalyses] = useState<AIScanAnalysis[]>([]);
  const [suggestions, setSuggestions] = useState<MeasurementSuggestion[]>([]);
  const [qualityAssessment, setQualityAssessment] = useState<QualityAssessment | null>(null);
  const [anomalies, setAnomalies] = useState<AnomalyDetection[]>([]);
  const [visualizations, setVisualizations] = useState<HealthTrendVisualization[]>([]);

  const loadScanData = useCallback(async () => {
    if (!selectedScanId) return;
    setLoading(true);
    try {
      const [suggestionsData, anomaliesData] = await Promise.all([
        getMeasurementSuggestions(selectedScanId),
        getAnomalies(selectedScanId),
      ]);
      setSuggestions(suggestionsData);
      setAnomalies(anomaliesData);
    } catch {
      toast.error("Failed to load scan data");
    } finally {
      setLoading(false);
    }
  }, [selectedScanId]);

  useEffect(() => {
    if (!selectedScanId) return;
    void loadScanData();
  }, [loadScanData, selectedScanId]);

  const handleAnalyzeScan = useCallback(async () => {
    if (!selectedScanId) {
      toast.error("Please select a scan");
      return;
    }
    setLoading(true);
    try {
      const analysisTypes: AIScanAnalysis["analysis_type"][] = [
        "health_detection",
        "measurement_suggestion",
        "quality_assessment",
        "anomaly_detection",
      ];
      const results = await analyzeScanWithAI(selectedScanId, analysisTypes);
      setAnalyses(results);
      toast.success("Scan analyzed!");
    } finally {
      setLoading(false);
    }
  }, [selectedScanId]);

  const handleAssessQuality = useCallback(async () => {
    if (!selectedScanId) {
      toast.error("Please select a scan");
      return;
    }
    setLoading(true);
    try {
      const assessment = await assessScanQuality(selectedScanId);
      setQualityAssessment(assessment);
    } finally {
      setLoading(false);
    }
  }, [selectedScanId]);

  const handleDetectAnomalies = useCallback(async () => {
    if (!selectedScanId) {
      toast.error("Please select a scan");
      return;
    }
    setLoading(true);
    try {
      const detected = await detectAnomalies(selectedScanId);
      setAnomalies(detected);
    } finally {
      setLoading(false);
    }
  }, [selectedScanId]);

  const handleApplySuggestion = useCallback(
    async (suggestionId: string) => {
      setLoading(true);
      try {
        const success = await applyMeasurementSuggestion(suggestionId);
        if (success) await loadScanData();
      } finally {
        setLoading(false);
      }
    },
    [loadScanData],
  );

  const handleGenerateTrend = useCallback(
    async (type: HealthTrendVisualization["visualization_type"]) => {
      setLoading(true);
      try {
        const viz = await generateHealthTrendVisualization(type);
        if (viz) setVisualizations(prev => [viz, ...prev]);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">AI-Enhanced Scanning</h1>
        <p className="text-muted-foreground">
          Real-time health detection, measurement suggestions, quality assessment, and anomaly
          detection
        </p>
      </div>

      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <Input
              placeholder="Enter Scan ID"
              value={selectedScanId || ""}
              onChange={e => setSelectedScanId(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleAnalyzeScan} disabled={loading || !selectedScanId}>
              <Brain className="w-4 h-4 mr-2" />
              Analyze Scan
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={v => setActiveTab(v as TabKey)}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="analysis">
            <Brain className="w-4 h-4 mr-2" />
            AI Analysis
          </TabsTrigger>
          <TabsTrigger value="suggestions">
            <Lightbulb className="w-4 h-4 mr-2" />
            Suggestions
          </TabsTrigger>
          <TabsTrigger value="quality">
            <CheckCircle className="w-4 h-4 mr-2" />
            Quality
          </TabsTrigger>
          <TabsTrigger value="anomalies">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Anomalies
          </TabsTrigger>
          <TabsTrigger value="trends">
            <TrendingUp className="w-4 h-4 mr-2" />
            Trends
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analysis" className="mt-4">
          <AnalysisTab analyses={analyses} />
        </TabsContent>
        <TabsContent value="suggestions" className="mt-4">
          <SuggestionsTab
            suggestions={suggestions}
            loading={loading}
            onApply={id => void handleApplySuggestion(id)}
          />
        </TabsContent>
        <TabsContent value="quality" className="mt-4">
          <QualityTab
            selectedScanId={selectedScanId}
            loading={loading}
            qualityAssessment={qualityAssessment}
            onAssess={() => void handleAssessQuality()}
          />
        </TabsContent>
        <TabsContent value="anomalies" className="mt-4">
          <AnomaliesTab
            selectedScanId={selectedScanId}
            loading={loading}
            anomalies={anomalies}
            onDetect={() => void handleDetectAnomalies()}
          />
        </TabsContent>
        <TabsContent value="trends" className="mt-4">
          <TrendsTab
            loading={loading}
            visualizations={visualizations}
            onGenerate={t => void handleGenerateTrend(t)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
