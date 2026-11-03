import { useState, useMemo } from 'react';
import {
  Sliders,
  RotateCcw,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Percent,
  Landmark,
  Scale,
  Zap,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  Copy,
  Info,
  DollarSign,
  BarChart2,
  RefreshCw,
  Cpu,
} from 'lucide-react';
import { EconomicEntity } from '../types';
import { formatCurrency } from '../utils/formatters';
import { useTheme } from '../context/ThemeContext';

interface WhatIfScenarioBuilderProps {
  entityA: EconomicEntity;
  entityB: EconomicEntity;
}

interface EconomicLeverValues {
  rateShift: number; // in percentage points, e.g. -2.0 to +3.0%
  taxShift: number; // in percentage points, e.g. -5.0% to +5.0%
  fiscalSpendShift: number; // in % of GDP, e.g. -3.0% to +4.0%
  tariffRate: number; // in %, e.g. 0% to 25%
  productivityShock: number; // in %, e.g. -1.0% to +3.0%
}

const DEFAULT_LEVERS: EconomicLeverValues = {
  rateShift: 0,
  taxShift: 0,
  fiscalSpendShift: 0,
  tariffRate: 0,
  productivityShock: 0,
};

type PresetScenarioId =
  | 'custom'
  | 'hawkish_tightening'
  | 'supply_side_tax_cut'
  | 'keynesian_stimulus'
  | 'stagflation_shock'
  | 'ai_productivity_boom';

export function WhatIfScenarioBuilder({ entityA, entityB }: WhatIfScenarioBuilderProps) {
  const { isDarkMode } = useTheme();

  // Whether adjustments apply symmetrically to both or independently
  const [isLinked, setIsLinked] = useState<boolean>(true);
  const [activePreset, setActivePreset] = useState<PresetScenarioId>('custom');
  const [copied, setCopied] = useState<boolean>(false);

  // Levers state
  const [leversA, setLeversA] = useState<EconomicLeverValues>(DEFAULT_LEVERS);
  const [leversB, setLeversB] = useState<EconomicLeverValues>(DEFAULT_LEVERS);

  const updateLeverA = (key: keyof EconomicLeverValues, value: number) => {
    setActivePreset('custom');
    setLeversA((prev) => {
      const updated = { ...prev, [key]: value };
      if (isLinked) {
        setLeversB(updated);
      }
      return updated;
    });
  };

  const updateLeverB = (key: keyof EconomicLeverValues, value: number) => {
    setActivePreset('custom');
    setLeversB((prev) => {
      const updated = { ...prev, [key]: value };
      if (isLinked) {
        setLeversA(updated);
      }
      return updated;
    });
  };

  const applyPreset = (preset: PresetScenarioId) => {
    setActivePreset(preset);
    let values: EconomicLeverValues = DEFAULT_LEVERS;

    switch (preset) {
      case 'hawkish_tightening':
        values = {
          rateShift: 1.5,
          taxShift: 0,
          fiscalSpendShift: -1.0,
          tariffRate: 0,
          productivityShock: 0,
        };
        break;
      case 'supply_side_tax_cut':
        values = {
          rateShift: 0,
          taxShift: -3.0,
          fiscalSpendShift: -0.5,
          tariffRate: 0,
          productivityShock: 1.2,
        };
        break;
      case 'keynesian_stimulus':
        values = {
          rateShift: -0.5,
          taxShift: 0,
          fiscalSpendShift: 2.5,
          tariffRate: 0,
          productivityShock: 0.5,
        };
        break;
      case 'stagflation_shock':
        values = {
          rateShift: 1.5,
          taxShift: 1.0,
          fiscalSpendShift: 0,
          tariffRate: 10.0,
          productivityShock: -1.0,
        };
        break;
      case 'ai_productivity_boom':
        values = {
          rateShift: -0.25,
          taxShift: -1.0,
          fiscalSpendShift: 0.5,
          tariffRate: 0,
          productivityShock: 2.5,
        };
        break;
      default:
        values = DEFAULT_LEVERS;
    }

    setLeversA(values);
    setLeversB(values);
  };

  const resetAll = () => {
    setActivePreset('custom');
    setLeversA(DEFAULT_LEVERS);
    setLeversB(DEFAULT_LEVERS);
  };

  // Macro transmission calculation function
  const calculateImpact = (entity: EconomicEntity, levers: EconomicLeverValues) => {
    const baseGdp = entity.nominalGdp;
    const baseGrowth = entity.gdpGrowthRate;
    const baseInflation = entity.inflationRate;
    const baseDebt = entity.publicDebtToGdp;
    const basePerCapita = entity.gdpPerCapitaNominal;
    const baseUnemployment = entity.unemploymentRate;

    // 1. Growth Rate Impact
    // - Rate hike drag: -0.35% growth per +100 bps
    // - Tax shift: -0.20% growth per +1% tax increase (+0.20% per cut)
    // - Fiscal spend: +0.70x Keynesian multiplier
    // - Tariff drag: -0.04% per 1% tariff (trade friction)
    // - Productivity shock: 1:1 direct transmission
    const deltaGrowth =
      -levers.rateShift * 0.35 -
      levers.taxShift * 0.22 +
      levers.fiscalSpendShift * 0.72 -
      levers.tariffRate * 0.045 +
      levers.productivityShock * 0.95;

    const projectedGrowth = Math.max(-4.0, Number((baseGrowth + deltaGrowth).toFixed(2)));

    // 2. Inflation Rate Impact
    // - Higher rates dampen inflation: -0.40% per 100 bps
    // - Higher fiscal spend stimulates demand: +0.30% per 1% GDP spend
    // - Tariffs directly increase import prices: +0.15% per 1% tariff
    // - Supply-side productivity lowers marginal cost: -0.25% per 1% shock
    const deltaInflation =
      -levers.rateShift * 0.42 +
      levers.fiscalSpendShift * 0.28 +
      levers.tariffRate * 0.14 -
      levers.productivityShock * 0.22;

    const projectedInflation = Math.max(-1.5, Number((baseInflation + deltaInflation).toFixed(2)));

    // 3. Projected 1-Year Nominal GDP
    // Nominal GDP grows by Real Growth + Inflation Deflator
    const baseNominalExpansion = (baseGrowth + baseInflation) / 100;
    const projectedNominalExpansion = (projectedGrowth + projectedInflation) / 100;

    const projectedGdp1Y = Math.round(baseGdp * (1 + projectedNominalExpansion));
    const deltaGdp1Y = projectedGdp1Y - Math.round(baseGdp * (1 + baseNominalExpansion));

    // Projected 5-Year Cumulative Output
    const projectedGdp5Y = Math.round(baseGdp * Math.pow(1 + projectedGrowth / 100, 5));
    const baselineGdp5Y = Math.round(baseGdp * Math.pow(1 + baseGrowth / 100, 5));
    const deltaGdp5Y = projectedGdp5Y - baselineGdp5Y;

    // 4. Public Debt-to-GDP Ratio
    // - Higher interest rate rolls over into debt servicing costs (higher debt countries suffer much more!)
    // - Additional fiscal spending adds directly to debt
    // - Tax cuts add to primary deficit unless offset
    // - Higher nominal GDP growth expands denominator (reduces ratio)
    const debtStockRatio = baseDebt / 100;
    const rolloverExposure = 0.22; // 22% of debt rolls over annually
    const interestExpenseCost = debtStockRatio * (levers.rateShift * rolloverExposure);
    const primaryDeficitImpact = levers.fiscalSpendShift - levers.taxShift * 0.65;
    const denominatorEffect = -(deltaGrowth * 0.45);

    const projectedDebt = Math.max(
      10,
      Number((baseDebt + interestExpenseCost + primaryDeficitImpact + denominatorEffect).toFixed(1))
    );
    const deltaDebt = Number((projectedDebt - baseDebt).toFixed(1));

    // 5. Unemployment Rate (Okun's Law: 1% growth delta produces ~ -0.4% unemployment change)
    const deltaUnemployment = -(deltaGrowth * 0.42);
    const projectedUnemployment = Math.max(
      1.5,
      Number((baseUnemployment + deltaUnemployment).toFixed(1))
    );

    // 6. GDP Per Capita Projected
    const projectedPerCapita = Math.round(basePerCapita * (1 + projectedGrowth / 100));
    const deltaPerCapita = projectedPerCapita - Math.round(basePerCapita * (1 + baseGrowth / 100));

    return {
      projectedGrowth,
      deltaGrowth: Number(deltaGrowth.toFixed(2)),
      projectedInflation,
      deltaInflation: Number(deltaInflation.toFixed(2)),
      projectedGdp1Y,
      deltaGdp1Y,
      projectedGdp5Y,
      deltaGdp5Y,
      projectedDebt,
      deltaDebt,
      projectedUnemployment,
      deltaUnemployment: Number(deltaUnemployment.toFixed(1)),
      projectedPerCapita,
      deltaPerCapita,
    };
  };

  const simA = useMemo(() => calculateImpact(entityA, leversA), [entityA, leversA]);
  const simB = useMemo(() => calculateImpact(entityB, leversB), [entityB, leversB]);

  const handleCopySummary = async () => {
    try {
      const summary = `WHAT-IF MACRO SIMULATION: ${entityA.name} vs ${entityB.name}
Scenario: ${activePreset}
Entity A (${entityA.shortName}) Levers: Rate ${leversA.rateShift >= 0 ? '+' : ''}${leversA.rateShift}%, Tax ${leversA.taxShift >= 0 ? '+' : ''}${leversA.taxShift}%, Fiscal ${leversA.fiscalSpendShift >= 0 ? '+' : ''}${leversA.fiscalSpendShift}% GDP, Tariff ${leversA.tariffRate}%
-> Growth: ${entityA.gdpGrowthRate}% -> ${simA.projectedGrowth}% (${simA.deltaGrowth >= 0 ? '+' : ''}${simA.deltaGrowth}%)
-> 5Y GDP: $${simA.projectedGdp5Y.toLocaleString()}B (${simA.deltaGdp5Y >= 0 ? '+' : ''}$${simA.deltaGdp5Y.toLocaleString()}B)
-> Debt-to-GDP: ${entityA.publicDebtToGdp}% -> ${simA.projectedDebt}%

Entity B (${entityB.shortName}) Levers: Rate ${leversB.rateShift >= 0 ? '+' : ''}${leversB.rateShift}%, Tax ${leversB.taxShift >= 0 ? '+' : ''}${leversB.taxShift}%, Fiscal ${leversB.fiscalSpendShift >= 0 ? '+' : ''}${leversB.fiscalSpendShift}% GDP, Tariff ${leversB.tariffRate}%
-> Growth: ${entityB.gdpGrowthRate}% -> ${simB.projectedGrowth}% (${simB.deltaGrowth >= 0 ? '+' : ''}${simB.deltaGrowth}%)
-> 5Y GDP: $${simB.projectedGdp5Y.toLocaleString()}B (${simB.deltaGdp5Y >= 0 ? '+' : ''}$${simB.deltaGdp5Y.toLocaleString()}B)
-> Debt-to-GDP: ${entityB.publicDebtToGdp}% -> ${simB.projectedDebt}%`;
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (_e) {
      // ignore
    }
  };

  // Qualitative Analysis Narrative
  const simulationNarrative = useMemo(() => {
    const isRateHikeA = leversA.rateShift > 0;
    const isTaxCutA = leversA.taxShift < 0;
    const isStimulusA = leversA.fiscalSpendShift > 0;

    let narrativeA = '';
    if (isRateHikeA) {
      narrativeA = `For ${entityA.shortName}, hiking interest rates by ${leversA.rateShift}% dampens domestic credit demand, cooling inflation to ${simA.projectedInflation}%, while increasing annual debt service costs due to its ${entityA.publicDebtToGdp}% baseline debt ratio.`;
    } else if (isTaxCutA) {
      narrativeA = `A ${Math.abs(leversA.taxShift)}% tax cut provides immediate corporate investment tailwinds for ${entityA.shortName}, lifting annual GDP growth to ${simA.projectedGrowth}%, while widening the debt ratio to ${simA.projectedDebt}%.`;
    } else if (isStimulusA) {
      narrativeA = `Deploying ${leversA.fiscalSpendShift}% GDP in fiscal expenditure stimulates output toward ${simA.projectedGrowth}%, but increases debt to ${simA.projectedDebt}%.`;
    } else {
      narrativeA = `${entityA.shortName}'s trajectory remains aligned with its baseline growth momentum of ${entityA.gdpGrowthRate}%.`;
    }

    let comparisonNote = '';
    if (simA.projectedGrowth > simB.projectedGrowth) {
      comparisonNote = `${entityA.shortName} outpaces ${entityB.shortName} by ${(simA.projectedGrowth - simB.projectedGrowth).toFixed(1)}% in projected real expansion.`;
    } else if (simB.projectedGrowth > simA.projectedGrowth) {
      comparisonNote = `${entityB.shortName} leads ${entityA.shortName} by ${(simB.projectedGrowth - simA.projectedGrowth).toFixed(1)}% in projected expansion.`;
    } else {
      comparisonNote = `Both economies maintain exact growth parity at ${simA.projectedGrowth}%.`;
    }

    return `${narrativeA} ${comparisonNote}`;
  }, [entityA, entityB, leversA, leversB, simA, simB]);

  return (
    <div id="what-if-scenario-builder-card" className="space-y-6">
      {/* Top Banner & Control Deck */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 bg-linear-to-r from-purple-50/50 via-white to-indigo-50/40 dark:from-purple-950/20 dark:via-slate-900 dark:to-indigo-950/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-1.5 rounded-lg bg-purple-600 text-white shadow-xs">
                <Sliders className="w-4 h-4" />
              </span>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                &lsquo;What-If&rsquo; Macroeconomic Policy Simulator
              </h2>
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-2xs font-bold bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                <Zap className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                <span>Dynamic Transmission Model</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-3xl">
              Stress-test interest rate shifts, corporate tax changes, fiscal stimulus outlays, tariffs, and AI productivity shocks to project real-time impacts on GDP, inflation, and sovereign debt.
            </p>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              id="reset-what-if-btn"
              onClick={resetAll}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center space-x-1.5 transition-colors shadow-2xs cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Reset to Baseline</span>
            </button>

            <button
              id="copy-what-if-summary-btn"
              onClick={handleCopySummary}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-2xs cursor-pointer ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-purple-600 hover:bg-purple-700 text-white'
              }`}
            >
              {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Export Simulation'}</span>
            </button>
          </div>
        </div>

        {/* Quick Scenario Preset Chips */}
        <div className="p-4 bg-slate-50/70 dark:bg-slate-850/60 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-2xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-3xs mr-1">
              Macro Presets:
            </span>
            <button
              id="preset-hawkish"
              onClick={() => applyPreset('hawkish_tightening')}
              className={`px-2.5 py-1 rounded-full font-medium transition-colors cursor-pointer border ${
                activePreset === 'hawkish_tightening'
                  ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              Hawkish Tightening (+1.5% Rates)
            </button>
            <button
              id="preset-tax-cut"
              onClick={() => applyPreset('supply_side_tax_cut')}
              className={`px-2.5 py-1 rounded-full font-medium transition-colors cursor-pointer border ${
                activePreset === 'supply_side_tax_cut'
                  ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              Supply-Side Tax Cut (-3% Tax)
            </button>
            <button
              id="preset-stimulus"
              onClick={() => applyPreset('keynesian_stimulus')}
              className={`px-2.5 py-1 rounded-full font-medium transition-colors cursor-pointer border ${
                activePreset === 'keynesian_stimulus'
                  ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              Keynesian Stimulus (+2.5% Spend)
            </button>
            <button
              id="preset-stagflation"
              onClick={() => applyPreset('stagflation_shock')}
              className={`px-2.5 py-1 rounded-full font-medium transition-colors cursor-pointer border ${
                activePreset === 'stagflation_shock'
                  ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              Stagflation & Tariff Shock (+10% Tariffs)
            </button>
            <button
              id="preset-ai-boom"
              onClick={() => applyPreset('ai_productivity_boom')}
              className={`px-2.5 py-1 rounded-full font-medium transition-colors cursor-pointer border ${
                activePreset === 'ai_productivity_boom'
                  ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              AI Productivity Boom (+2.5% Tech)
            </button>
          </div>

          {/* Symmetrical vs Independent lever link */}
          <div className="flex items-center space-x-2 pl-2">
            <label className="flex items-center space-x-1.5 cursor-pointer select-none text-slate-600 dark:text-slate-300">
              <input
                id="link-entities-checkbox"
                type="checkbox"
                checked={isLinked}
                onChange={(e) => setIsLinked(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-purple-600 focus:ring-purple-500 border-slate-300 dark:border-slate-600"
              />
              <span className="font-semibold">Apply Symmetrically to Both Entities</span>
            </label>
          </div>
        </div>

        {/* Interactive Levers Control Grid */}
        <div className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Entity A Lever Panel */}
          <div className="bg-indigo-50/30 dark:bg-slate-850/70 rounded-xl p-4 sm:p-5 border border-indigo-100/80 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-indigo-100 dark:border-slate-800 pb-2.5">
              <div className="flex items-center space-x-2">
                <span className="text-xl">{entityA.flag}</span>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {entityA.name} Policy Levers
                  </h4>
                  <span className="text-3xs text-slate-400 font-mono">
                    Baseline: {entityA.gdpGrowthRate}% growth • {entityA.publicDebtToGdp}% debt
                  </span>
                </div>
              </div>
              <span className="text-2xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-950/80 px-2 py-0.5 rounded">
                Entity A
              </span>
            </div>

            {/* Slider 1: Central Bank / Interest Rate Shift */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-2xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Landmark className="w-3 h-3 text-indigo-600" />
                  <span>Central Bank Policy Rate Adjustment:</span>
                </span>
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                  {leversA.rateShift >= 0 ? '+' : ''}
                  {leversA.rateShift.toFixed(2)}% ({leversA.rateShift * 100} bps)
                </span>
              </div>
              <input
                id="rate-slider-a"
                type="range"
                min="-3.0"
                max="4.0"
                step="0.25"
                value={leversA.rateShift}
                onChange={(e) => updateLeverA('rateShift', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <div className="flex justify-between text-3xs text-slate-400 font-mono">
                <span>-300 bps (Dovish Easing)</span>
                <span>Neutral (0)</span>
                <span>+400 bps (Aggressive Hike)</span>
              </div>
            </div>

            {/* Slider 2: Corporate / Effective Tax Rate Shift */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-2xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Percent className="w-3 h-3 text-purple-600" />
                  <span>Effective Corporate & Capital Tax Shift:</span>
                </span>
                <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
                  {leversA.taxShift >= 0 ? '+' : ''}
                  {leversA.taxShift.toFixed(1)}%
                </span>
              </div>
              <input
                id="tax-slider-a"
                type="range"
                min="-5.0"
                max="5.0"
                step="0.5"
                value={leversA.taxShift}
                onChange={(e) => updateLeverA('taxShift', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
              <div className="flex justify-between text-3xs text-slate-400 font-mono">
                <span>-5.0% (Supply-Side Cut)</span>
                <span>Status Quo</span>
                <span>+5.0% (Revenue Surcharge)</span>
              </div>
            </div>

            {/* Slider 3: Fiscal Spending / Infrastructure Outlay (% of GDP) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-2xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <DollarSign className="w-3 h-3 text-emerald-600" />
                  <span>Fiscal Spending & Capital Investment:</span>
                </span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {leversA.fiscalSpendShift >= 0 ? '+' : ''}
                  {leversA.fiscalSpendShift.toFixed(1)}% GDP
                </span>
              </div>
              <input
                id="spend-slider-a"
                type="range"
                min="-3.0"
                max="4.0"
                step="0.5"
                value={leversA.fiscalSpendShift}
                onChange={(e) => updateLeverA('fiscalSpendShift', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
              <div className="flex justify-between text-3xs text-slate-400 font-mono">
                <span>-3% GDP (Austerity)</span>
                <span>Neutral</span>
                <span>+4% GDP (Keynesian Stimulus)</span>
              </div>
            </div>

            {/* Slider 4: AI & Productivity Shock */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-2xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Cpu className="w-3 h-3 text-indigo-600" />
                  <span>Structural Tech & Productivity Multiplier:</span>
                </span>
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                  {leversA.productivityShock >= 0 ? '+' : ''}
                  {leversA.productivityShock.toFixed(1)}%
                </span>
              </div>
              <input
                id="productivity-slider-a"
                type="range"
                min="-1.5"
                max="3.0"
                step="0.5"
                value={leversA.productivityShock}
                onChange={(e) => updateLeverA('productivityShock', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <div className="flex justify-between text-3xs text-slate-400 font-mono">
                <span>-1.5% (Productivity Drag)</span>
                <span>Base Baseline</span>
                <span>+3.0% (AI Supercycle)</span>
              </div>
            </div>
          </div>

          {/* Entity B Lever Panel */}
          <div className="bg-emerald-50/30 dark:bg-slate-850/70 rounded-xl p-4 sm:p-5 border border-emerald-100/80 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-emerald-100 dark:border-slate-800 pb-2.5">
              <div className="flex items-center space-x-2">
                <span className="text-xl">{entityB.flag}</span>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {entityB.name} Policy Levers
                  </h4>
                  <span className="text-3xs text-slate-400 font-mono">
                    Baseline: {entityB.gdpGrowthRate}% growth • {entityB.publicDebtToGdp}% debt
                  </span>
                </div>
              </div>
              <span className="text-2xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded">
                Entity B
              </span>
            </div>

            {/* Slider 1: Central Bank / Interest Rate Shift */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-2xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Landmark className="w-3 h-3 text-emerald-600" />
                  <span>Central Bank Policy Rate Adjustment:</span>
                </span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {leversB.rateShift >= 0 ? '+' : ''}
                  {leversB.rateShift.toFixed(2)}% ({leversB.rateShift * 100} bps)
                </span>
              </div>
              <input
                id="rate-slider-b"
                type="range"
                min="-3.0"
                max="4.0"
                step="0.25"
                value={leversB.rateShift}
                onChange={(e) => updateLeverB('rateShift', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
              <div className="flex justify-between text-3xs text-slate-400 font-mono">
                <span>-300 bps (Dovish Easing)</span>
                <span>Neutral (0)</span>
                <span>+400 bps (Aggressive Hike)</span>
              </div>
            </div>

            {/* Slider 2: Corporate / Effective Tax Rate Shift */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-2xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Percent className="w-3 h-3 text-purple-600" />
                  <span>Effective Corporate & Capital Tax Shift:</span>
                </span>
                <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
                  {leversB.taxShift >= 0 ? '+' : ''}
                  {leversB.taxShift.toFixed(1)}%
                </span>
              </div>
              <input
                id="tax-slider-b"
                type="range"
                min="-5.0"
                max="5.0"
                step="0.5"
                value={leversB.taxShift}
                onChange={(e) => updateLeverB('taxShift', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
              <div className="flex justify-between text-3xs text-slate-400 font-mono">
                <span>-5.0% (Supply-Side Cut)</span>
                <span>Status Quo</span>
                <span>+5.0% (Revenue Surcharge)</span>
              </div>
            </div>

            {/* Slider 3: Fiscal Spending / Infrastructure Outlay (% of GDP) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-2xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <DollarSign className="w-3 h-3 text-emerald-600" />
                  <span>Fiscal Spending & Capital Investment:</span>
                </span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {leversB.fiscalSpendShift >= 0 ? '+' : ''}
                  {leversB.fiscalSpendShift.toFixed(1)}% GDP
                </span>
              </div>
              <input
                id="spend-slider-b"
                type="range"
                min="-3.0"
                max="4.0"
                step="0.5"
                value={leversB.fiscalSpendShift}
                onChange={(e) => updateLeverB('fiscalSpendShift', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
              <div className="flex justify-between text-3xs text-slate-400 font-mono">
                <span>-3% GDP (Austerity)</span>
                <span>Neutral</span>
                <span>+4% GDP (Keynesian Stimulus)</span>
              </div>
            </div>

            {/* Slider 4: AI & Productivity Shock */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-2xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Cpu className="w-3 h-3 text-emerald-600" />
                  <span>Structural Tech & Productivity Multiplier:</span>
                </span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {leversB.productivityShock >= 0 ? '+' : ''}
                  {leversB.productivityShock.toFixed(1)}%
                </span>
              </div>
              <input
                id="productivity-slider-b"
                type="range"
                min="-1.5"
                max="3.0"
                step="0.5"
                value={leversB.productivityShock}
                onChange={(e) => updateLeverB('productivityShock', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
              <div className="flex justify-between text-3xs text-slate-400 font-mono">
                <span>-1.5% (Productivity Drag)</span>
                <span>Base Baseline</span>
                <span>+3.0% (AI Supercycle)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Immediate Real-Time Impact Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Projected Real Growth Rate */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-2xs text-slate-400 uppercase font-bold tracking-wider mb-2">
            <span>Projected Real GDP Growth</span>
            <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
          </div>

          {/* Entity A */}
          <div className="mb-2.5 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {entityA.shortName}
              </span>
              <div className="text-right">
                <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">
                  {simA.projectedGrowth}%
                </span>
                <span
                  className={`text-3xs font-mono ml-1.5 font-bold ${
                    simA.deltaGrowth >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  ({simA.deltaGrowth >= 0 ? '+' : ''}{simA.deltaGrowth}%)
                </span>
              </div>
            </div>
            <span className="text-3xs text-slate-400 font-mono">
              Baseline: {entityA.gdpGrowthRate}%
            </span>
          </div>

          {/* Entity B */}
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {entityB.shortName}
              </span>
              <div className="text-right">
                <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                  {simB.projectedGrowth}%
                </span>
                <span
                  className={`text-3xs font-mono ml-1.5 font-bold ${
                    simB.deltaGrowth >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  ({simB.deltaGrowth >= 0 ? '+' : ''}{simB.deltaGrowth}%)
                </span>
              </div>
            </div>
            <span className="text-3xs text-slate-400 font-mono">
              Baseline: {entityB.gdpGrowthRate}%
            </span>
          </div>
        </div>

        {/* Card 2: 5-Year Cumulative Output Projected */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-2xs text-slate-400 uppercase font-bold tracking-wider mb-2">
            <span>5-Year Cumulative GDP</span>
            <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
          </div>

          {/* Entity A */}
          <div className="mb-2.5 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {entityA.shortName}
              </span>
              <div className="text-right">
                <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">
                  {formatCurrency(simA.projectedGdp5Y)}
                </span>
                <span
                  className={`text-3xs font-mono ml-1.5 font-bold ${
                    simA.deltaGdp5Y >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  ({simA.deltaGdp5Y >= 0 ? '+' : ''}${Math.round(simA.deltaGdp5Y)}B)
                </span>
              </div>
            </div>
            <span className="text-3xs text-slate-400 font-mono">
              Current: {formatCurrency(entityA.nominalGdp)}
            </span>
          </div>

          {/* Entity B */}
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {entityB.shortName}
              </span>
              <div className="text-right">
                <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(simB.projectedGdp5Y)}
                </span>
                <span
                  className={`text-3xs font-mono ml-1.5 font-bold ${
                    simB.deltaGdp5Y >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  ({simB.deltaGdp5Y >= 0 ? '+' : ''}${Math.round(simB.deltaGdp5Y)}B)
                </span>
              </div>
            </div>
            <span className="text-3xs text-slate-400 font-mono">
              Current: {formatCurrency(entityB.nominalGdp)}
            </span>
          </div>
        </div>

        {/* Card 3: Projected Inflation Rate */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-2xs text-slate-400 uppercase font-bold tracking-wider mb-2">
            <span>Projected Inflation (CPI)</span>
            <Scale className="w-3.5 h-3.5 text-amber-600" />
          </div>

          {/* Entity A */}
          <div className="mb-2.5 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {entityA.shortName}
              </span>
              <div className="text-right">
                <span className="text-sm font-black text-slate-900 dark:text-slate-100">
                  {simA.projectedInflation}%
                </span>
                <span
                  className={`text-3xs font-mono ml-1.5 font-bold ${
                    simA.deltaInflation <= 0 ? 'text-emerald-600' : 'text-amber-600'
                  }`}
                >
                  ({simA.deltaInflation >= 0 ? '+' : ''}{simA.deltaInflation}%)
                </span>
              </div>
            </div>
            <span className="text-3xs text-slate-400 font-mono">
              Baseline: {entityA.inflationRate}%
            </span>
          </div>

          {/* Entity B */}
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {entityB.shortName}
              </span>
              <div className="text-right">
                <span className="text-sm font-black text-slate-900 dark:text-slate-100">
                  {simB.projectedInflation}%
                </span>
                <span
                  className={`text-3xs font-mono ml-1.5 font-bold ${
                    simB.deltaInflation <= 0 ? 'text-emerald-600' : 'text-amber-600'
                  }`}
                >
                  ({simB.deltaInflation >= 0 ? '+' : ''}{simB.deltaInflation}%)
                </span>
              </div>
            </div>
            <span className="text-3xs text-slate-400 font-mono">
              Baseline: {entityB.inflationRate}%
            </span>
          </div>
        </div>

        {/* Card 4: Projected Public Debt-to-GDP */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-2xs text-slate-400 uppercase font-bold tracking-wider mb-2">
            <span>Projected Debt-to-GDP</span>
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
          </div>

          {/* Entity A */}
          <div className="mb-2.5 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {entityA.shortName}
              </span>
              <div className="text-right">
                <span
                  className={`text-sm font-black ${
                    simA.projectedDebt > 100 ? 'text-rose-600' : 'text-slate-900 dark:text-slate-100'
                  }`}
                >
                  {simA.projectedDebt}%
                </span>
                <span
                  className={`text-3xs font-mono ml-1.5 font-bold ${
                    simA.deltaDebt <= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  ({simA.deltaDebt >= 0 ? '+' : ''}{simA.deltaDebt}%)
                </span>
              </div>
            </div>
            <span className="text-3xs text-slate-400 font-mono">
              Baseline: {entityA.publicDebtToGdp}%
            </span>
          </div>

          {/* Entity B */}
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {entityB.shortName}
              </span>
              <div className="text-right">
                <span
                  className={`text-sm font-black ${
                    simB.projectedDebt > 100 ? 'text-rose-600' : 'text-slate-900 dark:text-slate-100'
                  }`}
                >
                  {simB.projectedDebt}%
                </span>
                <span
                  className={`text-3xs font-mono ml-1.5 font-bold ${
                    simB.deltaDebt <= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  ({simB.deltaDebt >= 0 ? '+' : ''}{simB.deltaDebt}%)
                </span>
              </div>
            </div>
            <span className="text-3xs text-slate-400 font-mono">
              Baseline: {entityB.publicDebtToGdp}%
            </span>
          </div>
        </div>
      </div>

      {/* Dynamic Macroeconomic Transmission Narrative Card */}
      <div className="p-4 sm:p-5 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-900/60 text-xs text-slate-800 dark:text-slate-200 leading-relaxed flex items-start space-x-3">
        <span className="p-1 rounded-md bg-purple-600 text-white shrink-0 mt-0.5">
          <Sparkles className="w-3.5 h-3.5" />
        </span>
        <div>
          <span className="font-bold text-purple-950 dark:text-purple-300 block mb-1 uppercase tracking-wider text-2xs">
            Simulation Synthesis & Transmission Mechanism
          </span>
          <p className="text-slate-700 dark:text-slate-300">{simulationNarrative}</p>
        </div>
      </div>

      {/* Side-by-Side Detailed Projection Spec Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-purple-600" />
            <span>Policy Shift Outcome Comparison Matrix</span>
          </h4>
          <span className="text-2xs text-slate-400 font-mono">
            Compounded over 1-year and 5-year forecast horizons
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-850 text-2xs uppercase tracking-wider text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-2.5 px-4">Metric Indicator</th>
                <th className="py-2.5 px-4">{entityA.shortName} Baseline</th>
                <th className="py-2.5 px-4 text-indigo-600 dark:text-indigo-400">{entityA.shortName} Simulated</th>
                <th className="py-2.5 px-4">{entityB.shortName} Baseline</th>
                <th className="py-2.5 px-4 text-emerald-600 dark:text-emerald-400">{entityB.shortName} Simulated</th>
                <th className="py-2.5 px-4 text-purple-600">Simulated Advantage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-2xs">
              <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                <td className="py-2 px-4 font-sans font-semibold text-slate-800 dark:text-slate-200">
                  Real GDP Growth Rate
                </td>
                <td className="py-2 px-4 text-slate-500">+{entityA.gdpGrowthRate}%</td>
                <td className="py-2 px-4 font-bold text-indigo-600 dark:text-indigo-400">
                  +{simA.projectedGrowth}%
                </td>
                <td className="py-2 px-4 text-slate-500">+{entityB.gdpGrowthRate}%</td>
                <td className="py-2 px-4 font-bold text-emerald-600 dark:text-emerald-400">
                  +{simB.projectedGrowth}%
                </td>
                <td className="py-2 px-4 font-sans font-bold text-slate-700 dark:text-slate-300">
                  {simA.projectedGrowth >= simB.projectedGrowth
                    ? `${entityA.shortName} (+${(simA.projectedGrowth - simB.projectedGrowth).toFixed(1)}%)`
                    : `${entityB.shortName} (+${(simB.projectedGrowth - simA.projectedGrowth).toFixed(1)}%)`}
                </td>
              </tr>

              <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                <td className="py-2 px-4 font-sans font-semibold text-slate-800 dark:text-slate-200">
                  Nominal GDP (5-Year Projected)
                </td>
                <td className="py-2 px-4 text-slate-500">{formatCurrency(entityA.nominalGdp)}</td>
                <td className="py-2 px-4 font-bold text-indigo-600 dark:text-indigo-400">
                  {formatCurrency(simA.projectedGdp5Y)}
                </td>
                <td className="py-2 px-4 text-slate-500">{formatCurrency(entityB.nominalGdp)}</td>
                <td className="py-2 px-4 font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(simB.projectedGdp5Y)}
                </td>
                <td className="py-2 px-4 font-sans font-bold text-slate-700 dark:text-slate-300">
                  {simA.projectedGdp5Y >= simB.projectedGdp5Y
                    ? `${entityA.shortName} (+${formatCurrency(simA.projectedGdp5Y - simB.projectedGdp5Y)})`
                    : `${entityB.shortName} (+${formatCurrency(simB.projectedGdp5Y - simA.projectedGdp5Y)})`}
                </td>
              </tr>

              <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                <td className="py-2 px-4 font-sans font-semibold text-slate-800 dark:text-slate-200">
                  Inflation Rate (CPI YoY)
                </td>
                <td className="py-2 px-4 text-slate-500">{entityA.inflationRate}%</td>
                <td className="py-2 px-4 font-bold text-indigo-600 dark:text-indigo-400">
                  {simA.projectedInflation}%
                </td>
                <td className="py-2 px-4 text-slate-500">{entityB.inflationRate}%</td>
                <td className="py-2 px-4 font-bold text-emerald-600 dark:text-emerald-400">
                  {simB.projectedInflation}%
                </td>
                <td className="py-2 px-4 font-sans font-bold text-slate-700 dark:text-slate-300">
                  {simA.projectedInflation <= simB.projectedInflation
                    ? `${entityA.shortName} (Lower price pressure)`
                    : `${entityB.shortName} (Lower price pressure)`}
                </td>
              </tr>

              <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                <td className="py-2 px-4 font-sans font-semibold text-slate-800 dark:text-slate-200">
                  Public Debt-to-GDP Ratio
                </td>
                <td className="py-2 px-4 text-slate-500">{entityA.publicDebtToGdp}%</td>
                <td className="py-2 px-4 font-bold text-indigo-600 dark:text-indigo-400">
                  {simA.projectedDebt}%
                </td>
                <td className="py-2 px-4 text-slate-500">{entityB.publicDebtToGdp}%</td>
                <td className="py-2 px-4 font-bold text-emerald-600 dark:text-emerald-400">
                  {simB.projectedDebt}%
                </td>
                <td className="py-2 px-4 font-sans font-bold text-slate-700 dark:text-slate-300">
                  {simA.projectedDebt <= simB.projectedDebt
                    ? `${entityA.shortName} (${simA.projectedDebt}% vs ${simB.projectedDebt}%)`
                    : `${entityB.shortName} (${simB.projectedDebt}% vs ${simA.projectedDebt}%)`}
                </td>
              </tr>

              <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                <td className="py-2 px-4 font-sans font-semibold text-slate-800 dark:text-slate-200">
                  Unemployment Rate
                </td>
                <td className="py-2 px-4 text-slate-500">{entityA.unemploymentRate}%</td>
                <td className="py-2 px-4 font-bold text-indigo-600 dark:text-indigo-400">
                  {simA.projectedUnemployment}%
                </td>
                <td className="py-2 px-4 text-slate-500">{entityB.unemploymentRate}%</td>
                <td className="py-2 px-4 font-bold text-emerald-600 dark:text-emerald-400">
                  {simB.projectedUnemployment}%
                </td>
                <td className="py-2 px-4 font-sans font-bold text-slate-700 dark:text-slate-300">
                  {simA.projectedUnemployment <= simB.projectedUnemployment
                    ? `${entityA.shortName} (${simA.projectedUnemployment}%)`
                    : `${entityB.shortName} (${simB.projectedUnemployment}%)`}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
