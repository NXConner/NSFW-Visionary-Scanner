import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, Send, Wand2 } from "lucide-react";
import { formatTimecode } from "@/lib/videoEditing";

export function EditorHeaderBar(props: {
  editName: string;
  setEditName: (v: string) => void;
  playheadSeconds: number;
  activeCameraIndex: number;
  onLoadDraft: () => void;
  onSaveDraft: () => void;
  onQueue: () => void;
  onRender: () => void;
  queuing: boolean;
  rendering: boolean;
  renderPhase?: string;
  renderProgress?: number;
}): JSX.Element {
  const {
    editName,
    setEditName,
    playheadSeconds,
    activeCameraIndex,
    onLoadDraft,
    onSaveDraft,
    onQueue,
    onRender,
    queuing,
    rendering,
    renderPhase,
    renderProgress,
  } = props;

  return (
    <div className="px-4 py-3 border-b flex flex-col gap-2">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Input value={editName} onChange={e => setEditName(e.target.value)} className="max-w-[520px]" />
          <Badge variant="secondary" className="hidden sm:inline-flex">
            {formatTimecode(playheadSeconds)}
          </Badge>
          <Badge variant="secondary" className="hidden sm:inline-flex">
            Cam {activeCameraIndex + 1}
          </Badge>
        </div>
        <div className="flex flex-wrap items-center gap-2 justify-end">
          <Button variant="outline" onClick={onLoadDraft} className="gap-2">
            <Wand2 className="w-4 h-4" />
            Load draft
          </Button>
          <Button variant="outline" onClick={onSaveDraft} className="gap-2">
            <Save className="w-4 h-4" />
            Save draft
          </Button>
          <Button onClick={onQueue} disabled={queuing} className="gap-2">
            {queuing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Queue render
          </Button>
          <Button onClick={onRender} disabled={rendering} className="gap-2" variant="secondary">
            {rendering ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Render locally
          </Button>
        </div>
      </div>
      {rendering && (
        <div className="text-xs text-muted-foreground">
          {renderPhase ?? "rendering"} · {Math.round(renderProgress ?? 0)}%
        </div>
      )}
    </div>
  );
}

