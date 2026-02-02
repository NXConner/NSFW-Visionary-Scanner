import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FilteredImage } from "@/components/media/FilteredImage";

export function ZoomDialog(props: { zoomedImage: string | null; onClose: () => void }) {
  return (
    <Dialog open={!!props.zoomedImage} onOpenChange={props.onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Photo Detail</DialogTitle>
        </DialogHeader>
        {props.zoomedImage && (
          <FilteredImage src={props.zoomedImage} alt="Zoomed" className="w-full rounded-lg" />
        )}
      </DialogContent>
    </Dialog>
  );
}
