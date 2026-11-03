import { useState, useMemo, useEffect } from 'react';
import {
  X,
  Search,
  Plus,
  Trash2,
  Globe,
  Coins,
  DollarSign,
  Copy,
  Check,
  TrendingUp,
  Award,
  Layers,
  Sparkles,
  BarChart2,
  PieChart,
  Users,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  Filter,
  Info,
  Scale
} from 'lucide-react';
import { EconomicEntity, EntityType, ContinentalRegion } from '../types';
import { ECONOMIC_ENTITIES, getEntityById } from '../data/economicData';
import {
  ALL_INDICATORS,
  EconomicIndicatorDef,
  INDICATOR_CATEGORIES,
} from '../data/indicatorsRegistry';
import {
  getCurrencyInfo,
  formatLargeAmount,
  formatPerCapitaAmount,
  formatTradeBalanceAmount,
} from '../utils/currency';
import { formatCurrency } from '../utils/formatters';

interface MultiEntityComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEntities?: EconomicEntity[];
  onSetDualComparison?: (entityA: EconomicEntity, entityB: EconomicEntity) => void;
}

interface CohortPreset {
  id: string;
  name: string;
  description: string;
  entityIds: string[];
}

const COHORT_PRESETS: CohortPreset[] = [
  {
    id: 'top-5-global',
    name: 'Top 5 Global Economies',
    description: 'United States, China, Germany, Japan, and India',
    entityIds: ['us', 'cn', 'de', 'jp', 'in'],
  },
  {
    id: 'g7-titans',
    name: 'Major Western Powers',
    description: 'United States, United Kingdom, Germany, France, and California',
    entityIds: ['us', 'gb', 'de', 'fr', 'us-ca'],
  },
  {
    id: 'sovereign-vs-states',
    name: 'Sovereign Nations vs US Mega-States',
    description: 'California, Texas, United Kingdom, Germany, and India',
    entityIds: ['us-ca', 'us-tx', 'gb', 'de', 'in'],
  },
  {
    id: 'asia-pacific',
    name: 'Asia-Pacific Heavyweights',
    description: 'China, Japan, India, South Korea, and Australia',
    entityIds: ['cn', 'jp', 'in', 'kr', 'au'],
  },
  {
    id: 'european-core',
    name: 'European Economic Core',
    description: 'Germany, United Kingdom, France, Italy, and Netherlands',
    entityIds: ['de', 'gb', 'fr', 'it', 'nl'],
  },
];

const GLOBAL_ESTIMATED_GDP_USD_BILLIONS = 108000; // ~108 Trillion USD

export function MultiEntityComparisonModal({
  isOpen,
  onClose,
  initialEntities,
  onSetDualComparison,
}: MultiEntityComparisonModalProps) {
  // Up to 5 entities
  const [selectedEntities, setSelectedEntities] = useState<EconomicEntity[]>(() => {
    if (initialEntities && initialEntities.length >= 2) {
      // Pick up to 5 initial entities, supplementing with top economies if under 3
      const pool = [...initialEntities];
      const defaults = ['us', 'cn', 'de', 'us-ca', 'gb'];
      for (const id of defaults) {
        if (pool.length >= 5) break;
        if (!pool.some((e) => e.id === id)) {
          const found = getEntityById(id);
          if (found) pool.push(found);
        }
      }
      return pool.slice(0, 5);
    }
    const def = ['us', 'cn', 'de', 'gb', 'us-ca']
      .map((id) => getEntityById(id))
      .filter((e): e is EconomicEntity => Boolean(e));
    return def.length > 0 ? def : ECONOMIC_ENTITIES.slice(0, 5);
  });

  const [currencyMode, setCurrencyMode] = useState<'usd' | 'native'>('usd');
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pickerSearchQuery, setPickerSearchQuery] = useState('');
  const [pickerTypeFilter, setPickerTypeFilter] = useState<'all' | EntityType>('all');
  const [pickerContinentFilter, setPickerContinentFilter] = useState<'all' | ContinentalRegion>('all');
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>('all');
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Sync when initial entities change if modal re-opens
  useEffect(() => {
    if (isOpen && initialEntities && initialEntities.length >= 2) {
      setSelectedEntities((prev) => {
        // If current selection doesn't include the current pair, update
        const hasA = prev.some((e) => e.id === initialEntities[0].id);
        const hasB = prev.some((e) => e.id === initialEntities[1].id);
        if (!hasA || !hasB) {
          const newSet = [initialEntities[0], initialEntities[1]];
          for (const item of prev) {
            if (newSet.length >= 5) break;
            if (!newSet.some((e) => e.id === item.id)) {
              newSet.push(item);
            }
          }
          return newSet;
        }
        return prev;
      });
    }
  }, [isOpen, initialEntities]);

  // Keyboard navigation: Escape closes modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isPickerOpen) {
          setIsPickerOpen(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isPickerOpen, onClose]);

  // Add entity to selection
  const handleAddEntity = (entity: EconomicEntity) => {
    if (selectedEntities.some((e) => e.id === entity.id)) return;
    if (selectedEntities.length >= 5) return;
    setSelectedEntities([...selectedEntities, entity]);
    setIsPickerOpen(false);
    setPickerSearchQuery('');
  };

  // Remove entity from selection (minimum 2)
  const handleRemoveEntity = (id: string) => {
    if (selectedEntities.length <= 2) return;
    setSelectedEntities(selectedEntities.filter((e) => e.id !== id));
  };

  // Apply a cohort preset
  const handleApplyPreset = (preset: CohortPreset) => {
    const loaded = preset.entityIds
      .map((id) => getEntityById(id))
      .filter((e): e is EconomicEntity => Boolean(e));
    if (loaded.length >= 2) {
      setSelectedEntities(loaded.slice(0, 5));
    }
  };

  // Filter entities in the add-picker
  const availableToAddEntities = ECONOMIC_ENTITIES.filter((entity) => {
    const isAlreadySelected = selectedEntities.some((e) => e.id === entity.id);
    if (isAlreadySelected) return false;

    const matchesSearch =
      entity.name.toLowerCase().includes(pickerSearchQuery.toLowerCase()) ||
      entity.shortName.toLowerCase().includes(pickerSearchQuery.toLowerCase()) ||
      (entity.countryName && entity.countryName.toLowerCase().includes(pickerSearchQuery.toLowerCase())) ||
      entity.topIndustries.some((ind) => ind.toLowerCase().includes(pickerSearchQuery.toLowerCase()));

    const matchesType = pickerTypeFilter === 'all' || entity.type === pickerTypeFilter;
    const matchesContinent = pickerContinentFilter === 'all' || entity.continent === pickerContinentFilter;

    return matchesSearch && matchesType && matchesContinent;
  });

  // Calculate Group Aggregates
  const aggregates = useMemo(() => {
    const count = selectedEntities.length;
    if (count === 0) return null;

    const totalNominalGdp = selectedEntities.reduce((sum, e) => sum + e.nominalGdp, 0);
    const totalGdpPpp = selectedEntities.reduce((sum, e) => sum + e.gdpPpp, 0);
    const totalPopulation = selectedEntities.reduce((sum, e) => sum + e.population, 0);
    const globalGdpSharePct = (totalNominalGdp / GLOBAL_ESTIMATED_GDP_USD_BILLIONS) * 100;

    // Weighted average GDP per capita: total GDP / total population
    const weightedGdpPerCapita = totalPopulation > 0 ? (totalNominalGdp * 1000000000) / (totalPopulation * 1000000) : 0;
    
    // Simple averages
    const avgGrowthRate = selectedEntities.reduce((sum, e) => sum + e.gdpGrowthRate, 0) / count;
    const avgInflation = selectedEntities.reduce((sum, e) => sum + e.inflationRate, 0) / count;
    const avgUnemployment = selectedEntities.reduce((sum, e) => sum + e.unemploymentRate, 0) / count;
    const avgDebt = selectedEntities.reduce((sum, e) => sum + e.publicDebtToGdp, 0) / count;
    const avgHdi = selectedEntities.reduce((sum, e) => sum + e.hdi, 0) / count;
    const totalExports = selectedEntities.reduce((sum, e) => sum + (e.exports ?? 0), 0);
    const totalImports = selectedEntities.reduce((sum, e) => sum + (e.imports ?? 0), 0);
    const netTradeBalance = selectedEntities.reduce((sum, e) => sum + (e.tradeBalance ?? 0), 0);

    return {
      totalNominalGdp,
      totalGdpPpp,
      totalPopulation,
      globalGdpSharePct,
      weightedGdpPerCapita,
      avgGrowthRate,
      avgInflation,
      avgUnemployment,
      avgDebt,
      avgHdi,
      totalExports,
      totalImports,
      netTradeBalance,
    };
  }, [selectedEntities]);

  // Helper to retrieve and format raw values for any indicator
  const getEntityValue = (entity: EconomicEntity, indicatorId: string) => {
    switch (indicatorId) {
      case 'nominal-gdp':
        return {
          raw: entity.nominalGdp,
          formatted:
            currencyMode === 'usd'
              ? formatLargeAmount(entity.nominalGdp, 'USD')
              : formatLargeAmount(entity.nominalGdp, entity.currency, { showCode: true }),
        };
      case 'ppp-gdp':
        return {
          raw: entity.gdpPpp,
          formatted:
            currencyMode === 'usd'
              ? formatLargeAmount(entity.gdpPpp, 'USD', { isPpp: true })
              : formatLargeAmount(entity.gdpPpp, entity.currency, { isPpp: true, showCode: true }),
        };
      case 'global-rank':
        return {
          raw: entity.globalGdpRank,
          formatted: `#${entity.globalGdpRank}`,
        };
      case 'gdp-per-capita-nominal':
        return {
          raw: entity.gdpPerCapitaNominal,
          formatted:
            currencyMode === 'usd'
              ? formatPerCapitaAmount(entity.gdpPerCapitaNominal, 'USD')
              : formatPerCapitaAmount(entity.gdpPerCapitaNominal, entity.currency, { showCode: true }),
        };
      case 'gdp-per-capita-ppp':
        return {
          raw: entity.gdpPerCapitaPpp,
          formatted:
            currencyMode === 'usd'
              ? formatPerCapitaAmount(entity.gdpPerCapitaPpp, 'USD', { isPpp: true })
              : formatPerCapitaAmount(entity.gdpPerCapitaPpp, entity.currency, { isPpp: true, showCode: true }),
        };
      case 'hdi':
        return {
          raw: entity.hdi,
          formatted: entity.hdi.toFixed(3),
        };
      case 'growth-rate':
        return {
          raw: entity.gdpGrowthRate,
          formatted: `${entity.gdpGrowthRate > 0 ? '+' : ''}${entity.gdpGrowthRate}%`,
        };
      case 'inflation-rate':
        return {
          raw: entity.inflationRate,
          formatted: `${entity.inflationRate}%`,
        };
      case 'unemployment-rate':
        return {
          raw: entity.unemploymentRate,
          formatted: `${entity.unemploymentRate}%`,
        };
      case 'public-debt':
        return {
          raw: entity.publicDebtToGdp,
          formatted: `${entity.publicDebtToGdp}%`,
        };
      case 'population':
        return {
          raw: entity.population,
          formatted: `${entity.population.toFixed(1)}M`,
        };
      case 'trade-balance':
        return {
          raw: entity.tradeBalance ?? 0,
          formatted:
            entity.tradeBalance !== undefined
              ? currencyMode === 'usd'
                ? formatTradeBalanceAmount(entity.tradeBalance, 'USD')
                : formatTradeBalanceAmount(entity.tradeBalance, entity.currency)
              : 'N/A',
        };
      case 'exports':
        return {
          raw: entity.exports ?? 0,
          formatted:
            entity.exports !== undefined
              ? currencyMode === 'usd'
                ? formatLargeAmount(entity.exports, 'USD')
                : formatLargeAmount(entity.exports, entity.currency, { showCode: true })
              : 'N/A',
        };
      case 'imports':
        return {
          raw: entity.imports ?? 0,
          formatted:
            entity.imports !== undefined
              ? currencyMode === 'usd'
                ? formatLargeAmount(entity.imports, 'USD')
                : formatLargeAmount(entity.imports, entity.currency, { showCode: true })
              : 'N/A',
        };
      case 'services-share':
        return {
          raw: entity.sectorShare.services,
          formatted: `${entity.sectorShare.services.toFixed(1)}%`,
        };
      case 'industry-share':
        return {
          raw: entity.sectorShare.industry,
          formatted: `${entity.sectorShare.industry.toFixed(1)}%`,
        };
      case 'agriculture-share':
        return {
          raw: entity.sectorShare.agriculture,
          formatted: `${entity.sectorShare.agriculture.toFixed(1)}%`,
        };
      case 'tech-finance-share':
        return {
          raw: entity.sectorShare.techAndFinance ?? 0,
          formatted: entity.sectorShare.techAndFinance !== undefined ? `${entity.sectorShare.techAndFinance.toFixed(1)}%` : 'N/A',
        };
      default:
        return { raw: 0, formatted: '-' };
    }
  };

  // Get leader entity ID for an indicator
  const getLeaderId = (indicator: EconomicIndicatorDef): string | null => {
    if (selectedEntities.length < 2) return null;
    let bestEntity = selectedEntities[0];
    let bestVal = getEntityValue(bestEntity, indicator.id).raw;

    for (let i = 1; i < selectedEntities.length; i++) {
      const e = selectedEntities[i];
      const val = getEntityValue(e, indicator.id).raw;
      if (indicator.lowerIsBetter) {
        if (val < bestVal) {
          bestVal = val;
          bestEntity = e;
        }
      } else {
        if (val > bestVal) {
          bestVal = val;
          bestEntity = e;
        }
      }
    }
    return bestEntity.id;
  };

  // Filtered indicators based on category tab
  const displayedIndicators = useMemo(() => {
    if (selectedCategoryTab === 'all') return ALL_INDICATORS;
    return ALL_INDICATORS.filter((ind) => ind.categoryId === selectedCategoryTab);
  }, [selectedCategoryTab]);

  // Copy table to clipboard in Markdown format
  const handleCopyMarkdown = async () => {
    const headers = ['Indicator', ...selectedEntities.map((e) => `${e.shortName} (${e.type === 'region' ? 'Region' : 'Country'})`), 'Group Aggregate / Average'];
    const divider = headers.map(() => '---').join(' | ');

    const rows = ALL_INDICATORS.map((ind) => {
      const vals = selectedEntities.map((e) => getEntityValue(e, ind.id).formatted);
      let aggVal = '-';
      if (ind.id === 'nominal-gdp' && aggregates) {
        aggVal = `$${(aggregates.totalNominalGdp / 1000).toFixed(2)}T (${aggregates.globalGdpSharePct.toFixed(1)}% World)`;
      } else if (ind.id === 'ppp-gdp' && aggregates) {
        aggVal = `Int$ ${(aggregates.totalGdpPpp / 1000).toFixed(2)}T`;
      } else if (ind.id === 'population' && aggregates) {
        aggVal = `${aggregates.totalPopulation.toFixed(1)}M Total`;
      } else if (ind.id === 'gdp-per-capita-nominal' && aggregates) {
        aggVal = `$${Math.round(aggregates.weightedGdpPerCapita).toLocaleString()} (Weighted Avg)`;
      } else if (ind.id === 'growth-rate' && aggregates) {
        aggVal = `${aggregates.avgGrowthRate > 0 ? '+' : ''}${aggregates.avgGrowthRate.toFixed(1)}% (Avg)`;
      } else if (ind.id === 'inflation-rate' && aggregates) {
        aggVal = `${aggregates.avgInflation.toFixed(1)}% (Avg)`;
      } else if (ind.id === 'unemployment-rate' && aggregates) {
        aggVal = `${aggregates.avgUnemployment.toFixed(1)}% (Avg)`;
      } else if (ind.id === 'public-debt' && aggregates) {
        aggVal = `${aggregates.avgDebt.toFixed(1)}% (Avg)`;
      } else if (ind.id === 'hdi' && aggregates) {
        aggVal = `${aggregates.avgHdi.toFixed(3)} (Avg)`;
      } else if (ind.id === 'trade-balance' && aggregates) {
        aggVal = `${aggregates.netTradeBalance >= 0 ? '+' : ''}$${aggregates.netTradeBalance.toFixed(1)}B Total`;
      }
      return `| **${ind.name}** | ${vals.join(' | ')} | ${aggVal} |`;
    });

    const markdown = `# Multi-Entity Macroeconomic Comparison (${selectedEntities.map((e) => e.name).join(' vs ')})
Date: ${new Date().toISOString().split('T')[0]}

| ${headers.join(' | ')} |
| ${divider} |
${rows.join('\n')}
`;

    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy markdown:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="multi-entity-comparison-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="multi-entity-modal-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6"
    >
      <div
        id="multi-entity-comparison-modal"
        className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-200 ${
          isFullscreen ? 'w-full h-full rounded-none' : 'w-full max-w-7xl max-h-[94vh]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 id="multi-entity-modal-title" className="text-lg font-bold text-slate-900 dark:text-white">
                  Multi-Entity Aggregate Comparison Lab
                </h2>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  Up to 5 Entities
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Simultaneously benchmark sovereign economies and subnational regions side-by-side with group aggregates.
              </p>
            </div>
          </div>

          {/* Top Actions: Copy, Fullscreen, Close */}
          <div className="flex items-center space-x-2 self-end sm:self-auto">
            <button
              id="copy-multi-table-btn"
              onClick={handleCopyMarkdown}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 hover:bg-slate-100 hover:dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center space-x-1.5 transition-colors shadow-2xs cursor-pointer"
              title="Copy entire comparison table in Markdown format"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copy Table</span>
                </>
              )}
            </button>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              id="close-multi-modal-btn"
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Selected Entities Slot Tray & Cohort Presets */}
        <div className="px-5 sm:px-6 py-3 bg-slate-100/60 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Active Entity Cards Tray */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mr-1 flex items-center gap-1.5 shrink-0">
              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
              Selected ({selectedEntities.length}/5):
            </span>

            {selectedEntities.map((entity, index) => {
              const currency = getCurrencyInfo(entity.currency);
              return (
                <div
                  key={entity.id}
                  id={`slot-card-${entity.id}`}
                  className="inline-flex items-center pl-2.5 pr-1.5 py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs text-xs font-semibold text-slate-800 dark:text-slate-100 group"
                >
                  <span className="mr-1.5 text-base leading-none">{entity.flag}</span>
                  <div className="flex flex-col text-left">
                    <span className="leading-tight font-bold">{entity.shortName}</span>
                    <span className="text-[10px] text-slate-400 font-mono font-normal">
                      ${(entity.nominalGdp >= 1000 ? (entity.nominalGdp / 1000).toFixed(1) + 'T' : entity.nominalGdp + 'B')}
                    </span>
                  </div>

                  {selectedEntities.length > 2 && (
                    <button
                      onClick={() => handleRemoveEntity(entity.id)}
                      className="ml-2 p-1 rounded-md text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title={`Remove ${entity.name}`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}

            {/* Add Entity Button (if less than 5) */}
            {selectedEntities.length < 5 && (
              <button
                id="add-entity-slot-btn"
                onClick={() => setIsPickerOpen(true)}
                className="inline-flex items-center px-3 py-1.5 rounded-xl border-2 border-dashed border-indigo-300 dark:border-indigo-800/80 bg-indigo-50/50 dark:bg-indigo-950/30 hover:bg-indigo-100/70 hover:dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs font-bold transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 mr-1 stroke-[2.5]" />
                <span>Add Entity ({5 - selectedEntities.length} open)</span>
              </button>
            )}
          </div>

          {/* Quick Presets Bar */}
          <div className="flex items-center space-x-1.5 overflow-x-auto text-xs pb-1 md:pb-0">
            <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              Presets:
            </span>
            {COHORT_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handleApplyPreset(preset)}
                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 hover:dark:bg-slate-800 border border-slate-200 dark:border-slate-800 whitespace-nowrap transition-colors cursor-pointer"
                title={preset.description}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        {/* Aggregates Summary Banner */}
        {aggregates && (
          <div
            id="multi-aggregates-summary-banner"
            className="px-5 sm:px-6 py-3.5 bg-linear-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white border-b border-indigo-800/50 shadow-inner grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs"
          >
            <div>
              <div className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider">
                Combined GDP (Nominal)
              </div>
              <div className="text-base font-extrabold text-white mt-0.5">
                ${(aggregates.totalNominalGdp / 1000).toFixed(2)} Trillion
              </div>
              <div className="text-[10px] text-indigo-200/80">
                {aggregates.globalGdpSharePct.toFixed(1)}% of Global Economy
              </div>
            </div>

            <div>
              <div className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider">
                Combined GDP (PPP)
              </div>
              <div className="text-base font-extrabold text-white mt-0.5">
                ${(aggregates.totalGdpPpp / 1000).toFixed(2)}T PPP
              </div>
              <div className="text-[10px] text-indigo-200/80">
                Purchasing Power Volume
              </div>
            </div>

            <div>
              <div className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider">
                Total Population
              </div>
              <div className="text-base font-extrabold text-white mt-0.5">
                {(aggregates.totalPopulation / 1000).toFixed(2)} Billion
              </div>
              <div className="text-[10px] text-indigo-200/80">
                {aggregates.totalPopulation.toFixed(0)}M Residents
              </div>
            </div>

            <div>
              <div className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider">
                Weighted GDP / Capita
              </div>
              <div className="text-base font-extrabold text-white mt-0.5">
                ${Math.round(aggregates.weightedGdpPerCapita).toLocaleString()}
              </div>
              <div className="text-[10px] text-indigo-200/80">
                Output per Individual
              </div>
            </div>

            <div>
              <div className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider">
                Average GDP Growth
              </div>
              <div className="text-base font-extrabold text-emerald-400 mt-0.5">
                {aggregates.avgGrowthRate > 0 ? '+' : ''}{aggregates.avgGrowthRate.toFixed(1)}%
              </div>
              <div className="text-[10px] text-indigo-200/80">
                Avg CPI: {aggregates.avgInflation.toFixed(1)}%
              </div>
            </div>

            <div>
              <div className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider">
                Combined Exports
              </div>
              <div className="text-base font-extrabold text-white mt-0.5">
                ${(aggregates.totalExports / 1000).toFixed(2)}T
              </div>
              <div className="text-[10px] text-indigo-200/80">
                Net Trade: {aggregates.netTradeBalance >= 0 ? '+' : ''}${aggregates.netTradeBalance.toFixed(0)}B
              </div>
            </div>
          </div>
        )}

        {/* View Controls & Category Filter Bar */}
        <div className="px-5 sm:px-6 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Category Tabs */}
          <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setSelectedCategoryTab('all')}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategoryTab === 'all'
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-bold shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              All Indicators (18)
            </button>
            {INDICATOR_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryTab(cat.id)}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategoryTab === cat.id
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-bold shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {cat.shortName}
              </button>
            ))}
          </div>

          {/* Currency Switcher */}
          <div
            id="multi-currency-switcher"
            className="inline-flex items-center p-0.5 bg-slate-200/80 dark:bg-slate-800 rounded-lg border border-slate-300/80 dark:border-slate-700 text-xs"
          >
            <button
              onClick={() => setCurrencyMode('usd')}
              className={`px-2.5 py-1 rounded-md font-semibold flex items-center space-x-1 transition-all cursor-pointer ${
                currencyMode === 'usd'
                  ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Globe className="w-3 h-3" />
              <span>Global USD ($)</span>
            </button>
            <button
              onClick={() => setCurrencyMode('native')}
              className={`px-2.5 py-1 rounded-md font-semibold flex items-center space-x-1 transition-all cursor-pointer ${
                currencyMode === 'native'
                  ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Coins className="w-3 h-3 text-amber-500" />
              <span>Native Currency</span>
            </button>
          </div>
        </div>

        {/* Main Comparison Table */}
        <div className="flex-1 overflow-auto bg-slate-50/30 dark:bg-slate-950/30">
          <table className="w-full text-left border-collapse text-xs">
            {/* Table Header (Entities) */}
            <thead className="sticky top-0 z-20 bg-slate-100/95 dark:bg-slate-900/95 backdrop-blur-xs border-b border-slate-200 dark:border-slate-800 shadow-2xs">
              <tr>
                <th className="p-3 sm:p-4 font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px] w-64 min-w-[200px]">
                  Economic Indicator
                </th>

                {selectedEntities.map((entity) => {
                  const curr = getCurrencyInfo(entity.currency);
                  return (
                    <th
                      key={entity.id}
                      className="p-3 sm:p-4 text-center border-l border-slate-200 dark:border-slate-800 min-w-[170px]"
                    >
                      <div className="flex flex-col items-center">
                        <span className="text-2xl leading-none">{entity.flag}</span>
                        <div className="mt-1 font-extrabold text-sm text-slate-900 dark:text-white leading-tight">
                          {entity.name}
                        </div>
                        <div className="flex items-center space-x-1 mt-0.5">
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] font-semibold uppercase tracking-wider ${
                              entity.type === 'region'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300'
                            }`}
                          >
                            {entity.type === 'region' ? 'Subnational Region' : 'Sovereign Nation'}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            ({curr.code})
                          </span>
                        </div>

                        {onSetDualComparison && (
                          <button
                            onClick={() => {
                              // Find another entity to pair with
                              const other = selectedEntities.find((e) => e.id !== entity.id) || selectedEntities[0];
                              onSetDualComparison(entity, other);
                              onClose();
                            }}
                            className="mt-2 text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline font-semibold cursor-pointer"
                            title={`Inspect ${entity.name} in main dual-comparator`}
                          >
                            Focus in Main View →
                          </button>
                        )}
                      </div>
                    </th>
                  );
                })}

                {/* Aggregate Summary Column */}
                <th className="p-3 sm:p-4 text-center border-l-2 border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/70 dark:bg-indigo-950/40 min-w-[180px]">
                  <div className="flex flex-col items-center">
                    <div className="p-1.5 rounded-lg bg-indigo-600 text-white mb-1">
                      <Scale className="w-4 h-4" />
                    </div>
                    <span className="font-extrabold text-sm text-indigo-950 dark:text-indigo-200">
                      Group Total / Avg
                    </span>
                    <span className="text-[10px] text-indigo-700 dark:text-indigo-300 font-medium">
                      Combined Aggregate
                    </span>
                  </div>
                </th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
              {displayedIndicators.map((ind) => {
                const leaderId = getLeaderId(ind);

                // Compute min/max to render comparison heat bars
                const values = selectedEntities.map((e) => getEntityValue(e, ind.id).raw);
                const minVal = Math.min(...values);
                const maxVal = Math.max(...values);
                const range = maxVal - minVal || 1;

                // Aggregate calculation
                let aggregateFormatted = '-';
                if (aggregates) {
                  if (ind.id === 'nominal-gdp') {
                    aggregateFormatted = `$${(aggregates.totalNominalGdp / 1000).toFixed(2)}T (${aggregates.globalGdpSharePct.toFixed(1)}% of World)`;
                  } else if (ind.id === 'ppp-gdp') {
                    aggregateFormatted = `Int$ ${(aggregates.totalGdpPpp / 1000).toFixed(2)}T`;
                  } else if (ind.id === 'global-rank') {
                    aggregateFormatted = 'Top 1-5 Cohort';
                  } else if (ind.id === 'population') {
                    aggregateFormatted = `${aggregates.totalPopulation.toFixed(1)}M Total`;
                  } else if (ind.id === 'gdp-per-capita-nominal') {
                    aggregateFormatted = `$${Math.round(aggregates.weightedGdpPerCapita).toLocaleString()} (Weighted)`;
                  } else if (ind.id === 'gdp-per-capita-ppp') {
                    const avgVal = values.reduce((a, b) => a + b, 0) / values.length;
                    aggregateFormatted = `Int$ ${Math.round(avgVal).toLocaleString()} (Avg)`;
                  } else if (ind.id === 'hdi') {
                    aggregateFormatted = `${aggregates.avgHdi.toFixed(3)} (Avg)`;
                  } else if (ind.id === 'growth-rate') {
                    aggregateFormatted = `${aggregates.avgGrowthRate > 0 ? '+' : ''}${aggregates.avgGrowthRate.toFixed(1)}% (Avg)`;
                  } else if (ind.id === 'inflation-rate') {
                    aggregateFormatted = `${aggregates.avgInflation.toFixed(1)}% (Avg)`;
                  } else if (ind.id === 'unemployment-rate') {
                    aggregateFormatted = `${aggregates.avgUnemployment.toFixed(1)}% (Avg)`;
                  } else if (ind.id === 'public-debt') {
                    aggregateFormatted = `${aggregates.avgDebt.toFixed(1)}% (Avg)`;
                  } else if (ind.id === 'trade-balance') {
                    aggregateFormatted = `${aggregates.netTradeBalance >= 0 ? '+' : ''}$${aggregates.netTradeBalance.toFixed(1)}B Total`;
                  } else if (ind.id === 'exports') {
                    aggregateFormatted = `$${aggregates.totalExports.toFixed(1)}B Total`;
                  } else if (ind.id === 'imports') {
                    aggregateFormatted = `$${aggregates.totalImports.toFixed(1)}B Total`;
                  } else if (ind.id === 'services-share') {
                    const avg = values.reduce((a, b) => a + b, 0) / values.length;
                    aggregateFormatted = `${avg.toFixed(1)}% (Avg)`;
                  } else if (ind.id === 'industry-share') {
                    const avg = values.reduce((a, b) => a + b, 0) / values.length;
                    aggregateFormatted = `${avg.toFixed(1)}% (Avg)`;
                  } else if (ind.id === 'agriculture-share') {
                    const avg = values.reduce((a, b) => a + b, 0) / values.length;
                    aggregateFormatted = `${avg.toFixed(1)}% (Avg)`;
                  } else if (ind.id === 'tech-finance-share') {
                    const avg = values.reduce((a, b) => a + b, 0) / values.length;
                    aggregateFormatted = `${avg.toFixed(1)}% (Avg)`;
                  }
                }

                return (
                  <tr
                    key={ind.id}
                    id={`row-${ind.id}`}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* Indicator Name & Category */}
                    <td className="p-3 sm:p-4">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          {ind.name}
                        </span>
                        {ind.lowerIsBetter && (
                          <span
                            className="text-[10px] text-amber-700 dark:text-amber-400 font-mono"
                            title="Lower value represents strength"
                          >
                            (↓)
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                        {ind.description}
                      </div>
                      <span className="inline-block mt-1 text-[9px] font-mono px-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                        {ind.unit}
                      </span>
                    </td>

                    {/* Entities Columns */}
                    {selectedEntities.map((entity) => {
                      const { raw, formatted } = getEntityValue(entity, ind.id);
                      const isLeader = leaderId === entity.id;

                      // Ratio normalized for visual bar
                      const barPercent = Math.max(10, Math.min(100, ((raw - minVal) / range) * 100));

                      return (
                        <td
                          key={entity.id}
                          className={`p-3 sm:p-4 text-center border-l border-slate-200 dark:border-slate-800 transition-colors ${
                            isLeader
                              ? 'bg-indigo-50/30 dark:bg-indigo-950/20 font-semibold'
                              : ''
                          }`}
                        >
                          <div className="flex flex-col items-center">
                            <div className="flex items-center space-x-1.5">
                              <span
                                className={`text-sm ${
                                  isLeader
                                    ? 'font-extrabold text-indigo-700 dark:text-indigo-400'
                                    : 'font-semibold text-slate-800 dark:text-slate-200'
                                }`}
                              >
                                {formatted}
                              </span>
                              {isLeader && (
                                <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800">
                                  Lead
                                </span>
                              )}
                            </div>

                            {/* Relative mini heat bar */}
                            <div className="w-20 h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mt-1.5">
                              <div
                                className={`h-full ${
                                  isLeader ? 'bg-indigo-600 dark:bg-indigo-400' : 'bg-slate-400 dark:bg-slate-500'
                                }`}
                                style={{ width: `${barPercent}%` }}
                              />
                            </div>
                          </div>
                        </td>
                      );
                    })}

                    {/* Aggregate Column */}
                    <td className="p-3 sm:p-4 text-center border-l-2 border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/20 font-bold text-indigo-900 dark:text-indigo-200">
                      {aggregateFormatted}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Modal Bottom Bar */}
        <div className="px-5 sm:px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center space-x-2">
            <Info className="w-4 h-4 text-indigo-500 shrink-0" />
            <span>
              Comparing <strong>{selectedEntities.length}</strong> economies simultaneously. Group aggregate reflects combined output and arithmetic/weighted averages.
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsPickerOpen(true)}
              disabled={selectedEntities.length >= 5}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center space-x-1.5 transition-colors cursor-pointer ${
                selectedEntities.length >= 5
                  ? 'opacity-50 cursor-not-allowed bg-slate-200 dark:bg-slate-800 text-slate-400'
                  : 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Another Entity ({selectedEntities.length}/5)</span>
            </button>

            <button
              id="multi-modal-done-btn"
              onClick={onClose}
              className="px-5 py-1.5 rounded-lg font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>

        {/* Nested Entity Picker Dialog (to add an entity up to 5) */}
        {isPickerOpen && (
          <div
            id="multi-entity-picker-dialog"
            className="fixed inset-0 z-60 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
            onClick={() => setIsPickerOpen(false)}
          >
            <div
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-xl max-h-[80vh] flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Picker Header */}
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Add Entity to Multi-Comparison ({selectedEntities.length}/5 Slots Used)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Select a sovereign country or subnational state/region.
                  </p>
                </div>
                <button
                  onClick={() => setIsPickerOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Picker Search & Filter Controls */}
              <div className="p-3 border-b border-slate-200 dark:border-slate-800 space-y-2.5">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by country, region, city, or top industries..."
                    value={pickerSearchQuery}
                    onChange={(e) => setPickerSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    autoFocus
                  />
                </div>

                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <button
                    onClick={() => setPickerTypeFilter('all')}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                      pickerTypeFilter === 'all'
                        ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-bold'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    All Types
                  </button>
                  <button
                    onClick={() => setPickerTypeFilter('country')}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                      pickerTypeFilter === 'country'
                        ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-bold'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Sovereign Nations
                  </button>
                  <button
                    onClick={() => setPickerTypeFilter('region')}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                      pickerTypeFilter === 'region'
                        ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-bold'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Subnational Regions
                  </button>
                </div>
              </div>

              {/* Picker Entity List */}
              <div className="flex-1 overflow-y-auto p-3 space-y-1.5 divide-y divide-slate-100 dark:divide-slate-800/60">
                {availableToAddEntities.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-500">
                    No matching entities found. Try another search term.
                  </div>
                ) : (
                  availableToAddEntities.map((entity) => (
                    <button
                      key={entity.id}
                      onClick={() => handleAddEntity(entity)}
                      className="w-full pt-1.5 pb-1.5 px-2 flex items-center justify-between rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors text-left group cursor-pointer"
                    >
                      <div className="flex items-center space-x-2.5">
                        <span className="text-xl leading-none">{entity.flag}</span>
                        <div>
                          <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                            <span>{entity.name}</span>
                            <span
                              className={`px-1 rounded text-[9px] font-semibold uppercase ${
                                entity.type === 'region'
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                                  : 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300'
                              }`}
                            >
                              {entity.type === 'region' ? 'Region' : 'Country'}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400">
                            {entity.countryName ? `${entity.countryName} • ` : ''}
                            {entity.continent} • Top industries: {entity.topIndustries.slice(0, 2).join(', ')}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                          ${(entity.nominalGdp >= 1000 ? (entity.nominalGdp / 1000).toFixed(2) + 'T' : entity.nominalGdp + 'B')}
                        </div>
                        <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold group-hover:underline">
                          + Add to Table
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
