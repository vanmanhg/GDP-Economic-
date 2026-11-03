import { useState, useMemo } from 'react';
import { Compass, Download, RefreshCw, CheckCircle2 } from 'lucide-react';
import { EconomicEntity } from '../types';
import { useTheme } from '../context/ThemeContext';
import { downloadEconomicRadarPng } from '../utils/exportChartPng';

interface EconomicRadarProps {
  entityA: EconomicEntity;
  entityB: EconomicEntity;
}

interface Dimension {
  label: string;
  computeScore: (e: EconomicEntity) => number; // 0 - 100
  formatValue: (e: EconomicEntity) => string;
}

export function EconomicRadar({ entityA, entityB }: EconomicRadarProps) {
  const { isDarkMode } = useTheme();
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportSuccess, setExportSuccess] = useState<boolean>(false);

  const handleDownloadPng = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      await downloadEconomicRadarPng({
        entityA,
        entityB,
        dimensions,
        isDarkMode,
      });
      setExportSuccess(true);
      setTimeout(() => {
        setExportSuccess(false);
      }, 2500);
    } catch (err) {
      console.error('Failed to export economic radar PNG:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const dimensions: Dimension[] = [
    {
      label: 'Economic Scale',
      computeScore: (e) => {
        // Log-scale score for GDP between $200B and $30T
        const minLog = Math.log10(200);
        const maxLog = Math.log10(30000);
        const currentLog = Math.log10(Math.max(200, e.nominalGdp));
        return Math.min(100, Math.max(10, ((currentLog - minLog) / (maxLog - minLog)) * 100));
      },
      formatValue: (e) => (e.nominalGdp >= 1000 ? `$${(e.nominalGdp / 1000).toFixed(1)}T` : `$${e.nominalGdp}B`),
    },
    {
      label: 'Per Capita Wealth',
      computeScore: (e) => Math.min(100, Math.max(10, (e.gdpPerCapitaNominal / 115000) * 100)),
      formatValue: (e) => `$${(e.gdpPerCapitaNominal / 1000).toFixed(0)}k`,
    },
    {
      label: 'GDP Growth Rate',
      computeScore: (e) => Math.min(100, Math.max(10, ((e.gdpGrowthRate + 1) / 8) * 100)),
      formatValue: (e) => `+${e.gdpGrowthRate}%`,
    },
    {
      label: 'Price Stability',
      computeScore: (e) => {
        // Higher score for lower inflation around 2%
        const distance = Math.abs(e.inflationRate - 2.0);
        return Math.min(100, Math.max(15, 100 - distance * 15));
      },
      formatValue: (e) => `${e.inflationRate}% infl.`,
    },
    {
      label: 'Labor Resilience',
      computeScore: (e) => Math.min(100, Math.max(15, (1 - e.unemploymentRate / 10) * 100)),
      formatValue: (e) => `${e.unemploymentRate}% unemp.`,
    },
    {
      label: 'Human Index (HDI)',
      computeScore: (e) => Math.min(100, Math.max(10, ((e.hdi - 0.6) / 0.38) * 100)),
      formatValue: (e) => e.hdi.toFixed(3),
    },
  ];

  const size = 320;
  const center = size / 2;
  const radius = 105;
  const angleStep = (Math.PI * 2) / dimensions.length;

  // Grid levels (25, 50, 75, 100%)
  const levels = [0.25, 0.5, 0.75, 1.0];

  const getCoordinates = (index: number, score: number) => {
    const angle = index * angleStep - Math.PI / 2;
    const r = (score / 100) * radius;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y };
  };

  const getLabelCoordinates = (index: number) => {
    const angle = index * angleStep - Math.PI / 2;
    const r = radius + 32;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y };
  };

  const polygonA = dimensions
    .map((dim, i) => {
      const score = dim.computeScore(entityA);
      const { x, y } = getCoordinates(i, score);
      return `${x},${y}`;
    })
    .join(' ');

  const polygonB = dimensions
    .map((dim, i) => {
      const score = dim.computeScore(entityB);
      const { x, y } = getCoordinates(i, score);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div id="economic-radar-card" className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <Compass className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              6-Axis Normalized Macroeconomic Profile
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Holistic multidimensional benchmarking comparing scale, wealth, resilience, stability, and human development.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded bg-indigo-500/80 border border-indigo-600"></span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">{entityA.name}</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded bg-emerald-500/80 border border-emerald-600"></span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">{entityB.name}</span>
          </div>

          <button
            id="download-radar-chart-png-btn"
            onClick={handleDownloadPng}
            disabled={isExporting}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg border shadow-2xs flex items-center space-x-1.5 transition-all cursor-pointer disabled:opacity-50 ${
              exportSuccess
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                : 'bg-white dark:bg-slate-800 hover:bg-slate-100 hover:dark:bg-slate-700/80 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
            }`}
            title="Download high-resolution PNG image of this radar profile visualization"
            aria-label="Download Economic Radar as High-Resolution PNG"
          >
            {isExporting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600 dark:text-indigo-400" />
                <span>Exporting...</span>
              </>
            ) : exportSuccess ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Downloaded!</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span>Download PNG</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-center gap-6 py-4">
        {/* Radar SVG */}
        <div className="w-full max-w-[340px] shrink-0">
          <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-auto">
            {/* Background concentric polygons */}
            {levels.map((lvl, idx) => {
              const pts = dimensions
                .map((_, i) => {
                  const angle = i * angleStep - Math.PI / 2;
                  const r = lvl * radius;
                  return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
                })
                .join(' ');
              return (
                <polygon
                  key={idx}
                  points={pts}
                  fill="none"
                  stroke={isDarkMode ? '#334155' : '#e2e8f0'}
                  strokeWidth="1"
                  strokeDasharray={idx === levels.length - 1 ? 'none' : '2 2'}
                />
              );
            })}

            {/* Axis spokes */}
            {dimensions.map((_, i) => {
              const angle = i * angleStep - Math.PI / 2;
              const x2 = center + radius * Math.cos(angle);
              const y2 = center + radius * Math.sin(angle);
              return (
                <line
                  key={i}
                  x1={center}
                  y1={center}
                  x2={x2}
                  y2={y2}
                  stroke={isDarkMode ? '#475569' : '#cbd5e1'}
                  strokeWidth="1"
                />
              );
            })}

            {/* Entity A Polygon */}
            <polygon
              points={polygonA}
              fill="#6366f1"
              fillOpacity={isDarkMode ? '0.35' : '0.25'}
              stroke="#6366f1"
              strokeWidth="2.5"
            />

            {/* Entity B Polygon */}
            <polygon
              points={polygonB}
              fill="#10b981"
              fillOpacity={isDarkMode ? '0.3' : '0.2'}
              stroke="#10b981"
              strokeWidth="2.5"
            />

            {/* Axis Labels */}
            {dimensions.map((dim, i) => {
              const { x, y } = getLabelCoordinates(i);
              return (
                <text
                  key={i}
                  x={x}
                  y={y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-[10px] font-semibold fill-slate-700 dark:fill-slate-300 select-none"
                >
                  {dim.label}
                </text>
              );
            })}
          </svg>
        </div>

        {/* Dimension Breakdown List */}
        <div className="w-full space-y-2.5 divide-y divide-slate-100 dark:divide-slate-800 text-xs">
          {dimensions.map((dim, idx) => {
            const scoreA = dim.computeScore(entityA);
            const scoreB = dim.computeScore(entityB);
            const valA = dim.formatValue(entityA);
            const valB = dim.formatValue(entityB);

            return (
              <div key={idx} className="pt-2 first:pt-0 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{dim.label}</span>
                </div>
                <div className="flex items-center space-x-3 font-mono">
                  <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                    {valA} <span className="text-slate-400 dark:text-slate-500 font-normal">({scoreA.toFixed(0)}/100)</span>
                  </span>
                  <span className="text-slate-300 dark:text-slate-600">vs</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                    {valB} <span className="text-slate-400 dark:text-slate-500 font-normal">({scoreB.toFixed(0)}/100)</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

