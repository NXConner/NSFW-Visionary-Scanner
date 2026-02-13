import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Copy, Link2, Send } from "lucide-react";

export function InvitePartnerDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partnerLoading: boolean;
  currentUserId: string | null;
  partnerIdInput: string;
  onPartnerIdInputChange: (value: string) => void;
  inviteDays: string;
  onInviteDaysChange: (value: string) => void;
  lastInviteCode: string | null;
  onCopyCode: (value: string) => void;
  onSendInvite: () => void;
}): JSX.Element {
  const {
    open,
    onOpenChange,
    partnerLoading,
    currentUserId,
    partnerIdInput,
    onPartnerIdInputChange,
    inviteDays,
    onInviteDaysChange,
    lastInviteCode,
    onCopyCode,
    onSendInvite,
  } = props;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="w-5 h-5" />
            Invite Partner
          </DialogTitle>
          <DialogDescription>
            Send an invite to sync recording sessions with your partner
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Your User ID</Label>
            <div className="flex gap-2">
              <Input value={currentUserId || ""} readOnly className="font-mono text-xs" />
              <Button
                variant="outline"
                size="icon"
                onClick={() => currentUserId && onCopyCode(currentUserId)}
                disabled={!currentUserId}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Share this with your partner</p>
          </div>

          <div className="space-y-2">
            <Label>Partner&apos;s User ID</Label>
            <Input
              value={partnerIdInput}
              onChange={e => onPartnerIdInputChange(e.target.value)}
              placeholder="Enter partner's user ID"
              className="font-mono"
            />
          </div>

          <div className="space-y-2">
            <Label>Invite Valid For</Label>
            <Select value={inviteDays} onValueChange={onInviteDaysChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 day</SelectItem>
                <SelectItem value="7">7 days</SelectItem>
                <SelectItem value="14">14 days</SelectItem>
                <SelectItem value="30">30 days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {lastInviteCode ? (
            <div className="p-3 rounded-lg bg-success/10 border border-success/30">
              <p className="text-sm font-medium mb-2">Invite Code Created!</p>
              <div className="flex gap-2">
                <Input value={lastInviteCode} readOnly className="font-mono" />
                <Button variant="outline" size="icon" onClick={() => onCopyCode(lastInviteCode)}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ) : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSendInvite} disabled={partnerLoading || !partnerIdInput.trim()}>
            <Link2 className="w-4 h-4 mr-2" />
            Send Invite
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
