import { useState, useMemo, useRef, useEffect } from 'react';
import {
  BarChart2,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  Filter,
  Layers,
  Globe2,
  MapPin,
  Info,
  Check,
  ChevronDown,
  RotateCcw,
  Sparkles,
  Percent,
  Coins,
  DollarSign,
  Scale,
  Maximize2,
} from 'lucide-react';
import { EconomicEntity } from '../types';
import { ECONOMIC_ENTITIES, getEntityById } from '../data/economicData';
import { useTheme } from '../context/ThemeContext';
import { formatCurrency } from '../utils/formatters';

export type BarChartMetricKey =
  | 'nominalGdp'
  | 'gdpPerCapitaNominal'
  | 'gdpGrowthRate'
  | 'publicDebtToGdp'
  | 'inflationRate'
  | 'unemploymentRate'
  | 'tradeBalance'
  | 'hdi'
  | 'population';

export interface BarChartMetricMeta {
  key: BarChartMetricKey;
  label: string;
  unit: string;
  formatter: (val: number) => string;
  higherIsBetter: boolean;
  description: string;
}

export const BAR_CHART_METRICS: Record<BarChartMetricKey, BarChartMetricMeta> = {
  nominalGdp: {
    key: 'nominalGdp',
    label: 'GDP Danh nghĩa (Nominal GDP)',
    unit: '$ Tỷ USD',
    formatter: (v) => (v >= 1000 ? `$${(v / 1000).toFixed(2)}T` : `$${Math.round(v).toLocaleString()}B`),
    higherIsBetter: true,
    description: 'Tổng sản lượng kinh tế theo giá thị trường hiện hành.',
  },
  gdpPerCapitaNominal: {
    key: 'gdpPerCapitaNominal',
    label: 'GDP Bình quân đầu người',
    unit: '$ USD / người',
    formatter: (v) => `$${Math.round(v).toLocaleString()}`,
    higherIsBetter: true,
    description: 'Sản lượng kinh tế chia đều cho mỗi cư dân.',
  },
  gdpGrowthRate: {
    key: 'gdpGrowthRate',
    label: 'Tốc độ tăng trưởng GDP thực',
    unit: '%',
    formatter: (v) => `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`,
    higherIsBetter: true,
    description: 'Mức tăng trưởng sản lượng hàng năm đã điều chỉnh theo lạm phát.',
  },
  publicDebtToGdp: {
    key: 'publicDebtToGdp',
    label: 'Tỷ lệ Nợ công / GDP',
    unit: '% GDP',
    formatter: (v) => `${v.toFixed(1)}%`,
    higherIsBetter: false,
    description: 'Quy mô tổng nợ chính phủ so với GDP quốc gia.',
  },
  inflationRate: {
    key: 'inflationRate',
    label: 'Tỷ lệ Lạm phát (CPI)',
    unit: '%',
    formatter: (v) => `${v.toFixed(1)}%`,
    higherIsBetter: false,
    description: 'Mức tăng chỉ số giá tiêu dùng hàng năm.',
  },
  unemploymentRate: {
    key: 'unemploymentRate',
    label: 'Tỷ lệ Thất nghiệp',
    unit: '%',
    formatter: (v) => `${v.toFixed(1)}%`,
    higherIsBetter: false,
    description: 'Tỷ lệ người trong độ tuổi lao động chưa có việc làm.',
  },
  tradeBalance: {
    key: 'tradeBalance',
    label: 'Cán cân Thương mại',
    unit: '$ Tỷ USD',
    formatter: (v) => `${v >= 0 ? '+' : ''}$${Math.round(v).toLocaleString()}B`,
    higherIsBetter: true,
    description: 'Chênh lệch giữa giá trị xuất khẩu và nhập khẩu hàng hóa.',
  },
  hdi: {
    key: 'hdi',
    label: 'Chỉ số Phát triển Con người (HDI)',
    unit: 'điểm',
    formatter: (v) => v.toFixed(3),
    higherIsBetter: true,
    description: 'Thước đo tổng hợp về tuổi thọ, giáo dục và thu nhập.',
  },
  population: {
    key: 'population',
    label: 'Dân số',
    unit: 'Triệu người',
    formatter: (v) => `${v.toFixed(1)}M`,
    higherIsBetter: true,
    description: 'Tổng quy mô dân số cư trú.',
  },
};

export type CohortPreset =
  | 'pair'
  | 'top10'
  | 'g7'
  | 'asiapacific'
  | 'europe'
  | 'americas'
  | 'subnational'
  | 'custom';

interface ComparativeBarChartProps {
  entityA: EconomicEntity;
  entityB: EconomicEntity;
  onSelectEntity?: (entity: EconomicEntity) => void;
  className?: string;
}

export function ComparativeBarChart({
  entityA,
  entityB,
  onSelectEntity,
  className = '',
}: ComparativeBarChartProps) {
  const { isDarkMode } = useTheme();

  // Metric selector
  const [metricKey, setMetricKey] = useState<BarChartMetricKey>('nominalGdp');

  // Cohort preset filter
  const [cohort, setCohort] = useState<CohortPreset>('top10');

  // Custom entity selection if cohort === 'custom'
  const [selectedEntityIds, setSelectedEntityIds] = useState<string[]>([
    entityA.id,
    entityB.id,
    'us',
    'cn',
    'de',
    'jp',
    'in',
  ]);

  // Chart layout orientation
  const [orientation, setOrientation] = useState<'horizontal' | 'vertical'>('horizontal');

  // Sort direction
  const [sortBy, setSortBy] = useState<'desc' | 'asc' | 'default'>('desc');

  // Hover inspection state
  const [hoveredEntity, setHoveredEntity] = useState<EconomicEntity | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const metricMeta = BAR_CHART_METRICS[metricKey];

  // Resolve entity list based on active cohort
  const cohortEntities = useMemo(() => {
    switch (cohort) {
      case 'pair':
        return [entityA, entityB];
      case 'top10': {
        // Top 10 global economies plus current entities if not included
        const top10Ids = ['us', 'cn', 'de', 'jp', 'in', 'gb', 'fr', 'it', 'br', 'ca'];
        const uniqueIds = Array.from(new Set([entityA.id, entityB.id, ...top10Ids]));
        return uniqueIds.map((id) => getEntityById(id)).filter(Boolean) as EconomicEntity[];
      }
      case 'g7': {
        const g7Ids = ['us', 'jp', 'de', 'gb', 'fr', 'it', 'ca'];
        const uniqueIds = Array.from(new Set([entityA.id, entityB.id, ...g7Ids]));
        return uniqueIds.map((id) => getEntityById(id)).filter(Boolean) as EconomicEntity[];
      }
      case 'asiapacific': {
        const apIds = ['cn', 'jp', 'in', 'au', 'kr', 'vn', 'sg', 'id'];
        const uniqueIds = Array.from(new Set([entityA.id, entityB.id, ...apIds]));
        return uniqueIds.map((id) => getEntityById(id)).filter(Boolean) as EconomicEntity[];
      }
      case 'europe': {
        const euIds = ['de', 'gb', 'fr', 'it', 'es', 'nl', 'ch', 'pl'];
        const uniqueIds = Array.from(new Set([entityA.id, entityB.id, ...euIds]));
        return uniqueIds.map((id) => getEntityById(id)).filter(Boolean) as EconomicEntity[];
      }
      case 'americas': {
        const amIds = ['us', 'us-ca', 'us-tx', 'us-ny', 'us-fl', 'br', 'ca', 'mx'];
        const uniqueIds = Array.from(new Set([entityA.id, entityB.id, ...amIds]));
        return uniqueIds.map((id) => getEntityById(id)).filter(Boolean) as EconomicEntity[];
      }
      case 'subnational': {
        return ECONOMIC_ENTITIES.filter((e) => e.type === 'region');
      }
      case 'custom': {
        return selectedEntityIds.map((id) => getEntityById(id)).filter(Boolean) as EconomicEntity[];
      }
      default:
        return [entityA, entityB];
    }
  }, [cohort, entityA, entityB, selectedEntityIds]);

  // Extract numeric metric value for any entity
  const getEntityValue = (e: EconomicEntity, key: BarChartMetricKey): number => {
    switch (key) {
      case 'nominalGdp':
        return e.nominalGdp;
      case 'gdpPerCapitaNominal':
        return e.gdpPerCapitaNominal;
      case 'gdpGrowthRate':
        return e.gdpGrowthRate;
      case 'publicDebtToGdp':
        return e.publicDebtToGdp;
      case 'inflationRate':
        return e.inflationRate;
      case 'unemploymentRate':
        return e.unemploymentRate;
      case 'tradeBalance':
        return e.tradeBalance ?? 0;
      case 'hdi':
        return e.hdi;
      case 'population':
        return e.population;
      default:
        return 0;
    }
  };

  // Sort entities
  const displayEntities = useMemo(() => {
    const list = [...cohortEntities];
    if (sortBy === 'desc') {
      return list.sort((a, b) => getEntityValue(b, metricKey) - getEntityValue(a, metricKey));
    }
    if (sortBy === 'asc') {
      return list.sort((a, b) => getEntityValue(a, metricKey) - getEntityValue(b, metricKey));
    }
    return list;
  }, [cohortEntities, sortBy, metricKey]);

  // Cohort statistics (max, min, average, median)
  const stats = useMemo(() => {
    if (displayEntities.length === 0) return { max: 100, min: 0, avg: 0, median: 0 };
    const values = displayEntities.map((e) => getEntityValue(e, metricKey));
    const max = Math.max(...values);
    const min = Math.min(...values);
    const sum = values.reduce((acc, v) => acc + v, 0);
    const avg = sum / values.length;

    const sortedVals = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sortedVals.length / 2);
    const median = sortedVals.length % 2 !== 0 ? sortedVals[mid] : (sortedVals[mid - 1] + sortedVals[mid]) / 2;

    return { max, min, avg, median };
  }, [displayEntities, metricKey]);

  // Reference line value
  const benchmarkVal = stats.avg;

  const handleMouseMove = (e: React.MouseEvent, entity: EconomicEntity) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setTooltipPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setHoveredEntity(entity);
  };

  const handleMouseLeave = () => {
    setHoveredEntity(null);
    setTooltipPos(null);
  };

  return (
    <div
      ref={containerRef}
      id="comparative-bar-chart-card"
      className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs relative transition-colors ${className}`}
    >
      {/* Chart Header & Control Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <BarChart2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Biểu đồ Cột So sánh Quốc gia & Khu vực
            </h3>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              {displayEntities.length} thực thể
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            So sánh trực quan chỉ số {metricMeta.label.toLowerCase()} giữa {entityA.shortName}, {entityB.shortName} và các nền kinh tế đối chuẩn.
          </p>
        </div>

        {/* Controls: Metric, Cohort, Sort, Layout */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Indicator Dropdown */}
          <div className="flex items-center space-x-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs shadow-2xs">
            <span className="text-slate-400 text-2xs font-semibold">Chỉ số:</span>
            <select
              id="bar-chart-metric-select"
              value={metricKey}
              onChange={(e) => setMetricKey(e.target.value as BarChartMetricKey)}
              className="bg-transparent font-bold text-slate-800 dark:text-slate-200 focus:outline-hidden cursor-pointer"
            >
              {Object.values(BAR_CHART_METRICS).map((m) => (
                <option key={m.key} value={m.key} className="dark:bg-slate-800">
                  {m.label} ({m.unit})
                </option>
              ))}
            </select>
          </div>

          {/* Cohort Preset Tabs */}
          <div
            role="group"
            aria-label="Nhóm so sánh"
            className="inline-flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs"
          >
            <button
              onClick={() => setCohort('pair')}
              className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                cohort === 'pair'
                  ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title="Chỉ so sánh 2 thực thể đang chọn"
            >
              Cặp chọn ({entityA.shortName} vs {entityB.shortName})
            </button>
            <button
              onClick={() => setCohort('top10')}
              className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                cohort === 'top10'
                  ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title="Top 10 nền kinh tế toàn cầu"
            >
              Top 10 Thế giới
            </button>
            <button
              onClick={() => setCohort('asiapacific')}
              className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer hidden sm:inline-block ${
                cohort === 'asiapacific'
                  ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title="Châu Á - Thái Bình Dương"
            >
              Châu Á - TBD
            </button>
            <button
              onClick={() => setCohort('subnational')}
              className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer hidden md:inline-block ${
                cohort === 'subnational'
                  ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title="Các bang & khu vực địa phương (California, Texas, Tokyo, Bavaria...)"
            >
              Bang & Khu vực
            </button>
          </div>

          {/* Sort button */}
          <button
            onClick={() => setSortBy(sortBy === 'desc' ? 'asc' : sortBy === 'asc' ? 'default' : 'desc')}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/80 shadow-2xs transition-colors cursor-pointer"
            title={`Sắp xếp: ${sortBy === 'desc' ? 'Cao xuống thấp' : sortBy === 'asc' ? 'Thấp lên cao' : 'Thứ tự mặc định'}`}
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
          </button>

          {/* Orientation toggle */}
          <button
            onClick={() => setOrientation(orientation === 'horizontal' ? 'vertical' : 'horizontal')}
            className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/80 shadow-2xs transition-colors cursor-pointer"
            title="Đổi định dạng cột đứng / thanh ngang"
          >
            {orientation === 'horizontal' ? 'Cột dọc' : 'Thanh ngang'}
          </button>
        </div>
      </div>

      {/* Cohort Benchmark Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 border-b border-slate-100 dark:border-slate-800 text-xs">
        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
          <span className="text-3xs uppercase tracking-wider text-slate-400 font-bold block mb-0.5">
            Trung bình nhóm
          </span>
          <p className="text-sm font-mono font-bold text-slate-800 dark:text-slate-200">
            {metricMeta.formatter(stats.avg)}
          </p>
        </div>
        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
          <span className="text-3xs uppercase tracking-wider text-slate-400 font-bold block mb-0.5">
            Trung vị nhóm
          </span>
          <p className="text-sm font-mono font-bold text-slate-800 dark:text-slate-200">
            {metricMeta.formatter(stats.median)}
          </p>
        </div>
        <div className="p-2.5 rounded-lg bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-900/60">
          <span className="text-3xs uppercase tracking-wider text-indigo-700 dark:text-indigo-400 font-bold block mb-0.5">
            {entityA.shortName}
          </span>
          <p className="text-sm font-mono font-bold text-indigo-600 dark:text-indigo-400">
            {metricMeta.formatter(getEntityValue(entityA, metricKey))}
          </p>
        </div>
        <div className="p-2.5 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900/60">
          <span className="text-3xs uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-bold block mb-0.5">
            {entityB.shortName}
          </span>
          <p className="text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400">
            {metricMeta.formatter(getEntityValue(entityB, metricKey))}
          </p>
        </div>
      </div>

      {/* Main Interactive Bar Visualization */}
      <div className="pt-4 pb-2">
        {orientation === 'horizontal' ? (
          /* ========================================================== */
          /* HORIZONTAL BAR CHART LAYOUT (Superior for ranking labels) */
          /* ========================================================== */
          <div className="space-y-2.5">
            {displayEntities.map((entity, idx) => {
              const val = getEntityValue(entity, metricKey);
              const isEntityA = entity.id === entityA.id;
              const isEntityB = entity.id === entityB.id;
              const isHovered = hoveredEntity?.id === entity.id;

              // Scale calculation: support negative metrics (e.g. trade balance, growth)
              const maxAbs = Math.max(Math.abs(stats.max), Math.abs(stats.min), 1);
              const percentage = Math.max(3, (Math.abs(val) / maxAbs) * 100);

              // Color determination
              let barColor = isEntityA
                ? 'bg-indigo-600 dark:bg-indigo-500'
                : isEntityB
                ? 'bg-emerald-600 dark:bg-emerald-500'
                : val >= 0
                ? 'bg-slate-300 dark:bg-slate-700 group-hover:bg-slate-400'
                : 'bg-rose-400 dark:bg-rose-600';

              if (isHovered) {
                barColor = isEntityA
                  ? 'bg-indigo-500 shadow-md ring-2 ring-indigo-300 dark:ring-indigo-700'
                  : isEntityB
                  ? 'bg-emerald-500 shadow-md ring-2 ring-emerald-300 dark:ring-emerald-700'
                  : 'bg-indigo-400 dark:bg-indigo-600 shadow-md';
              }

              return (
                <div
                  key={entity.id}
                  onMouseMove={(e) => handleMouseMove(e, entity)}
                  onMouseLeave={handleMouseLeave}
                  onClick={() => onSelectEntity?.(entity)}
                  className={`group relative flex items-center gap-3 p-1.5 rounded-xl transition-all cursor-pointer ${
                    isHovered
                      ? 'bg-slate-100/90 dark:bg-slate-800/80'
                      : isEntityA
                      ? 'bg-indigo-50/40 dark:bg-indigo-950/20'
                      : isEntityB
                      ? 'bg-emerald-50/40 dark:bg-emerald-950/20'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  {/* Entity Label & Flag */}
                  <div className="w-36 sm:w-44 shrink-0 flex items-center justify-between text-xs pr-2">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="text-sm shrink-0">{entity.flag}</span>
                      <span
                        className={`truncate font-medium ${
                          isEntityA
                            ? 'font-bold text-indigo-700 dark:text-indigo-300'
                            : isEntityB
                            ? 'font-bold text-emerald-700 dark:text-emerald-300'
                            : 'text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        {entity.name}
                      </span>
                    </div>

                    {/* Subnational / Rank tag */}
                    <span className="text-[10px] font-mono text-slate-400 shrink-0">
                      {entity.type === 'region' ? 'Bang' : `#${entity.globalGdpRank}`}
                    </span>
                  </div>

                  {/* Horizontal Bar Track */}
                  <div className="flex-1 h-6 bg-slate-100 dark:bg-slate-800/60 rounded-lg overflow-hidden relative flex items-center">
                    {/* Benchmark vertical reference tick */}
                    {stats.max > 0 && stats.min >= 0 && (
                      <div
                        style={{ left: `${(benchmarkVal / stats.max) * 100}%` }}
                        className="absolute top-0 bottom-0 w-0.5 bg-slate-400/60 dark:bg-slate-500/60 z-10"
                        title={`Trung bình: ${metricMeta.formatter(benchmarkVal)}`}
                      />
                    )}

                    {/* Dynamic Bar Element */}
                    <div
                      style={{ width: `${percentage}%` }}
                      className={`h-full rounded-r-lg transition-all duration-300 ease-out flex items-center justify-end px-2 ${barColor}`}
                    >
                      {percentage > 18 && (
                        <span className="text-[11px] font-mono font-bold text-white tabular-nums drop-shadow-xs">
                          {metricMeta.formatter(val)}
                        </span>
                      )}
                    </div>

                    {/* Value displayed outside if bar is too short */}
                    {percentage <= 18 && (
                      <span className="ml-2 text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300 tabular-nums">
                        {metricMeta.formatter(val)}
                      </span>
                    )}
                  </div>

                  {/* Spread relative to Entity A */}
                  <div className="w-20 shrink-0 text-right font-mono text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
                    {val === getEntityValue(entityA, metricKey) ? (
                      <span className="text-indigo-600 dark:text-indigo-400 font-bold">Gốc (A)</span>
                    ) : (
                      <span>
                        {val > getEntityValue(entityA, metricKey) ? '+' : ''}
                        {metricMeta.formatter(val - getEntityValue(entityA, metricKey))}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ========================================================== */
          /* VERTICAL COLUMN CHART LAYOUT                               */
          /* ========================================================== */
          <div className="h-72 w-full pt-6 flex items-end justify-between gap-2 overflow-x-auto pb-4">
            {displayEntities.map((entity, idx) => {
              const val = getEntityValue(entity, metricKey);
              const isEntityA = entity.id === entityA.id;
              const isEntityB = entity.id === entityB.id;
              const isHovered = hoveredEntity?.id === entity.id;

              const maxAbs = Math.max(Math.abs(stats.max), 1);
              const heightPct = Math.max(5, (Math.abs(val) / maxAbs) * 100);

              let colColor = isEntityA
                ? 'bg-indigo-600 dark:bg-indigo-500'
                : isEntityB
                ? 'bg-emerald-600 dark:bg-emerald-500'
                : 'bg-slate-300 dark:bg-slate-700';

              if (isHovered) {
                colColor = isEntityA
                  ? 'bg-indigo-500 ring-2 ring-indigo-300'
                  : isEntityB
                  ? 'bg-emerald-500 ring-2 ring-emerald-300'
                  : 'bg-indigo-400 ring-2 ring-indigo-200';
              }

              return (
                <div
                  key={entity.id}
                  onMouseMove={(e) => handleMouseMove(e, entity)}
                  onMouseLeave={handleMouseLeave}
                  className="flex-1 min-w-[36px] max-w-[64px] h-full flex flex-col items-center justify-end group cursor-pointer"
                >
                  <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400 mb-1 truncate">
                    {metricMeta.formatter(val)}
                  </span>
                  <div
                    style={{ height: `${heightPct}%` }}
                    className={`w-full rounded-t-lg transition-all duration-300 ${colColor}`}
                  />
                  <div className="mt-2 text-center">
                    <span className="text-sm block">{entity.flag}</span>
                    <span
                      className={`text-[10px] font-semibold truncate block max-w-[48px] ${
                        isEntityA ? 'text-indigo-600' : isEntityB ? 'text-emerald-600' : 'text-slate-600'
                      }`}
                    >
                      {entity.shortName}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Hover Data Point Inspection Tooltip */}
      {hoveredEntity && tooltipPos && (
        <div
          style={{
            left: `${Math.min(tooltipPos.x + 16, (containerRef.current?.clientWidth || 600) - 240)}px`,
            top: `${Math.max(16, tooltipPos.y - 80)}px`,
          }}
          className="pointer-events-none absolute z-30 w-56 p-3 bg-slate-900/95 dark:bg-slate-950/95 text-white backdrop-blur-md rounded-xl border border-slate-700 shadow-xl text-xs animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
            <div className="flex items-center gap-1.5 font-bold truncate">
              <span className="text-base">{hoveredEntity.flag}</span>
              <span className="truncate">{hoveredEntity.name}</span>
            </div>
            <span className="text-[10px] font-mono text-indigo-300 bg-indigo-950/60 px-1.5 py-0.2 rounded border border-indigo-800">
              {hoveredEntity.type === 'region' ? 'Khu vực' : 'Quốc gia'}
            </span>
          </div>

          <div className="space-y-1 font-mono text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">{metricMeta.label}:</span>
              <span className="font-bold text-emerald-400">
                {metricMeta.formatter(getEntityValue(hoveredEntity, metricKey))}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Thứ hạng toàn cầu:</span>
              <span className="text-slate-200">#{hoveredEntity.globalGdpRank}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">So với {entityA.shortName}:</span>
              <span
                className={
                  getEntityValue(hoveredEntity, metricKey) >= getEntityValue(entityA, metricKey)
                    ? 'text-emerald-400'
                    : 'text-rose-400'
                }
              >
                {getEntityValue(hoveredEntity, metricKey) >= getEntityValue(entityA, metricKey) ? '+' : ''}
                {metricMeta.formatter(
                  getEntityValue(hoveredEntity, metricKey) - getEntityValue(entityA, metricKey)
                )}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Thủ đô / Trung tâm:</span>
              <span className="text-slate-300 truncate max-w-[100px]">
                {hoveredEntity.capitalOrMajorCity}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Chart Footer Notes */}
      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between text-2xs text-slate-400 gap-2">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block"></span>
            <span>{entityA.name}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block"></span>
            <span>{entityB.name}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-slate-400 inline-block"></span>
            <span>Vạch trung bình nhóm đối chuẩn</span>
          </span>
        </div>
        <span>Di chuột qua các cột để xem chi tiết điểm dữ liệu</span>
      </div>
    </div>
  );
}
