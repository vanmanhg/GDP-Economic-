import { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Check,
  Building2,
  Landmark,
  Scale,
  Zap,
  Info,
  ChevronRight,
  ShieldCheck,
  Activity,
  FileText,
} from 'lucide-react';
import { EconomicEntity, CountrySpotlightData } from '../types';

interface CountrySpotlightProps {
  entityA: EconomicEntity;
  entityB: EconomicEntity;
}

export function CountrySpotlight({ entityA, entityB }: CountrySpotlightProps) {
  const [selectedEntitySlot, setSelectedEntitySlot] = useState<'A' | 'B'>('A');
  const [spotlightData, setSpotlightData] = useState<Record<string, CountrySpotlightData | null>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const activeEntity = selectedEntitySlot === 'A' ? entityA : entityB;
  const currentData = spotlightData[activeEntity.id] || null;

  const fetchSpotlight = useCallback(
    async (entityToFetch: EconomicEntity, forceRefresh = false) => {
      if (!forceRefresh && spotlightData[entityToFetch.id]) {
        return;
      }

      setLoading(true);
      setError(null);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4800);

      try {
        const res = await fetch('/api/spotlight/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({ entity: entityToFetch }),
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
          throw new Error(`Server returned ${res.status}`);
        }

        const data: CountrySpotlightData = await res.json();
        setSpotlightData((prev) => ({
          ...prev,
          [entityToFetch.id]: data,
        }));
      } catch (err: any) {
        clearTimeout(timeoutId);
        console.warn('Spotlight fetch error, attempting local generation fallback', err);
        // If network error, still generate a fallback
        try {
          const fallbackRes = await fetch('/api/spotlight/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ entity: entityToFetch }),
          });
          const data: CountrySpotlightData = await fallbackRes.json();
          setSpotlightData((prev) => ({
            ...prev,
            [entityToFetch.id]: data,
          }));
        } catch {
          setError('Unable to reach insight service. Please retry in a moment.');
        }
      } finally {
        setLoading(false);
      }
    },
    [spotlightData]
  );

  // Auto-fetch insight on mount or when switching active entity if not already cached
  useEffect(() => {
    if (!spotlightData[activeEntity.id]) {
      fetchSpotlight(activeEntity);
    }
  }, [activeEntity, fetchSpotlight, spotlightData]);

  const handleCopySummary = () => {
    if (!currentData) return;
    const text = [
      `ECONOMIC SPOTLIGHT: ${currentData.entityName} (${currentData.momentumRating})`,
      currentData.executiveHeadline,
      '',
      '1. MACROECONOMIC CLIMATE & GROWTH MOMENTUM:',
      currentData.paragraphs[0],
      '',
      '2. STRUCTURAL STRENGTHS & COMPETITIVE MOATS:',
      currentData.paragraphs[1],
      '',
      '3. VULNERABILITIES & DOWNSIDE RISKS:',
      currentData.paragraphs[2],
      '',
      'KEY STRENGTHS:',
      ...currentData.strengths.map((s) => `• ${s.title}: ${s.detail}`),
      '',
      'KEY DOWNSIDE RISKS:',
      ...currentData.risks.map((r) => `• ${r.title}: ${r.detail}`),
    ].join('\n');

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const momentumColor = (rating: string) => {
    switch (rating) {
      case 'Accelerating':
        return 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'Steady Growth':
        return 'bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'Moderating':
        return 'bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      default:
        return 'bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800';
    }
  };

  return (
    <section
      id="country-spotlight-feature"
      aria-label="Country Economic Climate Spotlight"
      className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition-colors"
    >
      {/* Top Banner Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-linear-to-r from-indigo-50/70 via-white to-slate-50 dark:from-slate-900 dark:via-indigo-950/30 dark:to-slate-900 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-indigo-600 text-white shadow-xs">
              <Sparkles className="w-4 h-4" />
            </span>
            <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <span>Country Economic Climate Spotlight</span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                Gemini 3.8 Flash
              </span>
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Synthesizes a 3-paragraph executive macroeconomic climate briefing, structural competitive moats, and sovereign vulnerability assessment for the selected economy.
          </p>
        </div>

        {/* Actions & Entity Toggle */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          {/* Entity Tab Switcher */}
          <div
            id="spotlight-entity-switcher"
            role="group"
            aria-label="Select entity for spotlight"
            className="inline-flex items-center p-1 bg-slate-200/80 dark:bg-slate-800 rounded-lg border border-slate-300/80 dark:border-slate-700 text-xs shadow-2xs"
          >
            <button
              id="spotlight-toggle-a"
              onClick={() => setSelectedEntitySlot('A')}
              className={`px-3 py-1 rounded-md font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                selectedEntitySlot === 'A'
                  ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <span>{entityA.flag}</span>
              <span>{entityA.shortName}</span>
            </button>
            <button
              id="spotlight-toggle-b"
              onClick={() => setSelectedEntitySlot('B')}
              className={`px-3 py-1 rounded-md font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                selectedEntitySlot === 'B'
                  ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <span>{entityB.flag}</span>
              <span>{entityB.shortName}</span>
            </button>
          </div>

          {/* Generate Insight Button */}
          <button
            id="generate-insight-btn"
            onClick={() => fetchSpotlight(activeEntity, true)}
            disabled={loading}
            className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white flex items-center space-x-1.5 transition-all shadow-2xs disabled:opacity-50 cursor-pointer"
            title="Generate deep 3-paragraph executive briefing using Gemini"
          >
            <Sparkles className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Analyzing...' : 'Generate Insight'}</span>
          </button>

          {/* Copy Summary Button */}
          {currentData && (
            <button
              id="copy-spotlight-btn"
              onClick={handleCopySummary}
              className="p-1.5 rounded-lg text-xs bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors shadow-2xs cursor-pointer"
              title="Copy executive summary to clipboard"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-5 sm:p-6 space-y-6">
        {/* Loading Skeleton */}
        {loading && (
          <div className="space-y-4 animate-pulse">
            <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-2/3"></div>
            <div className="space-y-2">
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full"></div>
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-5/6"></div>
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-4/6"></div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
              ))}
            </div>
          </div>
        )}

        {/* Error Notice */}
        {error && !loading && (
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300 text-xs flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Info className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => fetchSpotlight(activeEntity, true)}
              className="px-3 py-1 rounded bg-amber-600 text-white font-semibold hover:bg-amber-700 text-2xs cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Data View */}
        {!loading && currentData && (
          <div className="space-y-6">
            {/* Executive Headline & Momentum Badge */}
            <div className="p-4 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/60 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <span className="text-3xs uppercase tracking-wider font-extrabold text-indigo-700 dark:text-indigo-400 block mb-1">
                  Executive Macroeconomic Climate Stance
                </span>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white leading-snug">
                  {currentData.executiveHeadline}
                </h3>
              </div>
              <div className="shrink-0">
                <span
                  className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-2xs ${momentumColor(
                    currentData.momentumRating
                  )}`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>Growth Momentum: {currentData.momentumRating}</span>
                </span>
              </div>
            </div>

            {/* Key Macroeconomic Signals Bar */}
            {currentData.keySignals && currentData.keySignals.length > 0 && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {currentData.keySignals.map((signal, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700"
                  >
                    <span className="text-3xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-400 block">
                      {signal.label}
                    </span>
                    <p className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                      {signal.value}
                    </p>
                    <span className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 block mt-0.5">
                      {signal.assessment}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* The 3-Paragraph Executive Summary Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>3-Paragraph Executive Analytical Synthesis</span>
                </h4>
                <span className="text-2xs text-slate-400 font-medium">
                  {currentData.source === 'gemini_3_8_flash' ? 'Generated via Gemini' : 'Curated Analysis'}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {/* Paragraph 1: Macro Climate & Growth Momentum */}
                <div className="p-4 rounded-xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-2xs relative pl-5">
                  <div className="absolute left-0 top-3 bottom-3 w-1 bg-indigo-600 rounded-r"></div>
                  <div className="flex items-center space-x-2 mb-1.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center justify-center">
                      1
                    </span>
                    <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                      Current Macroeconomic Climate & Growth Momentum
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed pl-7">
                    {currentData.paragraphs[0]}
                  </p>
                </div>

                {/* Paragraph 2: Core Structural Strengths & Competitive Moats */}
                <div className="p-4 rounded-xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-2xs relative pl-5">
                  <div className="absolute left-0 top-3 bottom-3 w-1 bg-emerald-600 rounded-r"></div>
                  <div className="flex items-center space-x-2 mb-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center justify-center">
                      2
                    </span>
                    <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                      Structural Strengths & Competitive Moats
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed pl-7">
                    {currentData.paragraphs[1]}
                  </p>
                </div>

                {/* Paragraph 3: Vulnerabilities, Fiscal Pressures & Downside Risks */}
                <div className="p-4 rounded-xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-2xs relative pl-5">
                  <div className="absolute left-0 top-3 bottom-3 w-1 bg-rose-600 rounded-r"></div>
                  <div className="flex items-center space-x-2 mb-1.5">
                    <span className="w-5 h-5 rounded-full bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center justify-center">
                      3
                    </span>
                    <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                      Sovereign Vulnerabilities, Debt Strain & Downside Risks
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed pl-7">
                    {currentData.paragraphs[2]}
                  </p>
                </div>
              </div>
            </div>

            {/* Side-by-Side: Key Strengths vs Key Risks */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
              {/* Strengths Card */}
              <div className="p-4 sm:p-5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/60 space-y-3">
                <div className="flex items-center space-x-2">
                  <span className="p-1 rounded-md bg-emerald-600 text-white">
                    <ShieldCheck className="w-4 h-4" />
                  </span>
                  <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                    Key Structural Strengths
                  </h4>
                </div>

                <div className="space-y-2.5">
                  {currentData.strengths.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-white/90 dark:bg-slate-850/90 border border-emerald-100 dark:border-emerald-900/50 shadow-2xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>{item.title}</span>
                        </span>
                        {item.indicatorLink && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0">
                            {item.indicatorLink}
                          </span>
                        )}
                      </div>
                      <p className="text-2xs text-slate-600 dark:text-slate-300 mt-1 pl-5 leading-relaxed">
                        {item.detail}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Risks Card */}
              <div className="p-4 sm:p-5 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-800/60 space-y-3">
                <div className="flex items-center space-x-2">
                  <span className="p-1 rounded-md bg-rose-600 text-white">
                    <AlertTriangle className="w-4 h-4" />
                  </span>
                  <h4 className="text-sm font-bold text-rose-900 dark:text-rose-200">
                    Downside Risks & Vulnerabilities
                  </h4>
                </div>

                <div className="space-y-2.5">
                  {currentData.risks.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-white/90 dark:bg-slate-850/90 border border-rose-100 dark:border-rose-900/50 shadow-2xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                          <span>{item.title}</span>
                        </span>
                        {item.indicatorLink && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 shrink-0">
                            {item.indicatorLink}
                          </span>
                        )}
                      </div>
                      <p className="text-2xs text-slate-600 dark:text-slate-300 mt-1 pl-5 leading-relaxed">
                        {item.detail}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
