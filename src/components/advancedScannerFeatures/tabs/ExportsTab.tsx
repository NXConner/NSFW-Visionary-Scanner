import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  export3DModel,
  getExported3DModels,
  getMultiAngleScanSessions,
  type Exported3DModel,
  type MultiAngleScanSession,
} from "@/lib/advancedScannerFeatures";
import { Download, FileDown, Plus } from "lucide-react";

function safeSessionLabel(s: MultiAngleScanSession): string {
  return String(s.session_name || "").trim() || `Session ${s.id.slice(0, 8)}`;
}

export function ExportsTab({ isActive }: { isActive: boolean }): JSX.Element {
  const [loading, setLoading] = useState(false);
  const [exports, setExports] = useState<Exported3DModel[]>([]);
  const [sessions, setSessions] = useState<MultiAngleScanSession[]>([]);

  const [sessionId, setSessionId] = useState<string>("");
  const [format, setFormat] = useState<Exported3DModel["export_format"]>("gltf");
  const [quality, setQuality] = useState<Exported3DModel["quality_level"]>("high");
  const [includeTexture, setIncludeTexture] = useState(true);
  const [includeMeasurements, setIncludeMeasurements] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [exp, sess] = await Promise.all([
        getExported3DModels(),
        getMultiAngleScanSessions({ limit: 60, includeCompleted: true }),
      ]);
      // Prefer 3D reconstruction sessions.
      const only3d = sess.filter(s => String(s.scan_type) === "3d_reconstruction");
      setExports(exp);
      setSessions(only3d);
      if (!sessionId && only3d[0]) setSessionId(only3d[0].id);
    } catch {
      toast.error("Failed to load exports");
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    if (!isActive) return;
    void refresh();
  }, [isActive, refresh]);

  const canQueue = useMemo(() => Boolean(sessionId && !loading), [loading, sessionId]);

  const handleQueue = useCallback(async () => {
    if (!canQueue) return;
    setLoading(true);
    try {
      const result = await export3DModel(
        sessionId,
        format,
        quality,
        includeTexture,
        includeMeasurements,
      );
      if (!result) {
        toast.success("Export queued", {
          description:
            "If the session has not produced a reconstructed model yet, the export will remain queued until processing completes.",
        });
        return;
      }
      toast.success("Export created");
      setExports(prev => [result, ...prev]);
    } catch {
      toast.error("Failed to export model");
    } finally {
      setLoading(false);
    }
  }, [canQueue, format, includeMeasurements, includeTexture, quality, sessionId]);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileDown className="w-4 h-4" />
            New export
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label>Session</Label>
            <Select value={sessionId} onValueChange={setSessionId} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder="Select a session" />
              </SelectTrigger>
              <SelectContent>
                {sessions.map(s => (
                  <SelectItem key={s.id} value={s.id}>
                    {safeSessionLabel(s)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label>Format</Label>
              <Select
                value={format}
                onValueChange={v => setFormat(v as Exported3DModel["export_format"])}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gltf">glTF</SelectItem>
                  <SelectItem value="obj">OBJ</SelectItem>
                  <SelectItem value="stl">STL</SelectItem>
                  <SelectItem value="ply">PLY</SelectItem>
                  <SelectItem value="fbx">FBX</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Quality</Label>
              <Select
                value={quality}
                onValueChange={v => setQuality(v as Exported3DModel["quality_level"])}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="ultra">Ultra</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <div className="text-sm font-medium">Include texture</div>
              <div className="text-xs text-muted-foreground">If available in the session.</div>
            </div>
            <Switch
              checked={includeTexture}
              onCheckedChange={setIncludeTexture}
              disabled={loading}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <div className="text-sm font-medium">Include measurements</div>
              <div className="text-xs text-muted-foreground">Embed metadata where supported.</div>
            </div>
            <Switch
              checked={includeMeasurements}
              onCheckedChange={setIncludeMeasurements}
              disabled={loading}
            />
          </div>

          <Button className="w-full" onClick={() => void handleQueue()} disabled={!canQueue}>
            <Plus className="w-4 h-4 mr-2" />
            Queue export
          </Button>

          <p className="text-xs text-muted-foreground">
            Exports are generated from reconstructed session models. If your deployment runs a
            background worker, queued exports will complete automatically.
          </p>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Exports</CardTitle>
          <Button variant="outline" size="sm" onClick={() => void refresh()} disabled={loading}>
            Refresh
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {exports.length === 0 ? (
            <p className="text-sm text-muted-foreground">No exports yet.</p>
          ) : (
            exports.map(exp => (
              <Card key={exp.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium">Export {exp.export_format.toUpperCase()}</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Badge variant="outline">{exp.quality_level}</Badge>
                        {exp.file_size_bytes != null && (
                          <Badge variant="secondary">
                            {(Number(exp.file_size_bytes) / 1024 / 1024).toFixed(2)} MB
                          </Badge>
                        )}
                        {exp.include_texture && <Badge variant="outline">Texture</Badge>}
                        {exp.include_measurements && <Badge variant="outline">Measurements</Badge>}
                      </div>
                    </div>
                    <Button
                      onClick={() => window.open(exp.file_url, "_blank", "noopener,noreferrer")}
                      variant="outline"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
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
