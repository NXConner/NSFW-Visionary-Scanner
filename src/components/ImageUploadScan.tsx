import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useData } from "@/contexts/DataContext";
import { useAIScanAnalysis } from "@/hooks/useAIScanAnalysis";
import { measureImage } from "@/scanner/measurement";
import {
  Upload,
  Image,
  Camera,
  Check,
  X,
  Ruler,
  Target,
  RotateCcw,
  Save,
  AlertCircle,
} from "lucide-react";
import { FilteredImage } from "@/components/media/FilteredImage";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { MeasurementState } from "@/lib/growersVsShowers";

export const ImageUploadScan = () => {
  const { saveScan } = useData();
  const { analyzeImage } = useAIScanAnalysis({ saveToHistory: true });
  const [isOpen, setIsOpen] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [measurementState, setMeasurementState] = useState<MeasurementState>("unknown");
  const [erectLength, setErectLength] = useState("");
  const [erectCircumference, setErectCircumference] = useState("");
  const [measurements, setMeasurements] = useState({
    length: "",
    circumference: "",
    curvatureAngle: "",
    curvatureDirection: "Dorsal (upward)",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be under 10MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = async event => {
      const img = event.target?.result as string;
      setUploadedImage(img);
      await runAnalysis(img);
    };
    reader.readAsDataURL(file);
  };

  const runAnalysis = async (img: string) => {
    setIsProcessing(true);
    try {
      // Deterministic measurement pass (works offline; best-effort without calibration)
      try {
        const det = await measureImage(
          { imageDataUrl: img, calibration: { source: "none" }, requestedUnits: "cm" },
          { maxDim: 1024, polyDegree: 3 },
        );
        if (det.annotatedImageDataUrl) setUploadedImage(det.annotatedImageDataUrl);
        setMeasurements(prev => ({
          ...prev,
          curvatureAngle: det.curvatureAngleDeg
            ? String(Math.round(det.curvatureAngleDeg))
            : prev.curvatureAngle,
        }));
      } catch {
        // ignore
      }

      const analysis = await analyzeImage(img);
      setMeasurements(prev => ({
        ...prev,
        curvatureAngle: analysis?.curvatureAssessment.estimatedAngle
          ? String(Math.round(analysis.curvatureAssessment.estimatedAngle))
          : "",
        curvatureDirection: analysis?.curvatureAssessment.direction || prev.curvatureDirection,
      }));
      toast.success("Image analyzed!", {
        description: "Curvature assessment ready. Enter length & circumference to save.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = async event => {
        const img = event.target?.result as string;
        setUploadedImage(img);
        await runAnalysis(img);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!uploadedImage) {
      toast.error("Please upload an image first");
      return;
    }

    const length = Number.parseFloat(measurements.length);
    const circumference = Number.parseFloat(measurements.circumference);
    if (
      !Number.isFinite(length) ||
      length <= 0 ||
      !Number.isFinite(circumference) ||
      circumference <= 0
    ) {
      toast.error("Enter valid length and circumference before saving");
      return;
    }

    if (measurementState === "paired") {
      const eLen = Number.parseFloat(erectLength);
      const eCirc = Number.parseFloat(erectCircumference);
      if (!Number.isFinite(eLen) || eLen <= 0 || !Number.isFinite(eCirc) || eCirc <= 0) {
        toast.error("Enter valid paired erect length and circumference");
        return;
      }
    }

    await saveScan({
      scan_type: "uploaded",
      length,
      circumference,
      erect_length: measurementState === "paired" ? Number.parseFloat(erectLength) : null,
      erect_circumference:
        measurementState === "paired" ? Number.parseFloat(erectCircumference) : null,
      measurement_context: { state: measurementState },
      curvature_angle: Number.isFinite(Number.parseFloat(measurements.curvatureAngle))
        ? Number.parseFloat(measurements.curvatureAngle)
        : 0,
      curvature_direction: measurements.curvatureDirection,
      image_data: uploadedImage,
      notes: "Uploaded from device gallery",
    });

    toast.success("Scan saved!", { description: "Added to your health diary" });
    resetForm();
    setIsOpen(false);
  };

  const resetForm = () => {
    setUploadedImage(null);
    setMeasurementState("unknown");
    setErectLength("");
    setErectCircumference("");
    setMeasurements({
      length: "",
      circumference: "",
      curvatureAngle: "",
      curvatureDirection: "Dorsal (upward)",
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full gap-2">
          <Upload className="w-4 h-4" />
          Upload Image
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Image className="w-5 h-5 text-primary" />
            Upload Scan Image
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Upload Area */}
          {!uploadedImage ? (
            <button
              type="button"
              className="w-full border-2 border-dashed border-border/50 rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
                aria-label="Upload scan image"
              />
              <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Upload className="w-8 h-8 text-primary" />
              </div>
              <p className="font-medium mb-1">Drag & drop an image</p>
              <p className="text-sm text-muted-foreground mb-4">or click to browse</p>
              <Badge variant="outline" className="text-xs">
                Supports JPG, PNG, HEIC up to 10MB
              </Badge>
            </button>
          ) : (
            <div className="space-y-4">
              {/* Image Preview */}
              <div className="relative rounded-xl overflow-hidden border border-border/50">
                <FilteredImage
                  src={uploadedImage}
                  alt="Uploaded"
                  className="w-full aspect-[4/3] object-cover"
                />
                {isProcessing && (
                  <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Analyzing image...</p>
                    </div>
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 bg-background/80"
                  onClick={resetForm}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Measurements Form */}
              {!isProcessing && (
                <div className="space-y-4">
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20">
                    <AlertCircle className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-muted-foreground">
                      Curvature assessment is AI-assisted. Enter and verify length/circumference for
                      accuracy.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center justify-between">
                      <span>Measurement state</span>
                      <span className="text-xs text-muted-foreground font-mono">
                        {measurementState}
                      </span>
                    </Label>
                    <Select
                      value={measurementState}
                      onValueChange={v => setMeasurementState(v as MeasurementState)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unknown">Unknown</SelectItem>
                        <SelectItem value="flaccid">Flaccid</SelectItem>
                        <SelectItem value="erect">Erect</SelectItem>
                        <SelectItem value="paired">Paired (flaccid + erect)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Ruler className="w-4 h-4 text-primary" />
                        Length (cm)
                      </Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={measurements.length}
                        onChange={e => setMeasurements({ ...measurements, length: e.target.value })}
                        placeholder="e.g., 14.5"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-primary" />
                        Circumference (cm)
                      </Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={measurements.circumference}
                        onChange={e =>
                          setMeasurements({ ...measurements, circumference: e.target.value })
                        }
                        placeholder="e.g., 12.0"
                      />
                    </div>
                  </div>

                  {measurementState === "paired" && (
                    <div className="rounded-xl border border-border/50 bg-secondary/10 p-4 space-y-4">
                      <div className="text-sm font-medium">Paired erect values</div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                            <Ruler className="w-4 h-4 text-primary" />
                            Erect length (cm)
                          </Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={erectLength}
                            onChange={e => setErectLength(e.target.value)}
                            placeholder="e.g., 15.8"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                            <Target className="w-4 h-4 text-primary" />
                            Erect circumference (cm)
                          </Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={erectCircumference}
                            onChange={e => setErectCircumference(e.target.value)}
                            placeholder="e.g., 13.2"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Paired entries improve Growers vs Showers accuracy.
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Curvature Angle (°)</Label>
                      <Input
                        type="number"
                        value={measurements.curvatureAngle}
                        onChange={e =>
                          setMeasurements({ ...measurements, curvatureAngle: e.target.value })
                        }
                        placeholder="e.g., 15"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Curvature Direction</Label>
                      <Select
                        value={measurements.curvatureDirection}
                        onValueChange={v =>
                          setMeasurements({ ...measurements, curvatureDirection: v })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Dorsal (upward)">Dorsal (upward)</SelectItem>
                          <SelectItem value="Ventral (downward)">Ventral (downward)</SelectItem>
                          <SelectItem value="Lateral (left)">Lateral (left)</SelectItem>
                          <SelectItem value="Lateral (right)">Lateral (right)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                resetForm();
                setIsOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="gradient"
              className="flex-1 gap-2"
              onClick={handleSave}
              disabled={!uploadedImage || isProcessing}
            >
              <Save className="w-4 h-4" />
              Save Scan
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
