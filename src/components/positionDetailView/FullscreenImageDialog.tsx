import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export function FullscreenImageDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  src: string;
  alt: string;
  mediaFilterClass?: string;
}): JSX.Element {
  const { open, onOpenChange, src, alt, mediaFilterClass = "" } = props;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[95vh] p-0" aria-describedby={undefined}>
        <DialogHeader className="sr-only">
          <DialogTitle>Fullscreen Image</DialogTitle>
        </DialogHeader>
        <div className="relative w-full h-[95vh] bg-black">
          <img src={src} alt={alt} className={`w-full h-full object-contain ${mediaFilterClass}`} />
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white hover:bg-white/20"
            onClick={() => onOpenChange(false)}
          >
            <X className="w-6 h-6" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
