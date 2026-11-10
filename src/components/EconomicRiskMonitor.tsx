import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Flame,
  TrendingDown,
  TrendingUp,
  Activity,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Zap,
  Info,
  Scale,
  Sparkles,
  ExternalLink,
  RotateCcw,
  SlidersHorizontal,
  CheckCircle2,
  DollarSign,
  AlertCircle,
} from 'lucide-react';
import { EconomicEntity } from '../types';
import { useTheme } from '../context/ThemeContext';
import {
  scanEconomicRisks,
  ComprehensiveRiskAssessment,
  RedFlagAlert,
  RiskSeverity,
  RiskDimensionScore,
} from '../utils/economicRiskScanner';

interface EconomicRiskMonitorProps {
  entityA: EconomicEntity;
  entityB: EconomicEntity;
  onLaunchStressTestPrompt?: (prompt: string) => void;
  className?: string;
}

export function EconomicRiskMonitor({
  entityA,
  entityB,
  onLaunchStressTestPrompt,
  className = '',
}: EconomicRiskMonitorProps) {
  const { isDarkMode } = useTheme();
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'critical' | 'matrix'>('all');
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);

  // Run the automated risk scanner engine
  const assessment: ComprehensiveRiskAssessment = useMemo(() => {
    return scanEconomicRisks(entityA, entityB);
  }, [entityA, entityB]);

  const {
    entityAProfile,
    entityBProfile,
    relativeRiskWinner,
    totalAlertsCount,
    criticalAlertsCount,
    redFlags,
    dimensions,
    executiveRiskDossier,
  } = assessment;

  // Filter alerts based on active tab
  const displayedAlerts = useMemo(() => {
    if (activeFilter === 'critical') {
      return redFlags.filter((f) => f.severity === 'critical');
    }
    return redFlags;
  }, [redFlags, activeFilter]);

  const getSeverityBadgeClasses = (severity: RiskSeverity) => {
    switch (severity) {
      case 'critical':
        return 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-900/60 font-black';
      case 'high':
        return 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-900/60 font-bold';
      case 'moderate':
        return 'bg-yellow-500/10 text-yellow-800 dark:text-yellow-400 border border-yellow-300 dark:border-yellow-900/60 font-semibold';
      case 'low':
      default:
        return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-900/60 font-medium';
    }
  };

  const getSeverityBgGlow = (severity: RiskSeverity) => {
    switch (severity) {
      case 'critical':
        return 'border-rose-200 dark:border-rose-900/70 bg-gradient-to-r from-rose-50/70 via-white to-white dark:from-rose-950/20 dark:via-slate-900 dark:to-slate-900';
      case 'high':
        return 'border-amber-200 dark:border-amber-900/70 bg-gradient-to-r from-amber-50/70 via-white to-white dark:from-amber-950/20 dark:via-slate-900 dark:to-slate-900';
      case 'moderate':
        return 'border-yellow-200 dark:border-yellow-900/70 bg-gradient-to-r from-yellow-50/60 via-white to-white dark:from-yellow-950/15 dark:via-slate-900 dark:to-slate-900';
      case 'low':
      default:
        return 'border-emerald-200 dark:border-emerald-900/60 bg-white dark:bg-slate-900';
    }
  };

  const getScoreBarColor = (score: number) => {
    if (score >= 70) return 'bg-rose-500';
    if (score >= 50) return 'bg-amber-500';
    if (score >= 30) return 'bg-yellow-500';
    return 'bg-emerald-500';
  };

  return (
    <div
      id="economic-risk-monitor-dashboard"
      className={`rounded-2xl border transition-all duration-300 overflow-hidden shadow-xs ${
        criticalAlertsCount > 0
          ? 'border-rose-300 dark:border-rose-900/80 bg-white dark:bg-slate-900'
          : totalAlertsCount > 0
          ? 'border-amber-300 dark:border-amber-900/80 bg-white dark:bg-slate-900'
          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
      } ${className}`}
    >
      {/* Top High-Priority Warning Header Strip */}
      <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-start sm:items-center gap-3">
          {/* Animated Pulse Warning Badge Icon */}
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
              criticalAlertsCount > 0
                ? 'bg-rose-50 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800 animate-pulse'
                : totalAlertsCount > 0
                ? 'bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                : 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
            }`}
          >
            {criticalAlertsCount > 0 ? (
              <Flame className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            ) : totalAlertsCount > 0 ? (
              <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-900 text-white dark:bg-indigo-600 dark:text-white">
                Economic Risk Monitor
              </span>

              {criticalAlertsCount > 0 ? (
                <span className="text-[11px] font-bold text-rose-700 dark:text-rose-300 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping inline-block" />
                  <span>{criticalAlertsCount} Critical Red Flags Detected</span>
                </span>
              ) : totalAlertsCount > 0 ? (
                <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                  <span>{totalAlertsCount} Elevated Macro Watchpoints</span>
                </span>
              ) : (
                <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                  Fiscal Health & Price Stability Resilient
                </span>
              )}
            </div>

            <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5 flex items-center gap-2">
              <span>Automated Macroeconomic & Fiscal Vulnerability Scan</span>
            </h3>

            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
              Continuously screening {entityA.name} and {entityB.name} for debt overhang, rapid inflation, growth contraction, and external deficit shocks.
            </p>
          </div>
        </div>

        {/* Right Action Controls: Quick Risk Scores & Accordion Toggle */}
        <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
          {/* Quick Entity Summary Badges */}
          <div className="hidden sm:flex items-center gap-2">
            <div
              className={`px-2.5 py-1 rounded-lg border text-xs flex items-center gap-1.5 ${
                entityAProfile.overallTier === 'critical'
                  ? 'bg-rose-50/70 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300'
                  : entityAProfile.overallTier === 'high'
                  ? 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-300'
                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <span>{entityA.flag}</span>
              <span className="font-semibold">{entityA.shortName}:</span>
              <span className="font-mono font-bold">{entityAProfile.overallScore}/100</span>
            </div>

            <div
              className={`px-2.5 py-1 rounded-lg border text-xs flex items-center gap-1.5 ${
                entityBProfile.overallTier === 'critical'
                  ? 'bg-rose-50/70 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300'
                  : entityBProfile.overallTier === 'high'
                  ? 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-300'
                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <span>{entityB.flag}</span>
              <span className="font-semibold">{entityB.shortName}:</span>
              <span className="font-mono font-bold">{entityBProfile.overallScore}/100</span>
            </div>
          </div>

          {/* Expand / Collapse Dashboard Toggle Button */}
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/90 hover:dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            title={isExpanded ? 'Collapse Risk Dashboard' : 'Expand Risk Dashboard'}
            aria-expanded={isExpanded}
          >
            <span>{isExpanded ? 'Collapse' : 'Inspect Risk Details'}</span>
            {isExpanded ? (
              <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            )}
          </button>
        </div>
      </div>

      {/* Expandable Body */}
      {isExpanded && (
        <div className="p-4 sm:p-5 space-y-5 animate-in fade-in duration-200">
          {/* Executive Comparative Risk Diagnosis Summary */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3 text-xs leading-relaxed">
            <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold text-slate-900 dark:text-white mr-1.5">
                Automated Risk Synthesis:
              </span>
              <span className="text-slate-700 dark:text-slate-300">
                {executiveRiskDossier}
              </span>
            </div>
          </div>

          {/* Dual Sovereign Risk Meters & Fiscal Space Assessment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Entity A Risk Card */}
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{entityA.flag}</span>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {entityA.name}
                    </h4>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Primary Risk: <strong className="text-slate-800 dark:text-slate-200">{entityAProfile.primaryVulnerability}</strong>
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    Risk Index
                  </span>
                  <div className="flex items-center justify-end gap-1.5">
                    <span className="text-lg font-black font-mono tabular-nums text-slate-900 dark:text-white">
                      {entityAProfile.overallScore}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">/100</span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ml-1 ${getSeverityBadgeClasses(
                        entityAProfile.overallTier
                      )}`}
                    >
                      {entityAProfile.overallTier}
                    </span>
                  </div>
                </div>
              </div>

              {/* Score Bar Meter */}
              <div className="space-y-1">
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    style={{ width: `${Math.min(100, Math.max(5, entityAProfile.overallScore))}%` }}
                    className={`h-full transition-all duration-500 rounded-full ${getScoreBarColor(
                      entityAProfile.overallScore
                    )}`}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>0 (Safe)</span>
                  <span>50 (Elevated)</span>
                  <span>100 (Severe)</span>
                </div>
              </div>

              {/* Fiscal Space Tag */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-medium">
                  Fiscal Space Capacity:
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {entityAProfile.fiscalSpaceAssessment}
                </span>
              </div>
            </div>

            {/* Entity B Risk Card */}
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{entityB.flag}</span>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {entityB.name}
                    </h4>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Primary Risk: <strong className="text-slate-800 dark:text-slate-200">{entityBProfile.primaryVulnerability}</strong>
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    Risk Index
                  </span>
                  <div className="flex items-center justify-end gap-1.5">
                    <span className="text-lg font-black font-mono tabular-nums text-slate-900 dark:text-white">
                      {entityBProfile.overallScore}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">/100</span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ml-1 ${getSeverityBadgeClasses(
                        entityBProfile.overallTier
                      )}`}
                    >
                      {entityBProfile.overallTier}
                    </span>
                  </div>
                </div>
              </div>

              {/* Score Bar Meter */}
              <div className="space-y-1">
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    style={{ width: `${Math.min(100, Math.max(5, entityBProfile.overallScore))}%` }}
                    className={`h-full transition-all duration-500 rounded-full ${getScoreBarColor(
                      entityBProfile.overallScore
                    )}`}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>0 (Safe)</span>
                  <span>50 (Elevated)</span>
                  <span>100 (Severe)</span>
                </div>
              </div>

              {/* Fiscal Space Tag */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-medium">
                  Fiscal Space Capacity:
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {entityBProfile.fiscalSpaceAssessment}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Filter Tabs */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <div className="flex items-center gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => setActiveFilter('all')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  activeFilter === 'all'
                    ? 'bg-slate-900 text-white dark:bg-indigo-600 dark:text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>All Red Flags</span>
                <span className="ml-1.5 text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/20">
                  {redFlags.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveFilter('critical')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  activeFilter === 'critical'
                    ? 'bg-rose-600 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>Critical Only</span>
                <span className="ml-1.5 text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/20">
                  {criticalAlertsCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveFilter('matrix')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  activeFilter === 'matrix'
                    ? 'bg-slate-900 text-white dark:bg-indigo-600 dark:text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>Comparative Risk Matrix</span>
                <span className="ml-1.5 text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/20">
                  {dimensions.length}
                </span>
              </button>
            </div>

            <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
              Source: Harmonized IMF/World Bank Prudential Standards
            </span>
          </div>

          {/* TAB CONTENT: RED FLAG ALERTS CARDS */}
          {activeFilter !== 'matrix' && (
            <div className="space-y-3">
              {displayedAlerts.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-xs">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <p className="font-bold text-slate-800 dark:text-slate-200">
                    No active {activeFilter === 'critical' ? 'critical ' : ''}red flags detected
                  </p>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                    Both entities currently operate within standard sustainability corridors for this filter.
                  </p>
                </div>
              ) : (
                displayedAlerts.map((flag) => {
                  const isSelected = selectedAlertId === flag.id;
                  return (
                    <div
                      key={flag.id}
                      className={`p-4 rounded-xl border transition-all ${getSeverityBgGlow(
                        flag.severity
                      )} ${
                        isSelected ? 'ring-2 ring-indigo-500/60' : ''
                      }`}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-base">{flag.entity.flag}</span>
                            <span className="text-xs font-black text-slate-900 dark:text-white">
                              {flag.title}
                            </span>
                            <span
                              className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${getSeverityBadgeClasses(
                                flag.severity
                              )}`}
                            >
                              {flag.severity === 'critical'
                                ? 'Critical Red Flag'
                                : flag.severity === 'high'
                                ? 'High Risk Alert'
                                : 'Elevated Watch'}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              {flag.thresholdValue}
                            </span>
                          </div>

                          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                            {flag.summary}
                          </p>

                          <div className="pt-1.5 flex items-start gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                            <span>
                              <strong className="text-slate-700 dark:text-slate-300">
                                Transmission Channel:
                              </strong>{' '}
                              {flag.transmissionRisk}
                            </span>
                          </div>
                        </div>

                        {/* Interactive Stress-Test Action Button */}
                        <div className="flex items-center gap-2 self-start lg:self-center shrink-0">
                          {onLaunchStressTestPrompt && (
                            <button
                              type="button"
                              onClick={() => onLaunchStressTestPrompt(flag.copilotPrompt)}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs flex items-center gap-1.5 transition-all cursor-pointer group"
                              title="Ask Copilot to stress-test this specific vulnerability"
                            >
                              <Zap className="w-3.5 h-3.5 text-amber-300 group-hover:scale-110 transition-transform" />
                              <span>Stress-Test in Copilot</span>
                              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB CONTENT: COMPARATIVE RISK MATRIX */}
          {activeFilter === 'matrix' && (
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    <th className="py-2.5 px-4">Risk Dimension</th>
                    <th className="py-2.5 px-4 text-center">Safety Threshold</th>
                    <th className="py-2.5 px-4 text-right">
                      {entityA.flag} {entityA.shortName}
                    </th>
                    <th className="py-2.5 px-4 text-right">
                      {entityB.flag} {entityB.shortName}
                    </th>
                    <th className="py-2.5 px-4">Comparative Diagnosis</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {dimensions.map((dim) => (
                    <tr
                      key={dim.category}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                        {dim.name}
                        <span className="block text-[10px] font-normal font-mono text-slate-400">
                          {dim.metricLabel}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center text-slate-500 font-mono text-[11px]">
                        {dim.benchmarkThreshold}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <span
                            className={`font-mono font-bold ${
                              dim.severityA === 'critical'
                                ? 'text-rose-600 dark:text-rose-400'
                                : dim.severityA === 'high'
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-slate-800 dark:text-slate-200'
                            }`}
                          >
                            {dim.formattedValA}
                          </span>
                          <span
                            className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded ${getSeverityBadgeClasses(
                              dim.severityA
                            )}`}
                          >
                            {dim.severityA}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <span
                            className={`font-mono font-bold ${
                              dim.severityB === 'critical'
                                ? 'text-rose-600 dark:text-rose-400'
                                : dim.severityB === 'high'
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-slate-800 dark:text-slate-200'
                            }`}
                          >
                            {dim.formattedValB}
                          </span>
                          <span
                            className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded ${getSeverityBadgeClasses(
                              dim.severityB
                            )}`}
                          >
                            {dim.severityB}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300 text-[11px]">
                        {dim.insight}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
