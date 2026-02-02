import { VisualContent } from "@/lib/visualContentManager";
import { VisualContentDisplay } from "@/components/VisualContentDisplay";
import { ScanMode } from "@/components/scanner/types";

export function ScannerHeaderBlock({
  scanMode,
  scannerVisuals,
}: {
  scanMode: ScanMode;
  scannerVisuals: VisualContent[];
}) {
  return (
    <div className="text-center mb-12 animate-fade-in">
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        <span className="text-sm text-primary font-medium">Medical-Grade Scanner</span>
      </div>
      <h2 className="text-3xl md:text-4xl font-bold mb-4">
        <span className="gradient-text">Advanced Morphology</span> Scanner
      </h2>
      <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
        AI-powered scanning with precision measurement. All data encrypted and stored locally.
      </p>

      {scannerVisuals.length > 0 && scanMode === "idle" && (
        <div className="mt-6 max-w-3xl mx-auto">
          <VisualContentDisplay
            content={scannerVisuals
              .filter(v =>
                v.tags.some(
                  tag =>
                    tag.includes("positioning") ||
                    tag.includes("scanner") ||
                    tag.includes("measurement"),
                ),
              )
              .slice(0, 2)}
            title="Positioning Guide"
            showThumbnails
            className="max-h-48"
          />
        </div>
      )}
    </div>
  );
}
