import { useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Sparkles,
  ExternalLink,
  Landmark,
  Scale,
  Percent,
  Coins,
  DollarSign,
  ArrowRight,
} from 'lucide-react';
import { EconomicEntity, ChartColorPalette } from '../types';
import {
  HistoricalMetricKey,
  HISTORICAL_METRIC_SPECS,
} from '../data/historicalExtendedData';

interface SynchronizedIndicatorGridProps {
  entityA: EconomicEntity;
  entityB: EconomicEntity;
  entityC: EconomicEntity | null;
  filteredA: any[];
  filteredB: any[];
  filteredC: any[] | null;
  years: number[];
  activeYear: number;
  onHoverYear: (year: number | null) => void;
  themePalette: ChartColorPalette;
  isDarkMode: boolean;
  onSelectMetric: (metric: HistoricalMetricKey) => void;
}

const SYNC_INDICATORS: Array<{
  key: HistoricalMetricKey;
  icon: any;
  title: string;
  category: string;
}> = [
  {
    key: 'nominalGdp',
    icon: Coins,
    title: 'Gross Domestic Product (Nominal)',
    category: 'Productivity & Scale',
  },
  {
    key: 'inflationRate',
    icon: TrendingUp,
    title: 'Inflation Rate (Consumer Prices)',
    category: 'Price Stability',
  },
  {
    key: 'unemploymentRate',
    icon: Percent,
    title: 'Unemployment Rate (% of Labor Force)',
    category: 'Labor Market Health',
  },
  {
    key: 'publicDebtToGdp',
    icon: Landmark,
    title: 'Public Debt-to-GDP Ratio',
    category: 'Fiscal Solvency',
  },
];

export function SynchronizedIndicatorGrid({
  entityA,
  entityB,
  entityC,
  filteredA,
  filteredB,
  filteredC,
  years,
  activeYear,
  onHoverYear,
  themePalette,
  isDarkMode,
  onSelectMetric,
}: SynchronizedIndicatorGridProps) {
  // Chart dimensions for mini-indicator SVGs
  const svgWidth = 460;
  const svgHeight = 155;
  const padLeft = 45;
  const padRight = 18;
  const padTop = 16;
  const padBottom = 26;
  const innerWidth = svgWidth - padLeft - padRight;
  const innerHeight = svgHeight - padTop - padBottom;

  const activeIndex = useMemo(() => {
    const idx = years.indexOf(activeYear);
    return idx >= 0 ? idx : years.length - 1;
  }, [years, activeYear]);

  return (
    <div className="space-y-4 select-none">
      {/* Synchronization Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-indigo-50/70 dark:bg-indigo-950/40 rounded-xl border border-indigo-100 dark:border-indigo-900/60 text-xs text-indigo-900 dark:text-indigo-200">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <span className="font-semibold">
            Cross-Chart Synchronized Hover Active: Tracking Year{' '}
            <span className="font-black font-mono text-indigo-600 dark:text-indigo-300 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
              {activeYear}
            </span>{' '}
            across all 4 economic indicators simultaneously.
          </span>
        </div>
        <div className="flex items-center space-x-2 shrink-0 text-2xs text-slate-500 dark:text-slate-400">
          <span>Palette: {themePalette.name}</span>
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: themePalette.colorA }}></span>
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: themePalette.colorB }}></span>
        </div>
      </div>

      {/* 2x2 Grid of Synchronized Indicator Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SYNC_INDICATORS.map((ind) => {
          const spec = HISTORICAL_METRIC_SPECS[ind.key];
          const Icon = ind.icon;

          // Series values for this indicator
          const series = years.map((yr, idx) => {
            const rawA = filteredA[idx]?.[ind.key] ?? 0;
            const rawB = filteredB[idx]?.[ind.key] ?? 0;
            const rawC = filteredC ? filteredC[idx]?.[ind.key] : undefined;
            return { year: yr, valA: rawA, valB: rawB, valC: rawC };
          });

          // Min & Max calculations
          const allVals = series.flatMap((d) => [d.valA, d.valB, ...(d.valC !== undefined ? [d.valC] : [])]);
          const minRaw = Math.min(...allVals);
          const maxRaw = Math.max(...allVals);
          const padding = (maxRaw - minRaw) * 0.12 || 1;
          const minVal = Math.min(0, minRaw - padding);
          const maxVal = maxRaw + padding;

          const getX = (idx: number) => padLeft + (idx / Math.max(1, years.length - 1)) * innerWidth;
          const getY = (val: number) => {
            const range = maxVal - minVal || 1;
            const ratio = (val - minVal) / range;
            return padTop + innerHeight - ratio * innerHeight;
          };

          const pathA = series
            .map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(d.valA).toFixed(1)}`)
            .join(' ');

          const pathB = series
            .map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(d.valB).toFixed(1)}`)
            .join(' ');

          const pathC =
            entityC && series.every((d) => d.valC !== undefined)
              ? series
                  .map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(d.valC!).toFixed(1)}`)
                  .join(' ')
              : '';

          // Area fills
          const bottomY = padTop + innerHeight;
          const startX = getX(0).toFixed(1);
          const endX = getX(series.length - 1).toFixed(1);
          const areaA = `${pathA} L ${endX} ${bottomY} L ${startX} ${bottomY} Z`;
          const areaB = `${pathB} L ${endX} ${bottomY} L ${startX} ${bottomY} Z`;

          const activePt = series[activeIndex] || series[series.length - 1];
          const activeX = getX(activeIndex);

          // Unique gradient IDs
          const gradIdA = `sync-grad-a-${ind.key}`;
          const gradIdB = `sync-grad-b-${ind.key}`;

          return (
            <div
              key={ind.key}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all flex flex-col justify-between shadow-2xs group"
            >
              {/* Card Header: Indicator Title & Value at Active Year */}
              <div>
                <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center space-x-2">
                    <span className="p-1 rounded-md bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400">
                      <Icon className="w-3.5 h-3.5" />
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">
                        {ind.title}
                      </h4>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {spec.unit} • {ind.category}
                      </span>
                    </div>
                  </div>

                  {/* Button to drill into deep single-indicator view */}
                  <button
                    onClick={() => onSelectMetric(ind.key)}
                    className="p-1 rounded text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title={`Focus exclusively on ${spec.label}`}
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Values Readout for Active Year */}
                <div className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-slate-50 dark:bg-slate-800/80 mb-2 font-mono">
                  <div className="flex items-center space-x-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: themePalette.colorA }}
                    ></span>
                    <span className="text-slate-600 dark:text-slate-300 font-medium">
                      {entityA.shortName}:
                    </span>
                    <span className="font-bold" style={{ color: themePalette.colorA }}>
                      {spec.formatter(activePt.valA)}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: themePalette.colorB }}
                    ></span>
                    <span className="text-slate-600 dark:text-slate-300 font-medium">
                      {entityB.shortName}:
                    </span>
                    <span className="font-bold" style={{ color: themePalette.colorB }}>
                      {spec.formatter(activePt.valB)}
                    </span>
                  </div>

                  {entityC && activePt.valC !== undefined && (
                    <div className="flex items-center space-x-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: themePalette.colorC }}
                      ></span>
                      <span className="text-slate-600 dark:text-slate-300 font-medium">
                        {entityC.shortName}:
                      </span>
                      <span className="font-bold" style={{ color: themePalette.colorC }}>
                        {spec.formatter(activePt.valC)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Mini SVG Chart with Cross-Chart Synchronized Hovering */}
              <div
                className="w-full relative"
                onMouseLeave={() => onHoverYear(null)}
              >
                <svg
                  viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                  className="w-full h-auto overflow-visible cursor-crosshair"
                >
                  <defs>
                    <linearGradient id={gradIdA} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={themePalette.colorA} stopOpacity="0.22" />
                      <stop offset="100%" stopColor={themePalette.colorA} stopOpacity="0.0" />
                    </linearGradient>
                    <linearGradient id={gradIdB} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={themePalette.colorB} stopOpacity="0.22" />
                      <stop offset="100%" stopColor={themePalette.colorB} stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Guideline */}
                  <line
                    x1={padLeft}
                    y1={padTop + innerHeight / 2}
                    x2={padLeft + innerWidth}
                    y2={padTop + innerHeight / 2}
                    stroke={isDarkMode ? '#334155' : '#e2e8f0'}
                    strokeDasharray="3 3"
                    strokeWidth="1"
                  />

                  {/* Zero axis if present */}
                  {minVal < 0 && maxVal > 0 && (
                    <line
                      x1={padLeft}
                      y1={getY(0)}
                      x2={padLeft + innerWidth}
                      y2={getY(0)}
                      stroke={isDarkMode ? '#f43f5e' : '#e11d48'}
                      strokeDasharray="2 2"
                      strokeWidth="1.2"
                    />
                  )}

                  {/* Area Fills */}
                  <path d={areaA} fill={`url(#${gradIdA})`} />
                  <path d={areaB} fill={`url(#${gradIdB})`} />

                  {/* Trend Lines */}
                  <path
                    d={pathA}
                    fill="none"
                    stroke={themePalette.colorA}
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d={pathB}
                    fill="none"
                    stroke={themePalette.colorB}
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {entityC && pathC && (
                    <path
                      d={pathC}
                      fill="none"
                      stroke={themePalette.colorC}
                      strokeWidth="2"
                      strokeDasharray="5 3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}

                  {/* Synchronized Vertical Crosshair cursor line across all charts */}
                  <line
                    x1={activeX}
                    y1={padTop}
                    x2={activeX}
                    y2={padTop + innerHeight}
                    stroke={isDarkMode ? '#818cf8' : '#6366f1'}
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                    className="transition-all duration-100 ease-out"
                  />

                  {/* Synchronized Highlight Node Dots */}
                  <circle
                    cx={activeX}
                    cy={getY(activePt.valA)}
                    r="5"
                    fill={themePalette.colorA}
                    stroke="#ffffff"
                    strokeWidth="2"
                    className="transition-all duration-100 ease-out animate-pulse"
                  />
                  <circle
                    cx={activeX}
                    cy={getY(activePt.valB)}
                    r="5"
                    fill={themePalette.colorB}
                    stroke="#ffffff"
                    strokeWidth="2"
                    className="transition-all duration-100 ease-out animate-pulse"
                  />
                  {entityC && activePt.valC !== undefined && (
                    <circle
                      cx={activeX}
                      cy={getY(activePt.valC)}
                      r="5"
                      fill={themePalette.colorC}
                      stroke="#ffffff"
                      strokeWidth="2"
                      className="transition-all duration-100 ease-out animate-pulse"
                    />
                  )}

                  {/* Transparent hover scrub blocks for each year */}
                  {series.map((d, i) => {
                    const x = getX(i);
                    const colWidth = innerWidth / Math.max(1, series.length - 1);
                    return (
                      <rect
                        key={d.year}
                        x={x - colWidth / 2}
                        y={padTop}
                        width={colWidth}
                        height={innerHeight + padBottom}
                        fill="transparent"
                        className="cursor-pointer"
                        onMouseEnter={() => onHoverYear(d.year)}
                        onClick={() => onSelectMetric(ind.key)}
                      />
                    );
                  })}

                  {/* X Axis year labels */}
                  {years.map((yr, idx) => {
                    if (idx % Math.ceil(years.length / 5) !== 0 && idx !== years.length - 1) {
                      return null;
                    }
                    const x = getX(idx);
                    const isCur = yr === activeYear;
                    return (
                      <text
                        key={yr}
                        x={x}
                        y={padTop + innerHeight + 16}
                        textAnchor="middle"
                        fill={isCur ? themePalette.colorA : isDarkMode ? '#94a3b8' : '#64748b'}
                        fontWeight={isCur ? 'bold' : 'normal'}
                        fontSize="9.5"
                        fontFamily="monospace"
                      >
                        {yr}
                      </text>
                    );
                  })}
                </svg>
              </div>

              {/* Card Footer: Lead & Deep inspection trigger */}
              <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-2xs text-slate-500">
                <span>
                  {activePt.valA >= activePt.valB
                    ? `${entityA.shortName} +${spec.formatter(activePt.valA - activePt.valB)}`
                    : `${entityB.shortName} +${spec.formatter(activePt.valB - activePt.valA)}`}
                </span>
                <button
                  onClick={() => onSelectMetric(ind.key)}
                  className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold inline-flex items-center space-x-1 cursor-pointer"
                >
                  <span>Full Milestones</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ChevronRight(props: any) {
  return (
    <svg
      {...props}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
