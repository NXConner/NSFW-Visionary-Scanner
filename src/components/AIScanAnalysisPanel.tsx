import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Brain, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Loader2,
  ShieldAlert,
  TrendingUp
} from "lucide-react";
import { ScanAnalysisResult } from "@/hooks/useAIScanAnalysis";
import { VisualContentDisplay } from "./VisualContentDisplay";
import { useVisualContent } from "@/hooks/useVisualContent";
import { VISUAL_CONTENT_CATEGORIES } from "@/lib/visualContentManager";

interface AIScanAnalysisPanelProps {
  result: ScanAnalysisResult | null;
  isAnalyzing: boolean;
}

export const AIScanAnalysisPanel = ({ result, isAnalyzing }: AIScanAnalysisPanelProps) => {
  // Load visual content for analysis
  const { content: analysisVisuals } = useVisualContent({
    categories: [
      VISUAL_CONTENT_CATEGORIES.ANATOMY,
      VISUAL_CONTENT_CATEGORIES.HEALTH_CONDITIONS,
    ],
    autoLoad: true,
    autoInvert: true,
  });

  if (isAnalyzing) {
    return (
      <Card className="glass">
        <CardContent className="py-8">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <Brain className="w-12 h-12 text-primary animate-pulse" />
              <Loader2 className="w-6 h-6 text-primary absolute -bottom-1 -right-1 animate-spin" />
            </div>
            <div className="text-center">
              <p className="font-medium">AI Analysis in Progress</p>
              <p className="text-sm text-muted-foreground">Analyzing health indicators...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!result) return null;

  const getHealthColor = (health: string) => {
    switch (health) {
      case "good": return "bg-green-500/20 text-green-500 border-green-500/30";
      case "fair": return "bg-yellow-500/20 text-yellow-500 border-yellow-500/30";
      case "concerning": return "bg-red-500/20 text-red-500 border-red-500/30";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case "routine": return <Clock className="w-4 h-4" />;
      case "soon": return <TrendingUp className="w-4 h-4" />;
      case "urgent": return <AlertTriangle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "routine": return "bg-green-500/20 text-green-500";
      case "soon": return "bg-yellow-500/20 text-yellow-500";
      case "urgent": return "bg-red-500/20 text-red-500";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <Card className="glass">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Brain className="w-5 h-5 text-primary" />
          AI Health Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Health */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Overall Assessment</span>
          <Badge className={getHealthColor(result.overallHealth)}>
            {result.overallHealth === "good" && <CheckCircle className="w-3 h-3 mr-1" />}
            {result.overallHealth === "concerning" && <AlertTriangle className="w-3 h-3 mr-1" />}
            {result.overallHealth.charAt(0).toUpperCase() + result.overallHealth.slice(1)}
          </Badge>
        </div>

        {/* Confidence Level */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Confidence Level</span>
            <span className="font-medium">{result.confidenceLevel}%</span>
          </div>
          <Progress value={result.confidenceLevel} className="h-2" />
        </div>

        {/* Curvature Assessment */}
        {result.curvatureAssessment.detected && (
          <div className="p-3 rounded-lg bg-muted/50 space-y-2">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              <span className="font-medium text-sm">Curvature Detected</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {result.curvatureAssessment.estimatedAngle && (
                <div>
                  <span className="text-muted-foreground">Angle:</span>
                  <span className="ml-2 font-medium">{result.curvatureAssessment.estimatedAngle}°</span>
                </div>
              )}
              {result.curvatureAssessment.direction && (
                <div>
                  <span className="text-muted-foreground">Direction:</span>
                  <span className="ml-2 font-medium">{result.curvatureAssessment.direction}</span>
                </div>
              )}
              {result.curvatureAssessment.severity && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">Severity:</span>
                  <Badge variant="outline" className="ml-2 text-xs">
                    {result.curvatureAssessment.severity}
                  </Badge>
                </div>
              )}
            </div>
            {/* Visual reference for curvature */}
            {analysisVisuals.length > 0 && (
              <div className="mt-3 pt-3 border-t border-border/50">
                <VisualContentDisplay
                  content={analysisVisuals.filter(v =>
                    v.tags.some(tag => tag.includes('curvature') || tag.includes('angle'))
                  ).slice(0, 1)}
                  title="Curvature Reference"
                  showThumbnails={false}
                />
              </div>
            )}
          </div>
        )}

        {/* Skin Health */}
        <div className="p-3 rounded-lg bg-muted/50 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-medium text-sm">Skin Health</span>
            <Badge variant="outline" className="text-xs">
              {result.skinHealth.status.replace("_", " ")}
            </Badge>
          </div>
          {result.skinHealth.observations.length > 0 && (
            <ul className="text-xs text-muted-foreground space-y-1">
              {result.skinHealth.observations.map((obs, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  {obs}
                </li>
              ))}
            </ul>
          )}
          {/* Visual reference for skin health */}
          {analysisVisuals.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border/50">
              <VisualContentDisplay
                content={analysisVisuals.filter(v =>
                  v.tags.some(tag => tag.includes('skin') || tag.includes('health'))
                ).slice(0, 1)}
                title="Skin Health Reference"
                showThumbnails={false}
              />
            </div>
          )}
        </div>

        {/* Urgency */}
        <div className="flex items-center justify-between">
          <span className="text-sm">Follow-up Urgency</span>
          <Badge className={getUrgencyColor(result.urgency)}>
            {getUrgencyIcon(result.urgency)}
            <span className="ml-1">{result.urgency}</span>
          </Badge>
        </div>

        {/* Recommendations */}
        {result.recommendations.length > 0 && (
          <div className="space-y-2">
            <span className="text-sm font-medium">Recommendations</span>
            <ul className="space-y-1.5">
              {result.recommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <CheckCircle className="w-3 h-3 text-primary mt-0.5 flex-shrink-0" />
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Disclaimer */}
        <Alert className="border-amber-500/30 bg-amber-500/10">
          <ShieldAlert className="h-4 w-4 text-amber-500" />
          <AlertDescription className="text-xs text-amber-200/80">
            {result.disclaimer}
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};
