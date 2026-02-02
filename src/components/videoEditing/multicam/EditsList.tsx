import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw } from "lucide-react";
import type { VideoEditRow } from "@/lib/videoEditing";

function statusVariant(status: string): "secondary" | "default" | "destructive" {
  if (status === "completed") return "default";
  if (status === "failed") return "destructive";
  return "secondary";
}

export function EditsList(props: {
  recordingId: string;
  edits: VideoEditRow[];
  loading: boolean;
  onRefresh: () => void;
}): JSX.Element {
  const { edits, loading, onRefresh } = props;

  return (
    <div className="p-3 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-medium">Queued / processed edits</div>
        <Button size="sm" variant="outline" onClick={onRefresh} className="gap-2" disabled={loading}>
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {edits.length === 0 ? (
        <div className="text-sm text-muted-foreground">No edits yet.</div>
      ) : (
        <div className="space-y-2">
          {edits.map(e => (
            <Card key={e.id} className="p-3 border-border/50">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium truncate">{e.edit_name ?? e.edit_type}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {e.edit_type} · {e.created_at ?? ""}
                  </div>
                </div>
                <Badge variant={statusVariant(e.edit_status)}>{e.edit_status}</Badge>
              </div>

              <div className="mt-2 flex flex-wrap gap-2">
                {e.preview_url && (
                  <a
                    className="text-sm underline text-primary"
                    href={e.preview_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Preview
                  </a>
                )}
                {e.edited_video_url && (
                  <a
                    className="text-sm underline text-primary"
                    href={e.edited_video_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Output
                  </a>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

