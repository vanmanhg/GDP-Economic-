import { useState, useMemo } from 'react';
import {
  Grid3X3,
  BarChart2,
  SlidersHorizontal,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Info,
  CheckCircle2,
  ChevronRight,
  X,
  Sparkles,
  ArrowLeftRight,
  Layers,
  ShieldCheck,
  Scale
} from 'lucide-react';
import { EconomicEntity } from '../types';

interface VarianceHeatmapProps {
  entityA: EconomicEntity;
  entityB: EconomicEntity;
}

export type IndicatorCategory =
  | 'Scale & Output'
  | 'Living Standards'
  | 'Stability & Labor'
  | 'Trade & Structure';

export interface MacroIndicator {
  id: string;
  name: string;
  shortLabel: string;
  category: IndicatorCategory;
  description: string;
  unit: string;
  valA: number;
  valB: number;
  formattedValA: string;
  formattedValB: string;
  lowerIsBetter?: boolean;
  economicSignificance: string;
}

export interface ComputedMacroIndicator extends MacroIndicator {
  rawDelta: number;
  relativeScore: number;
  winner: 'A' | 'B' | 'parity';
  tier: 'dominant' | 'strong' | 'moderate' | 'slight' | 'parity';
  absScore: number;
}

export function VarianceHeatmap({ entityA, entityB }: VarianceHeatmapProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'variance' | 'entityA' | 'entityB' | 'default'>('variance');
  const [viewMode, setViewMode] = useState<'matrix' | 'cards' | 'diverging'>('matrix');
  const [selectedIndicator, setSelectedIndicator] = useState<ComputedMacroIndicator | null>(null);

  // Define comprehensive suite of macroeconomic indicators
  const indicators: MacroIndicator[] = useMemo(() => {
    return [
      // --- Scale & Output ---
      {
        id: 'nominal-gdp',
        name: 'Nominal GDP',
        shortLabel: 'Nominal GDP',
        category: 'Scale & Output',
        description: 'Total market value of all finished goods and services at current exchange rates.',
        unit: 'Billion USD',
        valA: entityA.nominalGdp,
        valB: entityB.nominalGdp,
        formattedValA: entityA.nominalGdp >= 1000 ? `$${(entityA.nominalGdp / 1000).toFixed(2)}T` : `$${entityA.nominalGdp.toLocaleString()}B`,
        formattedValB: entityB.nominalGdp >= 1000 ? `$${(entityB.nominalGdp / 1000).toFixed(2)}T` : `$${entityB.nominalGdp.toLocaleString()}B`,
        economicSignificance: 'Determines aggregate commercial scale, geopolitical weight, and global market power.'
      },
      {
        id: 'gdp-ppp',
        name: 'GDP (Purchasing Power Parity)',
        shortLabel: 'GDP (PPP)',
        category: 'Scale & Output',
        description: 'Gross domestic product adjusted for domestic price level differences between economies.',
        unit: 'Billion Int$',
        valA: entityA.gdpPpp,
        valB: entityB.gdpPpp,
        formattedValA: entityA.gdpPpp >= 1000 ? `$${(entityA.gdpPpp / 1000).toFixed(2)}T PPP` : `$${entityA.gdpPpp.toLocaleString()}B PPP`,
        formattedValB: entityB.gdpPpp >= 1000 ? `$${(entityB.gdpPpp / 1000).toFixed(2)}T PPP` : `$${entityB.gdpPpp.toLocaleString()}B PPP`,
        economicSignificance: 'Measures real domestic volume of production and internal purchasing capacity.'
      },
      {
        id: 'population',
        name: 'Population Scale',
        shortLabel: 'Population',
        category: 'Scale & Output',
        description: 'Total resident demographic base and domestic consumer/labor market capacity.',
        unit: 'Million',
        valA: entityA.population,
        valB: entityB.population,
        formattedValA: `${entityA.population.toFixed(1)}M`,
        formattedValB: `${entityB.population.toFixed(1)}M`,
        economicSignificance: 'Defines demographic dividend potential, internal market depth, and total human resource pool.'
      },

      // --- Living Standards & Productivity ---
      {
        id: 'gdp-pc-nominal',
        name: 'GDP Per Capita (Nominal)',
        shortLabel: 'Per Capita (Nom.)',
        category: 'Living Standards',
        description: 'Economic output divided by total population at market foreign exchange rates.',
        unit: 'USD',
        valA: entityA.gdpPerCapitaNominal,
        valB: entityB.gdpPerCapitaNominal,
        formattedValA: `$${entityA.gdpPerCapitaNominal.toLocaleString()}`,
        formattedValB: `$${entityB.gdpPerCapitaNominal.toLocaleString()}`,
        economicSignificance: 'Key benchmark of global wage purchasing power and high-end capital productivity.'
      },
      {
        id: 'gdp-pc-ppp',
        name: 'GDP Per Capita (PPP)',
        shortLabel: 'Per Capita (PPP)',
        category: 'Living Standards',
        description: 'Output per citizen normalized for the local cost of goods, rent, and daily living basket.',
        unit: 'Int$',
        valA: entityA.gdpPerCapitaPpp,
        valB: entityB.gdpPerCapitaPpp,
        formattedValA: `$${entityA.gdpPerCapitaPpp.toLocaleString()}`,
        formattedValB: `$${entityB.gdpPerCapitaPpp.toLocaleString()}`,
        economicSignificance: 'The premier measure of everyday citizen living standards and material well-being.'
      },
      {
        id: 'hdi',
        name: 'Human Development Index (HDI)',
        shortLabel: 'HDI Score',
        category: 'Living Standards',
        description: 'Composite index measuring life expectancy, educational attainment, and standard of living.',
        unit: 'Index (0-1.0)',
        valA: entityA.hdi,
        valB: entityB.hdi,
        formattedValA: entityA.hdi.toFixed(3),
        formattedValB: entityB.hdi.toFixed(3),
        economicSignificance: 'Evaluates broad social and institutional development beyond purely monetary metrics.'
      },

      // --- Stability & Labor ---
      {
        id: 'growth-rate',
        name: 'Real GDP Annual Growth Rate',
        shortLabel: 'GDP Growth',
        category: 'Stability & Labor',
        description: 'Year-over-year rate of expansion in inflation-adjusted gross domestic product.',
        unit: '% YoY',
        valA: entityA.gdpGrowthRate,
        valB: entityB.gdpGrowthRate,
        formattedValA: `${entityA.gdpGrowthRate > 0 ? '+' : ''}${entityA.gdpGrowthRate.toFixed(1)}%`,
        formattedValB: `${entityB.gdpGrowthRate > 0 ? '+' : ''}${entityB.gdpGrowthRate.toFixed(1)}%`,
        economicSignificance: 'Reflects current macroeconomic momentum, business cycle velocity, and investment appetite.'
      },
      {
        id: 'inflation',
        name: 'Inflation Rate (Consumer Prices)',
        shortLabel: 'Inflation (CPI)',
        category: 'Stability & Labor',
        description: 'Annual percentage change in the cost to the average consumer of acquiring a basket of goods.',
        unit: '% YoY',
        valA: entityA.inflationRate,
        valB: entityB.inflationRate,
        lowerIsBetter: true,
        formattedValA: `${entityA.inflationRate.toFixed(1)}%`,
        formattedValB: `${entityB.inflationRate.toFixed(1)}%`,
        economicSignificance: 'Lower, predictable inflation preserves household savings and reduces capital uncertainty.'
      },
      {
        id: 'unemployment',
        name: 'Unemployment Rate',
        shortLabel: 'Unemployment',
        category: 'Stability & Labor',
        description: 'Percentage of the active labor force that is without work and seeking employment.',
        unit: '%',
        valA: entityA.unemploymentRate,
        valB: entityB.unemploymentRate,
        lowerIsBetter: true,
        formattedValA: `${entityA.unemploymentRate.toFixed(1)}%`,
        formattedValB: `${entityB.unemploymentRate.toFixed(1)}%`,
        economicSignificance: 'Indicates labor market utilization, social cohesion, and production efficiency.'
      },
      {
        id: 'public-debt',
        name: 'Public Debt-to-GDP Ratio',
        shortLabel: 'Debt-to-GDP',
        category: 'Stability & Labor',
        description: 'Total cumulative government sovereign debt as a proportion of total annual GDP.',
        unit: '% of GDP',
        valA: entityA.publicDebtToGdp,
        valB: entityB.publicDebtToGdp,
        lowerIsBetter: true,
        formattedValA: `${entityA.publicDebtToGdp.toFixed(1)}%`,
        formattedValB: `${entityB.publicDebtToGdp.toFixed(1)}%`,
        economicSignificance: 'Determines fiscal solvency, sovereign creditworthiness, and countercyclical fiscal space.'
      },

      // --- Trade & Structure ---
      {
        id: 'trade-balance',
        name: 'Trade Balance',
        shortLabel: 'Trade Balance',
        category: 'Trade & Structure',
        description: 'Net difference between the monetary value of exports and imports over the year.',
        unit: 'Billion USD',
        valA: entityA.tradeBalance ?? 0,
        valB: entityB.tradeBalance ?? 0,
        formattedValA: entityA.tradeBalance !== undefined ? `${entityA.tradeBalance >= 0 ? '+' : ''}$${entityA.tradeBalance.toFixed(1)}B` : 'N/A',
        formattedValB: entityB.tradeBalance !== undefined ? `${entityB.tradeBalance >= 0 ? '+' : ''}$${entityB.tradeBalance.toFixed(1)}B` : 'N/A',
        economicSignificance: 'Reflects external competitiveness, net foreign asset accumulation, and trade vulnerability.'
      },
      {
        id: 'services-share',
        name: 'Services Sector Share',
        shortLabel: 'Services Share',
        category: 'Trade & Structure',
        description: 'Proportion of total gross value added generated by the tertiary service and technology economy.',
        unit: '% of GDP',
        valA: entityA.sectorShare.services,
        valB: entityB.sectorShare.services,
        formattedValA: `${entityA.sectorShare.services.toFixed(1)}%`,
        formattedValB: `${entityB.sectorShare.services.toFixed(1)}%`,
        economicSignificance: 'Highlights economic transition toward high-value knowledge, financial, and digital services.'
      },
      {
        id: 'industry-share',
        name: 'Industrial Sector Share',
        shortLabel: 'Industry Share',
        category: 'Trade & Structure',
        description: 'Proportion of GDP produced by manufacturing, mining, construction, and utilities.',
        unit: '% of GDP',
        valA: entityA.sectorShare.industry,
        valB: entityB.sectorShare.industry,
        formattedValA: `${entityA.sectorShare.industry.toFixed(1)}%`,
        formattedValB: `${entityB.sectorShare.industry.toFixed(1)}%`,
        economicSignificance: 'Signifies physical manufacturing base, tangible goods sovereignty, and industrial depth.'
      }
    ];
  }, [entityA, entityB]);

  // Compute calculated metrics with normalized relative variance
  const computedMetrics = useMemo(() => {
    return indicators.map((ind) => {
      const { valA, valB, lowerIsBetter } = ind;
      const rawDelta = valA - valB;

      // Calculate relative variance:
      // Normalize against benchmark magnitude
      const baseScale = Math.max(Math.abs(valA), Math.abs(valB), 0.001);
      let relativeScore = 0;

      if (lowerIsBetter) {
        // Lower is an advantage (e.g., lower inflation, lower unemployment, lower debt)
        // If valA < valB, entityA has advantage -> positive score
        relativeScore = ((valB - valA) / baseScale) * 100;
      } else {
        // Higher is an advantage
        // If valA > valB, entityA has advantage -> positive score
        relativeScore = ((valA - valB) / baseScale) * 100;
      }

      // Clamp score between -100 and +100
      const clampedScore = Math.max(-100, Math.min(100, relativeScore));

      // Threshold for meaningful advantage: ±3%
      const threshold = 3.0;
      let winner: 'A' | 'B' | 'parity' = 'parity';
      if (clampedScore > threshold) winner = 'A';
      else if (clampedScore < -threshold) winner = 'B';

      // Advantage intensity tier
      const absScore = Math.abs(clampedScore);
      let tier: 'dominant' | 'strong' | 'moderate' | 'slight' | 'parity' = 'parity';
      if (absScore >= 50) tier = 'dominant';
      else if (absScore >= 25) tier = 'strong';
      else if (absScore >= 10) tier = 'moderate';
      else if (absScore >= threshold) tier = 'slight';

      return {
        ...ind,
        rawDelta,
        relativeScore: clampedScore,
        winner,
        tier,
        absScore
      };
    });
  }, [indicators]);

  // Overall statistics and balance summary
  const summary = useMemo(() => {
    let leadsA = 0;
    let leadsB = 0;
    let parity = 0;
    let netScore = 0; // Positive = A advantage, Negative = B advantage

    let topAdvantageA = computedMetrics[0];
    let topAdvantageB = computedMetrics[0];

    computedMetrics.forEach((m) => {
      netScore += m.relativeScore;
      if (m.winner === 'A') {
        leadsA++;
        if (m.relativeScore > (topAdvantageA.relativeScore || 0)) {
          topAdvantageA = m;
        }
      } else if (m.winner === 'B') {
        leadsB++;
        if (m.relativeScore < (topAdvantageB.relativeScore || 0)) {
          topAdvantageB = m;
        }
      } else {
        parity++;
      }
    });

    const total = computedMetrics.length;
    const shareA = Math.round((leadsA / (total || 1)) * 100);
    const shareB = Math.round((leadsB / (total || 1)) * 100);

    return {
      leadsA,
      leadsB,
      parity,
      total,
      shareA,
      shareB,
      netScore: Math.round(netScore / (total || 1)),
      topAdvantageA,
      topAdvantageB
    };
  }, [computedMetrics]);

  // Filter and sort items
  const filteredMetrics = useMemo(() => {
    let list = [...computedMetrics];

    if (selectedCategory !== 'all') {
      list = list.filter((m) => m.category === selectedCategory);
    }

    if (sortBy === 'variance') {
      // Sort by absolute variance (most decisive differences first)
      list.sort((a, b) => b.absScore - a.absScore);
    } else if (sortBy === 'entityA') {
      // Highest advantage for Entity A first
      list.sort((a, b) => b.relativeScore - a.relativeScore);
    } else if (sortBy === 'entityB') {
      // Highest advantage for Entity B first
      list.sort((a, b) => a.relativeScore - b.relativeScore);
    }

    return list;
  }, [computedMetrics, selectedCategory, sortBy]);

  // Function to return Tailwind heatmap cell styling based on score and winner
  const getHeatmapColor = (score: number, winner: 'A' | 'B' | 'parity') => {
    const abs = Math.abs(score);
    if (winner === 'parity') {
      return {
        bg: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
        barBg: 'bg-slate-400 dark:bg-slate-500',
        badge: 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800',
        label: 'Parity'
      };
    }

    if (winner === 'A') {
      if (abs >= 60) {
        return {
          bg: 'bg-indigo-600 text-white border-indigo-700 dark:border-indigo-500 shadow-2xs',
          barBg: 'bg-indigo-600',
          badge: 'text-indigo-900 bg-indigo-50 border border-indigo-200',
          label: `+${Math.round(abs)}% Advantage for ${entityA.shortName}`
        };
      }
      if (abs >= 30) {
        return {
          bg: 'bg-indigo-500 text-white border-indigo-600 dark:border-indigo-500',
          barBg: 'bg-indigo-500',
          badge: 'text-indigo-900 bg-indigo-50 border border-indigo-200',
          label: `+${Math.round(abs)}% Advantage for ${entityA.shortName}`
        };
      }
      if (abs >= 15) {
        return {
          bg: 'bg-indigo-100 text-indigo-950 dark:bg-indigo-950/70 dark:text-indigo-200 border-indigo-200 dark:border-indigo-800',
          barBg: 'bg-indigo-400',
          badge: 'text-indigo-800 bg-indigo-50',
          label: `+${Math.round(abs)}% Lead for ${entityA.shortName}`
        };
      }
      return {
        bg: 'bg-indigo-50/80 text-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-100 dark:border-indigo-900/50',
        barBg: 'bg-indigo-300',
        badge: 'text-indigo-700 bg-indigo-50/60',
        label: `+${Math.round(abs)}% Edge for ${entityA.shortName}`
      };
    } else {
      if (abs >= 60) {
        return {
          bg: 'bg-emerald-600 text-white border-emerald-700 dark:border-emerald-500 shadow-2xs',
          barBg: 'bg-emerald-600',
          badge: 'text-emerald-900 bg-emerald-50 border border-emerald-200',
          label: `+${Math.round(abs)}% Advantage for ${entityB.shortName}`
        };
      }
      if (abs >= 30) {
        return {
          bg: 'bg-emerald-500 text-white border-emerald-600 dark:border-emerald-500',
          barBg: 'bg-emerald-500',
          badge: 'text-emerald-900 bg-emerald-50 border border-emerald-200',
          label: `+${Math.round(abs)}% Advantage for ${entityB.shortName}`
        };
      }
      if (abs >= 15) {
        return {
          bg: 'bg-emerald-100 text-emerald-950 dark:bg-emerald-950/70 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800',
          barBg: 'bg-emerald-400',
          badge: 'text-emerald-800 bg-emerald-50',
          label: `+${Math.round(abs)}% Lead for ${entityB.shortName}`
        };
      }
      return {
        bg: 'bg-emerald-50/80 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-100 dark:border-emerald-900/50',
        barBg: 'bg-emerald-300',
        badge: 'text-emerald-700 bg-emerald-50/60',
        label: `+${Math.round(abs)}% Edge for ${entityB.shortName}`
      };
    }
  };

  const categories: { id: string; label: string }[] = [
    { id: 'all', label: 'All Indicators' },
    { id: 'Scale & Output', label: 'Scale & Output' },
    { id: 'Living Standards', label: 'Living Standards' },
    { id: 'Stability & Labor', label: 'Stability & Labor' },
    { id: 'Trade & Structure', label: 'Trade & Structure' }
  ];

  return (
    <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
      {/* Component Header */}
      <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 bg-linear-to-b from-slate-50/80 to-white dark:from-slate-900 dark:to-slate-900/90">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800/80 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Grid3X3 className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Macroeconomic Variance & Relative Strength Heatmap
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
              Normalized comparative spectrum across 13 core macroeconomic indicators. Diverging color scale highlights structural competitive leads: <span className="font-semibold text-indigo-700 dark:text-indigo-400">Indigo</span> signifies advantage for {entityA.name}, and <span className="font-semibold text-emerald-700 dark:text-emerald-400">Emerald</span> signifies advantage for {entityB.name}.
            </p>
          </div>

          {/* View Mode Controls */}
          <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs self-start md:self-auto border dark:border-slate-700">
            <button
              onClick={() => setViewMode('matrix')}
              className={`px-3 py-1.5 rounded-lg font-medium flex items-center space-x-1.5 transition-all ${
                viewMode === 'matrix'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title="Detailed Heatmap Matrix"
            >
              <Grid3X3 className="w-3.5 h-3.5" />
              <span>Matrix View</span>
            </button>
            <button
              onClick={() => setViewMode('diverging')}
              className={`px-3 py-1.5 rounded-lg font-medium flex items-center space-x-1.5 transition-all ${
                viewMode === 'diverging'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title="Diverging Spectrum Bar Chart"
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Diverging Spectrum</span>
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 rounded-lg font-medium flex items-center space-x-1.5 transition-all ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title="Tile Grid Cards"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Tile Grid</span>
            </button>
          </div>
        </div>

        {/* Summary Balance Scorecard Banner */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Entity A Card */}
          <div className="p-4 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100/90 dark:border-indigo-900/50 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-xl">{entityA.flag}</span>
                <span className="text-sm font-bold text-indigo-950 dark:text-indigo-200 truncate">{entityA.name}</span>
              </div>
              <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-100/80 dark:bg-indigo-900/60 px-2 py-0.5 rounded-md">
                {summary.leadsA} of {summary.total} Leads
              </span>
            </div>
            <div className="mt-3">
              <div className="text-xs text-indigo-800/80 dark:text-indigo-300/80">Primary Standout Strength:</div>
              <div className="text-xs font-semibold text-indigo-950 dark:text-white truncate mt-0.5">
                {summary.topAdvantageA.winner === 'A' ? (
                  <>
                    {summary.topAdvantageA.shortLabel}{' '}
                    <span className="font-normal text-indigo-600 dark:text-indigo-400">
                      (+{Math.round(summary.topAdvantageA.absScore)}% lead)
                    </span>
                  </>
                ) : (
                  'Balanced baseline'
                )}
              </div>
            </div>
          </div>

          {/* Balance Gauge Center Card */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                Structural Parity & Edge
              </span>
              <span className="text-slate-500 dark:text-slate-400">{summary.parity} at Parity (±3%)</span>
            </div>

            {/* Visual ratio bar */}
            <div className="mt-2.5">
              <div className="h-2.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex">
                <div
                  className="bg-indigo-600 h-full transition-all duration-500"
                  style={{ width: `${(summary.leadsA / (summary.total || 1)) * 100}%` }}
                  title={`${entityA.shortName}: ${summary.leadsA} leads`}
                />
                <div
                  className="bg-slate-300 dark:bg-slate-600 h-full transition-all duration-500"
                  style={{ width: `${(summary.parity / (summary.total || 1)) * 100}%` }}
                  title={`Parity: ${summary.parity}`}
                />
                <div
                  className="bg-emerald-600 h-full transition-all duration-500"
                  style={{ width: `${(summary.leadsB / (summary.total || 1)) * 100}%` }}
                  title={`${entityB.shortName}: ${summary.leadsB} leads`}
                />
              </div>
              <div className="flex justify-between items-center text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-1">
                <span className="text-indigo-700 dark:text-indigo-400 font-semibold">{entityA.shortName} ({summary.leadsA})</span>
                <span className="text-slate-400 dark:text-slate-500">Neutral ({summary.parity})</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-semibold">{entityB.shortName} ({summary.leadsB})</span>
              </div>
            </div>
          </div>

          {/* Entity B Card */}
          <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100/90 dark:border-emerald-900/50 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-xl">{entityB.flag}</span>
                <span className="text-sm font-bold text-emerald-950 dark:text-emerald-200 truncate">{entityB.name}</span>
              </div>
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-900/60 px-2 py-0.5 rounded-md">
                {summary.leadsB} of {summary.total} Leads
              </span>
            </div>
            <div className="mt-3">
              <div className="text-xs text-emerald-800/80 dark:text-emerald-300/80">Primary Standout Strength:</div>
              <div className="text-xs font-semibold text-emerald-950 dark:text-white truncate mt-0.5">
                {summary.topAdvantageB.winner === 'B' ? (
                  <>
                    {summary.topAdvantageB.shortLabel}{' '}
                    <span className="font-normal text-emerald-600 dark:text-emerald-400">
                      (+{Math.round(summary.topAdvantageB.absScore)}% lead)
                    </span>
                  </>
                ) : (
                  'Balanced baseline'
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Filter & Sorting Toolbar */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-2">
          {/* Category Tabs */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
                  selectedCategory === cat.id
                    ? 'bg-slate-900 text-white dark:bg-indigo-600 dark:text-white shadow-2xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 hover:dark:bg-slate-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Sort Menu */}
          <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-lg px-2.5 py-1 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-hidden font-medium"
            >
              <option value="variance">Largest Variance Delta</option>
              <option value="entityA">{entityA.shortName} Strongest Leads First</option>
              <option value="entityB">{entityB.shortName} Strongest Leads First</option>
              <option value="default">Default Order</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Areas */}
      <div className="p-4 sm:p-6">
        {/* Heat Legend */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-300 bg-slate-50/80 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-700 dark:text-slate-200">Heatmap Scale:</span>
            <div className="flex items-center space-x-1">
              <span className="w-3.5 h-3.5 rounded-sm bg-indigo-600" title="Dominant Lead (>60%)" />
              <span className="w-3.5 h-3.5 rounded-sm bg-indigo-400" title="Solid Lead (30-60%)" />
              <span className="w-3.5 h-3.5 rounded-sm bg-indigo-100 border border-indigo-200 dark:bg-indigo-950/60 dark:border-indigo-800" title="Mild Lead (10-30%)" />
              <span className="text-[11px] font-medium text-indigo-900 dark:text-indigo-300 px-1">{entityA.shortName} Lead</span>
            </div>
            <div className="flex items-center space-x-1 pl-2 border-l border-slate-200 dark:border-slate-700">
              <span className="w-3.5 h-3.5 rounded-sm bg-slate-200 dark:bg-slate-700" title="Parity (±3%)" />
              <span className="text-[11px] text-slate-500 dark:text-slate-400 px-1">Parity</span>
            </div>
            <div className="flex items-center space-x-1 pl-2 border-l border-slate-200 dark:border-slate-700">
              <span className="text-[11px] font-medium text-emerald-900 dark:text-emerald-300 px-1">{entityB.shortName} Lead</span>
              <span className="w-3.5 h-3.5 rounded-sm bg-emerald-100 border border-emerald-200 dark:bg-emerald-950/60 dark:border-emerald-800" title="Mild Lead (10-30%)" />
              <span className="w-3.5 h-3.5 rounded-sm bg-emerald-400" title="Solid Lead (30-60%)" />
              <span className="w-3.5 h-3.5 rounded-sm bg-emerald-600" title="Dominant Lead (>60%)" />
            </div>
          </div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500 hidden lg:inline">
            *Inverted indicators (Inflation, Unemployment, Debt) reward lower values.
          </div>
        </div>

        {/* VIEW 1: MATRIX HEATMAP VIEW */}
        {viewMode === 'matrix' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-800/40">
                  <th className="py-3 px-4 w-[28%]">Indicator & Category</th>
                  <th className="py-3 px-4 text-right w-[16%]">
                    <span className="text-indigo-900 dark:text-indigo-300 font-bold">{entityA.name}</span>
                  </th>
                  <th className="py-3 px-4 text-center w-[20%]">Variance Heatmap</th>
                  <th className="py-3 px-4 text-left w-[16%]">
                    <span className="text-emerald-900 dark:text-emerald-300 font-bold">{entityB.name}</span>
                  </th>
                  <th className="py-3 px-4 text-center w-[20%]">Relative Advantage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                {filteredMetrics.map((ind) => {
                  const style = getHeatmapColor(ind.relativeScore, ind.winner);
                  const isSelected = selectedIndicator?.id === ind.id;

                  return (
                    <tr
                      key={ind.id}
                      onClick={() => setSelectedIndicator(isSelected ? null : ind)}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 cursor-pointer transition-colors ${
                        isSelected ? 'bg-indigo-50/40 dark:bg-indigo-950/40' : ''
                      }`}
                    >
                      {/* Name & Category */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                          <span>{ind.name}</span>
                          {ind.lowerIsBetter && (
                            <span
                              className="text-[10px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.2 rounded border border-amber-200 dark:border-amber-800 font-normal"
                              title="Lower value is economically advantageous"
                            >
                              Lower = Better
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{ind.category}</div>
                      </td>

                      {/* Entity A Value */}
                      <td className="py-3.5 px-4 text-right">
                        <span className={`font-mono tabular-nums font-semibold ${
                          ind.winner === 'A' ? 'text-indigo-700 dark:text-indigo-400 text-sm' : 'text-slate-700 dark:text-slate-300'
                        }`}>
                          {ind.formattedValA}
                        </span>
                      </td>

                      {/* Heatmap Cell */}
                      <td className="py-3 px-3 text-center">
                        <div
                          className={`mx-auto max-w-[140px] py-1.5 px-2.5 rounded-lg border text-center transition-all ${style.bg}`}
                        >
                          <div className="font-mono tabular-nums font-bold text-xs tracking-tight">
                            {ind.winner === 'parity' ? (
                              '±0.0% Parity'
                            ) : (
                              `${ind.winner === 'A' ? '◀ ' : ''}${Math.abs(Math.round(ind.relativeScore))}%${
                                ind.winner === 'B' ? ' ▶' : ''
                              }`
                            )}
                          </div>
                          <div className="text-[10px] opacity-85 truncate mt-0.5">
                            {ind.winner === 'A'
                              ? `${entityA.shortName} +${Math.round(ind.absScore)}%`
                              : ind.winner === 'B'
                              ? `${entityB.shortName} +${Math.round(ind.absScore)}%`
                              : 'Balanced'}
                          </div>
                        </div>
                      </td>

                      {/* Entity B Value */}
                      <td className="py-3.5 px-4 text-left">
                        <span className={`font-mono tabular-nums font-semibold ${
                          ind.winner === 'B' ? 'text-emerald-700 dark:text-emerald-400 text-sm' : 'text-slate-700 dark:text-slate-300'
                        }`}>
                          {ind.formattedValB}
                        </span>
                      </td>

                      {/* Relative Advantage Bar & Label */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col items-center">
                          {/* Diverging bar with zero-center */}
                          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden flex relative">
                            {/* Zero line */}
                            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-slate-300 dark:bg-slate-600 z-10 -translate-x-1/2" />
                            
                            {/* Left half for Entity A */}
                            <div className="w-1/2 flex justify-end">
                              {ind.winner === 'A' && (
                                <div
                                  className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-l-full"
                                  style={{ width: `${Math.min(100, ind.absScore)}%` }}
                                />
                              )}
                            </div>
                            
                            {/* Right half for Entity B */}
                            <div className="w-1/2 flex justify-start">
                              {ind.winner === 'B' && (
                                <div
                                  className="h-full bg-emerald-600 dark:bg-emerald-500 rounded-r-full"
                                  style={{ width: `${Math.min(100, ind.absScore)}%` }}
                                />
                              )}
                            </div>
                          </div>

                          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1 truncate max-w-full">
                            {ind.winner === 'A' ? (
                              <span className="text-indigo-700 dark:text-indigo-400 font-semibold">
                                {entityA.shortName} +{Math.round(ind.absScore)}% lead
                              </span>
                            ) : ind.winner === 'B' ? (
                              <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                                {entityB.shortName} +{Math.round(ind.absScore)}% lead
                              </span>
                            ) : (
                              <span className="text-slate-400 dark:text-slate-500">Competitive balance</span>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* VIEW 2: DIVERGING SPECTRUM VIEW */}
        {viewMode === 'diverging' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs font-semibold pb-2 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-2 text-indigo-800 dark:text-indigo-400">
                <span>{entityA.flag}</span>
                <span>{entityA.name} Advantage</span>
              </div>
              <span className="text-slate-400 dark:text-slate-500 font-normal">Relative Advantage Spectrum (%)</span>
              <div className="flex items-center space-x-2 text-emerald-800 dark:text-emerald-400">
                <span>{entityB.name} Advantage</span>
                <span>{entityB.flag}</span>
              </div>
            </div>

            <div className="space-y-3">
              {filteredMetrics.map((ind) => {
                const style = getHeatmapColor(ind.relativeScore, ind.winner);
                const isSelected = selectedIndicator?.id === ind.id;

                return (
                  <div
                    key={ind.id}
                    onClick={() => setSelectedIndicator(isSelected ? null : ind)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-indigo-400 dark:border-indigo-500 bg-indigo-50/30 dark:bg-indigo-950/40 ring-1 ring-indigo-400 dark:ring-indigo-500'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900 dark:text-slate-100">{ind.name}</span>
                        <span className="text-[11px] text-slate-400 dark:text-slate-500">({ind.category})</span>
                        {ind.lowerIsBetter && (
                          <span className="text-[10px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-1.5 rounded border border-amber-200 dark:border-amber-800">
                            Lower = Better
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-3 text-xs font-mono">
                        <span className={ind.winner === 'A' ? 'font-bold text-indigo-700 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}>
                          {ind.formattedValA}
                        </span>
                        <span className="text-slate-300 dark:text-slate-600">vs</span>
                        <span className={ind.winner === 'B' ? 'font-bold text-emerald-700 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}>
                          {ind.formattedValB}
                        </span>
                      </div>
                    </div>

                    {/* Centered Diverging Spectrum Bar */}
                    <div className="relative h-6 bg-slate-100 dark:bg-slate-900 rounded-lg flex items-center overflow-hidden">
                      {/* Zero parity center line */}
                      <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-slate-400 dark:bg-slate-600 z-20 -translate-x-1/2" />

                      {/* Left Side: Entity A Advantage */}
                      <div className="w-1/2 h-full flex justify-end items-center pr-0.5">
                        {ind.winner === 'A' && (
                          <div
                            className={`h-4 rounded-l-md transition-all flex items-center justify-end px-2 ${style.barBg}`}
                            style={{ width: `${Math.min(100, ind.absScore)}%` }}
                          >
                            <span className="text-[10px] font-bold text-white font-mono tabular-nums">
                              {Math.round(ind.absScore)}%
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Right Side: Entity B Advantage */}
                      <div className="w-1/2 h-full flex justify-start items-center pl-0.5">
                        {ind.winner === 'B' && (
                          <div
                            className={`h-4 rounded-r-md transition-all flex items-center justify-start px-2 ${style.barBg}`}
                            style={{ width: `${Math.min(100, ind.absScore)}%` }}
                          >
                            <span className="text-[10px] font-bold text-white font-mono tabular-nums">
                              {Math.round(ind.absScore)}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Quick description */}
                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                      <span>{ind.description}</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {ind.winner === 'A'
                          ? `Advantage ${entityA.shortName} (+${Math.round(ind.absScore)}%)`
                          : ind.winner === 'B'
                          ? `Advantage ${entityB.shortName} (+${Math.round(ind.absScore)}%)`
                          : 'Parity / Equal Standing'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW 3: TILE GRID VIEW */}
        {viewMode === 'cards' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredMetrics.map((ind) => {
              const style = getHeatmapColor(ind.relativeScore, ind.winner);
              const isSelected = selectedIndicator?.id === ind.id;

              return (
                <div
                  key={ind.id}
                  onClick={() => setSelectedIndicator(isSelected ? null : ind)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-indigo-400 dark:border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/40 ring-1 ring-indigo-400 dark:ring-indigo-500 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-800/80 hover:shadow-2xs'
                  }`}
                >
                  <div>
                    {/* Top indicator header */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">
                          {ind.category}
                        </span>
                        <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm mt-0.5 leading-snug">{ind.name}</h4>
                      </div>
                      <div
                        className={`text-[11px] font-bold font-mono px-2 py-0.5 rounded-md ${style.bg}`}
                      >
                        {ind.winner === 'parity' ? '±0%' : `${ind.winner === 'A' ? '▲' : '▼'} ${Math.round(ind.absScore)}%`}
                      </div>
                    </div>

                    {/* Comparative Values */}
                    <div className="mt-4 grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                      <div>
                        <div className="text-[10px] text-indigo-700 dark:text-indigo-400 font-semibold truncate">{entityA.shortName}</div>
                        <div className={`font-mono text-xs font-bold mt-0.5 ${
                          ind.winner === 'A' ? 'text-indigo-900 dark:text-indigo-300' : 'text-slate-600 dark:text-slate-400'
                        }`}>
                          {ind.formattedValA}
                        </div>
                      </div>
                      <div className="border-l border-slate-200 dark:border-slate-700 pl-2.5">
                        <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold truncate">{entityB.shortName}</div>
                        <div className={`font-mono text-xs font-bold mt-0.5 ${
                          ind.winner === 'B' ? 'text-emerald-900 dark:text-emerald-300' : 'text-slate-600 dark:text-slate-400'
                        }`}>
                          {ind.formattedValB}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer verdict */}
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      {ind.winner === 'A'
                        ? `${entityA.shortName} leads`
                        : ind.winner === 'B'
                        ? `${entityB.shortName} leads`
                        : 'Exact parity'}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-0.5">
                      Explore details <ChevronRight className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail Drilldown Modal / Drawer */}
      {selectedIndicator && (
        <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/95 p-5 sm:p-6 transition-all animate-fadeIn">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
                <Info className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-600 dark:text-indigo-400">
                  Indicator Deep-Dive
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{selectedIndicator.name}</h3>
              </div>
            </div>
            <button
              onClick={() => setSelectedIndicator(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Economic Definition</div>
              <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 leading-relaxed">
                {selectedIndicator.description}
              </p>
              <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-2 font-mono">
                Standard Unit: {selectedIndicator.unit}
              </div>
            </div>

            <div className="p-3.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Macroeconomic Significance</div>
              <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 leading-relaxed">
                {selectedIndicator.economicSignificance}
              </p>
              {selectedIndicator.lowerIsBetter && (
                <div className="mt-2 text-[11px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 p-1.5 rounded font-medium border border-amber-200 dark:border-amber-800">
                  Note: A lower numerical value is preferable and represents stronger macroeconomic health.
                </div>
              )}
            </div>

            <div className="p-3.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Comparative Verdict</div>
                <div className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1">
                  {selectedIndicator.winner === 'A' ? (
                    <span className="text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 inline" />
                      {entityA.name} Advantage
                    </span>
                  ) : selectedIndicator.winner === 'B' ? (
                    <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 inline" />
                      {entityB.name} Advantage
                    </span>
                  ) : (
                    <span className="text-slate-600 dark:text-slate-300">Neutral Parity</span>
                  )}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 font-medium">
                  {selectedIndicator.winner === 'parity' ? (
                    'Both economies are virtually tied within standard variance bounds (±3%).'
                  ) : (
                    <>
                      The leading entity holds a{' '}
                      <strong className="text-slate-900 dark:text-slate-100">+{Math.round(selectedIndicator.absScore)}%</strong> relative variance advantage over the other.
                    </>
                  )}
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-750 flex items-center justify-between text-xs font-mono">
                <span className="text-indigo-700 dark:text-indigo-400 font-bold">{entityA.shortName}: {selectedIndicator.formattedValA}</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-bold">{entityB.shortName}: {selectedIndicator.formattedValB}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
