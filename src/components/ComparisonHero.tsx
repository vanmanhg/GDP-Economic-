import { ArrowLeftRight, TrendingUp, TrendingDown, Users, Award, ShieldCheck, MapPin, SlidersHorizontal } from 'lucide-react';
import { EconomicEntity } from '../types';
import { formatCurrency, formatNumber, calculateDelta } from '../utils/formatters';

interface ComparisonHeroProps {
  entityA: EconomicEntity;
  entityB: EconomicEntity;
  onOpenSelectorA: () => void;
  onOpenSelectorB: () => void;
  onSwap: () => void;
  onOpenMultiEntity?: () => void;
  selectedIndicatorCount?: number;
  totalIndicatorCount?: number;
  onOpenIndicatorSelector?: () => void;
}

export function ComparisonHero({
  entityA,
  entityB,
  onOpenSelectorA,
  onOpenSelectorB,
  onSwap,
  onOpenMultiEntity,
  selectedIndicatorCount,
  totalIndicatorCount,
  onOpenIndicatorSelector,
}: ComparisonHeroProps) {
  const gdpDelta = calculateDelta(entityA.nominalGdp, entityB.nominalGdp);
  const perCapitaDelta = calculateDelta(entityA.gdpPerCapitaNominal, entityB.gdpPerCapitaNominal);
  const popDelta = calculateDelta(entityA.population, entityB.population);
  const growthDelta = entityA.gdpGrowthRate - entityB.gdpGrowthRate;

  // Formulate a dynamic analytical verdict
  const gdpLeader = entityA.nominalGdp >= entityB.nominalGdp ? entityA : entityB;
  const gdpTrailer = entityA.nominalGdp < entityB.nominalGdp ? entityA : entityB;
  const ratio = (gdpLeader.nominalGdp / gdpTrailer.nominalGdp).toFixed(2);

  const perCapitaLeader = entityA.gdpPerCapitaNominal >= entityB.gdpPerCapitaNominal ? entityA : entityB;
  const perCapitaTrailer = entityA.gdpPerCapitaNominal < entityB.gdpPerCapitaNominal ? entityA : entityB;
  const perCapitaDiffPercent = Math.abs(
    ((perCapitaLeader.gdpPerCapitaNominal - perCapitaTrailer.gdpPerCapitaNominal) /
      perCapitaTrailer.gdpPerCapitaNominal) *
      100
  ).toFixed(1);

  return (
    <section id="comparison-hero-section" className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Head-to-Head Cards */}
        <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-center">
          
          {/* Entity A Card */}
          <div
            id="entity-card-a"
            className="md:col-span-5 bg-gradient-to-br from-indigo-50/40 via-white to-slate-50 dark:from-indigo-950/30 dark:via-slate-900 dark:to-slate-900 p-5 rounded-xl border border-indigo-100/80 dark:border-indigo-900/40 shadow-xs relative overflow-hidden transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-4xl p-2 bg-white dark:bg-slate-800 rounded-xl shadow-xs border border-slate-100 dark:border-slate-700">
                  {entityA.flag}
                </span>
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                      {entityA.name}
                    </h2>
                  </div>
                  <div className="flex items-center space-x-1.5 mt-0.5">
                    {entityA.type === 'region' ? (
                      <span className="inline-flex items-center text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                        <MapPin className="w-3 h-3 mr-1" />
                        Region of {entityA.countryName}
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                        <ShieldCheck className="w-3 h-3 mr-1" />
                        Sovereign Nation
                      </span>
                    )}
                    <span className="text-xs text-slate-500 dark:text-slate-400">• {entityA.continent}</span>
                  </div>
                </div>
              </div>

              <button
                id="change-entity-a-btn"
                onClick={onOpenSelectorA}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-indigo-50/50 hover:dark:bg-slate-700 shadow-2xs transition-all"
              >
                Change
              </button>
            </div>

            {/* Quick Metrics Strip */}
            <div className="grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[11px] font-medium text-slate-400 dark:text-slate-400 block uppercase tracking-wider">
                  Nominal GDP
                </span>
                <span className="text-lg font-bold text-slate-900 dark:text-white block mt-0.5">
                  {formatCurrency(entityA.nominalGdp)}
                </span>
                <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium flex items-center mt-0.5">
                  <Award className="w-3 h-3 mr-1 inline" />
                  Global Rank #{entityA.globalGdpRank}
                </span>
              </div>
              <div>
                <span className="text-[11px] font-medium text-slate-400 dark:text-slate-400 block uppercase tracking-wider">
                  GDP Per Capita
                </span>
                <span className="text-lg font-bold text-slate-900 dark:text-white block mt-0.5">
                  ${entityA.gdpPerCapitaNominal.toLocaleString()}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block mt-0.5">
                  PPP: ${entityA.gdpPerCapitaPpp.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-[11px] font-medium text-slate-400 dark:text-slate-400 block uppercase tracking-wider">
                  Population
                </span>
                <span className="text-lg font-bold text-slate-900 dark:text-white block mt-0.5">
                  {entityA.population}M
                </span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center mt-0.5">
                  <TrendingUp className="w-3 h-3 mr-1 inline" />
                  +{entityA.gdpGrowthRate}% Growth
                </span>
              </div>
            </div>
          </div>

          {/* Center Swap / VS Badge */}
          <div className="md:col-span-1 flex flex-col items-center justify-center my-1 md:my-0">
            <button
              id="swap-entities-btn"
              onClick={onSwap}
              title="Swap Entity A and Entity B"
              className="p-3 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-indigo-50 hover:dark:bg-slate-700 shadow-sm transition-all transform hover:rotate-180 duration-200 group"
              aria-label="Swap Entities"
            >
              <ArrowLeftRight className="w-4 h-4 text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
            </button>
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 tracking-widest mt-1">VS</span>
            {onOpenMultiEntity && (
              <button
                id="open-multi-entity-hero-btn"
                onClick={onOpenMultiEntity}
                className="mt-2 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 flex items-center space-x-1 transition-colors whitespace-nowrap cursor-pointer shadow-2xs group"
                title="Compare up to 5 entities simultaneously (Press M)"
              >
                <Users className="w-3 h-3 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform" />
                <span>5-Way Lab</span>
              </button>
            )}
          </div>

          {/* Entity B Card */}
          <div
            id="entity-card-b"
            className="md:col-span-5 bg-gradient-to-br from-emerald-50/40 via-white to-slate-50 dark:from-emerald-950/30 dark:via-slate-900 dark:to-slate-900 p-5 rounded-xl border border-emerald-100/80 dark:border-emerald-900/40 shadow-xs relative overflow-hidden transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-4xl p-2 bg-white dark:bg-slate-800 rounded-xl shadow-xs border border-slate-100 dark:border-slate-700">
                  {entityB.flag}
                </span>
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                      {entityB.name}
                    </h2>
                  </div>
                  <div className="flex items-center space-x-1.5 mt-0.5">
                    {entityB.type === 'region' ? (
                      <span className="inline-flex items-center text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                        <MapPin className="w-3 h-3 mr-1" />
                        Region of {entityB.countryName}
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                        <ShieldCheck className="w-3 h-3 mr-1" />
                        Sovereign Nation
                      </span>
                    )}
                    <span className="text-xs text-slate-500 dark:text-slate-400">• {entityB.continent}</span>
                  </div>
                </div>
              </div>

              <button
                id="change-entity-b-btn"
                onClick={onOpenSelectorB}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-300 dark:hover:border-emerald-600 hover:bg-emerald-50/50 hover:dark:bg-slate-700 shadow-2xs transition-all"
              >
                Change
              </button>
            </div>

            {/* Quick Metrics Strip */}
            <div className="grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[11px] font-medium text-slate-400 dark:text-slate-400 block uppercase tracking-wider">
                  Nominal GDP
                </span>
                <span className="text-lg font-bold text-slate-900 dark:text-white block mt-0.5">
                  {formatCurrency(entityB.nominalGdp)}
                </span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center mt-0.5">
                  <Award className="w-3 h-3 mr-1 inline" />
                  Global Rank #{entityB.globalGdpRank}
                </span>
              </div>
              <div>
                <span className="text-[11px] font-medium text-slate-400 dark:text-slate-400 block uppercase tracking-wider">
                  GDP Per Capita
                </span>
                <span className="text-lg font-bold text-slate-900 dark:text-white block mt-0.5">
                  ${entityB.gdpPerCapitaNominal.toLocaleString()}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block mt-0.5">
                  PPP: ${entityB.gdpPerCapitaPpp.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-[11px] font-medium text-slate-400 dark:text-slate-400 block uppercase tracking-wider">
                  Population
                </span>
                <span className="text-lg font-bold text-slate-900 dark:text-white block mt-0.5">
                  {entityB.population}M
                </span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center mt-0.5">
                  <TrendingUp className="w-3 h-3 mr-1 inline" />
                  +{entityB.gdpGrowthRate}% Growth
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Analytical Verdict & Proportional Split */}
        <div
          id="analytical-verdict-box"
          className="mt-4 p-4 rounded-xl bg-slate-900 dark:bg-slate-900/90 border dark:border-slate-800 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm"
        >
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-500/30 text-indigo-300 border border-indigo-400/20">
                Key Comparison Takeaway
              </span>
              <span className="text-xs text-slate-400">
                {entityA.name} ({entityA.type === 'region' ? 'Subnational Region' : 'Nation'}) vs.{' '}
                {entityB.name} ({entityB.type === 'region' ? 'Subnational Region' : 'Nation'})
              </span>
            </div>
            <p className="text-sm font-medium text-slate-100 leading-relaxed">
              <span className="text-indigo-300 font-semibold">{gdpLeader.name}</span>’s nominal GDP is{' '}
              <span className="font-bold text-white">{ratio}×</span> the size of{' '}
              <span className="text-emerald-300 font-semibold">{gdpTrailer.name}</span>’s economy (
              {formatCurrency(gdpLeader.nominalGdp)} vs. {formatCurrency(gdpTrailer.nominalGdp)}). In
              individual productivity,{' '}
              <span className="text-amber-300 font-semibold">{perCapitaLeader.name}</span> leads with{' '}
              <span className="font-bold text-white">+{perCapitaDiffPercent}%</span> higher GDP per
              capita (${perCapitaLeader.gdpPerCapitaNominal.toLocaleString()} vs. $
              {perCapitaTrailer.gdpPerCapitaNominal.toLocaleString()}).
            </p>
          </div>

          {/* Proportional GDP Split Bar */}
          <div className="w-full md:w-64 shrink-0 bg-slate-800/80 dark:bg-slate-950/70 p-2.5 rounded-lg border border-slate-700/60">
            <div className="flex items-center justify-between text-[11px] mb-1.5 font-medium">
              <span className="text-indigo-300 truncate max-w-[100px]">{entityA.shortName}</span>
              <span className="text-slate-400">GDP Share</span>
              <span className="text-emerald-300 truncate max-w-[100px]">{entityB.shortName}</span>
            </div>
            {(() => {
              const total = entityA.nominalGdp + entityB.nominalGdp;
              const shareA = ((entityA.nominalGdp / total) * 100).toFixed(1);
              const shareB = ((entityB.nominalGdp / total) * 100).toFixed(1);
              return (
                <div className="w-full h-3 bg-slate-700 dark:bg-slate-800 rounded-full overflow-hidden flex">
                  <div
                    style={{ width: `${shareA}%` }}
                    className="bg-indigo-500 h-full transition-all duration-300"
                    title={`${entityA.name}: ${shareA}%`}
                  />
                  <div
                    style={{ width: `${shareB}%` }}
                    className="bg-emerald-500 h-full transition-all duration-300"
                    title={`${entityB.name}: ${shareB}%`}
                  />
                </div>
              );
            })()}
            <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1 font-mono">
              <span>{((entityA.nominalGdp / (entityA.nominalGdp + entityB.nominalGdp)) * 100).toFixed(0)}%</span>
              <span>{((entityB.nominalGdp / (entityA.nominalGdp + entityB.nominalGdp)) * 100).toFixed(0)}%</span>
            </div>
          </div>
        </div>

        {/* Multi-Indicator Teaser & Quick Access Ribbon */}
        <div
          id="hero-indicator-selection-strip"
          className="mt-3.5 py-2.5 px-4 bg-slate-100/90 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex flex-wrap items-center justify-between gap-2.5 transition-colors"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Comparing {selectedIndicatorCount ?? 11} Indicators:</span>
            </span>
            <div className="flex flex-wrap items-center gap-1.5 text-2xs">
              <span className="px-2 py-0.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-medium text-slate-700 dark:text-slate-300">
                Nominal & PPP GDP
              </span>
              <span className="px-2 py-0.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-medium text-slate-700 dark:text-slate-300">
                Inflation Rate (CPI)
              </span>
              <span className="px-2 py-0.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-medium text-slate-700 dark:text-slate-300">
                Unemployment Rate
              </span>
              <span className="px-2 py-0.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-medium text-slate-700 dark:text-slate-300">
                Trade Balance
              </span>
              <span className="px-2 py-0.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-medium text-slate-700 dark:text-slate-300">
                Human Development (HDI)
              </span>
              <span className="px-2 py-0.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-medium text-slate-700 dark:text-slate-300">
                Public Debt-to-GDP
              </span>
            </div>
          </div>

          {onOpenIndicatorSelector && (
            <button
              type="button"
              onClick={onOpenIndicatorSelector}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Customize Indicators (Press I)</span>
              <span>→</span>
            </button>
          )}
        </div>

      </div>
    </section>
  );
}
