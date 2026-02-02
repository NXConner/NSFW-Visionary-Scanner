import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useData } from "@/contexts/DataContext";
import { generateHealthReport, downloadPDF } from "@/lib/pdfGenerator";
import { generateHL7FHIR, generateCDA, downloadMedicalFormat } from "@/lib/medicalExport";
import { ManualEntryForm } from "@/components/ManualEntryForm";
import { DataImport } from "@/components/DataImport";
import { ProgressCharts } from "@/components/ProgressCharts";
import { CalendarView } from "@/components/CalendarView";
import { MeasurementPredictions } from "@/components/MeasurementPredictions";
import { ScanComparison } from "@/components/ScanComparison";
import { ExhaustiveReportGenerator } from "@/components/ExhaustiveReportGenerator";
import { ListItemSkeleton, StatCardSkeleton, ChartSkeleton } from "@/components/ui/skeleton-loader";
import { Reveal } from "@/components/premium/Reveal";
import { AnimatedNumber } from "@/components/premium/AnimatedNumber";
import { TiltCard } from "@/components/premium/TiltCard";
import {
  BookOpen,
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  Ruler,
  FileText,
  Download,
  ChevronRight,
  Loader2,
  Trash2,
  Image,
  Mail,
  BarChart3,
  List,
  CalendarDays,
  Printer,
  FileJson,
  Brain,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const HealthDiarySection = () => {
  const { scans, diaryEntries, deleteScan, exportData } = useData();
  const [exporting, setExporting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<"history" | "charts" | "calendar">("history");

  const handleDownloadPDF = async () => {
    setExporting(true);
    try {
      const doc = await generateHealthReport(scans, diaryEntries);
      downloadPDF(doc, `health-report-${new Date().toISOString().split("T")[0]}.pdf`);
      toast.success("PDF report downloaded!");
    } catch {
      toast.error("Failed to generate PDF");
    }
    setExporting(false);
  };

  const handleExportCSV = () => {
    const allData = [
      ...scans.map(s => ({
        date: s.created_at,
        type: "scan",
        length: s.length,
        circumference: s.circumference,
        curvature_angle: s.curvature_angle,
        curvature_direction: s.curvature_direction,
        notes: s.notes,
      })),
      ...diaryEntries.map(e => ({
        date: e.entry_date,
        type: "diary",
        length: e.length,
        circumference: e.circumference,
        curvature_angle: e.curvature_angle,
        curvature_direction: e.curvature_direction,
        notes: e.notes,
      })),
    ];

    const csv = [
      "Date,Type,Length,Circumference,Curvature Angle,Direction,Notes",
      ...allData.map(
        d =>
          `${d.date},${d.type},${d.length || ""},${d.circumference || ""},${d.curvature_angle || ""},${d.curvature_direction || ""},${(d.notes || "").replace(/,/g, ";")}`,
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `health-data-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported!");
  };

  const handleExportJSON = () => {
    const data = exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `health-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Backup exported!");
  };

  const handleExportHL7 = () => {
    const hl7Data = generateHL7FHIR(scans, diaryEntries);
    downloadMedicalFormat(
      hl7Data,
      `health-data-fhir-${new Date().toISOString().split("T")[0]}.json`,
      "json",
    );
    toast.success("HL7 FHIR format exported!");
  };

  const handleExportCDA = () => {
    const cdaData = generateCDA(scans, diaryEntries);
    downloadMedicalFormat(
      cdaData,
      `health-data-cda-${new Date().toISOString().split("T")[0]}.xml`,
      "xml",
    );
    toast.success("CDA XML format exported!");
  };

  const handlePrint = () => {
    window.print();
    toast.success("Print dialog opened");
  };

  const handleDeleteScan = (id: string) => {
    deleteScan(id);
    toast.success("Scan deleted");
  };

  const latestScan = scans[0];
  const previousScan = scans[1];

  const calculateChange = (current: number | null, previous: number | null) => {
    if (!current || !previous) return "0.0";
    return (((current - previous) / previous) * 100).toFixed(1);
  };

  const getTrendIcon = (current: number | null, previous: number | null) => {
    if (!current || !previous) return <Minus className="w-4 h-4 text-muted-foreground" />;
    if (current > previous) return <TrendingUp className="w-4 h-4 text-success" />;
    if (current < previous) return <TrendingDown className="w-4 h-4 text-destructive" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  return (
    <section className="min-h-screen px-4 py-20 relative">
      <div className="container mx-auto max-w-6xl">
        <Reveal variant="fade-up">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <BookOpen className="w-4 h-4 text-primary" />
              <span className="text-sm text-primary font-medium">Health Diary</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="gradient-text">Track</span> Your Progress
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Monitor your measurements over time. All data stored locally - works offline.
            </p>
          </div>
        </Reveal>

        {/* View Toggle */}
        <Reveal variant="fade-up" delay={0.1}>
          <div className="flex justify-center mb-8">
            <Tabs
              value={activeView}
              onValueChange={v => setActiveView(v as "history" | "charts" | "calendar")}
              className="w-auto"
            >
              <TabsList className="bg-secondary/50 p-1">
                <TabsTrigger
                  value="history"
                  className="gap-2 data-[state=active]:gradient-primary data-[state=active]:text-primary-foreground"
                >
                  <List className="w-4 h-4" />
                  History
                </TabsTrigger>
                <TabsTrigger
                  value="charts"
                  className="gap-2 data-[state=active]:gradient-primary data-[state=active]:text-primary-foreground"
                >
                  <BarChart3 className="w-4 h-4" />
                  Charts
                </TabsTrigger>
                <TabsTrigger
                  value="calendar"
                  className="gap-2 data-[state=active]:gradient-primary data-[state=active]:text-primary-foreground"
                >
                  <CalendarDays className="w-4 h-4" />
                  Calendar
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </Reveal>

        {activeView === "charts" ? (
          <ProgressCharts />
        ) : activeView === "calendar" ? (
          <CalendarView />
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* Stats */}
              {latestScan && (
                <div className="grid grid-cols-3 gap-4">
                  <Reveal variant="fade-up" delay={0.15}>
                    <TiltCard maxTilt={10} className="h-full">
                      <Card variant="stat" className="h-full">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Length</p>
                            <p className="text-3xl font-bold">
                              {latestScan.length ? (
                                <AnimatedNumber value={latestScan.length} decimals={1} />
                              ) : (
                                "-"
                              )}
                              <span className="text-sm text-muted-foreground ml-1">cm</span>
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <Ruler className="w-5 h-5 text-primary" />
                            {previousScan && (
                              <div className="flex items-center gap-1 text-xs">
                                {getTrendIcon(latestScan.length, previousScan.length)}
                                <span>
                                  {calculateChange(latestScan.length, previousScan.length)}%
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    </TiltCard>
                  </Reveal>

                  <Reveal variant="fade-up" delay={0.2}>
                    <TiltCard maxTilt={10} className="h-full">
                      <Card variant="stat" className="h-full">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Circumference</p>
                            <p className="text-3xl font-bold">
                              {latestScan.circumference ? (
                                <AnimatedNumber value={latestScan.circumference} decimals={1} />
                              ) : (
                                "-"
                              )}
                              <span className="text-sm text-muted-foreground ml-1">cm</span>
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <Target className="w-5 h-5 text-primary" />
                            {previousScan && (
                              <div className="flex items-center gap-1 text-xs">
                                {getTrendIcon(latestScan.circumference, previousScan.circumference)}
                                <span>
                                  {calculateChange(
                                    latestScan.circumference,
                                    previousScan.circumference,
                                  )}
                                  %
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    </TiltCard>
                  </Reveal>

                  <Reveal variant="fade-up" delay={0.25}>
                    <TiltCard maxTilt={10} className="h-full">
                      <Card variant="stat" className="h-full">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Curvature</p>
                            <p className="text-3xl font-bold">
                              {latestScan.curvature_angle ? (
                                <AnimatedNumber value={latestScan.curvature_angle} />
                              ) : (
                                "-"
                              )}
                              <span className="text-sm text-muted-foreground ml-1">°</span>
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <TrendingDown className="w-5 h-5 text-success" />
                          </div>
                        </div>
                      </Card>
                    </TiltCard>
                  </Reveal>
                </div>
              )}

              {/* Progress Chart */}
              {scans.length > 0 && (
                <Card
                  variant="glass"
                  className="animate-fade-in-up"
                  style={{ animationDelay: "0.1s" }}
                >
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      Curvature Progression
                    </CardTitle>
                    <span className="text-sm text-muted-foreground">{scans.length} scans</span>
                  </CardHeader>
                  <CardContent>
                    <div className="h-48 flex items-end justify-between gap-2 mb-4 px-4">
                      {scans
                        .slice(0, 8)
                        .reverse()
                        .map((scan, index) => {
                          const angle = scan.curvature_angle || 0;
                          const height = ((30 - Math.min(angle, 30)) / 30) * 100;
                          return (
                            <div key={scan.id} className="flex-1 flex flex-col items-center gap-2">
                              <span className="text-xs font-mono text-muted-foreground">
                                {angle}°
                              </span>
                              <div
                                className="w-full rounded-t-lg transition-all duration-500"
                                style={{
                                  height: `${Math.max(height, 10)}%`,
                                  background:
                                    angle < 15
                                      ? "hsl(var(--success))"
                                      : angle < 25
                                        ? "hsl(var(--warning))"
                                        : "hsl(var(--destructive))",
                                  animationDelay: `${index * 0.1}s`,
                                }}
                              />
                              <span className="text-[10px] text-muted-foreground">
                                {new Date(scan.created_at).toLocaleDateString("en", {
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                            </div>
                          );
                        })}
                    </div>

                    <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground border-t border-border/50 pt-4">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-success" />
                        <span>&lt;15° Normal</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-warning" />
                        <span>15-25° Mild</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-destructive" />
                        <span>&gt;25° Moderate+</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Scan History */}
              <Card
                variant="glass"
                className="animate-fade-in-up"
                style={{ animationDelay: "0.2s" }}
              >
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Scan History</CardTitle>
                  <ManualEntryForm />
                </CardHeader>
                <CardContent className="p-0">
                  {scans.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No scans yet. Start your first scan to begin tracking.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border/50">
                      {scans.slice(0, 10).map(scan => (
                        <div
                          key={scan.id}
                          className="flex items-center gap-4 p-4 hover:bg-secondary/30 transition-colors group"
                        >
                          {scan.image_data ? (
                            <button
                              type="button"
                              className="w-12 h-12 rounded-xl overflow-hidden cursor-pointer border border-border/50"
                              onClick={() => setSelectedImage(scan.image_data)}
                              aria-label="View scan image"
                            >
                              <img
                                src={scan.image_data}
                                alt="Scan"
                                className="w-full h-full object-cover"
                              />
                            </button>
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                              <Calendar className="w-5 h-5 text-primary" />
                            </div>
                          )}
                          <div className="flex-1">
                            <p className="font-medium">
                              {new Date(scan.created_at).toLocaleDateString("en", {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {scan.scan_type.toUpperCase()} Scan
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-mono text-sm">{scan.curvature_angle || "-"}°</p>
                            <p className="text-xs text-muted-foreground">
                              {scan.length || "-"}cm × {scan.circumference || "-"}cm
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {scan.image_data && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => setSelectedImage(scan.image_data)}
                              >
                                <Image className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => handleDeleteScan(scan.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                            <ChevronRight className="w-5 h-5 text-muted-foreground" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Export Panel */}
            <div className="space-y-6">
              {/* Exhaustive Report Generator */}
              <Card variant="glass" className="animate-fade-in-up border-primary/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Brain className="w-5 h-5 text-primary" />
                    Comprehensive Report
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Generate an exhaustive PDF report with all data, measurements, images, charts,
                    and medical analysis.
                  </p>
                  <ExhaustiveReportGenerator />
                </CardContent>
              </Card>

              <Card
                variant="glass"
                className="animate-fade-in-up"
                style={{ animationDelay: "0.1s" }}
              >
                <CardHeader>
                  <CardTitle className="text-lg">Export Options</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-3"
                    onClick={handleDownloadPDF}
                    disabled={exporting || scans.length === 0}
                  >
                    {exporting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Download className="w-5 h-5" />
                    )}
                    Quick PDF Report
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-3"
                    onClick={handleExportCSV}
                    disabled={scans.length === 0}
                  >
                    <FileText className="w-5 h-5" />
                    Export to CSV
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-3"
                    onClick={handleExportJSON}
                    disabled={scans.length === 0}
                  >
                    <Mail className="w-5 h-5" />
                    Backup Data (JSON)
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-3"
                    onClick={handleExportHL7}
                    disabled={scans.length === 0}
                  >
                    <FileJson className="w-5 h-5" />
                    Medical Format (HL7 FHIR)
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-3"
                    onClick={handleExportCDA}
                    disabled={scans.length === 0}
                  >
                    <FileJson className="w-5 h-5" />
                    Medical Format (CDA/XML)
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-3"
                    onClick={handlePrint}
                  >
                    <Printer className="w-5 h-5" />
                    Print Report
                  </Button>
                </CardContent>
              </Card>

              {/* Scan Comparison */}
              <div className="animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
                <ScanComparison />
              </div>

              {/* AI Predictions */}
              <div className="animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
                <MeasurementPredictions />
              </div>

              {scans.length > 1 && (
                <Card
                  variant="interactive"
                  className="animate-fade-in-up"
                  style={{ animationDelay: "0.3s" }}
                >
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 mx-auto rounded-full bg-success/10 flex items-center justify-center mb-4">
                      <TrendingDown className="w-8 h-8 text-success" />
                    </div>
                    <h4 className="font-semibold mb-2">
                      {(latestScan?.curvature_angle || 0) < (previousScan?.curvature_angle || 0)
                        ? "Positive Trend"
                        : "Keep Monitoring"}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      You have {scans.length} scans recorded. Regular monitoring helps track
                      progression.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Image Preview Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Scan Image</DialogTitle>
          </DialogHeader>
          {selectedImage && <img src={selectedImage} alt="Scan" className="w-full rounded-lg" />}
        </DialogContent>
      </Dialog>
    </section>
  );
};
