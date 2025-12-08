import jsPDF from 'jspdf';
import type { ScanEntry, DiaryEntry } from '@/contexts/DataContext';

export const generateHealthReport = (
  scans: ScanEntry[],
  diaryEntries: DiaryEntry[],
): jsPDF => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  // Header
  doc.setFontSize(24);
  doc.setTextColor(0, 150, 136);
  doc.text('MorphoScan Health Report', pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 10;
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { 
    year: 'numeric', month: 'long', day: 'numeric' 
  })}`, pageWidth / 2, yPos, { align: 'center' });

  // Divider
  yPos += 10;
  doc.setDrawColor(200, 200, 200);
  doc.line(20, yPos, pageWidth - 20, yPos);

  // Summary Section
  yPos += 15;
  doc.setFontSize(14);
  doc.setTextColor(40, 40, 40);
  doc.text('Summary', 20, yPos);
  
  yPos += 8;
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text(`Total Scans: ${scans.length}`, 20, yPos);
  yPos += 6;
  doc.text(`Diary Entries: ${diaryEntries.length}`, 20, yPos);
  
  if (scans.length > 0) {
    const latestScan = scans[0];
    yPos += 6;
    doc.text(`Latest Scan Date: ${new Date(latestScan.created_at).toLocaleDateString()}`, 20, yPos);
    if (latestScan.curvature_angle) {
      yPos += 6;
      doc.text(`Latest Curvature: ${latestScan.curvature_angle}° (${latestScan.curvature_direction || 'N/A'})`, 20, yPos);
    }
  }

  // Scan History Section
  if (scans.length > 0) {
    yPos += 15;
    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text('Scan History', 20, yPos);
    
    yPos += 10;
    
    // Table header
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text('Date', 20, yPos);
    doc.text('Type', 55, yPos);
    doc.text('Length', 80, yPos);
    doc.text('Circ.', 105, yPos);
    doc.text('Curve', 130, yPos);
    doc.text('Direction', 155, yPos);
    
    yPos += 2;
    doc.line(20, yPos, pageWidth - 20, yPos);
    yPos += 6;
    
    doc.setTextColor(60, 60, 60);
    scans.slice(0, 15).forEach((scan) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.text(new Date(scan.created_at).toLocaleDateString(), 20, yPos);
      doc.text(scan.scan_type.toUpperCase(), 55, yPos);
      doc.text(scan.length ? `${scan.length}cm` : '-', 80, yPos);
      doc.text(scan.circumference ? `${scan.circumference}cm` : '-', 105, yPos);
      doc.text(scan.curvature_angle ? `${scan.curvature_angle}°` : '-', 130, yPos);
      doc.text(scan.curvature_direction?.substring(0, 12) || '-', 155, yPos);
      yPos += 7;
    });
  }

  // Health Diary Section
  if (diaryEntries.length > 0) {
    if (yPos > 220) {
      doc.addPage();
      yPos = 20;
    }
    
    yPos += 10;
    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text('Health Diary Entries', 20, yPos);
    
    yPos += 10;
    
    diaryEntries.slice(0, 10).forEach((entry) => {
      if (yPos > 260) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(10);
      doc.setTextColor(0, 150, 136);
      doc.text(new Date(entry.entry_date).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric'
      }), 20, yPos);
      
      yPos += 6;
      doc.setTextColor(60, 60, 60);
      doc.setFontSize(9);
      
      const measurements = [];
      if (entry.length) measurements.push(`Length: ${entry.length}cm`);
      if (entry.circumference) measurements.push(`Circ: ${entry.circumference}cm`);
      if (entry.curvature_angle) measurements.push(`Curve: ${entry.curvature_angle}°`);
      if (entry.pain_level !== null) measurements.push(`Pain: ${entry.pain_level}/10`);
      
      doc.text(measurements.join(' | '), 20, yPos);
      
      if (entry.notes) {
        yPos += 5;
        doc.setTextColor(100, 100, 100);
        const noteLines = doc.splitTextToSize(`Notes: ${entry.notes}`, pageWidth - 40);
        doc.text(noteLines, 20, yPos);
        yPos += noteLines.length * 4;
      }
      
      yPos += 8;
    });
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      'This report is for informational purposes only. Consult a healthcare provider for medical advice.',
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - 20, doc.internal.pageSize.getHeight() - 10, { align: 'right' });
  }

  return doc;
};

export const downloadPDF = (doc: jsPDF, filename = 'health-report.pdf') => {
  doc.save(filename);
};

export const getPDFBlob = (doc: jsPDF): Blob => {
  return doc.output('blob');
};
