/**
 * Admin Notifications Panel (database-backed)
 * Replaces the prior hardcoded demo/sample notification history.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Send, Clock, CheckCircle, Users } from "lucide-react";
import {
  AdminBroadcastNotificationComposerCard,
  AdminBroadcastNotificationHistoryCard,
  adminListBroadcastNotifications,
  type AdminBroadcastNotificationDto,
  type AdminBroadcastNotificationsStats,
} from "@/components/admin/notifications";

function readRatePercent(n: AdminBroadcastNotificationDto): number {
  const denom = Math.max(0, n.targetCount || 0);
  if (denom <= 0) return 0;
  return Math.round((Math.max(0, n.readCount || 0) / denom) * 100);
}

export function AdminNotificationsPanel(): JSX.Element {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminBroadcastNotificationsStats | null>(null);
  const [notifications, setNotifications] = useState<AdminBroadcastNotificationDto[]>([]);
  const [editing, setEditing] = useState<AdminBroadcastNotificationDto | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminListBroadcastNotifications({ limit: 250, includeDeleted: false });
      setNotifications(res.notifications);
      setStats(res.stats);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const interval = setInterval(() => void refresh(), 30000);
    return () => clearInterval(interval);
  }, [refresh]);

  const computed = useMemo(() => {
    const sent = notifications.filter(n => !n.isDeleted && n.status === "sent");
    const scheduled = notifications.filter(n => !n.isDeleted && n.status === "scheduled");
    const avgRead =
      sent.length === 0
        ? 0
        : Math.round(sent.reduce((sum, n) => sum + readRatePercent(n), 0) / sent.length);
    return { sentCount: sent.length, scheduledCount: scheduled.length, avgRead };
  }, [notifications]);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Sent</p>
                <p className="text-2xl font-bold">{computed.sentCount}</p>
              </div>
              <Send className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Scheduled</p>
                <p className="text-2xl font-bold">{computed.scheduledCount}</p>
              </div>
              <Clock className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Read Rate</p>
                <p className="text-2xl font-bold">{computed.avgRead}%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{stats?.totalUsers ?? "—"}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <AdminBroadcastNotificationComposerCard
          editing={editing}
          stats={stats}
          onChanged={refresh}
          onClearEditing={() => setEditing(null)}
        />
        <AdminBroadcastNotificationHistoryCard
          loading={loading}
          notifications={notifications}
          onRefresh={refresh}
          onEdit={n => setEditing(n)}
          onDuplicate={n => {
            setEditing({
              ...n,
              id: "",
              createdAtIso: new Date().toISOString(),
              updatedAtIso: new Date().toISOString(),
              status: "draft",
              scheduledForIso: null,
              sentAtIso: null,
              targetCount: 0,
              readCount: 0,
              lastError: null,
              isDeleted: false,
              deletedAtIso: null,
              createdBy: null,
            });
          }}
        />
      </div>
    </div>
  );
}
