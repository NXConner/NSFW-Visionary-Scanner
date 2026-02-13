import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Video, Play, Edit, RefreshCw } from "lucide-react";
import { formatDuration } from "@/lib/videoUtils";
import type { MultiCameraSession } from "@/lib/nsfwAdvancedFeatures";

function statusLabel(status: MultiCameraSession["recording_status"]): string {
  switch (status) {
    case "draft":
      return "Draft";
    case "recording":
      return "Recording";
    case "paused":
      return "Paused";
    case "completed":
      return "Completed";
    case "editing":
      return "Editing";
    case "published":
      return "Published";
    default:
      return status;
  }
}

function statusVariant(
  status: MultiCameraSession["recording_status"],
): "default" | "secondary" | "outline" | "destructive" {
  if (status === "recording") return "destructive";
  if (status === "completed") return "secondary";
  if (status === "draft") return "outline";
  return "secondary";
}

export function VideoCaptureSessionsTab(props: {
  sessions: MultiCameraSession[];
  selectedSessionId: string | null;
  loading: boolean;
  onSelectSession: (session: MultiCameraSession) => void;
  onRefresh: () => void;
  onRequestRecordTab: () => void;
}): JSX.Element {
  const { sessions, selectedSessionId, loading, onSelectSession, onRefresh, onRequestRecordTab } =
    props;

  if (!loading && sessions.length === 0) {
    return (
      <div className="text-center py-12">
        <Video className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No recording sessions yet</p>
        <Button className="mt-4" onClick={onRequestRecordTab}>
          Start Recording
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm text-muted-foreground">
          {loading
            ? "Loading sessions…"
            : `${sessions.length} session${sessions.length === 1 ? "" : "s"}`}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={onRefresh}
          disabled={loading}
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      <div className="space-y-3">
        {sessions.map(session => {
          const isSelected = selectedSessionId === session.id;
          const updated = session.updated_at ? new Date(session.updated_at).toLocaleString() : "";
          const duration = formatDuration(session.duration_seconds);

          return (
            <Card
              key={session.id}
              className={[
                "hover:bg-muted/30 transition-colors cursor-pointer",
                isSelected ? "ring-1 ring-primary/50" : "",
              ].join(" ")}
              onClick={() => onSelectSession(session)}
              role="button"
              tabIndex={0}
              onKeyDown={e => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectSession(session);
                }
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-muted/50">
                    <Video className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium truncate">{session.session_name}</span>
                      <Badge variant={statusVariant(session.recording_status)}>
                        {statusLabel(session.recording_status)}
                      </Badge>
                      <Badge variant="outline">{session.camera_count} camera(s)</Badge>
                      <Badge variant="secondary">{session.quality}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {duration} • {updated}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="gap-1" disabled>
                      <Play className="w-3 h-3" />
                      Play
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1" disabled>
                      <Edit className="w-3 h-3" />
                      Edit
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
