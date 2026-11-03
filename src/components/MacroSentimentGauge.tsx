import React, { useState, useMemo } from 'react';
import {
  Gauge,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  Sparkles,
  Info,
  CheckCircle2,
  AlertCircle,
  Scale,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import { EconomicEntity, CopilotAnalysisResult } from '../types';
import { useTheme } from '../context/ThemeContext';
import {
  calculateMacroConfidence,
  MacroConfidenceScore,
  SentimentLevel,
} from '../utils/macroConfidenceCalculator';

interface MacroSentimentGaugeProps {
  entityA: EconomicEntity;
  entityB: EconomicEntity;
  analysisResult?: CopilotAnalysisResult | null;
  className?: string;
}

export function MacroSentimentGauge({
  entityA,
  entityB,
  analysisResult,
  className = '',
}: MacroSentimentGaugeProps) {
  const { isDarkMode } = useTheme();

  // Active inspected entity: 'A' | 'B' | 'both'
  const [selectedSlot, setSelectedSlot] = useState<'A' | 'B'>('A');

  const scoreA = useMemo(
    () => calculateMacroConfidence(entityA, entityB, analysisResult),
    [entityA, entityB, analysisResult]
  );

  const scoreB = useMemo(
    () => calculateMacroConfidence(entityB, entityA, analysisResult),
    [entityA, entityB, analysisResult]
  );

  const activeEntity = selectedSlot === 'A' ? entityA : entityB;
  const activeScore = selectedSlot === 'A' ? scoreA : scoreB;
  const peerEntity = selectedSlot === 'A' ? entityB : entityA;
  const peerScore = selectedSlot === 'A' ? scoreB : scoreA;

  // SVG Gauge calculations
  // Angle: -90 deg (score = 0) to +90 deg (score = 100)
  const needleAngle = -90 + (activeScore.score / 100) * 180;

  // Radius and center for SVG arc
  const cx = 150;
  const cy = 135;
  const r = 100;
  const strokeWidth = 18;

  // Sentiment styling helper
  const getBadgeStyle = (level: SentimentLevel) => {
    switch (level) {
      case 'bullish':
        return 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'resilient':
        return 'bg-teal-50 dark:bg-teal-950/70 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800';
      case 'neutral':
        return 'bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'cautious':
        return 'bg-orange-50 dark:bg-orange-950/70 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800';
      case 'bearish':
        return 'bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800';
    }
  };

  return (
    <div
      className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs transition-colors ${className}`}
    >
      {/* Header & Target Country Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800">
              <Gauge className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
              <span>AI Macroeconomic Confidence</span>
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              Calibrated Sentiment Meter
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-1">
            Chỉ số Niềm tin Vĩ mô (Macro Confidence Score)
          </h3>
        </div>

        {/* Segmented Country Selector */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/80 shrink-0">
          <button
            type="button"
            onClick={() => setSelectedSlot('A')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
              selectedSlot === 'A'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <span>{entityA.flag}</span>
            <span className="truncate max-w-[120px]">{entityA.shortName}</span>
            <span className="ml-1 text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
              {scoreA.score}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedSlot('B')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
              selectedSlot === 'B'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <span>{entityB.flag}</span>
            <span className="truncate max-w-[120px]">{entityB.shortName}</span>
            <span className="ml-1 text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
              {scoreB.score}
            </span>
          </button>
        </div>
      </div>

      {/* Main Gauge Visual Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4 items-center">
        {/* Left Column: Visual Radial Gauge */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center p-3">
          <div className="relative w-full max-w-[280px] aspect-[300/180]">
            <svg
              viewBox="0 0 300 180"
              className="w-full h-full overflow-visible drop-shadow-xs"
            >
              <defs>
                {/* Arc color gradients */}
                <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f43f5e" /> {/* Rose - 0 */}
                  <stop offset="25%" stopColor="#f97316" /> {/* Orange - 25 */}
                  <stop offset="50%" stopColor="#eab308" /> {/* Amber - 50 */}
                  <stop offset="75%" stopColor="#14b8a6" /> {/* Teal - 75 */}
                  <stop offset="100%" stopColor="#10b981" /> {/* Emerald - 100 */}
                </linearGradient>

                <filter id="gaugeShadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.25" />
                </filter>
              </defs>

              {/* Background Arch Track */}
              <path
                d="M 50 135 A 100 100 0 0 1 250 135"
                fill="none"
                stroke={isDarkMode ? '#334155' : '#e2e8f0'}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
              />

              {/* Colored Gauge Arch */}
              <path
                d="M 50 135 A 100 100 0 0 1 250 135"
                fill="none"
                stroke="url(#gaugeGradient)"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                opacity={isDarkMode ? 0.9 : 0.85}
              />

              {/* Ticks and Zone Labels */}
              <text x="36" y="152" className="text-[10px] font-mono font-bold fill-slate-400 dark:fill-slate-500">
                0
              </text>
              <text x="85" y="55" className="text-[9px] font-mono fill-slate-400 dark:fill-slate-500">
                25
              </text>
              <text x="143" y="24" className="text-[9px] font-mono fill-slate-400 dark:fill-slate-500">
                50
              </text>
              <text x="206" y="55" className="text-[9px] font-mono fill-slate-400 dark:fill-slate-500">
                75
              </text>
              <text x="254" y="152" className="text-[10px] font-mono font-bold fill-slate-400 dark:fill-slate-500">
                100
              </text>

              {/* Rotating Needle */}
              <g
                style={{
                  transform: `rotate(${needleAngle}deg)`,
                  transformOrigin: `${cx}px ${cy}px`,
                  transition: 'transform 750ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
              >
                {/* Needle path */}
                <polygon
                  points={`${cx - 3},${cy} ${cx},${cy - 88} ${cx + 3},${cy}`}
                  fill={isDarkMode ? '#f8fafc' : '#1e293b'}
                  filter="url(#gaugeShadow)"
                />
                <circle
                  cx={cx}
                  cy={cy}
                  r="7"
                  fill={isDarkMode ? '#6366f1' : '#4f46e5'}
                  stroke={isDarkMode ? '#0f172a' : '#ffffff'}
                  strokeWidth="2.5"
                />
              </g>

              {/* Center Pivot Point */}
              <circle
                cx={cx}
                cy={cy}
                r="3"
                fill={isDarkMode ? '#f8fafc' : '#ffffff'}
              />
            </svg>
          </div>

          {/* Central Score Display */}
          <div className="text-center -mt-3">
            <div className="flex items-baseline justify-center space-x-1">
              <span className="text-4xl sm:text-5xl font-black font-mono tabular-nums tracking-tight text-slate-900 dark:text-white">
                {activeScore.score}
              </span>
              <span className="text-xs font-mono font-bold text-slate-400 dark:text-slate-500">
                / 100
              </span>
            </div>

            <div className="mt-1">
              <span
                className={`inline-flex items-center space-x-1 px-3 py-1 rounded-md text-xs font-bold border ${getBadgeStyle(
                  activeScore.sentimentLevel
                )}`}
              >
                <span>{activeScore.sentiment}</span>
              </span>
            </div>

            {/* Peer Comparison Delta Badge */}
            <div className="mt-2 text-[11px] font-mono text-slate-500 dark:text-slate-400 flex items-center justify-center space-x-1.5">
              <span>vs. {peerEntity.shortName}:</span>
              {activeScore.deltaVsPeer > 0 ? (
                <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-0.5 inline" />+{activeScore.deltaVsPeer} pts
                </span>
              ) : activeScore.deltaVsPeer < 0 ? (
                <span className="font-bold text-rose-600 dark:text-rose-400 flex items-center">
                  <TrendingDown className="w-3 h-3 mr-0.5 inline" />{activeScore.deltaVsPeer} pts
                </span>
              ) : (
                <span className="font-bold text-slate-600 dark:text-slate-300">
                  Ngang bằng (0 pts)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: 5 Pillar Sub-index Breakdown */}
        <div className="lg:col-span-7 space-y-3.5">
          <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-100 dark:border-slate-800">
            <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px]">
              Cấu trúc Điểm số 5 Trụ cột Vĩ mô ({activeEntity.name})
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Trọng số chu kỳ chuẩn</span>
          </div>

          <div className="space-y-2.5">
            {/* 1. Growth Engine */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
                  <span>Động lực Tăng trưởng (Growth Engine)</span>
                </span>
                <span className="font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                  {activeScore.pillars.growthEngine}/100{' '}
                  <span className="text-[10px] font-normal text-slate-400">
                    ({activeEntity.gdpGrowthRate >= 0 ? '+' : ''}{activeEntity.gdpGrowthRate}% GDP)
                  </span>
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-700"
                  style={{ width: `${activeScore.pillars.growthEngine}%` }}
                />
              </div>
            </div>

            {/* 2. Fiscal Buffer */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Không gian Tài khóa (Fiscal Buffer)</span>
                </span>
                <span className="font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                  {activeScore.pillars.fiscalBuffer}/100{' '}
                  <span className="text-[10px] font-normal text-slate-400">
                    ({activeEntity.publicDebtToGdp}% Nợ/GDP)
                  </span>
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all duration-700"
                  style={{ width: `${activeScore.pillars.fiscalBuffer}%` }}
                />
              </div>
            </div>

            {/* 3. Inflation Shield */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                  <span>Kiểm soát Lạm phát (Inflation Shield)</span>
                </span>
                <span className="font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                  {activeScore.pillars.inflationShield}/100{' '}
                  <span className="text-[10px] font-normal text-slate-400">
                    ({activeEntity.inflationRate}% CPI)
                  </span>
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-700"
                  style={{ width: `${activeScore.pillars.inflationShield}%` }}
                />
              </div>
            </div>

            {/* 4. Labor Resilience */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Độ bền Thị trường Lao động (Labor Cushion)</span>
                </span>
                <span className="font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                  {activeScore.pillars.laborResilience}/100{' '}
                  <span className="text-[10px] font-normal text-slate-400">
                    ({activeEntity.unemploymentRate}% Thất nghiệp)
                  </span>
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                  style={{ width: `${activeScore.pillars.laborResilience}%` }}
                />
              </div>
            </div>

            {/* 5. External Trade */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5 text-purple-500" />
                  <span>Vị thế Cán cân Thương mại (External Trade)</span>
                </span>
                <span className="font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                  {activeScore.pillars.externalTrade}/100{' '}
                  <span className="text-[10px] font-normal text-slate-400">
                    (${activeEntity.tradeBalance ?? 0}B Cán cân)
                  </span>
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full transition-all duration-700"
                  style={{ width: `${activeScore.pillars.externalTrade}%` }}
                />
              </div>
            </div>
          </div>

          {/* AI Synthesis Note */}
          <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs">
            <div className="flex items-start space-x-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
              <div className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                <strong className="text-slate-900 dark:text-white font-semibold">Nhận định AI: </strong>
                {activeScore.summaryTakeaway}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
