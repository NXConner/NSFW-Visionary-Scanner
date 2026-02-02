import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pause, Play, Plus } from "lucide-react";
import type { TransitionType } from "@/lib/videoEditing";

export function PlaybackToolbar(props: {
  isPlaying: boolean;
  playheadSeconds: number;
  playbackRate: number;
  onTogglePlay: () => void;
  onSeekRelative: (deltaSeconds: number) => void;
  onSetRate: (rate: number) => void;

  mlEnabled: boolean;
  onToggleMl: () => void;
  mlThreshold: number;
  setMlThreshold: (v: number) => void;
  maxObjects: number;
  setMaxObjects: (v: number) => void;

  transition: TransitionType;
  setTransition: (v: TransitionType) => void;
  onAddSwitch: () => void;
}): JSX.Element {
  const {
    isPlaying,
    playheadSeconds,
    playbackRate,
    onTogglePlay,
    onSeekRelative,
    onSetRate,
    mlEnabled,
    onToggleMl,
    mlThreshold,
    setMlThreshold,
    maxObjects,
    setMaxObjects,
    transition,
    setTransition,
    onAddSwitch,
  } = props;

  return (
    <div className="px-4 py-3 border-b flex items-center gap-2 flex-wrap">
      <Button variant="outline" onClick={onTogglePlay} className="gap-2">
        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        {isPlaying ? "Pause" : "Play"}
      </Button>
      <Button variant="outline" onClick={() => onSeekRelative(-1)}>
        -1s
      </Button>
      <Button variant="outline" onClick={() => onSeekRelative(1)}>
        +1s
      </Button>

      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Rate</span>
        <Input
          value={String(playbackRate)}
          onChange={e => onSetRate(Number(e.target.value || 1))}
          className="w-20 h-9"
        />
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">ML</span>
        <Button size="sm" variant={mlEnabled ? "default" : "outline"} onClick={onToggleMl}>
          {mlEnabled ? "On" : "Off"}
        </Button>
        {mlEnabled && (
          <>
            <Input
              value={String(mlThreshold)}
              onChange={e => setMlThreshold(Number(e.target.value || 0.72))}
              className="w-24 h-9"
              title="Detection threshold"
            />
            <Input
              value={String(maxObjects)}
              onChange={e => setMaxObjects(Number(e.target.value || 5))}
              className="w-20 h-9"
              title="Max objects"
            />
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Transition</span>
        <select
          className="h-9 rounded-md border bg-background px-2 text-sm"
          value={transition}
          onChange={e => setTransition(e.target.value as TransitionType)}
        >
          <option value="cut">Cut</option>
          <option value="crossfade">Crossfade</option>
          <option value="dip_to_black">Dip to black</option>
        </select>
        <Button variant="outline" onClick={onAddSwitch} className="gap-2">
          <Plus className="w-4 h-4" />
          Add switch
        </Button>
      </div>

      <div className="ml-auto text-xs text-muted-foreground tabular-nums">
        t={playheadSeconds.toFixed(3)}s
      </div>
    </div>
  );
}

