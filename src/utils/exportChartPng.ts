import { EconomicEntity } from '../types';
import { HistoricalMetricKey, HistoricalTimeRange, ExtendedHistoricalPoint } from '../data/historicalExtendedData';

export interface ExportHistoricalChartOptions {
  entityA: EconomicEntity;
  entityB: EconomicEntity;
  metricKey: HistoricalMetricKey;
  metricLabel: string;
  metricFormatter: (val: number) => string;
  timeRange: HistoricalTimeRange;
  seriesData: Array<{
    year: number;
    valA: number;
    valB: number;
    milestones?: any[];
  }>;
  activeYear: number;
  stats: {
    totalGrowthA: number;
    totalGrowthB: number;
    cagrA: number;
    cagrB: number;
    startYear: number;
    endYear: number;
  } | null;
  isDarkMode: boolean;
}

export interface RadarDimension {
  label: string;
  computeScore: (e: EconomicEntity) => number;
  formatValue: (e: EconomicEntity) => string;
}

export interface ExportEconomicRadarOptions {
  entityA: EconomicEntity;
  entityB: EconomicEntity;
  dimensions: RadarDimension[];
  isDarkMode: boolean;
}

/**
 * Triggers a browser download of a Canvas as a PNG file
 */
function downloadCanvasAsPng(canvas: HTMLCanvasElement, filename: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to create image blob'));
            return;
          }
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.download = filename;
          link.href = url;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setTimeout(() => URL.revokeObjectURL(url), 1500);
          resolve(true);
        },
        'image/png',
        1.0
      );
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Helper to draw a rounded rectangle on a 2D Canvas context
 */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/**
 * Generates and downloads a high-resolution PNG image of the Historical Trajectory Chart
 */
export async function downloadHistoricalChartPng(
  options: ExportHistoricalChartOptions
): Promise<boolean> {
  const {
    entityA,
    entityB,
    metricKey,
    metricLabel,
    metricFormatter,
    timeRange,
    seriesData,
    activeYear,
    stats,
    isDarkMode,
  } = options;

  // Ultra-crisp high-resolution dimensions (2400 x 1320 px)
  const width = 2400;
  const height = 1320;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context not available');

  // Theme-aware palette
  const bgColor = isDarkMode ? '#0f172a' : '#ffffff';
  const cardBg = isDarkMode ? '#1e293b' : '#f8fafc';
  const cardBorder = isDarkMode ? '#334155' : '#e2e8f0';
  const textPrimary = isDarkMode ? '#f8fafc' : '#0f172a';
  const textSecondary = isDarkMode ? '#94a3b8' : '#64748b';
  const textMuted = isDarkMode ? '#64748b' : '#94a3b8';
  const gridLineColor = isDarkMode ? '#334155' : '#e2e8f0';

  const colorA = '#4f46e5'; // Indigo
  const colorB = '#059669'; // Emerald
  const accentMilestone = '#f59e0b'; // Amber

  // 1. Fill Canvas Background
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);

  // Outer container subtle frame
  ctx.strokeStyle = cardBorder;
  ctx.lineWidth = 2;
  roundRect(ctx, 24, 24, width - 48, height - 48, 20);
  ctx.stroke();

  // 2. Header Bar
  const headerX = 64;
  let currentY = 75;

  // Category Tag
  ctx.fillStyle = colorA;
  ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
  ctx.fillText('HISTORICAL ECONOMIC TRAJECTORY & MULTI-YEAR TRENDS', headerX, currentY);

  currentY += 44;
  // Main Title
  ctx.fillStyle = textPrimary;
  ctx.font = 'bold 38px system-ui, -apple-system, sans-serif';
  ctx.fillText(`${entityA.name}  vs  ${entityB.name}`, headerX, currentY);

  // Subtitle with Horizon & Metric
  const horizonText =
    timeRange === '5y'
      ? '5-Year (2020–2024)'
      : timeRange === '10y'
      ? '10-Year (2015–2024)'
      : timeRange === '20y'
      ? '20-Year (2005–2024)'
      : 'Full Historical Horizon';
  ctx.fillStyle = textSecondary;
  ctx.font = '500 20px system-ui, -apple-system, sans-serif';
  ctx.fillText(
    `Benchmark Indicator: ${metricLabel}  ·  Horizon: ${horizonText}  ·  Active Focus: ${activeYear}`,
    headerX,
    currentY + 34
  );

  // Top-right timestamp watermark
  ctx.textAlign = 'right';
  ctx.fillStyle = textMuted;
  ctx.font = '16px monospace';
  const dateStr = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  ctx.fillText(`Exported: ${dateStr}`, width - 64, 75);
  ctx.fillText('GDP & Economic Comparator', width - 64, 105);
  ctx.textAlign = 'left';

  // 3. Summary Scorecards Strip (4 boxes)
  currentY += 65;
  const cardWidth = (width - 128 - 3 * 24) / 4;
  const cardHeight = 110;

  if (stats) {
    const cardData = [
      {
        label: `${entityA.shortName.toUpperCase()} CUMULATIVE GROWTH`,
        value: `${stats.totalGrowthA >= 0 ? '+' : ''}${stats.totalGrowthA.toFixed(1)}%`,
        sub: `CAGR: ${stats.cagrA >= 0 ? '+' : ''}${stats.cagrA.toFixed(1)}% / yr`,
        valColor: colorA,
      },
      {
        label: `${entityB.shortName.toUpperCase()} CUMULATIVE GROWTH`,
        value: `${stats.totalGrowthB >= 0 ? '+' : ''}${stats.totalGrowthB.toFixed(1)}%`,
        sub: `CAGR: ${stats.cagrB >= 0 ? '+' : ''}${stats.cagrB.toFixed(1)}% / yr`,
        valColor: colorB,
      },
      {
        label: `ACTIVE FOCUS YEAR (${activeYear})`,
        value: `${activeYear}`,
        sub: 'Multi-year trajectory anchor',
        valColor: textPrimary,
      },
      {
        label: `SPREAD IN ${activeYear}`,
        value: (() => {
          const pt = seriesData.find((d) => d.year === activeYear) || seriesData[seriesData.length - 1];
          if (!pt) return 'N/A';
          const diff = Math.abs(pt.valA - pt.valB);
          const leader = pt.valA >= pt.valB ? entityA.shortName : entityB.shortName;
          return `${leader} +${metricFormatter(diff)}`;
        })(),
        sub: `${metricLabel} spread`,
        valColor: textPrimary,
      },
    ];

    cardData.forEach((cd, idx) => {
      const cx = headerX + idx * (cardWidth + 24);
      ctx.fillStyle = cardBg;
      roundRect(ctx, cx, currentY, cardWidth, cardHeight, 12);
      ctx.fill();
      ctx.strokeStyle = cardBorder;
      ctx.lineWidth = 1.5;
      roundRect(ctx, cx, currentY, cardWidth, cardHeight, 12);
      ctx.stroke();

      // Card Title
      ctx.fillStyle = textSecondary;
      ctx.font = 'bold 12px monospace';
      ctx.fillText(cd.label, cx + 18, currentY + 28);

      // Card Value
      ctx.fillStyle = cd.valColor;
      ctx.font = 'bold 28px monospace';
      ctx.fillText(cd.value, cx + 18, currentY + 68);

      // Card Subtitle
      ctx.fillStyle = textMuted;
      ctx.font = '500 13px system-ui, -apple-system, sans-serif';
      ctx.fillText(cd.sub, cx + 18, currentY + 95);
    });
  }

  // 4. Main Line Graph Geometry
  currentY += cardHeight + 40;
  const chartPadLeft = 140;
  const chartPadRight = 70;
  const chartPadTop = currentY + 20;
  const chartPadBottom = 80;

  const chartAreaWidth = width - chartPadLeft - chartPadRight;
  const chartAreaHeight = height - chartPadTop - chartPadBottom - 70; // reserve space for bottom legend

  // Calculate Min & Max values
  let minVal = Infinity;
  let maxVal = -Infinity;
  seriesData.forEach((d) => {
    if (d.valA < minVal) minVal = d.valA;
    if (d.valB < minVal) minVal = d.valB;
    if (d.valA > maxVal) maxVal = d.valA;
    if (d.valB > maxVal) maxVal = d.valB;
  });

  if (metricKey === 'gdpGrowthRate') {
    minVal = Math.floor(Math.min(minVal, -1));
    maxVal = Math.ceil(Math.max(maxVal, 6));
  } else if (metricKey === 'inflationRate') {
    minVal = Math.floor(Math.min(minVal, 0));
    maxVal = Math.ceil(Math.max(maxVal, 5));
  } else {
    const pad = (maxVal - Math.max(0, minVal)) * 0.12;
    minVal = Math.max(0, minVal - pad);
    maxVal = maxVal + pad;
  }
  if (minVal === Infinity) {
    minVal = 0;
    maxVal = 100;
  }

  const getY = (val: number) => {
    if (maxVal === minVal) return chartPadTop + chartAreaHeight / 2;
    const ratio = (val - minVal) / (maxVal - minVal);
    return chartPadTop + chartAreaHeight - ratio * chartAreaHeight;
  };

  const getX = (idx: number) => {
    if (seriesData.length <= 1) return chartPadLeft + chartAreaWidth / 2;
    return chartPadLeft + (idx / (seriesData.length - 1)) * chartAreaWidth;
  };

  // Horizontal Grid Lines & Y-axis labels
  const tickCount = 6;
  ctx.textAlign = 'right';
  ctx.font = '14px monospace';

  for (let i = 0; i < tickCount; i++) {
    const tickVal = minVal + (i / (tickCount - 1)) * (maxVal - minVal);
    const ty = getY(tickVal);

    ctx.strokeStyle = gridLineColor;
    ctx.lineWidth = 1.2;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(chartPadLeft, ty);
    ctx.lineTo(chartPadLeft + chartAreaWidth, ty);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = textSecondary;
    ctx.fillText(metricFormatter(tickVal), chartPadLeft - 16, ty + 5);
  }
  ctx.textAlign = 'left';

  // Zero-line if minVal < 0 < maxVal
  if (minVal < 0 && maxVal > 0) {
    const zeroY = getY(0);
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(chartPadLeft, zeroY);
    ctx.lineTo(chartPadLeft + chartAreaWidth, zeroY);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Draw Area Fills under curves
  const bottomY = chartPadTop + chartAreaHeight;

  // Area A Gradient
  const gradA = ctx.createLinearGradient(0, chartPadTop, 0, bottomY);
  gradA.addColorStop(0, 'rgba(79, 70, 229, 0.28)');
  gradA.addColorStop(1, 'rgba(79, 70, 229, 0.0)');

  ctx.fillStyle = gradA;
  ctx.beginPath();
  seriesData.forEach((d, i) => {
    const x = getX(i);
    const y = getY(d.valA);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.lineTo(getX(seriesData.length - 1), bottomY);
  ctx.lineTo(getX(0), bottomY);
  ctx.closePath();
  ctx.fill();

  // Area B Gradient
  const gradB = ctx.createLinearGradient(0, chartPadTop, 0, bottomY);
  gradB.addColorStop(0, 'rgba(5, 150, 105, 0.25)');
  gradB.addColorStop(1, 'rgba(5, 150, 105, 0.0)');

  ctx.fillStyle = gradB;
  ctx.beginPath();
  seriesData.forEach((d, i) => {
    const x = getX(i);
    const y = getY(d.valB);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.lineTo(getX(seriesData.length - 1), bottomY);
  ctx.lineTo(getX(0), bottomY);
  ctx.closePath();
  ctx.fill();

  // Draw Line A
  ctx.strokeStyle = colorA;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  seriesData.forEach((d, i) => {
    const x = getX(i);
    const y = getY(d.valA);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // Draw Line B
  ctx.strokeStyle = colorB;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  seriesData.forEach((d, i) => {
    const x = getX(i);
    const y = getY(d.valB);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // Draw active year vertical crosshair
  const activeIndex = seriesData.findIndex((d) => d.year === activeYear);
  if (activeIndex >= 0) {
    const activeX = getX(activeIndex);
    ctx.strokeStyle = colorA;
    ctx.lineWidth = 2.5;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(activeX, chartPadTop);
    ctx.lineTo(activeX, bottomY);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Draw Data Points & X-Axis Year Labels
  ctx.textAlign = 'center';
  seriesData.forEach((d, i) => {
    const x = getX(i);
    const yA = getY(d.valA);
    const yB = getY(d.valB);
    const isFocus = d.year === activeYear;

    // Node A
    ctx.fillStyle = isFocus ? colorA : '#818cf8';
    ctx.beginPath();
    ctx.arc(x, yA, isFocus ? 9 : 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Node B
    ctx.fillStyle = isFocus ? colorB : '#34d399';
    ctx.beginPath();
    ctx.arc(x, yB, isFocus ? 9 : 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Milestone marker
    if (d.milestones && d.milestones.length > 0) {
      ctx.fillStyle = accentMilestone;
      ctx.beginPath();
      ctx.arc(x, chartPadTop - 8, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // X-Axis Year Text
    ctx.fillStyle = isFocus ? colorA : textSecondary;
    ctx.font = isFocus ? 'bold 16px monospace' : '14px monospace';
    ctx.fillText(`${d.year}`, x, bottomY + 28);
  });
  ctx.textAlign = 'left';

  // 5. Bottom Legend Dock
  const dockY = height - 55;
  const activePoint = seriesData.find((d) => d.year === activeYear) || seriesData[seriesData.length - 1];

  // Entity A Legend
  ctx.fillStyle = colorA;
  ctx.beginPath();
  ctx.arc(headerX + 10, dockY - 6, 8, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = textPrimary;
  ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
  ctx.fillText(entityA.name, headerX + 28, dockY);

  if (activePoint) {
    ctx.fillStyle = colorA;
    ctx.font = 'bold 16px monospace';
    ctx.fillText(`(${metricFormatter(activePoint.valA)})`, headerX + 36 + ctx.measureText(entityA.name).width, dockY);
  }

  // Entity B Legend
  const offsetB = headerX + 380;
  ctx.fillStyle = colorB;
  ctx.beginPath();
  ctx.arc(offsetB + 10, dockY - 6, 8, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = textPrimary;
  ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
  ctx.fillText(entityB.name, offsetB + 28, dockY);

  if (activePoint) {
    ctx.fillStyle = colorB;
    ctx.font = 'bold 16px monospace';
    ctx.fillText(`(${metricFormatter(activePoint.valB)})`, offsetB + 36 + ctx.measureText(entityB.name).width, dockY);
  }

  // Milestone indicator
  const offsetM = offsetB + 400;
  ctx.fillStyle = accentMilestone;
  ctx.beginPath();
  ctx.arc(offsetM + 10, dockY - 6, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = textSecondary;
  ctx.font = '14px system-ui, -apple-system, sans-serif';
  ctx.fillText('Historical Policy / Crisis Milestones', offsetM + 24, dockY);

  // Right footer note
  ctx.textAlign = 'right';
  ctx.fillStyle = textMuted;
  ctx.font = '14px system-ui, -apple-system, sans-serif';
  ctx.fillText('High-Resolution 2400×1320 PNG Visual Export', width - 64, dockY);

  // Sanitize filename
  const safeNameA = entityA.id.replace(/[^a-z0-9_-]/gi, '_');
  const safeNameB = entityB.id.replace(/[^a-z0-9_-]/gi, '_');
  const filename = `historical_chart_${safeNameA}_vs_${safeNameB}_${metricKey}_${timeRange}.png`;

  return downloadCanvasAsPng(canvas, filename);
}

/**
 * Generates and downloads a high-resolution PNG image of the Economic Radar Profile
 */
export async function downloadEconomicRadarPng(
  options: ExportEconomicRadarOptions
): Promise<boolean> {
  const { entityA, entityB, dimensions, isDarkMode } = options;

  // High-resolution canvas dimensions (2200 x 1280 px)
  const width = 2200;
  const height = 1280;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context not available');

  // Theme-aware palette
  const bgColor = isDarkMode ? '#0f172a' : '#ffffff';
  const cardBg = isDarkMode ? '#1e293b' : '#f8fafc';
  const cardBorder = isDarkMode ? '#334155' : '#e2e8f0';
  const textPrimary = isDarkMode ? '#f8fafc' : '#0f172a';
  const textSecondary = isDarkMode ? '#94a3b8' : '#64748b';
  const textMuted = isDarkMode ? '#64748b' : '#94a3b8';
  const gridLineColor = isDarkMode ? '#334155' : '#e2e8f0';
  const spokeLineColor = isDarkMode ? '#475569' : '#cbd5e1';

  const colorA = '#6366f1'; // Indigo
  const colorB = '#10b981'; // Emerald

  // 1. Fill Background
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);

  // Outer border frame
  ctx.strokeStyle = cardBorder;
  ctx.lineWidth = 2;
  roundRect(ctx, 24, 24, width - 48, height - 48, 20);
  ctx.stroke();

  // 2. Header
  const headerX = 64;
  let currentY = 75;

  ctx.fillStyle = colorA;
  ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
  ctx.fillText('6-AXIS NORMALIZED MACROECONOMIC PROFILE', headerX, currentY);

  currentY += 44;
  ctx.fillStyle = textPrimary;
  ctx.font = 'bold 38px system-ui, -apple-system, sans-serif';
  ctx.fillText(`${entityA.name}  vs  ${entityB.name}`, headerX, currentY);

  ctx.fillStyle = textSecondary;
  ctx.font = '500 20px system-ui, -apple-system, sans-serif';
  ctx.fillText(
    'Multidimensional comparative benchmarking: scale, wealth, resilience, stability, and human development.',
    headerX,
    currentY + 34
  );

  // Top-right timestamp watermark
  ctx.textAlign = 'right';
  ctx.fillStyle = textMuted;
  ctx.font = '16px monospace';
  const dateStr = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  ctx.fillText(`Exported: ${dateStr}`, width - 64, 75);
  ctx.fillText('GDP & Economic Comparator', width - 64, 105);
  ctx.textAlign = 'left';

  // 3. Radar Geometry (Left Side)
  const radarCenterX = 560;
  const radarCenterY = 700;
  const radarRadius = 360;
  const numDimensions = dimensions.length;
  const angleStep = (Math.PI * 2) / numDimensions;

  // Concentric polygon grid levels (25%, 50%, 75%, 100%)
  const levels = [0.25, 0.5, 0.75, 1.0];

  levels.forEach((lvl, lvlIdx) => {
    ctx.beginPath();
    for (let i = 0; i < numDimensions; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const r = lvl * radarRadius;
      const x = radarCenterX + r * Math.cos(angle);
      const y = radarCenterY + r * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = gridLineColor;
    ctx.lineWidth = 1.5;
    if (lvlIdx < levels.length - 1) {
      ctx.setLineDash([4, 4]);
    } else {
      ctx.setLineDash([]);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Grid level percentage tag
    ctx.fillStyle = textMuted;
    ctx.font = '12px monospace';
    ctx.fillText(`${lvl * 100}%`, radarCenterX + 6, radarCenterY - lvl * radarRadius - 4);
  });

  // Axis spokes
  for (let i = 0; i < numDimensions; i++) {
    const angle = i * angleStep - Math.PI / 2;
    const x2 = radarCenterX + radarRadius * Math.cos(angle);
    const y2 = radarCenterY + radarRadius * Math.sin(angle);

    ctx.strokeStyle = spokeLineColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(radarCenterX, radarCenterY);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  // Calculate polygon vertices
  const pointsA = dimensions.map((dim, i) => {
    const score = dim.computeScore(entityA);
    const angle = i * angleStep - Math.PI / 2;
    const r = (score / 100) * radarRadius;
    return {
      x: radarCenterX + r * Math.cos(angle),
      y: radarCenterY + r * Math.sin(angle),
    };
  });

  const pointsB = dimensions.map((dim, i) => {
    const score = dim.computeScore(entityB);
    const angle = i * angleStep - Math.PI / 2;
    const r = (score / 100) * radarRadius;
    return {
      x: radarCenterX + r * Math.cos(angle),
      y: radarCenterY + r * Math.sin(angle),
    };
  });

  // Draw Entity A Polygon
  ctx.beginPath();
  pointsA.forEach((pt, i) => {
    if (i === 0) ctx.moveTo(pt.x, pt.y);
    else ctx.lineTo(pt.x, pt.y);
  });
  ctx.closePath();
  ctx.fillStyle = isDarkMode ? 'rgba(99, 102, 241, 0.35)' : 'rgba(99, 102, 241, 0.25)';
  ctx.fill();
  ctx.strokeStyle = colorA;
  ctx.lineWidth = 4;
  ctx.stroke();

  // Draw Entity B Polygon
  ctx.beginPath();
  pointsB.forEach((pt, i) => {
    if (i === 0) ctx.moveTo(pt.x, pt.y);
    else ctx.lineTo(pt.x, pt.y);
  });
  ctx.closePath();
  ctx.fillStyle = isDarkMode ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.2)';
  ctx.fill();
  ctx.strokeStyle = colorB;
  ctx.lineWidth = 4;
  ctx.stroke();

  // Draw Vertex Circles for A
  pointsA.forEach((pt) => {
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 6, 0, Math.PI * 2);
    ctx.fillStyle = colorA;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
  });

  // Draw Vertex Circles for B
  pointsB.forEach((pt) => {
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 6, 0, Math.PI * 2);
    ctx.fillStyle = colorB;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
  });

  // Axis Labels on outer ring
  ctx.textAlign = 'center';
  ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
  dimensions.forEach((dim, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const labelRadius = radarRadius + 55;
    const lx = radarCenterX + labelRadius * Math.cos(angle);
    const ly = radarCenterY + labelRadius * Math.sin(angle);

    ctx.fillStyle = textPrimary;
    ctx.fillText(dim.label, lx, ly + 5);
  });
  ctx.textAlign = 'left';

  // 4. Dimension Breakdown List (Right Side Panel)
  const panelX = 1140;
  const panelY = 220;
  const panelWidth = width - panelX - 64;
  const panelHeight = height - panelY - 110;

  ctx.fillStyle = cardBg;
  roundRect(ctx, panelX, panelY, panelWidth, panelHeight, 16);
  ctx.fill();
  ctx.strokeStyle = cardBorder;
  ctx.lineWidth = 1.5;
  roundRect(ctx, panelX, panelY, panelWidth, panelHeight, 16);
  ctx.stroke();

  // Panel Header
  ctx.fillStyle = textPrimary;
  ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
  ctx.fillText('Normalized Performance Dimension Breakdown', panelX + 32, panelY + 45);

  ctx.fillStyle = textSecondary;
  ctx.font = '14px system-ui, -apple-system, sans-serif';
  ctx.fillText('Scores normalized to a 0–100 scale based on global distribution.', panelX + 32, panelY + 75);

  // Table header legend
  ctx.fillStyle = colorA;
  ctx.fillRect(panelX + panelWidth - 360, panelY + 35, 14, 14);
  ctx.fillStyle = textPrimary;
  ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
  ctx.fillText(entityA.name, panelX + panelWidth - 338, panelY + 47);

  ctx.fillStyle = colorB;
  ctx.fillRect(panelX + panelWidth - 180, panelY + 35, 14, 14);
  ctx.fillStyle = textPrimary;
  ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
  ctx.fillText(entityB.name, panelX + panelWidth - 158, panelY + 47);

  // Dimension Rows
  const rowStartY = panelY + 115;
  const rowHeight = (panelHeight - 145) / dimensions.length;

  dimensions.forEach((dim, idx) => {
    const ry = rowStartY + idx * rowHeight;
    const scoreA = dim.computeScore(entityA);
    const scoreB = dim.computeScore(entityB);
    const valA = dim.formatValue(entityA);
    const valB = dim.formatValue(entityB);

    // Separator line
    if (idx > 0) {
      ctx.strokeStyle = cardBorder;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(panelX + 32, ry - 10);
      ctx.lineTo(panelX + panelWidth - 32, ry - 10);
      ctx.stroke();
    }

    // Dimension Label
    ctx.fillStyle = textPrimary;
    ctx.font = 'bold 18px system-ui, -apple-system, sans-serif';
    ctx.fillText(dim.label, panelX + 32, ry + 22);

    // Score comparison bars
    const barWidth = 260;
    const barHeight = 8;
    const barX = panelX + 32;
    const barY = ry + 36;

    // Entity A Bar
    ctx.fillStyle = cardBorder;
    ctx.fillRect(barX, barY, barWidth, barHeight);
    ctx.fillStyle = colorA;
    ctx.fillRect(barX, barY, (scoreA / 100) * barWidth, barHeight);

    // Entity B Bar
    const barBX = barX + barWidth + 30;
    ctx.fillStyle = cardBorder;
    ctx.fillRect(barBX, barY, barWidth, barHeight);
    ctx.fillStyle = colorB;
    ctx.fillRect(barBX, barY, (scoreB / 100) * barWidth, barHeight);

    // Text Values
    ctx.textAlign = 'right';
    ctx.fillStyle = colorA;
    ctx.font = 'bold 18px monospace';
    ctx.fillText(`${valA}`, panelX + panelWidth - 210, ry + 24);
    ctx.fillStyle = textMuted;
    ctx.font = '14px monospace';
    ctx.fillText(`(${scoreA.toFixed(0)}/100)`, panelX + panelWidth - 210, ry + 44);

    ctx.fillStyle = colorB;
    ctx.font = 'bold 18px monospace';
    ctx.fillText(`${valB}`, panelX + panelWidth - 32, ry + 24);
    ctx.fillStyle = textMuted;
    ctx.font = '14px monospace';
    ctx.fillText(`(${scoreB.toFixed(0)}/100)`, panelX + panelWidth - 32, ry + 44);

    ctx.textAlign = 'left';
  });

  // 5. Footer Bar
  const dockY = height - 55;
  ctx.fillStyle = textMuted;
  ctx.font = '14px system-ui, -apple-system, sans-serif';
  ctx.fillText('GDP & Economic Indicator Comparator · Macroeconomic Radar Benchmark', headerX, dockY);

  ctx.textAlign = 'right';
  ctx.fillText('High-Resolution 2200×1280 PNG Visual Export', width - 64, dockY);

  // Sanitize filename
  const safeNameA = entityA.id.replace(/[^a-z0-9_-]/gi, '_');
  const safeNameB = entityB.id.replace(/[^a-z0-9_-]/gi, '_');
  const filename = `economic_radar_${safeNameA}_vs_${safeNameB}.png`;

  return downloadCanvasAsPng(canvas, filename);
}
