import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import type { CameraStreamRow, VideoRecordingRow } from "@/lib/videoEditing";
import { MultiCamEditor } from "@/components/videoEditing/multicam/MultiCamEditor";

export function VideoStudioEditorDialog(props: {
  open: boolean;
  onClose: () => void;
  sessionId: string | null;
  streams: CameraStreamRow[];
  recordings: VideoRecordingRow[];
  baseRecording: VideoRecordingRow | null;
  onRefresh: () => Promise<void> | void;
}): JSX.Element {
  const { open, onClose, baseRecording, streams, recordings, onRefresh } = props;
  const [fullScreen, setFullScreen] = useState(true);

  useEffect(() => {
    if (!open) setFullScreen(true);
  }, [open]);

  const title = useMemo(() => baseRecording?.recording_name ?? "Editor", [baseRecording]);

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent
        className={[
          "p-0",
          fullScreen ? "max-w-[min(1400px,95vw)] h-[min(92vh,980px)]" : "max-w-5xl",
        ].join(" ")}
      >
        <DialogHeader className="px-4 py-3 border-b">
          <div className="flex items-center justify-between gap-3">
            <DialogTitle className="truncate">{title}</DialogTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setFullScreen(s => !s)}>
                {fullScreen ? "Windowed" : "Max"}
              </Button>
              <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="h-full overflow-hidden">
          {baseRecording ? (
            <MultiCamEditor
              baseRecording={baseRecording}
              streams={streams}
              recordings={recordings}
              onRefresh={onRefresh}
            />
          ) : (
            <div className="p-6 text-sm text-muted-foreground">No recording selected.</div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

