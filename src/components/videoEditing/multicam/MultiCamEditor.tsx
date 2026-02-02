import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { CameraStreamRow, VideoEditRow, VideoRecordingRow } from "@/lib/videoEditing";
import { clamp, getEditsForRecording, queueVideoEdit, roundTo, uuidLike } from "@/lib/videoEditing";
import type { CameraSource, CameraSwitchEvent, MaskTrack, MaskKeyframe, TimelineSpecV1, TransitionType } from "@/lib/videoEditing";
import { EditsList } from "@/components/videoEditing/multicam/EditsList";
import { TimelineBar } from "@/components/videoEditing/multicam/TimelineBar";
import { useMultiCamPlayback } from "@/components/videoEditing/multicam/useMultiCamPlayback";
import { EditorHeaderBar } from "@/components/videoEditing/multicam/EditorHeaderBar";
import { PlaybackToolbar } from "@/components/videoEditing/multicam/PlaybackToolbar";
import { PreviewStage } from "@/components/videoEditing/multicam/PreviewStage";
import { InspectorPanel } from "@/components/videoEditing/multicam/InspectorPanel";
import type { VideoFilterState } from "@/components/videoEditing/multicam/VideoFiltersPanel";
import { useObjectDetection } from "@/hooks/useObjectDetection";
import { useObjectTracking } from "@/hooks/useObjectTracking";

function localKey(recordingId: string): string {
  return `videoEditing:draft:v1:${recordingId}`;
}

function safeJsonParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function computeActiveCameraIndex(
  switches: CameraSwitchEvent[],
  playheadSeconds: number,
  fallbackCameraIndex: number,
): number {
  if (!switches.length) return fallbackCameraIndex;
  let active = fallbackCameraIndex;
  for (const s of switches) {
    if (s.atSeconds <= playheadSeconds) active = s.cameraIndex;
    else break;
  }
  return active;
}

export function MultiCamEditor(props: {
  baseRecording: VideoRecordingRow;
  streams: CameraStreamRow[];
  recordings: VideoRecordingRow[];
  onRefresh: () => Promise<void> | void;
}): JSX.Element {
  const { baseRecording, streams, onRefresh } = props;

  const baseSources: CameraSource[] = useMemo(() => {
    return streams
      .filter(s => Boolean(s.video_url))
      .map(s => ({
        cameraIndex: s.camera_index,
        videoUrl: String(s.video_url),
        storagePath: s.video_storage_path ?? null,
        syncOffsetSeconds: 0,
        label: s.camera_name ?? `Camera ${s.camera_index + 1}`,
      }))
      .sort((a, b) => a.cameraIndex - b.cameraIndex);
  }, [streams]);

  const durationSeconds = useMemo(() => {
    const max = streams.reduce((m, s) => Math.max(m, Number(s.video_duration_seconds || 0)), 0);
    const fallback = Number(baseRecording.duration_seconds || 0);
    return Math.max(0, max || fallback || 0);
  }, [baseRecording.duration_seconds, streams]);

  const [syncOffsets, setSyncOffsets] = useState<Record<number, number>>({});
  const sources: CameraSource[] = useMemo(() => {
    return baseSources.map(s => ({
      ...s,
      syncOffsetSeconds: roundTo(Number(syncOffsets[s.cameraIndex] ?? 0), 3),
    }));
  }, [baseSources, syncOffsets]);

  const [editName, setEditName] = useState<string>(() => `Edit ${new Date().toLocaleString()}`);
  const [cameraSwitches, setCameraSwitches] = useState<CameraSwitchEvent[]>([]);
  const [masks, setMasks] = useState<MaskTrack[]>([]);
  const [activeMaskId, setActiveMaskId] = useState<string | null>(null);
  const [selectedTransition, setSelectedTransition] = useState<TransitionType>("cut");
  
  // Video filter state
  const [filterState, setFilterState] = useState<VideoFilterState>({
    enabled: false,
    filterType: null,
    options: {},
  });

  useEffect(() => {
    // Ensure at least one switch at t=0 with a valid camera index.
    if (!sources.length) return;
    setCameraSwitches(prev => {
      if (prev.length) return prev;
      return [{ id: uuidLike(), atSeconds: 0, cameraIndex: sources[0].cameraIndex, transition: "cut" }];
    });
  }, [sources]);

  const playback = useMultiCamPlayback({ durationSeconds, sources });

  const realActiveCameraIndex = useMemo(
    () => computeActiveCameraIndex(cameraSwitches, playback.playhead, sources[0]?.cameraIndex ?? 0),
    [cameraSwitches, playback.playhead, sources],
  );

  // Optional ML detection/tracking (preview-only)
  const [mlEnabled, setMlEnabled] = useState(false);
  const [mlThreshold, setMlThreshold] = useState(0.72);
  const [maxObjects, setMaxObjects] = useState(5);
  const [selectedDetectionIndex, setSelectedDetectionIndex] = useState(0);
  const detection = useObjectDetection(playback.getVideoEl(realActiveCameraIndex), {
    enabled: mlEnabled,
    threshold: clamp(mlThreshold, 0.05, 0.98),
    maxObjects: clamp(maxObjects, 1, 25),
    targetFps: 10,
  });
  const tracking = useObjectTracking(detection.detections, { enabled: mlEnabled });

  const selectedTracked = useMemo(() => {
    const t = tracking.tracks;
    const idx = clamp(selectedDetectionIndex, 0, Math.max(0, t.length - 1));
    return t[idx] ?? null;
  }, [selectedDetectionIndex, tracking.tracks]);

  const timeline: TimelineSpecV1 = useMemo(
    () => ({
      version: 1,
      kind: "multicam",
      baseRecordingId: baseRecording.id,
      durationSeconds,
      sources,
      cameraSwitches: [...cameraSwitches].sort((a, b) => a.atSeconds - b.atSeconds),
      masks,
      meta: { generatedAt: new Date().toISOString() },
    }),
    [baseRecording.id, cameraSwitches, durationSeconds, masks, sources],
  );

  const [loadingEdits, setLoadingEdits] = useState(false);
  const [edits, setEdits] = useState<VideoEditRow[]>([]);
  const [queuing, setQueuing] = useState(false);

  const loadEdits = useCallback(async () => {
    setLoadingEdits(true);
    try {
      setEdits(await getEditsForRecording(baseRecording.id));
    } finally {
      setLoadingEdits(false);
    }
  }, [baseRecording.id]);

  useEffect(() => {
    void loadEdits();
  }, [loadEdits]);

  const handleSaveDraft = useCallback(() => {
    try {
      localStorage.setItem(localKey(baseRecording.id), JSON.stringify(timeline));
      toast.success("Draft saved");
    } catch {
      toast.error("Failed to save draft");
    }
  }, [baseRecording.id, timeline]);

  const handleLoadDraft = useCallback(() => {
    const saved = safeJsonParse<TimelineSpecV1>(localStorage.getItem(localKey(baseRecording.id)));
    if (!saved) return toast.info("No saved draft found");
    if (saved.baseRecordingId !== baseRecording.id || saved.kind !== "multicam")
      return toast.error("Draft does not match this recording");
    setCameraSwitches(Array.isArray(saved.cameraSwitches) ? saved.cameraSwitches : []);
    setMasks(Array.isArray(saved.masks) ? saved.masks : []);
    const offsets: Record<number, number> = {};
    for (const s of Array.isArray(saved.sources) ? saved.sources : []) {
      offsets[s.cameraIndex] = Number((s as any).syncOffsetSeconds || 0);
    }
    setSyncOffsets(offsets);
    toast.success("Draft loaded");
  }, [baseRecording.id]);

  const handleAddSwitch = useCallback(() => {
    if (!sources.length) return;
    const id = uuidLike();
    setCameraSwitches(prev =>
      [...prev, {
        id,
        atSeconds: roundTo(playback.playhead, 3),
        cameraIndex: realActiveCameraIndex,
        transition: selectedTransition,
        transitionDurationMs: selectedTransition === "crossfade" ? 250 : 0,
      }].sort((a, b) => a.atSeconds - b.atSeconds),
    );
    toast.success("Switch added");
  }, [playback.playhead, realActiveCameraIndex, selectedTransition, sources.length]);

  const handleQueue = useCallback(async () => {
    setQueuing(true);
    try {
      const res = await queueVideoEdit({
        recordingId: baseRecording.id,
        editType: "camera_switch",
        editName,
        timeline,
      });
      if (!res.ok) return toast.error((res as { ok: false; error: string }).error);
      toast.success(`Queued edit (${res.status})`);
      await loadEdits();
      await onRefresh();
    } finally {
      setQueuing(false);
    }
  }, [baseRecording.id, editName, loadEdits, onRefresh, timeline]);

  const handleAddMaskKeyframeFromDetection = useCallback(() => {
    const det = detection.detections[selectedDetectionIndex];
    if (!det) return toast.info("No detection selected");
    const maskId = activeMaskId ?? uuidLike();
    const nextMask: MaskTrack =
      masks.find(m => m.id === maskId) ??
      ({ id: maskId, name: `Mask ${masks.length + 1}`, mode: "exclude", feather: 0.15, blur: 0, keyframes: [] } satisfies MaskTrack);
    const newKeyframe: MaskKeyframe = {
      atSeconds: roundTo(playback.playhead, 3),
      shape: { kind: "rect" as const, xPct: det.box.x, yPct: det.box.y, wPct: det.box.width, hPct: det.box.height },
      strength: 1,
    };
    const updated: MaskTrack = {
      ...nextMask,
      keyframes: [...nextMask.keyframes, newKeyframe].sort((a, b) => a.atSeconds - b.atSeconds),
    };
    setMasks(prev => {
      const idx = prev.findIndex(m => m.id === updated.id);
      if (idx === -1) return [updated, ...prev];
      const clone = [...prev];
      clone[idx] = updated;
      return clone;
    });
    setActiveMaskId(updated.id);
    toast.success("Mask keyframe added");
  }, [activeMaskId, detection.detections, masks, playback.playhead, selectedDetectionIndex]);

  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-[1fr,380px]">
      <div className="h-full flex flex-col overflow-hidden">
        <EditorHeaderBar
          editName={editName}
          setEditName={setEditName}
          playheadSeconds={playback.playhead}
          activeCameraIndex={realActiveCameraIndex}
          onLoadDraft={handleLoadDraft}
          onSaveDraft={handleSaveDraft}
          onQueue={handleQueue}
          queuing={queuing}
        />

        <div className="flex-1 overflow-hidden grid grid-rows-[auto,1fr,auto]">
          <PlaybackToolbar
            isPlaying={playback.isPlaying}
            playheadSeconds={playback.playhead}
            playbackRate={playback.playbackRate}
            onTogglePlay={() => void playback.togglePlay()}
            onSeekRelative={d => void playback.seek(playback.playhead + d)}
            onSetRate={r => void playback.setPlaybackRate(r)}
            mlEnabled={mlEnabled}
            onToggleMl={() => setMlEnabled(v => !v)}
            mlThreshold={mlThreshold}
            setMlThreshold={setMlThreshold}
            maxObjects={maxObjects}
            setMaxObjects={setMaxObjects}
            transition={selectedTransition}
            setTransition={setSelectedTransition}
            onAddSwitch={handleAddSwitch}
          />

          <div className="overflow-hidden grid grid-cols-1 xl:grid-cols-[1fr,340px]">
            <PreviewStage
              sources={sources}
              activeCameraIndex={realActiveCameraIndex}
              registerVideoEl={playback.registerVideoEl}
              playheadSeconds={playback.playhead}
              durationSeconds={durationSeconds}
              masks={masks}
              activeMaskId={activeMaskId}
              onSelectMask={setActiveMaskId}
              onUpsertMask={next => {
                setMasks(prev => {
                  const idx = prev.findIndex(m => m.id === next.id);
                  if (idx === -1) return [next, ...prev];
                  const clone = [...prev];
                  clone[idx] = next;
                  return clone;
                });
              }}
              detections={mlEnabled ? detection.detections : []}
              tracks={mlEnabled ? tracking.tracks : []}
              selectedTrackId={selectedTracked?.trackId ?? null}
              onSelectDetectionIndex={setSelectedDetectionIndex}
              onAddMaskKeyframeFromDetection={handleAddMaskKeyframeFromDetection}
              filterState={filterState}
            />

            <InspectorPanel
              sources={sources}
              syncOffsets={syncOffsets}
              setSyncOffsets={setSyncOffsets}
              masks={masks}
              activeMaskId={activeMaskId}
              setActiveMaskId={setActiveMaskId}
              setMasks={setMasks}
              filterState={filterState}
              onFilterChange={setFilterState}
            />
          </div>

          <div className="border-t bg-background">
            <TimelineBar
              durationSeconds={durationSeconds}
              playheadSeconds={playback.playhead}
              cameraSwitches={cameraSwitches}
              onSeek={t => void playback.seek(t)}
              onUpdateSwitch={next =>
                setCameraSwitches(prev =>
                  prev
                    .map(s => (s.id === next.id ? { ...s, ...next } : s))
                    .sort((a, b) => a.atSeconds - b.atSeconds),
                )
              }
              onDeleteSwitch={id => setCameraSwitches(prev => prev.filter(s => s.id !== id))}
            />
          </div>
        </div>
      </div>

      <div className="h-full border-t lg:border-t-0 lg:border-l bg-background overflow-auto">
        <EditsList
          recordingId={baseRecording.id}
          edits={edits}
          loading={loadingEdits}
          onRefresh={() => void loadEdits()}
        />
      </div>
    </div>
  );
}

