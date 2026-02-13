import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Palette, Gauge, ArrowRightLeft, Volume2, Type, Wand2 } from "lucide-react";
import type { CameraSource, MaskTrack } from "@/lib/videoEditing";
import { clamp, uuidLike } from "@/lib/videoEditing";
import { VideoFiltersPanel, type VideoFilterState } from "./VideoFiltersPanel";
import { VideoAdjustmentsPanel } from "./VideoAdjustmentsPanel";
import { defaultVideoAdjustments, type VideoAdjustmentsState } from "./VideoAdjustmentsPanel.model";
import { SpeedControlsPanel } from "./SpeedControlsPanel";
import { defaultSpeedControl, type SpeedControlState } from "./SpeedControlsPanel.model";
import { TransitionsPanel } from "./TransitionsPanel";
import { defaultTransition, type TransitionConfig } from "./TransitionsPanel.model";
import { AudioToolsPanel } from "./AudioToolsPanel";
import { defaultAudioState, type AudioState } from "./AudioToolsPanel.model";
import { TextTitlesPanel } from "./TextTitlesPanel";
import { defaultTextState, type TextOverlaysState } from "./TextTitlesPanel.model";
import { AIEnhancementPanel } from "@/components/photoEditor/AIEnhancementPanel";
import {
  defaultAIEnhancement,
  type AIEnhancementState,
} from "@/components/photoEditor/AIEnhancementPanel.model";
import { useState } from "react";

export function InspectorPanel(props: {
  sources: CameraSource[];
  syncOffsets: Record<number, number>;
  setSyncOffsets: (next: Record<number, number>) => void;
  masks: MaskTrack[];
  activeMaskId: string | null;
  setActiveMaskId: (id: string | null) => void;
  setMasks: (next: MaskTrack[]) => void;
  filterState?: VideoFilterState;
  onFilterChange?: (state: VideoFilterState) => void;
  currentTime?: number;
}): JSX.Element {
  const {
    sources,
    syncOffsets,
    setSyncOffsets,
    masks,
    activeMaskId,
    setActiveMaskId,
    setMasks,
    filterState,
    onFilterChange,
    currentTime = 0,
  } = props;

  // Local state for new panels
  const [adjustments, setAdjustments] = useState<VideoAdjustmentsState>(defaultVideoAdjustments);
  const [speedControl, setSpeedControl] = useState<SpeedControlState>(defaultSpeedControl);
  const [transition, setTransition] = useState<TransitionConfig>(defaultTransition);
  const [audio, setAudio] = useState<AudioState>(defaultAudioState);
  const [textOverlays, setTextOverlays] = useState<TextOverlaysState>(defaultTextState);
  const [aiEnhancement, setAIEnhancement] = useState<AIEnhancementState>(defaultAIEnhancement);

  return (
    <div className="border-l bg-background overflow-hidden flex flex-col" style={{ width: 280 }}>
      <Tabs defaultValue="adjust" className="flex flex-col h-full">
        <TabsList className="grid grid-cols-7 m-2 h-8">
          <TabsTrigger value="adjust" className="p-1" title="Adjustments">
            <Palette className="w-3.5 h-3.5" />
          </TabsTrigger>
          <TabsTrigger value="speed" className="p-1" title="Speed">
            <Gauge className="w-3.5 h-3.5" />
          </TabsTrigger>
          <TabsTrigger value="transition" className="p-1" title="Transitions">
            <ArrowRightLeft className="w-3.5 h-3.5" />
          </TabsTrigger>
          <TabsTrigger value="audio" className="p-1" title="Audio">
            <Volume2 className="w-3.5 h-3.5" />
          </TabsTrigger>
          <TabsTrigger value="text" className="p-1" title="Text">
            <Type className="w-3.5 h-3.5" />
          </TabsTrigger>
          <TabsTrigger value="ai" className="p-1" title="AI">
            <Wand2 className="w-3.5 h-3.5" />
          </TabsTrigger>
          <TabsTrigger value="masks" className="p-1" title="Masks">
            <Plus className="w-3.5 h-3.5" />
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1 px-3 pb-3">
          <TabsContent value="adjust" className="mt-0 space-y-3">
            {filterState && onFilterChange && (
              <VideoFiltersPanel filterState={filterState} onFilterChange={onFilterChange} />
            )}
            <VideoAdjustmentsPanel state={adjustments} onChange={setAdjustments} />
          </TabsContent>

          <TabsContent value="speed" className="mt-0">
            <SpeedControlsPanel state={speedControl} onChange={setSpeedControl} />
          </TabsContent>

          <TabsContent value="transition" className="mt-0">
            <TransitionsPanel transition={transition} onChange={setTransition} />
          </TabsContent>

          <TabsContent value="audio" className="mt-0">
            <AudioToolsPanel state={audio} onChange={setAudio} />
          </TabsContent>

          <TabsContent value="text" className="mt-0">
            <TextTitlesPanel
              state={textOverlays}
              onChange={setTextOverlays}
              currentTime={currentTime}
            />
          </TabsContent>

          <TabsContent value="ai" className="mt-0">
            <AIEnhancementPanel state={aiEnhancement} onChange={setAIEnhancement} />
          </TabsContent>

          <TabsContent value="masks" className="mt-0 space-y-3">
            {/* Sync Offsets */}
            <Card className="p-3 border-border/50">
              <div className="text-sm font-medium mb-2">Sync offsets (seconds)</div>
              <div className="space-y-2">
                {sources.map(s => (
                  <div key={s.cameraIndex} className="flex items-center justify-between gap-2">
                    <div className="text-xs text-muted-foreground truncate max-w-[65%]">
                      {s.label ?? `Camera ${s.cameraIndex + 1}`}
                    </div>
                    <Input
                      className="w-20 h-7 text-xs"
                      value={String(syncOffsets[s.cameraIndex] ?? 0)}
                      onChange={e =>
                        setSyncOffsets({
                          ...syncOffsets,
                          [s.cameraIndex]: clamp(Number(e.target.value || 0), -60, 60),
                        })
                      }
                    />
                  </div>
                ))}
              </div>
            </Card>

            {/* Masks */}
            <Card className="p-3 border-border/50">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="text-sm font-medium">Masks</div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const id = uuidLike();
                    setMasks([
                      {
                        id,
                        name: `Mask ${masks.length + 1}`,
                        mode: "exclude",
                        feather: 0.15,
                        blur: 0,
                        keyframes: [],
                      },
                      ...masks,
                    ]);
                    setActiveMaskId(id);
                  }}
                  className="gap-1 h-7"
                >
                  <Plus className="w-3 h-3" />
                  Add
                </Button>
              </div>
              {masks.length === 0 ? (
                <div className="text-xs text-muted-foreground">No masks yet.</div>
              ) : (
                <div className="space-y-2">
                  {masks.map(m => (
                    <div
                      key={m.id}
                      className={[
                        "flex items-center justify-between gap-2 rounded border p-2",
                        m.id === activeMaskId
                          ? "border-primary/50 bg-primary/5"
                          : "border-border/50",
                      ].join(" ")}
                    >
                      <button
                        className="text-left min-w-0 flex-1"
                        onClick={() => setActiveMaskId(m.id)}
                      >
                        <div className="text-sm font-medium truncate">{m.name}</div>
                        <div className="text-[10px] text-muted-foreground truncate">
                          {m.mode} · {m.keyframes.length} keyframes
                        </div>
                      </button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          setMasks(masks.filter(x => x.id !== m.id));
                          setActiveMaskId(m.id === activeMaskId ? null : activeMaskId);
                        }}
                        aria-label="Delete mask"
                        className="h-7 w-7"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
}
