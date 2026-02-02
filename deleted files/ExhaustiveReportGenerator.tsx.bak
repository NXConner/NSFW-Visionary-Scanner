import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { generateHealthReport, downloadPDF, getPDFBlob } from "@/lib/pdfGenerator";
import { generateHL7FHIR, generateCDA, downloadMedicalFormat } from "@/lib/medicalExport";
import jsPDF from "jspdf";
import {
  FileText,
  Download,
  Loader2,
  CheckCircle,
  Image,
  BarChart3,
  Heart,
  Brain,
  Ruler,
  Calendar,
  Shield,
  FileJson,
  FileCode,
  Printer,
  Mail,
  Share2,
} from "lucide-react";

interface ReportSection {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  enabled: boolean;
}

export const ExhaustiveReportGenerator = () => {
  const { scans, diaryEntries } = useData();
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  
  const [sections, setSections] = useState<ReportSection[]>([
    { id: 'summary', label: 'Executive Summary', icon: <FileText className="w-4 h-4" />, description: 'Overview of all health data and key findings', enabled: true },
    { id: 'measurements', label: 'All Measurements', icon: <Ruler className="w-4 h-4" />, description: 'Complete measurement history with statistics', enabled: true },
    { id: 'images', label: 'Scan Images', icon: <Image className="w-4 h-4" />, description: 'All captured scan images (if available)', enabled: true },
    { id: 'charts', label: 'Progress Charts', icon: <BarChart3 className="w-4 h-4" />, description: 'Visual trend analysis and growth charts', enabled: true },
    { id: 'health', label: 'Health Analysis', icon: <Heart className="w-4 h-4" />, description: 'Condition assessments and risk evaluations', enabled: true },
    { id: 'predictions', label: 'AI Predictions', icon: <Brain className="w-4 h-4" />, description: 'Growth forecasts and trend predictions', enabled: true },
    { id: 'diary', label: 'Health Diary', icon: <Calendar className="w-4 h-4" />, description: 'All diary entries with symptoms and notes', enabled: true },
    { id: 'recommendations', label: 'Recommendations', icon: <Shield className="w-4 h-4" />, description: 'Personalized health recommendations', enabled: true },
  ]);

  const toggleSection = (id: string) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s));
  };

  const generateExhaustivePDF = async (): Promise<jsPDF> => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPos = 20;
    const margin = 20;
    const lineHeight = 6;

    const addNewPageIfNeeded = (requiredSpace: number = 40) => {
      if (yPos > pageHeight - requiredSpace) {
        doc.addPage();
        yPos = 20;
      }
    };

    const addSectionHeader = (title: string) => {
      addNewPageIfNeeded(50);
      yPos += 10;
      doc.setFontSize(16);
      doc.setTextColor(0, 150, 136);
      doc.text(title, margin, yPos);
      yPos += 3;
      doc.setDrawColor(0, 150, 136);
      doc.setLineWidth(0.5);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 10;
      doc.setTextColor(60, 60, 60);
      doc.setFontSize(10);
    };

    // Cover Page
    doc.setFillColor(0, 150, 136);
    doc.rect(0, 0, pageWidth, 60, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.text('Comprehensive Health Report', pageWidth / 2, 35, { align: 'center' });
    doc.setFontSize(12);
    doc.text('Exhaustive Medical Assessment & Analysis', pageWidth / 2, 48, { align: 'center' });
    
    yPos = 80;
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(11);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`, margin, yPos);
    yPos += 8;
    doc.text(`Report ID: RPT-${Date.now().toString(36).toUpperCase()}`, margin, yPos);
    yPos += 8;
    doc.text(`Total Scans: ${scans.length}`, margin, yPos);
    yPos += 8;
    doc.text(`Diary Entries: ${diaryEntries.length}`, margin, yPos);
    yPos += 8;
    
    if (scans.length > 0) {
      const dateRange = `${new Date(scans[scans.length - 1].created_at).toLocaleDateString()} - ${new Date(scans[0].created_at).toLocaleDateString()}`;
      doc.text(`Date Range: ${dateRange}`, margin, yPos);
    }

    setProgress(10);

    // Executive Summary
    if (sections.find(s => s.id === 'summary')?.enabled) {
      doc.addPage();
      yPos = 20;
      addSectionHeader('1. Executive Summary');
      
      doc.setFontSize(10);
      const summaryText = [
        `This comprehensive report contains ${scans.length} scan records and ${diaryEntries.length} health diary entries.`,
        '',
        'Key Findings:',
      ];
      
      if (scans.length > 0) {
        const latestScan = scans[0];
        const avgLength = scans.reduce((sum, s) => sum + (s.length || 0), 0) / scans.filter(s => s.length).length;
        const avgCirc = scans.reduce((sum, s) => sum + (s.circumference || 0), 0) / scans.filter(s => s.circumference).length;
        const avgCurve = scans.reduce((sum, s) => sum + (s.curvature_angle || 0), 0) / scans.filter(s => s.curvature_angle).length;
        
        summaryText.push(
          `• Latest measurement: ${latestScan.length || '-'}cm length, ${latestScan.circumference || '-'}cm circumference`,
          `• Average length: ${avgLength.toFixed(2)}cm`,
          `• Average circumference: ${avgCirc.toFixed(2)}cm`,
          `• Average curvature: ${avgCurve.toFixed(1)}°`,
          `• Most recent curvature: ${latestScan.curvature_angle || 0}° (${latestScan.curvature_direction || 'N/A'})`,
        );
      }
      
      summaryText.forEach(line => {
        doc.text(line, margin, yPos);
        yPos += lineHeight;
      });
    }

    setProgress(25);

    // All Measurements
    if (sections.find(s => s.id === 'measurements')?.enabled && scans.length > 0) {
      addSectionHeader('2. Complete Measurement History');
      
      // Table header
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      const cols = ['Date', 'Type', 'Length (cm)', 'Circ (cm)', 'Curve (°)', 'Direction', 'Notes'];
      const colWidths = [28, 15, 22, 22, 18, 25, 40];
      let xPos = margin;
      cols.forEach((col, i) => {
        doc.text(col, xPos, yPos);
        xPos += colWidths[i];
      });
      yPos += 2;
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 5;
      
      doc.setFont('helvetica', 'normal');
      scans.forEach((scan) => {
        addNewPageIfNeeded(15);
        xPos = margin;
        const row = [
          new Date(scan.created_at).toLocaleDateString(),
          scan.scan_type.toUpperCase(),
          scan.length?.toString() || '-',
          scan.circumference?.toString() || '-',
          scan.curvature_angle?.toString() || '-',
          (scan.curvature_direction || '-').substring(0, 12),
          (scan.notes || '-').substring(0, 25),
        ];
        row.forEach((cell, i) => {
          doc.text(cell, xPos, yPos);
          xPos += colWidths[i];
        });
        yPos += 6;
      });

      // Statistics
      yPos += 10;
      addNewPageIfNeeded(50);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Statistical Analysis', margin, yPos);
      yPos += 8;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);

      const lengths = scans.map(s => s.length).filter(Boolean) as number[];
      const circs = scans.map(s => s.circumference).filter(Boolean) as number[];
      const curves = scans.map(s => s.curvature_angle).filter(Boolean) as number[];

      if (lengths.length > 0) {
        const stats = [
          `Length - Min: ${Math.min(...lengths)}cm, Max: ${Math.max(...lengths)}cm, Avg: ${(lengths.reduce((a, b) => a + b, 0) / lengths.length).toFixed(2)}cm`,
          `Circumference - Min: ${Math.min(...circs)}cm, Max: ${Math.max(...circs)}cm, Avg: ${(circs.reduce((a, b) => a + b, 0) / circs.length).toFixed(2)}cm`,
          `Curvature - Min: ${Math.min(...curves)}°, Max: ${Math.max(...curves)}°, Avg: ${(curves.reduce((a, b) => a + b, 0) / curves.length).toFixed(1)}°`,
        ];
        stats.forEach(stat => {
          doc.text(stat, margin, yPos);
          yPos += lineHeight;
        });
      }
    }

    setProgress(45);

    // Scan Images
    if (sections.find(s => s.id === 'images')?.enabled) {
      const scansWithImages = scans.filter(s => s.image_data);
      if (scansWithImages.length > 0) {
        addSectionHeader('3. Scan Images');
        doc.setFontSize(9);
        doc.text(`${scansWithImages.length} scan image(s) captured and stored locally.`, margin, yPos);
        yPos += lineHeight;
        doc.text('Note: Images are stored in encrypted local storage for privacy.', margin, yPos);
        yPos += lineHeight * 2;

        // List images with dates
        scansWithImages.slice(0, 10).forEach((scan, idx) => {
          addNewPageIfNeeded(20);
          doc.text(`${idx + 1}. Image captured on ${new Date(scan.created_at).toLocaleDateString()} - ${scan.scan_type.toUpperCase()} scan`, margin, yPos);
          yPos += lineHeight;
        });

        if (scansWithImages.length > 10) {
          doc.text(`... and ${scansWithImages.length - 10} more images`, margin, yPos);
          yPos += lineHeight;
        }
      }
    }

    setProgress(60);

    // Health Diary
    if (sections.find(s => s.id === 'diary')?.enabled && diaryEntries.length > 0) {
      addSectionHeader('4. Health Diary Entries');
      
      diaryEntries.forEach((entry, idx) => {
        addNewPageIfNeeded(35);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`Entry ${idx + 1} - ${new Date(entry.entry_date).toLocaleDateString()}`, margin, yPos);
        yPos += lineHeight;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        
        const measurements = [];
        if (entry.length) measurements.push(`Length: ${entry.length}cm`);
        if (entry.circumference) measurements.push(`Circumference: ${entry.circumference}cm`);
        if (entry.curvature_angle) measurements.push(`Curvature: ${entry.curvature_angle}°`);
        if (entry.pain_level !== null) measurements.push(`Pain Level: ${entry.pain_level}/10`);
        
        if (measurements.length > 0) {
          doc.text(measurements.join(' | '), margin, yPos);
          yPos += lineHeight;
        }
        
        if (entry.symptoms && entry.symptoms.length > 0) {
          doc.text(`Symptoms: ${entry.symptoms.join(', ')}`, margin, yPos);
          yPos += lineHeight;
        }
        
        if (entry.notes) {
          const noteLines = doc.splitTextToSize(`Notes: ${entry.notes}`, pageWidth - margin * 2);
          doc.text(noteLines, margin, yPos);
          yPos += noteLines.length * 4 + 2;
        }
        
        yPos += 4;
      });
    }

    setProgress(75);

    // Health Analysis & Recommendations
    if (sections.find(s => s.id === 'health')?.enabled || sections.find(s => s.id === 'recommendations')?.enabled) {
      addSectionHeader('5. Health Analysis & Recommendations');
      
      doc.setFontSize(10);
      const latestScan = scans[0];
      
      if (latestScan?.curvature_angle !== undefined) {
        const angle = latestScan.curvature_angle;
        let riskLevel = 'Low';
        let recommendations: string[] = [];
        
        if (angle < 15) {
          riskLevel = 'Low';
          recommendations = [
            '• Continue regular monitoring with scans every 2-4 weeks',
            '• Maintain healthy lifestyle habits',
            '• No immediate medical intervention typically required',
          ];
        } else if (angle < 30) {
          riskLevel = 'Moderate';
          recommendations = [
            '• Schedule consultation with urologist for evaluation',
            '• Consider traction therapy options',
            '• More frequent monitoring recommended (weekly)',
            '• Document any pain or functional changes',
          ];
        } else {
          riskLevel = 'High';
          recommendations = [
            '• Seek prompt medical evaluation',
            '• Discuss treatment options with specialist',
            '• Consider imaging studies if recommended',
            '• Monitor for progression closely',
          ];
        }
        
        doc.text(`Curvature Risk Assessment: ${riskLevel}`, margin, yPos);
        yPos += lineHeight * 2;
        
        doc.text('Recommendations:', margin, yPos);
        yPos += lineHeight;
        
        recommendations.forEach(rec => {
          doc.text(rec, margin, yPos);
          yPos += lineHeight;
        });
      }
      
      yPos += lineHeight;
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      const disclaimer = doc.splitTextToSize(
        'DISCLAIMER: This report is for informational purposes only and does not constitute medical advice. Always consult with a qualified healthcare provider for proper diagnosis and treatment.',
        pageWidth - margin * 2
      );
      doc.text(disclaimer, margin, yPos);
    }

    setProgress(90);

    // Footer on all pages
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
      doc.text('GrowthTracker Health Report - Confidential', margin, pageHeight - 10);
    }

    setProgress(100);
    return doc;
  };

  const handleGeneratePDF = async () => {
    if (scans.length === 0 && diaryEntries.length === 0) {
      toast.error('No data to generate report');
      return;
    }

    setIsGenerating(true);
    setProgress(0);

    try {
      const doc = await generateExhaustivePDF();
      downloadPDF(doc, `exhaustive-health-report-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('Comprehensive report generated!');
      setIsOpen(false);
    } catch (error) {
      console.error('Report generation failed:', error);
      toast.error('Failed to generate report');
    } finally {
      setIsGenerating(false);
      setProgress(0);
    }
  };

  const handleExportHL7FHIR = () => {
    const data = generateHL7FHIR(scans, diaryEntries);
    downloadMedicalFormat(data, `fhir-bundle-${new Date().toISOString().split('T')[0]}.json`, 'json');
    toast.success('HL7 FHIR exported!');
  };

  const handleExportCDA = () => {
    const data = generateCDA(scans, diaryEntries);
    downloadMedicalFormat(data, `cda-document-${new Date().toISOString().split('T')[0]}.xml`, 'xml');
    toast.success('CDA document exported!');
  };

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
            {/* Report Stats */}
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

            {/* Section Selection */}
            <div>
              <h4 className="font-medium mb-3">Include Sections</h4>
              <div className="space-y-2">
                {sections.map((section) => (
                  <div
                    key={section.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                      section.enabled ? 'border-primary/50 bg-primary/5' : 'border-border/50 bg-secondary/20'
                    }`}
                    onClick={() => toggleSection(section.id)}
                  >
                    <Checkbox checked={section.enabled} />
                    <div className="flex items-center gap-2 flex-1">
                      <div className={`p-1.5 rounded-md ${section.enabled ? 'bg-primary/20' : 'bg-secondary/30'}`}>
                        {section.icon}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{section.label}</p>
                        <p className="text-xs text-muted-foreground">{section.description}</p>
                      </div>
                    </div>
                    {section.enabled && <CheckCircle className="w-4 h-4 text-primary" />}
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Export Formats */}
            <div>
              <h4 className="font-medium mb-3">Export Formats</h4>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="justify-start gap-2" onClick={handleGeneratePDF} disabled={isGenerating}>
                  {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  PDF Report
                </Button>
                <Button variant="outline" className="justify-start gap-2" onClick={handleExportHL7FHIR}>
                  <FileJson className="w-4 h-4" />
                  HL7 FHIR
                </Button>
                <Button variant="outline" className="justify-start gap-2" onClick={handleExportCDA}>
                  <FileCode className="w-4 h-4" />
                  CDA (XML)
                </Button>
                <Button variant="outline" className="justify-start gap-2" onClick={() => window.print()}>
                  <Printer className="w-4 h-4" />
                  Print
                </Button>
              </div>
            </div>

            {/* Progress */}
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
          <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button onClick={handleGeneratePDF} disabled={isGenerating || (scans.length === 0 && diaryEntries.length === 0)} className="gap-2">
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
