import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Check, Copy, Link2, Lock, Send, Shield, Trash2, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import type { PartnerConnection } from "@/lib/partnerSync";
import type { PartnerPermissionType, PartnerPermissionsMap } from "@/lib/partnerSync/usePartnerPermissions";
import { formatDateTime, getPartnerUserId } from "@/lib/partnerSync";

type InviteInput = {
  partnerId: string;
  expiresInDays?: number;
};

type PartnerConnectionCardProps = {
  connection: PartnerConnection | null;
  currentUserId: string | null;
  pendingIncoming: PartnerConnection[];
  pendingOutgoing: PartnerConnection[];
  lastInviteCode: string | null;
  loading: boolean;
  permissions: PartnerPermissionsMap;
  onInvite: (input: InviteInput) => Promise<PartnerConnection | null>;
  onAcceptInvite: (code: string) => Promise<boolean>;
  onAcceptConnection: (connectionId: string) => Promise<boolean>;
  onDeclineConnection: (connectionId: string) => Promise<boolean>;
  onDisconnect: (connectionId: string) => Promise<boolean>;
  onTogglePermission: (type: PartnerPermissionType, value: boolean) => Promise<boolean>;
};

const PERMISSION_LABEL_KEYS: Record<PartnerPermissionType, string> = {
  scans: "partnerSync.connection.permissions.scans",
  wellness_scores: "partnerSync.connection.permissions.wellness_scores",
  diary_entries: "partnerSync.connection.permissions.diary_entries",
  goals: "partnerSync.connection.permissions.goals",
  progress_photos: "partnerSync.connection.permissions.progress_photos",
};

export function PartnerConnectionCard({
  connection,
  currentUserId,
  pendingIncoming,
  pendingOutgoing,
  lastInviteCode,
  loading,
  permissions,
  onInvite,
  onAcceptInvite,
  onAcceptConnection,
  onDeclineConnection,
  onDisconnect,
  onTogglePermission,
}: PartnerConnectionCardProps) {
  const { t, language } = useI18n();
  const [partnerIdInput, setPartnerIdInput] = useState("");
  const [inviteDays, setInviteDays] = useState("7");
  const [inviteCodeInput, setInviteCodeInput] = useState("");

  const partnerId = useMemo(
    () => getPartnerUserId(connection, currentUserId),
    [connection, currentUserId],
  );

  const handleInvite = async () => {
    const days = Number(inviteDays) || 7;
    const result = await onInvite({ partnerId: partnerIdInput, expiresInDays: days });
    if (result) setPartnerIdInput("");
  };

  const handleCopy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success(t("partnerSync.connection.copySuccess"));
    } catch {
      toast.error(t("partnerSync.connection.copyError"));
    }
  };

  return (
    <Card className="glass-card border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-6 h-6" />
          {t("partnerSync.connection.title")}
        </CardTitle>
        <CardDescription>
          {t("partnerSync.connection.subtitle")}
        </CardDescription>
        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
          <Shield className="w-3 h-3" />
          {t("partnerSync.connection.autoConnectNote")}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {connection ? (
          <>
            <Card className="border-success/30 bg-success/5">
              <CardContent className="pt-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-success/10">
                    <Check className="w-6 h-6 text-success" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{t("partnerSync.connection.connected")}</span>
                      <Badge className="bg-success gap-1">{t("partnerSync.connection.accepted")}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {t("partnerSync.connection.partnerId")}: {partnerId ?? t("partnerSync.connection.unknown")}
                    </p>
                    {connection.accepted_at && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {t("partnerSync.connection.connectedAt")}{" "}
                        {formatDateTime(connection.accepted_at, language)}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void onDisconnect(connection.id)}
                    className="gap-1 text-destructive"
                    disabled={loading}
                  >
                    <Trash2 className="w-4 h-4" />
                    {t("partnerSync.connection.disconnect")}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">{t("partnerSync.connection.permissionsTitle")}</h3>
                <Badge variant="secondary">{t("partnerSync.connection.permissionsHint")}</Badge>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {Object.entries(PERMISSION_LABEL_KEYS).map(([type, labelKey]) => (
                  <div
                    key={type}
                    className="flex items-center justify-between p-3 rounded-lg border border-border"
                  >
                    <div>
                      <p className="font-medium">{t(labelKey)}</p>
                      <p className="text-xs text-muted-foreground">
                        {t("partnerSync.connection.permissionsHelp")}
                      </p>
                    </div>
                    <Switch
                      checked={permissions[type as PartnerPermissionType]}
                      onCheckedChange={value =>
                        void onTogglePermission(type as PartnerPermissionType, value)
                      }
                      disabled={loading}
                    />
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="text-center">
                  <div className="p-3 rounded-full bg-primary/10 inline-block mb-2">
                    <Send className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold">{t("partnerSync.connection.inviteTitle")}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t("partnerSync.connection.inviteSubtitle")}
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>{t("partnerSync.connection.partnerIdLabel")}</Label>
                    <Input
                      value={partnerIdInput}
                      onChange={e => setPartnerIdInput(e.target.value)}
                      placeholder={t("partnerSync.connection.partnerIdPlaceholder")}
                      autoComplete="off"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("partnerSync.connection.inviteExpiry")}</Label>
                    <Input
                      type="number"
                      min={1}
                      max={30}
                      value={inviteDays}
                      onChange={e => setInviteDays(e.target.value)}
                    />
                  </div>
                  <Button className="w-full gap-2" onClick={handleInvite} disabled={loading}>
                    <Link2 className="w-4 h-4" />
                    {t("partnerSync.connection.createInvite")}
                  </Button>
                  {lastInviteCode && (
                    <div className="flex items-center gap-2">
                      <Input value={lastInviteCode} readOnly className="font-mono text-center" />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => void handleCopy(lastInviteCode)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="text-center">
                  <div className="p-3 rounded-full bg-secondary inline-block mb-2">
                    <UserPlus className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold">{t("partnerSync.connection.acceptInviteTitle")}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t("partnerSync.connection.acceptInviteSubtitle")}
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>{t("partnerSync.connection.inviteCode")}</Label>
                    <Input
                      placeholder={t("partnerSync.connection.inviteCodePlaceholder")}
                      value={inviteCodeInput}
                      onChange={e => setInviteCodeInput(e.target.value)}
                      className="font-mono"
                    />
                  </div>
                  <Button
                    className="w-full gap-2"
                    onClick={() => void onAcceptInvite(inviteCodeInput)}
                    disabled={loading}
                  >
                    <Check className="w-4 h-4" />
                    {t("partnerSync.connection.acceptInvite")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {(pendingIncoming.length > 0 || pendingOutgoing.length > 0) && (
          <div className="space-y-3">
            <h3 className="font-medium">{t("partnerSync.connection.pendingInvites")}</h3>
            <div className="space-y-3">
              {pendingIncoming.map(invite => (
                <Card key={invite.id} className="border border-border/60">
                  <CardContent className="pt-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{t("partnerSync.connection.pendingIncoming")}</p>
                      <p className="text-xs text-muted-foreground">
                        {t("partnerSync.connection.from")}: {invite.user_id}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => void onAcceptConnection(invite.id)}
                        disabled={loading}
                      >
                        {t("partnerSync.connection.accept")}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void onDeclineConnection(invite.id)}
                        disabled={loading}
                      >
                        {t("partnerSync.connection.decline")}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {pendingOutgoing.map(invite => (
                <Card key={invite.id} className="border border-border/60">
                  <CardContent className="pt-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{t("partnerSync.connection.pendingOutgoing")}</p>
                      <p className="text-xs text-muted-foreground">
                        {t("partnerSync.connection.to")}: {invite.partner_id}
                      </p>
                    </div>
                    <Badge variant="secondary">{t("partnerSync.connection.pending")}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        <Card className="bg-muted/30">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">{t("partnerSync.connection.privacyTitle")}</p>
                <p className="text-xs text-muted-foreground">{t("partnerSync.connection.privacyCopy")}</p>
              </div>
              <Lock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}
