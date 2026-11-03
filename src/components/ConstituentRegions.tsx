import { MapPin, ArrowRight, Building, Award } from 'lucide-react';
import { EconomicEntity } from '../types';
import { getSubnationalRegionsForCountry } from '../data/economicData';
import { formatCurrency, formatShortGdp } from '../utils/formatters';

interface ConstituentRegionsProps {
  entityA: EconomicEntity;
  entityB: EconomicEntity;
  onSelectEntityA: (entity: EconomicEntity) => void;
  onSelectEntityB: (entity: EconomicEntity) => void;
}

export function ConstituentRegions({
  entityA,
  entityB,
  onSelectEntityA,
  onSelectEntityB,
}: ConstituentRegionsProps) {
  // Check if either entity is a country with constituent subnational regions in our dataset
  const regionsForA = entityA.type === 'country' ? getSubnationalRegionsForCountry(entityA.id) : [];
  const regionsForB = entityB.type === 'country' ? getSubnationalRegionsForCountry(entityB.id) : [];

  if (regionsForA.length === 0 && regionsForB.length === 0) {
    return null;
  }

  return (
    <div id="constituent-regions-card" className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 transition-colors">
      <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center space-x-2">
          <MapPin className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Subnational Regional Exploration & Direct Matchup
          </h3>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Deep-dive into constituent provinces, states, and prefectures. Drill down into any subnational region with a single click.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        {/* Regions for Entity A */}
        {regionsForA.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <span className="text-xl">{entityA.flag}</span>
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Key Regions of {entityA.name} ({regionsForA.length} Featured)
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {regionsForA.map((reg) => (
                <div
                  key={reg.id}
                  className="p-3 rounded-lg border border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-base">{reg.flag}</span>
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {reg.name}
                        </span>
                      </div>
                      <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                        #{reg.globalGdpRank} World Equiv.
                      </span>
                    </div>

                    <div className="mt-2 text-xs flex items-baseline justify-between">
                      <span className="text-slate-500 dark:text-slate-400">GDP:</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">
                        {formatShortGdp(reg.nominalGdp)}
                      </span>
                    </div>
                    <div className="text-[11px] flex items-baseline justify-between text-slate-500 dark:text-slate-400">
                      <span>Per Capita:</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300 font-mono">
                        ${reg.gdpPerCapitaNominal.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-1">
                    <button
                      onClick={() => onSelectEntityA(reg)}
                      className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:underline cursor-pointer"
                      title={`Set ${reg.name} as Entity A`}
                    >
                      Set as Left (A)
                    </button>
                    <button
                      onClick={() => onSelectEntityB(reg)}
                      className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 hover:underline cursor-pointer"
                      title={`Compare ${reg.name} against ${entityA.name}`}
                    >
                      Compare vs {entityA.shortName}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Regions for Entity B */}
        {regionsForB.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <span className="text-xl">{entityB.flag}</span>
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Key Regions of {entityB.name} ({regionsForB.length} Featured)
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {regionsForB.map((reg) => (
                <div
                  key={reg.id}
                  className="p-3 rounded-lg border border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800 hover:border-emerald-300 dark:hover:border-emerald-600 transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-base">{reg.flag}</span>
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          {reg.name}
                        </span>
                      </div>
                      <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                        #{reg.globalGdpRank} World Equiv.
                      </span>
                    </div>

                    <div className="mt-2 text-xs flex items-baseline justify-between">
                      <span className="text-slate-500 dark:text-slate-400">GDP:</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">
                        {formatShortGdp(reg.nominalGdp)}
                      </span>
                    </div>
                    <div className="text-[11px] flex items-baseline justify-between text-slate-500 dark:text-slate-400">
                      <span>Per Capita:</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300 font-mono">
                        ${reg.gdpPerCapitaNominal.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-1">
                    <button
                      onClick={() => onSelectEntityA(reg)}
                      className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:underline cursor-pointer"
                      title={`Compare ${reg.name} vs ${entityB.name}`}
                    >
                      Compare vs {entityB.shortName}
                    </button>
                    <button
                      onClick={() => onSelectEntityB(reg)}
                      className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 hover:underline cursor-pointer"
                      title={`Set ${reg.name} as Entity B`}
                    >
                      Set as Right (B)
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
