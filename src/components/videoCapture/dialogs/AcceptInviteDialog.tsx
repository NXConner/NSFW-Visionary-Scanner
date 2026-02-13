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
import { Check, UserPlus } from "lucide-react";

export function AcceptInviteDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partnerLoading: boolean;
  inviteCodeInput: string;
  onInviteCodeInputChange: (value: string) => void;
  onAcceptInvite: () => void;
}): JSX.Element {
  const {
    open,
    onOpenChange,
    partnerLoading,
    inviteCodeInput,
    onInviteCodeInputChange,
    onAcceptInvite,
  } = props;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Accept Invite
          </DialogTitle>
          <DialogDescription>Enter the invite code from your partner to connect</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Invite Code</Label>
            <Input
              value={inviteCodeInput}
              onChange={e => onInviteCodeInputChange(e.target.value)}
              placeholder="PSC-XXXXXXX"
              className="font-mono"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onAcceptInvite} disabled={partnerLoading || !inviteCodeInput.trim()}>
            <Check className="w-4 h-4 mr-2" />
            Accept Invite
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
