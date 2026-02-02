import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useData } from "@/contexts/DataContext";
import { downloadPDF } from "@/lib/pdfGenerator";
import { generateHL7FHIR, generateCDA, downloadMedicalFormat } from "@/lib/medicalExport";
import {
  Download,
  FileCode,
  FileJson,
  FileText,
  Image,
  Calendar,
  Loader2,
  CheckCircle,
  Printer,
} from "lucide-react";
import { generateExhaustivePDF } from "./pdf/generateExhaustivePDF";
import type { ReportSection } from "./types";

export const ExhaustiveReportGenerator = (): JSX.Element => {
  const { scans, diaryEntries } = useData();
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const [sections, setSections] = useState<ReportSection[]>([
    {
      id: "summary",
      label: "Executive Summary",
      icon: <FileText className="w-4 h-4" />,
      description: "Overview of all health data and key findings",
      enabled: true,
    },
    {
      id: "measurements",
      label: "All Measurements",
      icon: <FileText className="w-4 h-4" />,
      description: "Complete measurement history with statistics",
      enabled: true,
    },
    {
      id: "images",
      label: "Scan Images",
      icon: <Image className="w-4 h-4" />,
      description: "All captured scan images (if available)",
      enabled: true,
    },
    {
      id: "diary",
      label: "Health Diary",
      icon: <Calendar className="w-4 h-4" />,
      description: "All diary entries with symptoms and notes",
      enabled: true,
    },
    {
      id: "health",
      label: "Health Analysis",
      icon: <FileText className="w-4 h-4" />,
      description: "Condition assessments and risk evaluations",
      enabled: true,
    },
    {
      id: "recommendations",
      label: "Recommendations",
      icon: <FileText className="w-4 h-4" />,
      description: "Personalized health recommendations",
      enabled: true,
    },
  ]);

  const toggleSection = useCallback((id: string) => {
    setSections(prev => prev.map(s => (s.id === id ? { ...s, enabled: !s.enabled } : s)));
  }, []);

  const canGenerate = useMemo(
    () => !(scans.length === 0 && diaryEntries.length === 0),
    [diaryEntries.length, scans.length],
  );

  const handleGeneratePDF = useCallback(async () => {
    if (!canGenerate) {
      toast.error("No data to generate report");
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    try {
      const doc = await generateExhaustivePDF({
        scans,
        diaryEntries,
        sections,
        onProgress: setProgress,
      });
      downloadPDF(doc, `exhaustive-health-report-${new Date().toISOString().split("T")[0]}.pdf`);
      toast.success("Comprehensive report generated!");
      setIsOpen(false);
    } catch (error) {
      toast.error("Failed to generate report");
    } finally {
      setIsGenerating(false);
      setProgress(0);
    }
  }, [canGenerate, diaryEntries, scans, sections]);

  const handleExportHL7FHIR = useCallback(() => {
    const data = generateHL7FHIR(scans, diaryEntries);
    downloadMedicalFormat(
      data,
      `fhir-bundle-${new Date().toISOString().split("T")[0]}.json`,
      "json",
    );
    toast.success("HL7 FHIR exported!");
  }, [diaryEntries, scans]);

  const handleExportCDA = useCallback(() => {
    const data = generateCDA(scans, diaryEntries);
    downloadMedicalFormat(
      data,
      `cda-document-${new Date().toISOString().split("T")[0]}.xml`,
      "xml",
    );
    toast.success("CDA document exported!");
  }, [diaryEntries, scans]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="default" className="gap-2 gradient-primary">
          <FileText className="w-4 h-4" />
          Generate Exhaustive Report
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Exhaustive Health Report Generator
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <Card variant="glass">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Image className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{scans.length}</p>
                      <p className="text-xs text-muted-foreground">Total Scans</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card variant="glass">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Calendar className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{diaryEntries.length}</p>
                      <p className="text-xs text-muted-foreground">Diary Entries</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div>
              <h4 className="font-medium mb-3">Include Sections</h4>
              <div className="space-y-2">
                {sections.map(section => (
                  <button
                    key={section.id}
                    type="button"
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                      section.enabled
                        ? "border-primary/50 bg-primary/5"
                        : "border-border/50 bg-secondary/20"
                    }`}
                    onClick={() => toggleSection(section.id)}
                    aria-pressed={section.enabled}
                    aria-label={`Toggle section ${section.label}`}
                  >
                    <Checkbox
                      checked={section.enabled}
                      onCheckedChange={() => toggleSection(section.id)}
                    />
                    <div className="flex items-center gap-2 flex-1">
                      <div
                        className={`p-1.5 rounded-md ${section.enabled ? "bg-primary/20" : "bg-secondary/30"}`}
                      >
                        {section.icon}
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium">{section.label}</p>
                        <p className="text-xs text-muted-foreground">{section.description}</p>
                      </div>
                    </div>
                    {section.enabled && <CheckCircle className="w-4 h-4 text-primary" />}
                  </button>
                ))}
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="font-medium mb-3">Export Formats</h4>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  className="justify-start gap-2"
                  onClick={handleGeneratePDF}
                  disabled={isGenerating || !canGenerate}
                >
                  {isGenerating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  PDF Report
                </Button>
                <Button
                  variant="outline"
                  className="justify-start gap-2"
                  onClick={handleExportHL7FHIR}
                  disabled={!canGenerate}
                >
                  <FileJson className="w-4 h-4" />
                  HL7 FHIR
                </Button>
                <Button
                  variant="outline"
                  className="justify-start gap-2"
                  onClick={handleExportCDA}
                  disabled={!canGenerate}
                >
                  <FileCode className="w-4 h-4" />
                  CDA (XML)
                </Button>
                <Button
                  variant="outline"
                  className="justify-start gap-2"
                  onClick={() => window.print()}
                >
                  <Printer className="w-4 h-4" />
                  Print
                </Button>
              </div>
            </div>

            {isGenerating && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Generating report...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleGeneratePDF}
            disabled={isGenerating || !canGenerate}
            className="gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Generate Full Report
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
