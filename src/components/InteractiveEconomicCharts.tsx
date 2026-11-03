import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Columns,
  Sparkles,
  ArrowRightLeft,
  Info,
  Maximize2,
  Layers,
  Globe2,
} from 'lucide-react';
import { EconomicEntity } from '../types';
import { ComparativeBarChart } from './ComparativeBarChart';
import { InteractiveTrendLineChart } from './InteractiveTrendLineChart';
import { useTheme } from '../context/ThemeContext';
import { formatCurrency } from '../utils/formatters';

export type ChartViewMode = 'both' | 'bar' | 'line';

interface InteractiveEconomicChartsProps {
  entityA: EconomicEntity;
  entityB: EconomicEntity;
  onSelectEntity?: (entity: EconomicEntity) => void;
  className?: string;
}

export function InteractiveEconomicCharts({
  entityA,
  entityB,
  className = '',
}: InteractiveEconomicChartsProps) {
  const { isDarkMode } = useTheme();
  const [viewMode, setViewMode] = useState<ChartViewMode>('both');

  const gdpDiff = Math.abs(entityA.nominalGdp - entityB.nominalGdp);
  const gdpLeader = entityA.nominalGdp >= entityB.nominalGdp ? entityA : entityB;
  const gdpTrailer = entityA.nominalGdp >= entityB.nominalGdp ? entityB : entityA;
  const ratio = (gdpLeader.nominalGdp / Math.max(1, gdpTrailer.nominalGdp)).toFixed(2);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header & Mode Switcher Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs transition-colors">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800">
                <BarChart3 className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                <span>Trực quan hóa Dữ liệu Kinh tế</span>
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
                Tương tác đa chiều & Xem trước điểm dữ liệu
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1 tracking-tight flex items-center space-x-2">
              <span>Biểu đồ So sánh GDP & Chỉ số Vĩ mô</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
              Khám phá xu hướng dài hạn qua biểu đồ đường và phân tích khoảng cách cạnh tranh qua biểu đồ cột giữa{' '}
              <strong className="text-indigo-600 dark:text-indigo-400 font-semibold">{entityA.name}</strong> và{' '}
              <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">{entityB.name}</strong>.
            </p>
          </div>

          {/* Segmented View Mode Toggle */}
          <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700/80 shrink-0 self-start lg:self-center">
            <button
              onClick={() => setViewMode('both')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
                viewMode === 'both'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title="Hiển thị cả Biểu đồ Đường và Cột song song"
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Song song (Dual)</span>
            </button>

            <button
              onClick={() => setViewMode('bar')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
                viewMode === 'bar'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title="Chỉ hiển thị Biểu đồ Cột So sánh"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Biểu đồ Cột</span>
            </button>

            <button
              onClick={() => setViewMode('line')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
                viewMode === 'line'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title="Chỉ hiển thị Biểu đồ Đường Xu hướng"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Biểu đồ Đường</span>
            </button>
          </div>
        </div>

        {/* Quick Summary Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center space-x-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
            <span className="text-2xl">{entityA.flag}</span>
            <div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{entityA.name}</div>
              <div className="text-sm font-black font-mono tabular-nums text-slate-900 dark:text-white">
                ${entityA.nominalGdp >= 1000 ? `${(entityA.nominalGdp / 1000).toFixed(2)}T` : `${entityA.nominalGdp}B`}
                <span className="text-[10px] text-slate-500 font-normal ml-1">USD</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
            <span className="text-2xl">{entityB.flag}</span>
            <div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{entityB.name}</div>
              <div className="text-sm font-black font-mono tabular-nums text-slate-900 dark:text-white">
                ${entityB.nominalGdp >= 1000 ? `${(entityB.nominalGdp / 1000).toFixed(2)}T` : `${entityB.nominalGdp}B`}
                <span className="text-[10px] text-slate-500 font-normal ml-1">USD</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800/60">
            <div>
              <div className="text-[11px] text-indigo-700 dark:text-indigo-300 font-semibold flex items-center space-x-1">
                <Sparkles className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                <span>Chênh lệch Quy mô GDP</span>
              </div>
              <div className="text-sm font-black font-mono tabular-nums text-indigo-950 dark:text-indigo-200">
                +${gdpDiff >= 1000 ? `${(gdpDiff / 1000).toFixed(2)}T` : `${Math.round(gdpDiff)}B`}
                <span className="text-[10px] font-medium text-indigo-700 dark:text-indigo-300 ml-1">
                  ({ratio}x quy mô)
                </span>
              </div>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200">
              {gdpLeader.shortName} dẫn trước
            </span>
          </div>
        </div>
      </div>

      {/* Main Interactive Visualizations */}
      {viewMode === 'both' ? (
        <div className="space-y-6">
          {/* Top: Multi-Year Trajectory Line Chart */}
          <div className="w-full">
            <InteractiveTrendLineChart entityA={entityA} entityB={entityB} />
          </div>

          {/* Bottom: Comparative Bar Chart */}
          <div className="w-full">
            <ComparativeBarChart entityA={entityA} entityB={entityB} />
          </div>
        </div>
      ) : viewMode === 'bar' ? (
        <ComparativeBarChart entityA={entityA} entityB={entityB} />
      ) : (
        <InteractiveTrendLineChart entityA={entityA} entityB={entityB} />
      )}
    </div>
  );
}
