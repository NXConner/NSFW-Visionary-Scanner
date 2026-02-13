import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Edit, Play, Video } from "lucide-react";
import type { MultiCameraSession } from "@/lib/nsfwAdvancedFeatures";

export function SessionsTab(props: {
  loadingSessions: boolean;
  sessions: MultiCameraSession[];
  formatSessionMeta: (session: MultiCameraSession) => string;
  onStartRecording: () => void;
}): JSX.Element {
  const { loadingSessions, sessions, formatSessionMeta, onStartRecording } = props;

  if (loadingSessions) {
    return <div className="text-center py-12 text-muted-foreground">Loading sessions...</div>;
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-12">
        <Video className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No recording sessions yet</p>
        <Button className="mt-4" onClick={onStartRecording}>
          Start Recording
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sessions.map(session => (
        <Card key={session.id} className="hover:bg-muted/30 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-muted/50">
                <Video className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{session.session_name}</span>
                  {(() => {
                    const cameraCount = session.camera_count ?? 1;
                    return (
                      <Badge variant="secondary">
                        {cameraCount} camera{cameraCount === 1 ? "" : "s"}
                      </Badge>
                    );
                  })()}
                  <Badge variant={session.recording_status === "recording" ? "default" : "outline"}>
                    {session.recording_status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{formatSessionMeta(session)}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="gap-1">
                  <Play className="w-3 h-3" />
                  Play
                </Button>
                <Button size="sm" variant="outline" className="gap-1">
                  <Edit className="w-3 h-3" />
                  Edit
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
