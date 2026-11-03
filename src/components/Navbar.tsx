import {
  Globe2,
  FileDown,
  Sparkles,
  FileSpreadsheet,
  History,
  Moon,
  Sun,
  SlidersHorizontal,
  Users,
  Coins,
  Printer,
} from 'lucide-react';
import { CURATED_COMPARISONS } from '../data/economicData';
import { CuratedComparison, EconomicEntity } from '../types';
import { useTheme } from '../context/ThemeContext';
import { GlobalEntitySearchBar } from './GlobalEntitySearchBar';

interface NavbarProps {
  onSelectCurated: (comparison: CuratedComparison) => void;
  onOpenExport: () => void;
  onOpenSheets: () => void;
  onOpenRecent: () => void;
  recentCount: number;
  activeCuratedId?: string;
  onOpenIndicators?: () => void;
  activeIndicatorCount?: number;
  totalIndicatorCount?: number;
  onOpenMultiEntity?: () => void;
  onSelectEntityA?: (entity: EconomicEntity) => void;
  onSelectEntityB?: (entity: EconomicEntity) => void;
  currentEntityA?: EconomicEntity;
  currentEntityB?: EconomicEntity;
  onOpenForexConverter?: () => void;
}

export function Navbar({
  onSelectCurated,
  onOpenExport,
  onOpenSheets,
  onOpenRecent,
  recentCount,
  activeCuratedId,
  onOpenIndicators,
  activeIndicatorCount = 11,
  totalIndicatorCount = 18,
  onOpenMultiEntity,
  onSelectEntityA,
  onSelectEntityB,
  currentEntityA,
  currentEntityB,
  onOpenForexConverter,
}: NavbarProps) {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <header id="app-header" className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-2xs transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Nav Row */}
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Logo & App Title */}
          <div className="flex items-center space-x-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-indigo-950/80 flex items-center justify-center text-white border dark:border-indigo-800/60 shadow-xs">
              <Globe2 className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  GDP & Macro Comparator
                </h1>
                <span className="hidden xl:inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  Nations & Regions
                </span>
              </div>
              <p className="text-3xs text-slate-500 dark:text-slate-400 hidden lg:block">
                Benchmarking sovereign countries and subnational economies
              </p>
            </div>
          </div>

          {/* Global Entity Search Bar (Quick Jump) */}
          {onSelectEntityA && onSelectEntityB && currentEntityA && currentEntityB && (
            <div className="flex-1 max-w-xs md:max-w-sm lg:max-w-md mx-2">
              <GlobalEntitySearchBar
                onSelectEntityA={onSelectEntityA}
                onSelectEntityB={onSelectEntityB}
                currentEntityA={currentEntityA}
                currentEntityB={currentEntityB}
              />
            </div>
          )}

          {/* Right Action Buttons */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
            {/* Real-Time Currency Converter Button */}
            {onOpenForexConverter && (
              <button
                id="currency-converter-nav-btn"
                onClick={onOpenForexConverter}
                className="px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 hover:dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80 flex items-center space-x-1.5 transition-colors shadow-2xs cursor-pointer group"
                title="Open Real-Time Currency Converter (Live FX Rates)"
              >
                <Coins className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform" />
                <span className="hidden sm:inline">Live FX</span>
              </button>
            )}

            {/* Global Dark Mode Toggle */}
            <button
              id="dark-mode-toggle-btn"
              onClick={toggleTheme}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/90 hover:dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center space-x-1.5 transition-colors shadow-2xs cursor-pointer"
              title={isDarkMode ? 'Switch to Light Mode (Press D)' : 'Switch to Dark Mode (Press D)'}
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" />
              )}
              <span className="hidden md:inline">
                {isDarkMode ? 'Dark' : 'Light'}
              </span>
              <kbd className="hidden lg:inline-block px-1 py-0.2 text-[9px] font-mono bg-white/70 dark:bg-slate-900/80 text-slate-600 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700 ml-0.5">
                D
              </kbd>
            </button>

            {/* Indicators Customizer Button */}
            {onOpenIndicators && (
              <button
                id="indicators-nav-btn"
                onClick={onOpenIndicators}
                className="px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 hover:bg-slate-100 hover:dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 border border-slate-200 dark:border-slate-700 flex items-center space-x-1.5 transition-colors shadow-2xs group cursor-pointer"
                title="Select or deselect economic indicators (Press I)"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 group-hover:rotate-45 transition-transform" />
                <span className="hidden sm:inline">Indicators</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-200 border border-indigo-200/60 dark:border-indigo-800">
                  {activeIndicatorCount}/{totalIndicatorCount}
                </span>
                <kbd className="hidden lg:inline-block px-1 py-0.2 text-[9px] font-mono bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 rounded border border-slate-200 dark:border-slate-700 ml-0.5">
                  I
                </kbd>
              </button>
            )}

            {/* Multi-Entity Aggregate Comparison Lab (Up to 5) */}
            {onOpenMultiEntity && (
              <button
                id="multi-entity-nav-btn"
                onClick={onOpenMultiEntity}
                className="px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100/80 hover:dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80 flex items-center space-x-1.5 transition-colors shadow-2xs group cursor-pointer"
                title="Open 5-Way Multi-Entity Aggregate Comparison (Press M)"
              >
                <Users className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform" />
                <span className="hidden sm:inline">5-Way Lab</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-indigo-200/80 dark:bg-indigo-900 text-indigo-900 dark:text-indigo-200">
                  5
                </span>
                <kbd className="hidden lg:inline-block px-1 py-0.2 text-[9px] font-mono bg-white/80 dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 rounded border border-indigo-200/80 dark:border-slate-700 ml-0.5">
                  M
                </kbd>
              </button>
            )}

            {/* Recent Comparisons Button */}
            <button
              id="recent-comparisons-nav-btn"
              onClick={onOpenRecent}
              className="px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-slate-800 hover:bg-indigo-100/80 hover:dark:bg-slate-700 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-slate-700 flex items-center space-x-1.5 transition-colors shadow-2xs group cursor-pointer"
              title="View recent comparison sessions (Press H)"
            >
              <History className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 group-hover:rotate-[-20deg] transition-transform" />
              <span className="hidden sm:inline">Recent</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-indigo-200/80 dark:bg-indigo-900/70 text-indigo-900 dark:text-indigo-200 ml-0.5">
                {recentCount}
              </span>
              <kbd className="hidden md:inline-block px-1 py-0.2 text-[9px] font-mono bg-white/70 dark:bg-slate-900/80 text-indigo-700 dark:text-indigo-300 rounded border border-indigo-200/60 dark:border-slate-700 ml-0.5">
                H
              </kbd>
            </button>

            <button
              id="google-sheets-nav-btn"
              onClick={onOpenSheets}
              className="px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100/80 hover:dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 flex items-center space-x-1.5 transition-colors shadow-2xs cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline">Sheets</span>
            </button>

            <button
              id="export-report-btn"
              onClick={onOpenExport}
              className="px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 hover:dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center space-x-1.5 transition-colors shadow-2xs cursor-pointer"
            >
              <FileDown className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span className="hidden sm:inline">Export</span>
            </button>

            {/* Print Document Button */}
            <button
              id="print-report-nav-btn"
              type="button"
              onClick={() => window.print()}
              className="px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 hover:bg-slate-100 hover:dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center space-x-1.5 transition-colors shadow-2xs cursor-pointer group"
              title="Print physical report with high contrast (Press P)"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline">Print</span>
              <kbd className="hidden lg:inline-block px-1 py-0.2 text-[9px] font-mono bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 rounded border border-slate-200 dark:border-slate-700 ml-0.5">
                P
              </kbd>
            </button>
          </div>
        </div>

        {/* Curated Matchup Quick-Select Ribbon */}
        <div className="py-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center space-x-2 overflow-x-auto text-xs no-scrollbar">
          <div className="flex items-center text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider text-[10px] shrink-0 pl-0.5 pr-1">
            <Sparkles className="w-3 h-3 text-amber-500 mr-1 inline" />
            Featured:
          </div>

          <div className="flex items-center space-x-1.5 shrink-0">
            {CURATED_COMPARISONS.map((curated) => {
              const isActive = activeCuratedId === curated.id;
              return (
                <button
                  key={curated.id}
                  id={`curated-matchup-${curated.id}`}
                  onClick={() => onSelectCurated(curated)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all border cursor-pointer ${
                    isActive
                      ? 'bg-slate-900 text-white border-slate-900 dark:bg-indigo-600 dark:border-indigo-600 shadow-2xs'
                      : 'bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100 hover:dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700/80'
                  }`}
                >
                  <span>{curated.title}</span>
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </header>
  );
}
