import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useData, ScanEntry, DiaryEntry } from "@/contexts/DataContext";
import { Upload, FileJson, AlertCircle, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { z } from "zod";

const backupSchema = z
  .object({
    scans: z.array(
      z
        .object({
          id: z.string(),
          created_at: z.string(),
          scan_type: z.string(),
          length: z.number(),
          circumference: z.number(),
          erect_length: z.number().nullable().optional(),
          erect_circumference: z.number().nullable().optional(),
          measurement_context: z.unknown().optional(),
          curvature_angle: z.number(),
          curvature_direction: z.string(),
          image_data: z.string().nullable(),
          notes: z.string().nullable(),
        })
        .passthrough(),
    ),
    diaryEntries: z.array(
      z
        .object({
          id: z.string(),
          entry_date: z.string(),
          length: z.number().nullable(),
          circumference: z.number().nullable(),
          curvature_angle: z.number().nullable(),
          curvature_direction: z.string().nullable(),
          pain_level: z.number().nullable(),
          symptoms: z.array(z.string()),
          notes: z.string().nullable(),
          created_at: z.string(),
        })
        .passthrough(),
    ),
    exportedAt: z.string().optional(),
  })
  .passthrough();

export const DataImport = () => {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<{ scans: number; diary: number } | null>(null);
  const [fileData, setFileData] = useState<{
    scans: ScanEntry[];
    diaryEntries: DiaryEntry[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { importData, scans, diaryEntries } = useData();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setPreview(null);
    setFileData(null);

    if (!file.name.endsWith(".json")) {
      setError("Please select a JSON file");
      return;
    }

    const reader = new FileReader();
    reader.onload = event => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        const result = backupSchema.safeParse(parsed);

        if (!result.success) {
          setError("Invalid backup file format. Please use a file exported from MorphoScan.");
          return;
        }

        setFileData(result.data as { scans: ScanEntry[]; diaryEntries: DiaryEntry[] });
        setPreview({
          scans: result.data.scans.length,
          diary: result.data.diaryEntries.length,
        });
      } catch {
        setError("Could not read file. Please ensure it's a valid JSON backup.");
      }
    };
    reader.readAsText(file);
  };

  const handleImport = (mode: "merge" | "replace") => {
    if (!fileData) return;

    if (mode === "replace") {
      importData(fileData);
      toast.success("Data replaced!", {
        description: `Imported ${fileData.scans.length} scans and ${fileData.diaryEntries.length} diary entries`,
      });
    } else {
      // Merge mode - add new entries without duplicates
      const existingScanIds = new Set(scans.map(s => s.id));
      const existingDiaryIds = new Set(diaryEntries.map(d => d.id));

      const newScans = fileData.scans.filter(s => !existingScanIds.has(s.id));
      const newDiary = fileData.diaryEntries.filter(d => !existingDiaryIds.has(d.id));

      importData({
        scans: [...scans, ...newScans],
        diaryEntries: [...diaryEntries, ...newDiary],
      });

      toast.success("Data merged!", {
        description: `Added ${newScans.length} new scans and ${newDiary.length} new diary entries`,
      });
    }

    setOpen(false);
    resetState();
  };

  const resetState = () => {
    setPreview(null);
    setFileData(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={isOpen => {
        setOpen(isOpen);
        if (!isOpen) resetState();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-start gap-3">
          <Upload className="w-5 h-5" />
          Import Backup
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileJson className="w-5 h-5 text-primary" />
            Import Data Backup
          </DialogTitle>
          <DialogDescription>
            Restore your health data from a previously exported JSON backup file.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* File Input */}
          <button
            type="button"
            className="w-full border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              aria-label="Import data backup file"
              className="hidden"
            />
            <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
            <p className="font-medium">Click to select backup file</p>
            <p className="text-sm text-muted-foreground mt-1">JSON files only</p>
          </button>

          {/* Error */}
          {error && (
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Preview */}
          {preview && (
            <div className="p-4 rounded-lg bg-success/10 border border-success/20 space-y-3">
              <div className="flex items-center gap-2 text-success">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium">Valid backup file</span>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>• {preview.scans} scan entries found</p>
                <p>• {preview.diary} diary entries found</p>
              </div>
            </div>
          )}

          {/* Import Actions */}
          {fileData && (
            <div className="space-y-3 pt-2">
              <p className="text-sm text-muted-foreground">Choose how to import:</p>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => handleImport("merge")}>
                  Merge Data
                </Button>
                <Button variant="hero" className="flex-1" onClick={() => handleImport("replace")}>
                  Replace All
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                <strong>Merge:</strong> Adds new entries without removing existing data.
                <br />
                <strong>Replace:</strong> Replaces all current data with the backup.
              </p>
            </div>
          )}

          {/* Current Data Info */}
          <div className="text-xs text-muted-foreground pt-2 border-t border-border">
            Current data: {scans.length} scans, {diaryEntries.length} diary entries
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
