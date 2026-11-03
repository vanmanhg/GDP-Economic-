import React from 'react';
import { History, X, Trash2, ArrowRight, ExternalLink, Sparkles, Check, Clock } from 'lucide-react';
import { RecentComparisonItem, EconomicEntity } from '../types';

interface RecentComparisonsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  recentComparisons: RecentComparisonItem[];
  currentEntityA: EconomicEntity;
  currentEntityB: EconomicEntity;
  onSelectComparison: (entityA: EconomicEntity, entityB: EconomicEntity) => void;
  onRemoveComparison: (id: string) => void;
  onClearAll: () => void;
}

function formatRelativeTime(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin === 1) return '1 min ago';
  if (diffMin < 60) return `${diffMin} mins ago`;
  if (diffHour === 1) return '1 hour ago';
  if (diffHour < 24) return `${diffHour} hours ago`;
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays} days ago`;
}

function formatGdp(billionsUsd: number): string {
  if (billionsUsd >= 1000) {
    return `$${(billionsUsd / 1000).toFixed(2)}T`;
  }
  return `$${billionsUsd.toFixed(0)}B`;
}

export function RecentComparisonsSidebar({
  isOpen,
  onClose,
  recentComparisons,
  currentEntityA,
  currentEntityB,
  onSelectComparison,
  onRemoveComparison,
  onClearAll,
}: RecentComparisonsSidebarProps) {
  // Close on Escape key press
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
      {/* Background backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-slate-900 shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 transition-colors">
          
          {/* Header */}
          <div className="px-6 py-5 bg-slate-900 dark:bg-slate-950 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                <History className="w-5 h-5" />
              </div>
              <div>
                <h2 id="slide-over-title" className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                  Recent Comparisons
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                    {recentComparisons.length}/5
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Switch back to previously analyzed entity pairs
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              id="close-recent-sidebar-btn"
              className="rounded-lg p-2 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Subheader info & clear option */}
          <div className="px-6 py-3 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
              <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              Saved automatically (stores last 5)
            </span>
            {recentComparisons.length > 0 && (
              <button
                onClick={onClearAll}
                id="clear-all-recent-btn"
                className="text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 font-semibold flex items-center space-x-1 hover:underline transition-colors cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear history</span>
              </button>
            )}
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
            {recentComparisons.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 mb-3 border border-slate-200 dark:border-slate-700">
                  <History className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">No Recent Comparisons</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                  As you compare countries and subnational economies or select featured matchups, your last 5 analysis sessions will appear here.
                </p>
              </div>
            ) : (
              recentComparisons.map((item, index) => {
                const isCurrentlyActive =
                  (currentEntityA.id === item.entityA.id && currentEntityB.id === item.entityB.id) ||
                  (currentEntityA.id === item.entityB.id && currentEntityB.id === item.entityA.id);

                return (
                  <div
                    key={item.id}
                    id={`recent-comparison-item-${item.entityA.id}-${item.entityB.id}`}
                    onClick={() => {
                      onSelectComparison(item.entityA, item.entityB);
                      onClose();
                    }}
                    className={`group relative rounded-xl border p-4 cursor-pointer transition-all ${
                      isCurrentlyActive
                        ? 'bg-indigo-50/60 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-700 ring-2 ring-indigo-500/20 shadow-sm'
                        : 'bg-white dark:bg-slate-850/80 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md hover:bg-slate-50/50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {/* Top row: relative time and delete */}
                    <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 mb-2.5">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-slate-500 dark:text-slate-400">#{index + 1}</span>
                        <span>•</span>
                        <span>{formatRelativeTime(item.timestamp)}</span>
                        {isCurrentlyActive && (
                          <span className="inline-flex items-center gap-1 font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-950/80 px-2 py-0.5 rounded-full text-[10px]">
                            <Check className="w-2.5 h-2.5" /> Active
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveComparison(item.id);
                        }}
                        id={`delete-recent-item-${item.id}`}
                        className="opacity-60 group-hover:opacity-100 p-1 hover:text-rose-600 dark:hover:text-rose-400 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                        title="Remove from history"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Entities Face-Off Details */}
                    <div className="grid grid-cols-2 gap-2 items-center bg-slate-50/80 dark:bg-slate-900/60 rounded-lg p-2.5 border border-slate-100 dark:border-slate-800 mb-3">
                      {/* Entity A */}
                      <div className="flex items-center space-x-2 min-w-0">
                        <span className="text-xl shrink-0" role="img" aria-label={item.entityA.name}>
                          {item.entityA.flag}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                            {item.entityA.shortName || item.entityA.name}
                          </p>
                          <span className={`text-[10px] uppercase font-bold tracking-wider ${
                            item.entityA.type === 'region' ? 'text-amber-600 dark:text-amber-400' : 'text-blue-600 dark:text-blue-400'
                          }`}>
                            {item.entityA.type === 'region' ? 'Region' : 'Country'}
                          </span>
                        </div>
                      </div>

                      {/* Entity B */}
                      <div className="flex items-center space-x-2 min-w-0 justify-end text-right">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                            {item.entityB.shortName || item.entityB.name}
                          </p>
                          <span className={`text-[10px] uppercase font-bold tracking-wider ${
                            item.entityB.type === 'region' ? 'text-amber-600 dark:text-amber-400' : 'text-blue-600 dark:text-blue-400'
                          }`}>
                            {item.entityB.type === 'region' ? 'Region' : 'Country'}
                          </span>
                        </div>
                        <span className="text-xl shrink-0" role="img" aria-label={item.entityB.name}>
                          {item.entityB.flag}
                        </span>
                      </div>
                    </div>

                    {/* Metric Quick Stats Snippet */}
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center space-x-2">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">GDP:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {formatGdp(item.entityA.nominalGdp)}
                        </span>
                        <span className="text-slate-300 dark:text-slate-600">vs</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {formatGdp(item.entityB.nominalGdp)}
                        </span>
                      </div>

                      <div className="flex items-center space-x-1 text-indigo-600 dark:text-indigo-400 font-semibold group-hover:translate-x-0.5 transition-transform">
                        <span>{isCurrentlyActive ? 'Viewing' : 'Restore'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer note */}
          <div className="p-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 text-center">
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              Press <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-700 dark:text-slate-300 font-mono text-[10px] shadow-2xs">H</kbd> to toggle this drawer anytime
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
