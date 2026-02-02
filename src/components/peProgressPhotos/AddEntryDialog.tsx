import { useCallback } from "react";
import { Camera } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import type { PEProgressEntryDraft } from "./types";

export function AddEntryDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draft: PEProgressEntryDraft;
  setDraft: (next: PEProgressEntryDraft) => void;
  onSave: () => void;
}) {
  const handleImageCapture = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onloadend = () => {
        props.setDraft({ ...props.draft, imageData: reader.result as string });
      };
      reader.readAsDataURL(file);
    },
    [props],
  );

  const clearImage = () => props.setDraft({ ...props.draft, imageData: undefined });

  const num = (raw: string) => {
    const v = parseFloat(raw);
    return Number.isFinite(v) ? v : 0;
  };

  const requireImage = () => {
    if (!props.draft.imageData) {
      toast.error("Please capture or upload an image");
      return false;
    }
    return true;
  };

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Progress Entry</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block" htmlFor="pe-progress-photo-input">
              Photo
            </label>
            {props.draft.imageData ? (
              <div className="relative aspect-video rounded-lg overflow-hidden bg-muted/20">
                <img
                  src={props.draft.imageData}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                <Button
                  size="sm"
                  variant="secondary"
                  className="absolute bottom-2 right-2"
                  onClick={clearImage}
                >
                  Change
                </Button>
              </div>
            ) : (
              <label
                htmlFor="pe-progress-photo-input"
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border/50 rounded-lg cursor-pointer hover:bg-muted/20"
              >
                <Camera className="w-8 h-8 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">Capture or upload photo</span>
                <input
                  id="pe-progress-photo-input"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleImageCapture}
                />
              </label>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium" htmlFor="pe-progress-bpel">
                BPEL (cm)
              </label>
              <Input
                id="pe-progress-bpel"
                type="number"
                step="0.1"
                value={props.draft.lengthBPEL ?? ""}
                onChange={e => props.setDraft({ ...props.draft, lengthBPEL: num(e.target.value) })}
              />
            </div>
            <div>
              <label className="text-sm font-medium" htmlFor="pe-progress-nbpel">
                NBPEL (cm)
              </label>
              <Input
                id="pe-progress-nbpel"
                type="number"
                step="0.1"
                value={props.draft.lengthNBPEL ?? ""}
                onChange={e => props.setDraft({ ...props.draft, lengthNBPEL: num(e.target.value) })}
              />
            </div>
            <div>
              <label className="text-sm font-medium" htmlFor="pe-progress-flaccid">
                Flaccid (cm)
              </label>
              <Input
                id="pe-progress-flaccid"
                type="number"
                step="0.1"
                value={props.draft.lengthFlaccid ?? ""}
                onChange={e =>
                  props.setDraft({ ...props.draft, lengthFlaccid: num(e.target.value) })
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium" htmlFor="pe-progress-girth-base">
                Girth Base (cm)
              </label>
              <Input
                id="pe-progress-girth-base"
                type="number"
                step="0.1"
                value={props.draft.girthBase ?? ""}
                onChange={e => props.setDraft({ ...props.draft, girthBase: num(e.target.value) })}
              />
            </div>
            <div>
              <label className="text-sm font-medium" htmlFor="pe-progress-girth-mid">
                Girth Mid (cm)
              </label>
              <Input
                id="pe-progress-girth-mid"
                type="number"
                step="0.1"
                value={props.draft.girthMid ?? ""}
                onChange={e => props.setDraft({ ...props.draft, girthMid: num(e.target.value) })}
              />
            </div>
            <div>
              <label className="text-sm font-medium" htmlFor="pe-progress-girth-head">
                Girth Head (cm)
              </label>
              <Input
                id="pe-progress-girth-head"
                type="number"
                step="0.1"
                value={props.draft.girthHead ?? ""}
                onChange={e => props.setDraft({ ...props.draft, girthHead: num(e.target.value) })}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium" htmlFor="pe-progress-routine">
              Current Routine
            </label>
            <Input
              id="pe-progress-routine"
              placeholder="e.g., Beginner routine - week 4"
              value={props.draft.routine ?? ""}
              onChange={e => props.setDraft({ ...props.draft, routine: e.target.value })}
            />
          </div>

          <div>
            <label className="text-sm font-medium" htmlFor="pe-progress-notes">
              Notes
            </label>
            <Textarea
              id="pe-progress-notes"
              placeholder="Any observations or notes..."
              value={props.draft.notes ?? ""}
              onChange={e => props.setDraft({ ...props.draft, notes: e.target.value })}
            />
          </div>

          <Button
            onClick={() => {
              if (!requireImage()) return;
              props.onSave();
            }}
            className="w-full"
          >
            Save Progress Entry
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
