import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Wand2 } from "lucide-react";
import { toast } from "sonner";
import {
  ensureRecordingForCameraStream,
  getCameraStreamsForSession,
  getMyMultiCameraSessions,
  getVideoRecordingsForSession,
  type CameraStreamRow,
  type MultiCameraSessionRow,
  type VideoRecordingRow,
} from "@/lib/videoEditing";
import { VideoStudioEditorDialog } from "@/components/videoEditing/VideoStudioEditorDialog";
import { RecordingPreviewDialog } from "./RecordingPreviewDialog";

export function StudioTab({ isActive }: { isActive: boolean }): JSX.Element {
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<MultiCameraSessionRow[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [streams, setStreams] = useState<CameraStreamRow[]>([]);
  const [recordings, setRecordings] = useState<VideoRecordingRow[]>([]);
  const [openRecordingId, setOpenRecordingId] = useState<string | null>(null);
  const [previewRecordingId, setPreviewRecordingId] = useState<string | null>(null);

  const openRecording = useMemo(
    () => recordings.find(r => r.id === openRecordingId) ?? null,
    [openRecordingId, recordings],
  );
  const previewRecording = useMemo(
    () => recordings.find(r => r.id === previewRecordingId) ?? null,
    [previewRecordingId, recordings],
  );

  const loadSessions = useCallback(async () => {
    setLoading(true);
    try {
      const list = await getMyMultiCameraSessions();
      setSessions(list);
      if (!sessionId && list[0]?.id) setSessionId(list[0].id);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  const loadSessionData = useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const [s, r] = await Promise.all([
        getCameraStreamsForSession(sessionId),
        getVideoRecordingsForSession(sessionId),
      ]);
      setStreams(s);
      setRecordings(r);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    if (!isActive) return;
    void loadSessions();
  }, [isActive, loadSessions]);

  useEffect(() => {
    if (!isActive) return;
    void loadSessionData();
  }, [isActive, loadSessionData]);

  const handleEnsureRecordings = useCallback(async () => {
    if (!sessionId) return;
    if (!streams.length) {
      toast.info("No uploaded camera streams found for this session yet.");
      return;
    }
    setLoading(true);
    try {
      await Promise.all(
        streams.map(s =>
          ensureRecordingForCameraStream({
            sessionId,
            cameraStream: s,
            durationSeconds: s.video_duration_seconds ?? null,
          }),
        ),
      );
      toast.success("Recordings indexed");
      await loadSessionData();
    } finally {
      setLoading(false);
    }
  }, [loadSessionData, sessionId, streams]);

  return (
    <Card className="glass-card border-border/50">
      <CardHeader>
        <CardTitle>Studio</CardTitle>
        <CardDescription>
          Multi-cam editor (camera switching, sync, masking, tracking) + edit queue
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center gap-2 justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <Select value={sessionId ?? undefined} onValueChange={v => setSessionId(v)}>
              <SelectTrigger className="w-[280px]">
                <SelectValue placeholder="Select a session" />
              </SelectTrigger>
              <SelectContent>
                {sessions.map(s => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.session_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={handleEnsureRecordings}
              disabled={loading || !sessionId}
              className="gap-2"
            >
              <Wand2 className="w-4 h-4" />
              Index recordings
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="secondary">{streams.length} streams</Badge>
            <Badge variant="secondary">{recordings.length} recordings</Badge>
            {loading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-base">Camera streams</CardTitle>
              <CardDescription>Uploaded per-camera files for the selected session</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {streams.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  No streams yet. Record something in the Recording tab first.
                </div>
              ) : (
                streams.map(s => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between gap-3 rounded border border-border/50 p-3"
                  >
                    <div className="min-w-0">
                      <div className="font-medium truncate">
                        Camera {s.camera_index + 1}
                        {s.camera_name ? ` · ${s.camera_name}` : ""}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {s.device_type ?? "device"} · {s.video_duration_seconds ?? "?"}s
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground truncate max-w-[40%]">
                      {s.video_storage_path ?? s.video_url ?? ""}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-base">Recordings</CardTitle>
              <CardDescription>Records used as anchors for edits</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {recordings.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  No recordings indexed yet. Click “Index recordings”.
                </div>
              ) : (
                recordings.map(r => (
                  <div
                    key={r.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded border border-border/50 p-3"
                  >
                    <div className="min-w-0">
                      <div className="font-medium truncate">{r.recording_name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {r.recording_type ?? "recording"} · {r.duration_seconds ?? "?"}s
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setOpenRecordingId(r.id)}
                        disabled={!r.video_url}
                      >
                        Open editor
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setPreviewRecordingId(r.id)}
                        disabled={!r.video_url}
                      >
                        Preview
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <VideoStudioEditorDialog
          open={Boolean(openRecordingId && openRecording && sessionId)}
          onClose={() => setOpenRecordingId(null)}
          sessionId={sessionId}
          streams={streams}
          recordings={recordings}
          baseRecording={openRecording}
          onRefresh={loadSessionData}
        />
        <RecordingPreviewDialog
          open={Boolean(previewRecordingId)}
          onClose={() => setPreviewRecordingId(null)}
          recording={previewRecording}
        />
      </CardContent>
    </Card>
  );
}

