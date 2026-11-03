import { EconomicEntity, EconomicMilestone } from '../types';
import { HistoricalTimeRange, MetricSpec } from '../data/historicalExtendedData';

export interface ExportChartImageOptions {
  entityA: EconomicEntity;
  entityB: EconomicEntity;
  entityC?: EconomicEntity | null;
  metricSpec: MetricSpec;
  timeRange: HistoricalTimeRange;
  years: number[];
  seriesData: Array<{
    year: number;
    valA: number;
    valB: number;
    valC?: number;
    milestones: EconomicMilestone[];
  }>;
  stats: {
    totalGrowthA: number;
    totalGrowthB: number;
    totalGrowthC?: number;
    cagrA: number;
    cagrB: number;
    cagrC?: number;
    startYear: number;
    endYear: number;
    nYears: number;
  } | null;
  activeYear: number;
  isDarkMode?: boolean;
}

/**
 * Generates a high-resolution, publication-grade PNG image of the historical chart
 * including axes, styled curves, executive scorecards, legend, and source attribution.
 */
export async function exportHistoricalChartAsImage({
  entityA,
  entityB,
  entityC,
  metricSpec,
  timeRange,
  years,
  seriesData,
  stats,
  activeYear,
  isDarkMode = false,
}: ExportChartImageOptions): Promise<void> {
  const width = 1920;
  const height = 1100;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context not supported');
  }

  // Color Palette Definitions
  const bgMain = isDarkMode ? '#0f172a' : '#f8fafc'; // Slate-900 / Slate-50
  const bgCard = isDarkMode ? '#1e293b' : '#ffffff'; // Slate-800 / White
  const bgHeader = isDarkMode ? '#0b1120' : '#ffffff';
  const textPrimary = isDarkMode ? '#f8fafc' : '#0f172a';
  const textSecondary = isDarkMode ? '#94a3b8' : '#64748b';
  const textMuted = isDarkMode ? '#64748b' : '#94a3b8';
  const borderCol = isDarkMode ? '#334155' : '#e2e8f0';
  const gridLineCol = isDarkMode ? 'rgba(51, 65, 85, 0.6)' : 'rgba(226, 232, 240, 0.9)';

  const colA = '#4f46e5'; // Indigo
  const colB = '#059669'; // Emerald
  const colC = '#d97706'; // Amber / Benchmark

  // 1. Background Fill
  ctx.fillStyle = bgMain;
  ctx.fillRect(0, 0, width, height);

  // Decorative top accent border
  const accentGrad = ctx.createLinearGradient(0, 0, width, 0);
  accentGrad.addColorStop(0, '#4f46e5');
  accentGrad.addColorStop(0.5, '#059669');
  accentGrad.addColorStop(1, '#d97706');
  ctx.fillStyle = accentGrad;
  ctx.fillRect(0, 0, width, 8);

  // 2. Header Container
  const pad = 64;
  ctx.fillStyle = bgHeader;
  ctx.beginPath();
  roundRect(ctx, pad, 36, width - pad * 2, 110, 16);
  ctx.fill();
  ctx.strokeStyle = borderCol;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Header Title
  ctx.fillStyle = textPrimary;
  ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('HISTORICAL ECONOMIC TRAJECTORY & MULTI-YEAR TRENDS', pad + 32, 78);

  // Header Subtitle
  const rangeLabel = timeRange === '5y' ? '5-Year' : timeRange === '10y' ? '10-Year' : timeRange === '15y' ? '15-Year' : '20-Year';
  ctx.fillStyle = textSecondary;
  ctx.font = '500 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  const subtext = `${metricSpec.label} Benchmark Analysis • ${rangeLabel} Horizon (${years[0]} - ${years[years.length - 1]}) • Indicator: ${metricSpec.description}`;
  ctx.fillText(subtext, pad + 32, 114);

  // Date Badge (Right Side of Header)
  const dateStr = new Date().toISOString().split('T')[0];
  ctx.fillStyle = isDarkMode ? '#334155' : '#f1f5f9';
  roundRect(ctx, width - pad - 210, 60, 178, 44, 10);
  ctx.fill();
  ctx.strokeStyle = borderCol;
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = textSecondary;
  ctx.font = '600 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`Export: ${dateStr}`, width - pad - 121, 87);
  ctx.textAlign = 'left';

  // 3. Scorecards Row
  const cardY = 166;
  const cardHeight = 94;
  const numCards = entityC ? 4 : 3;
  const cardGap = 20;
  const totalCardWidth = width - pad * 2;
  const cardWidth = (totalCardWidth - cardGap * (numCards - 1)) / numCards;

  // Card 1: Entity A Summary
  drawStatCard(
    ctx,
    pad,
    cardY,
    cardWidth,
    cardHeight,
    `${entityA.flag || '🌐'} ${entityA.shortName} CUMULATIVE GROWTH`,
    stats ? `${stats.totalGrowthA >= 0 ? '+' : ''}${stats.totalGrowthA.toFixed(1)}%` : '-',
    stats ? `CAGR: ${stats.cagrA >= 0 ? '+' : ''}${stats.cagrA.toFixed(1)}% / yr` : '',
    colA,
    bgCard,
    borderCol,
    textSecondary
  );

  // Card 2: Entity B Summary
  drawStatCard(
    ctx,
    pad + cardWidth + cardGap,
    cardY,
    cardWidth,
    cardHeight,
    `${entityB.flag || '🌐'} ${entityB.shortName} CUMULATIVE GROWTH`,
    stats ? `${stats.totalGrowthB >= 0 ? '+' : ''}${stats.totalGrowthB.toFixed(1)}%` : '-',
    stats ? `CAGR: ${stats.cagrB >= 0 ? '+' : ''}${stats.cagrB.toFixed(1)}% / yr` : '',
    colB,
    bgCard,
    borderCol,
    textSecondary
  );

  if (entityC) {
    // Card 3: Entity C Summary
    drawStatCard(
      ctx,
      pad + (cardWidth + cardGap) * 2,
      cardY,
      cardWidth,
      cardHeight,
      `${entityC.flag || '🌐'} ${entityC.shortName} BENCHMARK`,
      stats && stats.totalGrowthC !== undefined ? `${stats.totalGrowthC >= 0 ? '+' : ''}${stats.totalGrowthC.toFixed(1)}%` : '-',
      stats && stats.cagrC !== undefined ? `CAGR: ${stats.cagrC >= 0 ? '+' : ''}${stats.cagrC.toFixed(1)}% / yr` : '',
      colC,
      bgCard,
      borderCol,
      textSecondary
    );
  }

  // Card Last: Focus Year Spread
  const activePt = seriesData.find((d) => d.year === activeYear) || seriesData[seriesData.length - 1];
  const lastCardX = pad + (cardWidth + cardGap) * (numCards - 1);
  let spreadText = '-';
  if (activePt) {
    if (activePt.valA >= activePt.valB) {
      spreadText = `${entityA.shortName} +${metricSpec.formatter(activePt.valA - activePt.valB)}`;
    } else {
      spreadText = `${entityB.shortName} +${metricSpec.formatter(activePt.valB - activePt.valA)}`;
    }
  }

  drawStatCard(
    ctx,
    lastCardX,
    cardY,
    cardWidth,
    cardHeight,
    `SPREAD IN FOCUS YEAR (${activeYear})`,
    spreadText,
    `${metricSpec.label} difference`,
    textPrimary,
    bgCard,
    borderCol,
    textSecondary
  );

  // 4. Main Chart Canvas Area
  const chartBoxY = 282;
  const chartBoxHeight = 670;
  ctx.fillStyle = bgCard;
  roundRect(ctx, pad, chartBoxY, width - pad * 2, chartBoxHeight, 16);
  ctx.fill();
  ctx.strokeStyle = borderCol;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Internal Plot Geometry
  const plotLeft = pad + 120;
  const plotRight = width - pad - 60;
  const plotTop = chartBoxY + 50;
  const plotBottom = chartBoxY + chartBoxHeight - 90;
  const plotWidth = plotRight - plotLeft;
  const plotHeight = plotBottom - plotTop;

  // Min and Max scale
  let minVal = Infinity;
  let maxVal = -Infinity;
  seriesData.forEach((d) => {
    if (d.valA < minVal) minVal = d.valA;
    if (d.valB < minVal) minVal = d.valB;
    if (d.valC !== undefined && d.valC < minVal) minVal = d.valC;

    if (d.valA > maxVal) maxVal = d.valA;
    if (d.valB > maxVal) maxVal = d.valB;
    if (d.valC !== undefined && d.valC > maxVal) maxVal = d.valC;
  });

  if (metricSpec.key === 'gdpGrowthRate') {
    minVal = Math.floor(Math.min(minVal, -2));
    maxVal = Math.ceil(Math.max(maxVal, 6));
  } else if (metricSpec.key === 'inflationRate' || metricSpec.key === 'unemploymentRate') {
    minVal = Math.floor(Math.min(minVal, 0));
    maxVal = Math.ceil(Math.max(maxVal, 6));
  } else {
    const padVal = (maxVal - Math.max(0, minVal)) * 0.12;
    minVal = Math.max(0, minVal - padVal);
    maxVal = maxVal + padVal;
  }

  const getY = (val: number) => {
    if (maxVal === minVal) return plotTop + plotHeight / 2;
    const ratio = (val - minVal) / (maxVal - minVal);
    return plotBottom - ratio * plotHeight;
  };

  const getX = (idx: number) => {
    if (seriesData.length <= 1) return plotLeft + plotWidth / 2;
    return plotLeft + (idx / (seriesData.length - 1)) * plotWidth;
  };

  // Horizontal Grid Lines & Y-axis Ticks
  const yTickCount = 6;
  ctx.textAlign = 'right';
  ctx.font = '500 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace';

  for (let i = 0; i < yTickCount; i++) {
    const val = minVal + (i / (yTickCount - 1)) * (maxVal - minVal);
    const y = getY(val);

    ctx.beginPath();
    ctx.strokeStyle = gridLineCol;
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.moveTo(plotLeft, y);
    ctx.lineTo(plotRight, y);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = textMuted;
    ctx.fillText(metricSpec.formatter(val), plotLeft - 16, y + 5);
  }

  // Zero reference line if negative values exist
  if (minVal < 0 && maxVal > 0) {
    const zeroY = getY(0);
    ctx.beginPath();
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 3]);
    ctx.moveTo(plotLeft, zeroY);
    ctx.lineTo(plotRight, zeroY);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Area Gradients
  const gradA = ctx.createLinearGradient(0, plotTop, 0, plotBottom);
  gradA.addColorStop(0, 'rgba(79, 70, 229, 0.25)');
  gradA.addColorStop(1, 'rgba(79, 70, 229, 0.0)');

  const gradB = ctx.createLinearGradient(0, plotTop, 0, plotBottom);
  gradB.addColorStop(0, 'rgba(5, 150, 105, 0.22)');
  gradB.addColorStop(1, 'rgba(5, 150, 105, 0.0)');

  // Fill Area A
  ctx.beginPath();
  seriesData.forEach((d, i) => {
    const x = getX(i);
    const y = getY(d.valA);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.lineTo(getX(seriesData.length - 1), plotBottom);
  ctx.lineTo(getX(0), plotBottom);
  ctx.closePath();
  ctx.fillStyle = gradA;
  ctx.fill();

  // Fill Area B
  ctx.beginPath();
  seriesData.forEach((d, i) => {
    const x = getX(i);
    const y = getY(d.valB);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.lineTo(getX(seriesData.length - 1), plotBottom);
  ctx.lineTo(getX(0), plotBottom);
  ctx.closePath();
  ctx.fillStyle = gradB;
  ctx.fill();

  // If Entity C, fill Area C
  if (entityC) {
    const gradC = ctx.createLinearGradient(0, plotTop, 0, plotBottom);
    gradC.addColorStop(0, 'rgba(217, 119, 6, 0.2)');
    gradC.addColorStop(1, 'rgba(217, 119, 6, 0.0)');

    ctx.beginPath();
    seriesData.forEach((d, i) => {
      const x = getX(i);
      const y = getY(d.valC ?? d.valB);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.lineTo(getX(seriesData.length - 1), plotBottom);
    ctx.lineTo(getX(0), plotBottom);
    ctx.closePath();
    ctx.fillStyle = gradC;
    ctx.fill();
  }

  // Draw Path A
  ctx.beginPath();
  seriesData.forEach((d, i) => {
    const x = getX(i);
    const y = getY(d.valA);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = colA;
  ctx.lineWidth = 3.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();

  // Draw Path B
  ctx.beginPath();
  seriesData.forEach((d, i) => {
    const x = getX(i);
    const y = getY(d.valB);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = colB;
  ctx.lineWidth = 3.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();

  // Draw Path C if present
  if (entityC) {
    ctx.beginPath();
    seriesData.forEach((d, i) => {
      const x = getX(i);
      const y = getY(d.valC ?? d.valB);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = colC;
    ctx.lineWidth = 3.5;
    ctx.setLineDash([7, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Active Year Crosshair
  const activeIdx = years.indexOf(activeYear);
  if (activeIdx >= 0) {
    const crossX = getX(activeIdx);
    ctx.beginPath();
    ctx.strokeStyle = isDarkMode ? '#818cf8' : '#6366f1';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.moveTo(crossX, plotTop);
    ctx.lineTo(crossX, plotBottom);
    ctx.stroke();
    ctx.setLineDash([]);

    // Highlight Dot A
    drawFocusPoint(ctx, crossX, getY(activePt.valA), colA);
    // Highlight Dot B
    drawFocusPoint(ctx, crossX, getY(activePt.valB), colB);
    // Highlight Dot C
    if (entityC && activePt.valC !== undefined) {
      drawFocusPoint(ctx, crossX, getY(activePt.valC), colC);
    }
  }

  // Node Dots & X-axis Year Labels
  ctx.textAlign = 'center';
  seriesData.forEach((d, i) => {
    const x = getX(i);
    const isFocus = d.year === activeYear;

    // Dot A
    ctx.beginPath();
    ctx.arc(x, getY(d.valA), isFocus ? 6 : 4, 0, Math.PI * 2);
    ctx.fillStyle = colA;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Dot B
    ctx.beginPath();
    ctx.arc(x, getY(d.valB), isFocus ? 6 : 4, 0, Math.PI * 2);
    ctx.fillStyle = colB;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Dot C
    if (entityC && d.valC !== undefined) {
      ctx.beginPath();
      ctx.arc(x, getY(d.valC), isFocus ? 6 : 4, 0, Math.PI * 2);
      ctx.fillStyle = colC;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Milestone Badge
    if (d.milestones.length > 0) {
      ctx.beginPath();
      ctx.arc(x, plotTop - 12, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#f59e0b';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Year Label
    ctx.fillStyle = isFocus ? colA : textSecondary;
    ctx.font = isFocus ? 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace' : '500 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace';
    ctx.fillText(`${d.year}`, x, plotBottom + 28);
  });

  // 5. Legend Bar at Bottom of Plot Box
  const legendY = chartBoxY + chartBoxHeight - 42;
  ctx.textAlign = 'left';
  ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

  let legendX = plotLeft;

  // Legend A
  ctx.fillStyle = colA;
  ctx.beginPath();
  ctx.arc(legendX, legendY - 5, 7, 0, Math.PI * 2);
  ctx.fill();
  legendX += 16;
  ctx.fillStyle = textPrimary;
  ctx.fillText(`${entityA.name} (${activePt ? metricSpec.formatter(activePt.valA) : ''})`, legendX, legendY);
  legendX += ctx.measureText(`${entityA.name} (${activePt ? metricSpec.formatter(activePt.valA) : ''})`).width + 48;

  // Legend B
  ctx.fillStyle = colB;
  ctx.beginPath();
  ctx.arc(legendX, legendY - 5, 7, 0, Math.PI * 2);
  ctx.fill();
  legendX += 16;
  ctx.fillStyle = textPrimary;
  ctx.fillText(`${entityB.name} (${activePt ? metricSpec.formatter(activePt.valB) : ''})`, legendX, legendY);
  legendX += ctx.measureText(`${entityB.name} (${activePt ? metricSpec.formatter(activePt.valB) : ''})`).width + 48;

  // Legend C (if present)
  if (entityC) {
    ctx.fillStyle = colC;
    ctx.beginPath();
    ctx.arc(legendX, legendY - 5, 7, 0, Math.PI * 2);
    ctx.fill();
    legendX += 16;
    ctx.fillStyle = textPrimary;
    ctx.fillText(`${entityC.name} [Overlay Benchmark] (${activePt && activePt.valC !== undefined ? metricSpec.formatter(activePt.valC) : ''})`, legendX, legendY);
  }

  // 6. Footer Attribution
  ctx.fillStyle = textMuted;
  ctx.font = '400 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Sources: World Bank World Development Indicators, IMF World Economic Outlook, OECD & National Statistical Offices', pad, height - 24);

  ctx.textAlign = 'right';
  ctx.fillText('Global Macroeconomic Comparison Lab • High-Resolution Visual Export', width - pad, height - 24);

  // 7. Convert to Blob & Download File
  return new Promise<void>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Failed to create image blob'));
        return;
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const cleanA = entityA.shortName.replace(/[^a-zA-Z0-9]/g, '_');
      const cleanB = entityB.shortName.replace(/[^a-zA-Z0-9]/g, '_');
      const cleanC = entityC ? `_vs_${entityC.shortName.replace(/[^a-zA-Z0-9]/g, '_')}` : '';
      const filename = `Historical_Trend_${cleanA}_vs_${cleanB}${cleanC}_${metricSpec.key}_${timeRange}_${dateStr}.png`;

      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      resolve();
    }, 'image/png');
  });
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function drawStatCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  val: string,
  sub: string,
  valColor: string,
  bgColor: string,
  borderColor: string,
  textColor: string
) {
  ctx.fillStyle = bgColor;
  roundRect(ctx, x, y, w, h, 12);
  ctx.fill();
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = textColor;
  ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(label, x + 20, y + 26);

  ctx.fillStyle = valColor;
  ctx.font = '900 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(val, x + 20, y + 58);

  ctx.fillStyle = textColor;
  ctx.font = '500 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace';
  ctx.fillText(sub, x + 20, y + 80);
}

function drawFocusPoint(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.beginPath();
  ctx.arc(x, y, 9, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(x, y, 5, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
}
