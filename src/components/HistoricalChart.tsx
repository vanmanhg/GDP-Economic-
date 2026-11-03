import { useState, useMemo } from 'react';
import {
  Calendar,
  Landmark,
  Banknote,
  Globe,
  SlidersHorizontal,
  Flame,
  Sparkles,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Info,
  Clock,
  Layers,
  BarChart2,
  Download,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { EconomicEntity, MilestoneCategory, EconomicMilestone } from '../types';
import { formatCurrency } from '../utils/formatters';
import {
  getRelevantMilestones,
  getMilestonesForYear,
} from '../data/milestonesData';
import {
  getExtendedHistory,
  filterHistoryByRange,
  HistoricalTimeRange,
  HistoricalMetricKey,
  HISTORICAL_METRIC_SPECS,
  ExtendedHistoricalPoint,
} from '../data/historicalExtendedData';
import { useTheme } from '../context/ThemeContext';
import { downloadHistoricalChartPng } from '../utils/exportChartPng';

interface HistoricalChartProps {
  entityA: EconomicEntity;
  entityB: EconomicEntity;
  sharedHoveredYear?: number | null;
  onHoverYear?: (year: number | null) => void;
}

export function HistoricalChart({
  entityA,
  entityB,
  sharedHoveredYear,
  onHoverYear,
}: HistoricalChartProps) {
  const { isDarkMode } = useTheme();
  const [timeRange, setTimeRange] = useState<HistoricalTimeRange>('10y');
  const [metricKey, setMetricKey] = useState<HistoricalMetricKey>('nominalGdp');
  const [hoveredYear, setHoveredYear] = useState<number | null>(null);
  const [pinnedYear, setPinnedYear] = useState<number | null>(null);
  const [showAnnotations, setShowAnnotations] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<MilestoneCategory | 'all'>('all');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportSuccess, setExportSuccess] = useState<boolean>(false);

  const historyA = useMemo(() => getExtendedHistory(entityA), [entityA]);
  const historyB = useMemo(() => getExtendedHistory(entityB), [entityB]);

  const filteredA = useMemo(() => filterHistoryByRange(historyA, timeRange), [historyA, timeRange]);
  const filteredB = useMemo(() => filterHistoryByRange(historyB, timeRange), [historyB, timeRange]);

  const years = useMemo(() => filteredA.map((p) => p.year), [filteredA]);

  // Active year priority: effectiveHoveredYear > pinnedYear > last year in range
  const effectiveHoveredYear = sharedHoveredYear !== undefined ? sharedHoveredYear : hoveredYear;
  const activeYear = effectiveHoveredYear ?? pinnedYear ?? years[years.length - 1] ?? 2024;

  const metricSpec = HISTORICAL_METRIC_SPECS[metricKey];

  // Retrieve relevant milestones for the pair
  const allMilestones = useMemo(() => {
    return getRelevantMilestones(entityA, entityB, selectedCategory);
  }, [entityA, entityB, selectedCategory]);

  const milestonesByYear = useMemo(() => {
    const map = new Map<number, EconomicMilestone[]>();
    for (const m of allMilestones) {
      if (years.includes(m.year)) {
        const existing = map.get(m.year) || [];
        existing.push(m);
        map.set(m.year, existing);
      }
    }
    return map;
  }, [allMilestones, years]);

  // Transform series data based on chosen metric
  const seriesData = useMemo(() => {
    const baseA = filteredA[0] || { nominalGdp: 1, gdpPerCapita: 1 };
    const baseB = filteredB[0] || { nominalGdp: 1, gdpPerCapita: 1 };

    return years.map((year, idx) => {
      const ptA = filteredA[idx] || {
        nominalGdp: 0,
        gdpPerCapita: 0,
        gdpGrowthRate: 0,
        inflationRate: 0,
        publicDebtToGdp: 0,
      };
      const ptB = filteredB[idx] || {
        nominalGdp: 0,
        gdpPerCapita: 0,
        gdpGrowthRate: 0,
        inflationRate: 0,
        publicDebtToGdp: 0,
      };

      let valA = 0;
      let valB = 0;

      switch (metricKey) {
        case 'nominalGdp':
          valA = ptA.nominalGdp;
          valB = ptB.nominalGdp;
          break;
        case 'gdpPerCapita':
          valA = ptA.gdpPerCapita;
          valB = ptB.gdpPerCapita;
          break;
        case 'gdpGrowthRate':
          valA = ptA.gdpGrowthRate;
          valB = ptB.gdpGrowthRate;
          break;
        case 'inflationRate':
          valA = ptA.inflationRate;
          valB = ptB.inflationRate;
          break;
        case 'publicDebtToGdp':
          valA = ptA.publicDebtToGdp;
          valB = ptB.publicDebtToGdp;
          break;
        case 'growthIndex':
          valA = baseA.nominalGdp > 0 ? (ptA.nominalGdp / baseA.nominalGdp) * 100 : 100;
          valB = baseB.nominalGdp > 0 ? (ptB.nominalGdp / baseB.nominalGdp) * 100 : 100;
          break;
      }

      const yearMilestones = milestonesByYear.get(year) || [];

      return {
        year,
        valA,
        valB,
        nominalGdpA: ptA.nominalGdp,
        nominalGdpB: ptB.nominalGdp,
        rawA: ptA,
        rawB: ptB,
        milestones: yearMilestones,
      };
    });
  }, [years, filteredA, filteredB, metricKey, milestonesByYear]);

  // Min and Max for SVG scaling
  const { minVal, maxVal } = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    seriesData.forEach((d) => {
      if (d.valA < min) min = d.valA;
      if (d.valB < min) min = d.valB;
      if (d.valA > max) max = d.valA;
      if (d.valB > max) max = d.valB;
    });

    if (metricKey === 'gdpGrowthRate') {
      // Allow negative values for growth recessions
      const floor = Math.floor(Math.min(min, -1));
      const ceil = Math.ceil(Math.max(max, 6));
      return { minVal: floor, maxVal: ceil };
    }

    if (metricKey === 'inflationRate') {
      const floor = Math.floor(Math.min(min, 0));
      const ceil = Math.ceil(Math.max(max, 5));
      return { minVal: floor, maxVal: ceil };
    }

    if (min === Infinity) return { minVal: 0, maxVal: 100 };
    // Provide a 10% breathing room on top
    const padding = (max - Math.max(0, min)) * 0.12;
    return { minVal: Math.max(0, min - padding), maxVal: max + padding };
  }, [seriesData, metricKey]);

  // SVG Chart Geometry
  const chartWidth = 760;
  const chartHeight = 280;
  const padLeft = 68;
  const padRight = 36;
  const padTop = 28;
  const padBottom = 38;

  const innerWidth = chartWidth - padLeft - padRight;
  const innerHeight = chartHeight - padTop - padBottom;

  const getY = (val: number) => {
    if (maxVal === minVal) return padTop + innerHeight / 2;
    const ratio = (val - minVal) / (maxVal - minVal);
    return padTop + innerHeight - ratio * innerHeight;
  };

  const getX = (idx: number) => {
    if (seriesData.length <= 1) return padLeft + innerWidth / 2;
    return padLeft + (idx / (seriesData.length - 1)) * innerWidth;
  };

  // Build SVG Path strings
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

  const areaA = useMemo(() => {
    if (seriesData.length === 0) return '';
    const bottomY = padTop + innerHeight;
    const startX = getX(0).toFixed(1);
    const endX = getX(seriesData.length - 1).toFixed(1);
    return `${pathA} L ${endX} ${bottomY} L ${startX} ${bottomY} Z`;
  }, [pathA, seriesData, innerHeight]);

  const areaB = useMemo(() => {
    if (seriesData.length === 0) return '';
    const bottomY = padTop + innerHeight;
    const startX = getX(0).toFixed(1);
    const endX = getX(seriesData.length - 1).toFixed(1);
    return `${pathB} L ${endX} ${bottomY} L ${startX} ${bottomY} Z`;
  }, [pathB, seriesData, innerHeight]);

  // Current active data snapshot
  const activeData = useMemo(() => {
    return seriesData.find((d) => d.year === activeYear) || seriesData[seriesData.length - 1];
  }, [seriesData, activeYear]);

  // Summary statistics calculation
  const stats = useMemo(() => {
    if (seriesData.length < 2) return null;
    const first = seriesData[0];
    const last = seriesData[seriesData.length - 1];
    const nYears = last.year - first.year;

    const totalGrowthA = first.valA > 0 ? ((last.valA - first.valA) / first.valA) * 100 : 0;
    const totalGrowthB = first.valB > 0 ? ((last.valB - first.valB) / first.valB) * 100 : 0;

    const cagrA = nYears > 0 && first.valA > 0 ? (Math.pow(last.valA / first.valA, 1 / nYears) - 1) * 100 : 0;
    const cagrB = nYears > 0 && first.valB > 0 ? (Math.pow(last.valB / first.valB, 1 / nYears) - 1) * 100 : 0;

    return {
      totalGrowthA,
      totalGrowthB,
      cagrA,
      cagrB,
      startYear: first.year,
      endYear: last.year,
      nYears,
    };
  }, [seriesData]);

  // Y-Axis tick increments (5 ticks)
  const yTicks = useMemo(() => {
    const ticks = [];
    const count = 5;
    for (let i = 0; i < count; i++) {
      const v = minVal + (i / (count - 1)) * (maxVal - minVal);
      ticks.push(v);
    }
    return ticks;
  }, [minVal, maxVal]);

  const handleDownloadPng = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      await downloadHistoricalChartPng({
        entityA,
        entityB,
        metricKey,
        metricLabel: metricSpec.label,
        metricFormatter: metricSpec.formatter,
        timeRange,
        seriesData,
        activeYear,
        stats,
        isDarkMode,
      });
      setExportSuccess(true);
      setTimeout(() => {
        setExportSuccess(false);
      }, 2500);
    } catch (err) {
      console.error('Failed to export historical chart PNG:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div
      id="historical-trajectory-card"
      className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition-colors"
    >
      {/* Card Header & Controls */}
      <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>Historical Economic Trajectory & Multi-Year Trends</span>
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              {timeRange === '5y' ? '5-Year' : timeRange === '10y' ? '10-Year' : '20-Year'} Horizon
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Visualize historical trends, crises, and compound growth across selected time horizons for {entityA.shortName} and {entityB.shortName}.
          </p>
        </div>

        {/* Top Controls: Time Horizon & Metric Selector & PNG Download */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          {/* Time Range Selector */}
          <div
            id="time-range-toggle"
            role="group"
            aria-label="Time horizon selector"
            className="inline-flex items-center p-1 bg-slate-200/70 dark:bg-slate-800 rounded-lg border border-slate-300/80 dark:border-slate-700 text-xs shadow-2xs"
          >
            <button
              id="time-range-5y"
              onClick={() => setTimeRange('5y')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                timeRange === '5y'
                  ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              5Y (2020-24)
            </button>
            <button
              id="time-range-10y"
              onClick={() => setTimeRange('10y')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                timeRange === '10y'
                  ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              10Y (2015-24)
            </button>
            <button
              id="time-range-20y"
              onClick={() => setTimeRange('20y')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                timeRange === '20y'
                  ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              20Y (2005-24)
            </button>
          </div>

          {/* Metric Selector Dropdown */}
          <div className="flex items-center space-x-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs shadow-2xs">
            <span className="text-slate-400 dark:text-slate-500 font-semibold text-2xs hidden sm:inline">
              Indicator:
            </span>
            <select
              id="historical-metric-selector"
              value={metricKey}
              onChange={(e) => setMetricKey(e.target.value as HistoricalMetricKey)}
              className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-hidden cursor-pointer"
            >
              <option value="nominalGdp">Nominal GDP ($B)</option>
              <option value="gdpPerCapita">GDP Per Capita ($)</option>
              <option value="gdpGrowthRate">Real Growth Rate (%)</option>
              <option value="inflationRate">Inflation Rate (%)</option>
              <option value="publicDebtToGdp">Public Debt-to-GDP (%)</option>
              <option value="growthIndex">Indexed Growth (Base 100)</option>
            </select>
          </div>

          {/* Download PNG Button */}
          <button
            id="download-historical-chart-png-btn"
            onClick={handleDownloadPng}
            disabled={isExporting}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg border shadow-2xs flex items-center space-x-1.5 transition-all cursor-pointer disabled:opacity-50 ${
              exportSuccess
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                : 'bg-white dark:bg-slate-800 hover:bg-slate-100 hover:dark:bg-slate-700/80 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
            }`}
            title="Download high-resolution PNG image of this historical trajectory visualization"
            aria-label="Download Historical Chart as High-Resolution PNG"
          >
            {isExporting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600 dark:text-indigo-400" />
                <span>Exporting...</span>
              </>
            ) : exportSuccess ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Downloaded!</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span>Download PNG</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Trajectory Summary Scorecards */}
      {stats && (
        <div className="p-4 bg-slate-50/70 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-800 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700">
            <span className="text-3xs uppercase tracking-wider text-slate-400 dark:text-slate-400 font-bold block mb-1">
              {entityA.shortName} Cumulative Growth
            </span>
            <p className="text-sm font-black text-indigo-600 dark:text-indigo-400">
              {stats.totalGrowthA >= 0 ? '+' : ''}
              {stats.totalGrowthA.toFixed(1)}%
            </p>
            <span className="text-3xs text-slate-400 font-mono mt-0.5 block">
              CAGR: {stats.cagrA >= 0 ? '+' : ''}{stats.cagrA.toFixed(1)}% / yr
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700">
            <span className="text-3xs uppercase tracking-wider text-slate-400 dark:text-slate-400 font-bold block mb-1">
              {entityB.shortName} Cumulative Growth
            </span>
            <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">
              {stats.totalGrowthB >= 0 ? '+' : ''}
              {stats.totalGrowthB.toFixed(1)}%
            </p>
            <span className="text-3xs text-slate-400 font-mono mt-0.5 block">
              CAGR: {stats.cagrB >= 0 ? '+' : ''}{stats.cagrB.toFixed(1)}% / yr
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700">
            <span className="text-3xs uppercase tracking-wider text-slate-400 dark:text-slate-400 font-bold block mb-1">
              Active Focus Year
            </span>
            <p className="text-sm font-black text-slate-800 dark:text-slate-100">
              {activeYear}
            </p>
            <span className="text-3xs text-slate-400 font-mono mt-0.5 block">
              Hover/scrub graph to compare
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700">
            <span className="text-3xs uppercase tracking-wider text-slate-400 dark:text-slate-400 font-bold block mb-1">
              Spread in {activeYear}
            </span>
            {activeData && (
              <p className="text-sm font-black text-slate-900 dark:text-slate-100">
                {activeData.valA >= activeData.valB
                  ? `${entityA.shortName} +${metricSpec.formatter(activeData.valA - activeData.valB)}`
                  : `${entityB.shortName} +${metricSpec.formatter(activeData.valB - activeData.valA)}`}
              </p>
            )}
            <span className="text-3xs text-slate-400 font-mono mt-0.5 block truncate">
              {metricSpec.label} benchmark
            </span>
          </div>
        </div>
      )}

      {/* SVG Interactive Line Graph */}
      <div className="p-4 sm:p-5 relative select-none">
        <div className="w-full overflow-x-auto">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full h-auto max-h-[340px] overflow-visible"
          >
            <defs>
              <linearGradient id="gradAreaA" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4f46e5" stopOpacity={isDarkMode ? '0.25' : '0.18'} />
                <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="gradAreaB" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#059669" stopOpacity={isDarkMode ? '0.25' : '0.18'} />
                <stop offset="100%" stopColor="#059669" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid Lines */}
            {yTicks.map((tickVal, i) => {
              const y = getY(tickVal);
              return (
                <g key={i}>
                  <line
                    x1={padLeft}
                    y1={y}
                    x2={padLeft + innerWidth}
                    y2={y}
                    stroke={isDarkMode ? '#334155' : '#e2e8f0'}
                    strokeDasharray="4 4"
                    strokeWidth="1"
                  />
                  <text
                    x={padLeft - 8}
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

            {/* Zero Axis Reference Line (if applicable) */}
            {minVal < 0 && maxVal > 0 && (
              <line
                x1={padLeft}
                y1={getY(0)}
                x2={padLeft + innerWidth}
                y2={getY(0)}
                stroke={isDarkMode ? '#f43f5e' : '#e11d48'}
                strokeWidth="1.5"
                strokeDasharray="2 2"
              />
            )}

            {/* Area Fills */}
            <path d={areaA} fill="url(#gradAreaA)" />
            <path d={areaB} fill="url(#gradAreaB)" />

            {/* Line Paths */}
            <path
              d={pathA}
              fill="none"
              stroke="#4f46e5"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d={pathB}
              fill="none"
              stroke="#059669"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Active Year Vertical Scrubbing Crosshair */}
            {activeData && (
              <g>
                <line
                  x1={getX(years.indexOf(activeYear))}
                  y1={padTop}
                  x2={getX(years.indexOf(activeYear))}
                  y2={padTop + innerHeight}
                  stroke={isDarkMode ? '#818cf8' : '#6366f1'}
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                />

                {/* Point A */}
                <circle
                  cx={getX(years.indexOf(activeYear))}
                  cy={getY(activeData.valA)}
                  r="5.5"
                  fill="#4f46e5"
                  stroke="#ffffff"
                  strokeWidth="2"
                  className="animate-pulse"
                />

                {/* Point B */}
                <circle
                  cx={getX(years.indexOf(activeYear))}
                  cy={getY(activeData.valB)}
                  r="5.5"
                  fill="#059669"
                  stroke="#ffffff"
                  strokeWidth="2"
                  className="animate-pulse"
                />
              </g>
            )}

            {/* Year Labels and Hover Scrubbing Nodes */}
            {seriesData.map((d, i) => {
              const x = getX(i);
              const isCurrent = d.year === activeYear;
              const hasMilestone = d.milestones.length > 0;

              return (
                <g
                  key={d.year}
                  className="cursor-pointer group"
                  onClick={() => setPinnedYear(d.year)}
                  onMouseEnter={() => {
                    setHoveredYear(d.year);
                    onHoverYear?.(d.year);
                  }}
                  onMouseLeave={() => {
                    setHoveredYear(null);
                    onHoverYear?.(null);
                  }}
                >
                  {/* Invisible hit area */}
                  <rect
                    x={x - (innerWidth / (seriesData.length - 1)) / 2}
                    y={padTop}
                    width={innerWidth / (seriesData.length - 1)}
                    height={innerHeight + padBottom}
                    fill="transparent"
                  />

                  {/* Node Dots on both lines */}
                  <circle
                    cx={x}
                    cy={getY(d.valA)}
                    r={isCurrent ? '4.5' : '3'}
                    fill={isCurrent ? '#4f46e5' : '#818cf8'}
                    opacity={isCurrent ? '1' : '0.7'}
                  />
                  <circle
                    cx={x}
                    cy={getY(d.valB)}
                    r={isCurrent ? '4.5' : '3'}
                    fill={isCurrent ? '#059669' : '#34d399'}
                    opacity={isCurrent ? '1' : '0.7'}
                  />

                  {/* Milestone Marker Badge on top */}
                  {hasMilestone && (
                    <circle
                      cx={x}
                      cy={padTop - 8}
                      r="3.5"
                      fill="#f59e0b"
                      stroke="#ffffff"
                      strokeWidth="1"
                    />
                  )}

                  {/* X-axis year text */}
                  <text
                    x={x}
                    y={padTop + innerHeight + 18}
                    textAnchor="middle"
                    fill={isCurrent ? '#4f46e5' : isDarkMode ? '#94a3b8' : '#64748b'}
                    fontWeight={isCurrent ? 'bold' : 'normal'}
                    fontSize={isCurrent ? '11' : '9.5'}
                    fontFamily="monospace"
                  >
                    {d.year}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Legend & Details Dock */}
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Legend Items */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-full bg-indigo-600"></span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {entityA.name}
              </span>
              <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold ml-1">
                {activeData ? metricSpec.formatter(activeData.valA) : ''}
              </span>
            </div>

            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-600"></span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {entityB.name}
              </span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold ml-1">
                {activeData ? metricSpec.formatter(activeData.valB) : ''}
              </span>
            </div>
          </div>

          {/* Milestone indicator indicator */}
          <div className="flex items-center space-x-1.5 text-2xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
            <span>Historical Policy & Crisis Milestones</span>
          </div>
        </div>

        {/* Active Year Milestone Card (if available for that year) */}
        {activeData && activeData.milestones.length > 0 && (
          <div className="mt-3 p-3 rounded-lg bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 text-2xs animate-in fade-in duration-150">
            <div className="flex items-center space-x-1.5 text-amber-800 dark:text-amber-300 font-bold mb-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Historical Events & Milestone Shocks in {activeYear}:</span>
            </div>
            <div className="space-y-1.5">
              {activeData.milestones.map((m) => (
                <div key={m.id} className="text-slate-700 dark:text-slate-300 leading-tight">
                  <strong className="text-amber-900 dark:text-amber-200">{m.title}:</strong>{' '}
                  {m.description}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
