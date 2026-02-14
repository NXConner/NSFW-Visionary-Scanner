import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Plus, Trash2, Users } from "lucide-react";
import type { PartnerConnection } from "@/lib/partnerSync";

export function PartnerTab(props: {
  activeConnection: PartnerConnection | null;
  pendingIncoming: PartnerConnection[];
  pendingOutgoing: PartnerConnection[];
  partnerLoading: boolean;
  onDisconnect: (connectionId: string) => void;
  onAcceptConnection: (connectionId: string) => void;
  onDeclineConnection: (connectionId: string) => void;
  onOpenInviteDialog: () => void;
  onOpenAcceptInviteDialog: () => void;
}): JSX.Element {
  const {
    activeConnection,
    pendingIncoming,
    pendingOutgoing,
    partnerLoading,
    onDisconnect,
    onAcceptConnection,
    onDeclineConnection,
    onOpenInviteDialog,
    onOpenAcceptInviteDialog,
  } = props;

  return (
    <div className="space-y-4 mt-4">
      {activeConnection ? (
        <Card className="border-success/30 bg-success/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-success/10">
                <Check className="w-6 h-6 text-success" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Partner Connected</span>
                  <Badge className="bg-success">Active</Badge>
                </div>
                <p className="text-sm text-muted-foreground">Ready to sync recording sessions</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDisconnect(activeConnection.id)}
                className="gap-1 text-destructive"
                disabled={partnerLoading}
              >
                <Trash2 className="w-4 h-4" />
                Disconnect
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">Partner Sync Recording</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
                Sync your recording session with a partner&apos;s device for multi-angle captures
              </p>
              <div className="flex gap-2 justify-center">
                <Button className="gap-2" onClick={onOpenInviteDialog} disabled={partnerLoading}>
                  <Plus className="w-4 h-4" />
                  Invite Partner
                </Button>
                <Button
                  variant="outline"
                  onClick={onOpenAcceptInviteDialog}
                  disabled={partnerLoading}
                >
                  Enter Invite Code
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending invites */}
      {pendingIncoming.length > 0 || pendingOutgoing.length > 0 ? (
        <div className="space-y-3">
          <h3 className="font-medium">Pending Invites</h3>
          {pendingIncoming.map(invite => (
            <Card key={invite.id} className="border-primary/30">
              <CardContent className="pt-4 flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">Incoming Invite</p>
                  <p className="text-xs text-muted-foreground">From: {invite.user_id}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => onAcceptConnection(invite.id)}
                    disabled={partnerLoading}
                  >
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onDeclineConnection(invite.id)}
                    disabled={partnerLoading}
                  >
                    Decline
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {pendingOutgoing.map(invite => (
            <Card key={invite.id} className="border-border/60">
              <CardContent className="pt-4 flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">Outgoing Invite</p>
                  <p className="text-xs text-muted-foreground">To: {invite.partner_id}</p>
                </div>
                <Badge variant="secondary">Pending</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  );
}
