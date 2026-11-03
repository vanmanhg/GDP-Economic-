import { useState, useEffect, useCallback } from 'react';
import {
  Scale,
  Sparkles,
  RefreshCw,
  Landmark,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Layers,
  Send,
  HelpCircle,
  FileText,
  DollarSign,
  Cpu,
  Users,
  Compass,
} from 'lucide-react';
import {
  EconomicEntity,
  FiscalPolicyAnalysisResponse,
  FiscalFocusAngle,
} from '../types';
import { getFallbackFiscalAnalysis } from '../data/fiscalFallbackData';

interface FiscalPolicyAnalyzerProps {
  entityA: EconomicEntity;
  entityB: EconomicEntity;
}

const POSTURE_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  Expansionary: {
    bg: 'bg-indigo-50 dark:bg-indigo-950/60',
    text: 'text-indigo-800 dark:text-indigo-300',
    border: 'border-indigo-200 dark:border-indigo-800',
  },
  'Neutral / Moderate': {
    bg: 'bg-blue-50 dark:bg-blue-950/60',
    text: 'text-blue-800 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800',
  },
  'Consolidative / Austere': {
    bg: 'bg-emerald-50 dark:bg-emerald-950/60',
    text: 'text-emerald-800 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800',
  },
  'Targeted Stimulus': {
    bg: 'bg-amber-50 dark:bg-amber-950/60',
    text: 'text-amber-800 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800',
  },
};

const HEALTH_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  'Robust / Low Risk': {
    bg: 'bg-emerald-100/70 dark:bg-emerald-950/60',
    text: 'text-emerald-800 dark:text-emerald-300',
    dot: 'bg-emerald-500',
  },
  'Moderate Risk': {
    bg: 'bg-blue-100/70 dark:bg-blue-950/60',
    text: 'text-blue-800 dark:text-blue-300',
    dot: 'bg-blue-500',
  },
  'Elevated Deficit Stress': {
    bg: 'bg-amber-100/70 dark:bg-amber-950/60',
    text: 'text-amber-800 dark:text-amber-300',
    dot: 'bg-amber-500',
  },
  'High Debt Strain': {
    bg: 'bg-rose-100/70 dark:bg-rose-950/60',
    text: 'text-rose-800 dark:text-rose-300',
    dot: 'bg-rose-500',
  },
};

export function FiscalPolicyAnalyzer({ entityA, entityB }: FiscalPolicyAnalyzerProps) {
  const [data, setData] = useState<FiscalPolicyAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focusAngle, setFocusAngle] = useState<FiscalFocusAngle>('all');
  const [customQuestionInput, setCustomQuestionInput] = useState('');
  const [activeCustomQuestion, setActiveCustomQuestion] = useState<string | undefined>(undefined);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string | null>(null);

  const fetchAnalysis = useCallback(
    async (angle: FiscalFocusAngle = focusAngle, question?: string) => {
      setLoading(true);
      setError(null);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4500);

      try {
        const response = await fetch('/api/fiscal-policy/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            entityA: {
              id: entityA.id,
              name: entityA.name,
              shortName: entityA.shortName,
              flag: entityA.flag,
              type: entityA.type,
              nominalGdp: entityA.nominalGdp,
              publicDebtToGdp: entityA.publicDebtToGdp,
              gdpGrowthRate: entityA.gdpGrowthRate,
              inflationRate: entityA.inflationRate,
              topIndustries: entityA.topIndustries,
            },
            entityB: {
              id: entityB.id,
              name: entityB.name,
              shortName: entityB.shortName,
              flag: entityB.flag,
              type: entityB.type,
              nominalGdp: entityB.nominalGdp,
              publicDebtToGdp: entityB.publicDebtToGdp,
              gdpGrowthRate: entityB.gdpGrowthRate,
              inflationRate: entityB.inflationRate,
              topIndustries: entityB.topIndustries,
            },
            focusAngle: angle,
            customQuestion: question,
          }),
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Server returned status ${response.status}`);
        }

        const result: FiscalPolicyAnalysisResponse = await response.json();
        setData(result);
        setLastUpdatedTime(
          new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        );
      } catch (err: any) {
        clearTimeout(timeoutId);
        // Seamlessly fall back to rich curated dataset without breaking the UI
        console.warn('Fiscal policy analysis using high-fidelity curated baseline:', err?.message || err);
        const fallback = getFallbackFiscalAnalysis(entityA, entityB, angle, question);
        setData(fallback);
        setError(null);
        setLastUpdatedTime(
          new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        );
      } finally {
        setLoading(false);
      }
    },
    [entityA, entityB, focusAngle]
  );

  // Trigger analysis when entity A or B changes
  useEffect(() => {
    setActiveCustomQuestion(undefined);
    setCustomQuestionInput('');
    fetchAnalysis(focusAngle, undefined);
  }, [entityA.id, entityB.id, focusAngle]);

  const handleAngleChange = (newAngle: FiscalFocusAngle) => {
    setFocusAngle(newAngle);
  };

  const handleCustomQuestionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customQuestionInput.trim() || loading) return;
    const q = customQuestionInput.trim();
    setActiveCustomQuestion(q);
    fetchAnalysis(focusAngle, q);
  };

  const handlePresetQuestion = (promptText: string) => {
    setCustomQuestionInput(promptText);
    setActiveCustomQuestion(promptText);
    fetchAnalysis(focusAngle, promptText);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden transition-colors">
      {/* Top Header */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-linear-to-r from-slate-900 via-slate-800 to-indigo-950 text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-2 bg-indigo-500/20 text-indigo-300 rounded-lg border border-indigo-400/30">
                <Scale className="w-5 h-5" />
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
                Sovereign Balance Sheet & Policy Memo
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight mt-1 text-white flex items-center gap-2">
              Fiscal Policy & Economic Reform Analyzer
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl">
              AI-powered comparative breakdown of budgetary postures, statutory fiscal rules,
              industrial policy subsidies, and landmark economic legislation for{' '}
              <span className="text-indigo-300 font-semibold">{entityA.name}</span> vs{' '}
              <span className="text-emerald-300 font-semibold">{entityB.name}</span>.
            </p>
          </div>

          <div className="flex items-center space-x-2.5 flex-wrap">
            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-800 text-indigo-200 border border-slate-700">
              <Sparkles className="w-3.5 h-3.5 mr-1 text-indigo-400" />
              Gemini 3.8 Flash
            </span>

            {data?.source === 'curated_fallback' && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-950/80 text-amber-300 border border-amber-800/60">
                Curated Fallback
              </span>
            )}

            {lastUpdatedTime && (
              <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                Synced {lastUpdatedTime}
              </span>
            )}

            <button
              onClick={() => fetchAnalysis(focusAngle, activeCustomQuestion)}
              disabled={loading}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center space-x-1.5 transition-colors disabled:opacity-50 cursor-pointer"
              title="Refresh analysis"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Re-Analyze</span>
            </button>
          </div>
        </div>

        {/* Focus Angle Selectors */}
        <div className="flex items-center space-x-1.5 mt-5 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-400 text-[11px] uppercase tracking-wider font-semibold mr-1 shrink-0">
            Dimension:
          </span>
          <button
            onClick={() => handleAngleChange('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all shrink-0 ${
              focusAngle === 'all'
                ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            🏛️ Macro Architecture
          </button>
          <button
            onClick={() => handleAngleChange('deficit_debt')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all shrink-0 ${
              focusAngle === 'deficit_debt'
                ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            💳 Debt & Fiscal Rules
          </button>
          <button
            onClick={() => handleAngleChange('industrial_subsidies')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all shrink-0 ${
              focusAngle === 'industrial_subsidies'
                ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            🏭 Industrial Policy & Subsidies
          </button>
          <button
            onClick={() => handleAngleChange('taxation')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all shrink-0 ${
              focusAngle === 'taxation'
                ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            📑 Tax Regimes & Capital
          </button>
          <button
            onClick={() => handleAngleChange('welfare_demographics')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all shrink-0 ${
              focusAngle === 'welfare_demographics'
                ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            👥 Welfare & Demographics
          </button>
        </div>
      </div>

      {/* Interactive Custom Policy Angle Query Bar */}
      <div className="bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 px-6 py-3.5">
        <form onSubmit={handleCustomQuestionSubmit} className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={customQuestionInput}
              onChange={(e) => setCustomQuestionInput(e.target.value)}
              placeholder={`Ask a custom fiscal query (e.g. "How do ${entityA.shortName} and ${entityB.shortName} compare on clean tech incentives and corporate tax?")`}
              className="w-full pl-3 pr-24 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            {activeCustomQuestion && (
              <button
                type="button"
                onClick={() => {
                  setActiveCustomQuestion(undefined);
                  setCustomQuestionInput('');
                  fetchAnalysis(focusAngle, undefined);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-slate-400 dark:text-slate-300 hover:text-slate-600 dark:hover:text-white px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700"
              >
                Clear
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={loading || !customQuestionInput.trim()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ask AI Memo</span>
          </button>
        </form>

        {/* Suggested Query Chips */}
        <div className="flex items-center space-x-1.5 mt-2.5 overflow-x-auto text-[11px] text-slate-500 dark:text-slate-400">
          <span className="font-semibold text-slate-400 dark:text-slate-500 shrink-0">Quick prompts:</span>
          <button
            type="button"
            onClick={() =>
              handlePresetQuestion(
                `Which economy has greater fiscal headroom if a global recession occurs?`
              )
            }
            className="px-2 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500 rounded text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shrink-0 cursor-pointer"
          >
            Recession Headroom Test
          </button>
          <button
            type="button"
            onClick={() =>
              handlePresetQuestion(
                `Compare semiconductor and clean energy subsidies between ${entityA.shortName} and ${entityB.shortName}.`
              )
            }
            className="px-2 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500 rounded text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shrink-0 cursor-pointer"
          >
            Industrial Subsidies & Tech
          </button>
          <button
            type="button"
            onClick={() =>
              handlePresetQuestion(
                `How do statutory debt limits and balanced budget rules compare between them?`
              )
            }
            className="px-2 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500 rounded text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shrink-0 cursor-pointer"
          >
            Debt Anchors & Constitutional Rules
          </button>
          <button
            type="button"
            onClick={() =>
              handlePresetQuestion(
                `How will demographic aging and pension obligations impact long-term sovereign debt?`
              )
            }
            className="px-2 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500 rounded text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shrink-0 cursor-pointer"
          >
            Pension & Demographic Drag
          </button>
        </div>
      </div>

      {/* Main Body */}
      <div className="p-6 space-y-6">
        {/* Loading State Skeleton */}
        {loading && !data && (
          <div className="py-12 space-y-6 animate-pulse">
            <div className="h-20 bg-slate-100 dark:bg-slate-800 rounded-xl"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded-xl"></div>
              <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded-xl"></div>
            </div>
            <div className="h-48 bg-slate-100 dark:bg-slate-800 rounded-xl"></div>
          </div>
        )}

        {/* Error State */}
        {error && !data && (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-800 dark:text-rose-300 text-xs flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => fetchAnalysis(focusAngle, activeCustomQuestion)}
              className="px-2.5 py-1 bg-rose-600 text-white rounded font-semibold text-[11px] hover:bg-rose-700 cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {data && (
          <>
            {/* Custom Question Answer Box if requested */}
            {data.customQuestion && data.customAnswer && (
              <div className="bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-xl p-5 space-y-2">
                <div className="flex items-center space-x-2 text-indigo-900 dark:text-indigo-300 font-semibold text-xs uppercase tracking-wider">
                  <HelpCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Targeted Policy Inquiry</span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  &ldquo;{data.customQuestion}&rdquo;
                </h4>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line pt-1">
                  {data.customAnswer}
                </p>
              </div>
            )}

            {/* Executive Synthesis Banner */}
            <div className="bg-slate-900 dark:bg-slate-850 text-white rounded-xl p-5 border border-slate-800 shadow-xs relative overflow-hidden">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-950/80 px-2.5 py-0.5 rounded border border-indigo-800/60">
                      Comparative Macro Verdict
                    </span>
                    <span className="text-xs font-semibold text-slate-300">
                      Contrast: <span className="text-amber-300 font-bold">{data.keyPhilosophicalContrast}</span>
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans pt-1">
                    {data.executiveSynthesis}
                  </p>
                </div>

                {/* Divergence Meter Gauge */}
                <div className="lg:w-64 shrink-0 bg-slate-800/80 dark:bg-slate-800 border border-slate-700/80 rounded-lg p-3 text-center">
                  <div className="text-[11px] uppercase font-semibold text-slate-400 tracking-wider">
                    Policy Divergence Score
                  </div>
                  <div className="text-2xl font-black text-indigo-300 mt-1 flex items-center justify-center gap-1">
                    <span>{data.divergenceScore}</span>
                    <span className="text-xs text-slate-400 font-normal">/ 10</span>
                  </div>
                  <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden mt-2">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        data.divergenceScore > 7
                          ? 'bg-amber-400'
                          : data.divergenceScore > 4
                          ? 'bg-indigo-400'
                          : 'bg-emerald-400'
                      }`}
                      style={{ width: `${Math.min(100, data.divergenceScore * 10)}%` }}
                    ></div>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1 font-medium">
                    {data.divergenceScore >= 8
                      ? 'High Structural Divergence'
                      : data.divergenceScore >= 5
                      ? 'Moderate Philosophical Variance'
                      : 'Similar Fiscal Playbooks'}
                  </div>
                </div>
              </div>
            </div>

            {/* Side-by-Side Dual Profiles */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Entity A Card */}
              <div className="border border-indigo-200/80 dark:border-indigo-900/80 rounded-xl p-5 bg-gradient-to-b from-indigo-50/30 dark:from-indigo-950/20 to-white dark:to-slate-900 shadow-2xs space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between pb-3 border-b border-indigo-100 dark:border-indigo-950">
                  <div className="flex items-center space-x-2.5">
                    <span className="text-2xl">{data.entityA.flag || entityA.flag}</span>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-tight">
                        {data.entityA.name}
                      </h3>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        {entityA.type === 'region' ? 'Subnational Region' : 'Sovereign State'} • Debt/GDP:{' '}
                        <strong className="text-slate-700 dark:text-slate-300">{entityA.publicDebtToGdp}%</strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end space-y-1">
                    <span
                      className={`px-2.5 py-0.5 rounded text-xs font-bold border ${
                        POSTURE_STYLES[data.entityA.fiscalPosture]?.bg || 'bg-slate-100 dark:bg-slate-800'
                      } ${POSTURE_STYLES[data.entityA.fiscalPosture]?.text || 'text-slate-800 dark:text-slate-200'} ${
                        POSTURE_STYLES[data.entityA.fiscalPosture]?.border || 'border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {data.entityA.fiscalPosture}
                    </span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                        HEALTH_STYLES[data.entityA.fiscalHealthRating]?.bg || 'bg-slate-100 dark:bg-slate-800'
                      } ${HEALTH_STYLES[data.entityA.fiscalHealthRating]?.text || 'text-slate-700 dark:text-slate-300'}`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                          HEALTH_STYLES[data.entityA.fiscalHealthRating]?.dot || 'bg-slate-400'
                        }`}
                      ></span>
                      {data.entityA.fiscalHealthRating}
                    </span>
                  </div>
                </div>

                {/* Deficit / Trajectory Banner */}
                <div className="bg-white dark:bg-slate-800 border border-indigo-100 dark:border-indigo-900/60 rounded-lg p-3">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                    Deficit & Balance Sheet Posture
                  </div>
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                    {data.entityA.deficitTrend}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    {data.entityA.headlineStrategy}
                  </p>
                </div>

                {/* Core Policy Pillars */}
                <div className="space-y-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center space-x-1">
                    <Layers className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>Strategic Fiscal Pillars</span>
                  </div>
                  <div className="space-y-2">
                    {data.entityA.corePillars.map((p, idx) => (
                      <div
                        key={idx}
                        className="bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 rounded-lg p-3 hover:border-indigo-200 dark:hover:border-indigo-700 transition-colors"
                      >
                        <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-slate-100">
                          <span>{p.pillar}</span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                          {p.description}
                        </p>
                        <div className="mt-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-700 text-[11px] text-indigo-700 dark:text-indigo-400 font-medium flex items-center gap-1">
                          <span className="text-slate-400 uppercase text-[9px] font-bold">
                            Impact:
                          </span>
                          <span>{p.impact}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Major Recent Reforms & Legislation */}
                <div className="space-y-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center space-x-1">
                    <Landmark className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>Recent Landmark Legislation & Reforms</span>
                  </div>
                  <div className="space-y-2">
                    {data.entityA.recentReforms.map((reform, idx) => (
                      <div
                        key={idx}
                        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 dark:text-slate-100">{reform.title}</span>
                          <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                            {reform.year}
                          </span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed">{reform.description}</p>
                        <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap gap-1">
                          <span>
                            <strong className="text-slate-700 dark:text-slate-300 font-medium">Goal:</strong>{' '}
                            {reform.strategicGoal}
                          </span>
                          {reform.budgetScale && (
                            <span className="font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/80 px-1.5 py-0.5 rounded border border-indigo-100 dark:border-indigo-800 text-[10px]">
                              {reform.budgetScale}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Strengths & Vulnerabilities */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/60 rounded-lg p-3 space-y-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      Strengths
                    </span>
                    <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-1 pl-1">
                      {data.entityA.strengths.map((s, idx) => (
                        <li key={idx} className="leading-tight flex items-start gap-1">
                          <span className="text-emerald-500 font-bold">•</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/60 rounded-lg p-3 space-y-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      Vulnerabilities
                    </span>
                    <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-1 pl-1">
                      {data.entityA.vulnerabilities.map((v, idx) => (
                        <li key={idx} className="leading-tight flex items-start gap-1">
                          <span className="text-amber-500 font-bold">•</span>
                          <span>{v}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Entity B Card */}
              <div className="border border-emerald-200/80 dark:border-emerald-900/80 rounded-xl p-5 bg-gradient-to-b from-emerald-50/20 dark:from-emerald-950/20 to-white dark:to-slate-900 shadow-2xs space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between pb-3 border-b border-emerald-100 dark:border-emerald-950">
                  <div className="flex items-center space-x-2.5">
                    <span className="text-2xl">{data.entityB.flag || entityB.flag}</span>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-tight">
                        {data.entityB.name}
                      </h3>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        {entityB.type === 'region' ? 'Subnational Region' : 'Sovereign State'} • Debt/GDP:{' '}
                        <strong className="text-slate-700 dark:text-slate-300">{entityB.publicDebtToGdp}%</strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end space-y-1">
                    <span
                      className={`px-2.5 py-0.5 rounded text-xs font-bold border ${
                        POSTURE_STYLES[data.entityB.fiscalPosture]?.bg || 'bg-slate-100 dark:bg-slate-800'
                      } ${POSTURE_STYLES[data.entityB.fiscalPosture]?.text || 'text-slate-800 dark:text-slate-200'} ${
                        POSTURE_STYLES[data.entityB.fiscalPosture]?.border || 'border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {data.entityB.fiscalPosture}
                    </span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                        HEALTH_STYLES[data.entityB.fiscalHealthRating]?.bg || 'bg-slate-100 dark:bg-slate-800'
                      } ${HEALTH_STYLES[data.entityB.fiscalHealthRating]?.text || 'text-slate-700 dark:text-slate-300'}`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                          HEALTH_STYLES[data.entityB.fiscalHealthRating]?.dot || 'bg-slate-400'
                        }`}
                      ></span>
                      {data.entityB.fiscalHealthRating}
                    </span>
                  </div>
                </div>

                {/* Deficit / Trajectory Banner */}
                <div className="bg-white dark:bg-slate-800 border border-emerald-100 dark:border-emerald-900/60 rounded-lg p-3">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                    Deficit & Balance Sheet Posture
                  </div>
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                    {data.entityB.deficitTrend}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    {data.entityB.headlineStrategy}
                  </p>
                </div>

                {/* Core Policy Pillars */}
                <div className="space-y-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center space-x-1">
                    <Layers className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Strategic Fiscal Pillars</span>
                  </div>
                  <div className="space-y-2">
                    {data.entityB.corePillars.map((p, idx) => (
                      <div
                        key={idx}
                        className="bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 rounded-lg p-3 hover:border-emerald-200 dark:hover:border-emerald-700 transition-colors"
                      >
                        <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-slate-100">
                          <span>{p.pillar}</span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                          {p.description}
                        </p>
                        <div className="mt-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-700 text-[11px] text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1">
                          <span className="text-slate-400 uppercase text-[9px] font-bold">
                            Impact:
                          </span>
                          <span>{p.impact}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Major Recent Reforms & Legislation */}
                <div className="space-y-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center space-x-1">
                    <Landmark className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Recent Landmark Legislation & Reforms</span>
                  </div>
                  <div className="space-y-2">
                    {data.entityB.recentReforms.map((reform, idx) => (
                      <div
                        key={idx}
                        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 dark:text-slate-100">{reform.title}</span>
                          <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                            {reform.year}
                          </span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed">{reform.description}</p>
                        <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap gap-1">
                          <span>
                            <strong className="text-slate-700 dark:text-slate-300 font-medium">Goal:</strong>{' '}
                            {reform.strategicGoal}
                          </span>
                          {reform.budgetScale && (
                            <span className="font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-100 dark:border-emerald-800 text-[10px]">
                              {reform.budgetScale}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Strengths & Vulnerabilities */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/60 rounded-lg p-3 space-y-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      Strengths
                    </span>
                    <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-1 pl-1">
                      {data.entityB.strengths.map((s, idx) => (
                        <li key={idx} className="leading-tight flex items-start gap-1">
                          <span className="text-emerald-500 font-bold">•</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/60 rounded-lg p-3 space-y-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      Vulnerabilities
                    </span>
                    <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-1 pl-1">
                      {data.entityB.vulnerabilities.map((v, idx) => (
                        <li key={idx} className="leading-tight flex items-start gap-1">
                          <span className="text-amber-500 font-bold">•</span>
                          <span>{v}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Side-by-Side Comparison Matrix Table */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
              <div className="bg-slate-100 dark:bg-slate-800 px-5 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                    Cross-Entity Fiscal Domain Matrix
                  </h4>
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Direct policy trade-offs and structural comparative stance
                </span>
              </div>

              <div className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                {data.sideBySideComparison.map((item, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-1 lg:grid-cols-12 gap-3 p-4 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* Domain Title */}
                    <div className="lg:col-span-3 flex flex-col justify-start">
                      <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">{item.domain}</span>
                      {item.advantageEntity && item.advantageEntity !== 'neutral' && (
                        <span className="mt-1 inline-flex items-center text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded w-max">
                          Edge:{' '}
                          {item.advantageEntity === 'entityA'
                            ? data.entityA.shortName
                            : data.entityB.shortName}
                        </span>
                      )}
                    </div>

                    {/* Entity A Stance */}
                    <div className="lg:col-span-3 bg-indigo-50/30 dark:bg-indigo-950/30 p-2.5 rounded-lg border border-indigo-100/60 dark:border-indigo-800/40">
                      <span className="text-[10px] font-bold text-indigo-800 dark:text-indigo-400 uppercase block mb-0.5">
                        {data.entityA.shortName} Stance
                      </span>
                      <p className="text-slate-700 dark:text-slate-300 text-xs leading-relaxed">{item.entityAStance}</p>
                    </div>

                    {/* Entity B Stance */}
                    <div className="lg:col-span-3 bg-emerald-50/20 dark:bg-emerald-950/30 p-2.5 rounded-lg border border-emerald-100/60 dark:border-emerald-800/40">
                      <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400 uppercase block mb-0.5">
                        {data.entityB.shortName} Stance
                      </span>
                      <p className="text-slate-700 dark:text-slate-300 text-xs leading-relaxed">{item.entityBStance}</p>
                    </div>

                    {/* Analytical Contrast Takeaway */}
                    <div className="lg:col-span-3 bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 flex flex-col justify-center">
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-0.5">
                        Contrast Takeaway
                      </span>
                      <p className="text-slate-800 dark:text-slate-200 text-xs leading-relaxed font-medium">
                        {item.contrastTakeaway}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Strategic Outlook & Policy Lessons */}
            <div className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center space-x-2">
                <Compass className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  Long-Term Strategic Synthesis & Sovereign Outlook
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Shared Challenges */}
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3.5 space-y-2">
                  <span className="font-bold text-slate-900 dark:text-slate-100 block flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    Shared Sovereign Vulnerabilities
                  </span>
                  <ul className="text-slate-600 dark:text-slate-300 space-y-1.5 pl-1">
                    {data.strategicOutlook.sharedChallenges.map((c, idx) => (
                      <li key={idx} className="leading-snug flex items-start gap-1.5">
                        <span className="text-amber-500 font-bold">•</span>
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Policy Lessons */}
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3.5 space-y-2">
                  <span className="font-bold text-slate-900 dark:text-slate-100 block flex items-center gap-1.5">
                    <Landmark className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    Cross-Border Policy Lessons
                  </span>
                  <ul className="text-slate-600 dark:text-slate-300 space-y-1.5 pl-1">
                    {data.strategicOutlook.policyLessons.map((l, idx) => (
                      <li key={idx} className="leading-snug flex items-start gap-1.5">
                        <span className="text-indigo-500 font-bold">•</span>
                        <span>{l}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Implications for Growth */}
              <div className="bg-white dark:bg-slate-800 border border-indigo-100 dark:border-indigo-900/60 rounded-lg p-3.5 text-xs">
                <span className="font-bold text-indigo-900 dark:text-indigo-300 block mb-1">
                  Decadal Growth & Debt Trajectory Projection:
                </span>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                  {data.strategicOutlook.implicationsForGrowth}
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
