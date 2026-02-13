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
  createBatchScanSession,
  getBatchScanSessions,
  type BatchScanSession,
} from "@/lib/advancedScannerFeatures";
import { Layers, Plus } from "lucide-react";

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function progressPct(s: BatchScanSession): number {
  const target = Number(s.target_count ?? 0);
  const captured = Number(s.scans_captured ?? 0);
  if (!target || target <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((captured / target) * 100)));
}

export function BatchTab({ isActive }: { isActive: boolean }): JSX.Element {
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<BatchScanSession[]>([]);

  const [name, setName] = useState("");
  const [batchType, setBatchType] = useState<BatchScanSession["batch_type"]>("custom");
  const [targetCount, setTargetCount] = useState(10);
  const [intervalMinutes, setIntervalMinutes] = useState<number | "">("");

  const canCreate = useMemo(() => name.trim().length > 0 && !loading, [loading, name]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getBatchScanSessions({ limit: 60 });
      setSessions(data);
    } catch {
      toast.error("Failed to load batch sessions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isActive) return;
    void refresh();
  }, [isActive, refresh]);

  const handleCreate = useCallback(async () => {
    if (!canCreate) return;
    setLoading(true);
    try {
      const created = await createBatchScanSession(
        name.trim(),
        batchType,
        clamp(targetCount, 1, 500),
        intervalMinutes === "" ? undefined : clamp(Number(intervalMinutes), 1, 24 * 60),
      );
      if (!created) {
        toast.error("Failed to create batch session");
        return;
      }
      toast.success("Batch session created");
      setSessions(prev => [created, ...prev]);
      setName("");
      setBatchType("custom");
      setTargetCount(10);
      setIntervalMinutes("");
    } catch {
      toast.error("Failed to create batch session");
    } finally {
      setLoading(false);
    }
  }, [batchType, canCreate, intervalMinutes, name, targetCount]);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Layers className="w-4 h-4" />
            New batch session
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Session name"
            disabled={loading}
          />

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Type</div>
              <Select
                value={batchType}
                onValueChange={v => setBatchType(v as BatchScanSession["batch_type"])}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="routine">Routine</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Target scans</div>
              <Input
                type="number"
                min={1}
                max={500}
                value={targetCount}
                onChange={e => setTargetCount(clamp(parseInt(e.target.value) || 1, 1, 500))}
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Interval minutes (optional)</div>
            <Input
              type="number"
              min={1}
              max={1440}
              value={intervalMinutes}
              onChange={e => {
                const v = e.target.value;
                setIntervalMinutes(v === "" ? "" : clamp(parseInt(v) || 1, 1, 1440));
              }}
              placeholder="e.g., 60"
              disabled={loading || batchType !== "custom"}
            />
            {batchType !== "custom" && (
              <div className="text-[11px] text-muted-foreground">
                Interval is only used for custom batch sessions.
              </div>
            )}
          </div>

          <Button className="w-full" onClick={() => void handleCreate()} disabled={!canCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Create
          </Button>

          <p className="text-xs text-muted-foreground">
            Batch sessions track planned scan capture counts. Actual capture automation is handled
            by the scanner workflow and any scheduled jobs in your deployment.
          </p>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Batch sessions</CardTitle>
          <Button variant="outline" size="sm" onClick={() => void refresh()} disabled={loading}>
            Refresh
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No batch sessions yet.</p>
          ) : (
            sessions.map(s => (
              <Card key={s.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium">{s.session_name || "Batch session"}</div>
                      <div className="text-xs text-muted-foreground">
                        {s.scans_captured} / {s.target_count ?? "?"} scans
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Badge variant="outline">{s.batch_type}</Badge>
                        <Badge variant="secondary">{progressPct(s)}%</Badge>
                        {s.is_complete && <Badge variant="outline">Complete</Badge>}
                      </div>
                    </div>
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
