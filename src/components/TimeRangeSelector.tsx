import React, { useState } from 'react';
import { Calendar, Sliders, ChevronDown, Check, Sparkles, RotateCcw } from 'lucide-react';
import { HistoricalTimeRange } from '../data/historicalExtendedData';

export interface TimeRangeSelectorProps {
  timeRange: HistoricalTimeRange;
  onTimeRangeChange: (range: HistoricalTimeRange) => void;
  customStartYear?: number;
  customEndYear?: number;
  onCustomYearChange?: (startYear: number, endYear: number) => void;
  minYear?: number;
  maxYear?: number;
  className?: string;
  size?: 'normal' | 'compact';
}

const HISTORIC_ERA_PRESETS = [
  { label: 'GFC & Recovery', start: 2007, end: 2012, badge: '2007–12' },
  { label: 'Global Trade Expansion', start: 2013, end: 2018, badge: '2013–18' },
  { label: 'COVID-19 Shock & Rebound', start: 2019, end: 2022, badge: '2019–22' },
  { label: 'Global Inflation Cycle', start: 2021, end: 2024, badge: '2021–24' },
];

export function TimeRangeSelector({
  timeRange,
  onTimeRangeChange,
  customStartYear = 2012,
  customEndYear = 2024,
  onCustomYearChange,
  minYear = 2005,
  maxYear = 2024,
  className = '',
  size = 'normal',
}: TimeRangeSelectorProps) {
  const [isCustomOpen, setIsCustomOpen] = useState<boolean>(timeRange === 'custom');
  const [localStart, setLocalStart] = useState<number>(customStartYear);
  const [localEnd, setLocalEnd] = useState<number>(customEndYear);

  const availableYears = Array.from(
    { length: maxYear - minYear + 1 },
    (_, i) => minYear + i
  );

  const handleSelectPreset = (range: HistoricalTimeRange) => {
    onTimeRangeChange(range);
    if (range !== 'custom') {
      setIsCustomOpen(false);
    } else {
      setIsCustomOpen(true);
    }
  };

  const handleApplyCustom = (start: number, end: number) => {
    const validStart = Math.max(minYear, Math.min(start, end - 1));
    const validEnd = Math.min(maxYear, Math.max(end, validStart + 1));
    setLocalStart(validStart);
    setLocalEnd(validEnd);
    if (onCustomYearChange) {
      onCustomYearChange(validStart, validEnd);
    }
    onTimeRangeChange('custom');
  };

  const handleStartChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextStart = parseInt(e.target.value, 10);
    handleApplyCustom(nextStart, localEnd);
  };

  const handleEndChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextEnd = parseInt(e.target.value, 10);
    handleApplyCustom(localStart, nextEnd);
  };

  const activeRangeLabel = (() => {
    switch (timeRange) {
      case '5y':
        return 'Last 5Y (2020–24)';
      case '10y':
        return 'Last 10Y (2015–24)';
      case '15y':
        return 'Last 15Y (2010–24)';
      case '20y':
      case 'all':
        return '20Y (2005–24)';
      case 'custom':
        return `Custom (${localStart}–${localEnd})`;
      default:
        return '10Y Horizon';
    }
  })();

  return (
    <div className={`relative inline-flex flex-col items-start ${className}`}>
      {/* Primary Range Preset Buttons */}
      <div
        role="group"
        aria-label="Historical time range selector"
        className="inline-flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs shadow-2xs"
      >
        <button
          type="button"
          onClick={() => handleSelectPreset('5y')}
          className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
            timeRange === '5y'
              ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-2xs font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
          title="Last 5 years (2020 to 2024)"
        >
          5Y
        </button>

        <button
          type="button"
          onClick={() => handleSelectPreset('10y')}
          className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
            timeRange === '10y'
              ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-2xs font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
          title="Last 10 years (2015 to 2024)"
        >
          10Y
        </button>

        <button
          type="button"
          onClick={() => handleSelectPreset('15y')}
          className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
            timeRange === '15y'
              ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-2xs font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
          title="Last 15 years (2010 to 2024)"
        >
          15Y
        </button>

        <button
          type="button"
          onClick={() => handleSelectPreset('20y')}
          className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
            timeRange === '20y' || timeRange === 'all'
              ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-2xs font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
          title="Full 20-year horizon (2005 to 2024)"
        >
          20Y
        </button>

        {/* Custom Range Popover Trigger Button */}
        <button
          type="button"
          onClick={() => {
            if (timeRange !== 'custom') {
              handleSelectPreset('custom');
            } else {
              setIsCustomOpen((prev) => !prev);
            }
          }}
          className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer flex items-center gap-1 ${
            timeRange === 'custom'
              ? 'bg-indigo-600 text-white shadow-2xs font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
          title="Specify a custom historical start and end year range"
        >
          <Calendar className="w-3 h-3" />
          <span>
            {timeRange === 'custom' ? `${localStart}–${localEnd}` : 'Custom'}
          </span>
          <ChevronDown
            className={`w-3 h-3 transition-transform ${
              isCustomOpen ? 'rotate-180' : ''
            }`}
          />
        </button>
      </div>

      {/* Custom Year Range Configuration Tray */}
      {isCustomOpen && (
        <div className="absolute top-full left-0 mt-2 z-30 w-72 sm:w-80 p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl text-xs space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Custom Historical Horizon</span>
            </span>
            <span className="font-mono text-[11px] text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
              {localEnd - localStart + 1} Years
            </span>
          </div>

          {/* Start and End Dropdowns */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                From Year
              </label>
              <select
                value={localStart}
                onChange={handleStartChange}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 font-mono font-semibold focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                {availableYears
                  .filter((y) => y < localEnd)
                  .map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                To Year
              </label>
              <select
                value={localEnd}
                onChange={handleEndChange}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 font-mono font-semibold focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                {availableYears
                  .filter((y) => y > localStart)
                  .map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Historic Era Quick Jump Buttons */}
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">
              Historic Macro Eras
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {HISTORIC_ERA_PRESETS.map((era) => {
                const isActive = localStart === era.start && localEnd === era.end;
                return (
                  <button
                    key={era.badge}
                    type="button"
                    onClick={() => handleApplyCustom(era.start, era.end)}
                    className={`p-1.5 rounded-lg border text-left transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-indigo-50 dark:bg-indigo-950/80 border-indigo-400 text-indigo-700 dark:text-indigo-300 font-bold'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="block text-[11px] truncate font-medium">
                      {era.label}
                    </span>
                    <span className="font-mono text-[9px] text-slate-400 block">
                      {era.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Close Button */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button
              type="button"
              onClick={() => setIsCustomOpen(false)}
              className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
