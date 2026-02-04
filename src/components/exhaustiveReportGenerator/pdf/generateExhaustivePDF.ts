import type jsPDF from "jspdf";
import type { ScanEntry, DiaryEntry } from "@/contexts/DataContext";
import type { ReportSection } from "../types";
import { APP_REPORT_TITLE } from "@/config/brand";

export async function generateExhaustivePDF({
  scans,
  diaryEntries,
  sections,
  onProgress,
}: {
  scans: ScanEntry[];
  diaryEntries: DiaryEntry[];
  sections: ReportSection[];
  onProgress: (pct: number) => void;
}): Promise<jsPDF> {
  const { default: jsPDFCtor } = await import("jspdf");
  const doc: jsPDF = new jsPDFCtor();
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

  const sectionEnabled = (id: string) => Boolean(sections.find(s => s.id === id)?.enabled);

  // Cover Page
  doc.setFillColor(0, 150, 136);
  doc.rect(0, 0, pageWidth, 60, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.text("Comprehensive Health Report", pageWidth / 2, 35, { align: "center" });
  doc.setFontSize(12);
  doc.text("Exhaustive Medical Assessment & Analysis", pageWidth / 2, 48, { align: "center" });

  yPos = 80;
  doc.setTextColor(60, 60, 60);
  doc.setFontSize(11);
  doc.text(
    `Generated: ${new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })}`,
    margin,
    yPos,
  );
  yPos += 8;
  doc.text(`Report ID: RPT-${Date.now().toString(36).toUpperCase()}`, margin, yPos);
  yPos += 8;
  doc.text(`Total Scans: ${scans.length}`, margin, yPos);
  yPos += 8;
  doc.text(`Diary Entries: ${diaryEntries.length}`, margin, yPos);
  yPos += 8;

  if (scans.length > 0) {
    const dateRange = `${new Date(scans[scans.length - 1]!.created_at).toLocaleDateString()} - ${new Date(
      scans[0]!.created_at,
    ).toLocaleDateString()}`;
    doc.text(`Date Range: ${dateRange}`, margin, yPos);
  }

  onProgress(10);

  // Executive Summary
  if (sectionEnabled("summary")) {
    doc.addPage();
    yPos = 20;
    addSectionHeader("1. Executive Summary");

    doc.setFontSize(10);
    const summaryText: string[] = [
      `This comprehensive report contains ${scans.length} scan records and ${diaryEntries.length} health diary entries.`,
      "",
      "Key Findings:",
    ];

    if (scans.length > 0) {
      const latestScan = scans[0]!;
      const lengths = scans.map(s => s.length).filter(Boolean) as number[];
      const circs = scans.map(s => s.circumference).filter(Boolean) as number[];
      const curves = scans.map(s => s.curvature_angle).filter(Boolean) as number[];
      const avgLength = lengths.length
        ? lengths.reduce((sum, v) => sum + v, 0) / lengths.length
        : 0;
      const avgCirc = circs.length ? circs.reduce((sum, v) => sum + v, 0) / circs.length : 0;
      const avgCurve = curves.length ? curves.reduce((sum, v) => sum + v, 0) / curves.length : 0;

      summaryText.push(
        `• Latest measurement: ${latestScan.length || "-"}cm length, ${latestScan.circumference || "-"}cm circumference`,
        `• Average length: ${avgLength.toFixed(2)}cm`,
        `• Average circumference: ${avgCirc.toFixed(2)}cm`,
        `• Average curvature: ${avgCurve.toFixed(1)}°`,
        `• Most recent curvature: ${latestScan.curvature_angle || 0}° (${latestScan.curvature_direction || "N/A"})`,
      );
    }

    summaryText.forEach(line => {
      doc.text(line, margin, yPos);
      yPos += lineHeight;
    });
  }

  onProgress(25);

  // All Measurements
  if (sectionEnabled("measurements") && scans.length > 0) {
    addSectionHeader("2. Complete Measurement History");

    // Table header
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    const cols = ["Date", "Type", "Length (cm)", "Circ (cm)", "Curve (°)", "Direction", "Notes"];
    const colWidths = [28, 15, 22, 22, 18, 25, 40];
    let xPos = margin;
    cols.forEach((col, i) => {
      doc.text(col, xPos, yPos);
      xPos += colWidths[i]!;
    });
    yPos += 2;
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 5;

    doc.setFont("helvetica", "normal");
    scans.forEach(scan => {
      addNewPageIfNeeded(15);
      xPos = margin;
      const row = [
        new Date(scan.created_at).toLocaleDateString(),
        scan.scan_type.toUpperCase(),
        scan.length?.toString() || "-",
        scan.circumference?.toString() || "-",
        scan.curvature_angle?.toString() || "-",
        (scan.curvature_direction || "-").substring(0, 12),
        (scan.notes || "-").substring(0, 25),
      ];
      row.forEach((cell, i) => {
        doc.text(cell, xPos, yPos);
        xPos += colWidths[i]!;
      });
      yPos += 6;
    });

    // Statistics
    yPos += 10;
    addNewPageIfNeeded(50);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Statistical Analysis", margin, yPos);
    yPos += 8;
    doc.setFont("helvetica", "normal");
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

  onProgress(45);

  // Scan Images
  if (sectionEnabled("images")) {
    const scansWithImages = scans.filter(s => s.image_data);
    if (scansWithImages.length > 0) {
      addSectionHeader("3. Scan Images");
      doc.setFontSize(9);
      doc.text(
        `${scansWithImages.length} scan image(s) captured and stored locally.`,
        margin,
        yPos,
      );
      yPos += lineHeight;
      doc.text("Note: Images are stored in encrypted local storage for privacy.", margin, yPos);
      yPos += lineHeight * 2;

      // List images with dates
      scansWithImages.slice(0, 10).forEach((scan, idx) => {
        addNewPageIfNeeded(20);
        doc.text(
          `${idx + 1}. Image captured on ${new Date(scan.created_at).toLocaleDateString()} - ${scan.scan_type.toUpperCase()} scan`,
          margin,
          yPos,
        );
        yPos += lineHeight;
      });

      if (scansWithImages.length > 10) {
        doc.text(`... and ${scansWithImages.length - 10} more images`, margin, yPos);
        yPos += lineHeight;
      }
    }
  }

  onProgress(60);

  // Health Diary
  if (sectionEnabled("diary") && diaryEntries.length > 0) {
    addSectionHeader("4. Health Diary Entries");

    diaryEntries.forEach((entry, idx) => {
      addNewPageIfNeeded(35);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(
        `Entry ${idx + 1} - ${new Date(entry.entry_date).toLocaleDateString()}`,
        margin,
        yPos,
      );
      yPos += lineHeight;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);

      const measurements: string[] = [];
      if (entry.length) measurements.push(`Length: ${entry.length}cm`);
      if (entry.circumference) measurements.push(`Circumference: ${entry.circumference}cm`);
      if (entry.curvature_angle) measurements.push(`Curvature: ${entry.curvature_angle}°`);
      if (entry.pain_level !== null) measurements.push(`Pain Level: ${entry.pain_level}/10`);

      if (measurements.length > 0) {
        doc.text(measurements.join(" | "), margin, yPos);
        yPos += lineHeight;
      }

      if (entry.symptoms && entry.symptoms.length > 0) {
        doc.text(`Symptoms: ${entry.symptoms.join(", ")}`, margin, yPos);
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

  onProgress(75);

  // Health Analysis & Recommendations
  if (sectionEnabled("health") || sectionEnabled("recommendations")) {
    addSectionHeader("5. Health Analysis & Recommendations");

    doc.setFontSize(10);
    const latestScan = scans[0];

    if (latestScan?.curvature_angle !== undefined) {
      const angle = latestScan.curvature_angle;
      let riskLevel = "Low";
      let recommendations: string[] = [];

      if (angle < 15) {
        riskLevel = "Low";
        recommendations = [
          "• Continue regular monitoring with scans every 2-4 weeks",
          "• Maintain healthy lifestyle habits",
          "• No immediate medical intervention typically required",
        ];
      } else if (angle < 30) {
        riskLevel = "Moderate";
        recommendations = [
          "• Schedule consultation with urologist for evaluation",
          "• Consider traction therapy options",
          "• More frequent monitoring recommended (weekly)",
          "• Document any pain or functional changes",
        ];
      } else {
        riskLevel = "High";
        recommendations = [
          "• Seek prompt medical evaluation",
          "• Discuss treatment options with specialist",
          "• Consider imaging studies if recommended",
          "• Monitor for progression closely",
        ];
      }

      doc.text(`Curvature Risk Assessment: ${riskLevel}`, margin, yPos);
      yPos += lineHeight * 2;

      doc.text("Recommendations:", margin, yPos);
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
      "DISCLAIMER: This report is for informational purposes only and does not constitute medical advice. Always consult with a qualified healthcare provider for proper diagnosis and treatment.",
      pageWidth - margin * 2,
    );
    doc.text(disclaimer, margin, yPos);
  }

  onProgress(90);

  // Footer on all pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, pageHeight - 10, { align: "right" });
    doc.text(`${APP_REPORT_TITLE} - Confidential`, margin, pageHeight - 10);
  }

  onProgress(100);
  return doc;
}
