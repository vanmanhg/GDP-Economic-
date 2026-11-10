import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import {
  Globe,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Search,
  SlidersHorizontal,
  ArrowRight,
  TrendingUp,
  DollarSign,
  Users,
  ShieldAlert,
  Percent,
  Compass,
  Check,
  ChevronRight,
  Maximize2,
  X,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import worldData from '../data/world-110m.json';
import {
  WorldCountryEconomicData,
  WORLD_COUNTRIES_DATA,
  getCountryEconomicData,
  ChoroplethMetricKey,
  CHOROPLETH_METRIC_CONFIGS,
} from '../data/worldEconomicData';
import { EconomicEntity, ContinentalRegion } from '../types';
import { ECONOMIC_ENTITIES, getEntityById } from '../data/economicData';
import { useTheme } from '../context/ThemeContext';

interface EconomicWorldMapProps {
  entityA: EconomicEntity;
  entityB: EconomicEntity;
  onSelectEntityA: (entity: EconomicEntity) => void;
  onSelectEntityB: (entity: EconomicEntity) => void;
  onJumpToTab?: (tab: string) => void;
}

interface HoveredCountryInfo {
  data: WorldCountryEconomicData;
  x: number;
  y: number;
}

export function EconomicWorldMap({
  entityA,
  entityB,
  onSelectEntityA,
  onSelectEntityB,
  onJumpToTab,
}: EconomicWorldMapProps) {
  const { isDarkMode } = useTheme();
  const [selectedMetric, setSelectedMetric] = useState<ChoroplethMetricKey>('gdpPerCapitaNominal');
  const [selectedContinent, setSelectedContinent] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [hoveredCountry, setHoveredCountry] = useState<HoveredCountryInfo | null>(null);
  const [inspectingCountry, setInspectingCountry] = useState<WorldCountryEconomicData | null>(null);

  // Zoom and pan state
  const [zoomTransform, setZoomTransform] = useState<{ k: number; x: number; y: number }>({
    k: 1,
    x: 0,
    y: 0,
  });
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const metricConfig = CHOROPLETH_METRIC_CONFIGS[selectedMetric];

  // Convert TopoJSON to GeoJSON features
  const geoFeatures = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const topology = worldData as any;
    const countries = topojson.feature(topology, topology.objects.countries) as unknown as {
      type: 'FeatureCollection';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      features: Array<any>;
    };
    return countries.features.filter((f) => f.id !== '010'); // filter Antarctica for optimal economic viewport
  }, []);

  // Pre-calculate economic data for all features
  const countriesWithData = useMemo(() => {
    return geoFeatures.map((feat, idx) => {
      const rawId = feat.id ? String(feat.id) : undefined;
      const featName = feat.properties?.name;
      const fallbackId = rawId || (featName ? `geo-${featName.toLowerCase().replace(/[^a-z0-9]/g, '-')}` : `geo-${idx}`);
      const data = getCountryEconomicData(rawId, featName);
      const uniqueKey = data.id || fallbackId;
      return {
        feature: feat,
        data: {
          ...data,
          id: uniqueKey,
        },
        uniqueKey,
      };
    });
  }, [geoFeatures]);

  // Map projection & path generator
  const width = 960;
  const height = 500;

  const projection = useMemo(() => {
    return d3
      .geoNaturalEarth1()
      .scale(158)
      .translate([width / 2, height / 2 + 10]);
  }, [width, height]);

  const pathGenerator = useMemo(() => {
    return d3.geoPath().projection(projection);
  }, [projection]);

  const graticule = useMemo(() => {
    return d3.geoGraticule10();
  }, []);

  // Color scale computation based on selected metric
  const colorScale = useMemo(() => {
    const values = countriesWithData.map((c) => {
      const val = c.data[selectedMetric];
      return typeof val === 'number' ? val : 0;
    });

    const minVal = d3.min(values) || metricConfig.domain[0];
    const maxVal = d3.max(values) || metricConfig.domain[1];

    if (selectedMetric === 'gdpPerCapitaNominal' || selectedMetric === 'gdpPerCapitaPpp') {
      // Log scale for GDP per capita to prevent rich countries from crushing lower and middle-income variances
      const logScale = d3
        .scaleLog<string>()
        .domain([Math.max(1000, minVal), 15000, 45000, Math.max(90000, maxVal)])
        .range(['#cbd5e1', '#818cf8', '#4f46e5', '#312e81'])
        .interpolate(d3.interpolateRgb);

      return (val: number) => logScale(Math.max(1000, val));
    } else if (selectedMetric === 'nominalGdp') {
      const logScale = d3
        .scaleLog<string>()
        .domain([Math.max(10, minVal), 500, 4000, Math.max(25000, maxVal)])
        .range(['#e2e8f0', '#34d399', '#059669', '#064e3b'])
        .interpolate(d3.interpolateRgb);

      return (val: number) => logScale(Math.max(10, val));
    } else if (selectedMetric === 'gdpGrowthRate') {
      // Diverging or sequential for growth
      const scale = d3
        .scaleLinear<string>()
        .domain([0, 2.5, 5.0, 7.5])
        .range(['#fed7aa', '#fb923c', '#ea580c', '#9a3412'])
        .interpolate(d3.interpolateRgb);

      return (val: number) => scale(Math.max(0, val));
    } else if (selectedMetric === 'inflationRate') {
      const scale = d3
        .scaleLinear<string>()
        .domain([1.5, 4.0, 10.0, 30.0])
        .range(['#e9d5ff', '#a855f7', '#7e22ce', '#3b0764'])
        .interpolate(d3.interpolateRgb);

      return (val: number) => scale(Math.max(1.5, val));
    } else {
      // publicDebtToGdp
      const scale = d3
        .scaleLinear<string>()
        .domain([20, 60, 100, 160])
        .range(['#d1fae5', '#fde047', '#f97316', '#dc2626'])
        .interpolate(d3.interpolateRgb);

      return (val: number) => scale(Math.max(20, val));
    }
  }, [countriesWithData, selectedMetric, metricConfig.domain]);

  // Zoom handlers
  const handleZoom = useCallback((factor: number) => {
    setZoomTransform((prev) => {
      const nextK = Math.max(0.8, Math.min(6, prev.k * factor));
      // keep center roughly stable
      const centerX = width / 2;
      const centerY = height / 2;
      const nextX = centerX - (centerX - prev.x) * (nextK / prev.k);
      const nextY = centerY - (centerY - prev.y) * (nextK / prev.k);
      return { k: nextK, x: nextX, y: nextY };
    });
  }, [width, height]);

  const handleResetZoom = useCallback(() => {
    setZoomTransform({ k: 1, x: 0, y: 0 });
  }, []);

  const handleFocusRegion = useCallback((region: 'europe' | 'americas' | 'asia') => {
    if (region === 'europe') {
      setZoomTransform({ k: 2.5, x: -650, y: -200 });
      setSelectedContinent('Europe');
    } else if (region === 'asia') {
      setZoomTransform({ k: 2.0, x: -950, y: -250 });
      setSelectedContinent('Asia-Pacific');
    } else if (region === 'americas') {
      setZoomTransform({ k: 1.8, x: -100, y: -200 });
      setSelectedContinent('Americas');
    }
  }, []);

  // Mouse Drag to Pan handlers
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ x: number; y: number; originX: number; originY: number }>({
    x: 0,
    y: 0,
    originX: 0,
    originY: 0,
  });

  const handleMouseDown = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (e.button !== 0) return;
    isDraggingRef.current = true;
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      originX: zoomTransform.x,
      originY: zoomTransform.y,
    };
  }, [zoomTransform]);

  const handleMouseMoveMap = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setZoomTransform((prev) => ({
      ...prev,
      x: dragStartRef.current.originX + dx,
      y: dragStartRef.current.originY + dy,
    }));
  }, []);

  const handleMouseUpMap = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  // Filtered countries for search & continent
  const filteredCountryRows = useMemo(() => {
    return countriesWithData
      .filter((c) => {
        if (selectedContinent !== 'all' && c.data.continent !== selectedContinent) {
          return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return (
            c.data.name.toLowerCase().includes(q) ||
            c.data.commonName.toLowerCase().includes(q) ||
            c.data.iso3.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => {
        const valA = (a.data[selectedMetric] as number) || 0;
        const valB = (b.data[selectedMetric] as number) || 0;
        return valB - valA;
      });
  }, [countriesWithData, selectedContinent, searchQuery, selectedMetric]);

  // Check if a country matches Entity A or Entity B
  const isEntityA = (cData: WorldCountryEconomicData) => {
    if (cData.entityId && cData.entityId === entityA.id) return true;
    if (entityA.type === 'region' && entityA.countryId === cData.iso2) return true;
    return false;
  };

  const isEntityB = (cData: WorldCountryEconomicData) => {
    if (cData.entityId && cData.entityId === entityB.id) return true;
    if (entityB.type === 'region' && entityB.countryId === cData.iso2) return true;
    return false;
  };

  // Convert WorldCountryEconomicData to EconomicEntity if possible
  const handleAdoptEntity = (country: WorldCountryEconomicData, slot: 'A' | 'B') => {
    let target = country.entityId ? getEntityById(country.entityId) : undefined;
    if (!target && country.iso2) {
      target = getEntityById(country.iso2);
    }

    if (!target) {
      const mappedContinent: ContinentalRegion =
        country.continent === 'Americas' || country.continent === 'Europe' || country.continent === 'Asia-Pacific'
          ? country.continent
          : 'Middle East & Africa';

      // Create a full EconomicEntity from country data
      target = {
        id: country.iso2 || country.iso3.toLowerCase(),
        name: country.commonName,
        shortName: country.commonName,
        type: 'country',
        flag: country.flag,
        continent: mappedContinent,
        currency: 'USD',
        currencySymbol: '$',
        nominalGdp: country.nominalGdp,
        gdpPpp: country.gdpPpp,
        gdpPerCapitaNominal: country.gdpPerCapitaNominal,
        gdpPerCapitaPpp: country.gdpPerCapitaPpp,
        population: country.population,
        gdpGrowthRate: country.gdpGrowthRate,
        inflationRate: country.inflationRate,
        unemploymentRate: country.unemploymentRate || 4.5,
        publicDebtToGdp: country.publicDebtToGdp || 55.0,
        hdi: country.hdi || 0.8,
        sectorShare: {
          agriculture: 3.5,
          industry: 26.5,
          services: 70.0,
          techAndFinance: 20.0,
        },
        tradeBalance: 0,
        exports: Math.round(country.nominalGdp * 0.25),
        imports: Math.round(country.nominalGdp * 0.25),
        topIndustries: country.keyIndustries || ['Services', 'Manufacturing', 'Agriculture'],
        history: [
          { year: 2020, nominalGdp: Math.round(country.nominalGdp * 0.88), gdpPerCapita: Math.round(country.gdpPerCapitaNominal * 0.88) },
          { year: 2021, nominalGdp: Math.round(country.nominalGdp * 0.94), gdpPerCapita: Math.round(country.gdpPerCapitaNominal * 0.94) },
          { year: 2022, nominalGdp: Math.round(country.nominalGdp * 0.96), gdpPerCapita: Math.round(country.gdpPerCapitaNominal * 0.96) },
          { year: 2023, nominalGdp: Math.round(country.nominalGdp * 0.98), gdpPerCapita: Math.round(country.gdpPerCapitaNominal * 0.98) },
          { year: 2024, nominalGdp: country.nominalGdp, gdpPerCapita: country.gdpPerCapitaNominal },
        ],
        globalGdpRank: 25,
        capitalOrMajorCity: country.commonName,
        summaryNote: country.summaryNote || `${country.commonName} macroeconomic profile.`,
      };
    }

    if (target) {
      if (slot === 'A') {
        onSelectEntityA(target);
      } else {
        onSelectEntityB(target);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Deck */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-cyan-50 dark:bg-cyan-950/70 border border-cyan-100 dark:border-cyan-900/60 shrink-0">
              <Globe className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span>Economic World Map</span>
                <span aria-hidden="true">·</span>
                <span>D3.js Natural Earth Projection</span>
                <span aria-hidden="true">·</span>
                <span>177 Sovereign Economies</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1 tracking-tight">
                Global GDP Per Capita & Economic Indicator Choropleth
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-3xl leading-relaxed">
                Explore cross-national wealth disparities, income tiers, and macroeconomic resilience across the globe. Hover over any country to inspect detailed economic indicators, or click to set it as a comparison entity.
              </p>
            </div>
          </div>

          {/* Active Comparison Slot Reference Chips */}
          <div className="flex items-center gap-2.5 bg-slate-100 dark:bg-slate-800/80 p-2 rounded-xl text-xs shrink-0 border border-slate-200 dark:border-slate-700/60">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white dark:bg-slate-900 rounded-lg shadow-2xs font-semibold text-slate-900 dark:text-white border-l-2 border-indigo-600">
              <span className="text-sm">{entityA.flag}</span>
              <div>
                <div className="leading-tight">{entityA.shortName}</div>
                <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono font-normal">
                  ${Math.round(entityA.gdpPerCapitaNominal).toLocaleString()} / cap
                </div>
              </div>
            </div>
            <span className="text-slate-400 font-bold">vs</span>
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white dark:bg-slate-900 rounded-lg shadow-2xs font-semibold text-slate-900 dark:text-white border-l-2 border-emerald-600">
              <span className="text-sm">{entityB.flag}</span>
              <div>
                <div className="leading-tight">{entityB.shortName}</div>
                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-normal">
                  ${Math.round(entityB.gdpPerCapitaNominal).toLocaleString()} / cap
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Metric Selector Tabs */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 mr-1 flex items-center gap-1">
              <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>Choropleth Metric:</span>
            </span>
            {(
              [
                'gdpPerCapitaNominal',
                'gdpPerCapitaPpp',
                'nominalGdp',
                'gdpGrowthRate',
                'inflationRate',
                'publicDebtToGdp',
              ] as ChoroplethMetricKey[]
            ).map((key) => {
              const cfg = CHOROPLETH_METRIC_CONFIGS[key];
              const isSelected = selectedMetric === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedMetric(key)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    isSelected
                      ? 'bg-cyan-600 text-white shadow-2xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {cfg.label}
                </button>
              );
            })}
          </div>

          {/* Quick Region Focus Shortcuts */}
          <div className="flex items-center gap-1.5 shrink-0 text-xs">
            <span className="text-[11px] text-slate-500 font-medium">Focus:</span>
            <button
              type="button"
              onClick={() => handleFocusRegion('europe')}
              className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium cursor-pointer"
            >
              Europe
            </button>
            <button
              type="button"
              onClick={() => handleFocusRegion('asia')}
              className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium cursor-pointer"
            >
              Asia-Pacific
            </button>
            <button
              type="button"
              onClick={() => handleFocusRegion('americas')}
              className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium cursor-pointer"
            >
              Americas
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              className="p-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
              title="Reset Zoom & Pan"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Map Canvas Area with Floating Overlay Controls */}
      <div
        ref={containerRef}
        className="relative bg-slate-100 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-lg select-none transition-colors"
        style={{ minHeight: '520px' }}
      >
        {/* Interactive Floating Map Controls */}
        <div className="absolute top-4 left-4 z-20 flex flex-col gap-1.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-md">
          <button
            type="button"
            onClick={() => handleZoom(1.3)}
            className="p-2 rounded-lg text-slate-700 dark:text-slate-300 hover:text-slate-950 hover:dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Zoom In (+)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleZoom(0.77)}
            className="p-2 rounded-lg text-slate-700 dark:text-slate-300 hover:text-slate-950 hover:dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Zoom Out (-)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleResetZoom}
            className="p-2 rounded-lg text-slate-700 dark:text-slate-300 hover:text-slate-950 hover:dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Reset to Full World View"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Metric Legend & Scale Strip (Bottom Left Overlay) */}
        <div className="absolute bottom-4 left-4 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-lg text-xs max-w-sm">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-800 dark:text-slate-200 mb-1.5">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-500 dark:bg-cyan-400" />
              <span>{metricConfig.label}</span>
            </span>
            <span className="text-slate-500 dark:text-slate-400 font-mono text-[10px]">{metricConfig.unit}</span>
          </div>

          {/* Gradient color bar with quantile ticks */}
          <div
            className="h-2.5 rounded-md w-64 shadow-inner"
            style={{
              background:
                selectedMetric === 'gdpPerCapitaNominal' || selectedMetric === 'gdpPerCapitaPpp'
                  ? 'linear-gradient(to right, #cbd5e1, #818cf8, #4f46e5, #312e81)'
                  : selectedMetric === 'nominalGdp'
                  ? 'linear-gradient(to right, #e2e8f0, #34d399, #059669, #064e3b)'
                  : selectedMetric === 'gdpGrowthRate'
                  ? 'linear-gradient(to right, #fed7aa, #fb923c, #ea580c, #9a3412)'
                  : selectedMetric === 'inflationRate'
                  ? 'linear-gradient(to right, #e9d5ff, #a855f7, #7e22ce, #3b0764)'
                  : 'linear-gradient(to right, #d1fae5, #fde047, #f97316, #dc2626)',
            }}
          />

          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mt-1">
            <span>{metricConfig.formatter(metricConfig.domain[0])}</span>
            <span>{metricConfig.formatter(metricConfig.quantiles[2] || 25000)}</span>
            <span>{metricConfig.formatter(metricConfig.domain[1])}+</span>
          </div>

          {/* Active Comparison Legend Marker */}
          <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-500 ring-2 ring-white/50" />
              <span className="text-slate-300 font-semibold">{entityA.shortName} (A)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white/50" />
              <span className="text-slate-300 font-semibold">{entityB.shortName} (B)</span>
            </div>
          </div>
        </div>

        {/* SVG D3 Map Renderer */}
        <div className="w-full h-full flex items-center justify-center p-2">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto max-h-[560px] overflow-visible cursor-grab active:cursor-grabbing"
            style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))' }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMoveMap}
            onMouseUp={handleMouseUpMap}
            onMouseLeave={handleMouseUpMap}
          >
            {/* Defs for gradients & filters */}
            <defs>
              <filter id="country-hover-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#38bdf8" floodOpacity="0.6" />
              </filter>
              <filter id="entity-a-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#6366f1" floodOpacity="0.9" />
              </filter>
              <filter id="entity-b-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#10b981" floodOpacity="0.9" />
              </filter>
            </defs>

            {/* Transform Group for Zoom & Pan */}
            <g transform={`translate(${zoomTransform.x}, ${zoomTransform.y}) scale(${zoomTransform.k})`}>
              {/* Globe Ocean Backdrop */}
              <rect
                x="-100"
                y="-100"
                width={width + 200}
                height={height + 200}
                fill={isDarkMode ? '#090d16' : '#e0f2fe'}
              />

              {/* Graticule Background Grid */}
              <path
                d={pathGenerator(graticule) || ''}
                fill="none"
                stroke={isDarkMode ? '#1e293b' : '#bae6fd'}
                strokeWidth={0.5}
                strokeDasharray="2,2"
                opacity={isDarkMode ? 0.4 : 0.6}
              />

              {/* Country Polygons */}
              {countriesWithData.map(({ feature, data, uniqueKey }, index) => {
                const isA = isEntityA(data);
                const isB = isEntityB(data);
                const isHovered = hoveredCountry?.data.id === data.id;
                const isInspecting = inspectingCountry?.id === data.id;

                const metricVal = (data[selectedMetric] as number) || 0;
                const fillColor = colorScale(metricVal);

                let strokeColor = isDarkMode ? '#334155' : '#ffffff';
                let strokeWidth = 0.5;

                if (isA) {
                  strokeColor = '#818cf8';
                  strokeWidth = 2.0;
                } else if (isB) {
                  strokeColor = '#34d399';
                  strokeWidth = 2.0;
                } else if (isHovered || isInspecting) {
                  strokeColor = '#38bdf8';
                  strokeWidth = 1.6;
                }

                return (
                  <path
                    key={uniqueKey || data.id || `country-path-${index}`}
                    d={pathGenerator(feature) || ''}
                    fill={fillColor}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeLinejoin="round"
                    style={{
                      transition: 'fill 0.2s ease, stroke 0.15s ease',
                      filter: isA
                        ? 'url(#entity-a-glow)'
                        : isB
                        ? 'url(#entity-b-glow)'
                        : isHovered
                        ? 'url(#country-hover-glow)'
                        : undefined,
                    }}
                    className="cursor-pointer hover:brightness-125 transition-all"
                    onMouseEnter={(e) => {
                      const rect = containerRef.current?.getBoundingClientRect();
                      if (rect) {
                        setHoveredCountry({
                          data,
                          x: e.clientX - rect.left,
                          y: e.clientY - rect.top,
                        });
                      }
                    }}
                    onMouseMove={(e) => {
                      const rect = containerRef.current?.getBoundingClientRect();
                      if (rect) {
                        setHoveredCountry((prev) =>
                          prev
                            ? {
                                ...prev,
                                x: e.clientX - rect.left,
                                y: e.clientY - rect.top,
                              }
                            : null
                        );
                      }
                    }}
                    onMouseLeave={() => setHoveredCountry(null)}
                    onClick={() => {
                      setInspectingCountry(data);
                    }}
                  />
                );
              })}
            </g>
          </svg>
        </div>

        {/* Hover Tooltip Card (Rendered inside the container for 100% position accuracy) */}
        {hoveredCountry && (
          <div
            className="absolute z-30 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-3"
            style={{
              left: `${Math.max(120, Math.min(hoveredCountry.x, (containerRef.current?.clientWidth || 900) - 130))}px`,
              top: `${Math.max(40, hoveredCountry.y - 10)}px`,
            }}
          >
            <div className="bg-slate-950/95 backdrop-blur-md border border-slate-700/80 rounded-xl p-3 shadow-2xl text-white min-w-[220px] max-w-[280px] animate-in fade-in duration-100">
              <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2 mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-lg">{hoveredCountry.data.flag}</span>
                  <div>
                    <h4 className="text-xs font-bold leading-tight truncate">
                      {hoveredCountry.data.commonName}
                    </h4>
                    <span className="text-[10px] text-slate-400">{hoveredCountry.data.continent}</span>
                  </div>
                </div>

                {isEntityA(hoveredCountry.data) && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-500/30 text-indigo-300 border border-indigo-400/40">
                    Entity A
                  </span>
                )}
                {isEntityB(hoveredCountry.data) && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/30 text-emerald-300 border border-emerald-400/40">
                    Entity B
                  </span>
                )}
              </div>

              {/* Primary Active Metric Focus */}
              <div className="mb-2 bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                  {metricConfig.label}
                </div>
                <div className="text-base font-bold font-mono text-cyan-400 mt-0.5">
                  {metricConfig.formatter((hoveredCountry.data[selectedMetric] as number) || 0)}
                </div>
              </div>

              {/* Secondary Stats Grid */}
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
                <div>
                  <span className="text-slate-500 text-[10px] block">Nominal GDP:</span>
                  <span className="font-mono font-semibold">
                    ${Math.round(hoveredCountry.data.nominalGdp).toLocaleString()}B
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Population:</span>
                  <span className="font-mono font-semibold">
                    {hoveredCountry.data.population >= 1
                      ? `${hoveredCountry.data.population.toFixed(1)}M`
                      : `${(hoveredCountry.data.population * 1000).toFixed(0)}K`}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Real Growth:</span>
                  <span className="font-mono font-semibold text-emerald-400">
                    {hoveredCountry.data.gdpGrowthRate >= 0 ? '+' : ''}
                    {hoveredCountry.data.gdpGrowthRate.toFixed(1)}%
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Income Tier:</span>
                  <span className="font-semibold text-slate-300 truncate block">
                    {hoveredCountry.data.incomeGroup}
                  </span>
                </div>
              </div>

              <div className="mt-2.5 pt-1.5 border-t border-slate-800 text-[10px] text-cyan-400/90 text-center font-medium">
                Click country to inspect & compare
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Selected Country Detailed Inspection Card / Comparison Action Deck */}
      {inspectingCountry && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border-2 border-cyan-500/50 shadow-md animate-in fade-in duration-200">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <span className="text-4xl p-2 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                {inspectingCountry.flag}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                    Country Economic Dossier
                  </span>
                  <span className="text-slate-400">·</span>
                  <span className="text-xs text-slate-500 font-mono">{inspectingCountry.iso3}</span>
                  <span className="text-slate-400">·</span>
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    {inspectingCountry.continent}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  {inspectingCountry.commonName}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
                  {inspectingCountry.summaryNote ||
                    `${inspectingCountry.commonName} is categorized under ${inspectingCountry.incomeGroup} tier with a population of ${inspectingCountry.population}M and an annual output of $${inspectingCountry.nominalGdp}B.`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start md:self-auto">
              <button
                type="button"
                onClick={() => handleAdoptEntity(inspectingCountry, 'A')}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
                title={`Set ${inspectingCountry.commonName} into Active Comparison Slot A`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>Set as Entity A</span>
              </button>

              <button
                type="button"
                onClick={() => handleAdoptEntity(inspectingCountry, 'B')}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
                title={`Set ${inspectingCountry.commonName} into Active Comparison Slot B`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>Set as Entity B</span>
              </button>

              <button
                type="button"
                onClick={() => setInspectingCountry(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Close Dossier"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Key Indicators Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">
                Nominal GDP / Cap
              </span>
              <span className="text-base font-bold font-mono text-slate-900 dark:text-white mt-0.5 block">
                ${Math.round(inspectingCountry.gdpPerCapitaNominal).toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400">Market Rate</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">
                PPP GDP / Cap
              </span>
              <span className="text-base font-bold font-mono text-slate-900 dark:text-white mt-0.5 block">
                ${Math.round(inspectingCountry.gdpPerCapitaPpp).toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400">Purchasing Power</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">
                Total Output (GDP)
              </span>
              <span className="text-base font-bold font-mono text-slate-900 dark:text-white mt-0.5 block">
                ${Math.round(inspectingCountry.nominalGdp).toLocaleString()}B
              </span>
              <span className="text-[10px] text-slate-400">
                PPP: ${Math.round(inspectingCountry.gdpPpp).toLocaleString()}B
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">
                Real GDP Growth
              </span>
              <span
                className={`text-base font-bold font-mono mt-0.5 block ${
                  inspectingCountry.gdpGrowthRate >= 2.0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : inspectingCountry.gdpGrowthRate >= 0
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {inspectingCountry.gdpGrowthRate >= 0 ? '+' : ''}
                {inspectingCountry.gdpGrowthRate.toFixed(1)}%
              </span>
              <span className="text-[10px] text-slate-400">Annual YoY</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">
                Inflation (CPI)
              </span>
              <span className="text-base font-bold font-mono text-slate-900 dark:text-white mt-0.5 block">
                {inspectingCountry.inflationRate.toFixed(1)}%
              </span>
              <span className="text-[10px] text-slate-400">Consumer Index</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">
                Public Debt / GDP
              </span>
              <span className="text-base font-bold font-mono text-slate-900 dark:text-white mt-0.5 block">
                {(inspectingCountry.publicDebtToGdp || 50).toFixed(1)}%
              </span>
              <span className="text-[10px] text-slate-400">Gross Sovereign</span>
            </div>
          </div>

          {/* Key Industries & Navigation Links */}
          {inspectingCountry.keyIndustries && inspectingCountry.keyIndustries.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-slate-600 dark:text-slate-400">
                  Leading Economic Engines:
                </span>
                {inspectingCountry.keyIndustries.map((ind, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-[11px]"
                  >
                    {ind}
                  </span>
                ))}
              </div>

              {onJumpToTab && (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      handleAdoptEntity(inspectingCountry, 'A');
                      onJumpToTab('charts');
                    }}
                    className="text-cyan-600 dark:text-cyan-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <span>View in Interactive Charts</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Global Country Ranking & Indicator Directory Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
              Global GDP Per Capita & Economic Leaderboard
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Ranked comparative directory sorted by {metricConfig.label}. Filter by continent or search by name.
            </p>
          </div>

          {/* Search & Continent Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search country..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-500 w-44"
              />
            </div>

            <select
              value={selectedContinent}
              onChange={(e) => setSelectedContinent(e.target.value)}
              className="px-3 py-1.5 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer"
            >
              <option value="all">All Continents</option>
              <option value="Americas">Americas</option>
              <option value="Europe">Europe</option>
              <option value="Asia-Pacific">Asia-Pacific</option>
              <option value="Africa">Africa</option>
              <option value="Middle East">Middle East</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                <th className="py-2.5 px-3 font-semibold">Rank</th>
                <th className="py-2.5 px-3 font-semibold">Country</th>
                <th className="py-2.5 px-3 font-semibold">Continent</th>
                <th className="py-2.5 px-3 font-semibold text-right">Nominal GDP / Cap</th>
                <th className="py-2.5 px-3 font-semibold text-right">PPP GDP / Cap</th>
                <th className="py-2.5 px-3 font-semibold text-right">Nominal GDP</th>
                <th className="py-2.5 px-3 font-semibold text-right">Real Growth</th>
                <th className="py-2.5 px-3 font-semibold text-center">Comparison Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredCountryRows.slice(0, 15).map(({ data, uniqueKey }, idx) => {
                const isA = isEntityA(data);
                const isB = isEntityB(data);

                return (
                  <tr
                    key={uniqueKey || data.id || `country-row-${idx}`}
                    className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                      isA
                        ? 'bg-indigo-50/50 dark:bg-indigo-950/30'
                        : isB
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/30'
                        : ''
                    }`}
                  >
                    <td className="py-2.5 px-3 font-mono text-slate-400">#{idx + 1}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      <span className="text-base">{data.flag}</span>
                      <span>{data.commonName}</span>
                      {isA && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-bold bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                          Slot A
                        </span>
                      )}
                      {isB && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                          Slot B
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400">{data.continent}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                      ${Math.round(data.gdpPerCapitaNominal).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-600 dark:text-slate-300">
                      ${Math.round(data.gdpPerCapitaPpp).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-600 dark:text-slate-300">
                      ${Math.round(data.nominalGdp).toLocaleString()}B
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-medium">
                      <span
                        className={
                          data.gdpGrowthRate >= 2.0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : data.gdpGrowthRate >= 0
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }
                      >
                        {data.gdpGrowthRate >= 0 ? '+' : ''}
                        {data.gdpGrowthRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setInspectingCountry(data);
                          }}
                          className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium transition-colors cursor-pointer text-[11px]"
                        >
                          Inspect
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAdoptEntity(data, 'A')}
                          className="px-2 py-1 rounded bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 font-medium transition-colors cursor-pointer text-[11px]"
                          title={`Set as Comparison Entity A`}
                        >
                          Set A
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAdoptEntity(data, 'B')}
                          className="px-2 py-1 rounded bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 font-medium transition-colors cursor-pointer text-[11px]"
                          title={`Set as Comparison Entity B`}
                        >
                          Set B
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
