import { useState, useMemo, useEffect } from 'react';
import {
  X,
  Search,
  Check,
  RotateCcw,
  SlidersHorizontal,
  Layers,
  Sparkles,
  BarChart2,
  HeartPulse,
  TrendingUp,
  Globe,
  PieChart,
  CheckSquare,
  Square,
  HelpCircle
} from 'lucide-react';
import {
  ALL_INDICATORS,
  INDICATOR_CATEGORIES,
  INDICATOR_PRESETS,
  DEFAULT_SELECTED_INDICATOR_IDS,
  EconomicIndicatorDef,
  IndicatorCategoryId
} from '../data/indicatorsRegistry';

interface IndicatorSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedIds: string[];
  onChangeSelectedIds: (ids: string[]) => void;
  onResetToDefault: () => void;
}

export function IndicatorSelectorModal({
  isOpen,
  onClose,
  selectedIds,
  onChangeSelectedIds,
  onResetToDefault
}: IndicatorSelectorModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [activePresetId, setActivePresetId] = useState<string | null>(null);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Compute selected set for fast O(1) lookups
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  // Toggle single indicator
  const handleToggle = (id: string) => {
    setActivePresetId(null);
    if (selectedSet.has(id)) {
      // Don't allow deselecting everything - keep at least 1
      if (selectedIds.length <= 1) return;
      onChangeSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      onChangeSelectedIds([...selectedIds, id]);
    }
  };

  // Toggle entire category
  const handleToggleCategory = (catId: IndicatorCategoryId) => {
    setActivePresetId(null);
    const catIndicators = ALL_INDICATORS.filter((ind) => ind.categoryId === catId);
    const catIds = catIndicators.map((ind) => ind.id);
    const allSelected = catIds.every((id) => selectedSet.has(id));

    if (allSelected) {
      // Deselect category indicators, but prevent leaving empty set
      const remaining = selectedIds.filter((id) => !catIds.includes(id));
      if (remaining.length > 0) {
        onChangeSelectedIds(remaining);
      } else {
        // Keep at least the first indicator of another category
        const fallback = ALL_INDICATORS.find((ind) => ind.categoryId !== catId)?.id || 'nominal-gdp';
        onChangeSelectedIds([fallback]);
      }
    } else {
      // Select all category indicators
      const toAdd = catIds.filter((id) => !selectedSet.has(id));
      onChangeSelectedIds([...selectedIds, ...toAdd]);
    }
  };

  // Apply preset
  const handleApplyPreset = (presetId: string) => {
    const preset = INDICATOR_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setActivePresetId(preset.id);
      onChangeSelectedIds([...preset.indicatorIds]);
    }
  };

  // Select all
  const handleSelectAll = () => {
    setActivePresetId('all');
    onChangeSelectedIds(ALL_INDICATORS.map((i) => i.id));
  };

  // Filtered indicators based on search query and category tab
  const filteredIndicators = useMemo(() => {
    let list = ALL_INDICATORS;
    if (selectedCategoryFilter !== 'all') {
      list = list.filter((ind) => ind.categoryId === selectedCategoryFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (ind) =>
          ind.name.toLowerCase().includes(q) ||
          ind.shortName.toLowerCase().includes(q) ||
          ind.description.toLowerCase().includes(q) ||
          ind.categoryName.toLowerCase().includes(q) ||
          ind.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return list;
  }, [searchQuery, selectedCategoryFilter]);

  // Group filtered indicators by category
  const groupedCategories = useMemo(() => {
    return INDICATOR_CATEGORIES.map((category) => {
      const items = filteredIndicators.filter((ind) => ind.categoryId === category.id);
      const totalInCategory = ALL_INDICATORS.filter((ind) => ind.categoryId === category.id).length;
      const selectedInCategory = ALL_INDICATORS.filter(
        (ind) => ind.categoryId === category.id && selectedSet.has(ind.id)
      ).length;

      return {
        ...category,
        items,
        totalInCategory,
        selectedInCategory,
        isAllSelected: selectedInCategory === totalInCategory,
        isPartiallySelected: selectedInCategory > 0 && selectedInCategory < totalInCategory,
      };
    }).filter((catGroup) => catGroup.items.length > 0);
  }, [filteredIndicators, selectedSet]);

  if (!isOpen) return null;

  const totalCount = ALL_INDICATORS.length;
  const activeCount = selectedIds.length;
  const pctSelected = Math.round((activeCount / totalCount) * 100);

  const getCategoryIcon = (catId: IndicatorCategoryId) => {
    switch (catId) {
      case 'scale-output':
        return <BarChart2 className="w-4 h-4 text-indigo-500" />;
      case 'living-standards':
        return <HeartPulse className="w-4 h-4 text-emerald-500" />;
      case 'stability-growth':
        return <TrendingUp className="w-4 h-4 text-amber-500" />;
      case 'trade-external':
        return <Globe className="w-4 h-4 text-blue-500" />;
      case 'structure-demographics':
        return <PieChart className="w-4 h-4 text-purple-500" />;
      default:
        return <SlidersHorizontal className="w-4 h-4" />;
    }
  };

  return (
    <div
      id="indicator-selector-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="indicator-modal-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5"
    >
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden transition-all animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200/80 dark:border-indigo-800/80 text-indigo-600 dark:text-indigo-400">
                <SlidersHorizontal className="w-5 h-5" />
              </div>
              <div>
                <h2 id="indicator-modal-title" className="text-lg font-bold text-slate-900 dark:text-white">
                  Economic Indicator Selection
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Choose which macroeconomic indicators to display across your country and region comparisons.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200/90 dark:border-indigo-800">
              {activeCount} of {totalCount} Active
            </span>
            <button
              id="close-indicator-modal-btn"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Close indicator modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Presets Toolbar */}
        <div className="px-5 sm:px-6 py-3 bg-slate-100/50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              Presets:
            </span>

            {INDICATOR_PRESETS.map((preset) => {
              const isMatch =
                activePresetId === preset.id ||
                (preset.indicatorIds.length === selectedIds.length &&
                  preset.indicatorIds.every((id) => selectedSet.has(id)));

              return (
                <button
                  key={preset.id}
                  id={`preset-btn-${preset.id}`}
                  onClick={() => handleApplyPreset(preset.id)}
                  title={preset.description}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    isMatch
                      ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200/80 hover:dark:bg-slate-700 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {preset.name}
                </button>
              );
            })}
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              id="select-all-indicators-btn"
              onClick={handleSelectAll}
              className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
            >
              Select All ({totalCount})
            </button>
            <button
              id="reset-indicators-btn"
              onClick={() => {
                onResetToDefault();
                setActivePresetId('default');
              }}
              className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center space-x-1 transition-colors"
              title="Reset indicators to recommended core set"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Defaults</span>
            </button>
          </div>
        </div>

        {/* Search & Category Filter Navigation */}
        <div className="px-5 sm:px-6 py-3 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="indicator-search-input"
              type="text"
              placeholder="Filter indicators by keyword, tag, or topic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center space-x-1 overflow-x-auto text-xs pb-1 sm:pb-0">
            <button
              onClick={() => setSelectedCategoryFilter('all')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategoryFilter === 'all'
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              All Categories
            </button>
            {INDICATOR_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryFilter(cat.id)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedCategoryFilter === cat.id
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {cat.shortName}
              </button>
            ))}
          </div>
        </div>

        {/* Indicator Groups List */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 space-y-6">
          {groupedCategories.length === 0 ? (
            <div className="py-12 text-center">
              <Search className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                No matching indicators found
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Try searching for something else or clear your filter.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategoryFilter('all');
                }}
                className="mt-3 px-3 py-1.5 text-xs rounded-lg font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
              >
                Clear filters
              </button>
            </div>
          ) : (
            groupedCategories.map((catGroup) => (
              <div
                key={catGroup.id}
                id={`modal-category-group-${catGroup.id}`}
                className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/40 dark:bg-slate-950/40"
              >
                {/* Category Header Bar */}
                <div className="px-4 py-2.5 bg-slate-100/70 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getCategoryIcon(catGroup.id)}
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                        {catGroup.name}
                      </span>
                      <span className="ml-2 text-2xs text-slate-500 dark:text-slate-400">
                        ({catGroup.selectedInCategory} of {catGroup.totalInCategory} active)
                      </span>
                    </div>
                  </div>

                  <button
                    id={`toggle-cat-${catGroup.id}-btn`}
                    onClick={() => handleToggleCategory(catGroup.id)}
                    className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center space-x-1"
                  >
                    {catGroup.isAllSelected ? (
                      <>
                        <CheckSquare className="w-3.5 h-3.5" />
                        <span>Deselect Group</span>
                      </>
                    ) : (
                      <>
                        <Square className="w-3.5 h-3.5" />
                        <span>Select Group</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Indicators Grid */}
                <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-2.5 bg-white dark:bg-slate-900">
                  {catGroup.items.map((indicator) => {
                    const isChecked = selectedSet.has(indicator.id);
                    return (
                      <div
                        key={indicator.id}
                        id={`indicator-toggle-card-${indicator.id}`}
                        onClick={() => handleToggle(indicator.id)}
                        className={`p-3 rounded-lg border cursor-pointer transition-all flex items-start space-x-3 select-none ${
                          isChecked
                            ? 'bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800/70 shadow-2xs'
                            : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:bg-slate-50 hover:dark:bg-slate-800/40 opacity-75 hover:opacity-100'
                        }`}
                        role="checkbox"
                        aria-checked={isChecked}
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === ' ' || e.key === 'Enter') {
                            e.preventDefault();
                            handleToggle(indicator.id);
                          }
                        }}
                      >
                        {/* Custom Checkbox */}
                        <div
                          className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                            isChecked
                              ? 'bg-indigo-600 border-indigo-600 text-white'
                              : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700'
                          }`}
                        >
                          {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={`text-xs font-bold leading-tight ${
                                isChecked
                                  ? 'text-slate-900 dark:text-white'
                                  : 'text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {indicator.name}
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 shrink-0">
                              {indicator.unit}
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-normal">
                            {indicator.description}
                          </p>

                          {indicator.lowerIsBetter && (
                            <span className="inline-block mt-1.5 text-[9px] font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900/60 px-1.5 py-0.2 rounded">
                              Lower value represents strength
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
            <div className="w-24 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 transition-all duration-300"
                style={{ width: `${pctSelected}%` }}
              />
            </div>
            <span>
              <strong>{activeCount}</strong> of {totalCount} indicators active ({pctSelected}%)
            </span>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <button
              id="indicator-modal-done-btn"
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors"
            >
              Apply Selection & View
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
