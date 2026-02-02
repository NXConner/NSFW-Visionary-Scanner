import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { User } from "@supabase/supabase-js";

export function FeedbackHubStatus(props: {
  user: User | null;
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  feedbackPending: number;
  localSavedCount: number;
  submitting: boolean;
  onSendSaved: () => void;
  onClearSaved: () => void;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      <div className="rounded-xl border border-border/60 bg-secondary/20 p-3">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">Connectivity</div>
        <div className="mt-1 flex items-center gap-2">
          <span
            className={`text-sm font-medium ${props.isOnline ? "text-success" : "text-destructive"}`}
          >
            {props.isOnline ? "Online" : "Offline"}
          </span>
          {props.isSyncing && <span className="text-xs text-muted-foreground">Syncing…</span>}
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          Pending sync: <span className="font-medium">{props.pendingCount}</span> (feedback:{" "}
          <span className="font-medium">{props.feedbackPending}</span>)
        </div>
      </div>

      <div className="rounded-xl border border-border/60 bg-secondary/20 p-3">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">Saved locally</div>
        <div className="mt-1 text-sm font-medium">{props.localSavedCount}</div>
        <div className="mt-1 flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={props.onSendSaved}
            disabled={props.submitting}
          >
            <Send className="w-4 h-4 mr-1" />
            Send saved
          </Button>
          <Button size="sm" variant="ghost" onClick={props.onClearSaved}>
            Clear
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border/60 bg-secondary/20 p-3">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">Account</div>
        <div className="mt-1 text-sm font-medium">{props.user ? "Signed in" : "Not signed in"}</div>
        <div className="mt-1 text-xs text-muted-foreground">
          {props.user
            ? "Feedback is sent to your private inbox."
            : "Sign in to send feedback to the team."}
        </div>
      </div>
    </div>
  );
}
