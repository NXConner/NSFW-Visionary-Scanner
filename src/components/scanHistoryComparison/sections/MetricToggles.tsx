import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";

export function MetricToggles({
  showLength,
  showCircumference,
  showCurvature,
  onToggleLength,
  onToggleCircumference,
  onToggleCurvature,
}: {
  showLength: boolean;
  showCircumference: boolean;
  showCurvature: boolean;
  onToggleLength: () => void;
  onToggleCircumference: () => void;
  onToggleCurvature: () => void;
}): JSX.Element {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant={showLength ? "default" : "outline"}
        size="sm"
        onClick={onToggleLength}
        className="gap-2"
      >
        {showLength ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        Length
      </Button>
      <Button
        variant={showCircumference ? "default" : "outline"}
        size="sm"
        onClick={onToggleCircumference}
        className="gap-2"
      >
        {showCircumference ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        Circumference
      </Button>
      <Button
        variant={showCurvature ? "default" : "outline"}
        size="sm"
        onClick={onToggleCurvature}
        className="gap-2"
      >
        {showCurvature ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        Curvature
      </Button>
    </div>
  );
}
