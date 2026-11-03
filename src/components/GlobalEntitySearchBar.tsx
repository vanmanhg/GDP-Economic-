import { useState, useRef, useEffect, useMemo, KeyboardEvent } from 'react';
import { Search, X, MapPin, Globe, ChevronRight, Check } from 'lucide-react';
import { EconomicEntity } from '../types';
import { ECONOMIC_ENTITIES } from '../data/economicData';
import { formatCurrency } from '../utils/formatters';

interface GlobalEntitySearchBarProps {
  onSelectEntityA: (entity: EconomicEntity) => void;
  onSelectEntityB: (entity: EconomicEntity) => void;
  currentEntityA: EconomicEntity;
  currentEntityB: EconomicEntity;
}

export function GlobalEntitySearchBar({
  onSelectEntityA,
  onSelectEntityB,
  currentEntityA,
  currentEntityB,
}: GlobalEntitySearchBarProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Global hotkey '/' to focus search
  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      if (e.key === '/' || (e.key === 'k' && (e.metaKey || e.ctrlKey))) {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filter entities based on query
  const filteredEntities = useMemo(() => {
    if (!query.trim()) {
      return ECONOMIC_ENTITIES.slice(0, 8); // show popular/top entities by default
    }
    const q = query.toLowerCase().trim();
    return ECONOMIC_ENTITIES.filter((entity) => {
      return (
        entity.name.toLowerCase().includes(q) ||
        entity.shortName.toLowerCase().includes(q) ||
        entity.continent.toLowerCase().includes(q) ||
        entity.capitalOrMajorCity.toLowerCase().includes(q) ||
        entity.currency.toLowerCase().includes(q)
      );
    });
  }, [query]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredEntities.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredEntities.length) % Math.max(1, filteredEntities.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const targetEntity = filteredEntities[selectedIndex];
      if (targetEntity) {
        if (e.shiftKey) {
          onSelectEntityB(targetEntity);
        } else {
          onSelectEntityA(targetEntity);
        }
        setIsOpen(false);
        setQuery('');
        inputRef.current?.blur();
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const handleSelect = (entity: EconomicEntity, slot: 'A' | 'B') => {
    if (slot === 'A') {
      onSelectEntityA(entity);
    } else {
      onSelectEntityB(entity);
    }
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div className="relative w-full max-w-xs sm:max-w-sm md:max-w-md">
      {/* Search Input Bar */}
      <div className="relative flex items-center">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
        <input
          ref={inputRef}
          id="global-entity-search-input"
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setSelectedIndex(0);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Jump to country or region... (Press /)"
          className="w-full pl-8.5 pr-8 py-1.5 rounded-lg text-xs bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-850 transition-all shadow-2xs font-medium"
        />
        {query ? (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            className="absolute right-2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-3 h-3" />
          </button>
        ) : (
          <kbd className="hidden sm:inline-block absolute right-2.5 px-1 py-0.2 text-[9px] font-mono bg-white dark:bg-slate-700 text-slate-400 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-600 pointer-events-none">
            /
          </kbd>
        )}
      </div>

      {/* Instant Dropdown Results */}
      {isOpen && (
        <div
          ref={dropdownRef}
          id="global-entity-search-dropdown"
          className="absolute left-0 right-0 mt-1.5 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden z-50 text-xs animate-in fade-in zoom-in-95 duration-100 max-h-80 flex flex-col"
        >
          {/* Header */}
          <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between text-3xs font-semibold text-slate-500 dark:text-slate-400">
            <span>
              {query ? `Matching "${query}" (${filteredEntities.length})` : 'Popular Benchmark Entities'}
            </span>
            <span className="font-mono">Enter: Select A • Shift+Enter: Select B</span>
          </div>

          {/* List items */}
          <div className="overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
            {filteredEntities.length === 0 ? (
              <div className="p-4 text-center text-slate-400 text-xs">
                No economies found matching &ldquo;{query}&rdquo;
              </div>
            ) : (
              filteredEntities.map((entity, idx) => {
                const isSelected = idx === selectedIndex;
                const isCurrentA = entity.id === currentEntityA.id;
                const isCurrentB = entity.id === currentEntityB.id;

                return (
                  <div
                    key={entity.id}
                    className={`p-2.5 flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'bg-indigo-50/70 dark:bg-indigo-950/40 text-slate-900 dark:text-white'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                    }`}
                    onMouseEnter={() => setSelectedIndex(idx)}
                  >
                    {/* Entity Details */}
                    <div
                      className="flex items-center space-x-2.5 flex-1 min-w-0 cursor-pointer"
                      onClick={() => handleSelect(entity, 'A')}
                    >
                      <span className="text-lg shrink-0">{entity.flag}</span>
                      <div className="min-w-0">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-slate-900 dark:text-slate-100 truncate">
                            {entity.name}
                          </span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider shrink-0 ${
                              entity.type === 'region'
                                ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80'
                                : 'bg-indigo-100 dark:bg-indigo-950/70 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80'
                            }`}
                          >
                            {entity.type === 'region' ? 'Region' : 'Nation'}
                          </span>
                          {isCurrentA && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-indigo-600 text-white">
                              Active A
                            </span>
                          )}
                          {isCurrentB && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-600 text-white">
                              Active B
                            </span>
                          )}
                        </div>
                        <div className="text-3xs text-slate-400 dark:text-slate-500 flex items-center space-x-2 mt-0.5 font-mono">
                          <span>{formatCurrency(entity.nominalGdp)}</span>
                          <span>•</span>
                          <span>Rank #{entity.globalGdpRank}</span>
                          <span>•</span>
                          <span>{entity.continent}</span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Selection Buttons */}
                    <div className="flex items-center space-x-1 shrink-0 ml-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelect(entity, 'A');
                        }}
                        className={`px-2 py-1 rounded text-2xs font-bold transition-all shadow-2xs cursor-pointer ${
                          isCurrentA
                            ? 'bg-indigo-600 text-white'
                            : 'bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                        }`}
                        title={`Select ${entity.shortName} as Entity A`}
                      >
                        Set A
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelect(entity, 'B');
                        }}
                        className={`px-2 py-1 rounded text-2xs font-bold transition-all shadow-2xs cursor-pointer ${
                          isCurrentB
                            ? 'bg-emerald-600 text-white'
                            : 'bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        }`}
                        title={`Select ${entity.shortName} as Entity B`}
                      >
                        Set B
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
