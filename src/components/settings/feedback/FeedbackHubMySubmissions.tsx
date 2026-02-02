import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { logger } from "@/lib/logger";
import { listMyFeedback, type FeedbackRow } from "@/lib/feedback";
import { kindIcon, kindLabel, statusBadgeVariant } from "./utils";

export function FeedbackHubMySubmissions(props: { refreshKey?: number }) {
  const { user } = useAuth();
  const [rows, setRows] = useState<FeedbackRow[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await listMyFeedback({ userId: user.id, limit: 25 });
      setRows(data);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load feedback";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, props.refreshKey]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold">My submissions</div>
          <div className="text-xs text-muted-foreground">
            Status updates appear here (requires sign-in).
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            logger.userAction("feedback_refresh", user?.id, {});
            void refresh();
          }}
          disabled={!user || loading}
          className="gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      <Separator />

      {!user && (
        <p className="text-sm text-muted-foreground">Sign in to see your sent feedback history.</p>
      )}

      {user && rows.length === 0 && !loading && (
        <p className="text-sm text-muted-foreground">No submissions yet.</p>
      )}

      {user && rows.length > 0 && (
        <div className="space-y-2">
          {rows.slice(0, 10).map(row => (
            <div
              key={row.id}
              className="rounded-xl border border-border/60 bg-secondary/10 p-3 flex items-start gap-3"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                {(() => {
                  const I = kindIcon(row.kind);
                  return <I className="w-5 h-5 text-primary" />;
                })()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="font-medium truncate">{row.title}</div>
                  <Badge variant="outline">{kindLabel(row.kind)}</Badge>
                  <Badge variant={statusBadgeVariant(row.status)}>{row.status ?? "new"}</Badge>
                  {typeof row.rating === "number" && (
                    <Badge variant="secondary">{row.rating}/10</Badge>
                  )}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {new Date(row.created_at).toLocaleString()}
                </div>
                <div className="mt-2 text-sm text-muted-foreground line-clamp-2">
                  {row.description}
                </div>
                {row.admin_response && (
                  <div className="mt-2 rounded-lg bg-primary/5 border border-primary/20 p-2">
                    <div className="text-xs font-semibold text-primary">Team response</div>
                    <div className="text-sm">{row.admin_response}</div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
