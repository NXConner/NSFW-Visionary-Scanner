import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  createTimeLapseComparison,
  getRecentScans,
  getTimeLapseComparisons,
  type RecentScanSummary,
  type TimeLapseComparison,
} from "@/lib/advancedScannerFeatures";
import { Clock, Plus } from "lucide-react";

function formatScanLabel(scan: RecentScanSummary): string {
  const when = new Date(String(scan.scanned_at || scan.created_at || new Date().toISOString()));
  const date = Number.isFinite(when.getTime()) ? when.toLocaleString() : "Unknown date";
  const parts: string[] = [];
  if (scan.length != null) parts.push(`L ${Number(scan.length).toFixed(2)}`);
  if (scan.girth != null) parts.push(`G ${Number(scan.girth).toFixed(2)}`);
  const suffix = parts.length ? ` — ${parts.join("  ")}` : "";
  return `${date}${suffix}`;
}

function buildDefaultComparisonName(
  start?: RecentScanSummary | null,
  end?: RecentScanSummary | null,
): string {
  const a = start
    ? new Date(String(start.scanned_at || start.created_at)).toLocaleDateString()
    : "Start";
  const b = end ? new Date(String(end.scanned_at || end.created_at)).toLocaleDateString() : "End";
  return `${a} → ${b}`;
}

export function TimeLapseTab({ isActive }: { isActive: boolean }): JSX.Element {
  const [loading, setLoading] = useState(false);
  const [recentScans, setRecentScans] = useState<RecentScanSummary[]>([]);
  const [comparisons, setComparisons] = useState<TimeLapseComparison[]>([]);

  const [startId, setStartId] = useState<string>("");
  const [endId, setEndId] = useState<string>("");
  const [comparisonName, setComparisonName] = useState<string>("");

  const startScan = useMemo(
    () => recentScans.find(s => s.id === startId) ?? null,
    [recentScans, startId],
  );
  const endScan = useMemo(
    () => recentScans.find(s => s.id === endId) ?? null,
    [recentScans, endId],
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [scans, comps] = await Promise.all([
        getRecentScans({ limit: 80 }),
        getTimeLapseComparisons(),
      ]);
      setRecentScans(scans);
      setComparisons(comps);
    } catch {
      toast.error("Failed to load time-lapse data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isActive) return;
    void refresh();
  }, [isActive, refresh]);

  useEffect(() => {
    // Auto-fill a friendly name if empty.
    if (!isActive) return;
    if (comparisonName.trim()) return;
    if (!startScan && !endScan) return;
    setComparisonName(buildDefaultComparisonName(startScan, endScan));
  }, [comparisonName, endScan, isActive, startScan]);

  const canCreate = Boolean(startId && endId && startId !== endId && !loading);

  const handleCreate = useCallback(async () => {
    if (!canCreate) return;
    setLoading(true);
    try {
      const name = comparisonName.trim() || buildDefaultComparisonName(startScan, endScan);
      const created = await createTimeLapseComparison(startId, endId, name);
      if (created) {
        toast.success("Comparison created");
        setComparisons(prev => [created, ...prev]);
      }
    } catch {
      toast.error("Failed to create comparison");
    } finally {
      setLoading(false);
    }
  }, [canCreate, comparisonName, endId, startId, endScan, startScan]);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="w-4 h-4" />
            New comparison
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <div className="text-sm font-medium">Start scan</div>
            <Select value={startId} onValueChange={setStartId} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder="Select a scan" />
              </SelectTrigger>
              <SelectContent>
                {recentScans.map(scan => (
                  <SelectItem key={scan.id} value={scan.id}>
                    {formatScanLabel(scan)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">End scan</div>
            <Select value={endId} onValueChange={setEndId} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder="Select a scan" />
              </SelectTrigger>
              <SelectContent>
                {recentScans.map(scan => (
                  <SelectItem key={scan.id} value={scan.id}>
                    {formatScanLabel(scan)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">Name (optional)</div>
            <Input
              value={comparisonName}
              onChange={e => setComparisonName(e.target.value)}
              placeholder="e.g., 30 day progress"
              disabled={loading}
            />
          </div>

          <Button onClick={() => void handleCreate()} disabled={!canCreate} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Create
          </Button>

          <p className="text-xs text-muted-foreground">
            Comparisons use real scan measurements from your account to compute deltas.
          </p>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Existing comparisons</CardTitle>
          <Button variant="outline" size="sm" onClick={() => void refresh()} disabled={loading}>
            Refresh
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {comparisons.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No comparisons yet. Create one to track change over time.
            </p>
          ) : (
            comparisons.map(c => (
              <Card key={c.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium">{c.comparison_name || "Comparison"}</div>
                      {c.time_period_days != null && (
                        <div className="text-xs text-muted-foreground">
                          {c.time_period_days} days
                        </div>
                      )}
                      <div className="mt-2 flex flex-wrap gap-2">
                        {c.length_change != null && (
                          <Badge variant="outline">
                            Length {c.length_change > 0 ? "+" : ""}
                            {Number(c.length_change).toFixed(2)}
                          </Badge>
                        )}
                        {c.circumference_change != null && (
                          <Badge variant="outline">
                            Girth {c.circumference_change > 0 ? "+" : ""}
                            {Number(c.circumference_change).toFixed(2)}
                          </Badge>
                        )}
                        {c.growth_percentage != null && (
                          <Badge variant="secondary">
                            {c.growth_percentage > 0 ? "+" : ""}
                            {Number(c.growth_percentage).toFixed(1)}%
                          </Badge>
                        )}
                      </div>
                    </div>
                    {c.comparison_image_url && (
                      <img
                        src={c.comparison_image_url}
                        alt="Comparison"
                        className="w-24 h-24 object-cover rounded"
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
