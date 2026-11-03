import { useState, useEffect, useCallback } from 'react';
import {
  Newspaper,
  Search,
  ExternalLink,
  RefreshCw,
  Landmark,
  TrendingUp,
  Scale,
  Sparkles,
  ArrowUpRight,
  Info,
  Clock,
  Link2,
  Activity,
  Layers,
  ShieldAlert,
  Coins,
  Cpu,
  Zap,
} from 'lucide-react';
import { EconomicEntity, EconomicNewsArticle, EconomicNewsResponse, GlobalMacroTrend } from '../types';
import { getFallbackNews } from '../data/newsFallbackData';

interface EconomicNewsSectionProps {
  entityA: EconomicEntity;
  entityB: EconomicEntity;
}

const CATEGORY_LABELS: Record<string, { label: string; bg: string; text: string; border: string }> = {
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
};

const CORRELATION_FILTER_OPTIONS = [
  { key: 'all', label: 'All Indicators' },
  { key: 'gdp', label: 'Real GDP Growth' },
  { key: 'inflation', label: 'Inflation (CPI)' },
  { key: 'debt', label: 'Public Debt-to-GDP' },
  { key: 'trade', label: 'Trade Balance' },
  { key: 'unemployment', label: 'Unemployment' },
];

export function EconomicNewsSection({ entityA, entityB }: EconomicNewsSectionProps) {
  const [data, setData] = useState<EconomicNewsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedEntityFilter, setSelectedEntityFilter] = useState<string>('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [selectedIndicatorFilter, setSelectedIndicatorFilter] = useState<string>('all');
  const [showGlobalTrends, setShowGlobalTrends] = useState<boolean>(true);
  const [lastFetchedTime, setLastFetchedTime] = useState<string | null>(null);

  const fetchNews = useCallback(async () => {
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
            inflationRate: entityA.inflationRate,
            publicDebtToGdp: entityA.publicDebtToGdp,
            gdpGrowthRate: entityA.gdpGrowthRate,
            tradeBalance: entityA.tradeBalance,
          },
          entityB: {
            id: entityB.id,
            name: entityB.name,
            shortName: entityB.shortName,
            type: entityB.type,
            inflationRate: entityB.inflationRate,
            publicDebtToGdp: entityB.publicDebtToGdp,
            gdpGrowthRate: entityB.gdpGrowthRate,
            tradeBalance: entityB.tradeBalance,
          },
        }),
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: Failed to fetch news`);
      }

      const result: EconomicNewsResponse = await response.json();
      setData(result);
      setLastFetchedTime(
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      );
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.warn('Economic news using high-fidelity curated wire:', err?.message || err);
      const fallback = getFallbackNews(entityA, entityB);
      setData(fallback);
      setError(null);
      setLastFetchedTime(
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      );
    } finally {
      setLoading(false);
    }
  }, [
    entityA.id,
    entityA.name,
    entityA.shortName,
    entityA.type,
    entityA.inflationRate,
    entityA.publicDebtToGdp,
    entityA.gdpGrowthRate,
    entityA.tradeBalance,
    entityB.id,
    entityB.name,
    entityB.shortName,
    entityB.type,
    entityB.inflationRate,
    entityB.publicDebtToGdp,
    entityB.gdpGrowthRate,
    entityB.tradeBalance,
  ]);

  // Refetch whenever the active entities change
  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  // Filter articles based on entity, topic category, and indicator correlation
  const filteredArticles = (data?.articles || []).filter((art: EconomicNewsArticle) => {
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

    if (selectedIndicatorFilter !== 'all') {
      const corrMetric = art.correlation?.metricName?.toLowerCase() || '';
      if (selectedIndicatorFilter === 'gdp' && !corrMetric.includes('gdp') && !corrMetric.includes('growth')) return false;
      if (selectedIndicatorFilter === 'inflation' && !corrMetric.includes('inflation') && !corrMetric.includes('cpi') && !corrMetric.includes('price')) return false;
      if (selectedIndicatorFilter === 'debt' && !corrMetric.includes('debt') && !corrMetric.includes('fiscal')) return false;
      if (selectedIndicatorFilter === 'trade' && !corrMetric.includes('trade') && !corrMetric.includes('export')) return false;
      if (selectedIndicatorFilter === 'unemployment' && !corrMetric.includes('unemployment') && !corrMetric.includes('labor')) return false;
    }

    return true;
  });

  return (
    <section
      id="economic-news-section"
      aria-label="Recent Financial and Economic Policy News"
      className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden transition-colors"
    >
      {/* Header Bar */}
      <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 bg-linear-to-r from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-850 dark:to-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              <Newspaper className="w-4 h-4" />
            </span>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Recent Economic News & Global Event Correlation
            </h2>
            {data?.source === 'curated_fallback' ? (
              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                <Landmark className="w-3 h-3 text-slate-600 dark:text-slate-400" />
                <span>Macro Intelligence</span>
              </span>
            ) : (
              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                <Search className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                <span>Google Search Grounding</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Correlates recent policy headlines and global macro shocks directly with observed changes in GDP, inflation, public debt, and trade metrics for{' '}
            <strong className="text-slate-700 dark:text-slate-200">{entityA.name}</strong> and{' '}
            <strong className="text-slate-700 dark:text-slate-200">{entityB.name}</strong>.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          {lastFetchedTime && (
            <span className="text-2xs text-slate-400 dark:text-slate-500 flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>Synced {lastFetchedTime}</span>
            </span>
          )}
          <button
            id="refresh-news-btn"
            onClick={fetchNews}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center space-x-1.5 transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 dark:text-slate-400 ${loading ? 'animate-spin text-blue-600 dark:text-blue-400' : ''}`} />
            <span>{loading ? 'Searching...' : 'Refresh Headlines'}</span>
          </button>
        </div>
      </div>

      <div className="p-5 sm:p-6 space-y-6">
        {/* Executive Macro Briefing */}
        {data?.macroBriefing && (
          <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100/90 dark:border-blue-900/60 text-slate-800 dark:text-slate-200 text-xs leading-relaxed flex items-start space-x-3">
            <span className="p-1 rounded-md bg-blue-600 dark:bg-blue-500 text-white shrink-0 mt-0.5">
              <Sparkles className="w-3.5 h-3.5" />
            </span>
            <div>
              <span className="font-bold text-blue-900 dark:text-blue-300 block mb-0.5">
                Comparative Policy Synthesis & Observed Metric Linkages
              </span>
              <p className="text-slate-700 dark:text-slate-300">{data.macroBriefing}</p>
            </div>
          </div>
        )}

        {/* Global Macro Events & Observed Indicator Shift Matrix */}
        {data?.globalTrends && data.globalTrends.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Significant Global Macro Events & Indicator Correlations</span>
              </h3>
              <button
                onClick={() => setShowGlobalTrends(!showGlobalTrends)}
                className="text-2xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold cursor-pointer"
              >
                {showGlobalTrends ? 'Collapse Events' : 'Expand Events (4)'}
              </button>
            </div>

            {showGlobalTrends && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {data.globalTrends.map((trend) => (
                  <div
                    key={trend.id}
                    className="p-3.5 rounded-xl bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        {trend.theme === 'monetary' ? (
                          <Landmark className="w-3.5 h-3.5 text-blue-600" />
                        ) : trend.theme === 'trade' ? (
                          <Scale className="w-3.5 h-3.5 text-purple-600" />
                        ) : trend.theme === 'technology' ? (
                          <Cpu className="w-3.5 h-3.5 text-indigo-600" />
                        ) : (
                          <Zap className="w-3.5 h-3.5 text-amber-600" />
                        )}
                        <span>{trend.title}</span>
                      </span>

                      {trend.correlation && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 shrink-0">
                          {trend.correlation.metricName}
                        </span>
                      )}
                    </div>

                    <p className="text-slate-600 dark:text-slate-300 text-2xs leading-relaxed">
                      {trend.headline}
                    </p>

                    {trend.correlation && (
                      <div className="pt-2 border-t border-slate-200/80 dark:border-slate-700 text-2xs bg-white/70 dark:bg-slate-850/70 p-2 rounded-lg">
                        <span className="font-semibold text-slate-700 dark:text-slate-200 block mb-0.5">
                          🔗 Observed Metric Shift:
                        </span>
                        <p className="text-slate-600 dark:text-slate-400">
                          {trend.correlation.explanation} ({trend.correlation.observedChange})
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Filter Controls Bar */}
        <div className="space-y-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Entity Filter */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
              <span className="text-2xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mr-1">
                Entity:
              </span>
              <button
                onClick={() => setSelectedEntityFilter('all')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  selectedEntityFilter === 'all'
                    ? 'bg-slate-900 dark:bg-slate-700 text-white font-bold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                All Coverage
              </button>
              <button
                onClick={() => setSelectedEntityFilter('A')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors flex items-center space-x-1 cursor-pointer ${
                  selectedEntityFilter === 'A'
                    ? 'bg-blue-600 text-white font-bold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span>{entityA.flag}</span>
                <span>{entityA.shortName}</span>
              </button>
              <button
                onClick={() => setSelectedEntityFilter('B')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors flex items-center space-x-1 cursor-pointer ${
                  selectedEntityFilter === 'B'
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span>{entityB.flag}</span>
                <span>{entityB.shortName}</span>
              </button>
              <button
                onClick={() => setSelectedEntityFilter('global')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  selectedEntityFilter === 'global'
                    ? 'bg-purple-600 text-white font-bold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                Joint & Global
              </button>
            </div>

            {/* Category Filter */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
              <span className="text-2xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mr-1">
                Topic:
              </span>
              <button
                onClick={() => setSelectedCategoryFilter('all')}
                className={`px-2 py-0.5 rounded text-xs transition-colors cursor-pointer ${
                  selectedCategoryFilter === 'all'
                    ? 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 font-semibold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                All
              </button>
              {Object.entries(CATEGORY_LABELS).map(([catKey, catMeta]) => (
                <button
                  key={catKey}
                  onClick={() => setSelectedCategoryFilter(catKey)}
                  className={`px-2 py-0.5 rounded text-xs transition-colors cursor-pointer whitespace-nowrap ${
                    selectedCategoryFilter === catKey
                      ? 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 font-semibold'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  {catMeta.label}
                </button>
              ))}
            </div>
          </div>

          {/* Indicator Correlation Filter Pills */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0 pt-1">
            <span className="text-2xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider mr-1 flex items-center gap-1 shrink-0">
              <Link2 className="w-3 h-3" />
              <span>Correlated Indicator:</span>
            </span>
            {CORRELATION_FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setSelectedIndicatorFilter(opt.key)}
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  selectedIndicatorFilter === opt.key
                    ? 'bg-indigo-600 text-white shadow-2xs font-bold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State Skeletons */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24"></div>
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-16"></div>
                </div>
                <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-4/5"></div>
                <div className="h-3.5 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
                <div className="h-3.5 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        )}

        {/* Error Notice */}
        {error && !loading && (
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300 text-xs flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={fetchNews}
              className="px-2.5 py-1 rounded bg-amber-600 text-white font-semibold hover:bg-amber-700 text-2xs cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Articles Grid with Explicit Indicator Correlation Display */}
        {!loading && filteredArticles.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredArticles.map((article) => {
              const catMeta = CATEGORY_LABELS[article.category] || {
                label: 'Macro',
                bg: 'bg-slate-100 dark:bg-slate-800',
                text: 'text-slate-700 dark:text-slate-300',
                border: 'border-slate-200 dark:border-slate-700',
              };

              const isEntityA =
                article.entity.toLowerCase().includes(entityA.shortName.toLowerCase()) ||
                article.entity.toLowerCase().includes(entityA.name.toLowerCase());
              const isEntityB =
                article.entity.toLowerCase().includes(entityB.shortName.toLowerCase()) ||
                article.entity.toLowerCase().includes(entityB.name.toLowerCase());

              return (
                <div
                  key={article.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-850/90 hover:shadow-xs transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-2.5">
                    {/* Tags row */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center space-x-1.5 flex-wrap">
                        {/* Category badge */}
                        <span
                          className={`px-2 py-0.5 rounded text-2xs font-semibold border ${catMeta.bg} ${catMeta.text} ${catMeta.border}`}
                        >
                          {catMeta.label}
                        </span>

                        {/* Entity tag */}
                        <span className="px-2 py-0.5 rounded text-2xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center space-x-1">
                          {isEntityA ? (
                            <span>{entityA.flag} {entityA.shortName}</span>
                          ) : isEntityB ? (
                            <span>{entityB.flag} {entityB.shortName}</span>
                          ) : (
                            <span>🌐 Both / Global</span>
                          )}
                        </span>
                      </div>

                      {/* Source & Date */}
                      <span className="text-2xs font-medium text-slate-400 dark:text-slate-500 whitespace-nowrap">
                        {article.date || 'Recent'}
                      </span>
                    </div>

                    {/* Headline */}
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug">
                      <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 hover:underline"
                      >
                        <span>{article.title}</span>
                        <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-blue-600 dark:text-blue-400 shrink-0" />
                      </a>
                    </h3>

                    {/* Summary */}
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {article.summary}
                    </p>

                    {/* Correlated Economic Indicator Box */}
                    {article.correlation && (
                      <div className="mt-2.5 p-2.5 rounded-lg bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 text-2xs space-y-1">
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="font-extrabold text-indigo-900 dark:text-indigo-300 flex items-center space-x-1">
                            <Link2 className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                            <span>Correlated: {article.correlation.metricName}</span>
                          </span>
                          <span className="font-mono font-bold text-indigo-700 dark:text-indigo-300 bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-800 text-[10px]">
                            {article.correlation.observedChange}
                          </span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-tight">
                          {article.correlation.explanation}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Footer with publisher link */}
                  <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-2xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center space-x-1">
                      <Landmark className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                      <span>{article.source}</span>
                    </span>

                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-semibold flex items-center space-x-1 transition-colors"
                    >
                      <span>Read coverage</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty Filter State */}
        {!loading && filteredArticles.length === 0 && (
          <div className="py-12 text-center text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
            <Newspaper className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">No headlines matching the selected filters</p>
            <p className="text-2xs text-slate-400 dark:text-slate-500 mt-0.5">Try resetting the entity, topic category, or correlated indicator filter.</p>
            <button
              onClick={() => {
                setSelectedEntityFilter('all');
                setSelectedCategoryFilter('all');
                setSelectedIndicatorFilter('all');
              }}
              className="mt-3 px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 rounded-md shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
            >
              Reset All Filters
            </button>
          </div>
        )}

        {/* Grounding Web Sources Tray */}
        {data?.webSources && data.webSources.length > 0 && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2 text-2xs text-slate-500 dark:text-slate-400">
            <span className="font-medium text-slate-400 dark:text-slate-500">Verified Search Sources:</span>
            {data.webSources.slice(0, 5).map((source, idx) => (
              <a
                key={idx}
                href={source.uri}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2 py-0.5 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-700 flex items-center space-x-1 transition-colors"
              >
                <span className="truncate max-w-[140px]">{source.title || 'Source link'}</span>
                <ExternalLink className="w-2.5 h-2.5 shrink-0" />
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
