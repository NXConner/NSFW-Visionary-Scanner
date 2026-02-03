import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { VideoPlayer } from "@/components/video/VideoPlayer";
import type { VideoRecordingRow } from "@/lib/videoEditing";

type RecordingPreviewDialogProps = {
  open: boolean;
  recording: VideoRecordingRow | null;
  onClose: () => void;
};

export function RecordingPreviewDialog({
  open,
  recording,
  onClose,
}: RecordingPreviewDialogProps): JSX.Element {
  return (
    <Dialog
      open={open}
      onOpenChange={value => {
        if (!value) onClose();
      }}
    >
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Recording Preview</DialogTitle>
          <DialogDescription>
            Capture screenshots and review the recording before editing.
          </DialogDescription>
        </DialogHeader>
        {!recording ? (
          <div className="text-sm text-muted-foreground">Select a recording to preview.</div>
        ) : recording.video_url ? (
          <VideoPlayer
            videoUrl={recording.video_url}
            recordingId={recording.id}
            title={recording.recording_name}
            showScreenshots
          />
        ) : (
          <div className="text-sm text-muted-foreground">
            This recording does not have a playable URL yet.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
