import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  addAngleToSession,
  createMultiAngleScanSession,
  getMultiAngleScanImages,
  getMultiAngleScanSessions,
  start3DReconstruction,
  type MultiAngleScanImage,
  type MultiAngleScanSession,
} from "@/lib/advancedScannerFeatures";
import { uploadFile } from "@/lib/mediaUpload";
import { StatusBadge } from "@/components/advancedScannerFeatures/shared/StatusBadge";
import { Camera, Image, Play, RefreshCw } from "lucide-react";

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function inferAngleIndexFromName(fileName: string): number | null {
  const name = String(fileName || "").toLowerCase();
  // Accept: angle-1.png, angle_01.jpg, a-3.webp, etc.
  const m = name.match(/(?:^|[^a-z0-9])(?:angle|a)[-_ ]?(\d{1,2})(?:[^0-9]|$)/i);
  if (!m?.[1]) return null;
  const raw = Number(m[1]);
  if (!Number.isFinite(raw)) return null;
  if (raw < 0) return null;
  // User-friendly: treat "angle-1" as the first angle (0-based index).
  if (raw >= 1) return raw - 1;
  return 0;
}

function computeAngleDegrees(angleIndex: number, targetAngles: number): number {
  const target = Math.max(1, Number(targetAngles) || 1);
  const deg = (Number(angleIndex) / target) * 360;
  return Math.round(deg * 10) / 10;
}

function safeLabel(session: MultiAngleScanSession): string {
  const name = String(session.session_name || "").trim();
  return name || `3D Session (${session.id.slice(0, 8)})`;
}

function byNewest(a: MultiAngleScanSession, b: MultiAngleScanSession): number {
  return String(b.created_at || "").localeCompare(String(a.created_at || ""));
}

export function ReconstructionTab({ isActive }: { isActive: boolean }): JSX.Element {
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<MultiAngleScanSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [images, setImages] = useState<MultiAngleScanImage[]>([]);

  const [newSessionName, setNewSessionName] = useState("");
  const [targetAngles, setTargetAngles] = useState(8);

  const [uploading, setUploading] = useState(false);
  const [uploadPercent, setUploadPercent] = useState(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const selectedSession = useMemo(
    () => sessions.find(s => s.id === selectedSessionId) ?? null,
    [selectedSessionId, sessions],
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMultiAngleScanSessions({ limit: 40, includeCompleted: true });
      data.sort(byNewest);
      setSessions(data);

      const nextSelected =
        (selectedSessionId && data.some(s => s.id === selectedSessionId) && selectedSessionId) ||
        data[0]?.id ||
        "";
      setSelectedSessionId(nextSelected);

      if (nextSelected) {
        const imgs = await getMultiAngleScanImages(nextSelected);
        setImages(imgs);
      } else {
        setImages([]);
      }
    } catch (err) {
      toast.error("Failed to load 3D sessions");
      setImages([]);
    } finally {
      setLoading(false);
    }
  }, [selectedSessionId]);

  useEffect(() => {
    if (!isActive) return;
    void refresh();
  }, [isActive, refresh]);

  useEffect(() => {
    if (!isActive) return;
    if (!selectedSessionId) return;
    let cancelled = false;
    (async () => {
      try {
        const imgs = await getMultiAngleScanImages(selectedSessionId);
        if (!cancelled) setImages(imgs);
      } catch {
        if (!cancelled) setImages([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isActive, selectedSessionId]);

  const handleCreate = useCallback(async () => {
    const name = newSessionName.trim();
    if (!name) {
      toast.error("Please enter a session name");
      return;
    }
    setLoading(true);
    try {
      const created = await createMultiAngleScanSession(name, targetAngles);
      if (!created) {
        toast.error("Failed to create session");
        return;
      }
      setNewSessionName("");
      setTargetAngles(8);
      toast.success("3D session created");
      await refresh();
      setSelectedSessionId(created.id);
    } catch {
      toast.error("Failed to create session");
    } finally {
      setLoading(false);
    }
  }, [newSessionName, refresh, targetAngles]);

  const handleStartReconstruction = useCallback(async () => {
    if (!selectedSession) return;
    setLoading(true);
    try {
      await start3DReconstruction(selectedSession.id);
      toast.success("Reconstruction queued");
      await refresh();
    } catch {
      toast.error("Failed to start reconstruction");
    } finally {
      setLoading(false);
    }
  }, [refresh, selectedSession]);

  const handleUploadAngles = useCallback(
    async (files: FileList | null) => {
      if (!selectedSession) return;
      const list = Array.from(files ?? []);
      if (list.length === 0) return;

      const allowedTypes = ["image/png", "image/jpeg", "image/webp"];
      const maxSize = 15 * 1024 * 1024;

      const existingIdx = new Set(images.map(i => Number(i.angle_index)));
      let nextIdx = 0;
      while (existingIdx.has(nextIdx)) nextIdx += 1;

      const assignments = list.map((file, i) => {
        const inferred = inferAngleIndexFromName(file.name);
        const angleIndex = inferred != null ? inferred : nextIdx + i;
        const angleDegrees = computeAngleDegrees(angleIndex, selectedSession.target_angles);
        return { file, angleIndex, angleDegrees };
      });

      // Guard: avoid accidental giant upload sets.
      if (assignments.length > 48) {
        toast.error("Please upload 48 images or fewer at a time.");
        return;
      }

      setUploading(true);
      setUploadPercent(0);
      try {
        for (let i = 0; i < assignments.length; i++) {
          const { file, angleIndex, angleDegrees } = assignments[i]!;

          const overallBase = Math.round((i / assignments.length) * 100);
          setUploadPercent(overallBase);

          const up = await uploadFile(file, {
            folder: `scans/multi-angle/${selectedSession.id}`,
            allowedTypes,
            maxSize,
            compress: true,
            onProgress: p => {
              const span = 100 / assignments.length;
              const blended = Math.min(
                100,
                Math.round((i / assignments.length) * 100 + (p / 100) * span),
              );
              setUploadPercent(blended);
            },
          });

          if (!up) throw new Error("Upload failed");
          const url = String(up.publicUrl || up.path || "");
          if (!url) throw new Error("Upload returned no URL/path");

          await addAngleToSession(selectedSession.id, angleIndex, url, angleDegrees);
        }

        toast.success("Angle images added");
        await refresh();
      } catch (err) {
        toast.error("Failed to add angle images");
      } finally {
        setUploading(false);
        setUploadPercent(0);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [images, refresh, selectedSession],
  );

  const canStart =
    selectedSession &&
    selectedSession.angles_captured >= selectedSession.target_angles &&
    selectedSession.processing_status !== "processing";

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-1">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Sessions</CardTitle>
          <Button variant="outline" size="sm" onClick={() => void refresh()} disabled={loading}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2 rounded-lg border p-3">
            <div className="text-sm font-medium flex items-center gap-2">
              <Camera className="w-4 h-4" />
              New 3D session
            </div>
            <Input
              placeholder="Session name"
              value={newSessionName}
              onChange={e => setNewSessionName(e.target.value)}
              disabled={loading}
            />
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Target angles</span>
              <Input
                type="number"
                value={targetAngles}
                onChange={e => setTargetAngles(clamp(parseInt(e.target.value) || 8, 2, 36))}
                min={2}
                max={36}
                className="w-24"
                disabled={loading}
              />
              <Button onClick={() => void handleCreate()} disabled={loading} className="ml-auto">
                Create
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Tip: upload files named like <span className="font-mono">angle-1.jpg</span> to assign
              specific indices.
            </p>
          </div>

          <div className="space-y-2">
            {sessions.length === 0 && (
              <p className="text-sm text-muted-foreground">No sessions yet. Create one to begin.</p>
            )}
            {sessions.map(s => {
              const active = s.id === selectedSessionId;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedSessionId(s.id)}
                  className={`w-full text-left rounded-lg border p-3 transition ${
                    active ? "border-primary/60 bg-primary/5" : "border-border/60 hover:bg-muted/20"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{safeLabel(s)}</div>
                      <div className="text-xs text-muted-foreground">
                        {s.angles_captured} / {s.target_angles} angles
                      </div>
                    </div>
                    <StatusBadge status={s.processing_status} />
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Session details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!selectedSession ? (
            <p className="text-sm text-muted-foreground">Select a session to view details.</p>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{safeLabel(selectedSession)}</Badge>
                <StatusBadge status={selectedSession.processing_status} />
                <Badge variant="outline">
                  {selectedSession.angles_captured} / {selectedSession.target_angles} captured
                </Badge>
              </div>

              {selectedSession.processing_error && (
                <div className="text-sm text-destructive">{selectedSession.processing_error}</div>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium flex items-center gap-2">
                    <Image className="w-4 h-4" />
                    Add angle images
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={uploading || loading}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Upload
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    multiple
                    onChange={e => void handleUploadAngles(e.target.files)}
                    className="hidden"
                  />
                </div>

                {uploading && (
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Uploading… {uploadPercent}%</div>
                    <Progress value={uploadPercent} />
                  </div>
                )}

                <p className="text-xs text-muted-foreground">
                  Upload 2–36 images. The app will auto-assign indices if not present in filenames.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  onClick={() => void handleStartReconstruction()}
                  disabled={!canStart || loading}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start reconstruction
                </Button>
                {!canStart && (
                  <span className="text-xs text-muted-foreground">
                    Capture/upload{" "}
                    {Math.max(0, selectedSession.target_angles - selectedSession.angles_captured)}{" "}
                    more angle(s) to enable.
                  </span>
                )}
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Captured angles</div>
                {images.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No angle images uploaded yet.</p>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {images.map(img => (
                      <div key={img.id} className="rounded-lg border p-3">
                        <div className="flex items-center justify-between gap-2">
                          <Badge variant="outline" className="text-[10px]">
                            Angle {Number(img.angle_index) + 1}
                          </Badge>
                          {img.angle_degrees != null && (
                            <span className="text-[10px] text-muted-foreground">
                              {Number(img.angle_degrees).toFixed(1)}°
                            </span>
                          )}
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground break-all">
                          {String(img.image_url || "").slice(0, 84)}
                          {String(img.image_url || "").length > 84 ? "…" : ""}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
