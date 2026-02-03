import { PositionsGallery } from "@/components/PositionsGallery";

export function PositionsTab({ isActive }: { isActive: boolean }): JSX.Element {
  if (!isActive) {
    return <div className="text-sm text-muted-foreground">Select the tab to load positions.</div>;
  }
  return <PositionsGallery />;
}
