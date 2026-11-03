import { PieChart, Briefcase, Factory, Wheat, Laptop, CheckCircle } from 'lucide-react';
import { EconomicEntity } from '../types';

interface SectorBreakdownProps {
  entityA: EconomicEntity;
  entityB: EconomicEntity;
}

export function SectorBreakdown({ entityA, entityB }: SectorBreakdownProps) {
  const sectors = [
    {
      name: 'Services (Tertiary)',
      keyA: entityA.sectorShare.services,
      keyB: entityB.sectorShare.services,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      icon: Briefcase,
      desc: 'Financial, healthcare, retail, hospitality, education, and professional services',
    },
    {
      name: 'Industry & Manufacturing (Secondary)',
      keyA: entityA.sectorShare.industry,
      keyB: entityB.sectorShare.industry,
      color: 'bg-amber-500',
      textColor: 'text-amber-600',
      icon: Factory,
      desc: 'Heavy manufacturing, automobiles, electronics, construction, and power',
    },
    {
      name: 'Agriculture & Resources (Primary)',
      keyA: entityA.sectorShare.agriculture,
      keyB: entityB.sectorShare.agriculture,
      color: 'bg-emerald-500',
      textColor: 'text-emerald-600',
      icon: Wheat,
      desc: 'Farming, forestry, fishing, and raw agricultural output',
    },
  ];

  return (
    <div id="sector-breakdown-card" className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 transition-colors">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <PieChart className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Sectoral Composition & Economic Drivers
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Gross Value Added (GVA) distribution across primary, industrial, and service sectors.
          </p>
        </div>
      </div>

      {/* Side-by-side stacked bar breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-5">
        
        {/* Entity A Stacked Bar */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-xl">{entityA.flag}</span>
              <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">{entityA.name}</span>
            </div>
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded border border-transparent dark:border-indigo-800">
              {entityA.sectorShare.services > 75 ? 'Services Dominated' : 'Balanced Industrial Base'}
            </span>
          </div>

          {/* Stacked bar */}
          <div className="w-full h-4 rounded-full overflow-hidden flex bg-slate-100 dark:bg-slate-800 shadow-inner">
            <div
              style={{ width: `${entityA.sectorShare.services}%` }}
              className="bg-blue-500 h-full transition-all"
              title={`Services: ${entityA.sectorShare.services}%`}
            />
            <div
              style={{ width: `${entityA.sectorShare.industry}%` }}
              className="bg-amber-500 h-full transition-all"
              title={`Industry: ${entityA.sectorShare.industry}%`}
            />
            <div
              style={{ width: `${entityA.sectorShare.agriculture}%` }}
              className="bg-emerald-500 h-full transition-all"
              title={`Agriculture: ${entityA.sectorShare.agriculture}%`}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span className="flex items-center">
              <span className="w-2 h-2 rounded-full bg-blue-500 mr-1"></span>
              Services: {entityA.sectorShare.services}%
            </span>
            <span className="flex items-center">
              <span className="w-2 h-2 rounded-full bg-amber-500 mr-1"></span>
              Industry: {entityA.sectorShare.industry}%
            </span>
            <span className="flex items-center">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1"></span>
              Agri: {entityA.sectorShare.agriculture}%
            </span>
          </div>

          {/* Top Industries Badges */}
          <div className="pt-2">
            <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 block mb-1.5 uppercase tracking-wider">
              Core Economic Engines
            </span>
            <div className="flex flex-wrap gap-1.5">
              {entityA.topIndustries.map((ind, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                >
                  {ind}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Entity B Stacked Bar */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-xl">{entityB.flag}</span>
              <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">{entityB.name}</span>
            </div>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-transparent dark:border-emerald-800">
              {entityB.sectorShare.services > 75 ? 'Services Dominated' : 'Balanced Industrial Base'}
            </span>
          </div>

          {/* Stacked bar */}
          <div className="w-full h-4 rounded-full overflow-hidden flex bg-slate-100 dark:bg-slate-800 shadow-inner">
            <div
              style={{ width: `${entityB.sectorShare.services}%` }}
              className="bg-blue-500 h-full transition-all"
              title={`Services: ${entityB.sectorShare.services}%`}
            />
            <div
              style={{ width: `${entityB.sectorShare.industry}%` }}
              className="bg-amber-500 h-full transition-all"
              title={`Industry: ${entityB.sectorShare.industry}%`}
            />
            <div
              style={{ width: `${entityB.sectorShare.agriculture}%` }}
              className="bg-emerald-500 h-full transition-all"
              title={`Agriculture: ${entityB.sectorShare.agriculture}%`}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span className="flex items-center">
              <span className="w-2 h-2 rounded-full bg-blue-500 mr-1"></span>
              Services: {entityB.sectorShare.services}%
            </span>
            <span className="flex items-center">
              <span className="w-2 h-2 rounded-full bg-amber-500 mr-1"></span>
              Industry: {entityB.sectorShare.industry}%
            </span>
            <span className="flex items-center">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1"></span>
              Agri: {entityB.sectorShare.agriculture}%
            </span>
          </div>

          {/* Top Industries Badges */}
          <div className="pt-2">
            <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 block mb-1.5 uppercase tracking-wider">
              Core Economic Engines
            </span>
            <div className="flex flex-wrap gap-1.5">
              {entityB.topIndustries.map((ind, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                >
                  {ind}
                </span>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Structural Comparison Detail */}
      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
        {sectors.map((s, idx) => {
          const diff = (s.keyA - s.keyB).toFixed(1);
          return (
            <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <s.icon className={`w-4 h-4 ${s.textColor}`} />
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{s.name}</span>
                  <span className="text-slate-400 dark:text-slate-500 hidden sm:inline ml-2">({s.desc})</span>
                </div>
              </div>

              <div className="flex items-center space-x-4 font-mono font-medium">
                <span className="text-slate-700 dark:text-slate-300">
                  <span className="text-indigo-600 dark:text-indigo-400 font-bold">{s.keyA}%</span> vs{' '}
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">{s.keyB}%</span>
                </span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] ${
                    Number(diff) > 0
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-transparent dark:border-indigo-800'
                      : Number(diff) < 0
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-transparent dark:border-emerald-800'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-transparent dark:border-slate-700'
                  }`}
                >
                  {Number(diff) > 0 ? `+${diff}% ${entityA.shortName}` : `${diff}% ${entityB.shortName}`}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
