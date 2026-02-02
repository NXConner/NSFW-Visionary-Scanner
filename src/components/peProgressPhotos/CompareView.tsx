import { format } from "date-fns";
import { ArrowLeftRight, Calendar, ImageIcon, Plus, Ruler, ZoomIn } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FilteredImage } from "@/components/media/FilteredImage";

import type { PEProgressEntry } from "./types";
import { getComparison } from "./comparison";
import { MeasurementRow, TrendIcon } from "./utils";

export function CompareView(props: {
  entries: PEProgressEntry[];
  selectedLeft: string;
  selectedRight: string;
  onSelectLeft: (id: string) => void;
  onSelectRight: (id: string) => void;
  onZoom: (imageData: string) => void;
  onAddFirst: () => void;
}) {
  const leftEntry = props.entries.find(e => e.id === props.selectedLeft);
  const rightEntry = props.entries.find(e => e.id === props.selectedRight);

  if (props.entries.length < 2) {
    return (
      <Card className="glass-card border-border/50 mb-6">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="p-4 rounded-full bg-muted/30 mb-4">
            <ImageIcon className="w-12 h-12 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Start Tracking Your Progress</h3>
          <p className="text-muted-foreground max-w-md mb-4">
            Add at least 2 progress entries with photos and measurements to compare your PE journey.
          </p>
          <Button onClick={props.onAddFirst}>
            <Plus className="w-4 h-4 mr-2" /> Add First Entry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const comparison = leftEntry && rightEntry ? getComparison(leftEntry, rightEntry) : null;

  return (
    <>
      <Card className="glass-card border-border/50 mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-primary" />
            Select Entries to Compare
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-sm font-medium" htmlFor="pe-compare-left">
                Earlier Entry
              </label>
              <Select value={props.selectedLeft} onValueChange={props.onSelectLeft}>
                <SelectTrigger id="pe-compare-left">
                  <SelectValue placeholder="Select earlier entry" />
                </SelectTrigger>
                <SelectContent>
                  {props.entries.map(entry => (
                    <SelectItem key={entry.id} value={entry.id}>
                      {format(new Date(entry.date), "MMM d, yyyy")} - BPEL: {entry.lengthBPEL}cm
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              <label className="text-sm font-medium" htmlFor="pe-compare-right">
                Later Entry
              </label>
              <Select value={props.selectedRight} onValueChange={props.onSelectRight}>
                <SelectTrigger id="pe-compare-right">
                  <SelectValue placeholder="Select later entry" />
                </SelectTrigger>
                <SelectContent>
                  {props.entries.map(entry => (
                    <SelectItem key={entry.id} value={entry.id}>
                      {format(new Date(entry.date), "MMM d, yyyy")} - BPEL: {entry.lengthBPEL}cm
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {leftEntry && rightEntry && (
        <>
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {[leftEntry, rightEntry].map((entry, idx) => (
              <Card key={entry.id} className="glass-card border-border/50 overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Badge
                      variant="outline"
                      className={idx === 0 ? "border-primary/30" : "border-accent/30"}
                    >
                      <Calendar className="w-3 h-3 mr-1" />
                      {format(new Date(entry.date), "MMM d, yyyy")}
                    </Badge>
                    <Button size="sm" variant="ghost" onClick={() => props.onZoom(entry.imageData)}>
                      <ZoomIn className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="aspect-square rounded-lg overflow-hidden bg-muted/20 mb-4 relative">
                    <FilteredImage
                      src={entry.imageData}
                      alt="Progress"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 px-2 py-1 rounded text-xs">
                        <Ruler className="w-3 h-3 inline mr-1" />
                        {entry.lengthBPEL} cm
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1 text-sm">
                    <MeasurementRow label="BPEL" value={entry.lengthBPEL} />
                    <MeasurementRow label="NBPEL" value={entry.lengthNBPEL} />
                    <MeasurementRow label="Flaccid" value={entry.lengthFlaccid} />
                    <MeasurementRow label="Girth (Base)" value={entry.girthBase} />
                    <MeasurementRow label="Girth (Mid)" value={entry.girthMid} />
                    <MeasurementRow label="Girth (Head)" value={entry.girthHead} />
                  </div>
                  {entry.routine && (
                    <p className="text-xs text-muted-foreground mt-2">Routine: {entry.routine}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {comparison && (
            <Card className="glass-card border-border/50">
              <CardHeader>
                <CardTitle>Change Analysis</CardTitle>
                <CardDescription>
                  {format(new Date(leftEntry.date), "MMM d")} to{" "}
                  {format(new Date(rightEntry.date), "MMM d, yyyy")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { label: "BPEL", diff: comparison.bpelDiff },
                    { label: "NBPEL", diff: comparison.nbpelDiff },
                    { label: "Flaccid", diff: comparison.flaccidDiff },
                    { label: "Girth (Base)", diff: comparison.girthBaseDiff },
                    { label: "Girth (Mid)", diff: comparison.girthMidDiff },
                    { label: "Girth (Head)", diff: comparison.girthHeadDiff },
                  ].map(item => (
                    <div
                      key={item.label}
                      className="p-3 rounded-lg bg-muted/20 border border-border/50"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-muted-foreground text-xs">{item.label}</span>
                        <TrendIcon value={item.diff} />
                      </div>
                      <p
                        className={`text-lg font-bold ${
                          item.diff > 0 ? "text-green-400" : item.diff < 0 ? "text-red-400" : ""
                        }`}
                      >
                        {item.diff > 0 ? "+" : ""}
                        {item.diff.toFixed(2)} cm
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </>
  );
}
