import { useState, useMemo } from 'react';
import { Search, X, Globe, MapPin, Building2, Check } from 'lucide-react';
import { EconomicEntity, EntityType, ContinentalRegion } from '../types';
import { ECONOMIC_ENTITIES } from '../data/economicData';
import { formatShortGdp } from '../utils/formatters';

interface EntitySelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (entity: EconomicEntity) => void;
  selectedEntityId: string;
  otherEntityId: string;
  targetSlot: 'A' | 'B';
}

export function EntitySelectorModal({
  isOpen,
  onClose,
  onSelect,
  selectedEntityId,
  otherEntityId,
  targetSlot,
}: EntitySelectorModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | EntityType>('all');
  const [continentFilter, setContinentFilter] = useState<'all' | ContinentalRegion>('all');

  const filteredEntities = useMemo(() => {
    return ECONOMIC_ENTITIES.filter((entity) => {
      const matchesSearch =
        entity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entity.shortName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (entity.countryName && entity.countryName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        entity.topIndustries.some((ind) => ind.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesType = typeFilter === 'all' || entity.type === typeFilter;
      const matchesContinent = continentFilter === 'all' || entity.continent === continentFilter;

      return matchesSearch && matchesType && matchesContinent;
    });
  }, [searchQuery, typeFilter, continentFilter]);

  if (!isOpen) return null;

  return (
    <div
      id="entity-selector-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <div
        id="entity-selector-modal"
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150 transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-850">
          <div>
            <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              Selecting Entity {targetSlot}
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Choose a Country or Individual Region
            </h2>
          </div>
          <button
            id="close-selector-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 space-y-3 bg-white dark:bg-slate-900">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="search-entities-input"
              type="text"
              placeholder="Search by name, country, industry, or region (e.g., California, China, Tech)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            {/* Entity Type Filter Tabs */}
            <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
              <button
                id="filter-type-all"
                onClick={() => setTypeFilter('all')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  typeFilter === 'all'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                All ({ECONOMIC_ENTITIES.length})
              </button>
              <button
                id="filter-type-country"
                onClick={() => setTypeFilter('country')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors flex items-center space-x-1 cursor-pointer ${
                  typeFilter === 'country'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <Globe className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                <span>Countries</span>
              </button>
              <button
                id="filter-type-region"
                onClick={() => setTypeFilter('region')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors flex items-center space-x-1 cursor-pointer ${
                  typeFilter === 'region'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <MapPin className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                <span>Regions</span>
              </button>
            </div>

            {/* Continent Filter */}
            <div className="flex items-center space-x-1 overflow-x-auto text-xs text-slate-600 dark:text-slate-400">
              <span className="text-slate-400 dark:text-slate-500 font-medium">Zone:</span>
              {(['all', 'Americas', 'Europe', 'Asia-Pacific'] as const).map((cont) => (
                <button
                  key={cont}
                  id={`filter-continent-${cont.toLowerCase()}`}
                  onClick={() => setContinentFilter(cont)}
                  className={`px-2 py-0.5 rounded transition-colors whitespace-nowrap cursor-pointer ${
                    continentFilter === cont
                      ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-semibold'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {cont === 'all' ? 'Worldwide' : cont}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Entity List */}
        <div className="overflow-y-auto p-3 divide-y divide-slate-100 dark:divide-slate-800 flex-1">
          {filteredEntities.length === 0 ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400">
              <Building2 className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">No countries or regions match "{searchQuery}"</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                Try searching for a different name, country, or industry.
              </p>
            </div>
          ) : (
            filteredEntities.map((entity) => {
              const isCurrent = entity.id === selectedEntityId;
              const isOther = entity.id === otherEntityId;

              return (
                <button
                  key={entity.id}
                  id={`select-entity-${entity.id}`}
                  onClick={() => {
                    onSelect(entity);
                    onClose();
                  }}
                  className={`w-full text-left p-3 rounded-lg flex items-center justify-between transition-all group cursor-pointer ${
                    isCurrent
                      ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/80'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <span className="text-2xl shrink-0 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg group-hover:scale-105 transition-transform">
                      {entity.flag}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {entity.name}
                        </span>
                        {entity.type === 'region' ? (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            Subnational Region ({entity.countryName})
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            Sovereign Nation
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center space-x-2">
                        <span>Pop: {entity.population}M</span>
                        <span>•</span>
                        <span>GDP/Cap: ${entity.gdpPerCapitaNominal.toLocaleString()}</span>
                        <span>•</span>
                        <span className="text-slate-400 dark:text-slate-500 hidden sm:inline truncate">
                          {entity.topIndustries.slice(0, 2).join(', ')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0 ml-3">
                    <div className="text-right">
                      <div className="text-sm font-bold text-slate-900 dark:text-slate-100 font-mono">
                        {formatShortGdp(entity.nominalGdp)}
                      </div>
                      <div className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                        Rank #{entity.globalGdpRank}
                      </div>
                    </div>
                    {isCurrent && (
                      <span className="p-1 rounded-full bg-indigo-600 text-white">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    )}
                    {isOther && !isCurrent && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                        Opponent
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-50 dark:bg-slate-850 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
          <span>Comparing macroeconomic data across 40+ nations & states</span>
          <button
            id="close-selector-modal-footer-btn"
            onClick={onClose}
            className="text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-2xs cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
