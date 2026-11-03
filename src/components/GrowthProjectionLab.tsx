import { useState, useMemo } from 'react';
import {
  TrendingUp,
  Sparkles,
  SlidersHorizontal,
  RotateCcw,
  BarChart2,
  Calendar,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Zap,
  Info,
  DollarSign,
  Maximize2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { EconomicEntity } from '../types';
import { formatCurrency } from '../utils/formatters';
import { useTheme } from '../context/ThemeContext';

interface GrowthProjectionLabProps {
  entityA: EconomicEntity;
  entityB: EconomicEntity;
}

type ProjectionMetricMode = 'nominal' | 'perCapita' | 'index' | 'gap';
type ScenarioType = 'baseline' | 'optimistic' | 'pessimistic' | 'convergence' | 'custom';

interface YearProjection {
  year: number;
  valA: number;
  valB: number;
  perCapitaA: number;
  perCapitaB: number;
  indexA: number;
  indexB: number;
  gap: number; // valA - valB
  growthA: number;
  growthB: number;
}

export function GrowthProjectionLab({ entityA, entityB }: GrowthProjectionLabProps) {
  const { isDarkMode } = useTheme();

  // Mode and scenario state
  const [metricMode, setMetricMode] = useState<ProjectionMetricMode>('nominal');
  const [scenario, setScenario] = useState<ScenarioType>('baseline');
  const [showUncertaintyBands, setShowUncertaintyBands] = useState<boolean>(true);
  const [hoveredYear, setHoveredYear] = useState<number | null>(null);
  const [pinnedYear, setPinnedYear] = useState<number | null>(null);
  const [showYearTable, setShowYearTable] = useState<boolean>(false);

  // Custom growth rate overrides (-3% to +10%)
  const [customRateA, setCustomRateA] = useState<number>(entityA.gdpGrowthRate);
  const [customRateB, setCustomRateB] = useState<number>(entityB.gdpGrowthRate);

  // Projection horizon: 5 years (2024 base to 2029)
  const projectionYears = [2024, 2025, 2026, 2027, 2028, 2029];
  const activeYear = hoveredYear ?? pinnedYear ?? 2029;

  // Determine effective growth rates based on scenario
  const { rateA, rateB, scenarioLabel, scenarioNote } = useMemo(() => {
    switch (scenario) {
      case 'optimistic':
        return {
          rateA: Number((entityA.gdpGrowthRate + 1.8).toFixed(1)),
          rateB: Number((entityB.gdpGrowthRate + 1.8).toFixed(1)),
          scenarioLabel: 'High-Tech & Capital Surge (+1.8%)',
          scenarioNote: 'Accelerated productivity gains driven by AI commercialization, high foreign direct investment, and favorable macroeconomic policy.',
        };
      case 'pessimistic':
        return {
          rateA: Number(Math.max(-1.5, entityA.gdpGrowthRate - 1.8).toFixed(1)),
          rateB: Number(Math.max(-1.5, entityB.gdpGrowthRate - 1.8).toFixed(1)),
          scenarioLabel: 'Global Stagnation & Headwinds (-1.8%)',
          scenarioNote: 'Trade barriers, demographic aging headwinds, fiscal tightening, and stubborn borrowing cost pressures dampen annual expansion.',
        };
      case 'convergence':
        return {
          rateA: Number(Math.max(entityA.gdpGrowthRate, 3.2).toFixed(1)),
          rateB: Number(Math.max(entityB.gdpGrowthRate, 5.5).toFixed(1)),
          scenarioLabel: 'Emerging Market Catch-Up & Reform',
          scenarioNote: 'Aggressive structural supply-side reforms and infrastructure catch-up accelerate growth toward top-tier productivity.',
        };
      case 'custom':
        return {
          rateA: Number(customRateA.toFixed(1)),
          rateB: Number(customRateB.toFixed(1)),
          scenarioLabel: 'User-Defined Growth Rates',
          scenarioNote: 'Custom simulation using user-adjusted annual compounding growth rates.',
        };
      case 'baseline':
      default:
        return {
          rateA: entityA.gdpGrowthRate,
          rateB: entityB.gdpGrowthRate,
          scenarioLabel: 'Current Baseline Momentum',
          scenarioNote: 'Extrapolates recent official annual real GDP growth rates reported by national statistical accounts and the IMF.',
        };
    }
  }, [scenario, entityA.gdpGrowthRate, entityB.gdpGrowthRate, customRateA, customRateB]);

  // Compute 5-year compounding simulation series for selected scenario
  const projectionSeries: YearProjection[] = useMemo(() => {
    const list: YearProjection[] = [];

    // Population annual growth approximation (US ~0.5%, UK ~0.4%, CA ~0.3%, CN ~-0.1%, IN ~0.8%)
    const popRateA = entityA.population > 200 ? 0.005 : 0.003;
    const popRateB = entityB.population > 200 ? 0.005 : 0.003;

    let currentGdpA = entityA.nominalGdp;
    let currentGdpB = entityB.nominalGdp;
    let currentPopA = entityA.population;
    let currentPopB = entityB.population;

    const baseGdpA = entityA.nominalGdp;
    const baseGdpB = entityB.nominalGdp;

    for (const year of projectionYears) {
      if (year === 2024) {
        list.push({
          year,
          valA: baseGdpA,
          valB: baseGdpB,
          perCapitaA: entityA.gdpPerCapitaNominal,
          perCapitaB: entityB.gdpPerCapitaNominal,
          indexA: 100,
          indexB: 100,
          gap: baseGdpA - baseGdpB,
          growthA: rateA,
          growthB: rateB,
        });
      } else {
        // Compound GDP by annual rate
        currentGdpA = currentGdpA * (1 + rateA / 100);
        currentGdpB = currentGdpB * (1 + rateB / 100);
        currentPopA = currentPopA * (1 + popRateA);
        currentPopB = currentPopB * (1 + popRateB);

        const perCapitaA = (currentGdpA * 1000000000) / (currentPopA * 1000000);
        const perCapitaB = (currentGdpB * 1000000000) / (currentPopB * 1000000);

        list.push({
          year,
          valA: currentGdpA,
          valB: currentGdpB,
          perCapitaA,
          perCapitaB,
          indexA: (currentGdpA / baseGdpA) * 100,
          indexB: (currentGdpB / baseGdpB) * 100,
          gap: currentGdpA - currentGdpB,
          growthA: rateA,
          growthB: rateB,
        });
      }
    }

    return list;
  }, [projectionYears, entityA, entityB, rateA, rateB]);

  // Compute Optimistic and Pessimistic boundaries for Fan Chart Uncertainty Cone
  const fanBands = useMemo(() => {
    const optimisticA: number[] = [];
    const pessimisticA: number[] = [];
    const optimisticB: number[] = [];
    const pessimisticB: number[] = [];

    let optA = entityA.nominalGdp;
    let pessA = entityA.nominalGdp;
    let optB = entityB.nominalGdp;
    let pessB = entityB.nominalGdp;

    const optRateA = entityA.gdpGrowthRate + 2.0;
    const pessRateA = Math.max(-1.0, entityA.gdpGrowthRate - 1.8);
    const optRateB = entityB.gdpGrowthRate + 2.0;
    const pessRateB = Math.max(-1.0, entityB.gdpGrowthRate - 1.8);

    for (const year of projectionYears) {
      if (year === 2024) {
        optimisticA.push(entityA.nominalGdp);
        pessimisticA.push(entityA.nominalGdp);
        optimisticB.push(entityB.nominalGdp);
        pessimisticB.push(entityB.nominalGdp);
      } else {
        optA = optA * (1 + optRateA / 100);
        pessA = pessA * (1 + pessRateA / 100);
        optB = optB * (1 + optRateB / 100);
        pessB = pessB * (1 + pessRateB / 100);

        optimisticA.push(optA);
        pessimisticA.push(pessA);
        optimisticB.push(optB);
        pessimisticB.push(pessB);
      }
    }

    return { optimisticA, pessimisticA, optimisticB, pessimisticB };
  }, [entityA, entityB, projectionYears]);

  // Key projection summary metrics at 2029
  const summary2029 = useMemo(() => {
    const finalPt = projectionSeries[projectionSeries.length - 1];
    const initialPt = projectionSeries[0];

    const addedGdpA = finalPt.valA - initialPt.valA;
    const addedGdpB = finalPt.valB - initialPt.valB;

    const cumulativeGrowthA = ((finalPt.valA - initialPt.valA) / initialPt.valA) * 100;
    const cumulativeGrowthB = ((finalPt.valB - initialPt.valB) / initialPt.valB) * 100;

    const initialGap = Math.abs(initialPt.valA - initialPt.valB);
    const finalGap = Math.abs(finalPt.valA - finalPt.valB);
    const initialLeader = initialPt.valA >= initialPt.valB ? 'A' : 'B';
    const finalLeader = finalPt.valA >= finalPt.valB ? 'A' : 'B';

    // Crossover calculation
    let crossoverYear: number | null = null;
    if (initialLeader !== finalLeader) {
      // Overtake occurred within the 5-year window
      for (const pt of projectionSeries) {
        if ((initialLeader === 'A' && pt.valB > pt.valA) || (initialLeader === 'B' && pt.valA > pt.valB)) {
          crossoverYear = pt.year;
          break;
        }
      }
    } else if (initialLeader === 'A' && rateB > rateA && finalPt.valB < finalPt.valA) {
      // Will overtake beyond 2029
      const gdpGap = finalPt.valA - finalPt.valB;
      const rateDiff = (rateB - rateA) / 100;
      if (rateDiff > 0) {
        const yearsNeeded = Math.log(finalPt.valA / finalPt.valB) / Math.log((1 + rateB / 100) / (1 + rateA / 100));
        crossoverYear = Math.round(2029 + yearsNeeded);
      }
    } else if (initialLeader === 'B' && rateA > rateB && finalPt.valA < finalPt.valB) {
      const yearsNeeded = Math.log(finalPt.valB / finalPt.valA) / Math.log((1 + rateA / 100) / (1 + rateB / 100));
      crossoverYear = Math.round(2029 + yearsNeeded);
    }

    return {
      finalPt,
      addedGdpA,
      addedGdpB,
      cumulativeGrowthA,
      cumulativeGrowthB,
      initialGap,
      finalGap,
      initialLeader,
      finalLeader,
      crossoverYear,
    };
  }, [projectionSeries, rateA, rateB]);

  // Active year snapshot data
  const activeSnapshot = useMemo(() => {
    return projectionSeries.find((pt) => pt.year === activeYear) || projectionSeries[projectionSeries.length - 1];
  }, [projectionSeries, activeYear]);

  // SVG Chart Geometry
  const width = 800;
  const height = 360;
  const padding = { top: 35, right: 40, bottom: 45, left: 75 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Chart data extraction according to metricMode
  const chartPoints = useMemo(() => {
    return projectionSeries.map((pt, idx) => {
      let yA = pt.valA;
      let yB = pt.valB;

      if (metricMode === 'perCapita') {
        yA = pt.perCapitaA;
        yB = pt.perCapitaB;
      } else if (metricMode === 'index') {
        yA = pt.indexA;
        yB = pt.indexB;
      } else if (metricMode === 'gap') {
        yA = Math.abs(pt.gap);
        yB = 0;
      }

      return {
        year: pt.year,
        idx,
        valA: yA,
        valB: yB,
      };
    });
  }, [projectionSeries, metricMode]);

  // Determine Y-axis domain
  const { minY, maxY } = useMemo(() => {
    let vals: number[] = [];
    if (metricMode === 'gap') {
      vals = chartPoints.map((p) => p.valA);
      return { minY: 0, maxY: Math.max(...vals, 100) * 1.25 };
    }

    vals = chartPoints.flatMap((p) => [p.valA, p.valB]);
    if (showUncertaintyBands && metricMode === 'nominal') {
      vals.push(...fanBands.optimisticA, ...fanBands.optimisticB, ...fanBands.pessimisticA, ...fanBands.pessimisticB);
    }

    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const buffer = (max - min) * 0.15 || max * 0.1;
    return {
      minY: Math.max(0, min - buffer),
      maxY: max + buffer,
    };
  }, [chartPoints, metricMode, showUncertaintyBands, fanBands]);

  // Coordinate scales
  const getX = (idx: number) => padding.left + (idx / (projectionYears.length - 1)) * chartWidth;
  const getY = (val: number) => padding.top + chartHeight - ((val - minY) / (maxY - minY || 1)) * chartHeight;

  // Build SVG path strings
  const pathA = useMemo(() => {
    return chartPoints
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(p.valA)}`)
      .join(' ');
  }, [chartPoints, minY, maxY]);

  const pathB = useMemo(() => {
    if (metricMode === 'gap') return '';
    return chartPoints
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(p.valB)}`)
      .join(' ');
  }, [chartPoints, minY, maxY, metricMode]);

  // Shaded area path for Entity A
  const areaA = useMemo(() => {
    if (chartPoints.length === 0) return '';
    const baselineY = padding.top + chartHeight;
    const lineCoords = chartPoints.map((p, i) => `${getX(i)} ${getY(p.valA)}`).join(' L ');
    return `M ${getX(0)} ${baselineY} L ${lineCoords} L ${getX(chartPoints.length - 1)} ${baselineY} Z`;
  }, [chartPoints, minY, maxY]);

  // Fan band polygon for Entity A (Nominal mode only)
  const fanPolygonA = useMemo(() => {
    if (!showUncertaintyBands || metricMode !== 'nominal') return '';
    const upper = fanBands.optimisticA.map((v, i) => `${getX(i)},${getY(v)}`);
    const lower = [...fanBands.pessimisticA].reverse().map((v, i) => `${getX(projectionYears.length - 1 - i)},${getY(v)}`);
    return `M ${upper.join(' L ')} L ${lower.join(' L ')} Z`;
  }, [showUncertaintyBands, metricMode, fanBands, minY, maxY]);

  // Fan band polygon for Entity B (Nominal mode only)
  const fanPolygonB = useMemo(() => {
    if (!showUncertaintyBands || metricMode !== 'nominal') return '';
    const upper = fanBands.optimisticB.map((v, i) => `${getX(i)},${getY(v)}`);
    const lower = [...fanBands.pessimisticB].reverse().map((v, i) => `${getX(projectionYears.length - 1 - i)},${getY(v)}`);
    return `M ${upper.join(' L ')} L ${lower.join(' L ')} Z`;
  }, [showUncertaintyBands, metricMode, fanBands, minY, maxY]);

  // Format axis tick labels
  const formatYTick = (val: number) => {
    if (metricMode === 'nominal' || metricMode === 'gap') {
      if (val >= 1000) return `$${(val / 1000).toFixed(1)}T`;
      return `$${Math.round(val)}B`;
    }
    if (metricMode === 'perCapita') {
      return `$${Math.round(val).toLocaleString()}`;
    }
    return `${Math.round(val)}`;
  };

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((pct) => minY + pct * (maxY - minY));

  return (
    <div
      id="growth-projection-lab-card"
      className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition-colors"
    >
      {/* Top Header */}
      <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              5-Year Macroeconomic Growth Projection Simulator
            </h3>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              2024 – 2029 Horizon
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Simulate and contrast forward-looking economic expansion trajectories, compounding trajectories, and potential crossover milestones.
          </p>
        </div>

        {/* Metric Mode Switcher */}
        <div
          id="projection-metric-switcher"
          role="group"
          aria-label="Projection metric"
          className="inline-flex items-center p-1 bg-slate-200/70 dark:bg-slate-800 rounded-lg border border-slate-300/80 dark:border-slate-700 text-xs shadow-2xs self-start md:self-auto overflow-x-auto"
        >
          <button
            onClick={() => setMetricMode('nominal')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer whitespace-nowrap ${
              metricMode === 'nominal'
                ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-2xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Nominal GDP ($B)
          </button>
          <button
            onClick={() => setMetricMode('perCapita')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer whitespace-nowrap ${
              metricMode === 'perCapita'
                ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-2xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Per Capita ($)
          </button>
          <button
            onClick={() => setMetricMode('index')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer whitespace-nowrap ${
              metricMode === 'index'
                ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-2xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Index (2024=100)
          </button>
          <button
            onClick={() => setMetricMode('gap')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer whitespace-nowrap ${
              metricMode === 'gap'
                ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-2xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            GDP Lead Spread
          </button>
        </div>
      </div>

      {/* Scenario Presets & Simulation Controls Toolbar */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-950/40 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Scenario Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mr-1">
              Simulation Scenario:
            </span>

            <button
              id="scenario-baseline-btn"
              onClick={() => setScenario('baseline')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                scenario === 'baseline'
                  ? 'bg-indigo-600 text-white font-bold shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200/70'
              }`}
            >
              Current Baseline ({entityA.shortName} {entityA.gdpGrowthRate}%, {entityB.shortName} {entityB.gdpGrowthRate}%)
            </button>

            <button
              id="scenario-optimistic-btn"
              onClick={() => setScenario('optimistic')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                scenario === 'optimistic'
                  ? 'bg-emerald-600 text-white font-bold shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200/70'
              }`}
            >
              Bull Run (+1.8% Surge)
            </button>

            <button
              id="scenario-pessimistic-btn"
              onClick={() => setScenario('pessimistic')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                scenario === 'pessimistic'
                  ? 'bg-amber-600 text-white font-bold shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200/70'
              }`}
            >
              Bear Case (-1.8% Stagnation)
            </button>

            <button
              id="scenario-convergence-btn"
              onClick={() => setScenario('convergence')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                scenario === 'convergence'
                  ? 'bg-purple-600 text-white font-bold shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200/70'
              }`}
            >
              Catch-up Convergence
            </button>

            <button
              id="scenario-custom-btn"
              onClick={() => setScenario('custom')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer flex items-center space-x-1 ${
                scenario === 'custom'
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-bold shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200/70'
              }`}
            >
              <SlidersHorizontal className="w-3 h-3" />
              <span>Custom Rates</span>
            </button>
          </div>

          {/* Uncertainty Band Toggle */}
          {metricMode === 'nominal' && (
            <button
              onClick={() => setShowUncertaintyBands(!showUncertaintyBands)}
              className={`px-2.5 py-1 rounded-lg font-medium flex items-center space-x-1.5 transition-colors border cursor-pointer ${
                showUncertaintyBands
                  ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{showUncertaintyBands ? 'Uncertainty Range: Visible' : 'Show Uncertainty Range'}</span>
            </button>
          )}
        </div>

        {/* Custom Rate Interactive Sliders (When Custom Scenario Active) */}
        {scenario === 'custom' && (
          <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in">
            {/* Entity A Slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                  {entityA.name} Growth Rate:
                </span>
                <span className="font-mono font-extrabold text-indigo-600 dark:text-indigo-400 text-sm">
                  {customRateA > 0 ? '+' : ''}{customRateA.toFixed(1)}% / yr
                </span>
              </div>
              <input
                type="range"
                min="-2.0"
                max="8.0"
                step="0.1"
                value={customRateA}
                onChange={(e) => setCustomRateA(parseFloat(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>-2.0% (Recession)</span>
                <span>Base: {entityA.gdpGrowthRate}%</span>
                <span>+8.0% (High Surge)</span>
              </div>
            </div>

            {/* Entity B Slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                  {entityB.name} Growth Rate:
                </span>
                <span className="font-mono font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                  {customRateB > 0 ? '+' : ''}{customRateB.toFixed(1)}% / yr
                </span>
              </div>
              <input
                type="range"
                min="-2.0"
                max="8.0"
                step="0.1"
                value={customRateB}
                onChange={(e) => setCustomRateB(parseFloat(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>-2.0% (Recession)</span>
                <span>Base: {entityB.gdpGrowthRate}%</span>
                <span>+8.0% (High Surge)</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Projection Scoreboard Cards Banner */}
      <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Entity A 2029 Target Card */}
        <div className="p-3.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
              <span className="text-base leading-none">{entityA.flag}</span>
              {entityA.name} in 2029
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300 font-bold">
              {rateA > 0 ? '+' : ''}{rateA}% / yr
            </span>
          </div>

          <div className="mt-2 flex items-baseline justify-between">
            <div>
              <span className="text-xl font-black text-indigo-900 dark:text-indigo-300">
                ${(summary2029.finalPt.valA >= 1000 ? (summary2029.finalPt.valA / 1000).toFixed(2) + 'T' : Math.round(summary2029.finalPt.valA) + 'B')}
              </span>
              <span className="text-xs text-slate-400 ml-1">Nominal</span>
            </div>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              +{summary2029.cumulativeGrowthA.toFixed(1)}% (+${(summary2029.addedGdpA >= 1000 ? (summary2029.addedGdpA / 1000).toFixed(2) + 'T' : Math.round(summary2029.addedGdpA) + 'B')})
            </span>
          </div>

          <div className="mt-2 pt-2 border-t border-indigo-100/80 dark:border-indigo-900/40 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>Projected Per Capita:</span>
            <span className="font-mono font-bold text-slate-700 dark:text-slate-200">
              ${Math.round(summary2029.finalPt.perCapitaA).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Entity B 2029 Target Card */}
        <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-950 dark:text-emerald-200 flex items-center gap-1.5">
              <span className="text-base leading-none">{entityB.flag}</span>
              {entityB.name} in 2029
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold">
              {rateB > 0 ? '+' : ''}{rateB}% / yr
            </span>
          </div>

          <div className="mt-2 flex items-baseline justify-between">
            <div>
              <span className="text-xl font-black text-emerald-900 dark:text-emerald-300">
                ${(summary2029.finalPt.valB >= 1000 ? (summary2029.finalPt.valB / 1000).toFixed(2) + 'T' : Math.round(summary2029.finalPt.valB) + 'B')}
              </span>
              <span className="text-xs text-slate-400 ml-1">Nominal</span>
            </div>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              +{summary2029.cumulativeGrowthB.toFixed(1)}% (+${(summary2029.addedGdpB >= 1000 ? (summary2029.addedGdpB / 1000).toFixed(2) + 'T' : Math.round(summary2029.addedGdpB) + 'B')})
            </span>
          </div>

          <div className="mt-2 pt-2 border-t border-emerald-100/80 dark:border-emerald-900/40 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>Projected Per Capita:</span>
            <span className="font-mono font-bold text-slate-700 dark:text-slate-200">
              ${Math.round(summary2029.finalPt.perCapitaB).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Comparative Analytical Verdict Card */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
              5-Year Trajectory Verdict
            </span>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
              {summary2029.crossoverYear ? (
                <>
                  At simulated rates,{' '}
                  <strong className="text-indigo-600 dark:text-indigo-400">
                    {rateA > rateB ? entityA.name : entityB.name}
                  </strong>{' '}
                  is projected to reach parity / surpass{' '}
                  <strong className="text-slate-900 dark:text-white">
                    {rateA > rateB ? entityB.name : entityA.name}
                  </strong>{' '}
                  around <strong>{summary2029.crossoverYear}</strong>.
                </>
              ) : summary2029.finalGap > summary2029.initialGap ? (
                <>
                  The nominal economic lead of{' '}
                  <strong>{summary2029.finalLeader === 'A' ? entityA.name : entityB.name}</strong> widens by{' '}
                  <strong>${Math.round(summary2029.finalGap - summary2029.initialGap)}B</strong> to reach{' '}
                  <strong>${Math.round(summary2029.finalGap)}B</strong> by 2029.
                </>
              ) : (
                <>
                  The trailing economy compresses the GDP spread by{' '}
                  <strong>${Math.round(summary2029.initialGap - summary2029.finalGap)}B</strong>, narrowing the lead to{' '}
                  <strong>${Math.round(summary2029.finalGap)}B</strong> by 2029.
                </>
              )}
            </p>
          </div>

          <div className="mt-2 text-[10px] text-slate-400 font-mono">
            Scenario: {scenarioLabel}
          </div>
        </div>
      </div>

      {/* Interactive SVG Chart Container */}
      <div className="p-4 sm:p-6 bg-white dark:bg-slate-900 relative">
        <div className="relative w-full overflow-hidden">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto max-h-[380px] select-none">
            <defs>
              {/* Entity A Gradient */}
              <linearGradient id="projGradientA" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
              </linearGradient>

              {/* Entity B Gradient */}
              <linearGradient id="projGradientB" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
              </linearGradient>

              {/* Fan Band Patterns */}
              <linearGradient id="fanGradientA" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#818cf8" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#818cf8" stopOpacity="0.05" />
              </linearGradient>
              <linearGradient id="fanGradientB" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#34d399" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#34d399" stopOpacity="0.05" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid Lines */}
            {yTicks.map((tickVal, i) => {
              const y = getY(tickVal);
              return (
                <g key={i}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={width - padding.right}
                    y2={y}
                    stroke={isDarkMode ? '#334155' : '#e2e8f0'}
                    strokeDasharray={i === 0 ? 'none' : '3,3'}
                    strokeWidth={1}
                  />
                  <text
                    x={padding.left - 10}
                    y={y + 3}
                    textAnchor="end"
                    className="text-[10px] fill-slate-400 font-mono"
                  >
                    {formatYTick(tickVal)}
                  </text>
                </g>
              );
            })}

            {/* Forecast Dividing Vertical Line (2024 Base boundary) */}
            <line
              x1={getX(0)}
              y1={padding.top}
              x2={getX(0)}
              y2={padding.top + chartHeight}
              stroke="#94a3b8"
              strokeWidth={1.5}
              strokeDasharray="4,4"
            />
            <text
              x={getX(0) + 6}
              y={padding.top + 12}
              className="text-[9px] fill-slate-400 dark:fill-slate-500 font-bold uppercase tracking-wider"
            >
              2024 Base → Projected Horizon
            </text>

            {/* Fan Uncertainty Range Bands (Nominal mode only) */}
            {fanPolygonA && (
              <path
                d={fanPolygonA}
                fill="url(#fanGradientA)"
                stroke="#6366f1"
                strokeWidth={0.75}
                strokeDasharray="3,3"
                opacity={0.7}
              />
            )}
            {fanPolygonB && (
              <path
                d={fanPolygonB}
                fill="url(#fanGradientB)"
                stroke="#10b981"
                strokeWidth={0.75}
                strokeDasharray="3,3"
                opacity={0.7}
              />
            )}

            {/* Shaded Area Fills */}
            {metricMode !== 'gap' && <path d={areaA} fill="url(#projGradientA)" />}

            {/* Line A (Entity A) */}
            <path
              d={pathA}
              fill="none"
              stroke="#6366f1"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Line B (Entity B) */}
            {pathB && (
              <path
                d={pathB}
                fill="none"
                stroke="#10b981"
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Data Point Circles on Line */}
            {chartPoints.map((pt, i) => {
              const x = getX(i);
              const yA = getY(pt.valA);
              const yB = getY(pt.valB);
              const isSelected = pt.year === activeYear;

              return (
                <g key={pt.year}>
                  {/* Entity A Point */}
                  <circle
                    cx={x}
                    cy={yA}
                    r={isSelected ? 6 : 4}
                    fill={isDarkMode ? '#0f172a' : '#ffffff'}
                    stroke="#6366f1"
                    strokeWidth={isSelected ? 3 : 2}
                    className="transition-all"
                  />

                  {/* Entity B Point */}
                  {metricMode !== 'gap' && (
                    <circle
                      cx={x}
                      cy={yB}
                      r={isSelected ? 6 : 4}
                      fill={isDarkMode ? '#0f172a' : '#ffffff'}
                      stroke="#10b981"
                      strokeWidth={isSelected ? 3 : 2}
                      className="transition-all"
                    />
                  )}

                  {/* Active Year Vertical Cursor Guide */}
                  {isSelected && (
                    <line
                      x1={x}
                      y1={padding.top}
                      x2={x}
                      y2={padding.top + chartHeight}
                      stroke={isDarkMode ? '#64748b' : '#94a3b8'}
                      strokeWidth={1.5}
                      strokeDasharray="2,2"
                    />
                  )}
                </g>
              );
            })}

            {/* X-Axis Year Labels & Interactive Hit Zones */}
            {projectionYears.map((year, idx) => {
              const x = getX(idx);
              const isSelected = year === activeYear;

              return (
                <g
                  key={year}
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredYear(year)}
                  onMouseLeave={() => setHoveredYear(null)}
                  onClick={() => setPinnedYear(pinnedYear === year ? null : year)}
                >
                  {/* Hit zone */}
                  <rect
                    x={x - chartWidth / (projectionYears.length * 2)}
                    y={padding.top}
                    width={chartWidth / projectionYears.length}
                    height={chartHeight + 35}
                    fill="transparent"
                  />

                  {/* Year text */}
                  <text
                    x={x}
                    y={padding.top + chartHeight + 22}
                    textAnchor="middle"
                    className={`text-xs font-mono transition-colors ${
                      isSelected
                        ? 'fill-indigo-600 dark:fill-indigo-400 font-extrabold text-sm'
                        : 'fill-slate-500 dark:fill-slate-400 font-medium'
                    }`}
                  >
                    {year}
                    {year === 2024 ? ' (Base)' : ''}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Active Year Inspection Floating Card */}
        <div
          id="projection-active-year-panel"
          className="mt-4 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
        >
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-indigo-600 text-white font-mono font-bold text-sm">
              {activeSnapshot.year}
            </div>
            <div>
              <div className="font-bold text-slate-900 dark:text-white">
                Year {activeSnapshot.year} Projection Snapshot ({scenarioLabel})
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                {activeSnapshot.year === 2024
                  ? 'Historical baseline starting point'
                  : `Year ${activeSnapshot.year - 2024} of 5-year compounding simulation`}
              </div>
            </div>
          </div>

          {/* Quick Metrics at Active Year */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-6">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
              <div>
                <span className="text-[10px] text-slate-400 font-semibold block">{entityA.shortName}:</span>
                <span className="font-bold text-slate-900 dark:text-white font-mono">
                  ${(activeSnapshot.valA >= 1000 ? (activeSnapshot.valA / 1000).toFixed(2) + 'T' : Math.round(activeSnapshot.valA) + 'B')}
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 ml-1">
                  (+{(((activeSnapshot.valA - entityA.nominalGdp) / entityA.nominalGdp) * 100).toFixed(1)}%)
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
              <div>
                <span className="text-[10px] text-slate-400 font-semibold block">{entityB.shortName}:</span>
                <span className="font-bold text-slate-900 dark:text-white font-mono">
                  ${(activeSnapshot.valB >= 1000 ? (activeSnapshot.valB / 1000).toFixed(2) + 'T' : Math.round(activeSnapshot.valB) + 'B')}
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 ml-1">
                  (+{(((activeSnapshot.valB - entityB.nominalGdp) / entityB.nominalGdp) * 100).toFixed(1)}%)
                </span>
              </div>
            </div>

            <div className="border-l border-slate-300 dark:border-slate-700 pl-3">
              <span className="text-[10px] text-slate-400 font-semibold block">Projected Lead:</span>
              <span className="font-bold text-indigo-700 dark:text-indigo-400 font-mono">
                {activeSnapshot.gap >= 0 ? entityA.shortName : entityB.shortName} by ${Math.abs(Math.round(activeSnapshot.gap))}B
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Year-by-Year Simulation Table Toggle */}
      <div className="border-t border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setShowYearTable(!showYearTable)}
          className="w-full px-4 sm:px-5 py-3 bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 hover:dark:bg-slate-800 flex items-center justify-between text-left text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
        >
          <span className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Detailed Year-by-Year Simulation Progression Table</span>
          </span>
          <span className="flex items-center space-x-1 text-slate-400">
            <span>{showYearTable ? 'Hide Table' : 'Show Table'}</span>
            {showYearTable ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </span>
        </button>

        {showYearTable && (
          <div className="overflow-x-auto p-4 sm:p-5 bg-white dark:bg-slate-900">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-2.5">Year</th>
                  <th className="p-2.5 text-indigo-700 dark:text-indigo-400">{entityA.name} GDP</th>
                  <th className="p-2.5 text-indigo-700 dark:text-indigo-400">{entityA.shortName} Per Capita</th>
                  <th className="p-2.5 text-emerald-700 dark:text-emerald-400">{entityB.name} GDP</th>
                  <th className="p-2.5 text-emerald-700 dark:text-emerald-400">{entityB.shortName} Per Capita</th>
                  <th className="p-2.5">Lead Spread ($B)</th>
                  <th className="p-2.5 text-center">Cumulative Lead</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {projectionSeries.map((pt) => {
                  const isA = pt.gap >= 0;
                  return (
                    <tr
                      key={pt.year}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${
                        pt.year === activeYear ? 'bg-indigo-50/40 dark:bg-indigo-950/30 font-bold' : ''
                      }`}
                    >
                      <td className="p-2.5 font-mono font-bold">{pt.year}</td>
                      <td className="p-2.5 font-mono font-bold text-slate-900 dark:text-white">
                        ${(pt.valA >= 1000 ? (pt.valA / 1000).toFixed(2) + 'T' : Math.round(pt.valA) + 'B')}
                      </td>
                      <td className="p-2.5 font-mono text-slate-600 dark:text-slate-300">
                        ${Math.round(pt.perCapitaA).toLocaleString()}
                      </td>
                      <td className="p-2.5 font-mono font-bold text-slate-900 dark:text-white">
                        ${(pt.valB >= 1000 ? (pt.valB / 1000).toFixed(2) + 'T' : Math.round(pt.valB) + 'B')}
                      </td>
                      <td className="p-2.5 font-mono text-slate-600 dark:text-slate-300">
                        ${Math.round(pt.perCapitaB).toLocaleString()}
                      </td>
                      <td className="p-2.5 font-mono font-bold text-indigo-700 dark:text-indigo-400">
                        ${Math.abs(Math.round(pt.gap))}B
                      </td>
                      <td className="p-2.5 text-center">
                        <span
                          className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                            isA
                              ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          }`}
                        >
                          {isA ? entityA.shortName : entityB.shortName} +${Math.abs(Math.round(pt.gap))}B
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer Helper */}
      <div className="p-3 bg-slate-50/80 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 text-2xs text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2 px-4 sm:px-5">
        <div className="flex items-center space-x-1.5">
          <Info className="w-3.5 h-3.5 text-slate-400" />
          <span>
            Compound growth simulated using discrete annual compounding. Projections assume constant terms excluding external currency devaluation shocks.
          </span>
        </div>
        <span className="font-mono text-slate-400 dark:text-slate-500">
          IMF World Economic Outlook Baseline & Analytical Models
        </span>
      </div>
    </div>
  );
}
