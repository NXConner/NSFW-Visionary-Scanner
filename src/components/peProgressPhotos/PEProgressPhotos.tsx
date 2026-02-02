import { useMemo, useState } from "react";
import { ArrowLeftRight, Grid, Layers, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuditLog } from "@/hooks/useAuditLog";
import { useGenericStorage } from "@/hooks/useGenericStorage";
import { useVisualContent } from "@/hooks/useVisualContent";
import { VISUAL_CONTENT_CATEGORIES } from "@/lib/visualContentManager";
import { VisualContentDisplay } from "@/components/VisualContentDisplay";

import { AddEntryDialog } from "./AddEntryDialog";
import { CompareView } from "./CompareView";
import { OverlayView } from "./OverlayView";
import { TimelineView } from "./TimelineView";
import { ZoomDialog } from "./ZoomDialog";
import type { PEProgressEntry, PEProgressEntryDraft, PEProgressViewMode } from "./types";

export const PEProgressPhotos = () => {
  const [entries, setEntries] = useGenericStorage<PEProgressEntry[]>("pe_progress_photos", []);
  const [selectedLeft, setSelectedLeft] = useState<string>("");
  const [selectedRight, setSelectedRight] = useState<string>("");
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [viewMode, setViewMode] = useState<PEProgressViewMode>("compare");
  const { logActivity } = useAuditLog();

  const { content: peProgressVisuals } = useVisualContent({
    categories: [VISUAL_CONTENT_CATEGORIES.PROGRESS, VISUAL_CONTENT_CATEGORIES.EXERCISES],
    autoLoad: true,
    autoInvert: true,
  });

  const initialDraft = useMemo<PEProgressEntryDraft>(
    () => ({
      lengthBPEL: 0,
      lengthNBPEL: 0,
      lengthFlaccid: 0,
      girthBase: 0,
      girthMid: 0,
      girthHead: 0,
      notes: "",
      routine: "",
    }),
    [],
  );

  const [draft, setDraft] = useState<PEProgressEntryDraft>(initialDraft);

  const handleAddEntry = () => {
    if (!draft.imageData) {
      toast.error("Please capture or upload an image");
      return;
    }

    const entry: PEProgressEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      imageData: draft.imageData,
      lengthBPEL: draft.lengthBPEL || 0,
      lengthNBPEL: draft.lengthNBPEL || 0,
      lengthFlaccid: draft.lengthFlaccid || 0,
      girthBase: draft.girthBase || 0,
      girthMid: draft.girthMid || 0,
      girthHead: draft.girthHead || 0,
      notes: draft.notes || "",
      routine: draft.routine || "",
    };

    setEntries([...entries, entry]);
    logActivity("PE progress entry added", "data", `Entry ID: ${entry.id}`);
    toast.success("Progress entry added!");
    setShowAddForm(false);
    setDraft(initialDraft);
  };

  const handleDeleteEntry = (id: string) => {
    setEntries(entries.filter(e => e.id !== id));
    logActivity("PE progress entry deleted", "data", `Entry ID: ${id}`);
    toast.success("Entry deleted");
  };

  const leftEntry = entries.find(e => e.id === selectedLeft);
  const rightEntry = entries.find(e => e.id === selectedRight);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold gradient-text mb-2">PE Progress Tracker</h2>
        <p className="text-muted-foreground mb-4">
          Track your PE journey with photos and measurements
        </p>
        {peProgressVisuals.length > 0 && (
          <div className="mt-4 max-w-2xl mx-auto">
            <VisualContentDisplay
              content={peProgressVisuals.slice(0, 3)}
              title="Progress Tracking Examples"
              showThumbnails
              className="max-h-32"
            />
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <Button onClick={() => setShowAddForm(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Add Progress Entry
        </Button>
        <div className="flex gap-1 p-1 bg-muted/30 rounded-lg">
          <Button
            variant={viewMode === "compare" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("compare")}
          >
            <ArrowLeftRight className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === "timeline" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("timeline")}
          >
            <Grid className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === "overlay" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("overlay")}
          >
            <Layers className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {viewMode === "compare" && (
        <CompareView
          entries={entries}
          selectedLeft={selectedLeft}
          selectedRight={selectedRight}
          onSelectLeft={setSelectedLeft}
          onSelectRight={setSelectedRight}
          onZoom={setZoomedImage}
          onAddFirst={() => setShowAddForm(true)}
        />
      )}

      {viewMode === "timeline" && <TimelineView entries={entries} onDelete={handleDeleteEntry} />}

      {viewMode === "overlay" && leftEntry && rightEntry ? (
        <OverlayView left={leftEntry} right={rightEntry} />
      ) : (
        viewMode === "overlay" && (
          <Card className="glass-card border-border/50">
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              Select two entries in Compare mode first, then switch back to Overlay.
            </CardContent>
          </Card>
        )
      )}

      <AddEntryDialog
        open={showAddForm}
        onOpenChange={setShowAddForm}
        draft={draft}
        setDraft={setDraft}
        onSave={handleAddEntry}
      />

      <ZoomDialog zoomedImage={zoomedImage} onClose={() => setZoomedImage(null)} />
    </div>
  );
};

export default PEProgressPhotos;
