import { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { EconomicEntity } from '../types';
import {
  HistoricalMetricKey,
  HISTORICAL_METRIC_SPECS,
  getExtendedHistory,
  filterHistoryByRange,
} from '../data/historicalExtendedData';

interface MacroMiniSparklineProps {
  metricKey: HistoricalMetricKey;
  entityA: EconomicEntity;
  entityB: EconomicEntity;
  timeRange?: '5y' | '10y' | '20y';
  size?: 'inline' | 'compact' | 'card';
  className?: string;
  onSelectMetric?: (key: HistoricalMetricKey) => void;
}

export function MacroMiniSparkline({
  metricKey,
  entityA,
  entityB,
  timeRange = '10y',
  size = 'compact',
  className = '',
  onSelectMetric,
}: MacroMiniSparklineProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const spec = HISTORICAL_METRIC_SPECS[metricKey] || HISTORICAL_METRIC_SPECS.gdpGrowthRate;

  // Retrieve multi-year history for both entities
  const seriesA = useMemo(() => {
    const raw = getExtendedHistory(entityA);
    return filterHistoryByRange(raw, timeRange);
  }, [entityA, timeRange]);

  const seriesB = useMemo(() => {
    const raw = getExtendedHistory(entityB);
    return filterHistoryByRange(raw, timeRange);
  }, [entityB, timeRange]);

  const years = useMemo(() => seriesA.map((p) => p.year), [seriesA]);

  const pointsA = useMemo(() => {
    return seriesA.map((p) => {
      const val = (p as any)[metricKey] ?? 0;
      return typeof val === 'number' ? val : 0;
    });
  }, [seriesA, metricKey]);

  const pointsB = useMemo(() => {
    return seriesB.map((p) => {
      const val = (p as any)[metricKey] ?? 0;
      return typeof val === 'number' ? val : 0;
    });
  }, [seriesB, metricKey]);

  // Min and max for SVG scaling
  const { minVal, maxVal, range } = useMemo(() => {
    const all = [...pointsA, ...pointsB];
    if (all.length === 0) return { minVal: 0, maxVal: 100, range: 100 };
    let min = Math.min(...all);
    let max = Math.max(...all);
    if (min === max) {
      min -= 1;
      max += 1;
    }
    const padding = (max - min) * 0.12;
    return {
      minVal: min - padding,
      maxVal: max + padding,
      range: max - min + padding * 2 || 1,
    };
  }, [pointsA, pointsB]);

  // Dimension settings
  const width = size === 'inline' ? 64 : size === 'card' ? 240 : 160;
  const height = size === 'inline' ? 20 : size === 'card' ? 44 : 36;
  const padX = 3;
  const padY = 3;

  const getCoordinates = (points: number[]) => {
    const n = points.length;
    if (n === 0) return '';
    return points
      .map((val, i) => {
        const x = padX + (i / Math.max(1, n - 1)) * (width - padX * 2);
        const y = height - padY - ((val - minVal) / range) * (height - padY * 2);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  };

  const polylineA = useMemo(() => getCoordinates(pointsA), [pointsA, minVal, range, width, height]);
  const polylineB = useMemo(() => getCoordinates(pointsB), [pointsB, minVal, range, width, height]);

  // Start vs latest
  const startA = pointsA[0] ?? 0;
  const latestA = pointsA[pointsA.length - 1] ?? 0;
  const deltaA = latestA - startA;

  const startB = pointsB[0] ?? 0;
  const latestB = pointsB[pointsB.length - 1] ?? 0;
  const deltaB = latestB - startB;

  // Zero-line Y position if range spans zero
  const zeroY = useMemo(() => {
    if (minVal < 0 && maxVal > 0) {
      return height - padY - ((0 - minVal) / range) * (height - padY * 2);
    }
    return null;
  }, [minVal, maxVal, range, height]);

  // Active hover data point
  const activeYear = hoveredIdx !== null ? years[hoveredIdx] : years[years.length - 1];
  const activeValA = hoveredIdx !== null ? pointsA[hoveredIdx] : latestA;
  const activeValB = hoveredIdx !== null ? pointsB[hoveredIdx] : latestB;

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = e.clientX - rect.left - padX;
    const innerW = width - padX * 2;
    const ratio = Math.max(0, Math.min(1, clientX / innerW));
    const idx = Math.round(ratio * (years.length - 1));
    setHoveredIdx(idx);
  };

  // 1. INLINE SIZE (Fits seamlessly within paragraph sentences)
  if (size === 'inline') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 align-middle mx-1 px-1.5 py-0.5 rounded-md bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 text-[11px] font-medium text-slate-700 dark:text-slate-300 relative group cursor-pointer select-none transition-colors hover:border-indigo-400 dark:hover:border-indigo-500 ${className}`}
        onMouseEnter={() => setIsPopoverOpen(true)}
        onMouseLeave={() => {
          setIsPopoverOpen(false);
          setHoveredIdx(null);
        }}
        onClick={() => onSelectMetric && onSelectMetric(metricKey)}
        title={`View 10-year ${spec.label} comparison`}
      >
        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">10Y</span>

        {/* Miniature SVG Sparkline */}
        <svg
          width={width}
          height={height}
          className="overflow-visible block shrink-0"
          onMouseMove={handleMouseMove}
        >
          {zeroY !== null && (
            <line
              x1={padX}
              y1={zeroY}
              x2={width - padX}
              y2={zeroY}
              stroke="currentColor"
              strokeDasharray="2,2"
              className="text-slate-300 dark:text-slate-700 stroke-[0.8]"
            />
          )}
          <polyline
            fill="none"
            stroke="#4f46e5"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={polylineA}
          />
          <polyline
            fill="none"
            stroke="#059669"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={polylineB}
          />
        </svg>

        {/* Hover Micro-Popover */}
        {isPopoverOpen && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-52 p-2.5 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 text-xs pointer-events-none animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-100 dark:border-slate-800 text-[10px]">
              <span className="font-bold text-slate-900 dark:text-white truncate">
                {spec.label}
              </span>
              <span className="font-mono text-slate-500">{activeYear}</span>
            </div>

            <div className="space-y-1 font-mono text-[11px] tabular-nums">
              <div className="flex items-center justify-between text-indigo-700 dark:text-indigo-400">
                <span className="font-sans font-semibold text-[10px] flex items-center gap-1">
                  <span>{entityA.flag}</span>
                  <span>{entityA.shortName}:</span>
                </span>
                <span className="font-bold">{spec.formatter(activeValA)}</span>
              </div>
              <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400">
                <span className="font-sans font-semibold text-[10px] flex items-center gap-1">
                  <span>{entityB.flag}</span>
                  <span>{entityB.shortName}:</span>
                </span>
                <span className="font-bold">{spec.formatter(activeValB)}</span>
              </div>
            </div>

            <div className="mt-2 pt-1 border-t border-slate-100 dark:border-slate-800 text-[9px] text-slate-400 flex items-center justify-between">
              <span>{years[0]} → {years[years.length - 1]}</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-semibold">Hover to scrub</span>
            </div>
          </div>
        )}
      </span>
    );
  }

  // 2. COMPACT & CARD SIZES (Used in the Discussed Multi-Year Trends panel)
  return (
    <div
      className={`bg-white dark:bg-slate-900/90 rounded-xl p-3 border border-slate-200 dark:border-slate-800 transition-all hover:border-slate-300 dark:hover:border-slate-700 select-none ${className}`}
      onMouseLeave={() => setHoveredIdx(null)}
    >
      {/* Sparkline Card Header */}
      <div className="flex items-center justify-between text-xs mb-1.5">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-slate-900 dark:text-white text-[11px]">
            {spec.label}
          </span>
          <span className="text-[10px] text-slate-400 font-mono">
            ({years[0]}–{years[years.length - 1]})
          </span>
        </div>
        <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 tabular-nums">
          {activeYear}
        </span>
      </div>

      {/* SVG Canvas with Interactive Hover Scrubber */}
      <div className="relative py-1">
        <svg
          width={width}
          height={height}
          className="w-full overflow-visible block cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredIdx(null)}
        >
          {zeroY !== null && (
            <line
              x1={padX}
              y1={zeroY}
              x2={width - padX}
              y2={zeroY}
              stroke="currentColor"
              strokeDasharray="2,2"
              className="text-slate-300 dark:text-slate-700 stroke-[1]"
            />
          )}

          {/* Entity A Polyline */}
          <polyline
            fill="none"
            stroke="#4f46e5"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={polylineA}
          />

          {/* Entity B Polyline */}
          <polyline
            fill="none"
            stroke="#059669"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={polylineB}
          />

          {/* End Nodes */}
          {pointsA.length > 0 && (
            <circle
              cx={padX + (width - padX * 2)}
              cy={height - padY - ((latestA - minVal) / range) * (height - padY * 2)}
              r="2.5"
              fill="#4f46e5"
            />
          )}
          {pointsB.length > 0 && (
            <circle
              cx={padX + (width - padX * 2)}
              cy={height - padY - ((latestB - minVal) / range) * (height - padY * 2)}
              r="2.5"
              fill="#059669"
            />
          )}

          {/* Hover Scrubber Line & Highlight Dots */}
          {hoveredIdx !== null && (
            <g>
              <line
                x1={padX + (hoveredIdx / (years.length - 1)) * (width - padX * 2)}
                y1={0}
                x2={padX + (hoveredIdx / (years.length - 1)) * (width - padX * 2)}
                y2={height}
                stroke="currentColor"
                strokeDasharray="1,1"
                className="text-slate-400 dark:text-slate-500 stroke-[1]"
              />
              <circle
                cx={padX + (hoveredIdx / (years.length - 1)) * (width - padX * 2)}
                cy={height - padY - ((activeValA - minVal) / range) * (height - padY * 2)}
                r="3.5"
                fill="#4f46e5"
                stroke="#ffffff"
                strokeWidth="1.5"
              />
              <circle
                cx={padX + (hoveredIdx / (years.length - 1)) * (width - padX * 2)}
                cy={height - padY - ((activeValB - minVal) / range) * (height - padY * 2)}
                r="3.5"
                fill="#059669"
                stroke="#ffffff"
                strokeWidth="1.5"
              />
            </g>
          )}
        </svg>
      </div>

      {/* Value Comparison & Shift Footer */}
      <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-2 gap-2 text-[11px] font-mono tabular-nums">
        <div className="text-indigo-700 dark:text-indigo-400 flex items-center justify-between">
          <span className="font-sans font-medium text-[10px] text-slate-500 flex items-center gap-1">
            <span>{entityA.flag}</span>
            <span>{entityA.shortName}</span>
          </span>
          <span className="font-bold">{spec.formatter(activeValA)}</span>
        </div>

        <div className="text-emerald-700 dark:text-emerald-400 flex items-center justify-between">
          <span className="font-sans font-medium text-[10px] text-slate-500 flex items-center gap-1">
            <span>{entityB.flag}</span>
            <span>{entityB.shortName}</span>
          </span>
          <span className="font-bold">{spec.formatter(activeValB)}</span>
        </div>
      </div>

      {/* Net 10-Year Trend Shift Indicator */}
      <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-50 dark:border-slate-800/50">
        <span className="flex items-center gap-1">
          <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{entityA.shortName}:</span>
          <span className={deltaA >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
            {deltaA >= 0 ? '+' : ''}{spec.formatter(deltaA)}
          </span>
        </span>
        <span className="flex items-center gap-1">
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{entityB.shortName}:</span>
          <span className={deltaB >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
            {deltaB >= 0 ? '+' : ''}{spec.formatter(deltaB)}
          </span>
        </span>
      </div>
    </div>
  );
}
