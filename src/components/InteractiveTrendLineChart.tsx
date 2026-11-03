import { useState, useMemo, useRef } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Layers,
  ArrowRight,
  Info,
  Sparkles,
  Download,
  Check,
  Maximize2,
} from 'lucide-react';
import { EconomicEntity } from '../types';
import { useTheme } from '../context/ThemeContext';
import {
  HistoricalMetricKey,
  HistoricalTimeRange,
  HISTORICAL_METRIC_SPECS,
  getExtendedHistory,
  filterHistoryByRange,
} from '../data/historicalExtendedData';
import { getMilestonesForYear } from '../data/milestonesData';
import { ECONOMIC_ENTITIES, getEntityById } from '../data/economicData';

interface InteractiveTrendLineChartProps {
  entityA: EconomicEntity;
  entityB: EconomicEntity;
  initialMetric?: HistoricalMetricKey;
  initialRange?: HistoricalTimeRange;
  className?: string;
}

export function InteractiveTrendLineChart({
  entityA,
  entityB,
  initialMetric = 'nominalGdp',
  initialRange = '10y',
  className = '',
}: InteractiveTrendLineChartProps) {
  const { isDarkMode } = useTheme();

  const [metricKey, setMetricKey] = useState<HistoricalMetricKey>(initialMetric);
  const [timeRange, setTimeRange] = useState<HistoricalTimeRange>(initialRange);

  // Optional benchmark entity to overlay (e.g., US or Global Leader)
  const [benchmarkEntityId, setBenchmarkEntityId] = useState<string>('none');

  // Mouse hover cursor coordinates for data point inspection tooltip
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const metricSpec = HISTORICAL_METRIC_SPECS[metricKey];

  // Extended multi-year histories
  const historyA = useMemo(() => getExtendedHistory(entityA), [entityA]);
  const historyB = useMemo(() => getExtendedHistory(entityB), [entityB]);

  const benchmarkEntity = useMemo(() => {
    if (benchmarkEntityId === 'none') return null;
    return getEntityById(benchmarkEntityId) || null;
  }, [benchmarkEntityId]);

  const historyBenchmark = useMemo(() => {
    if (!benchmarkEntity) return null;
    return getExtendedHistory(benchmarkEntity);
  }, [benchmarkEntity]);

  const filteredA = useMemo(() => filterHistoryByRange(historyA, timeRange), [historyA, timeRange]);
  const filteredB = useMemo(() => filterHistoryByRange(historyB, timeRange), [historyB, timeRange]);
  const filteredBench = useMemo(() => {
    if (!historyBenchmark) return null;
    return filterHistoryByRange(historyBenchmark, timeRange);
  }, [historyBenchmark, timeRange]);

  const years = useMemo(() => filteredA.map((p) => p.year), [filteredA]);

  // Extract values
  const seriesData = useMemo(() => {
    const baseA = filteredA[0]?.nominalGdp || 1;
    const baseB = filteredB[0]?.nominalGdp || 1;
    const baseBench = filteredBench ? filteredBench[0]?.nominalGdp || 1 : 1;

    return years.map((year, idx) => {
      const ptA = filteredA[idx] || ({} as any);
      const ptB = filteredB[idx] || ({} as any);
      const ptBench = filteredBench ? filteredBench[idx] || ({} as any) : null;

      let valA = 0;
      let valB = 0;
      let valBench: number | null = null;

      switch (metricKey) {
        case 'nominalGdp':
          valA = ptA.nominalGdp || 0;
          valB = ptB.nominalGdp || 0;
          if (ptBench) valBench = ptBench.nominalGdp || 0;
          break;
        case 'gdpPerCapita':
          valA = ptA.gdpPerCapita || 0;
          valB = ptB.gdpPerCapita || 0;
          if (ptBench) valBench = ptBench.gdpPerCapita || 0;
          break;
        case 'gdpGrowthRate':
          valA = ptA.gdpGrowthRate || 0;
          valB = ptB.gdpGrowthRate || 0;
          if (ptBench) valBench = ptBench.gdpGrowthRate || 0;
          break;
        case 'inflationRate':
          valA = ptA.inflationRate || 0;
          valB = ptB.inflationRate || 0;
          if (ptBench) valBench = ptBench.inflationRate || 0;
          break;
        case 'publicDebtToGdp':
          valA = ptA.publicDebtToGdp || 0;
          valB = ptB.publicDebtToGdp || 0;
          if (ptBench) valBench = ptBench.publicDebtToGdp || 0;
          break;
        case 'growthIndex':
          valA = baseA > 0 ? ((ptA.nominalGdp || 0) / baseA) * 100 : 100;
          valB = baseB > 0 ? ((ptB.nominalGdp || 0) / baseB) * 100 : 100;
          if (ptBench) valBench = baseBench > 0 ? ((ptBench.nominalGdp || 0) / baseBench) * 100 : 100;
          break;
      }

      // Check for policy shock or milestone for this year
      const yearEvents = getMilestonesForYear(year, entityA, entityB);
      const milestones = [
        ...yearEvents.globalMilestones,
        ...yearEvents.entityAMilestones,
        ...yearEvents.entityBMilestones,
      ];

      return {
        year,
        valA,
        valB,
        valBench,
        milestones,
      };
    });
  }, [years, filteredA, filteredB, filteredBench, metricKey, entityA, entityB]);

  // Min and Max for SVG coordinate mapping
  const { minVal, maxVal } = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    seriesData.forEach((d) => {
      if (d.valA < min) min = d.valA;
      if (d.valB < min) min = d.valB;
      if (d.valBench !== null && d.valBench < min) min = d.valBench;

      if (d.valA > max) max = d.valA;
      if (d.valB > max) max = d.valB;
      if (d.valBench !== null && d.valBench > max) max = d.valBench;
    });

    if (metricKey === 'gdpGrowthRate') {
      return { minVal: Math.floor(Math.min(min, -2)), maxVal: Math.ceil(Math.max(max, 6)) };
    }
    if (metricKey === 'inflationRate') {
      return { minVal: Math.floor(Math.min(min, 0)), maxVal: Math.ceil(Math.max(max, 6)) };
    }
    if (min === Infinity) return { minVal: 0, maxVal: 100 };

    const padding = (max - Math.max(0, min)) * 0.12;
    return { minVal: Math.max(0, min - padding), maxVal: max + padding };
  }, [seriesData, metricKey]);

  // SVG Chart Geometry
  const width = 800;
  const height = 300;
  const padLeft = 70;
  const padRight = 30;
  const padTop = 30;
  const padBottom = 40;

  const innerW = width - padLeft - padRight;
  const innerH = height - padTop - padBottom;

  const getY = (val: number) => {
    if (maxVal === minVal) return padTop + innerH / 2;
    const ratio = (val - minVal) / (maxVal - minVal);
    return padTop + innerH - ratio * innerH;
  };

  const getX = (idx: number) => {
    if (seriesData.length <= 1) return padLeft + innerW / 2;
    return padLeft + (idx / (seriesData.length - 1)) * innerW;
  };

  // Build SVG Paths
  const pathA = useMemo(() => {
    if (seriesData.length === 0) return '';
    return seriesData
      .map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(d.valA).toFixed(1)}`)
      .join(' ');
  }, [seriesData, minVal, maxVal]);

  const pathB = useMemo(() => {
    if (seriesData.length === 0) return '';
    return seriesData
      .map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(d.valB).toFixed(1)}`)
      .join(' ');
  }, [seriesData, minVal, maxVal]);

  const pathBench = useMemo(() => {
    if (!benchmarkEntity || seriesData.length === 0) return '';
    return seriesData
      .filter((d) => d.valBench !== null)
      .map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(d.valBench!).toFixed(1)}`)
      .join(' ');
  }, [seriesData, benchmarkEntity, minVal, maxVal]);

  // Shaded area under Line A
  const areaA = useMemo(() => {
    if (seriesData.length === 0) return '';
    const bottomY = padTop + innerH;
    return `${pathA} L ${getX(seriesData.length - 1)} ${bottomY} L ${getX(0)} ${bottomY} Z`;
  }, [pathA, seriesData, innerH]);

  // Y-axis tick increments (5 ticks)
  const yTicks = useMemo(() => {
    const ticks = [];
    const count = 5;
    for (let i = 0; i < count; i++) {
      ticks.push(minVal + (i / (count - 1)) * (maxVal - minVal));
    }
    return ticks;
  }, [minVal, maxVal]);

  // Hover point inspection
  const activeIdx = hoveredIdx !== null ? hoveredIdx : seriesData.length - 1;
  const activePoint = seriesData[activeIdx] || seriesData[seriesData.length - 1];

  const handleSvgMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!containerRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    // Convert clientX to SVG coordinate space
    const svgX = (clientX / rect.width) * width;
    const effectiveX = Math.max(padLeft, Math.min(width - padRight, svgX));

    // Find closest year index
    let closestIdx = 0;
    let closestDist = Infinity;
    seriesData.forEach((_, i) => {
      const x = getX(i);
      const dist = Math.abs(x - effectiveX);
      if (dist < closestDist) {
        closestDist = dist;
        closestIdx = i;
      }
    });

    setHoveredIdx(closestIdx);
    setMousePos({ x: clientX, y: clientY });
  };

  const handleSvgMouseLeave = () => {
    setHoveredIdx(null);
    setMousePos(null);
  };

  return (
    <div
      ref={containerRef}
      id="interactive-trend-line-chart-card"
      className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs relative transition-colors ${className}`}
    >
      {/* Header and Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Biểu đồ Đường Xu hướng & Quỹ đạo Đa năm
            </h3>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              {timeRange.toUpperCase()} ({years[0]}–{years[years.length - 1]})
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Di chuột qua đường biểu đồ để kiểm tra điểm dữ liệu và chênh lệch qua từng năm.
          </p>
        </div>

        {/* Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Time Range Selector */}
          <div
            role="group"
            aria-label="Khung thời gian"
            className="inline-flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs"
          >
            <button
              onClick={() => setTimeRange('5y')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                timeRange === '5y'
                  ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              5 Năm (2020-24)
            </button>
            <button
              onClick={() => setTimeRange('10y')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                timeRange === '10y'
                  ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              10 Năm (2015-24)
            </button>
            <button
              onClick={() => setTimeRange('20y')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                timeRange === '20y'
                  ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              20 Năm (2005-24)
            </button>
          </div>

          {/* Indicator Dropdown */}
          <div className="flex items-center space-x-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs shadow-2xs">
            <span className="text-slate-400 text-2xs font-semibold">Chỉ số:</span>
            <select
              value={metricKey}
              onChange={(e) => setMetricKey(e.target.value as HistoricalMetricKey)}
              className="bg-transparent font-bold text-slate-800 dark:text-slate-200 focus:outline-hidden cursor-pointer"
            >
              <option value="nominalGdp">GDP Danh nghĩa ($B)</option>
              <option value="gdpPerCapita">GDP Bình quân ($)</option>
              <option value="gdpGrowthRate">Tốc độ tăng trưởng thực (%)</option>
              <option value="inflationRate">Tỷ lệ lạm phát (%)</option>
              <option value="publicDebtToGdp">Nợ công / GDP (%)</option>
              <option value="growthIndex">Chỉ số tích lũy (Base 100)</option>
            </select>
          </div>

          {/* Overlay Benchmark selector */}
          <div className="flex items-center space-x-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs shadow-2xs hidden sm:flex">
            <span className="text-slate-400 text-2xs font-semibold">Đối chuẩn thêm:</span>
            <select
              value={benchmarkEntityId}
              onChange={(e) => setBenchmarkEntityId(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-hidden cursor-pointer"
            >
              <option value="none">Không chọn</option>
              <option value="us">🇺🇸 Hoa Kỳ (USA)</option>
              <option value="cn">🇨🇳 Trung Quốc (China)</option>
              <option value="de">🇩🇪 Đức (Germany)</option>
              <option value="jp">🇯🇵 Nhật Bản (Japan)</option>
              <option value="vn">🇻🇳 Việt Nam</option>
            </select>
          </div>
        </div>
      </div>

      {/* Trajectory Scorecards Strip */}
      {activePoint && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 border-b border-slate-100 dark:border-slate-800 text-xs">
          <div className="p-2.5 rounded-lg bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-900/60">
            <span className="text-3xs uppercase tracking-wider text-indigo-700 dark:text-indigo-400 font-bold block mb-0.5">
              {entityA.name} ({activePoint.year})
            </span>
            <p className="text-sm font-mono font-bold text-indigo-600 dark:text-indigo-400">
              {metricSpec.formatter(activePoint.valA)}
            </p>
          </div>

          <div className="p-2.5 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900/60">
            <span className="text-3xs uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-bold block mb-0.5">
              {entityB.name} ({activePoint.year})
            </span>
            <p className="text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400">
              {metricSpec.formatter(activePoint.valB)}
            </p>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
            <span className="text-3xs uppercase tracking-wider text-slate-400 font-bold block mb-0.5">
              Chênh lệch năm {activePoint.year}
            </span>
            <p className="text-sm font-mono font-bold text-slate-900 dark:text-slate-100">
              {activePoint.valA >= activePoint.valB
                ? `${entityA.shortName} +${metricSpec.formatter(activePoint.valA - activePoint.valB)}`
                : `${entityB.shortName} +${metricSpec.formatter(activePoint.valB - activePoint.valA)}`}
            </p>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
            <span className="text-3xs uppercase tracking-wider text-slate-400 font-bold block mb-0.5">
              Tỷ lệ A so với B
            </span>
            <p className="text-sm font-mono font-bold text-slate-800 dark:text-slate-200">
              {activePoint.valB > 0 ? `${((activePoint.valA / activePoint.valB) * 100).toFixed(1)}%` : 'N/A'}
            </p>
          </div>
        </div>
      )}

      {/* SVG Interactive Trend Graph */}
      <div className="pt-4 relative select-none">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          onMouseMove={handleSvgMouseMove}
          onMouseLeave={handleSvgMouseLeave}
          className="w-full h-auto max-h-[360px] overflow-visible cursor-crosshair"
        >
          <defs>
            <linearGradient id="gradTrendA" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4f46e5" stopOpacity={isDarkMode ? '0.3' : '0.18'} />
              <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="gradTrendB" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#059669" stopOpacity={isDarkMode ? '0.25' : '0.14'} />
              <stop offset="100%" stopColor="#059669" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines and Y-axis text */}
          {yTicks.map((tickVal, i) => {
            const y = getY(tickVal);
            return (
              <g key={i}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={width - padRight}
                  y2={y}
                  stroke={isDarkMode ? '#334155' : '#e2e8f0'}
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <text
                  x={padLeft - 10}
                  y={y + 4}
                  textAnchor="end"
                  fill={isDarkMode ? '#94a3b8' : '#64748b'}
                  fontSize="10"
                  fontFamily="monospace"
                >
                  {metricSpec.formatter(tickVal)}
                </text>
              </g>
            );
          })}

          {/* Zero reference line */}
          {minVal < 0 && maxVal > 0 && (
            <line
              x1={padLeft}
              y1={getY(0)}
              x2={width - padRight}
              y2={getY(0)}
              stroke="#f43f5e"
              strokeWidth="1.5"
              strokeDasharray="3 3"
            />
          )}

          {/* Shaded Areas */}
          <path d={areaA} fill="url(#gradTrendA)" />

          {/* Plotted Line Paths */}
          {pathBench && (
            <path
              d={pathBench}
              fill="none"
              stroke="#94a3b8"
              strokeWidth="2"
              strokeDasharray="4 4"
              strokeLinecap="round"
            />
          )}

          <path
            d={pathB}
            fill="none"
            stroke="#059669"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          <path
            d={pathA}
            fill="none"
            stroke="#4f46e5"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Hover Scrubbing Crosshair Line */}
          {hoveredIdx !== null && (
            <g>
              <line
                x1={getX(hoveredIdx)}
                y1={padTop}
                x2={getX(hoveredIdx)}
                y2={padTop + innerH}
                stroke={isDarkMode ? '#818cf8' : '#6366f1'}
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />

              {/* Point A circle */}
              <circle
                cx={getX(hoveredIdx)}
                cy={getY(activePoint.valA)}
                r="6.5"
                fill="#4f46e5"
                stroke="#ffffff"
                strokeWidth="2.5"
              />

              {/* Point B circle */}
              <circle
                cx={getX(hoveredIdx)}
                cy={getY(activePoint.valB)}
                r="6.5"
                fill="#059669"
                stroke="#ffffff"
                strokeWidth="2.5"
              />

              {/* Benchmark Point circle */}
              {activePoint.valBench !== null && (
                <circle
                  cx={getX(hoveredIdx)}
                  cy={getY(activePoint.valBench)}
                  r="5"
                  fill="#64748b"
                  stroke="#ffffff"
                  strokeWidth="2"
                />
              )}
            </g>
          )}

          {/* Data Points on nodes and X-Axis year labels */}
          {seriesData.map((d, i) => {
            const x = getX(i);
            const isHovered = i === hoveredIdx;

            return (
              <g key={d.year}>
                <circle
                  cx={x}
                  cy={getY(d.valA)}
                  r={isHovered ? 5 : 3.5}
                  fill="#4f46e5"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
                <circle
                  cx={x}
                  cy={getY(d.valB)}
                  r={isHovered ? 5 : 3.5}
                  fill="#059669"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />

                {/* X-axis year */}
                <text
                  x={x}
                  y={padTop + innerH + 18}
                  textAnchor="middle"
                  fill={isHovered ? '#4f46e5' : isDarkMode ? '#94a3b8' : '#64748b'}
                  fontWeight={isHovered ? 'bold' : 'normal'}
                  fontSize={isHovered ? '11' : '9.5'}
                  fontFamily="monospace"
                >
                  {d.year}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Floating Data Point Inspection Tooltip */}
        {hoveredIdx !== null && mousePos && (
          <div
            style={{
              left: `${Math.min(mousePos.x + 16, (containerRef.current?.clientWidth || 700) - 240)}px`,
              top: `${Math.max(10, mousePos.y - 70)}px`,
            }}
            className="pointer-events-none absolute z-30 w-56 p-3 bg-slate-900/95 dark:bg-slate-950/95 text-white backdrop-blur-md rounded-xl border border-slate-700 shadow-xl text-xs animate-in fade-in duration-100"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2 font-mono font-bold">
              <span>Năm {activePoint.year}</span>
              <span className="text-[10px] text-slate-400 font-normal">{metricSpec.label}</span>
            </div>

            <div className="space-y-1.5 font-mono text-[11px]">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-indigo-300 font-medium">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block"></span>
                  <span>{entityA.shortName}:</span>
                </span>
                <span className="font-bold text-indigo-400">
                  {metricSpec.formatter(activePoint.valA)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-emerald-300 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                  <span>{entityB.shortName}:</span>
                </span>
                <span className="font-bold text-emerald-400">
                  {metricSpec.formatter(activePoint.valB)}
                </span>
              </div>

              {benchmarkEntity && activePoint.valBench !== null && (
                <div className="flex items-center justify-between border-t border-slate-800 pt-1">
                  <span className="text-slate-400">{benchmarkEntity.shortName}:</span>
                  <span className="text-slate-200">
                    {metricSpec.formatter(activePoint.valBench)}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between border-t border-slate-800 pt-1 text-[10px]">
                <span className="text-slate-400">Chênh lệch:</span>
                <span className="text-slate-200">
                  {activePoint.valA >= activePoint.valB
                    ? `${entityA.shortName} +${metricSpec.formatter(activePoint.valA - activePoint.valB)}`
                    : `${entityB.shortName} +${metricSpec.formatter(activePoint.valB - activePoint.valA)}`}
                </span>
              </div>
            </div>

            {/* Milestones if any */}
            {activePoint.milestones.length > 0 && (
              <div className="mt-2 pt-1.5 border-t border-amber-900/60 text-[10px] text-amber-300">
                <div className="font-bold flex items-center gap-1 mb-0.5">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>Sự kiện lịch sử:</span>
                </div>
                <div className="line-clamp-2 text-slate-300">
                  {activePoint.milestones[0].title}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Legend and Footer */}
      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-600 dark:text-slate-400 gap-3">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-indigo-600"></span>
            <span className="font-bold text-slate-900 dark:text-slate-100">{entityA.name}</span>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-600"></span>
            <span className="font-bold text-slate-900 dark:text-slate-100">{entityB.name}</span>
          </div>

          {benchmarkEntity && (
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-0.5 bg-slate-400 border-t border-dashed"></span>
              <span className="text-slate-600 dark:text-slate-400">{benchmarkEntity.name} (Đối chuẩn)</span>
            </div>
          )}
        </div>

        <span className="text-[11px] text-slate-400">
          Di chuột dọc theo trục thời gian để xem trước điểm dữ liệu
        </span>
      </div>
    </div>
  );
}
