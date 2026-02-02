import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Layers, Sparkles } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { formatLength } from "@/lib/measurementsComparison";
import type { ScanEntry } from "../types";

export type ComparisonData = {
  first: ScanEntry;
  second: ScanEntry;
  daysBetween: number;
  lengthDiff: number;
  circumferenceDiff: number;
  curvatureDiff: number;
};

export function EntryComparison({
  data,
  selectedScans,
  onSelectScans,
  comparisonData,
}: {
  data: ScanEntry[];
  selectedScans: string[];
  onSelectScans: (next: string[]) => void;
  comparisonData: ComparisonData | null;
}): JSX.Element {
  const { measurementUnits } = useSettings();
  return (
    <Card className="glass-card border-border/50">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Layers className="w-4 h-4 text-primary" />
          Individual Scan Comparison
        </CardTitle>
        <CardDescription>Select two scans to compare side-by-side</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-48 pr-4">
          <div className="space-y-2">
            {data.map((entry, i) => {
              const isSelected = selectedScans.includes(entry.id);
              const select = () => {
                if (isSelected) {
                  onSelectScans(selectedScans.filter(id => id !== entry.id));
                } else if (selectedScans.length < 2) {
                  onSelectScans([...selectedScans, entry.id]);
                } else {
                  onSelectScans([selectedScans[1]!, entry.id]);
                }
              };

              return (
                <button
                  key={entry.id}
                  type="button"
                  onClick={select}
                  className={`w-full text-left flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                    isSelected
                      ? "bg-primary/10 border-primary/30"
                      : "bg-secondary/30 border-transparent hover:border-border/50"
                  }`}
                  aria-pressed={isSelected}
                  aria-label={`Select entry ${entry.fullDate}`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-mono ${
                        isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                      }`}
                    >
                      {i + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{entry.fullDate}</p>
                      <p className="text-xs text-muted-foreground">
                        {entry.source === "scan" ? "Camera Scan" : "Manual Entry"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    {entry.length != null && (
                      <span className="text-primary">
                        {formatLength(entry.length, measurementUnits)}
                      </span>
                    )}
                    {entry.curvatureAngle != null && (
                      <span className="text-muted-foreground ml-2">{entry.curvatureAngle}°</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </ScrollArea>

        {comparisonData && (
          <div className="mt-6 p-4 rounded-xl bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="font-semibold">Comparison Results</span>
              <Badge variant="outline" className="text-[10px]">
                {comparisonData.daysBetween} days apart
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="text-xs text-muted-foreground">FROM</div>
                <div className="p-3 rounded-lg bg-background/50">
                  <p className="font-medium">{comparisonData.first.fullDate}</p>
                  <div className="mt-2 space-y-1 text-sm">
                    {comparisonData.first.length != null && (
                      <p>Length: {formatLength(comparisonData.first.length, measurementUnits)}</p>
                    )}
                    {comparisonData.first.circumference != null && (
                      <p>
                        Circ: {formatLength(comparisonData.first.circumference, measurementUnits)}
                      </p>
                    )}
                    {comparisonData.first.curvatureAngle != null && (
                      <p>Curvature: {comparisonData.first.curvatureAngle}°</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-xs text-muted-foreground">TO</div>
                <div className="p-3 rounded-lg bg-background/50">
                  <p className="font-medium">{comparisonData.second.fullDate}</p>
                  <div className="mt-2 space-y-1 text-sm">
                    {comparisonData.second.length != null && (
                      <p>Length: {formatLength(comparisonData.second.length, measurementUnits)}</p>
                    )}
                    {comparisonData.second.circumference != null && (
                      <p>
                        Circ: {formatLength(comparisonData.second.circumference, measurementUnits)}
                      </p>
                    )}
                    {comparisonData.second.curvatureAngle != null && (
                      <p>Curvature: {comparisonData.second.curvatureAngle}°</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="text-center p-2 rounded-lg bg-primary/10">
                <div
                  className={`text-lg font-bold ${
                    comparisonData.lengthDiff > 0
                      ? "text-success"
                      : comparisonData.lengthDiff < 0
                        ? "text-destructive"
                        : ""
                  }`}
                >
                  {comparisonData.lengthDiff > 0 ? "+" : ""}
                  {formatLength(comparisonData.lengthDiff, measurementUnits)}
                </div>
                <div className="text-[10px] text-muted-foreground">Length Change</div>
              </div>
              <div className="text-center p-2 rounded-lg bg-accent/10">
                <div
                  className={`text-lg font-bold ${
                    comparisonData.circumferenceDiff > 0
                      ? "text-success"
                      : comparisonData.circumferenceDiff < 0
                        ? "text-destructive"
                        : ""
                  }`}
                >
                  {comparisonData.circumferenceDiff > 0 ? "+" : ""}
                  {formatLength(comparisonData.circumferenceDiff, measurementUnits)}
                </div>
                <div className="text-[10px] text-muted-foreground">Circ Change</div>
              </div>
              <div className="text-center p-2 rounded-lg bg-success/10">
                <div
                  className={`text-lg font-bold ${
                    comparisonData.curvatureDiff < 0
                      ? "text-success"
                      : comparisonData.curvatureDiff > 0
                        ? "text-destructive"
                        : ""
                  }`}
                >
                  {comparisonData.curvatureDiff > 0 ? "+" : ""}
                  {comparisonData.curvatureDiff.toFixed(1)}°
                </div>
                <div className="text-[10px] text-muted-foreground">Curvature Change</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
