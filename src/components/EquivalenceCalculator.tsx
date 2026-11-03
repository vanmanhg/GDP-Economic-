import { useState } from 'react';
import { Calculator, Sparkles, Scale, RefreshCw } from 'lucide-react';
import { EconomicEntity } from '../types';
import { formatCurrency, formatNumber } from '../utils/formatters';

interface EquivalenceCalculatorProps {
  entityA: EconomicEntity;
  entityB: EconomicEntity;
}

export function EquivalenceCalculator({ entityA, entityB }: EquivalenceCalculatorProps) {
  // Custom slider for hypothetical population
  const [hypotheticalPop, setHypotheticalPop] = useState<number>(entityA.population);

  // Economy multiple
  const aToBMultiple = (entityA.nominalGdp / entityB.nominalGdp).toFixed(2);
  const bToAMultiple = (entityB.nominalGdp / entityA.nominalGdp).toFixed(2);

  // If A had B's population at A's per capita productivity
  const gdpIfAHadBPop = (entityB.population * entityA.gdpPerCapitaNominal) / 1000; // in Billions

  // If B had A's population at B's per capita productivity
  const gdpIfBHadAPop = (entityA.population * entityB.gdpPerCapitaNominal) / 1000; // in Billions

  // Custom hypothetical GDP calculation
  const customGdpA = (hypotheticalPop * entityA.gdpPerCapitaNominal) / 1000;
  const customGdpB = (hypotheticalPop * entityB.gdpPerCapitaNominal) / 1000;

  return (
    <div id="equivalence-calculator-card" className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 transition-colors">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <Calculator className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Scale & Productivity Equivalence Lab
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Decouple total economic size from population density through counterfactual simulation.
          </p>
        </div>
      </div>

      {/* 3 Core Equivalence Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4">
        
        {/* Card 1: Economic Multiplier */}
        <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block mb-1">
              Economic Multiplier
            </span>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono">
              {Number(aToBMultiple) >= 1 ? `${aToBMultiple}×` : `${bToAMultiple}×`}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
              {Number(aToBMultiple) >= 1 ? (
                <>
                  It takes <strong className="text-slate-900 dark:text-slate-100">{aToBMultiple}</strong> {entityB.name} economies to match the total output of <strong className="text-slate-900 dark:text-slate-100">{entityA.name}</strong>.
                </>
              ) : (
                <>
                  It takes <strong className="text-slate-900 dark:text-slate-100">{bToAMultiple}</strong> {entityA.name} economies to match the total output of <strong className="text-slate-900 dark:text-slate-100">{entityB.name}</strong>.
                </>
              )}
            </p>
          </div>
        </div>

        {/* Card 2: If Entity A had Entity B's Population */}
        <div className="p-4 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-800/80 flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider block mb-1">
              If {entityA.shortName} Scaled to {entityB.shortName}’s Population
            </span>
            <div className="text-2xl font-black text-indigo-900 dark:text-indigo-200 font-mono">
              {formatCurrency(gdpIfAHadBPop)}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
              At {entityA.name}’s current productivity (${entityA.gdpPerCapitaNominal.toLocaleString()}/person) with {entityB.name}’s population ({entityB.population}M).
            </p>
          </div>
        </div>

        {/* Card 3: If Entity B had Entity A's Population */}
        <div className="p-4 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800/80 flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider block mb-1">
              If {entityB.shortName} Scaled to {entityA.shortName}’s Population
            </span>
            <div className="text-2xl font-black text-emerald-900 dark:text-emerald-200 font-mono">
              {formatCurrency(gdpIfBHadAPop)}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
              At {entityB.name}’s current productivity (${entityB.gdpPerCapitaNominal.toLocaleString()}/person) with {entityA.name}’s population ({entityA.population}M).
            </p>
          </div>
        </div>

      </div>

      {/* Interactive Population Simulator Slider */}
      <div className="mt-4 p-4 rounded-lg bg-slate-900 dark:bg-slate-850 border border-slate-800 text-white">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Interactive Population Sandbox
            </span>
          </div>
          <span className="text-xs text-slate-400">
            Slide to adjust hypothetical population: <strong className="text-white font-mono">{hypotheticalPop} Million</strong>
          </span>
        </div>

        <input
          id="hypothetical-population-slider"
          type="range"
          min="1"
          max="350"
          value={hypotheticalPop}
          onChange={(e) => setHypotheticalPop(Number(e.target.value))}
          className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-400"
        />

        <div className="grid grid-cols-2 gap-4 mt-4 pt-3 border-t border-slate-800 text-xs">
          <div>
            <span className="text-slate-400 block">{entityA.name} at {hypotheticalPop}M Pop:</span>
            <span className="text-base font-bold text-indigo-300 font-mono">
              {formatCurrency(customGdpA)}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">{entityB.name} at {hypotheticalPop}M Pop:</span>
            <span className="text-base font-bold text-emerald-300 font-mono">
              {formatCurrency(customGdpB)}
            </span>
          </div>
        </div>
      </div>

    </div>
  );
}
