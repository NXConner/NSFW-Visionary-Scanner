import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import type { QualityAssessment } from "@/lib/aiEnhancedScanning";

export function QualityTab({
  selectedScanId,
  loading,
  qualityAssessment,
  onAssess,
}: {
  selectedScanId: string | null;
  loading: boolean;
  qualityAssessment: QualityAssessment | null;
  onAssess: () => void;
}): JSX.Element {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Quality Assessment</CardTitle>
          <Button onClick={onAssess} disabled={loading || !selectedScanId}>
            <Eye className="w-4 h-4 mr-2" />
            Assess Quality
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {qualityAssessment ? (
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Overall Quality Score</span>
                <Badge variant="outline" className="text-lg">
                  {Math.round(qualityAssessment.overall_score * 100)}%
                </Badge>
              </div>
              <div className="mt-4 space-y-2">
                {qualityAssessment.lighting_score !== null && (
                  <div className="flex justify-between text-sm">
                    <span>Lighting:</span>
                    <span>{Math.round(qualityAssessment.lighting_score * 100)}%</span>
                  </div>
                )}
                {qualityAssessment.focus_score !== null && (
                  <div className="flex justify-between text-sm">
                    <span>Focus:</span>
                    <span>{Math.round(qualityAssessment.focus_score * 100)}%</span>
                  </div>
                )}
                {qualityAssessment.angle_score !== null && (
                  <div className="flex justify-between text-sm">
                    <span>Angle:</span>
                    <span>{Math.round(qualityAssessment.angle_score * 100)}%</span>
                  </div>
                )}
              </div>
            </div>

            {qualityAssessment.recommendations && qualityAssessment.recommendations.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Recommendations:</p>
                <ul className="list-disc list-inside text-sm text-muted-foreground">
                  {qualityAssessment.recommendations.map((rec, idx) => (
                    <li key={idx}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}

            {qualityAssessment.critical_issues && qualityAssessment.critical_issues.length > 0 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded">
                <p className="text-sm font-medium text-red-900 mb-1">Critical Issues:</p>
                <ul className="list-disc list-inside text-sm text-red-800">
                  {qualityAssessment.critical_issues.map((issue, idx) => (
                    <li key={idx}>{issue}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">
            Click "Assess Quality" to analyze scan quality
          </p>
        )}
      </CardContent>
    </Card>
  );
}
