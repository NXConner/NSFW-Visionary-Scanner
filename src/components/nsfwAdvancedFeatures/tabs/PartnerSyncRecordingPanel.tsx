import { useCallback, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  createPartnerSyncSession,
  getMultiCameraSessionById,
  type MultiCameraSession,
} from "@/lib/nsfwAdvancedFeatures";
import { usePartnerConnection, usePartnerEvents } from "@/lib/partnerSync";
import { Link2, Users } from "lucide-react";

type PartnerInvite = {
  sessionId: string;
  sessionName: string;
  quality: string;
  createdAt: string;
  actorId: string;
};

type PartnerSyncRecordingPanelProps = {
  sessions: MultiCameraSession[];
  currentSession: MultiCameraSession | null;
  onAddSession: (session: MultiCameraSession) => void;
  onSelectSession: (session: MultiCameraSession) => void;
};

export function PartnerSyncRecordingPanel({
  sessions,
  currentSession,
  onAddSession,
  onSelectSession,
}: PartnerSyncRecordingPanelProps): JSX.Element {
  const [busy, setBusy] = useState(false);
  const { activeConnection, currentUserId } = usePartnerConnection();
  const connectionId = activeConnection?.id ?? null;
  const partnerId = useMemo(() => {
    if (!activeConnection || !currentUserId) return null;
    return activeConnection.user_id === currentUserId
      ? activeConnection.partner_id
      : activeConnection.user_id;
  }, [activeConnection, currentUserId]);
  const { events } = usePartnerEvents(connectionId);

  const existingSessionIds = useMemo(() => new Set(sessions.map(s => s.id)), [sessions]);

  const invites = useMemo(() => {
    const list: PartnerInvite[] = [];
    for (const event of events) {
      if (event.event_type !== "partner_recording_session_created") continue;
      const meta = (event.metadata || {}) as Record<string, unknown>;
      const sessionId = String(meta.session_id || "");
      if (!sessionId || event.actor_id === currentUserId) continue;
      list.push({
        sessionId,
        sessionName: String(meta.session_name || "Partner Session"),
        quality: String(meta.quality || "1080p"),
        createdAt: event.created_at,
        actorId: event.actor_id,
      });
    }
    const unique = new Map<string, PartnerInvite>();
    for (const invite of list) {
      if (!unique.has(invite.sessionId)) unique.set(invite.sessionId, invite);
    }
    return Array.from(unique.values()).slice(0, 6);
  }, [events, currentUserId]);

  const handleCreateSession = useCallback(async () => {
    if (!partnerId || !connectionId) {
      toast.error("Connect with a partner first");
      return;
    }
    setBusy(true);
    try {
      const name = `Partner Sync ${new Date().toLocaleString()}`;
      const session = await createPartnerSyncSession({
        sessionName: name,
        partnerId,
        connectionId,
      });
      if (!session) return;
      onAddSession(session);
      onSelectSession(session);
      toast.success("Partner sync session created");
    } finally {
      setBusy(false);
    }
  }, [connectionId, onAddSession, onSelectSession, partnerId]);

  const handleJoinSession = useCallback(
    async (sessionId: string) => {
      setBusy(true);
      try {
        const session = await getMultiCameraSessionById(sessionId);
        if (!session) {
          toast.error("Session not found or no access");
          return;
        }
        if (!existingSessionIds.has(session.id)) {
          onAddSession(session);
        }
        onSelectSession(session);
        toast.success("Joined partner session");
      } finally {
        setBusy(false);
      }
    },
    [existingSessionIds, onAddSession, onSelectSession],
  );

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="w-4 h-4" />
          Partner Sync Recording
        </CardTitle>
        <CardDescription>
          Invite your partner to record into the same session from another device.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {!activeConnection ? (
          <div className="text-sm text-muted-foreground">
            Connect with a partner to enable synced recording sessions.
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">Connected</Badge>
              {currentSession?.session_type === "partner_sync" && (
                <Badge variant="outline">Active partner session</Badge>
              )}
            </div>
            <Button
              variant="outline"
              className="gap-2"
              onClick={handleCreateSession}
              disabled={busy}
            >
              <Link2 className="w-4 h-4" />
              Create shared session
            </Button>
          </>
        )}

        {invites.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground uppercase tracking-wide">Invites</div>
            <div className="space-y-2">
              {invites.map(invite => (
                <div
                  key={invite.sessionId}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border border-border/50 rounded p-3"
                >
                  <div className="min-w-0">
                    <div className="font-medium truncate">{invite.sessionName}</div>
                    <div className="text-xs text-muted-foreground">
                      {invite.quality} • {new Date(invite.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() => void handleJoinSession(invite.sessionId)}
                  >
                    {existingSessionIds.has(invite.sessionId) ? "Open" : "Join"}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {!activeConnection && invites.length === 0 && (
          <div className="text-xs text-muted-foreground">
            Connect to a partner to receive shared session invites.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
