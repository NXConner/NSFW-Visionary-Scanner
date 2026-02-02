import { Card, CardContent } from "@/components/ui/card";
import { Eye, Hand, Move, Smartphone, Sun } from "lucide-react";

interface QualityMeterProps {
  lighting: number;
  stability: number;
  focus: number;
  distance: number;
  tilt: number;
}

export const QualityMeter = ({ lighting, stability, focus, distance, tilt }: QualityMeterProps) => {
  const overall = Math.round((lighting + stability + focus + distance + tilt) / 5);

  const getColor = (value: number) => {
    if (value >= 80) return "bg-success";
    if (value >= 50) return "bg-warning";
    return "bg-destructive";
  };

  const metrics = [
    { label: "Light", value: lighting, icon: Sun },
    { label: "Stable", value: stability, icon: Hand },
    { label: "Focus", value: focus, icon: Eye },
    { label: "Distance", value: distance, icon: Move },
    { label: "Level", value: tilt, icon: Smartphone },
  ];

  return (
    <div className="absolute top-16 left-2 z-20">
      <Card className="bg-background/95 backdrop-blur-md border-border/50 w-32 shadow-lg">
        <CardContent className="p-2 space-y-2">
          <div className="flex items-center gap-2 pb-2 border-b border-border/50">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${getColor(overall)} text-white`}
            >
              {overall}
            </div>
            <div>
              <p className="text-[10px] font-medium">Quality</p>
              <p className="text-[9px] text-muted-foreground">
                {overall >= 80 ? "Excellent" : overall >= 50 ? "Fair" : "Poor"}
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            {metrics.map(metric => {
              const Icon = metric.icon;
              return (
                <div key={metric.label} className="flex items-center gap-2">
                  <Icon className="w-3 h-3 text-muted-foreground" />
                  <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${getColor(metric.value)}`}
                      style={{ width: `${metric.value}%` }}
                    />
                  </div>
                  <span className="text-[9px] font-mono w-6 text-right">{metric.value}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
