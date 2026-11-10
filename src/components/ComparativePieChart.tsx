import React, { useState, useEffect, useMemo, useRef } from 'react';
import * as d3 from 'd3';
import {
  PieChart as PieChartIcon,
  CircleDot,
  Download,
  Info,
  Layers,
  Globe2,
  ArrowRightLeft,
  Scale,
  Sparkles,
  TrendingUp,
  Check,
  Percent,
} from 'lucide-react';
import { EconomicEntity } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { exportComparativePieChartAsPng, PieSliceData } from '../utils/exportPieChartPng';

export type PieMetricCategory = 'sector' | 'bilateral_gdp' | 'trade' | 'fiscal_debt';

interface ComparativePieChartProps {
  entityA: EconomicEntity;
  entityB: EconomicEntity;
  className?: string;
  activeCategory?: PieMetricCategory;
  onCategoryChange?: (category: PieMetricCategory) => void;
}

interface SliceItem {
  id: string;
  label: string;
  valueA: number;
  pctA: number;
  valueB: number;
  pctB: number;
  color: string;
  description: string;
  formattedA: string;
  formattedB: string;
}

export function ComparativePieChart({
  entityA,
  entityB,
  className = '',
  activeCategory,
  onCategoryChange,
}: ComparativePieChartProps) {
  const { isDarkMode } = useTheme();
  const { t } = useLanguage();
  const [selectedMetric, setSelectedMetric] = useState<PieMetricCategory>(activeCategory || 'sector');

  useEffect(() => {
    if (activeCategory) {
      setSelectedMetric(activeCategory);
    }
  }, [activeCategory]);

  const handleSelectMetric = (cat: PieMetricCategory) => {
    setSelectedMetric(cat);
    if (onCategoryChange) {
      onCategoryChange(cat);
    }
  };

  const [isDonut, setIsDonut] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [hoveredSlice, setHoveredSlice] = useState<{
    slice: SliceItem;
    target: 'A' | 'B';
  } | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Compute slice data based on selected metric
  const { metricMeta, slices, centerA, centerB } = useMemo(() => {
    switch (selectedMetric) {
      case 'sector': {
        const servA = entityA.sectorShare.services;
        const indA = entityA.sectorShare.industry;
        const agrA = entityA.sectorShare.agriculture;

        const servB = entityB.sectorShare.services;
        const indB = entityB.sectorShare.industry;
        const agrB = entityB.sectorShare.agriculture;

        const valServA = (entityA.nominalGdp * servA) / 100;
        const valIndA = (entityA.nominalGdp * indA) / 100;
        const valAgrA = (entityA.nominalGdp * agrA) / 100;

        const valServB = (entityB.nominalGdp * servB) / 100;
        const valIndB = (entityB.nominalGdp * indB) / 100;
        const valAgrB = (entityB.nominalGdp * agrB) / 100;

        const formatBillion = (v: number) =>
          v >= 1000 ? `$${(v / 1000).toFixed(2)}T USD` : `$${Math.round(v).toLocaleString()}B USD`;

        const sliceList: SliceItem[] = [
          {
            id: 'services',
            label: 'Dịch vụ (Tertiary Sector)',
            valueA: valServA,
            pctA: servA,
            valueB: valServB,
            pctB: servB,
            color: '#3b82f6', // Blue
            description: 'Tài chính, ngân hàng, công nghệ phần mềm, y tế, giáo dục & bán lẻ',
            formattedA: formatBillion(valServA),
            formattedB: formatBillion(valServB),
          },
          {
            id: 'industry',
            label: 'Công nghiệp & Chế tạo (Secondary Sector)',
            valueA: valIndA,
            pctA: indA,
            valueB: valIndB,
            pctB: indB,
            color: '#f59e0b', // Amber
            description: 'Chế tạo máy móc, điện tử, bán dẫn, ô tô, xây dựng & năng lượng',
            formattedA: formatBillion(valIndA),
            formattedB: formatBillion(valIndB),
          },
          {
            id: 'agriculture',
            label: 'Nông, Lâm & Thủy sản (Primary Sector)',
            valueA: valAgrA,
            pctA: agrA,
            valueB: valAgrB,
            pctB: agrB,
            color: '#10b981', // Emerald
            description: 'Trồng trọt, chăn nuôi, lâm nghiệp, thủy hải sản & khai thác tài nguyên',
            formattedA: formatBillion(valAgrA),
            formattedB: formatBillion(valAgrB),
          },
        ];

        return {
          metricMeta: {
            title: t('pieTitleSector'),
            subtitle: t('pieSubtitleSector'),
          },
          slices: sliceList,
          centerA: {
            value: `${servA.toFixed(1)}%`,
            label: 'Dịch vụ chiếm ưu thế',
          },
          centerB: {
            value: `${servB.toFixed(1)}%`,
            label: 'Dịch vụ chiếm ưu thế',
          },
        };
      }

      case 'bilateral_gdp': {
        const gdpA = entityA.nominalGdp;
        const gdpB = entityB.nominalGdp;
        const worldGdp = 105000; // ~105 Trillion USD Global Nominal GDP
        const restWorldGdp = Math.max(0, worldGdp - (gdpA + gdpB));

        const pctA = (gdpA / worldGdp) * 100;
        const pctB = (gdpB / worldGdp) * 100;
        const pctRest = (restWorldGdp / worldGdp) * 100;

        const formatBillion = (v: number) =>
          v >= 1000 ? `$${(v / 1000).toFixed(2)}T USD` : `$${Math.round(v).toLocaleString()}B USD`;

        const sliceList: SliceItem[] = [
          {
            id: 'entityA',
            label: `${entityA.name} (${entityA.shortName})`,
            valueA: gdpA,
            pctA: (gdpA / (gdpA + gdpB)) * 100,
            valueB: gdpA,
            pctB: pctA,
            color: '#6366f1', // Indigo
            description: `Chiếm ${pctA.toFixed(2)}% tổng sản lượng kinh tế thế giới`,
            formattedA: formatBillion(gdpA),
            formattedB: formatBillion(gdpA),
          },
          {
            id: 'entityB',
            label: `${entityB.name} (${entityB.shortName})`,
            valueA: gdpB,
            pctA: (gdpB / (gdpA + gdpB)) * 100,
            valueB: gdpB,
            pctB: pctB,
            color: '#10b981', // Emerald
            description: `Chiếm ${pctB.toFixed(2)}% tổng sản lượng kinh tế thế giới`,
            formattedA: formatBillion(gdpB),
            formattedB: formatBillion(gdpB),
          },
          {
            id: 'rest_world',
            label: 'Các nền kinh tế khác (Rest of World)',
            valueA: restWorldGdp,
            pctA: 0,
            valueB: restWorldGdp,
            pctB: pctRest,
            color: isDarkMode ? '#475569' : '#94a3b8',
            description: 'Tổng sản lượng của hơn 190 quốc gia và vùng lãnh thổ còn lại',
            formattedA: formatBillion(restWorldGdp),
            formattedB: formatBillion(restWorldGdp),
          },
        ];

        return {
          metricMeta: {
            title: t('pieTitleBilateral'),
            subtitle: t('pieSubtitleBilateral'),
          },
          slices: sliceList,
          centerA: {
            value: `$${(gdpA >= 1000 ? (gdpA / 1000).toFixed(1) + 'T' : gdpA + 'B')}`,
            label: 'GDP Danh nghĩa',
          },
          centerB: {
            value: `$${(gdpB >= 1000 ? (gdpB / 1000).toFixed(1) + 'T' : gdpB + 'B')}`,
            label: 'GDP Danh nghĩa',
          },
        };
      }

      case 'trade': {
        const expA = entityA.exports ?? Math.round(entityA.nominalGdp * 0.22);
        const impA = entityA.imports ?? Math.round(entityA.nominalGdp * 0.25);
        const totA = Math.max(1, expA + impA);

        const expB = entityB.exports ?? Math.round(entityB.nominalGdp * 0.24);
        const impB = entityB.imports ?? Math.round(entityB.nominalGdp * 0.21);
        const totB = Math.max(1, expB + impB);

        const pctExpA = (expA / totA) * 100;
        const pctImpA = (impA / totA) * 100;

        const pctExpB = (expB / totB) * 100;
        const pctImpB = (impB / totB) * 100;

        const formatBillion = (v: number) =>
          v >= 1000 ? `$${(v / 1000).toFixed(2)}T USD` : `$${Math.round(v).toLocaleString()}B USD`;

        const sliceList: SliceItem[] = [
          {
            id: 'exports',
            label: 'Kim ngạch Xuất khẩu (Exports)',
            valueA: expA,
            pctA: pctExpA,
            valueB: expB,
            pctB: pctExpB,
            color: '#06b6d4', // Cyan
            description: 'Tổng giá trị hàng hóa và dịch vụ bán ra thị trường quốc tế',
            formattedA: formatBillion(expA),
            formattedB: formatBillion(expB),
          },
          {
            id: 'imports',
            label: 'Kim ngạch Nhập khẩu (Imports)',
            valueA: impA,
            pctA: pctImpA,
            valueB: impB,
            pctB: pctImpB,
            color: '#ec4899', // Pink
            description: 'Tổng giá trị hàng hóa và dịch vụ mua từ nước ngoài',
            formattedA: formatBillion(impA),
            formattedB: formatBillion(impB),
          },
        ];

        return {
          metricMeta: {
            title: t('pieTitleTrade'),
            subtitle: t('pieSubtitleTrade'),
          },
          slices: sliceList,
          centerA: {
            value: formatBillion(totA),
            label: 'Total Turnover',
          },
          centerB: {
            value: formatBillion(totB),
            label: 'Total Turnover',
          },
        };
      }

      case 'fiscal_debt': {
        const debtA = Math.min(100, entityA.publicDebtToGdp);
        const capacityA = Math.max(0, 100 - debtA);

        const debtB = Math.min(100, entityB.publicDebtToGdp);
        const capacityB = Math.max(0, 100 - debtB);

        const valDebtA = (entityA.nominalGdp * entityA.publicDebtToGdp) / 100;
        const valCapA = (entityA.nominalGdp * capacityA) / 100;

        const valDebtB = (entityB.nominalGdp * entityB.publicDebtToGdp) / 100;
        const valCapB = (entityB.nominalGdp * capacityB) / 100;

        const formatBillion = (v: number) =>
          v >= 1000 ? `$${(v / 1000).toFixed(2)}T USD` : `$${Math.round(v).toLocaleString()}B USD`;

        const sliceList: SliceItem[] = [
          {
            id: 'debt',
            label: 'Public Debt / GDP',
            valueA: valDebtA,
            pctA: debtA,
            valueB: valDebtB,
            pctB: debtB,
            color: '#ef4444', // Red
            description: 'Government debt burden relative to annual gross domestic product',
            formattedA: `${entityA.publicDebtToGdp.toFixed(1)}% (${formatBillion(valDebtA)})`,
            formattedB: `${entityB.publicDebtToGdp.toFixed(1)}% (${formatBillion(valDebtB)})`,
          },
          {
            id: 'equity',
            label: 'Net Fiscal Headroom',
            valueA: valCapA,
            pctA: capacityA,
            valueB: valCapB,
            pctB: capacityB,
            color: '#10b981', // Emerald
            description: 'Available borrowing safety headroom before reaching 100% debt-to-GDP threshold',
            formattedA: `${capacityA.toFixed(1)}% GDP`,
            formattedB: `${capacityB.toFixed(1)}% GDP`,
          },
        ];

        return {
          metricMeta: {
            title: t('pieTitleFiscal'),
            subtitle: t('pieSubtitleFiscal'),
          },
          slices: sliceList,
          centerA: {
            value: `${entityA.publicDebtToGdp.toFixed(1)}%`,
            label: 'Debt / GDP',
          },
          centerB: {
            value: `${entityB.publicDebtToGdp.toFixed(1)}%`,
            label: 'Debt / GDP',
          },
        };
      }
    }
  }, [selectedMetric, entityA, entityB, isDarkMode, t]);

  // Handle PNG Export
  const handleExportPng = async () => {
    try {
      setIsExporting(true);
      const exportSlices: PieSliceData[] = slices.map((s) => ({
        id: s.id,
        label: s.label,
        valueA: s.valueA,
        pctA: s.pctA,
        valueB: s.valueB,
        pctB: s.pctB,
        color: s.color,
        formattedA: s.formattedA,
        formattedB: s.formattedB,
      }));

      await exportComparativePieChartAsPng({
        entityA,
        entityB,
        metricTitle: metricMeta.title,
        metricSubtitle: metricMeta.subtitle,
        slices: exportSlices,
        isDonut,
        centerLabelA: centerA,
        centerLabelB: centerB,
        isDarkMode,
      });
    } catch (err) {
      console.error('Failed to export pie chart PNG', err);
    } finally {
      setIsExporting(false);
    }
  };

  // SVG Chart Geometry Constants
  const svgSize = 280;
  const radius = svgSize / 2;
  const innerRadius = isDonut ? radius * 0.58 : 0;

  // D3 Pie Generator
  const createPieArcs = (pctKey: 'pctA' | 'pctB') => {
    const pieGen = d3
      .pie<SliceItem>()
      .value((d) => Math.max(0, d[pctKey]))
      .sort(null);

    return pieGen(slices);
  };

  const arcsA = useMemo(() => createPieArcs('pctA'), [slices]);
  const arcsB = useMemo(() => createPieArcs('pctB'), [slices]);

  // Helper to build SVG arc path
  const arcGen = d3.arc<d3.PieArcDatum<SliceItem>>().innerRadius(innerRadius).outerRadius(radius - 12);
  const hoveredArcGen = d3.arc<d3.PieArcDatum<SliceItem>>().innerRadius(innerRadius).outerRadius(radius - 4);
  const labelArcGen = d3
    .arc<d3.PieArcDatum<SliceItem>>()
    .innerRadius(isDonut ? (innerRadius + radius) / 2 : radius * 0.6)
    .outerRadius(isDonut ? (innerRadius + radius) / 2 : radius * 0.6);

  return (
    <div
      ref={containerRef}
      className={`relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs transition-colors ${className}`}
    >
      {/* Top Header & Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800">
              <PieChartIcon className="w-3 h-3 text-rose-600 dark:text-rose-400" />
              <span>{t('pieBadge')}</span>
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
              {t('pieTagline')}
            </span>
          </div>

          <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-1 tracking-tight">
            {metricMeta.title}
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            {metricMeta.subtitle}
          </p>
        </div>

        {/* Action Controls: Donut Toggle + PNG Export */}
        <div className="flex items-center space-x-2 shrink-0 self-start md:self-center">
          {/* Donut vs Pie Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setIsDonut(true)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-all cursor-pointer ${
                isDonut
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title={t('pieModeDonut')}
            >
              <CircleDot className="w-3.5 h-3.5" />
              <span>{t('pieModeDonut')}</span>
            </button>
            <button
              onClick={() => setIsDonut(false)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-all cursor-pointer ${
                !isDonut
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title={t('pieModeSolid')}
            >
              <PieChartIcon className="w-3.5 h-3.5" />
              <span>{t('pieModeSolid')}</span>
            </button>
          </div>

          {/* Download PNG Button */}
          <button
            onClick={handleExportPng}
            disabled={isExporting}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
            title={t('pieExportPng')}
          >
            <Download className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span className="hidden sm:inline">{isExporting ? t('pieExporting') : t('pieExportPng')}</span>
          </button>
        </div>
      </div>

      {/* Metric Selector Tabs */}
      <div className="flex items-center space-x-1.5 py-3 border-b border-slate-100 dark:border-slate-800 overflow-x-auto text-xs">
        <button
          onClick={() => handleSelectMetric('sector')}
          className={`px-3 py-1.5 rounded-lg font-semibold flex items-center space-x-1.5 whitespace-nowrap transition-all cursor-pointer ${
            selectedMetric === 'sector'
              ? 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>{t('pieMetricSector')}</span>
        </button>

        <button
          onClick={() => handleSelectMetric('bilateral_gdp')}
          className={`px-3 py-1.5 rounded-lg font-semibold flex items-center space-x-1.5 whitespace-nowrap transition-all cursor-pointer ${
            selectedMetric === 'bilateral_gdp'
              ? 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Globe2 className="w-3.5 h-3.5" />
          <span>{t('pieMetricBilateralGdp')}</span>
        </button>

        <button
          onClick={() => handleSelectMetric('trade')}
          className={`px-3 py-1.5 rounded-lg font-semibold flex items-center space-x-1.5 whitespace-nowrap transition-all cursor-pointer ${
            selectedMetric === 'trade'
              ? 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <ArrowRightLeft className="w-3.5 h-3.5" />
          <span>{t('pieMetricTrade')}</span>
        </button>

        <button
          onClick={() => handleSelectMetric('fiscal_debt')}
          className={`px-3 py-1.5 rounded-lg font-semibold flex items-center space-x-1.5 whitespace-nowrap transition-all cursor-pointer ${
            selectedMetric === 'fiscal_debt'
              ? 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Scale className="w-3.5 h-3.5" />
          <span>{t('pieMetricFiscalDebt')}</span>
        </button>
      </div>

      {/* Main Dual SVG Pie Charts Side-by-Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
        {/* Entity A Pie / Donut Card */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex flex-col items-center">
          {/* Card Header */}
          <div className="w-full flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-slate-700/60 mb-4">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">{entityA.flag}</span>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                  <span>{entityA.name}</span>
                  <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                    ({entityA.shortName})
                  </span>
                </h4>
                <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold font-mono">
                  GDP: ${entityA.nominalGdp >= 1000 ? `${(entityA.nominalGdp / 1000).toFixed(2)}T` : `${entityA.nominalGdp}B`} USD
                </span>
              </div>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              Bên A
            </span>
          </div>

          {/* SVG Pie Rendering */}
          <div className="relative flex items-center justify-center">
            <svg
              width={svgSize}
              height={svgSize}
              viewBox={`0 0 ${svgSize} ${svgSize}`}
              className="overflow-visible"
            >
              <g transform={`translate(${radius}, ${radius})`}>
                {arcsA.map((d, i) => {
                  const slice = d.data;
                  const isHovered =
                    hoveredSlice?.slice.id === slice.id && hoveredSlice.target === 'A';
                  const pathData = (isHovered ? hoveredArcGen(d) : arcGen(d)) || '';
                  const centroid = labelArcGen.centroid(d);
                  const angle = d.endAngle - d.startAngle;

                  return (
                    <g key={slice.id} className="transition-all duration-200">
                      <path
                        d={pathData}
                        fill={slice.color}
                        stroke={isDarkMode ? '#0f172a' : '#ffffff'}
                        strokeWidth={isHovered ? 3 : 2}
                        className="cursor-pointer transition-all duration-200 hover:opacity-95"
                        onMouseEnter={(e) => {
                          const rect = containerRef.current?.getBoundingClientRect();
                          if (rect) {
                            setTooltipPos({
                              x: e.clientX - rect.left,
                              y: e.clientY - rect.top,
                            });
                          }
                          setHoveredSlice({ slice, target: 'A' });
                        }}
                        onMouseMove={(e) => {
                          const rect = containerRef.current?.getBoundingClientRect();
                          if (rect) {
                            setTooltipPos({
                              x: e.clientX - rect.left,
                              y: e.clientY - rect.top,
                            });
                          }
                        }}
                        onMouseLeave={() => setHoveredSlice(null)}
                      />

                      {/* Slice Percentage Label (if slice is large enough) */}
                      {angle > 0.28 && slice.pctA >= 3 && (
                        <text
                          x={centroid[0]}
                          y={centroid[1]}
                          dy="0.35em"
                          textAnchor="middle"
                          fill="#ffffff"
                          className="pointer-events-none text-xs font-mono font-bold select-none"
                          style={{
                            textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                          }}
                        >
                          {slice.pctA.toFixed(1)}%
                        </text>
                      )}
                    </g>
                  );
                })}
              </g>
            </svg>

            {/* Donut Center Label */}
            {isDonut && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
                <span className="text-base sm:text-lg font-black font-mono tabular-nums text-slate-900 dark:text-white">
                  {centerA.value}
                </span>
                <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 text-center max-w-[80px] leading-tight">
                  {centerA.label}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Entity B Pie / Donut Card */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex flex-col items-center">
          {/* Card Header */}
          <div className="w-full flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-slate-700/60 mb-4">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">{entityB.flag}</span>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                  <span>{entityB.name}</span>
                  <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                    ({entityB.shortName})
                  </span>
                </h4>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold font-mono">
                  GDP: ${entityB.nominalGdp >= 1000 ? `${(entityB.nominalGdp / 1000).toFixed(2)}T` : `${entityB.nominalGdp}B`} USD
                </span>
              </div>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              Bên B
            </span>
          </div>

          {/* SVG Pie Rendering */}
          <div className="relative flex items-center justify-center">
            <svg
              width={svgSize}
              height={svgSize}
              viewBox={`0 0 ${svgSize} ${svgSize}`}
              className="overflow-visible"
            >
              <g transform={`translate(${radius}, ${radius})`}>
                {arcsB.map((d, i) => {
                  const slice = d.data;
                  const isHovered =
                    hoveredSlice?.slice.id === slice.id && hoveredSlice.target === 'B';
                  const pathData = (isHovered ? hoveredArcGen(d) : arcGen(d)) || '';
                  const centroid = labelArcGen.centroid(d);
                  const angle = d.endAngle - d.startAngle;

                  return (
                    <g key={slice.id} className="transition-all duration-200">
                      <path
                        d={pathData}
                        fill={slice.color}
                        stroke={isDarkMode ? '#0f172a' : '#ffffff'}
                        strokeWidth={isHovered ? 3 : 2}
                        className="cursor-pointer transition-all duration-200 hover:opacity-95"
                        onMouseEnter={(e) => {
                          const rect = containerRef.current?.getBoundingClientRect();
                          if (rect) {
                            setTooltipPos({
                              x: e.clientX - rect.left,
                              y: e.clientY - rect.top,
                            });
                          }
                          setHoveredSlice({ slice, target: 'B' });
                        }}
                        onMouseMove={(e) => {
                          const rect = containerRef.current?.getBoundingClientRect();
                          if (rect) {
                            setTooltipPos({
                              x: e.clientX - rect.left,
                              y: e.clientY - rect.top,
                            });
                          }
                        }}
                        onMouseLeave={() => setHoveredSlice(null)}
                      />

                      {/* Slice Percentage Label (if slice is large enough) */}
                      {angle > 0.28 && slice.pctB >= 3 && (
                        <text
                          x={centroid[0]}
                          y={centroid[1]}
                          dy="0.35em"
                          textAnchor="middle"
                          fill="#ffffff"
                          className="pointer-events-none text-xs font-mono font-bold select-none"
                          style={{
                            textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                          }}
                        >
                          {slice.pctB.toFixed(1)}%
                        </text>
                      )}
                    </g>
                  );
                })}
              </g>
            </svg>

            {/* Donut Center Label */}
            {isDonut && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
                <span className="text-base sm:text-lg font-black font-mono tabular-nums text-slate-900 dark:text-white">
                  {centerB.value}
                </span>
                <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 text-center max-w-[80px] leading-tight">
                  {centerB.label}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Hover Data Point Inspection Tooltip */}
      {hoveredSlice && tooltipPos && (
        <div
          style={{
            left: `${Math.min(tooltipPos.x + 16, (containerRef.current?.clientWidth || 700) - 270)}px`,
            top: `${Math.max(16, tooltipPos.y - 70)}px`,
          }}
          className="pointer-events-none absolute z-30 w-64 p-3.5 bg-slate-900/95 dark:bg-slate-950/95 text-white backdrop-blur-md rounded-xl border border-slate-700 shadow-xl text-xs animate-in fade-in zoom-in-95 duration-100"
        >
          {/* Tooltip Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
            <div className="flex items-center space-x-2">
              <span
                className="w-3 h-3 rounded-xs shrink-0"
                style={{ backgroundColor: hoveredSlice.slice.color }}
              />
              <span className="font-bold truncate text-slate-100">
                {hoveredSlice.slice.label}
              </span>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
              {hoveredSlice.target === 'A' ? entityA.shortName : entityB.shortName}
            </span>
          </div>

          {/* Details */}
          <div className="space-y-1.5 font-mono text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Tỷ trọng phần trăm:</span>
              <span className="font-bold text-amber-400">
                {hoveredSlice.target === 'A'
                  ? hoveredSlice.slice.pctA.toFixed(1)
                  : hoveredSlice.slice.pctB.toFixed(1)}
                %
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Giá trị tuyệt đối:</span>
              <span className="font-bold text-emerald-400">
                {hoveredSlice.target === 'A'
                  ? hoveredSlice.slice.formattedA
                  : hoveredSlice.slice.formattedB}
              </span>
            </div>

            <div className="flex items-center justify-between border-t border-slate-800/80 pt-1.5 mt-1.5">
              <span className="text-slate-400">
                Chênh lệch so với {hoveredSlice.target === 'A' ? entityB.shortName : entityA.shortName}:
              </span>
              {(() => {
                const diff =
                  hoveredSlice.target === 'A'
                    ? hoveredSlice.slice.pctA - hoveredSlice.slice.pctB
                    : hoveredSlice.slice.pctB - hoveredSlice.slice.pctA;
                return (
                  <span
                    className={`font-bold ${
                      Math.abs(diff) < 0.1
                        ? 'text-slate-300'
                        : diff > 0
                        ? 'text-emerald-400'
                        : 'text-rose-400'
                    }`}
                  >
                    {diff > 0 ? `+${diff.toFixed(1)}%` : `${diff.toFixed(1)}%`}
                  </span>
                );
              })()}
            </div>
          </div>

          <p className="mt-2 text-[10px] text-slate-400 font-sans leading-tight">
            {hoveredSlice.slice.description}
          </p>
        </div>
      )}

      {/* Comparative Legend & Delta Breakdown Table */}
      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {t('pieTableTitle')}
          </h4>
          <span className="text-2xs text-slate-400 dark:text-slate-500">
            {t('pieTableSubtitle')}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          {slices.map((slice) => {
            const diffPct = slice.pctA - slice.pctB;
            const isHigherA = diffPct > 0;
            const isEquiv = Math.abs(diffPct) < 0.1;

            return (
              <div
                key={slice.id}
                className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/30 border border-slate-200/60 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                {/* Left: Category Label & Dot */}
                <div className="flex items-start sm:items-center space-x-2.5 sm:w-1/3">
                  <span
                    className="w-3.5 h-3.5 rounded-sm shrink-0 mt-0.5 sm:mt-0"
                    style={{ backgroundColor: slice.color }}
                  />
                  <div>
                    <span className="font-bold text-slate-900 dark:text-slate-100 block">
                      {slice.label}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                      {slice.description}
                    </span>
                  </div>
                </div>

                {/* Middle: Entity A and Entity B Values */}
                <div className="flex items-center justify-between sm:justify-center sm:space-x-8 sm:w-1/3 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200/60 dark:border-slate-700/60">
                  {/* Entity A */}
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] text-slate-400 block font-medium">
                      {entityA.shortName}
                    </span>
                    <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-sm">
                      {slice.pctA.toFixed(1)}%
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 block">
                      {slice.formattedA}
                    </span>
                  </div>

                  <span className="text-slate-300 dark:text-slate-700 text-xs hidden sm:inline">vs</span>

                  {/* Entity B */}
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-medium">
                      {entityB.shortName}
                    </span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                      {slice.pctB.toFixed(1)}%
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 block">
                      {slice.formattedB}
                    </span>
                  </div>
                </div>

                {/* Right: Variance / Delta badge */}
                <div className="flex sm:justify-end sm:w-1/3 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200/60 dark:border-slate-700/60">
                  {isEquiv ? (
                    <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                      {t('pieEquivalentShare')}
                    </span>
                  ) : (
                    <div className="flex items-center space-x-1.5">
                      <span
                        className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                          isHigherA
                            ? 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                            : 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        }`}
                      >
                        {isHigherA
                          ? `+${diffPct.toFixed(1)}% (${entityA.shortName} ${t('pieHigher')})`
                          : `+${Math.abs(diffPct).toFixed(1)}% (${entityB.shortName} ${t('pieHigher')})`}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
