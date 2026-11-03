import { useState, useMemo } from 'react';
import {
  BarChart2,
  ChevronDown,
  ChevronUp,
  Globe,
  Coins,
  Info,
  DollarSign,
  SlidersHorizontal,
  RotateCcw,
  CheckCircle2,
  Layers,
  Sparkles,
  Download,
  LayoutGrid,
  Table as TableIcon,
  Search,
  Plus,
  X,
  Trophy,
  Check,
  Users,
  Landmark,
  TrendingUp,
  FolderTree,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { EconomicEntity } from '../types';
import {
  getCurrencyInfo,
  formatLargeAmount,
  formatPerCapitaAmount,
  formatTradeBalanceAmount,
} from '../utils/currency';
import {
  ALL_INDICATORS,
  DEFAULT_SELECTED_INDICATOR_IDS,
  INDICATOR_PRESETS,
} from '../data/indicatorsRegistry';
import { IndicatorSelectorModal } from './IndicatorSelectorModal';

interface MetricComparisonTableProps {
  entityA: EconomicEntity;
  entityB: EconomicEntity;
  selectedIndicatorIds?: string[];
  onOpenIndicatorSelector?: () => void;
  onChangeSelectedIds?: (ids: string[]) => void;
  onResetIndicators?: () => void;
}

export type MetricCategoryId = 'productivity' | 'fiscal-health' | 'demographics' | 'trade';

export interface MetricCategoryConfig {
  id: MetricCategoryId;
  name: string;
  tagline: string;
  badgeStyle: string;
  icon: typeof TrendingUp;
  description: string;
}

export const METRIC_CATEGORIES_CONFIG: MetricCategoryConfig[] = [
  {
    id: 'productivity',
    name: 'Productivity',
    tagline: 'Output, Scale & Standards',
    badgeStyle:
      'text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/70 border-indigo-200 dark:border-indigo-800',
    icon: TrendingUp,
    description:
      'Macro output scale, real purchasing parity, global economic standing, and per-capita worker productivity.',
  },
  {
    id: 'fiscal-health',
    name: 'Fiscal Health',
    tagline: 'Stability, Debt & Inflation',
    badgeStyle:
      'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/70 border-rose-200 dark:border-rose-800',
    icon: Landmark,
    description:
      'Sovereign debt leverage, consumer price stability, and real inflation-adjusted economic growth rate.',
  },
  {
    id: 'demographics',
    name: 'Demographics',
    tagline: 'Labor, HDI & Sector Shares',
    badgeStyle:
      'text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/70 border-purple-200 dark:border-purple-800',
    icon: Users,
    description:
      'Population mass, workforce employment rates, human development index, and economic sector distribution.',
  },
  {
    id: 'trade',
    name: 'Trade',
    tagline: 'External Balance & Flows',
    badgeStyle:
      'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/70 border-blue-200 dark:border-blue-800',
    icon: Globe,
    description:
      'Cross-border merchandise trade flows, export power, import dependencies, and net external accounts balance.',
  },
];

interface MetricRowData {
  id: string;
  name: string;
  description: string;
  formatValA: string;
  formatValB: string;
  subValA?: string;
  subValB?: string;
  rawValA: number;
  rawValB: number;
  unit: string;
  isCurrency?: boolean;
  lowerIsBetter?: boolean; // e.g. for unemployment, inflation, debt, global rank
  categoryKey: MetricCategoryId;
  category: 'Productivity' | 'Fiscal Health' | 'Demographics' | 'Trade';
}

export function MetricComparisonTable({
  entityA,
  entityB,
  selectedIndicatorIds: externalSelectedIds,
  onOpenIndicatorSelector,
  onChangeSelectedIds: externalOnChangeSelectedIds,
  onResetIndicators: externalOnResetIndicators,
}: MetricComparisonTableProps) {
  const [internalSelectedIds, setInternalSelectedIds] = useState<string[]>(
    DEFAULT_SELECTED_INDICATOR_IDS
  );
  const [isInternalModalOpen, setIsInternalModalOpen] = useState(false);
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  const [currencyMode, setCurrencyMode] = useState<'usd' | 'native'>('usd');
  const [csvDownloaded, setCsvDownloaded] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [isQuickSelectorOpen, setIsQuickSelectorOpen] = useState(false);
  const [inlineSearch, setInlineSearch] = useState('');
  const [leadFilter, setLeadFilter] = useState<'all' | 'entityA' | 'entityB' | 'tie'>('all');
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<'all' | MetricCategoryId>('all');
  const [isGroupedByCategory, setIsGroupedByCategory] = useState(true);

  // Use either external or internal indicator selections
  const selectedIds = externalSelectedIds ?? internalSelectedIds;
  const setSelectedIds = externalOnChangeSelectedIds ?? setInternalSelectedIds;

  const handleOpenSelector = () => {
    if (onOpenIndicatorSelector) {
      onOpenIndicatorSelector();
    } else {
      setIsInternalModalOpen(true);
    }
  };

  const handleResetToDefault = () => {
    if (externalOnResetIndicators) {
      externalOnResetIndicators();
    } else {
      setInternalSelectedIds(DEFAULT_SELECTED_INDICATOR_IDS);
    }
  };

  const toggleIndicator = (id: string) => {
    if (selectedIds.includes(id)) {
      if (selectedIds.length <= 1) return; // Retain at least 1 indicator
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleApplyPreset = (presetId: string) => {
    const preset = INDICATOR_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setSelectedIds([...preset.indicatorIds]);
    }
  };

  const handleSelectAll = () => {
    setSelectedIds(ALL_INDICATORS.map((i) => i.id));
  };

  const currencyA = getCurrencyInfo(entityA.currency);
  const currencyB = getCurrencyInfo(entityB.currency);
  const sameCurrency = currencyA.code === currencyB.code;

  const toggleCategory = (catId: string) => {
    setCollapsedCategories((prev) => ({ ...prev, [catId]: !prev[catId] }));
  };

  const handleExpandAll = () => {
    setCollapsedCategories({});
  };

  const handleCollapseAll = () => {
    const nextCollapsed: Record<string, boolean> = {};
    METRIC_CATEGORIES_CONFIG.forEach((c) => {
      nextCollapsed[c.id] = true;
    });
    setCollapsedCategories(nextCollapsed);
  };

  // Build the complete 18-indicator data array organized into Productivity, Fiscal Health, Demographics, and Trade
  const allMetrics: MetricRowData[] = useMemo(() => {
    return [
      // ==========================================
      // 1. Productivity
      // ==========================================
      {
        id: 'nominal-gdp',
        name: 'Nominal GDP',
        description: 'Total market value of all finished goods and services evaluated at current exchange rates.',
        formatValA:
          currencyMode === 'usd'
            ? formatLargeAmount(entityA.nominalGdp, 'USD')
            : formatLargeAmount(entityA.nominalGdp, entityA.currency, { showCode: true }),
        formatValB:
          currencyMode === 'usd'
            ? formatLargeAmount(entityB.nominalGdp, 'USD')
            : formatLargeAmount(entityB.nominalGdp, entityB.currency, { showCode: true }),
        subValA:
          currencyMode === 'native' && currencyA.code !== 'USD'
            ? `≈ $${entityA.nominalGdp >= 1000 ? (entityA.nominalGdp / 1000).toFixed(2) + 'T' : entityA.nominalGdp + 'B'} USD`
            : undefined,
        subValB:
          currencyMode === 'native' && currencyB.code !== 'USD'
            ? `≈ $${entityB.nominalGdp >= 1000 ? (entityB.nominalGdp / 1000).toFixed(2) + 'T' : entityB.nominalGdp + 'B'} USD`
            : undefined,
        rawValA: entityA.nominalGdp,
        rawValB: entityB.nominalGdp,
        unit: currencyMode === 'usd' ? '$' : `${currencyA.symbol}/${currencyB.symbol}`,
        isCurrency: true,
        categoryKey: 'productivity',
        category: 'Productivity',
      },
      {
        id: 'ppp-gdp',
        name: 'GDP (PPP)',
        description: 'Gross domestic product adjusted for purchasing power parity (reflects real domestic volume of goods and services).',
        formatValA:
          currencyMode === 'usd'
            ? formatLargeAmount(entityA.gdpPpp, 'USD', { isPpp: true })
            : formatLargeAmount(entityA.gdpPpp, entityA.currency, { isPpp: true, showCode: true }),
        formatValB:
          currencyMode === 'usd'
            ? formatLargeAmount(entityB.gdpPpp, 'USD', { isPpp: true })
            : formatLargeAmount(entityB.gdpPpp, entityB.currency, { isPpp: true, showCode: true }),
        subValA:
          currencyMode === 'native'
            ? `Int$ ${entityA.gdpPpp >= 1000 ? (entityA.gdpPpp / 1000).toFixed(2) + 'T' : entityA.gdpPpp + 'B'}`
            : undefined,
        subValB:
          currencyMode === 'native'
            ? `Int$ ${entityB.gdpPpp >= 1000 ? (entityB.gdpPpp / 1000).toFixed(2) + 'T' : entityB.gdpPpp + 'B'}`
            : undefined,
        rawValA: entityA.gdpPpp,
        rawValB: entityB.gdpPpp,
        unit: 'Int$',
        isCurrency: true,
        categoryKey: 'productivity',
        category: 'Productivity',
      },
      {
        id: 'global-rank',
        name: 'Global GDP Rank (Equivalent)',
        description: 'Global standing in nominal GDP if treated as an autonomous economic entity.',
        formatValA: `#${entityA.globalGdpRank}`,
        formatValB: `#${entityB.globalGdpRank}`,
        rawValA: entityA.globalGdpRank,
        rawValB: entityB.globalGdpRank,
        unit: '',
        lowerIsBetter: true,
        categoryKey: 'productivity',
        category: 'Productivity',
      },
      {
        id: 'gdp-per-capita-nominal',
        name: 'GDP Per Capita (Nominal)',
        description: 'Total nominal GDP divided by total population. Benchmark of average individual economic output.',
        formatValA:
          currencyMode === 'usd'
            ? formatPerCapitaAmount(entityA.gdpPerCapitaNominal, 'USD')
            : formatPerCapitaAmount(entityA.gdpPerCapitaNominal, entityA.currency, { showCode: true }),
        formatValB:
          currencyMode === 'usd'
            ? formatPerCapitaAmount(entityB.gdpPerCapitaNominal, 'USD')
            : formatPerCapitaAmount(entityB.gdpPerCapitaNominal, entityB.currency, { showCode: true }),
        subValA:
          currencyMode === 'native' && currencyA.code !== 'USD'
            ? `≈ $${Math.round(entityA.gdpPerCapitaNominal).toLocaleString()} USD`
            : undefined,
        subValB:
          currencyMode === 'native' && currencyB.code !== 'USD'
            ? `≈ $${Math.round(entityB.gdpPerCapitaNominal).toLocaleString()} USD`
            : undefined,
        rawValA: entityA.gdpPerCapitaNominal,
        rawValB: entityB.gdpPerCapitaNominal,
        unit: currencyMode === 'usd' ? '$' : `${currencyA.symbol}/${currencyB.symbol}`,
        isCurrency: true,
        categoryKey: 'productivity',
        category: 'Productivity',
      },
      {
        id: 'gdp-per-capita-ppp',
        name: 'GDP Per Capita (PPP)',
        description: 'Per capita output adjusted for local living costs, rent, and domestic purchasing power.',
        formatValA:
          currencyMode === 'usd'
            ? formatPerCapitaAmount(entityA.gdpPerCapitaPpp, 'USD', { isPpp: true })
            : formatPerCapitaAmount(entityA.gdpPerCapitaPpp, entityA.currency, { isPpp: true, showCode: true }),
        formatValB:
          currencyMode === 'usd'
            ? formatPerCapitaAmount(entityB.gdpPerCapitaPpp, 'USD', { isPpp: true })
            : formatPerCapitaAmount(entityB.gdpPerCapitaPpp, entityB.currency, { isPpp: true, showCode: true }),
        subValA:
          currencyMode === 'native'
            ? `Int$ ${Math.round(entityA.gdpPerCapitaPpp).toLocaleString()}`
            : undefined,
        subValB:
          currencyMode === 'native'
            ? `Int$ ${Math.round(entityB.gdpPerCapitaPpp).toLocaleString()}`
            : undefined,
        rawValA: entityA.gdpPerCapitaPpp,
        rawValB: entityB.gdpPerCapitaPpp,
        unit: 'Int$',
        isCurrency: true,
        categoryKey: 'productivity',
        category: 'Productivity',
      },

      // ==========================================
      // 2. Fiscal Health
      // ==========================================
      {
        id: 'growth-rate',
        name: 'Real GDP Growth Rate',
        description: 'Annual percentage change in real gross domestic product adjusted for price inflation.',
        formatValA: `${entityA.gdpGrowthRate > 0 ? '+' : ''}${entityA.gdpGrowthRate}%`,
        formatValB: `${entityB.gdpGrowthRate > 0 ? '+' : ''}${entityB.gdpGrowthRate}%`,
        rawValA: entityA.gdpGrowthRate,
        rawValB: entityB.gdpGrowthRate,
        unit: '%',
        categoryKey: 'fiscal-health',
        category: 'Fiscal Health',
      },
      {
        id: 'inflation-rate',
        name: 'Inflation Rate (CPI YoY)',
        description: 'Annual percentage change in the Consumer Price Index, reflecting baseline living cost pressures.',
        formatValA: `${entityA.inflationRate}%`,
        formatValB: `${entityB.inflationRate}%`,
        rawValA: entityA.inflationRate,
        rawValB: entityB.inflationRate,
        unit: '%',
        lowerIsBetter: true,
        categoryKey: 'fiscal-health',
        category: 'Fiscal Health',
      },
      {
        id: 'public-debt',
        name: 'Public Debt to GDP',
        description: 'Total government/state gross debt expressed as a percentage of annual GDP.',
        formatValA: `${entityA.publicDebtToGdp}%`,
        formatValB: `${entityB.publicDebtToGdp}%`,
        rawValA: entityA.publicDebtToGdp,
        rawValB: entityB.publicDebtToGdp,
        unit: '%',
        lowerIsBetter: true,
        categoryKey: 'fiscal-health',
        category: 'Fiscal Health',
      },

      // ==========================================
      // 3. Demographics
      // ==========================================
      {
        id: 'population',
        name: 'Population Scale',
        description: 'Total resident population count in millions.',
        formatValA: `${entityA.population.toLocaleString()} Million`,
        formatValB: `${entityB.population.toLocaleString()} Million`,
        rawValA: entityA.population,
        rawValB: entityB.population,
        unit: 'M',
        categoryKey: 'demographics',
        category: 'Demographics',
      },
      {
        id: 'unemployment-rate',
        name: 'Unemployment Rate',
        description: 'Percentage of the active civilian labor force currently seeking employment.',
        formatValA: `${entityA.unemploymentRate}%`,
        formatValB: `${entityB.unemploymentRate}%`,
        rawValA: entityA.unemploymentRate,
        rawValB: entityB.unemploymentRate,
        unit: '%',
        lowerIsBetter: true,
        categoryKey: 'demographics',
        category: 'Demographics',
      },
      {
        id: 'hdi',
        name: 'Human Development Index (HDI)',
        description: 'Composite index measuring life expectancy, education attainment, and gross national income per capita.',
        formatValA: entityA.hdi.toFixed(3),
        formatValB: entityB.hdi.toFixed(3),
        rawValA: entityA.hdi,
        rawValB: entityB.hdi,
        unit: '0-1.0',
        categoryKey: 'demographics',
        category: 'Demographics',
      },
      {
        id: 'services-share',
        name: 'Services Sector Share',
        description: 'Proportion of total gross value added generated by the tertiary service and technology economy.',
        formatValA: `${entityA.sectorShare.services.toFixed(1)}%`,
        formatValB: `${entityB.sectorShare.services.toFixed(1)}%`,
        rawValA: entityA.sectorShare.services,
        rawValB: entityB.sectorShare.services,
        unit: '% of GDP',
        categoryKey: 'demographics',
        category: 'Demographics',
      },
      {
        id: 'industry-share',
        name: 'Industry & Manufacturing Share',
        description: 'Proportion of GDP produced by manufacturing, mining, construction, and heavy industrial utilities.',
        formatValA: `${entityA.sectorShare.industry.toFixed(1)}%`,
        formatValB: `${entityB.sectorShare.industry.toFixed(1)}%`,
        rawValA: entityA.sectorShare.industry,
        rawValB: entityB.sectorShare.industry,
        unit: '% of GDP',
        categoryKey: 'demographics',
        category: 'Demographics',
      },
      {
        id: 'agriculture-share',
        name: 'Agriculture Sector Share',
        description: 'Proportion of GDP derived from farming, fishing, and raw primary agricultural commodities.',
        formatValA: `${entityA.sectorShare.agriculture.toFixed(1)}%`,
        formatValB: `${entityB.sectorShare.agriculture.toFixed(1)}%`,
        rawValA: entityA.sectorShare.agriculture,
        rawValB: entityB.sectorShare.agriculture,
        unit: '% of GDP',
        categoryKey: 'demographics',
        category: 'Demographics',
      },
      {
        id: 'tech-finance-share',
        name: 'Tech & Finance Intensity',
        description: 'Combined share of advanced software, telecommunications, venture technology, and financial institutions in GDP.',
        formatValA: entityA.sectorShare.techAndFinance !== undefined ? `${entityA.sectorShare.techAndFinance.toFixed(1)}%` : 'N/A',
        formatValB: entityB.sectorShare.techAndFinance !== undefined ? `${entityB.sectorShare.techAndFinance.toFixed(1)}%` : 'N/A',
        rawValA: entityA.sectorShare.techAndFinance ?? 0,
        rawValB: entityB.sectorShare.techAndFinance ?? 0,
        unit: '% of GDP',
        categoryKey: 'demographics',
        category: 'Demographics',
      },

      // ==========================================
      // 4. Trade
      // ==========================================
      {
        id: 'trade-balance',
        name: 'Trade Balance',
        description: 'Net difference between exports and imports of merchandise and commercial services.',
        formatValA:
          currencyMode === 'usd'
            ? formatTradeBalanceAmount(entityA.tradeBalance, 'USD')
            : formatTradeBalanceAmount(entityA.tradeBalance, entityA.currency),
        formatValB:
          currencyMode === 'usd'
            ? formatTradeBalanceAmount(entityB.tradeBalance, 'USD')
            : formatTradeBalanceAmount(entityB.tradeBalance, entityB.currency),
        subValA:
          currencyMode === 'native' && entityA.tradeBalance !== undefined && currencyA.code !== 'USD'
            ? `≈ ${entityA.tradeBalance >= 0 ? '+' : ''}$${entityA.tradeBalance}B USD`
            : undefined,
        subValB:
          currencyMode === 'native' && entityB.tradeBalance !== undefined && currencyB.code !== 'USD'
            ? `≈ ${entityB.tradeBalance >= 0 ? '+' : ''}$${entityB.tradeBalance}B USD`
            : undefined,
        rawValA: entityA.tradeBalance ?? 0,
        rawValB: entityB.tradeBalance ?? 0,
        unit: currencyMode === 'usd' ? '$B' : `${currencyA.symbol}/${currencyB.symbol}`,
        isCurrency: true,
        categoryKey: 'trade',
        category: 'Trade',
      },
      {
        id: 'exports',
        name: 'Gross Exports',
        description: 'Total annual monetary value of domestic merchandise and cross-border commercial services sold abroad.',
        formatValA:
          entityA.exports !== undefined
            ? currencyMode === 'usd'
              ? formatLargeAmount(entityA.exports, 'USD')
              : formatLargeAmount(entityA.exports, entityA.currency, { showCode: true })
            : 'N/A',
        formatValB:
          entityB.exports !== undefined
            ? currencyMode === 'usd'
              ? formatLargeAmount(entityB.exports, 'USD')
              : formatLargeAmount(entityB.exports, entityB.currency, { showCode: true })
            : 'N/A',
        subValA:
          currencyMode === 'native' && entityA.exports !== undefined && currencyA.code !== 'USD'
            ? `≈ $${entityA.exports}B USD`
            : undefined,
        subValB:
          currencyMode === 'native' && entityB.exports !== undefined && currencyB.code !== 'USD'
            ? `≈ $${entityB.exports}B USD`
            : undefined,
        rawValA: entityA.exports ?? 0,
        rawValB: entityB.exports ?? 0,
        unit: currencyMode === 'usd' ? '$B' : `${currencyA.symbol}/${currencyB.symbol}`,
        isCurrency: true,
        categoryKey: 'trade',
        category: 'Trade',
      },
      {
        id: 'imports',
        name: 'Gross Imports',
        description: 'Total annual monetary value of foreign merchandise, commodities, and commercial services imported.',
        formatValA:
          entityA.imports !== undefined
            ? currencyMode === 'usd'
              ? formatLargeAmount(entityA.imports, 'USD')
              : formatLargeAmount(entityA.imports, entityA.currency, { showCode: true })
            : 'N/A',
        formatValB:
          entityB.imports !== undefined
            ? currencyMode === 'usd'
              ? formatLargeAmount(entityB.imports, 'USD')
              : formatLargeAmount(entityB.imports, entityB.currency, { showCode: true })
            : 'N/A',
        subValA:
          currencyMode === 'native' && entityA.imports !== undefined && currencyA.code !== 'USD'
            ? `≈ $${entityA.imports}B USD`
            : undefined,
        subValB:
          currencyMode === 'native' && entityB.imports !== undefined && currencyB.code !== 'USD'
            ? `≈ $${entityB.imports}B USD`
            : undefined,
        rawValA: entityA.imports ?? 0,
        rawValB: entityB.imports ?? 0,
        unit: currencyMode === 'usd' ? '$B' : `${currencyA.symbol}/${currencyB.symbol}`,
        isCurrency: true,
        categoryKey: 'trade',
        category: 'Trade',
      },
    ];
  }, [entityA, entityB, currencyMode, currencyA, currencyB]);

  // Filtered metrics based on user's active selectedIndicatorIds
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const activeMetrics = useMemo(() => {
    return allMetrics.filter((m) => selectedSet.has(m.id));
  }, [allMetrics, selectedSet]);

  // Global Lead calculation & advantages tally across selected indicators
  const leadStats = useMemo(() => {
    let aWins = 0;
    let bWins = 0;
    let ties = 0;
    const aLeadList: string[] = [];
    const bLeadList: string[] = [];

    activeMetrics.forEach((m) => {
      const diff = m.rawValA - m.rawValB;
      if (diff === 0) {
        ties++;
      } else {
        const isALead = m.lowerIsBetter ? diff < 0 : diff > 0;
        if (isALead) {
          aWins++;
          aLeadList.push(m.name);
        } else {
          bWins++;
          bLeadList.push(m.name);
        }
      }
    });

    const total = activeMetrics.length;
    const aPct = total > 0 ? (aWins / total) * 100 : 50;
    const bPct = total > 0 ? (bWins / total) * 100 : 50;

    return { aWins, bWins, ties, aLeadList, bLeadList, total, aPct, bPct };
  }, [activeMetrics]);

  // Per-category lead stats calculation
  const categoryLeadStats = useMemo(() => {
    const stats: Record<
      MetricCategoryId,
      { aWins: number; bWins: number; ties: number; total: number; leader: 'A' | 'B' | 'tie' }
    > = {
      productivity: { aWins: 0, bWins: 0, ties: 0, total: 0, leader: 'tie' },
      'fiscal-health': { aWins: 0, bWins: 0, ties: 0, total: 0, leader: 'tie' },
      demographics: { aWins: 0, bWins: 0, ties: 0, total: 0, leader: 'tie' },
      trade: { aWins: 0, bWins: 0, ties: 0, total: 0, leader: 'tie' },
    };

    activeMetrics.forEach((m) => {
      const cat = m.categoryKey;
      const diff = m.rawValA - m.rawValB;
      stats[cat].total++;
      if (diff === 0) {
        stats[cat].ties++;
      } else {
        const isALead = m.lowerIsBetter ? diff < 0 : diff > 0;
        if (isALead) {
          stats[cat].aWins++;
        } else {
          stats[cat].bWins++;
        }
      }
    });

    Object.keys(stats).forEach((k) => {
      const key = k as MetricCategoryId;
      if (stats[key].aWins > stats[key].bWins) {
        stats[key].leader = 'A';
      } else if (stats[key].bWins > stats[key].aWins) {
        stats[key].leader = 'B';
      } else {
        stats[key].leader = 'tie';
      }
    });

    return stats;
  }, [activeMetrics]);

  // Filtered metrics by lead filter and category tab
  const displayMetrics = useMemo(() => {
    return activeMetrics.filter((m) => {
      if (selectedCategoryTab !== 'all' && m.categoryKey !== selectedCategoryTab) {
        return false;
      }
      if (leadFilter !== 'all') {
        const diff = m.rawValA - m.rawValB;
        if (leadFilter === 'tie') {
          return diff === 0;
        }
        if (leadFilter === 'entityA') {
          const isALead = m.lowerIsBetter ? diff < 0 : diff > 0;
          return isALead && diff !== 0;
        }
        if (leadFilter === 'entityB') {
          const isBLead = m.lowerIsBetter ? diff > 0 : diff < 0;
          return isBLead && diff !== 0;
        }
      }
      return true;
    });
  }, [activeMetrics, selectedCategoryTab, leadFilter]);

  // Visible categories to display when grouped
  const visibleCategories = useMemo(() => {
    if (selectedCategoryTab === 'all') {
      return METRIC_CATEGORIES_CONFIG;
    }
    return METRIC_CATEGORIES_CONFIG.filter((c) => c.id === selectedCategoryTab);
  }, [selectedCategoryTab]);

  // Filtered available indicators for inline multi-select search
  const searchableIndicators = useMemo(() => {
    if (!inlineSearch.trim()) return ALL_INDICATORS;
    const q = inlineSearch.toLowerCase().trim();
    return ALL_INDICATORS.filter(
      (ind) =>
        ind.name.toLowerCase().includes(q) ||
        ind.shortName.toLowerCase().includes(q) ||
        ind.description.toLowerCase().includes(q) ||
        ind.categoryName.toLowerCase().includes(q)
    );
  }, [inlineSearch]);

  const enableAllInCategory = (catId: MetricCategoryId) => {
    const catIndicatorIds = allMetrics
      .filter((m) => m.categoryKey === catId)
      .map((m) => m.id);
    const newSet = new Set([...selectedIds, ...catIndicatorIds]);
    setSelectedIds(Array.from(newSet));
  };

  const handleDownloadCsv = () => {
    if (activeMetrics.length === 0) return;

    const escapeCsv = (val: string | number | undefined) => {
      const s = String(val ?? '');
      if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };

    const headers = [
      'Category',
      'Indicator',
      `${entityA.name} (${currencyMode === 'native' ? currencyA.code : 'USD'})`,
      `${entityB.name} (${currencyMode === 'native' ? currencyB.code : 'USD'})`,
      `${entityA.shortName} Raw Value`,
      `${entityB.shortName} Raw Value`,
      'Unit',
      'Advantage / Leader',
      'Benchmark Description',
    ];

    const dataRows = activeMetrics.map((m) => {
      const diff = m.rawValA - m.rawValB;
      let advantage = 'Parity / Even';
      if (diff !== 0) {
        const isALead = m.lowerIsBetter ? diff < 0 : diff > 0;
        advantage = isALead ? `${entityA.shortName} Advantage` : `${entityB.shortName} Advantage`;
      }

      return [
        escapeCsv(m.category),
        escapeCsv(m.name),
        escapeCsv(m.formatValA),
        escapeCsv(m.formatValB),
        escapeCsv(m.rawValA),
        escapeCsv(m.rawValB),
        escapeCsv(m.unit),
        escapeCsv(advantage),
        escapeCsv(m.description),
      ].join(',');
    });

    const metadataRows = [
      `# Macroeconomic Indicator Comparison: ${entityA.name} vs. ${entityB.name}`,
      `# Export Date: ${new Date().toISOString().split('T')[0]}`,
      `# Denomination Baseline: ${currencyMode === 'usd' ? 'Standardized Global USD ($)' : `Native Legal Tender (${currencyA.code} / ${currencyB.code})`}`,
      `# Filtered Indicators: ${activeMetrics.length} of ${allMetrics.length} Active`,
      `# Grouped Categories: Demographics, Fiscal Health, Productivity, Trade`,
      '',
    ];

    const csvContent =
      '\uFEFF' + [...metadataRows, headers.map(escapeCsv).join(','), ...dataRows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const cleanA = entityA.shortName.replace(/[^a-zA-Z0-9]/g, '_');
    const cleanB = entityB.shortName.replace(/[^a-zA-Z0-9]/g, '_');
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', `Macro_Indicators_${cleanA}_vs_${cleanB}_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setCsvDownloaded(true);
    setTimeout(() => setCsvDownloaded(false), 2500);
  };

  // Helper render function for an individual metric card
  const renderMetricCard = (row: MetricRowData) => {
    const diff = row.rawValA - row.rawValB;
    const isAWinner = row.lowerIsBetter ? diff < 0 : diff > 0;
    const isBWinner = row.lowerIsBetter ? diff > 0 : diff < 0;
    const isTie = diff === 0;

    // Compute proportional split bar
    const sum = Math.abs(row.rawValA) + Math.abs(row.rawValB);
    const pctA = sum > 0 ? (Math.abs(row.rawValA) / sum) * 100 : 50;
    const pctB = sum > 0 ? (Math.abs(row.rawValB) / sum) * 100 : 50;

    // Percentage lead
    const baseline = Math.min(Math.abs(row.rawValA), Math.abs(row.rawValB));
    const pctAdvantage =
      baseline > 0 ? (Math.abs(row.rawValA - row.rawValB) / baseline) * 100 : null;

    const catConfig = METRIC_CATEGORIES_CONFIG.find((c) => c.id === row.categoryKey);

    return (
      <div
        key={row.id}
        id={`metric-card-${row.id}`}
        className={`p-4 rounded-xl border transition-all flex flex-col justify-between relative group ${
          isAWinner
            ? 'bg-gradient-to-br from-indigo-50/50 via-white to-slate-50 dark:from-indigo-950/25 dark:via-slate-900 dark:to-slate-900 border-indigo-200/90 dark:border-indigo-900/60 shadow-2xs hover:shadow-xs'
            : isBWinner
            ? 'bg-gradient-to-br from-emerald-50/50 via-white to-slate-50 dark:from-emerald-950/25 dark:via-slate-900 dark:to-slate-900 border-emerald-200/90 dark:border-emerald-900/60 shadow-2xs hover:shadow-xs'
            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xs'
        }`}
      >
        {/* Card Top: Category Tag + Remove Button */}
        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center space-x-1.5 overflow-hidden">
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border truncate ${
                  catConfig ? catConfig.badgeStyle : 'bg-slate-100 text-slate-600'
                }`}
              >
                {row.category}
              </span>
              {row.lowerIsBetter && (
                <span
                  className="text-[10px] text-amber-600 dark:text-amber-400 font-medium bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-200/60 dark:border-amber-800/60 shrink-0"
                  title="Lower number indicates comparative strength"
                >
                  Lower is better (↓)
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => toggleIndicator(row.id)}
              className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors opacity-70 group-hover:opacity-100 cursor-pointer"
              title={`Remove ${row.name} from comparison view`}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Indicator Title & Benchmark Description */}
          <div className="mb-3">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              {row.name}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
              {row.description}
            </p>
          </div>

          {/* Side-by-Side Values Comparison Strip */}
          <div className="grid grid-cols-2 gap-3 py-3 px-3 bg-slate-50/90 dark:bg-slate-800/60 rounded-lg border border-slate-200/70 dark:border-slate-700/70 my-2">
            {/* Entity A */}
            <div className="text-left">
              <div className="flex items-center space-x-1 text-xs text-slate-500 dark:text-slate-400 mb-0.5">
                <span>{entityA.flag}</span>
                <span className="truncate font-medium">{entityA.shortName}</span>
              </div>
              <div
                className={`text-base font-black ${
                  isAWinner
                    ? 'text-indigo-700 dark:text-indigo-400'
                    : 'text-slate-800 dark:text-slate-200'
                }`}
              >
                {row.formatValA}
              </div>
              {row.subValA && (
                <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                  {row.subValA}
                </div>
              )}
            </div>

            {/* Entity B */}
            <div className="text-right">
              <div className="flex items-center justify-end space-x-1 text-xs text-slate-500 dark:text-slate-400 mb-0.5">
                <span className="truncate font-medium">{entityB.shortName}</span>
                <span>{entityB.flag}</span>
              </div>
              <div
                className={`text-base font-black ${
                  isBWinner
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-slate-800 dark:text-slate-200'
                }`}
              >
                {row.formatValB}
              </div>
              {row.subValB && (
                <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                  {row.subValB}
                </div>
              )}
            </div>
          </div>

          {/* Proportional Balance Bar */}
          <div className="space-y-1 my-2">
            <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex">
              <div
                style={{ width: `${pctA}%` }}
                className="bg-indigo-500 h-full transition-all duration-300"
              />
              <div
                style={{ width: `${pctB}%` }}
                className="bg-emerald-500 h-full transition-all duration-300"
              />
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span className={isAWinner ? 'text-indigo-600 dark:text-indigo-400 font-bold' : ''}>
                {pctA.toFixed(0)}%
              </span>
              <span className={isBWinner ? 'text-emerald-600 dark:text-emerald-400 font-bold' : ''}>
                {pctB.toFixed(0)}%
              </span>
            </div>
          </div>
        </div>

        {/* Card Bottom: Advantage Verdict */}
        <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
          {isTie ? (
            <span className="text-slate-500 font-medium">Parity / Balanced</span>
          ) : isAWinner ? (
            <span className="inline-flex items-center text-xs font-bold text-indigo-700 dark:text-indigo-300">
              <Trophy className="w-3.5 h-3.5 mr-1 text-indigo-600 dark:text-indigo-400" />
              {entityA.shortName} Lead
              {pctAdvantage && pctAdvantage < 1000 ? ` (+${pctAdvantage.toFixed(1)}%)` : ''}
            </span>
          ) : (
            <span className="inline-flex items-center text-xs font-bold text-emerald-700 dark:text-emerald-300">
              <Trophy className="w-3.5 h-3.5 mr-1 text-emerald-600 dark:text-emerald-400" />
              {entityB.shortName} Lead
              {pctAdvantage && pctAdvantage < 1000 ? ` (+${pctAdvantage.toFixed(1)}%)` : ''}
            </span>
          )}

          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
            {row.unit}
          </span>
        </div>
      </div>
    );
  };

  // Helper render function for an individual metric table row
  const renderMetricTableRow = (row: MetricRowData) => {
    const isAWinner = row.lowerIsBetter
      ? row.rawValA < row.rawValB
      : row.rawValA > row.rawValB;
    const isBWinner = row.lowerIsBetter
      ? row.rawValB < row.rawValA
      : row.rawValB > row.rawValA;
    const isTie = row.rawValA === row.rawValB;

    const sum = Math.abs(row.rawValA) + Math.abs(row.rawValB);
    const pctA = sum > 0 ? (Math.abs(row.rawValA) / sum) * 100 : 50;
    const pctB = sum > 0 ? (Math.abs(row.rawValB) / sum) * 100 : 50;

    return (
      <div
        key={row.id}
        id={`metric-row-${row.id}`}
        className="px-4 sm:px-5 py-3.5 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
      >
        {/* Metric Title & Description */}
        <div className="sm:col-span-4">
          <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {row.name}
            </span>
            {row.isCurrency && currencyMode === 'native' && (
              <span className="text-[10px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-800/70 px-1 rounded font-medium">
                Native
              </span>
            )}
            {row.lowerIsBetter && (
              <span
                className="text-[9px] text-slate-400 dark:text-slate-500 font-mono"
                title="Lower number indicates comparative strength"
              >
                (↓)
              </span>
            )}
            {!isGroupedByCategory && (
              <span className="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                {row.category}
              </span>
            )}
          </div>
          <p
            className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5"
            title={row.description}
          >
            {row.description}
          </p>
        </div>

        {/* Entity A Value */}
        <div className="sm:col-span-3 flex items-center justify-between sm:justify-end sm:space-x-3">
          <span className="text-xs text-slate-400 sm:hidden">
            {entityA.shortName}
            {currencyMode === 'native' && row.isCurrency ? ` (${currencyA.code})` : ''}:
          </span>
          <div className="text-right">
            <div className="flex items-center justify-end space-x-1.5">
              <span
                className={`text-sm font-bold ${
                  isAWinner
                    ? 'text-indigo-700 dark:text-indigo-400 font-extrabold'
                    : 'text-slate-800 dark:text-slate-200'
                }`}
              >
                {row.formatValA}
              </span>
              {isAWinner && !isTie && (
                <span className="text-[10px] font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800/80 px-1.5 py-0.2 rounded inline-block">
                  Lead
                </span>
              )}
            </div>
            {row.subValA && (
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono block mt-0.5">
                {row.subValA}
              </span>
            )}
          </div>
        </div>

        {/* Comparison Balance Visual Bar */}
        <div className="sm:col-span-2 hidden sm:flex flex-col items-center justify-center">
          <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex">
            <div
              style={{ width: `${pctA}%` }}
              className="h-full bg-indigo-500 transition-all duration-300"
              title={`${entityA.shortName}: ${pctA.toFixed(1)}%`}
            />
            <div
              style={{ width: `${pctB}%` }}
              className="h-full bg-emerald-500 transition-all duration-300"
              title={`${entityB.shortName}: ${pctB.toFixed(1)}%`}
            />
          </div>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-mono">
            {pctA.toFixed(0)}% : {pctB.toFixed(0)}%
          </span>
        </div>

        {/* Entity B Value */}
        <div className="sm:col-span-3 flex items-center justify-between sm:justify-start sm:space-x-3">
          <span className="text-xs text-slate-400 sm:hidden">
            {entityB.shortName}
            {currencyMode === 'native' && row.isCurrency ? ` (${currencyB.code})` : ''}:
          </span>
          <div className="text-left">
            <div className="flex items-center justify-start space-x-1.5">
              <span
                className={`text-sm font-bold ${
                  isBWinner
                    ? 'text-emerald-700 dark:text-emerald-400 font-extrabold'
                    : 'text-slate-800 dark:text-slate-200'
                }`}
              >
                {row.formatValB}
              </span>
              {isBWinner && !isTie && (
                <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800/80 px-1.5 py-0.2 rounded inline-block">
                  Lead
                </span>
              )}
            </div>
            {row.subValB && (
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono block mt-0.5">
                {row.subValB}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      id="metric-comparison-table-card"
      className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition-colors"
    >
      {/* Table Top Header */}
      <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Comparative Macroeconomic Indicator Specification
            </h3>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              {activeMetrics.length} of {allMetrics.length} Indicators Active
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Compare key economic metrics grouped across <strong>Demographics</strong>, <strong>Fiscal Health</strong>, <strong>Productivity</strong>, and <strong>Trade</strong>.
          </p>
        </div>

        {/* Action Controls: View Switcher, Inline Picker, Indicator Customizer, CSV, Currency */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full md:w-auto justify-between md:justify-end">
          {/* View Format Switcher (Cards vs Table) */}
          <div
            id="comparison-view-mode-switcher"
            role="group"
            aria-label="Comparative display format"
            className="inline-flex items-center p-1 bg-slate-200/70 dark:bg-slate-800 rounded-lg border border-slate-300/80 dark:border-slate-700 text-xs shadow-2xs"
          >
            <button
              id="view-mode-cards-btn"
              type="button"
              onClick={() => setViewMode('cards')}
              className={`px-2.5 py-1.5 rounded-md font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-2xs border border-slate-200/90 dark:border-slate-600 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title="View chosen indicators as side-by-side comparative cards"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Cards Grid</span>
            </button>

            <button
              id="view-mode-table-btn"
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1.5 rounded-md font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-2xs border border-slate-200/90 dark:border-slate-600 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title="View chosen indicators in a categorized specification table"
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Spec Table</span>
            </button>
          </div>

          {/* Quick Indicator Selector Toggle Button */}
          <button
            id="toggle-inline-indicator-selector-btn"
            type="button"
            onClick={() => setIsQuickSelectorOpen((prev) => !prev)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-2xs cursor-pointer ${
              isQuickSelectorOpen
                ? 'bg-indigo-600 text-white'
                : 'bg-indigo-50 dark:bg-slate-800 hover:bg-indigo-100 hover:dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-slate-700'
            }`}
            title="Toggle inline indicator selector to pick and compare specific metrics"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Select Indicators</span>
            <span
              className={`px-1.5 py-0.2 rounded text-[10px] font-bold font-mono ${
                isQuickSelectorOpen
                  ? 'bg-white/20 text-white'
                  : 'bg-indigo-200/70 dark:bg-indigo-900/60 text-indigo-900 dark:text-indigo-200'
              }`}
            >
              {activeMetrics.length}/{allMetrics.length}
            </span>
          </button>

          {/* Download as CSV Button */}
          <button
            id="download-as-csv-btn"
            type="button"
            onClick={handleDownloadCsv}
            disabled={activeMetrics.length === 0}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-2xs cursor-pointer ${
              csvDownloaded
                ? 'bg-emerald-600 text-white'
                : activeMetrics.length === 0
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-60'
                : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
            }`}
            title="Download current view of filtered indicators as CSV"
          >
            {csvDownloaded ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                <span>CSV Downloaded!</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>CSV</span>
              </>
            )}
          </button>

          {/* Currency Switcher Segmented Control */}
          <div
            id="currency-switcher-control"
            role="group"
            aria-label="Currency denomination switcher"
            className="inline-flex items-center p-1 bg-slate-200/70 dark:bg-slate-800 rounded-lg border border-slate-300/80 dark:border-slate-700 text-xs shadow-2xs"
          >
            <button
              id="currency-switch-usd-btn"
              type="button"
              onClick={() => setCurrencyMode('usd')}
              className={`px-2.5 py-1.5 rounded-md font-semibold flex items-center space-x-1.5 transition-all ${
                currencyMode === 'usd'
                  ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-2xs border border-slate-200/90 dark:border-slate-600 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title="Standardize all monetary metrics in USD ($) for direct parity"
            >
              <Globe className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>USD ($)</span>
            </button>

            <button
              id="currency-switch-native-btn"
              type="button"
              onClick={() => setCurrencyMode('native')}
              className={`px-2.5 py-1.5 rounded-md font-semibold flex items-center space-x-1.5 transition-all ${
                currencyMode === 'native'
                  ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-2xs border border-slate-200/90 dark:border-slate-600 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title="Display monetary metrics in each entity's sovereign or regional legal tender"
            >
              <Coins className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Native</span>
            </button>
          </div>

          {/* Legend */}
          <div className="hidden xl:flex items-center space-x-3 text-xs pl-2 border-l border-slate-300/70 dark:border-slate-700">
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 dark:bg-indigo-400"></span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {entityA.shortName}
              </span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 dark:bg-emerald-400"></span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {entityB.shortName}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Category Navigation & Grouping Toolbar */}
      <div
        id="metric-category-navigation-bar"
        className="px-4 sm:px-5 py-2.5 bg-slate-100/70 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3"
      >
        {/* Category Filter & Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline">
            Category:
          </span>
          {/* All Categories Tab */}
          <button
            id="cat-tab-all"
            type="button"
            onClick={() => setSelectedCategoryTab('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
              selectedCategoryTab === 'all'
                ? 'bg-indigo-600 text-white shadow-2xs font-bold'
                : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All Categories</span>
            <span
              className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                selectedCategoryTab === 'all'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
              }`}
            >
              {activeMetrics.length}
            </span>
          </button>

          {/* Specific Category Tabs (Productivity, Fiscal Health, Demographics, Trade) */}
          {METRIC_CATEGORIES_CONFIG.map((catConfig) => {
            const Icon = catConfig.icon;
            const catMetricsCount = activeMetrics.filter((m) => m.categoryKey === catConfig.id).length;
            const totalCatCount = allMetrics.filter((m) => m.categoryKey === catConfig.id).length;
            const isSelected = selectedCategoryTab === catConfig.id;

            return (
              <button
                key={catConfig.id}
                id={`cat-tab-${catConfig.id}`}
                type="button"
                onClick={() => setSelectedCategoryTab(catConfig.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-2xs font-bold'
                    : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                }`}
                title={`${catConfig.name}: ${catConfig.description}`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{catConfig.name}</span>
                <span
                  className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {catMetricsCount}/{totalCatCount}
                </span>
              </button>
            );
          })}
        </div>

        {/* Grouping and Expansion Controls */}
        <div className="flex items-center space-x-2 self-end md:self-auto">
          {/* Group By Category Toggle */}
          <button
            id="toggle-group-by-category-btn"
            type="button"
            onClick={() => setIsGroupedByCategory((prev) => !prev)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer border ${
              isGroupedByCategory
                ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 shadow-2xs font-bold'
                : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
            }`}
            title="Group indicators into categories like Demographics, Fiscal Health, Productivity, and Trade"
          >
            <FolderTree className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>{isGroupedByCategory ? 'Grouped by Category' : 'Flat List'}</span>
          </button>

          {/* Expand / Collapse All (available when grouped) */}
          {isGroupedByCategory && (
            <div className="flex items-center space-x-1 border-l border-slate-300/70 dark:border-slate-700 pl-2">
              <button
                id="expand-all-categories-btn"
                type="button"
                onClick={handleExpandAll}
                className="px-2 py-1 rounded-md text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700 transition-colors flex items-center space-x-1 cursor-pointer"
                title="Expand all category sections"
              >
                <Maximize2 className="w-3 h-3 text-slate-400" />
                <span className="hidden sm:inline">Expand All</span>
              </button>
              <button
                id="collapse-all-categories-btn"
                type="button"
                onClick={handleCollapseAll}
                className="px-2 py-1 rounded-md text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700 transition-colors flex items-center space-x-1 cursor-pointer"
                title="Collapse all category sections"
              >
                <Minimize2 className="w-3 h-3 text-slate-400" />
                <span className="hidden sm:inline">Collapse All</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Inline Multi-Indicator Selection & Customization Center */}
      {isQuickSelectorOpen && (
        <div
          id="inline-indicator-selector-panel"
          className="p-4 sm:p-5 bg-gradient-to-br from-indigo-50/70 via-white to-slate-50 dark:from-indigo-950/40 dark:via-slate-900 dark:to-slate-900/90 border-b border-indigo-100 dark:border-indigo-900/50 transition-all space-y-4"
        >
          {/* Header of Selector Panel */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <SlidersHorizontal className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Select Economic Indicators for Comparison
                </h4>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Toggle specific metrics to compare inflation, unemployment, trade balance, HDI, GDP, and sovereign debt across categories.
              </p>
            </div>

            {/* Quick Actions & Modal Trigger */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <button
                type="button"
                onClick={handleSelectAll}
                className="px-2.5 py-1 rounded-md font-semibold bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 cursor-pointer transition-colors shadow-2xs"
              >
                Select All (18)
              </button>
              <button
                type="button"
                onClick={handleResetToDefault}
                className="px-2.5 py-1 rounded-md font-semibold bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 cursor-pointer transition-colors shadow-2xs flex items-center space-x-1"
              >
                <RotateCcw className="w-3 h-3 text-slate-400" />
                <span>Reset Defaults (11)</span>
              </button>
              <button
                type="button"
                onClick={handleOpenSelector}
                className="px-2.5 py-1 rounded-md font-semibold bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer transition-colors shadow-2xs flex items-center space-x-1"
                title="Open comprehensive indicator modal with descriptions and methodology"
              >
                <span>Full Catalog (Press I)</span>
                <span>↗</span>
              </button>
            </div>
          </div>

          {/* Preset Buttons */}
          <div>
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Recommended Comparison Presets:</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {INDICATOR_PRESETS.map((preset) => {
                const isCurrent =
                  preset.indicatorIds.length === selectedIds.length &&
                  preset.indicatorIds.every((id) => selectedSet.has(id));
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleApplyPreset(preset.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-indigo-600 text-white shadow-xs font-bold'
                        : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <span>{preset.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search Input for Quick Filtering Indicators */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={inlineSearch}
              onChange={(e) => setInlineSearch(e.target.value)}
              placeholder="Filter indicators by keyword (e.g. inflation, unemployment, trade, HDI, debt)..."
              className="w-full pl-9 pr-8 py-1.5 text-xs bg-white dark:bg-slate-800/90 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all shadow-2xs"
            />
            {inlineSearch && (
              <button
                type="button"
                onClick={() => setInlineSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Indicator Multi-Select Chips Grid */}
          <div className="flex flex-wrap gap-2 max-h-56 overflow-y-auto pr-1 py-1">
            {searchableIndicators.map((indicator) => {
              const isSelected = selectedSet.has(indicator.id);
              return (
                <button
                  key={indicator.id}
                  type="button"
                  onClick={() => toggleIndicator(indicator.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-2 transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-900 dark:text-indigo-200 border-indigo-300 dark:border-indigo-700 shadow-2xs'
                      : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                  }`}
                  title={`${indicator.name}: ${indicator.description}`}
                >
                  <span
                    className={`w-3.5 h-3.5 rounded flex items-center justify-center shrink-0 border ${
                      isSelected
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'border-slate-300 dark:border-slate-600 bg-transparent'
                    }`}
                  >
                    {isSelected ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : null}
                  </span>
                  <span className="font-semibold">{indicator.shortName}</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                    ({indicator.unit})
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Comparative Lead Scorecard Banner */}
      <div
        id="comparative-lead-scorecard-banner"
        className="px-4 sm:px-5 py-3 bg-linear-to-r from-indigo-50/70 via-white to-emerald-50/70 dark:from-indigo-950/40 dark:via-slate-900 dark:to-emerald-950/30 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 transition-colors"
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Tally Score */}
          <div className="flex items-center space-x-2.5">
            <span className="p-1 rounded-md bg-indigo-100 dark:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 shrink-0">
              <Trophy className="w-4 h-4" />
            </span>
            <div>
              <div className="flex items-center space-x-2 text-xs">
                <span className="font-extrabold text-indigo-700 dark:text-indigo-400">
                  {entityA.flag} {entityA.shortName}: {leadStats.aWins} Leads
                </span>
                <span className="text-slate-400">•</span>
                <span className="font-extrabold text-emerald-700 dark:text-emerald-400">
                  {entityB.flag} {entityB.shortName}: {leadStats.bWins} Leads
                </span>
                {leadStats.ties > 0 && (
                  <>
                    <span className="text-slate-400">•</span>
                    <span className="font-semibold text-slate-500">{leadStats.ties} Ties</span>
                  </>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Evaluated across <strong>{activeMetrics.length}</strong> active indicators with lower-is-better metrics inverted.
              </p>
            </div>
          </div>

          {/* Visual Lead Ratio Bar */}
          <div className="w-36 hidden lg:block">
            <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex">
              <div
                style={{ width: `${leadStats.aPct}%` }}
                className="bg-indigo-500 h-full transition-all duration-300"
                title={`${entityA.shortName}: ${leadStats.aWins} Leads`}
              />
              <div
                style={{ width: `${leadStats.bPct}%` }}
                className="bg-emerald-500 h-full transition-all duration-300"
                title={`${entityB.shortName}: ${leadStats.bWins} Leads`}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mt-0.5">
              <span>{leadStats.aWins}</span>
              <span>{leadStats.bWins}</span>
            </div>
          </div>
        </div>

        {/* Filter by Advantage Pill Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 self-end md:self-auto">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline">
            Advantage:
          </span>
          <button
            type="button"
            onClick={() => setLeadFilter('all')}
            className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
              leadFilter === 'all'
                ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900 shadow-2xs'
                : 'bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200/80 dark:border-slate-700/80'
            }`}
          >
            All ({activeMetrics.length})
          </button>
          <button
            type="button"
            onClick={() => setLeadFilter('entityA')}
            className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
              leadFilter === 'entityA'
                ? 'bg-indigo-600 text-white shadow-2xs font-bold'
                : 'bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300 border border-slate-200/80 dark:border-slate-700/80'
            }`}
          >
            {entityA.shortName} Leads ({leadStats.aWins})
          </button>
          <button
            type="button"
            onClick={() => setLeadFilter('entityB')}
            className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
              leadFilter === 'entityB'
                ? 'bg-emerald-600 text-white shadow-2xs font-bold'
                : 'bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-300 border border-slate-200/80 dark:border-slate-700/80'
            }`}
          >
            {entityB.shortName} Leads ({leadStats.bWins})
          </button>
        </div>
      </div>

      {/* Native Currency Informational Drawer */}
      {currencyMode === 'native' && (
        <div
          id="native-currency-banner"
          className="px-4 sm:px-5 py-2.5 bg-linear-to-r from-indigo-50/80 via-white to-amber-50/60 dark:from-indigo-950/40 dark:via-slate-900 dark:to-amber-950/30 border-b border-indigo-100/80 dark:border-indigo-900/50 text-xs text-slate-700 dark:text-slate-300 flex flex-col md:flex-row md:items-center justify-between gap-2.5 transition-all"
        >
          <div className="flex items-center space-x-2">
            <span className="p-1 rounded bg-indigo-100 dark:bg-indigo-900/70 text-indigo-700 dark:text-indigo-300 shrink-0">
              <Info className="w-3.5 h-3.5" />
            </span>
            <span>
              <strong>Native Currencies active:</strong> {entityA.name} in{' '}
              <span className="font-semibold text-indigo-900 dark:text-indigo-300 bg-indigo-100/70 dark:bg-indigo-950/80 px-1 py-0.5 rounded border dark:border-indigo-800/60">
                {currencyA.name} ({currencyA.symbol} {currencyA.code})
              </span>{' '}
              and {entityB.name} in{' '}
              <span className="font-semibold text-emerald-900 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-950/80 px-1 py-0.5 rounded border dark:border-emerald-800/60">
                {currencyB.name} ({currencyB.symbol} {currencyB.code})
              </span>
              .
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-2xs text-slate-600 dark:text-slate-400 font-mono shrink-0">
            <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
              1 USD = {currencyA.rateVsUsd} {currencyA.code}
            </span>
            {!sameCurrency && (
              <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
                1 USD = {currencyB.rateVsUsd} {currencyB.code}
              </span>
            )}
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-sans italic ml-1">
              (Benchmark FX)
            </span>
          </div>
        </div>
      )}

      {/* Main Comparative Presentation: Cards View vs Specification Table View */}
      {displayMetrics.length === 0 ? (
        <div className="p-12 text-center">
          <SlidersHorizontal className="w-10 h-10 text-slate-400 mx-auto mb-3 opacity-60" />
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            No Indicators Match Current Filter
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
            {leadFilter !== 'all'
              ? `No indicators found where selected filter is active. Clear the filter to see all active indicators.`
              : `You have deselected all macroeconomic indicators for this view. Use the customizer to toggle the indicators you wish to compare.`}
          </p>
          <div className="mt-4 flex items-center justify-center space-x-2">
            {leadFilter !== 'all' ? (
              <button
                type="button"
                onClick={() => setLeadFilter('all')}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors cursor-pointer"
              >
                Clear Filter ({activeMetrics.length} Active)
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleOpenSelector}
                  className="px-4 py-2 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors cursor-pointer"
                >
                  Select Indicators
                </button>
                <button
                  type="button"
                  onClick={handleResetToDefault}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Reset to Default (11)
                </button>
              </>
            )}
          </div>
        </div>
      ) : viewMode === 'cards' ? (
        /* =========================================================
           FORMAT 1: Side-by-Side Comparative Cards View
           ========================================================= */
        <div className="p-4 sm:p-5">
          {isGroupedByCategory ? (
            /* Grouped by Categories (Productivity, Fiscal Health, Demographics, Trade) */
            <div className="space-y-6">
              {visibleCategories.map((catConfig) => {
                const isCollapsed = !!collapsedCategories[catConfig.id];
                const catMetrics = displayMetrics.filter((m) => m.categoryKey === catConfig.id);
                const totalCatCount = allMetrics.filter((m) => m.categoryKey === catConfig.id).length;
                const catStats = categoryLeadStats[catConfig.id];
                const Icon = catConfig.icon;

                return (
                  <div
                    key={catConfig.id}
                    id={`metric-category-card-${catConfig.id}`}
                    className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-2xs overflow-hidden transition-all"
                  >
                    {/* Category Header Banner */}
                    <div
                      onClick={() => toggleCategory(catConfig.id)}
                      className="px-4 sm:px-5 py-3.5 bg-slate-50/80 dark:bg-slate-800/60 hover:bg-slate-100/70 hover:dark:bg-slate-800 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 cursor-pointer border-b border-slate-200/80 dark:border-slate-800"
                    >
                      <div className="flex items-center space-x-3">
                        <span className={`p-2 rounded-lg border ${catConfig.badgeStyle}`}>
                          <Icon className="w-4 h-4" />
                        </span>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                              {catConfig.name}
                            </h4>
                            <span className="text-xs text-slate-400 dark:text-slate-500 font-normal hidden md:inline">
                              • {catConfig.tagline}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              {catMetrics.length} of {totalCatCount} Active
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                            {catConfig.description}
                          </p>
                        </div>
                      </div>

                      {/* Category Advantage Tally + Collapse Chevron */}
                      <div className="flex items-center space-x-3 self-end sm:self-auto">
                        {catMetrics.length > 0 && catStats && (
                          <div className="flex items-center space-x-1.5 text-xs">
                            {catStats.leader === 'A' ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md font-bold bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                <Trophy className="w-3 h-3 mr-1 text-indigo-600 dark:text-indigo-400" />
                                {entityA.shortName} Leads {catStats.aWins}-{catStats.bWins}
                              </span>
                            ) : catStats.leader === 'B' ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md font-bold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                <Trophy className="w-3 h-3 mr-1 text-emerald-600 dark:text-emerald-400" />
                                {entityB.shortName} Leads {catStats.bWins}-{catStats.aWins}
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                Even {catStats.aWins}-{catStats.bWins}
                              </span>
                            )}
                          </div>
                        )}

                        <button
                          type="button"
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded transition-colors"
                          aria-label={isCollapsed ? `Expand ${catConfig.name}` : `Collapse ${catConfig.name}`}
                        >
                          {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Category Cards Grid Body */}
                    {!isCollapsed && (
                      <div className="p-4 sm:p-5">
                        {catMetrics.length === 0 ? (
                          <div className="py-6 text-center text-xs text-slate-400">
                            <p>No indicators active in {catConfig.name}.</p>
                            <button
                              type="button"
                              onClick={() => enableAllInCategory(catConfig.id)}
                              className="mt-2 text-indigo-600 dark:text-indigo-400 font-semibold hover:underline cursor-pointer"
                            >
                              Enable all {totalCatCount} {catConfig.name} indicators
                            </button>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {catMetrics.map(renderMetricCard)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            /* Flat Cards Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayMetrics.map(renderMetricCard)}
            </div>
          )}

          {/* Quick Add Metric Card at bottom */}
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setIsQuickSelectorOpen(true)}
              className="w-full p-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-600 bg-slate-50/50 dark:bg-slate-900/40 hover:bg-indigo-50/30 hover:dark:bg-indigo-950/20 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all flex items-center justify-center space-x-2 text-center cursor-pointer"
            >
              <Plus className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                + Add Another Economic Indicator ({allMetrics.length - activeMetrics.length} available)
              </span>
            </button>
          </div>
        </div>
      ) : (
        /* =========================================================
           FORMAT 2: Categorized Specification Table View
           ========================================================= */
        <div>
          {isGroupedByCategory ? (
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {visibleCategories.map((catConfig) => {
                const isCollapsed = !!collapsedCategories[catConfig.id];
                const catMetrics = displayMetrics.filter((m) => m.categoryKey === catConfig.id);
                const totalCatCount = allMetrics.filter((m) => m.categoryKey === catConfig.id).length;
                const catStats = categoryLeadStats[catConfig.id];
                const Icon = catConfig.icon;

                return (
                  <div key={catConfig.id} id={`metric-group-${catConfig.id}`}>
                    {/* Category Header */}
                    <button
                      type="button"
                      onClick={() => toggleCategory(catConfig.id)}
                      className="w-full px-4 sm:px-5 py-3 bg-slate-100/60 dark:bg-slate-800/60 hover:bg-slate-100 hover:dark:bg-slate-800 flex items-center justify-between text-left transition-colors cursor-pointer"
                    >
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center space-x-2">
                        <span className={`p-1 rounded ${catConfig.badgeStyle}`}>
                          <Icon className="w-3.5 h-3.5" />
                        </span>
                        <span>{catConfig.name}</span>
                        <span className="text-slate-400 dark:text-slate-500 font-normal">
                          ({catMetrics.length} of {totalCatCount} {catMetrics.length === 1 ? 'Indicator' : 'Indicators'})
                        </span>
                      </span>

                      <div className="flex items-center space-x-3">
                        {catMetrics.length > 0 && catStats && (
                          <div className="text-xs">
                            {catStats.leader === 'A' ? (
                              <span className="font-bold text-indigo-700 dark:text-indigo-300 text-[11px]">
                                {entityA.shortName} Leads {catStats.aWins}-{catStats.bWins}
                              </span>
                            ) : catStats.leader === 'B' ? (
                              <span className="font-bold text-emerald-700 dark:text-emerald-300 text-[11px]">
                                {entityB.shortName} Leads {catStats.bWins}-{catStats.aWins}
                              </span>
                            ) : (
                              <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                                Even {catStats.aWins}-{catStats.bWins}
                              </span>
                            )}
                          </div>
                        )}
                        <span className="text-slate-400 dark:text-slate-500">
                          {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                        </span>
                      </div>
                    </button>

                    {/* Category Rows */}
                    {!isCollapsed && (
                      <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                        {catMetrics.length === 0 ? (
                          <div className="px-5 py-4 text-xs text-slate-400 flex items-center justify-between">
                            <span>No active indicators in {catConfig.name}.</span>
                            <button
                              type="button"
                              onClick={() => enableAllInCategory(catConfig.id)}
                              className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline cursor-pointer"
                            >
                              Enable all {totalCatCount}
                            </button>
                          </div>
                        ) : (
                          catMetrics.map(renderMetricTableRow)
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            /* Flat Spec Table */
            <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {displayMetrics.map(renderMetricTableRow)}
            </div>
          )}
        </div>
      )}

      {/* Table Footer Helper */}
      <div className="p-3 bg-slate-50/80 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 text-2xs text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2 px-4 sm:px-5">
        <div className="flex items-center space-x-1.5">
          <DollarSign className="w-3.5 h-3.5 text-slate-400" />
          <span>
            {currencyMode === 'usd'
              ? 'All monetary metrics standardized in Global USD ($) for direct cross-border parity.'
              : `Displaying local currency amounts (${currencyA.code} & ${currencyB.code}). Balance ratios and lead calculations remain indexed to USD parity.`}
          </span>
        </div>
        <div className="flex items-center space-x-3">
          <button
            id="download-csv-footer-btn"
            type="button"
            onClick={handleDownloadCsv}
            disabled={activeMetrics.length === 0}
            className="text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold text-2xs flex items-center space-x-1 cursor-pointer transition-colors"
            title="Download current view of filtered indicators as CSV"
          >
            <Download className="w-3 h-3 text-slate-400" />
            <span>Export CSV</span>
          </button>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <button
            onClick={handleOpenSelector}
            className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold text-2xs cursor-pointer"
          >
            Customize Indicators ({activeMetrics.length}/{allMetrics.length})
          </button>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <span className="font-mono text-slate-400 dark:text-slate-500">
            Source: World Bank, IMF & National Economic Accounts
          </span>
        </div>
      </div>

      {/* Self-contained modal when opened locally */}
      {!onOpenIndicatorSelector && (
        <IndicatorSelectorModal
          isOpen={isInternalModalOpen}
          onClose={() => setIsInternalModalOpen(false)}
          selectedIds={selectedIds}
          onChangeSelectedIds={setSelectedIds}
          onResetToDefault={handleResetToDefault}
        />
      )}
    </div>
  );
}
