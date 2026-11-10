import { EconomicEntity } from '../types';

export interface PieSliceData {
  id: string;
  label: string;
  valueA: number;
  pctA: number;
  valueB: number;
  pctB: number;
  color: string;
  formattedA: string;
  formattedB: string;
}

export interface ExportPieChartOptions {
  entityA: EconomicEntity;
  entityB: EconomicEntity;
  metricTitle: string;
  metricSubtitle: string;
  slices: PieSliceData[];
  isDonut: boolean;
  centerLabelA: { value: string; label: string };
  centerLabelB: { value: string; label: string };
  isDarkMode: boolean;
}

/**
 * Triggers a browser download of an HTML5 Canvas as a PNG file
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
 * Exports a high-resolution 2200x1300 PNG image of the comparative pie / donut chart.
 */
export async function exportComparativePieChartAsPng(options: ExportPieChartOptions): Promise<boolean> {
  const {
    entityA,
    entityB,
    metricTitle,
    metricSubtitle,
    slices,
    isDonut,
    centerLabelA,
    centerLabelB,
    isDarkMode,
  } = options;

  const width = 2200;
  const height = 1350;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context not supported');
  }

  // Color Palette according to Dark / Light Mode
  const bgFill = isDarkMode ? '#090d16' : '#f8fafc';
  const cardFill = isDarkMode ? '#0f172a' : '#ffffff';
  const cardBorder = isDarkMode ? '#1e293b' : '#e2e8f0';
  const textPrimary = isDarkMode ? '#f8fafc' : '#0f172a';
  const textSecondary = isDarkMode ? '#94a3b8' : '#64748b';
  const textMuted = isDarkMode ? '#64748b' : '#94a3b8';
  const colorA = '#6366f1'; // Indigo
  const colorB = '#10b981'; // Emerald

  // 1. Background Fill with subtle radial lighting
  ctx.fillStyle = bgFill;
  ctx.fillRect(0, 0, width, height);

  const radial = ctx.createRadialGradient(width / 2, 200, 50, width / 2, 200, 900);
  if (isDarkMode) {
    radial.addColorStop(0, 'rgba(99, 102, 241, 0.08)');
    radial.addColorStop(1, 'transparent');
  } else {
    radial.addColorStop(0, 'rgba(99, 102, 241, 0.04)');
    radial.addColorStop(1, 'transparent');
  }
  ctx.fillStyle = radial;
  ctx.fillRect(0, 0, width, height);

  // 2. Header Area
  const headerX = 72;
  const headerY = 75;

  // Category Tag
  ctx.fillStyle = isDarkMode ? '#1e1b4b' : '#e0e7ff';
  ctx.beginPath();
  ctx.roundRect(headerX, headerY, 260, 32, 6);
  ctx.fill();

  ctx.fillStyle = isDarkMode ? '#818cf8' : '#4338ca';
  ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('COMPARATIVE PIE VISUALIZATION', headerX + 16, headerY + 21);

  // Main Title
  ctx.fillStyle = textPrimary;
  ctx.font = '900 38px system-ui, -apple-system, sans-serif';
  ctx.fillText(metricTitle, headerX, headerY + 76);

  // Subtitle
  ctx.fillStyle = textSecondary;
  ctx.font = '18px system-ui, -apple-system, sans-serif';
  ctx.fillText(
    `${metricSubtitle} · So sánh trực tiếp giữa ${entityA.name} và ${entityB.name}`,
    headerX,
    headerY + 110
  );

  // Right-aligned Entity Badges
  const badgeRight = width - 72;
  const badgeY = headerY + 10;

  // Entity A Tag
  ctx.fillStyle = cardFill;
  ctx.beginPath();
  ctx.roundRect(badgeRight - 480, badgeY, 225, 68, 12);
  ctx.fill();
  ctx.strokeStyle = cardBorder;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = colorA;
  ctx.beginPath();
  ctx.arc(badgeRight - 480 + 24, badgeY + 34, 7, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = textPrimary;
  ctx.font = 'bold 18px system-ui, -apple-system, sans-serif';
  ctx.fillText(`${entityA.flag} ${entityA.name}`, badgeRight - 480 + 42, badgeY + 32);
  ctx.fillStyle = textSecondary;
  ctx.font = '13px monospace';
  ctx.fillText(
    `GDP: $${entityA.nominalGdp >= 1000 ? (entityA.nominalGdp / 1000).toFixed(2) + 'T' : entityA.nominalGdp + 'B'} USD`,
    badgeRight - 480 + 42,
    badgeY + 52
  );

  // Entity B Tag
  ctx.fillStyle = cardFill;
  ctx.beginPath();
  ctx.roundRect(badgeRight - 235, badgeY, 235, 68, 12);
  ctx.fill();
  ctx.strokeStyle = cardBorder;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = colorB;
  ctx.beginPath();
  ctx.arc(badgeRight - 235 + 24, badgeY + 34, 7, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = textPrimary;
  ctx.font = 'bold 18px system-ui, -apple-system, sans-serif';
  ctx.fillText(`${entityB.flag} ${entityB.name}`, badgeRight - 235 + 42, badgeY + 32);
  ctx.fillStyle = textSecondary;
  ctx.font = '13px monospace';
  ctx.fillText(
    `GDP: $${entityB.nominalGdp >= 1000 ? (entityB.nominalGdp / 1000).toFixed(2) + 'T' : entityB.nominalGdp + 'B'} USD`,
    badgeRight - 235 + 42,
    badgeY + 52
  );

  // 3. Side-by-Side Pie / Donut Panels
  const panelWidth = 980;
  const panelHeight = 630;
  const panelTop = 230;
  const panelLeftA = 72;
  const panelLeftB = width - 72 - panelWidth;

  const drawPiePanel = (
    panelX: number,
    entity: EconomicEntity,
    pctKey: 'pctA' | 'pctB',
    valKey: 'formattedA' | 'formattedB',
    accentColor: string,
    centerData: { value: string; label: string }
  ) => {
    // Card background
    ctx.fillStyle = cardFill;
    ctx.beginPath();
    ctx.roundRect(panelX, panelTop, panelWidth, panelHeight, 20);
    ctx.fill();
    ctx.strokeStyle = cardBorder;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Panel Header
    ctx.fillStyle = textPrimary;
    ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${entity.flag}  ${entity.name} (${entity.shortName})`, panelX + 36, panelTop + 50);

    ctx.fillStyle = textSecondary;
    ctx.font = '14px system-ui, -apple-system, sans-serif';
    ctx.fillText(
      `${entity.type === 'region' ? 'Khu vực địa phương' : 'Quốc gia độc lập'} · Xếp hạng GDP toàn cầu: #${entity.globalGdpRank}`,
      panelX + 36,
      panelTop + 76
    );

    // Pie Center and Radii
    const centerX = panelX + 330;
    const centerY = panelTop + 350;
    const outerRadius = 190;
    const innerRadius = isDonut ? 110 : 0;

    // Filter valid positive slices
    const totalPct = slices.reduce((acc, s) => acc + Math.max(0, s[pctKey]), 0);
    const validTotal = totalPct > 0 ? totalPct : 100;

    let currentAngle = -Math.PI / 2; // Start from top 12 o'clock

    slices.forEach((slice) => {
      const slicePct = Math.max(0, slice[pctKey]);
      const angle = (slicePct / validTotal) * Math.PI * 2;
      if (angle <= 0.001) return;

      const endAngle = currentAngle + angle;

      // Draw slice arc
      ctx.beginPath();
      ctx.arc(centerX, centerY, outerRadius, currentAngle, endAngle);
      if (isDonut) {
        ctx.arc(centerX, centerY, innerRadius, endAngle, currentAngle, true);
      } else {
        ctx.lineTo(centerX, centerY);
      }
      ctx.closePath();

      ctx.fillStyle = slice.color;
      ctx.fill();

      ctx.strokeStyle = isDarkMode ? '#0f172a' : '#ffffff';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Label on slice if angle is substantial (> 0.22 radians ~ 12.6 degrees)
      if (angle > 0.22 && slicePct >= 4) {
        const midAngle = currentAngle + angle / 2;
        const labelRadius = isDonut ? (innerRadius + outerRadius) / 2 : outerRadius * 0.65;
        const labelX = centerX + Math.cos(midAngle) * labelRadius;
        const labelY = centerY + Math.sin(midAngle) * labelRadius;

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 15px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0,0,0,0.6)';
        ctx.shadowBlur = 4;
        ctx.fillText(`${slicePct.toFixed(1)}%`, labelX, labelY);
        ctx.shadowBlur = 0;
      }

      currentAngle = endAngle;
    });

    // If Donut: Center Cutout & Hub
    if (isDonut) {
      ctx.fillStyle = cardFill;
      ctx.beginPath();
      ctx.arc(centerX, centerY, innerRadius - 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = textPrimary;
      ctx.font = '900 24px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(centerData.value, centerX, centerY - 10);

      ctx.fillStyle = textSecondary;
      ctx.font = '12px system-ui, -apple-system, sans-serif';
      ctx.fillText(centerData.label, centerX, centerY + 18);
    }

    // Legend on the Right side of the Panel
    const legendX = panelX + 570;
    let legendY = panelTop + 140;

    ctx.fillStyle = textMuted;
    ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('PHÂN BỔ TỶ TRỌNG & GIÁ TRỊ', legendX, legendY);

    legendY += 26;

    slices.forEach((slice) => {
      const slicePct = slice[pctKey];

      // Color bullet
      ctx.fillStyle = slice.color;
      ctx.beginPath();
      ctx.roundRect(legendX, legendY + 2, 12, 12, 3);
      ctx.fill();

      // Label
      ctx.fillStyle = textPrimary;
      ctx.font = 'bold 15px system-ui, -apple-system, sans-serif';
      ctx.fillText(slice.label, legendX + 22, legendY + 14);

      // Percentage and absolute value
      ctx.font = 'bold 16px monospace';
      ctx.fillStyle = accentColor;
      ctx.textAlign = 'right';
      ctx.fillText(`${slicePct.toFixed(1)}%`, panelX + panelWidth - 36, legendY + 14);

      ctx.fillStyle = textSecondary;
      ctx.font = '12px monospace';
      ctx.fillText(slice[valKey], panelX + panelWidth - 36, legendY + 34);

      ctx.textAlign = 'left';

      // Separator line
      legendY += 54;
      ctx.strokeStyle = cardBorder;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(legendX, legendY - 10);
      ctx.lineTo(panelX + panelWidth - 36, legendY - 10);
      ctx.stroke();
    });
  };

  // Draw Entity A Panel
  drawPiePanel(panelLeftA, entityA, 'pctA', 'formattedA', colorA, centerLabelA);

  // Draw Entity B Panel
  drawPiePanel(panelLeftB, entityB, 'pctB', 'formattedB', colorB, centerLabelB);

  // 4. Comparative Delta Table at the Bottom
  const bottomTableY = panelTop + panelHeight + 35;
  const bottomTableHeight = 340;

  ctx.fillStyle = cardFill;
  ctx.beginPath();
  ctx.roundRect(headerX, bottomTableY, width - headerX * 2, bottomTableHeight, 20);
  ctx.fill();
  ctx.strokeStyle = cardBorder;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Bottom table header
  ctx.fillStyle = textPrimary;
  ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Bảng Đối chiếu Tỷ trọng & Chênh lệch Cơ cấu (Structural Variance Analysis)', headerX + 36, bottomTableY + 44);

  ctx.fillStyle = textSecondary;
  ctx.font = '14px system-ui, -apple-system, sans-serif';
  ctx.fillText('Phân tích chênh lệch phần trăm điểm (percentage point delta) giữa hai nền kinh tế', headerX + 36, bottomTableY + 70);

  // Table Columns
  const colCategoryX = headerX + 36;
  const colValAX = headerX + 680;
  const colValBX = headerX + 1140;
  const colDeltaX = headerX + 1620;

  let rowY = bottomTableY + 115;

  // Header Row
  ctx.fillStyle = isDarkMode ? '#1e293b' : '#f1f5f9';
  ctx.beginPath();
  ctx.roundRect(headerX + 24, rowY - 20, width - headerX * 2 - 48, 38, 8);
  ctx.fill();

  ctx.fillStyle = textMuted;
  ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
  ctx.fillText('DANH MỤC THÀNH PHẦN', colCategoryX, rowY + 4);
  ctx.fillText(`${entityA.shortName.toUpperCase()} (TỶ TRỌNG & GIÁ TRỊ)`, colValAX, rowY + 4);
  ctx.fillText(`${entityB.shortName.toUpperCase()} (TỶ TRỌNG & GIÁ TRỊ)`, colValBX, rowY + 4);
  ctx.fillText('CHÊNH LỆCH DELTA (A vs B)', colDeltaX, rowY + 4);

  rowY += 46;

  slices.forEach((slice) => {
    const diffPct = slice.pctA - slice.pctB;
    const isHigherA = diffPct > 0;

    // Bullet & Title
    ctx.fillStyle = slice.color;
    ctx.beginPath();
    ctx.arc(colCategoryX + 6, rowY + 5, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = textPrimary;
    ctx.font = 'bold 15px system-ui, -apple-system, sans-serif';
    ctx.fillText(slice.label, colCategoryX + 22, rowY + 10);

    // Entity A
    ctx.fillStyle = colorA;
    ctx.font = 'bold 16px monospace';
    ctx.fillText(`${slice.pctA.toFixed(1)}%`, colValAX, rowY + 10);
    ctx.fillStyle = textSecondary;
    ctx.font = '13px monospace';
    ctx.fillText(`(${slice.formattedA})`, colValAX + 85, rowY + 10);

    // Entity B
    ctx.fillStyle = colorB;
    ctx.font = 'bold 16px monospace';
    ctx.fillText(`${slice.pctB.toFixed(1)}%`, colValBX, rowY + 10);
    ctx.fillStyle = textSecondary;
    ctx.font = '13px monospace';
    ctx.fillText(`(${slice.formattedB})`, colValBX + 85, rowY + 10);

    // Delta
    const deltaColor = Math.abs(diffPct) < 0.1 ? textMuted : isHigherA ? '#6366f1' : '#10b981';
    ctx.fillStyle = deltaColor;
    ctx.font = 'bold 16px monospace';
    const deltaText = diffPct > 0 ? `+${diffPct.toFixed(1)}% (${entityA.shortName} cao hơn)` : diffPct < 0 ? `${diffPct.toFixed(1)}% (${entityB.shortName} cao hơn)` : '0.0% (Tương đương)';
    ctx.fillText(deltaText, colDeltaX, rowY + 10);

    rowY += 48;
    ctx.strokeStyle = cardBorder;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(headerX + 24, rowY - 14);
    ctx.lineTo(width - headerX - 24, rowY - 14);
    ctx.stroke();
  });

  // 5. Footer dock
  const dockY = height - 40;
  ctx.fillStyle = textMuted;
  ctx.font = '13px system-ui, -apple-system, sans-serif';
  ctx.fillText('GDP & Economic Indicator Comparator · Macroeconomic Pie & Donut Analysis Tool', headerX, dockY);

  ctx.textAlign = 'right';
  ctx.fillText('Xuất đồ họa PNG độ nét cao (2200×1350 Canvas HD)', width - 72, dockY);

  // Filename sanitize
  const safeNameA = entityA.id.replace(/[^a-z0-9_-]/gi, '_');
  const safeNameB = entityB.id.replace(/[^a-z0-9_-]/gi, '_');
  const filename = `pie_chart_${safeNameA}_vs_${safeNameB}.png`;

  return downloadCanvasAsPng(canvas, filename);
}
