import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, GitCompare } from "lucide-react";
import type { TimeRange } from "../types";

export function HeaderControls({
  totalEntries,
  daysCovered,
  timeRange,
  onTimeRangeChange,
}: {
  totalEntries: number;
  daysCovered: number;
  timeRange: TimeRange;
  onTimeRangeChange: (next: TimeRange) => void;
}): JSX.Element {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <GitCompare className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">Scan History Comparison</h3>
          <p className="text-sm text-muted-foreground">
            {totalEntries} entries over {daysCovered} days
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Select value={timeRange} onValueChange={v => onTimeRangeChange(v as TimeRange)}>
          <SelectTrigger className="w-32 h-9">
            <Calendar className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">7 days</SelectItem>
            <SelectItem value="30d">30 days</SelectItem>
            <SelectItem value="90d">90 days</SelectItem>
            <SelectItem value="6m">6 months</SelectItem>
            <SelectItem value="1y">1 year</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
