import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  PieChart as PieChartIcon,
  Columns,
  Sparkles,
  ArrowRightLeft,
  Info,
  Maximize2,
  Layers,
  Globe2,
  DollarSign,
  User,
  Percent,
  Scale,
  Briefcase,
  Activity,
  SlidersHorizontal,
} from 'lucide-react';
import { EconomicEntity } from '../types';
import { HistoricalTimeRange, HistoricalMetricKey } from '../data/historicalExtendedData';
import { ComparativeBarChart, BarChartMetricKey } from './ComparativeBarChart';
import { InteractiveTrendLineChart } from './InteractiveTrendLineChart';
import { ComparativePieChart, PieMetricCategory } from './ComparativePieChart';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { formatCurrency } from '../utils/formatters';

export type ChartViewMode = 'all' | 'line' | 'bar' | 'pie';

export type UnifiedIndicatorKey =
  | 'nominalGdp'
  | 'gdpPerCapita'
  | 'gdpGrowthRate'
  | 'publicDebtToGdp'
  | 'inflationRate'
  | 'unemploymentRate'
  | 'tradeBalance'
  | 'sectorShare';

interface InteractiveEconomicChartsProps {
  entityA: EconomicEntity;
  entityB: EconomicEntity;
  onSelectEntity?: (entity: EconomicEntity) => void;
  className?: string;
  initialTimeRange?: HistoricalTimeRange;
  initialViewMode?: ChartViewMode;
  selectedIndicatorIds?: string[];
}

export function InteractiveEconomicCharts({
  entityA,
  entityB,
  className = '',
  initialTimeRange = '10y',
  initialViewMode = 'all',
}: InteractiveEconomicChartsProps) {
  const { isDarkMode } = useTheme();
  const { t } = useLanguage();
  const [viewMode, setViewMode] = useState<ChartViewMode>(initialViewMode);
  const [activeIndicator, setActiveIndicator] = useState<UnifiedIndicatorKey>('nominalGdp');

  const gdpDiff = Math.abs(entityA.nominalGdp - entityB.nominalGdp);
  const gdpLeader = entityA.nominalGdp >= entityB.nominalGdp ? entityA : entityB;
  const gdpTrailer = entityA.nominalGdp >= entityB.nominalGdp ? entityB : entityA;
  const ratio = (gdpLeader.nominalGdp / Math.max(1, gdpTrailer.nominalGdp)).toFixed(2);

  // Map unified indicator to chart-specific metrics
  const lineMetric: HistoricalMetricKey = (() => {
    switch (activeIndicator) {
      case 'nominalGdp':
        return 'nominalGdp';
      case 'gdpPerCapita':
        return 'gdpPerCapita';
      case 'gdpGrowthRate':
        return 'gdpGrowthRate';
      case 'publicDebtToGdp':
        return 'publicDebtToGdp';
      case 'inflationRate':
        return 'inflationRate';
      case 'unemploymentRate':
        return 'unemploymentRate';
      default:
        return 'nominalGdp';
    }
  })();

  const barMetric: BarChartMetricKey = (() => {
    switch (activeIndicator) {
      case 'nominalGdp':
        return 'nominalGdp';
      case 'gdpPerCapita':
        return 'gdpPerCapitaNominal';
      case 'gdpGrowthRate':
        return 'gdpGrowthRate';
      case 'publicDebtToGdp':
        return 'publicDebtToGdp';
      case 'inflationRate':
        return 'inflationRate';
      case 'unemploymentRate':
        return 'unemploymentRate';
      case 'tradeBalance':
        return 'tradeBalance';
      default:
        return 'nominalGdp';
    }
  })();

  const pieCategory: PieMetricCategory = (() => {
    switch (activeIndicator) {
      case 'sectorShare':
        return 'sector';
      case 'tradeBalance':
        return 'trade';
      case 'publicDebtToGdp':
        return 'fiscal_debt';
      case 'nominalGdp':
      default:
        return 'bilateral_gdp';
    }
  })();

  // Indicator items for the quick switch strip
  const indicatorItems = [
    {
      key: 'nominalGdp' as UnifiedIndicatorKey,
      label: t('nominalGdp'),
      icon: DollarSign,
      valA: entityA.nominalGdp >= 1000 ? `$${(entityA.nominalGdp / 1000).toFixed(1)}T` : `$${entityA.nominalGdp}B`,
      valB: entityB.nominalGdp >= 1000 ? `$${(entityB.nominalGdp / 1000).toFixed(1)}T` : `$${entityB.nominalGdp}B`,
      targetPieCat: 'bilateral_gdp' as PieMetricCategory,
    },
    {
      key: 'gdpPerCapita' as UnifiedIndicatorKey,
      label: t('gdpPerCapita'),
      icon: User,
      valA: `$${Math.round(entityA.gdpPerCapitaNominal).toLocaleString()}`,
      valB: `$${Math.round(entityB.gdpPerCapitaNominal).toLocaleString()}`,
      targetPieCat: 'bilateral_gdp' as PieMetricCategory,
    },
    {
      key: 'gdpGrowthRate' as UnifiedIndicatorKey,
      label: t('growthRate'),
      icon: TrendingUp,
      valA: `${entityA.gdpGrowthRate >= 0 ? '+' : ''}${entityA.gdpGrowthRate.toFixed(1)}%`,
      valB: `${entityB.gdpGrowthRate >= 0 ? '+' : ''}${entityB.gdpGrowthRate.toFixed(1)}%`,
      targetPieCat: 'bilateral_gdp' as PieMetricCategory,
    },
    {
      key: 'publicDebtToGdp' as UnifiedIndicatorKey,
      label: t('publicDebt'),
      icon: Scale,
      valA: `${entityA.publicDebtToGdp.toFixed(1)}%`,
      valB: `${entityB.publicDebtToGdp.toFixed(1)}%`,
      targetPieCat: 'fiscal_debt' as PieMetricCategory,
    },
    {
      key: 'inflationRate' as UnifiedIndicatorKey,
      label: t('inflation'),
      icon: Percent,
      valA: `${entityA.inflationRate.toFixed(1)}%`,
      valB: `${entityB.inflationRate.toFixed(1)}%`,
      targetPieCat: 'bilateral_gdp' as PieMetricCategory,
    },
    {
      key: 'unemploymentRate' as UnifiedIndicatorKey,
      label: t('unemployment'),
      icon: Briefcase,
      valA: `${entityA.unemploymentRate.toFixed(1)}%`,
      valB: `${entityB.unemploymentRate.toFixed(1)}%`,
      targetPieCat: 'bilateral_gdp' as PieMetricCategory,
    },
    {
      key: 'tradeBalance' as UnifiedIndicatorKey,
      label: 'Trade / XNK',
      icon: ArrowRightLeft,
      valA: `$${(entityA.exports ?? 0)}B`,
      valB: `$${(entityB.exports ?? 0)}B`,
      targetPieCat: 'trade' as PieMetricCategory,
    },
    {
      key: 'sectorShare' as UnifiedIndicatorKey,
      label: 'Sectors / GVA',
      icon: Layers,
      valA: `${entityA.sectorShare.services.toFixed(0)}% Serv`,
      valB: `${entityB.sectorShare.services.toFixed(0)}% Serv`,
      targetPieCat: 'sector' as PieMetricCategory,
    },
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header & Mode Switcher Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs transition-colors">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800">
                <BarChart3 className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                <span>{t('chartVisualizationBadge')}</span>
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
                {t('chartInteractiveSubtitle')}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1 tracking-tight flex items-center space-x-2">
              <span>{t('chartMainTitle')}</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
              {t('chartMainDesc', { entityA: entityA.name, entityB: entityB.name })}
            </p>
          </div>

          {/* Segmented View Mode Toggle: All / Line / Bar / Pie */}
          <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700/80 shrink-0 self-start lg:self-center overflow-x-auto max-w-full">
            <button
              id="chart-mode-all-btn"
              onClick={() => setViewMode('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer whitespace-nowrap ${
                viewMode === 'all'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title={t('chartModeAll')}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>{t('chartModeAll')}</span>
            </button>

            <button
              id="chart-mode-line-btn"
              onClick={() => setViewMode('line')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer whitespace-nowrap ${
                viewMode === 'line'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title={t('chartModeLine')}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{t('chartModeLine')}</span>
            </button>

            <button
              id="chart-mode-bar-btn"
              onClick={() => setViewMode('bar')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer whitespace-nowrap ${
                viewMode === 'bar'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title={t('chartModeBar')}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>{t('chartModeBar')}</span>
            </button>

            <button
              id="chart-mode-pie-btn"
              onClick={() => setViewMode('pie')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer whitespace-nowrap ${
                viewMode === 'pie'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title={t('chartModePie')}
            >
              <PieChartIcon className="w-3.5 h-3.5" />
              <span>{t('chartModePie')}</span>
            </button>
          </div>
        </div>

        {/* Unified Indicator Selector Strip (Switch indicators across charts) */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-3xs uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold flex items-center space-x-1">
              <SlidersHorizontal className="w-3 h-3 text-indigo-500" />
              <span>Chọn Chỉ số Kinh tế để Trực quan hóa (Select Economic Indicator)</span>
            </span>
            <span className="text-3xs text-slate-400 dark:text-slate-500">
              Đồng bộ dữ liệu qua Biểu đồ Đường, Cột và Tròn
            </span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {indicatorItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeIndicator === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => setActiveIndicator(item.key)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-medium flex items-center space-x-2 shrink-0 transition-all cursor-pointer border ${
                    isActive
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-indigo-500 dark:text-indigo-400'}`} />
                  <span className="font-semibold">{item.label}</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {item.valA} vs {item.valB}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Summary Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center space-x-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
            <span className="text-2xl">{entityA.flag}</span>
            <div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{entityA.name}</div>
              <div className="text-sm font-black font-mono tabular-nums text-slate-900 dark:text-white">
                ${entityA.nominalGdp >= 1000 ? `${(entityA.nominalGdp / 1000).toFixed(2)}T` : `${entityA.nominalGdp}B`}
                <span className="text-[10px] text-slate-500 font-normal ml-1">USD</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
            <span className="text-2xl">{entityB.flag}</span>
            <div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{entityB.name}</div>
              <div className="text-sm font-black font-mono tabular-nums text-slate-900 dark:text-white">
                ${entityB.nominalGdp >= 1000 ? `${(entityB.nominalGdp / 1000).toFixed(2)}T` : `${entityB.nominalGdp}B`}
                <span className="text-[10px] text-slate-500 font-normal ml-1">USD</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800/60">
            <div>
              <div className="text-[11px] text-indigo-700 dark:text-indigo-300 font-semibold flex items-center space-x-1">
                <Sparkles className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                <span>{t('chartGdpDifference')}</span>
              </div>
              <div className="text-sm font-black font-mono tabular-nums text-indigo-950 dark:text-indigo-200">
                +${gdpDiff >= 1000 ? `${(gdpDiff / 1000).toFixed(2)}T` : `${Math.round(gdpDiff)}B`}
                <span className="text-[10px] font-medium text-indigo-700 dark:text-indigo-300 ml-1">
                  ({ratio}x)
                </span>
              </div>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200">
              {gdpLeader.shortName} {t('chartLeadBadge')}
            </span>
          </div>
        </div>
      </div>

      {/* Main Interactive Visualizations */}
      {viewMode === 'all' ? (
        <div className="space-y-6">
          {/* 1. Multi-Year Trajectory Line Chart */}
          <div className="w-full">
            <InteractiveTrendLineChart
              entityA={entityA}
              entityB={entityB}
              initialRange={initialTimeRange}
              activeMetric={lineMetric}
            />
          </div>

          {/* 2. Comparative Bar Chart */}
          <div className="w-full">
            <ComparativeBarChart
              entityA={entityA}
              entityB={entityB}
              activeMetric={barMetric}
            />
          </div>

          {/* 3. Comparative Pie & Donut Chart */}
          <div className="w-full">
            <ComparativePieChart
              entityA={entityA}
              entityB={entityB}
              activeCategory={pieCategory}
            />
          </div>
        </div>
      ) : viewMode === 'line' ? (
        <InteractiveTrendLineChart
          entityA={entityA}
          entityB={entityB}
          initialRange={initialTimeRange}
          activeMetric={lineMetric}
        />
      ) : viewMode === 'bar' ? (
        <ComparativeBarChart
          entityA={entityA}
          entityB={entityB}
          activeMetric={barMetric}
        />
      ) : (
        <ComparativePieChart
          entityA={entityA}
          entityB={entityB}
          activeCategory={pieCategory}
        />
      )}
    </div>
  );
}
