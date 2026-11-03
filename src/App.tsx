import { useState, useCallback, useEffect } from 'react';
import { EconomicEntity, CuratedComparison, RecentComparisonItem } from './types';
import { ECONOMIC_ENTITIES, CURATED_COMPARISONS, getEntityById } from './data/economicData';
import { Navbar } from './components/Navbar';
import { ComparisonHero } from './components/ComparisonHero';
import { MetricComparisonTable } from './components/MetricComparisonTable';
import { VarianceHeatmap } from './components/VarianceHeatmap';
import { HistoricalChart } from './components/HistoricalChart';
import { SectorBreakdown } from './components/SectorBreakdown';
import { EconomicRadar } from './components/EconomicRadar';
import { EquivalenceCalculator } from './components/EquivalenceCalculator';
import { ConstituentRegions } from './components/ConstituentRegions';
import { EntitySelectorModal } from './components/EntitySelectorModal';
import { ExportSummaryModal } from './components/ExportSummaryModal';
import { GoogleSheetsModal } from './components/GoogleSheetsModal';
import { EconomicNewsSection } from './components/EconomicNewsSection';
import { FiscalPolicyAnalyzer } from './components/FiscalPolicyAnalyzer';
import { MacroTrendsTab } from './components/MacroTrendsTab';
import { CurrencyConverterModal } from './components/CurrencyConverterModal';
import { WhatIfScenarioBuilder } from './components/WhatIfScenarioBuilder';
import { RecentComparisonsSidebar } from './components/RecentComparisonsSidebar';
import { IndicatorSelectorModal } from './components/IndicatorSelectorModal';
import { MultiEntityComparisonModal } from './components/MultiEntityComparisonModal';
import { GrowthProjectionLab } from './components/GrowthProjectionLab';
import { CountrySpotlight } from './components/CountrySpotlight';
import { MacroAnalystCopilot } from './components/MacroAnalystCopilot';
import { InteractiveEconomicCharts } from './components/InteractiveEconomicCharts';
import { DEFAULT_SELECTED_INDICATOR_IDS, ALL_INDICATORS } from './data/indicatorsRegistry';
import { BarChart2, BarChart3, Grid3X3, TrendingUp, Layers, Compass, Calculator, MapPin, Scale, History, SlidersHorizontal, Users, Sparkles, Globe2, Sliders, BrainCircuit } from 'lucide-react';

const STORAGE_KEY = 'gdp_comparator_recent_comparisons_v1';
const INDICATORS_STORAGE_KEY = 'gdp_comparator_selected_indicators_v1';

export default function App() {
  // Default to California vs United Kingdom (classic region vs nation comparison)
  const [entityA, setEntityA] = useState<EconomicEntity>(
    () => getEntityById('us-ca') || ECONOMIC_ENTITIES[0]
  );
  const [entityB, setEntityB] = useState<EconomicEntity>(
    () => getEntityById('gb') || ECONOMIC_ENTITIES[1]
  );

  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [targetSlot, setTargetSlot] = useState<'A' | 'B'>('A');
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isSheetsOpen, setIsSheetsOpen] = useState(false);
  const [isRecentOpen, setIsRecentOpen] = useState(false);
  const [isCurrencyModalOpen, setIsCurrencyModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'charts' | 'trends' | 'copilot' | 'fiscal' | 'what-if' | 'heatmap' | 'history' | 'projection' | 'sectors' | 'radar' | 'equivalence'>('overview');

  const [activeCuratedId, setActiveCuratedId] = useState<string | undefined>('ca-vs-gb');
  const [sharedHoveredYear, setSharedHoveredYear] = useState<number | null>(null);

  // Load and manage last 5 recent comparisons from localStorage
  const [recentComparisons, setRecentComparisons] = useState<RecentComparisonItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.slice(0, 5);
        }
      }
    } catch (err) {
      console.warn('Failed to load recent comparisons from localStorage', err);
    }
    const defaultA = getEntityById('us-ca') || ECONOMIC_ENTITIES[0];
    const defaultB = getEntityById('gb') || ECONOMIC_ENTITIES[1];
    return [
      {
        id: `${defaultA.id}-${defaultB.id}-${Date.now()}`,
        entityAId: defaultA.id,
        entityBId: defaultB.id,
        entityA: defaultA,
        entityB: defaultB,
        timestamp: Date.now(),
      },
    ];
  });

  // Track comparisons in history whenever entityA or entityB change (limit to max 5 distinct pairs)
  useEffect(() => {
    setRecentComparisons((prev) => {
      // Remove previous duplicate if this pair was already compared (regardless of slot order)
      const filtered = prev.filter(
        (item) =>
          !(
            (item.entityA.id === entityA.id && item.entityB.id === entityB.id) ||
            (item.entityA.id === entityB.id && item.entityB.id === entityA.id)
          )
      );

      const newItem: RecentComparisonItem = {
        id: `${entityA.id}-${entityB.id}-${Date.now()}`,
        entityAId: entityA.id,
        entityBId: entityB.id,
        entityA,
        entityB,
        timestamp: Date.now(),
      };

      const updated = [newItem, ...filtered].slice(0, 5);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.warn('Failed to save recent comparisons to localStorage', err);
      }
      return updated;
    });
  }, [entityA, entityB]);

  // Load and manage user-selected economic indicators
  const [selectedIndicatorIds, setSelectedIndicatorIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(INDICATORS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (err) {
      console.warn('Failed to load selected indicators from localStorage', err);
    }
    return DEFAULT_SELECTED_INDICATOR_IDS;
  });

  const [isIndicatorModalOpen, setIsIndicatorModalOpen] = useState(false);
  const [isMultiEntityOpen, setIsMultiEntityOpen] = useState(false);

  // Sync selected indicators to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(INDICATORS_STORAGE_KEY, JSON.stringify(selectedIndicatorIds));
    } catch (err) {
      console.warn('Failed to save selected indicators to localStorage', err);
    }
  }, [selectedIndicatorIds]);

  // Global hotkeys: 'H' for Recent Comparisons, 'I' for Indicator Customizer, 'M' for Multi-Entity Lab
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      if (e.key === 'h' || e.key === 'H') {
        if (!e.metaKey && !e.ctrlKey && !e.altKey) {
          setIsRecentOpen((prev) => !prev);
        }
      }
      if (e.key === 'i' || e.key === 'I') {
        if (!e.metaKey && !e.ctrlKey && !e.altKey) {
          setIsIndicatorModalOpen((prev) => !prev);
        }
      }
      if (e.key === 'm' || e.key === 'M') {
        if (!e.metaKey && !e.ctrlKey && !e.altKey) {
          setIsMultiEntityOpen((prev) => !prev);
        }
      }
      if (e.key === 'p' || e.key === 'P') {
        if (!e.metaKey && !e.ctrlKey && !e.altKey) {
          window.print();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const openSelectorFor = useCallback((slot: 'A' | 'B') => {
    setTargetSlot(slot);
    setIsSelectorOpen(true);
  }, []);

  const handleSelectEntity = useCallback(
    (entity: EconomicEntity) => {
      if (targetSlot === 'A') {
        setEntityA(entity);
      } else {
        setEntityB(entity);
      }
      setActiveCuratedId(undefined);
    },
    [targetSlot]
  );

  const handleSwap = useCallback(() => {
    setEntityA((prevA) => {
      setEntityB(prevA);
      return entityB;
    });
    setActiveCuratedId(undefined);
  }, [entityB]);

  const handleSelectCurated = useCallback((comparison: CuratedComparison) => {
    const a = getEntityById(comparison.entityAId);
    const b = getEntityById(comparison.entityBId);
    if (a && b) {
      setEntityA(a);
      setEntityB(b);
      setActiveCuratedId(comparison.id);
    }
  }, []);

  const handleSelectRecentComparison = useCallback(
    (selectedA: EconomicEntity, selectedB: EconomicEntity) => {
      setEntityA(selectedA);
      setEntityB(selectedB);
      // Check if this matches a curated comparison
      const match = CURATED_COMPARISONS.find(
        (c) =>
          (c.entityAId === selectedA.id && c.entityBId === selectedB.id) ||
          (c.entityAId === selectedB.id && c.entityBId === selectedA.id)
      );
      setActiveCuratedId(match?.id);
    },
    []
  );

  const handleRemoveRecentComparison = useCallback((id: string) => {
    setRecentComparisons((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.warn('Failed to update localStorage', err);
      }
      return updated;
    });
  }, []);

  const handleClearAllRecent = useCallback(() => {
    setRecentComparisons([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      console.warn('Failed to clear recent comparisons', err);
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-indigo-100 dark:selection:bg-indigo-900/50 selection:text-indigo-900 dark:selection:text-indigo-200 transition-colors">
      {/* Top Navigation */}
      <Navbar
        onSelectCurated={handleSelectCurated}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenSheets={() => setIsSheetsOpen(true)}
        onOpenRecent={() => setIsRecentOpen(true)}
        recentCount={recentComparisons.length}
        activeCuratedId={activeCuratedId}
        onOpenIndicators={() => setIsIndicatorModalOpen(true)}
        activeIndicatorCount={selectedIndicatorIds.length}
        totalIndicatorCount={ALL_INDICATORS.length}
        onOpenMultiEntity={() => setIsMultiEntityOpen(true)}
        onSelectEntityA={setEntityA}
        onSelectEntityB={setEntityB}
        currentEntityA={entityA}
        currentEntityB={entityB}
        onOpenForexConverter={() => setIsCurrencyModalOpen(true)}
      />

      {/* Main Face-off Comparison Hero */}
      <main className="flex-1 pb-16">
        {/* Print-Only Professional Document Header */}
        <div id="print-document-header" className="hidden print:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6 pb-5 border-b-2 border-slate-900">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-black uppercase tracking-widest text-indigo-900 border-2 border-indigo-900 px-2 py-0.5 rounded bg-indigo-50">
                  Macroeconomic Intelligence Report
                </span>
                <span className="text-[11px] text-slate-600 font-mono">
                  REF: MACRO-{entityA.id.toUpperCase()}-{entityB.id.toUpperCase()}-{new Date().getFullYear()}
                </span>
              </div>
              <h1 className="text-2xl font-black text-slate-900 mt-2 tracking-tight">
                Comparative Economic Benchmark: {entityA.name} vs. {entityB.name}
              </h1>
              <p className="text-xs text-slate-600 mt-1 max-w-2xl">
                Comprehensive comparative intelligence across output scale, productivity, fiscal stability, workforce demographics, and foreign trade.
              </p>
            </div>

            <div className="text-right text-xs text-slate-600 font-mono shrink-0">
              <div className="font-extrabold text-slate-900 text-sm">Official Physical Briefing</div>
              <div>Date: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
              <div>Standard: USD Global Parity & Native Legal Tender</div>
              <div className="text-emerald-700 font-bold">Status: Harmonized Macro Series</div>
            </div>
          </div>

          {/* Entity Summary Strip for Print Document */}
          <div className="grid grid-cols-2 gap-4 mt-4 pt-3 border-t border-slate-300 text-xs">
            <div className="flex items-center space-x-3 bg-slate-50 p-3 rounded-lg border border-slate-300">
              <span className="text-3xl shrink-0">{entityA.flag}</span>
              <div>
                <div className="font-black text-slate-900 text-sm">{entityA.name} ({entityA.shortName})</div>
                <div className="text-slate-700 text-[11px] font-medium">
                  {entityA.type === 'region' ? `Subnational Region of ${entityA.countryName}` : 'Sovereign Nation'} • Global Standing #{entityA.globalGdpRank} • Pop: {entityA.population}M
                </div>
                <div className="text-indigo-900 font-bold text-xs mt-0.5">
                  Nominal GDP: ${entityA.nominalGdp.toLocaleString()}B • Per Capita: ${Math.round(entityA.gdpPerCapitaNominal).toLocaleString()}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3 bg-slate-50 p-3 rounded-lg border border-slate-300">
              <span className="text-3xl shrink-0">{entityB.flag}</span>
              <div>
                <div className="font-black text-slate-900 text-sm">{entityB.name} ({entityB.shortName})</div>
                <div className="text-slate-700 text-[11px] font-medium">
                  {entityB.type === 'region' ? `Subnational Region of ${entityB.countryName}` : 'Sovereign Nation'} • Global Standing #{entityB.globalGdpRank} • Pop: {entityB.population}M
                </div>
                <div className="text-emerald-900 font-bold text-xs mt-0.5">
                  Nominal GDP: ${entityB.nominalGdp.toLocaleString()}B • Per Capita: ${Math.round(entityB.gdpPerCapitaNominal).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>

        <ComparisonHero
          entityA={entityA}
          entityB={entityB}
          onOpenSelectorA={() => openSelectorFor('A')}
          onOpenSelectorB={() => openSelectorFor('B')}
          onSwap={handleSwap}
          onOpenMultiEntity={() => setIsMultiEntityOpen(true)}
          selectedIndicatorCount={selectedIndicatorIds.length}
          totalIndicatorCount={ALL_INDICATORS.length}
          onOpenIndicatorSelector={() => setIsIndicatorModalOpen(true)}
        />

        {/* Section Navigation Tabs (Screen only, hidden in print) */}
        <div id="section-nav-tabs" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 print:hidden">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 flex-wrap gap-2">
            <div className="flex items-center space-x-1.5 bg-slate-200/70 dark:bg-slate-900 p-1 rounded-xl text-xs overflow-x-auto border dark:border-slate-800/80">
              <button
                id="tab-overview"
                onClick={() => setActiveTab('overview')}
                className={`px-3 py-1.5 rounded-lg font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
                  activeTab === 'overview'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Indicators & Specs</span>
              </button>

              <button
                id="tab-charts"
                onClick={() => setActiveTab('charts')}
                className={`px-3 py-1.5 rounded-lg font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
                  activeTab === 'charts'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <BarChart2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Biểu đồ Tương tác</span>
                <span className="hidden sm:inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300">
                  Line & Bar
                </span>
              </button>

              <button
                id="tab-trends"
                onClick={() => setActiveTab('trends')}
                className={`px-3 py-1.5 rounded-lg font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
                  activeTab === 'trends'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Globe2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Macro Trends</span>
                <span className="hidden sm:inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300">
                  Search
                </span>
              </button>

              <button
                id="tab-fiscal"
                onClick={() => setActiveTab('fiscal')}
                className={`px-3 py-1.5 rounded-lg font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
                  activeTab === 'fiscal'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Scale className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Fiscal Policy AI</span>
              </button>

              <button
                id="tab-copilot"
                onClick={() => setActiveTab('copilot')}
                className={`px-3 py-1.5 rounded-lg font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
                  activeTab === 'copilot'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <BrainCircuit className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                <span>AI Copilot</span>
                <span className="hidden sm:inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-violet-100 dark:bg-violet-900/60 text-violet-800 dark:text-violet-300">
                  Stress Test
                </span>
              </button>

              <button
                id="tab-what-if"
                onClick={() => setActiveTab('what-if')}
                className={`px-3 py-1.5 rounded-lg font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
                  activeTab === 'what-if'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Sliders className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                <span>What-If Scenario</span>
              </button>

              <button
                id="tab-heatmap"
                onClick={() => setActiveTab('heatmap')}
                className={`px-3 py-1.5 rounded-lg font-semibold flex items-center space-x-1.5 transition-all ${
                  activeTab === 'heatmap'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Grid3X3 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Variance Heatmap</span>
              </button>

              <button
                id="tab-history"
                onClick={() => setActiveTab('history')}
                className={`px-3 py-1.5 rounded-lg font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
                  activeTab === 'history'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Historical Trends (20Y)</span>
              </button>

              <button
                id="tab-projection"
                onClick={() => setActiveTab('projection')}
                className={`px-3 py-1.5 rounded-lg font-semibold flex items-center space-x-1.5 transition-all ${
                  activeTab === 'projection'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Growth Projection</span>
              </button>

              <button
                id="tab-sectors"
                onClick={() => setActiveTab('sectors')}
                className={`px-3 py-1.5 rounded-lg font-semibold flex items-center space-x-1.5 transition-all ${
                  activeTab === 'sectors'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Sectors & Composition</span>
              </button>

              <button
                id="tab-radar"
                onClick={() => setActiveTab('radar')}
                className={`px-3 py-1.5 rounded-lg font-semibold flex items-center space-x-1.5 transition-all ${
                  activeTab === 'radar'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Compass className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Radar Profile</span>
              </button>

              <button
                id="tab-equivalence"
                onClick={() => setActiveTab('equivalence')}
                className={`px-3 py-1.5 rounded-lg font-semibold flex items-center space-x-1.5 transition-all ${
                  activeTab === 'equivalence'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Calculator className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span>Equivalence Lab</span>
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <button
                id="open-multi-entity-tab-btn"
                onClick={() => setIsMultiEntityOpen(true)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-900 hover:bg-slate-100 hover:dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 border border-slate-200 dark:border-slate-800 flex items-center space-x-1.5 transition-colors shadow-2xs group cursor-pointer"
                title="Open 5-Way Aggregate Multi-Entity Comparison (Press M)"
              >
                <Users className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform" />
                <span>5-Way Lab</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-200 border border-indigo-200/60 dark:border-indigo-800">
                  Up to 5
                </span>
                <kbd className="hidden lg:inline-block px-1 py-0.2 text-[9px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded border border-slate-200 dark:border-slate-700 ml-0.5">
                  M
                </kbd>
              </button>

              <button
                id="customize-indicators-global-btn"
                onClick={() => setIsIndicatorModalOpen(true)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-900 hover:bg-slate-100 hover:dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 border border-slate-200 dark:border-slate-800 flex items-center space-x-1.5 transition-colors shadow-2xs group cursor-pointer"
                title="Select or deselect economic indicators to compare (Press I)"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 group-hover:rotate-45 transition-transform" />
                <span>Indicators</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-200 border border-indigo-200/60 dark:border-indigo-800">
                  {selectedIndicatorIds.length}/{ALL_INDICATORS.length}
                </span>
                <kbd className="hidden lg:inline-block px-1 py-0.2 text-[9px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded border border-slate-200 dark:border-slate-700 ml-0.5">
                  I
                </kbd>
              </button>

              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden lg:inline">
                Comparing <strong className="text-slate-700 dark:text-slate-200">{entityA.name}</strong> with <strong className="text-slate-700 dark:text-slate-200">{entityB.name}</strong>
              </span>
            </div>
          </div>

          {/* Active Tab Content */}
          <div className="mt-6 space-y-6">
            {activeTab === 'overview' && (
              <>
                {/* Executive Country Spotlight Briefing with Gemini Intelligence */}
                <CountrySpotlight entityA={entityA} entityB={entityB} />

                {/* Interactive Visual Charts (Line Trends & Comparative Bars) */}
                <InteractiveEconomicCharts
                  entityA={entityA}
                  entityB={entityB}
                  onSelectEntity={handleSelectEntity}
                />

                <VarianceHeatmap entityA={entityA} entityB={entityB} />
                <MetricComparisonTable
                  entityA={entityA}
                  entityB={entityB}
                  selectedIndicatorIds={selectedIndicatorIds}
                  onOpenIndicatorSelector={() => setIsIndicatorModalOpen(true)}
                  onChangeSelectedIds={setSelectedIndicatorIds}
                  onResetIndicators={() => setSelectedIndicatorIds(DEFAULT_SELECTED_INDICATOR_IDS)}
                />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <HistoricalChart
                    entityA={entityA}
                    entityB={entityB}
                    sharedHoveredYear={sharedHoveredYear}
                    onHoverYear={setSharedHoveredYear}
                  />
                  <SectorBreakdown entityA={entityA} entityB={entityB} />
                </div>
                {/* Side-by-side AI-powered Fiscal Policy Analyzer */}
                <FiscalPolicyAnalyzer entityA={entityA} entityB={entityB} />
              </>
            )}

            {activeTab === 'charts' && (
              <div className="space-y-6">
                <InteractiveEconomicCharts
                  entityA={entityA}
                  entityB={entityB}
                  onSelectEntity={handleSelectEntity}
                />
                <MetricComparisonTable
                  entityA={entityA}
                  entityB={entityB}
                  selectedIndicatorIds={selectedIndicatorIds}
                  onOpenIndicatorSelector={() => setIsIndicatorModalOpen(true)}
                  onChangeSelectedIds={setSelectedIndicatorIds}
                  onResetIndicators={() => setSelectedIndicatorIds(DEFAULT_SELECTED_INDICATOR_IDS)}
                />
              </div>
            )}

            {activeTab === 'trends' && (
              <MacroTrendsTab
                entityA={entityA}
                entityB={entityB}
                selectedIndicatorIds={selectedIndicatorIds}
                onOpenIndicatorSelector={() => setIsIndicatorModalOpen(true)}
                onChangeSelectedIds={setSelectedIndicatorIds}
                onResetIndicators={() => setSelectedIndicatorIds(DEFAULT_SELECTED_INDICATOR_IDS)}
              />
            )}

            {activeTab === 'fiscal' && (
              <div className="space-y-6">
                <FiscalPolicyAnalyzer entityA={entityA} entityB={entityB} />
                <MetricComparisonTable
                  entityA={entityA}
                  entityB={entityB}
                  selectedIndicatorIds={selectedIndicatorIds}
                  onOpenIndicatorSelector={() => setIsIndicatorModalOpen(true)}
                  onChangeSelectedIds={setSelectedIndicatorIds}
                  onResetIndicators={() => setSelectedIndicatorIds(DEFAULT_SELECTED_INDICATOR_IDS)}
                />
              </div>
            )}

            {activeTab === 'copilot' && (
              <div className="space-y-6">
                <MacroAnalystCopilot entityA={entityA} entityB={entityB} />
              </div>
            )}

            {activeTab === 'what-if' && (
              <div className="space-y-6">
                <WhatIfScenarioBuilder entityA={entityA} entityB={entityB} />
                <MetricComparisonTable
                  entityA={entityA}
                  entityB={entityB}
                  selectedIndicatorIds={selectedIndicatorIds}
                  onOpenIndicatorSelector={() => setIsIndicatorModalOpen(true)}
                  onChangeSelectedIds={setSelectedIndicatorIds}
                  onResetIndicators={() => setSelectedIndicatorIds(DEFAULT_SELECTED_INDICATOR_IDS)}
                />
              </div>
            )}

            {activeTab === 'heatmap' && (
              <div className="space-y-6">
                <VarianceHeatmap entityA={entityA} entityB={entityB} />
                <MetricComparisonTable
                  entityA={entityA}
                  entityB={entityB}
                  selectedIndicatorIds={selectedIndicatorIds}
                  onOpenIndicatorSelector={() => setIsIndicatorModalOpen(true)}
                  onChangeSelectedIds={setSelectedIndicatorIds}
                  onResetIndicators={() => setSelectedIndicatorIds(DEFAULT_SELECTED_INDICATOR_IDS)}
                />
              </div>
            )}


            {activeTab === 'history' && (
              <div className="space-y-6">
                <HistoricalChart
                  entityA={entityA}
                  entityB={entityB}
                  sharedHoveredYear={sharedHoveredYear}
                  onHoverYear={setSharedHoveredYear}
                />
                <MetricComparisonTable
                  entityA={entityA}
                  entityB={entityB}
                  selectedIndicatorIds={selectedIndicatorIds}
                  onOpenIndicatorSelector={() => setIsIndicatorModalOpen(true)}
                  onChangeSelectedIds={setSelectedIndicatorIds}
                  onResetIndicators={() => setSelectedIndicatorIds(DEFAULT_SELECTED_INDICATOR_IDS)}
                />
              </div>
            )}

            {activeTab === 'projection' && (
              <div className="space-y-6">
                <GrowthProjectionLab entityA={entityA} entityB={entityB} />
                <MetricComparisonTable
                  entityA={entityA}
                  entityB={entityB}
                  selectedIndicatorIds={selectedIndicatorIds}
                  onOpenIndicatorSelector={() => setIsIndicatorModalOpen(true)}
                  onChangeSelectedIds={setSelectedIndicatorIds}
                  onResetIndicators={() => setSelectedIndicatorIds(DEFAULT_SELECTED_INDICATOR_IDS)}
                />
              </div>
            )}

            {activeTab === 'sectors' && (
              <div className="space-y-6">
                <SectorBreakdown entityA={entityA} entityB={entityB} />
                <MetricComparisonTable
                  entityA={entityA}
                  entityB={entityB}
                  selectedIndicatorIds={selectedIndicatorIds}
                  onOpenIndicatorSelector={() => setIsIndicatorModalOpen(true)}
                  onChangeSelectedIds={setSelectedIndicatorIds}
                  onResetIndicators={() => setSelectedIndicatorIds(DEFAULT_SELECTED_INDICATOR_IDS)}
                />
              </div>
            )}

            {activeTab === 'radar' && (
              <div className="space-y-6">
                <EconomicRadar entityA={entityA} entityB={entityB} />
                <MetricComparisonTable
                  entityA={entityA}
                  entityB={entityB}
                  selectedIndicatorIds={selectedIndicatorIds}
                  onOpenIndicatorSelector={() => setIsIndicatorModalOpen(true)}
                  onChangeSelectedIds={setSelectedIndicatorIds}
                  onResetIndicators={() => setSelectedIndicatorIds(DEFAULT_SELECTED_INDICATOR_IDS)}
                />
              </div>
            )}

            {activeTab === 'equivalence' && (
              <div className="space-y-6">
                <EquivalenceCalculator entityA={entityA} entityB={entityB} />
                <MetricComparisonTable
                  entityA={entityA}
                  entityB={entityB}
                  selectedIndicatorIds={selectedIndicatorIds}
                  onOpenIndicatorSelector={() => setIsIndicatorModalOpen(true)}
                  onChangeSelectedIds={setSelectedIndicatorIds}
                  onResetIndicators={() => setSelectedIndicatorIds(DEFAULT_SELECTED_INDICATOR_IDS)}
                />
              </div>
            )}

            {/* Live Financial & Economic Policy News (retrieved via Google Search for entityA & entityB) */}
            <EconomicNewsSection entityA={entityA} entityB={entityB} />

            {/* Subnational Regional Breakdown Explorer (always accessible when a country is active) */}
            <ConstituentRegions
              entityA={entityA}
              entityB={entityB}
              onSelectEntityA={(selected) => setEntityA(selected)}
              onSelectEntityB={(selected) => setEntityB(selected)}
            />

            {/* Print-Only Professional Document Footer */}
            <div id="print-document-footer" className="hidden print:block mt-10 pt-4 border-t-2 border-slate-900 text-2xs text-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-extrabold text-slate-900">GDP & Macroeconomic Indicator Comparator</span> • Official Executive Print Edition
                </div>
                <div className="font-mono text-slate-600">
                  Report Generated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })} • Authorized Copy
                </div>
              </div>
              <div className="mt-1 text-[10px] text-slate-500">
                Sources: World Bank Development Indicators, IMF World Economic Outlook, OECD Statistical Database, US Bureau of Economic Analysis (BEA), Eurostat, and National Statistical Bureaus. Standardized to USD parity & native legal tender.
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-8 text-xs text-slate-500 dark:text-slate-400 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-slate-700 dark:text-slate-200">
              GDP & Economic Indicator Comparator
            </p>
            <p className="mt-1 text-slate-500 dark:text-slate-400">
              Data compiled and harmonized from the World Bank World Development Indicators, IMF World Economic Outlook, OECD, US Bureau of Economic Analysis (BEA), Eurostat, and National Statistical Bureaus.
            </p>
          </div>
          <div className="text-slate-400 dark:text-slate-500 text-right whitespace-nowrap shrink-0">
            <span>Updated 2024 / 2025 Macro Series</span>
          </div>
        </div>
      </footer>

      {/* Entity Selector Modal */}
      <EntitySelectorModal
        isOpen={isSelectorOpen}
        onClose={() => setIsSelectorOpen(false)}
        onSelect={handleSelectEntity}
        selectedEntityId={targetSlot === 'A' ? entityA.id : entityB.id}
        otherEntityId={targetSlot === 'A' ? entityB.id : entityA.id}
        targetSlot={targetSlot}
      />

      {/* Export Summary Modal */}
      <ExportSummaryModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        entityA={entityA}
        entityB={entityB}
        onOpenGoogleSheets={() => setIsSheetsOpen(true)}
        selectedIndicatorIds={selectedIndicatorIds}
      />

      {/* Google Sheets Integration Modal */}
      <GoogleSheetsModal
        isOpen={isSheetsOpen}
        onClose={() => setIsSheetsOpen(false)}
        entityA={entityA}
        entityB={entityB}
      />

      {/* Real-Time Live Currency Converter Modal */}
      <CurrencyConverterModal
        isOpen={isCurrencyModalOpen}
        onClose={() => setIsCurrencyModalOpen(false)}
        entityA={entityA}
        entityB={entityB}
      />

      {/* Indicator Selection & Customizer Modal */}
      <IndicatorSelectorModal
        isOpen={isIndicatorModalOpen}
        onClose={() => setIsIndicatorModalOpen(false)}
        selectedIds={selectedIndicatorIds}
        onChangeSelectedIds={setSelectedIndicatorIds}
        onResetToDefault={() => setSelectedIndicatorIds(DEFAULT_SELECTED_INDICATOR_IDS)}
      />

      {/* Multi-Entity Aggregate Comparison Modal (Up to 5) */}
      <MultiEntityComparisonModal
        isOpen={isMultiEntityOpen}
        onClose={() => setIsMultiEntityOpen(false)}
        initialEntities={[entityA, entityB]}
        onSetDualComparison={(a, b) => {
          setEntityA(a);
          setEntityB(b);
          setActiveCuratedId(undefined);
        }}
      />

      {/* Floating Recent Comparisons Trigger Button */}
      <button
        id="floating-recent-comparisons-btn"
        onClick={() => setIsRecentOpen(true)}
        className="fixed bottom-5 right-5 z-20 bg-slate-900/90 dark:bg-slate-800/90 hover:bg-slate-900 hover:dark:bg-slate-700 text-white px-3.5 py-2 rounded-full shadow-lg border border-slate-700/70 dark:border-slate-700 backdrop-blur-xs flex items-center space-x-2 transition-all hover:scale-105 active:scale-95 group focus:outline-none focus:ring-2 focus:ring-indigo-500"
        title="View Recent Comparisons (Press H)"
      >
        <History className="w-4 h-4 text-indigo-400 group-hover:rotate-[-20deg] transition-transform" />
        <span className="text-xs font-semibold">Recent</span>
        <span className="bg-indigo-600 dark:bg-indigo-500 text-white text-[10px] font-bold rounded-full min-w-4 h-4 px-1 flex items-center justify-center">
          {recentComparisons.length}
        </span>
      </button>

      {/* Recent Comparisons Slide-over Drawer */}
      <RecentComparisonsSidebar
        isOpen={isRecentOpen}
        onClose={() => setIsRecentOpen(false)}
        recentComparisons={recentComparisons}
        currentEntityA={entityA}
        currentEntityB={entityB}
        onSelectComparison={handleSelectRecentComparison}
        onRemoveComparison={handleRemoveRecentComparison}
        onClearAll={handleClearAllRecent}
      />
    </div>
  );
}
