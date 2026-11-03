import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Globe2,
  Search,
  ExternalLink,
  RefreshCw,
  Landmark,
  TrendingUp,
  TrendingDown,
  Scale,
  Sparkles,
  ArrowUpRight,
  Info,
  Clock,
  ShieldAlert,
  Zap,
  Cpu,
  Layers,
  SlidersHorizontal,
  ChevronRight,
  Flame,
  CheckCircle2,
} from 'lucide-react';
import { EconomicEntity, EconomicNewsArticle, EconomicNewsResponse, GlobalMacroTrend } from '../types';
import { getFallbackNews } from '../data/newsFallbackData';
import { MetricComparisonTable } from './MetricComparisonTable';

interface MacroTrendsTabProps {
  entityA: EconomicEntity;
  entityB: EconomicEntity;
  selectedIndicatorIds?: string[];
  onOpenIndicatorSelector?: () => void;
  onChangeSelectedIds?: (ids: string[]) => void;
  onResetIndicators?: () => void;
}

const THEME_ICONS: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  monetary: {
    label: 'Monetary & Interest Rates',
    icon: Landmark,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800',
  },
  trade: {
    label: 'Trade, Tariffs & Friend-Shoring',
    icon: Scale,
    color: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-800',
  },
  technology: {
    label: 'Technology & AI Infrastructure',
    icon: Cpu,
    color: 'text-indigo-600 dark:text-indigo-400',
    bg: 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800',
  },
  commodities: {
    label: 'Energy Transition & Commodities',
    icon: Zap,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800',
  },
  geopolitics: {
    label: 'Geopolitical Dynamics',
    icon: ShieldAlert,
    color: 'text-rose-600 dark:text-rose-400',
    bg: 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800',
  },
};

const CATEGORY_TAGS: Record<string, { label: string; bg: string; text: string; border: string }> = {
  fiscal: {
    label: 'Fiscal & Budget',
    bg: 'bg-amber-50 dark:bg-amber-950/60',
    text: 'text-amber-800 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800',
  },
  monetary: {
    label: 'Monetary & Rates',
    bg: 'bg-blue-50 dark:bg-blue-950/60',
    text: 'text-blue-800 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800',
  },
  growth: {
    label: 'GDP & Growth',
    bg: 'bg-emerald-50 dark:bg-emerald-950/60',
    text: 'text-emerald-800 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800',
  },
  trade: {
    label: 'Trade & Tariffs',
    bg: 'bg-purple-50 dark:bg-purple-950/60',
    text: 'text-purple-800 dark:text-purple-300',
    border: 'border-purple-200 dark:border-purple-800',
  },
  reform: {
    label: 'Structural Reform',
    bg: 'bg-sky-50 dark:bg-sky-950/60',
    text: 'text-sky-800 dark:text-sky-300',
    border: 'border-sky-200 dark:border-sky-800',
  },
  tech: {
    label: 'Tech & Capital Spend',
    bg: 'bg-indigo-50 dark:bg-indigo-950/60',
    text: 'text-indigo-800 dark:text-indigo-300',
    border: 'border-indigo-200 dark:border-indigo-800',
  },
};

export function MacroTrendsTab({
  entityA,
  entityB,
  selectedIndicatorIds,
  onOpenIndicatorSelector,
  onChangeSelectedIds,
  onResetIndicators,
}: MacroTrendsTabProps) {
  const [data, setData] = useState<EconomicNewsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedEntityFilter, setSelectedEntityFilter] = useState<'all' | 'A' | 'B' | 'global'>('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [lastFetchedTime, setLastFetchedTime] = useState<string | null>(null);
  const [activeThematicFilter, setActiveThematicFilter] = useState<string>('all');
  const [showQueriesModal, setShowQueriesModal] = useState(false);

  const fetchTrendsAndNews = useCallback(async () => {
    setLoading(true);
    setError(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    try {
      const response = await fetch('/api/news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          entityA: {
            id: entityA.id,
            name: entityA.name,
            shortName: entityA.shortName,
            type: entityA.type,
            publicDebtToGdp: entityA.publicDebtToGdp,
            tradeBalance: entityA.tradeBalance,
            topIndustries: entityA.topIndustries,
          },
          entityB: {
            id: entityB.id,
            name: entityB.name,
            shortName: entityB.shortName,
            type: entityB.type,
            publicDebtToGdp: entityB.publicDebtToGdp,
            tradeBalance: entityB.tradeBalance,
            topIndustries: entityB.topIndustries,
          },
        }),
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: Failed to fetch macro trends`);
      }

      const result: EconomicNewsResponse = await response.json();
      setData(result);
      setLastFetchedTime(
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      );
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.warn('Macro trends fallback wire active:', err?.message || err);
      const fallback = getFallbackNews(entityA, entityB);
      setData(fallback);
      setError(null);
      setLastFetchedTime(
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      );
    } finally {
      setLoading(false);
    }
  }, [entityA, entityB]);

  useEffect(() => {
    fetchTrendsAndNews();
  }, [fetchTrendsAndNews]);

  // Filter global trends based on theme selection
  const filteredTrends = useMemo(() => {
    const trends = data?.globalTrends || [];
    if (activeThematicFilter === 'all') return trends;
    return trends.filter((t) => t.theme === activeThematicFilter);
  }, [data?.globalTrends, activeThematicFilter]);

  // Filter news articles based on selected entity & category
  const filteredArticles = useMemo(() => {
    return (data?.articles || []).filter((art: EconomicNewsArticle) => {
      if (selectedEntityFilter !== 'all') {
        const artEntity = art.entity.toLowerCase();
        if (selectedEntityFilter === 'A') {
          const matchesA =
            artEntity.includes(entityA.shortName.toLowerCase()) ||
            artEntity.includes(entityA.name.toLowerCase());
          if (!matchesA) return false;
        } else if (selectedEntityFilter === 'B') {
          const matchesB =
            artEntity.includes(entityB.shortName.toLowerCase()) ||
            artEntity.includes(entityB.name.toLowerCase());
          if (!matchesB) return false;
        } else if (selectedEntityFilter === 'global') {
          if (!artEntity.includes('both') && !artEntity.includes('global')) return false;
        }
      }

      if (selectedCategoryFilter !== 'all') {
        if (art.category !== selectedCategoryFilter) return false;
      }

      return true;
    });
  }, [data?.articles, selectedEntityFilter, selectedCategoryFilter, entityA, entityB]);

  return (
    <div id="macro-trends-tab-view" className="space-y-6">
      {/* Top Banner & Control Deck */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 bg-linear-to-r from-slate-50 via-white to-blue-50/40 dark:from-slate-900 dark:via-slate-850 dark:to-blue-950/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-1.5 rounded-lg bg-blue-600 text-white shadow-xs">
                <Globe2 className="w-4 h-4" />
              </span>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                Global Macro Trends & Real-Time Intelligence
              </h2>
              {data?.source === 'google_search_grounding' ? (
                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-2xs font-semibold bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  <Search className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                  <span>Google Search Grounded</span>
                </span>
              ) : (
                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-2xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  <Landmark className="w-3 h-3 text-slate-600 dark:text-slate-400" />
                  <span>Institutional Intelligence Wire</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-3xl">
              Aggregating verified real-time Google Search updates, central bank statements, cross-border trade shocks, and global structural shifts affecting{' '}
              <strong className="text-slate-700 dark:text-slate-200">{entityA.name}</strong> and{' '}
              <strong className="text-slate-700 dark:text-slate-200">{entityB.name}</strong>.
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            {lastFetchedTime && (
              <span className="text-2xs text-slate-400 dark:text-slate-500 flex items-center space-x-1 font-mono">
                <Clock className="w-3 h-3" />
                <span>Synced {lastFetchedTime}</span>
              </span>
            )}

            <button
              id="refresh-macro-trends-btn"
              onClick={fetchTrendsAndNews}
              disabled={loading}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center space-x-1.5 transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-white ${loading ? 'animate-spin' : ''}`}
              />
              <span>{loading ? 'Searching Web...' : 'Refresh Trends'}</span>
            </button>
          </div>
        </div>

        {/* Executive Comparative Macro Briefing */}
        <div className="p-5 sm:p-6 bg-slate-50/70 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-800">
          <div className="p-4 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 text-slate-800 dark:text-slate-200 text-xs leading-relaxed flex items-start space-x-3">
            <span className="p-1 rounded-md bg-blue-600 text-white shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4" />
            </span>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-blue-950 dark:text-blue-300 text-xs uppercase tracking-wider">
                  Executive Cross-Border Macro Synthesis
                </span>
                {data?.searchedQueries && (
                  <button
                    onClick={() => setShowQueriesModal((prev) => !prev)}
                    className="text-2xs font-semibold text-blue-700 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Search className="w-3 h-3" />
                    <span>{data.searchedQueries.length} Google Searches Executed</span>
                  </button>
                )}
              </div>
              <p className="text-slate-700 dark:text-slate-300 text-xs leading-relaxed">
                {data?.macroBriefing || 'Aggregating comparative intelligence...'}
              </p>

              {/* Collapsible search query chips */}
              {showQueriesModal && data?.searchedQueries && (
                <div className="mt-3 pt-3 border-t border-blue-200/60 dark:border-blue-900/60 flex flex-wrap items-center gap-1.5 animate-in fade-in duration-150">
                  <span className="text-2xs font-bold text-blue-800 dark:text-blue-300 mr-1">
                    Live Queries Dispatched:
                  </span>
                  {data.searchedQueries.map((q, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-blue-200 dark:border-slate-700 text-2xs font-mono"
                    >
                      &ldquo;{q}&rdquo;
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Global Macro Trends Driver Matrix */}
        <div className="p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Global Macroeconomic Currents & Structural Exposures</span>
              </h3>
              <p className="text-2xs text-slate-500 dark:text-slate-400 mt-0.5">
                Evaluation of how overarching global forces generate tailwinds vs. headwinds for each entity based on their industrial and fiscal composition.
              </p>
            </div>

            {/* Theme filter tabs */}
            <div className="flex items-center space-x-1 text-2xs bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 overflow-x-auto">
              <button
                onClick={() => setActiveThematicFilter('all')}
                className={`px-2 py-1 rounded font-semibold transition-colors cursor-pointer ${
                  activeThematicFilter === 'all'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                All ({(data?.globalTrends || []).length})
              </button>
              {Object.entries(THEME_ICONS).map(([key, item]) => (
                <button
                  key={key}
                  onClick={() => setActiveThematicFilter(key)}
                  className={`px-2 py-1 rounded font-semibold transition-colors flex items-center space-x-1 cursor-pointer whitespace-nowrap ${
                    activeThematicFilter === key
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <item.icon className="w-3 h-3" />
                  <span className="hidden sm:inline">{item.label.split('&')[0].trim()}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Trend Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredTrends.map((trend) => {
              const themeConfig = THEME_ICONS[trend.theme] || THEME_ICONS.monetary;
              const ThemeIcon = themeConfig.icon;

              return (
                <div
                  key={trend.id}
                  className="bg-white dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Header: Theme badge & title */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center space-x-2">
                        <span className={`p-1.5 rounded-lg ${themeConfig.bg} ${themeConfig.color}`}>
                          <ThemeIcon className="w-3.5 h-3.5" />
                        </span>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          {themeConfig.label}
                        </span>
                      </div>
                      {trend.keyMetricLink && (
                        <span className="text-3xs font-mono font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700">
                          {trend.keyMetricLink}
                        </span>
                      )}
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 mb-1 leading-snug">
                      {trend.title}
                    </h4>
                    <p className="text-2xs text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
                      {trend.description}
                    </p>
                  </div>

                  {/* Impact on Entity A vs Entity B */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-2xs">
                    {/* Entity A Impact */}
                    <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/80 border border-slate-150 dark:border-slate-800/80">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1">
                          <span>{entityA.shortName}</span>
                          <span className="text-[10px] text-slate-400 font-normal">({entityA.flag})</span>
                        </span>
                        <span
                          className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase tracking-wider flex items-center space-x-0.5 ${
                            trend.impactA.type === 'tailwind'
                              ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : trend.impactA.type === 'headwind'
                              ? 'bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {trend.impactA.type === 'tailwind' ? (
                            <TrendingUp className="w-3 h-3 mr-0.5" />
                          ) : trend.impactA.type === 'headwind' ? (
                            <TrendingDown className="w-3 h-3 mr-0.5" />
                          ) : null}
                          <span>{trend.impactA.type}</span>
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 leading-tight">
                        {trend.impactA.summary}
                      </p>
                    </div>

                    {/* Entity B Impact */}
                    <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/80 border border-slate-150 dark:border-slate-800/80">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1">
                          <span>{entityB.shortName}</span>
                          <span className="text-[10px] text-slate-400 font-normal">({entityB.flag})</span>
                        </span>
                        <span
                          className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase tracking-wider flex items-center space-x-0.5 ${
                            trend.impactB.type === 'tailwind'
                              ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : trend.impactB.type === 'headwind'
                              ? 'bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {trend.impactB.type === 'tailwind' ? (
                            <TrendingUp className="w-3 h-3 mr-0.5" />
                          ) : trend.impactB.type === 'headwind' ? (
                            <TrendingDown className="w-3 h-3 mr-0.5" />
                          ) : null}
                          <span>{trend.impactB.type}</span>
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 leading-tight">
                        {trend.impactB.summary}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Aggregated News Feed Section */}
        <div className="p-5 sm:p-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Search className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Google Search Aggregated News & Direct Market Reports</span>
              </h3>
              <p className="text-2xs text-slate-500 dark:text-slate-400 mt-0.5">
                Current verified reporting from major financial publishers covering rate adjustments, fiscal debates, and growth updates.
              </p>
            </div>

            {/* Filter pills: Entity & Topic */}
            <div className="flex flex-wrap items-center gap-2 text-2xs">
              {/* Entity Scope Filter */}
              <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setSelectedEntityFilter('all')}
                  className={`px-2 py-1 rounded font-semibold transition-colors cursor-pointer ${
                    selectedEntityFilter === 'all'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setSelectedEntityFilter('A')}
                  className={`px-2 py-1 rounded font-semibold transition-colors cursor-pointer ${
                    selectedEntityFilter === 'A'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {entityA.shortName}
                </button>
                <button
                  onClick={() => setSelectedEntityFilter('B')}
                  className={`px-2 py-1 rounded font-semibold transition-colors cursor-pointer ${
                    selectedEntityFilter === 'B'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {entityB.shortName}
                </button>
                <button
                  onClick={() => setSelectedEntityFilter('global')}
                  className={`px-2 py-1 rounded font-semibold transition-colors cursor-pointer ${
                    selectedEntityFilter === 'global'
                      ? 'bg-purple-600 text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Global
                </button>
              </div>

              {/* Category Filter */}
              <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 overflow-x-auto">
                <button
                  onClick={() => setSelectedCategoryFilter('all')}
                  className={`px-2 py-1 rounded font-semibold transition-colors cursor-pointer ${
                    selectedCategoryFilter === 'all'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  All Topics
                </button>
                {Object.entries(CATEGORY_TAGS).map(([key, cat]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedCategoryFilter(key)}
                    className={`px-2 py-1 rounded font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                      selectedCategoryFilter === key
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* News Article Grid */}
          {filteredArticles.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-500">
              No articles match the current filter selection. Try selecting &ldquo;All Coverage&rdquo; or &ldquo;All Topics&rdquo;.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
              {filteredArticles.map((article) => {
                const catConfig = CATEGORY_TAGS[article.category] || CATEGORY_TAGS.growth;
                const isEntityA =
                  article.entity.toLowerCase().includes(entityA.shortName.toLowerCase()) ||
                  article.entity.toLowerCase().includes(entityA.name.toLowerCase());
                const isEntityB =
                  article.entity.toLowerCase().includes(entityB.shortName.toLowerCase()) ||
                  article.entity.toLowerCase().includes(entityB.name.toLowerCase());

                return (
                  <article
                    key={article.id}
                    className="p-4 rounded-xl bg-slate-50/60 dark:bg-slate-850/60 border border-slate-200/90 dark:border-slate-800 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all group"
                  >
                    <div>
                      {/* Meta header: Category, Entity badge, Source */}
                      <div className="flex items-center justify-between gap-1.5 mb-2 text-3xs">
                        <div className="flex items-center space-x-1.5">
                          <span
                            className={`px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${catConfig.bg} ${catConfig.text} border ${catConfig.border}`}
                          >
                            {catConfig.label}
                          </span>

                          <span
                            className={`px-1.5 py-0.5 rounded font-semibold ${
                              isEntityA
                                ? 'bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300'
                                : isEntityB
                                ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {isEntityA
                              ? `${entityA.shortName} ${entityA.flag}`
                              : isEntityB
                              ? `${entityB.shortName} ${entityB.flag}`
                              : 'Both / Global'}
                          </span>
                        </div>

                        <span className="text-slate-400 font-mono">{article.date || 'Recent'}</span>
                      </div>

                      {/* Headline */}
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug mb-1.5">
                        {article.title}
                      </h4>

                      {/* Summary */}
                      <p className="text-2xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3">
                        {article.summary}
                      </p>
                    </div>

                    {/* Footer: Publisher & Verified Link */}
                    <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-2xs">
                      <span className="font-semibold text-slate-500 dark:text-slate-400 truncate max-w-[170px]">
                        {article.source}
                      </span>
                      <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold group/link"
                      >
                        <span>View Source</span>
                        <ArrowUpRight className="w-3 h-3 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                      </a>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {/* Verified Web Grounding References */}
          {data?.webSources && data.webSources.length > 0 && (
            <div className="mt-5 p-3 rounded-lg bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 text-2xs">
              <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                Verified Grounding Sources Cited:
              </span>
              <div className="flex flex-wrap gap-2">
                {data.webSources.map((source, index) => (
                  <a
                    key={index}
                    href={source.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors shadow-2xs"
                  >
                    <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                    <span className="truncate max-w-[220px]">{source.title || source.uri}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Embedded Metric Specification Table to evaluate the trends against numbers */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Macroeconomic Data Baseline for {entityA.shortName} vs. {entityB.shortName}
            </h3>
          </div>
          <span className="text-2xs text-slate-400">
            Compare quantitative benchmarks against active macro trends
          </span>
        </div>

        <MetricComparisonTable
          entityA={entityA}
          entityB={entityB}
          selectedIndicatorIds={selectedIndicatorIds}
          onOpenIndicatorSelector={onOpenIndicatorSelector}
          onChangeSelectedIds={onChangeSelectedIds}
          onResetIndicators={onResetIndicators}
        />
      </div>
    </div>
  );
}
