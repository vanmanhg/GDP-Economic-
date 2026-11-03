import { jsPDF } from 'jspdf';
import { EconomicEntity } from '../types';
import { formatCurrency } from './formatters';

interface PdfReportRow {
  id: string;
  name: string;
  valA: string;
  valB: string;
  advantage: string;
  isLeadA?: boolean;
  isLeadB?: boolean;
}

interface GeneratePdfOptions {
  entityA: EconomicEntity;
  entityB: EconomicEntity;
  rows: PdfReportRow[];
  selectedCount: number;
  totalCount: number;
}

/**
 * Generates a clean, professional, printer-friendly PDF report
 * of the two compared entities and their active macroeconomic indicators.
 */
export function generatePdfComparisonReport({
  entityA,
  entityB,
  rows,
  selectedCount,
  totalCount,
}: GeneratePdfOptions): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 182mm

  let currentY = margin;

  // 1. Top Decorative Brand Banner (Indigo Gradient Accent)
  doc.setFillColor(67, 56, 202); // #4338CA (Indigo-700)
  doc.rect(margin, currentY, contentWidth, 3.5, 'F');
  currentY += 8;

  // 2. Report Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.setTextColor(15, 23, 42); // #0F172A
  doc.text('MACROECONOMIC COMPARISON REPORT', margin, currentY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139); // #64748B
  const dateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  doc.text(`Generated: ${dateStr} • Baseline: Standardized Global USD`, pageWidth - margin, currentY, {
    align: 'right',
  });

  currentY += 6;

  // Sub-header title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(79, 70, 229); // #4F46E5
  doc.text(`${entityA.name}  vs.  ${entityB.name}`, margin, currentY);

  currentY += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Entity A: ${entityA.name} (${entityA.type === 'region' ? 'Subnational Region' : 'Sovereign Nation'}, ${entityA.continent}) | Entity B: ${entityB.name} (${entityB.type === 'region' ? 'Subnational Region' : 'Sovereign Nation'}, ${entityB.continent})`,
    margin,
    currentY
  );

  currentY += 8;

  // 3. Executive Snapshot Side-by-Side Summary Box
  const boxHeight = 26;
  doc.setFillColor(248, 250, 252); // #F8FAFC
  doc.setDrawColor(226, 232, 240); // #E2E8F0
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, currentY, contentWidth, boxHeight, 2, 2, 'FD');

  const colWidth = contentWidth / 4;

  // Card 1: Nominal GDP
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('NOMINAL GDP', margin + 4, currentY + 6);
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(`${entityA.shortName}: ${formatCurrency(entityA.nominalGdp)}`, margin + 4, currentY + 13);
  doc.text(`${entityB.shortName}: ${formatCurrency(entityB.nominalGdp)}`, margin + 4, currentY + 20);

  // Card 2: GDP Per Capita
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('GDP PER CAPITA', margin + colWidth + 4, currentY + 6);
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(`${entityA.shortName}: $${Math.round(entityA.gdpPerCapitaNominal).toLocaleString()}`, margin + colWidth + 4, currentY + 13);
  doc.text(`${entityB.shortName}: $${Math.round(entityB.gdpPerCapitaNominal).toLocaleString()}`, margin + colWidth + 4, currentY + 20);

  // Card 3: Real Growth Rate
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('REAL GDP GROWTH', margin + colWidth * 2 + 4, currentY + 6);
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(`${entityA.shortName}: +${entityA.gdpGrowthRate}%`, margin + colWidth * 2 + 4, currentY + 13);
  doc.text(`${entityB.shortName}: +${entityB.gdpGrowthRate}%`, margin + colWidth * 2 + 4, currentY + 20);

  // Card 4: Population & Debt
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('POPULATION & DEBT', margin + colWidth * 3 + 4, currentY + 6);
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(`${entityA.shortName}: ${entityA.population}M (${entityA.publicDebtToGdp}% debt)`, margin + colWidth * 3 + 4, currentY + 13);
  doc.text(`${entityB.shortName}: ${entityB.population}M (${entityB.publicDebtToGdp}% debt)`, margin + colWidth * 3 + 4, currentY + 20);

  currentY += boxHeight + 8;

  // 4. Indicator Table Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`Active Macroeconomic Indicators (${selectedCount} of ${totalCount} active)`, margin, currentY);
  currentY += 4;

  const colX = {
    ind: margin + 2,
    valA: margin + 68,
    valB: margin + 112,
    adv: margin + 152,
  };

  // Table Column Headers Bar
  const headerHeight = 7.5;
  doc.setFillColor(241, 245, 249); // #F1F5F9 (slate-100)
  doc.rect(margin, currentY, contentWidth, headerHeight, 'F');
  doc.setDrawColor(203, 213, 225); // #CBD5E1
  doc.line(margin, currentY + headerHeight, margin + contentWidth, currentY + headerHeight);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85); // slate-700
  doc.text('INDICATOR', colX.ind, currentY + 5.2);
  doc.text(`${entityA.shortName.toUpperCase()}`, colX.valA, currentY + 5.2);
  doc.text(`${entityB.shortName.toUpperCase()}`, colX.valB, currentY + 5.2);
  doc.text('ADVANTAGE / SPREAD', colX.adv, currentY + 5.2);

  currentY += headerHeight;

  // 5. Table Rows
  const rowHeight = 7.2;
  const maxY = pageHeight - margin - 18; // Leave room for footer

  rows.forEach((row, index) => {
    // Check if we need to paginate (rare for 18 rows, but defensive)
    if (currentY + rowHeight > maxY) {
      doc.addPage();
      currentY = margin + 5;

      // Repeat Table Column Headers on new page
      doc.setFillColor(241, 245, 249);
      doc.rect(margin, currentY, contentWidth, headerHeight, 'F');
      doc.setDrawColor(203, 213, 225);
      doc.line(margin, currentY + headerHeight, margin + contentWidth, currentY + headerHeight);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      doc.text('INDICATOR', colX.ind, currentY + 5.2);
      doc.text(`${entityA.shortName.toUpperCase()}`, colX.valA, currentY + 5.2);
      doc.text(`${entityB.shortName.toUpperCase()}`, colX.valB, currentY + 5.2);
      doc.text('ADVANTAGE / SPREAD', colX.adv, currentY + 5.2);
      currentY += headerHeight;
    }

    // Alternating zebra striping
    if (index % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, currentY, contentWidth, rowHeight, 'F');
    }

    // Row divider
    doc.setDrawColor(241, 245, 249);
    doc.setLineWidth(0.2);
    doc.line(margin, currentY + rowHeight, margin + contentWidth, currentY + rowHeight);

    // Row text
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text(row.name, colX.ind, currentY + 5);

    // Val A
    doc.setFont('helvetica', row.isLeadA ? 'bold' : 'normal');
    doc.setTextColor(row.isLeadA ? 67 : 51, row.isLeadA ? 56 : 65, row.isLeadA ? 202 : 85);
    doc.text(row.valA, colX.valA, currentY + 5);

    // Val B
    doc.setFont('helvetica', row.isLeadB ? 'bold' : 'normal');
    doc.setTextColor(row.isLeadB ? 5 : 51, row.isLeadB ? 150 : 65, row.isLeadB ? 105 : 85);
    doc.text(row.valB, colX.valB, currentY + 5);

    // Advantage
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(row.advantage, colX.adv, currentY + 5);

    currentY += rowHeight;
  });

  currentY += 6;

  // 6. Core Industries summary line
  if (currentY + 12 < maxY) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(`${entityA.shortName} Core Industries:`, margin, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(entityA.topIndustries.join(', '), margin + 35, currentY);

    currentY += 4.5;

    doc.setFont('helvetica', 'bold');
    doc.text(`${entityB.shortName} Core Industries:`, margin, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(entityB.topIndustries.join(', '), margin + 35, currentY);
  }

  // 7. Page Footer
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);

    // Bottom rule
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.line(margin, pageHeight - margin - 5, pageWidth - margin, pageHeight - margin - 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(
      'GDP & Economic Indicator Comparator • Source: World Bank, IMF World Economic Outlook & National Accounts',
      margin,
      pageHeight - margin - 1
    );

    doc.text(`Page ${p} of ${totalPages}`, pageWidth - margin, pageHeight - margin - 1, {
      align: 'right',
    });
  }

  // Generate downloadable PDF
  const cleanA = entityA.shortName.replace(/[^a-zA-Z0-9]/g, '_');
  const cleanB = entityB.shortName.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `Macro_Comparison_${cleanA}_vs_${cleanB}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}
