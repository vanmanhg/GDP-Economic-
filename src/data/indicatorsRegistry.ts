export type IndicatorCategoryId =
  | 'scale-output'
  | 'living-standards'
  | 'stability-growth'
  | 'trade-external'
  | 'structure-demographics';

export interface IndicatorCategoryMeta {
  id: IndicatorCategoryId;
  name: string;
  shortName: string;
  description: string;
  badgeColor: string;
}

export interface EconomicIndicatorDef {
  id: string;
  name: string;
  shortName: string;
  categoryId: IndicatorCategoryId;
  categoryName: string;
  description: string;
  economicSignificance: string;
  unit: string;
  isCurrency?: boolean;
  lowerIsBetter?: boolean;
  defaultSelected: boolean;
  tags: string[];
}

export const INDICATOR_CATEGORIES: IndicatorCategoryMeta[] = [
  {
    id: 'scale-output',
    name: 'Scale & Output',
    shortName: 'Output',
    description: 'Gross macroeconomic production scale, PPP adjustments, and global standings.',
    badgeColor: 'text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800',
  },
  {
    id: 'living-standards',
    name: 'Living Standards & Productivity',
    shortName: 'Living Standards',
    description: 'Individual prosperity, purchasing parity, and human development indicators.',
    badgeColor: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800',
  },
  {
    id: 'stability-growth',
    name: 'Macro Stability & Growth',
    shortName: 'Stability & Labor',
    description: 'Real GDP velocity, price inflation, labor utilization, and sovereign debt burden.',
    badgeColor: 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800',
  },
  {
    id: 'trade-external',
    name: 'Trade & External Balance',
    shortName: 'Trade & External',
    description: 'Cross-border merchandise trade flows, export volume, and commercial net balances.',
    badgeColor: 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800',
  },
  {
    id: 'structure-demographics',
    name: 'Economic Structure & Demographics',
    shortName: 'Structure',
    description: 'Demographic population scale and sectoral division of gross value added.',
    badgeColor: 'text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-800',
  },
];

export const ALL_INDICATORS: EconomicIndicatorDef[] = [
  // --- Scale & Output ---
  {
    id: 'nominal-gdp',
    name: 'Nominal GDP',
    shortName: 'Nominal GDP',
    categoryId: 'scale-output',
    categoryName: 'Scale & Output',
    description: 'Total market value of all finished goods and services evaluated at current exchange rates.',
    economicSignificance: 'The premier measure of aggregate commercial scale, geopolitical weight, and purchasing power on world markets.',
    unit: 'Billion USD',
    isCurrency: true,
    defaultSelected: true,
    tags: ['core', 'output', 'gdp', 'scale'],
  },
  {
    id: 'ppp-gdp',
    name: 'GDP (Purchasing Power Parity)',
    shortName: 'GDP (PPP)',
    categoryId: 'scale-output',
    categoryName: 'Scale & Output',
    description: 'Gross domestic product adjusted for relative domestic price levels and currency purchasing power.',
    economicSignificance: 'Captures the true real physical volume of output, shielding against temporary exchange rate fluctuations.',
    unit: 'Billion Int$',
    isCurrency: true,
    defaultSelected: true,
    tags: ['core', 'ppp', 'output', 'real'],
  },
  {
    id: 'global-rank',
    name: 'Global GDP Rank (Equivalent)',
    shortName: 'Global Rank',
    categoryId: 'scale-output',
    categoryName: 'Scale & Output',
    description: 'Ranking among all global sovereign economies if this entity were treated as an autonomous nation.',
    economicSignificance: 'Provides instant comparative perspective on whether subnational regions rival major world powers.',
    unit: 'Rank',
    lowerIsBetter: true,
    defaultSelected: true,
    tags: ['core', 'ranking', 'standing'],
  },

  // --- Living Standards & Productivity ---
  {
    id: 'gdp-per-capita-nominal',
    name: 'GDP Per Capita (Nominal)',
    shortName: 'Per Capita (Nom.)',
    categoryId: 'living-standards',
    categoryName: 'Living Standards & Productivity',
    description: 'Total nominal GDP divided by total population at market foreign exchange rates.',
    economicSignificance: 'Key metric of average worker productivity and economic output in international currency terms.',
    unit: 'USD',
    isCurrency: true,
    defaultSelected: true,
    tags: ['core', 'living-standards', 'per-capita', 'wages'],
  },
  {
    id: 'gdp-per-capita-ppp',
    name: 'GDP Per Capita (PPP)',
    shortName: 'Per Capita (PPP)',
    categoryId: 'living-standards',
    categoryName: 'Living Standards & Productivity',
    description: 'Per capita output adjusted for domestic price levels, rent, and local purchasing power.',
    economicSignificance: 'The gold standard for comparing the real material living standard and domestic purchasing strength of citizens.',
    unit: 'Int$',
    isCurrency: true,
    defaultSelected: true,
    tags: ['core', 'living-standards', 'ppp', 'wellbeing'],
  },
  {
    id: 'hdi',
    name: 'Human Development Index (HDI)',
    shortName: 'HDI Score',
    categoryId: 'living-standards',
    categoryName: 'Living Standards & Productivity',
    description: 'United Nations composite index assessing life expectancy, education attainment, and standard of living (0 to 1.0).',
    economicSignificance: 'Broad social metric evaluating whether monetary economic wealth translates into health, literacy, and human opportunity.',
    unit: 'Index (0-1.0)',
    defaultSelected: true,
    tags: ['core', 'human-capital', 'social', 'development'],
  },

  // --- Macro Stability & Growth ---
  {
    id: 'growth-rate',
    name: 'Real GDP Growth Rate',
    shortName: 'GDP Growth',
    categoryId: 'stability-growth',
    categoryName: 'Macro Stability & Growth',
    description: 'Annual percentage change in real gross domestic product adjusted for price inflation.',
    economicSignificance: 'Indicates macroeconomic trajectory, business cycle velocity, and economic expansion momentum.',
    unit: '% YoY',
    defaultSelected: true,
    tags: ['core', 'growth', 'velocity', 'cycle'],
  },
  {
    id: 'inflation-rate',
    name: 'Inflation Rate (CPI YoY)',
    shortName: 'Inflation (CPI)',
    categoryId: 'stability-growth',
    categoryName: 'Macro Stability & Growth',
    description: 'Annual percentage change in the Consumer Price Index, reflecting baseline living cost and goods price pressures.',
    economicSignificance: 'Moderate, stable inflation anchors long-term investment, whereas high inflation erodes consumer purchasing power.',
    unit: '% YoY',
    lowerIsBetter: true,
    defaultSelected: true,
    tags: ['core', 'inflation', 'prices', 'stability'],
  },
  {
    id: 'unemployment-rate',
    name: 'Unemployment Rate',
    shortName: 'Unemployment',
    categoryId: 'stability-growth',
    categoryName: 'Macro Stability & Growth',
    description: 'Percentage of the active civilian labor force currently seeking employment.',
    economicSignificance: 'Crucial barometer of labor market tightness, social stability, and productive factor utilization.',
    unit: '%',
    lowerIsBetter: true,
    defaultSelected: true,
    tags: ['core', 'labor', 'jobs', 'employment'],
  },
  {
    id: 'public-debt',
    name: 'Public Debt to GDP',
    shortName: 'Debt-to-GDP',
    categoryId: 'stability-growth',
    categoryName: 'Macro Stability & Growth',
    description: 'Total cumulative government/state gross debt expressed as a percentage of annual GDP.',
    economicSignificance: 'Crucial measure of sovereign creditworthiness, fiscal space for countercyclical stimulus, and debt sustainability.',
    unit: '% of GDP',
    lowerIsBetter: true,
    defaultSelected: true,
    tags: ['core', 'fiscal', 'debt', 'sovereign'],
  },

  // --- Trade & External Balance ---
  {
    id: 'trade-balance',
    name: 'Trade Balance',
    shortName: 'Trade Balance',
    categoryId: 'trade-external',
    categoryName: 'Trade & External Balance',
    description: 'Net difference between the monetary value of merchandise and commercial service exports and imports.',
    economicSignificance: 'Highlights whether an economy is a net global capital creditor or recipient of foreign goods surplus.',
    unit: 'Billion USD',
    isCurrency: true,
    defaultSelected: true,
    tags: ['trade', 'exports', 'imports', 'external'],
  },
  {
    id: 'exports',
    name: 'Gross Exports',
    shortName: 'Exports',
    categoryId: 'trade-external',
    categoryName: 'Trade & External Balance',
    description: 'Total annual monetary value of domestic goods, industrial products, and services exported abroad.',
    economicSignificance: 'Demonstrates international market competitiveness and global commercial reach of domestic industries.',
    unit: 'Billion USD',
    isCurrency: true,
    defaultSelected: false,
    tags: ['trade', 'exports', 'foreign-exchange'],
  },
  {
    id: 'imports',
    name: 'Gross Imports',
    shortName: 'Imports',
    categoryId: 'trade-external',
    categoryName: 'Trade & External Balance',
    description: 'Total annual monetary value of foreign merchandise, raw commodities, and cross-border services imported.',
    economicSignificance: 'Indicates domestic consumer market appetite and industrial reliance on foreign inputs.',
    unit: 'Billion USD',
    isCurrency: true,
    defaultSelected: false,
    tags: ['trade', 'imports', 'consumption'],
  },

  // --- Economic Structure & Demographics ---
  {
    id: 'population',
    name: 'Population Scale',
    shortName: 'Population',
    categoryId: 'structure-demographics',
    categoryName: 'Economic Structure & Demographics',
    description: 'Total resident demographic head count in millions.',
    economicSignificance: 'Defines the aggregate domestic consumer market depth and total human capital workforce capacity.',
    unit: 'Million',
    defaultSelected: true,
    tags: ['demographics', 'population', 'scale'],
  },
  {
    id: 'services-share',
    name: 'Services Sector Share',
    shortName: 'Services %',
    categoryId: 'structure-demographics',
    categoryName: 'Economic Structure & Demographics',
    description: 'Proportion of total gross value added generated by tertiary services (finance, tech, healthcare, education).',
    economicSignificance: 'Characterizes the transition into a post-industrial knowledge, digital, and professional services economy.',
    unit: '% of GDP',
    defaultSelected: false,
    tags: ['structure', 'services', 'tertiary'],
  },
  {
    id: 'industry-share',
    name: 'Industry & Manufacturing Share',
    shortName: 'Industry %',
    categoryId: 'structure-demographics',
    categoryName: 'Economic Structure & Demographics',
    description: 'Proportion of total GDP produced by secondary manufacturing, mining, construction, and heavy industrial utilities.',
    economicSignificance: 'Indicates tangible industrial production capacity, manufacturing depth, and goods export resilience.',
    unit: '% of GDP',
    defaultSelected: false,
    tags: ['structure', 'industry', 'manufacturing'],
  },
  {
    id: 'agriculture-share',
    name: 'Agriculture Sector Share',
    shortName: 'Agriculture %',
    categoryId: 'structure-demographics',
    categoryName: 'Economic Structure & Demographics',
    description: 'Proportion of GDP derived from farming, forestry, fishing, and raw primary agricultural commodities.',
    economicSignificance: 'Reflects food security sovereignty and the structural stage of economic development.',
    unit: '% of GDP',
    defaultSelected: false,
    tags: ['structure', 'agriculture', 'primary'],
  },
  {
    id: 'tech-finance-share',
    name: 'Tech & Finance Intensity',
    shortName: 'Tech & Fin %',
    categoryId: 'structure-demographics',
    categoryName: 'Economic Structure & Demographics',
    description: 'Combined share of advanced software, telecommunications, venture technology, and financial institutions in GDP.',
    economicSignificance: 'Points to technological sophistication, capital allocation agility, and frontier patent creation capacity.',
    unit: '% of GDP',
    defaultSelected: false,
    tags: ['structure', 'tech', 'finance', 'innovation'],
  },
];

export interface IndicatorPreset {
  id: string;
  name: string;
  description: string;
  indicatorIds: string[];
}

export const INDICATOR_PRESETS: IndicatorPreset[] = [
  {
    id: 'default',
    name: 'Core Macro (11)',
    description: 'The standard macroeconomic indicators comparing output, living standards, stability, and trade.',
    indicatorIds: [
      'nominal-gdp',
      'ppp-gdp',
      'global-rank',
      'gdp-per-capita-nominal',
      'gdp-per-capita-ppp',
      'hdi',
      'growth-rate',
      'inflation-rate',
      'unemployment-rate',
      'public-debt',
      'population',
    ],
  },
  {
    id: 'all',
    name: 'All Indicators (18)',
    description: 'Complete economic dashboard with all 18 indicators including trade flows and sector shares.',
    indicatorIds: ALL_INDICATORS.map((i) => i.id),
  },
  {
    id: 'growth-stability',
    name: 'Fiscal & Stability (6)',
    description: 'Focused on debt solvency, price stability, GDP growth velocity, and labor markets.',
    indicatorIds: [
      'nominal-gdp',
      'growth-rate',
      'inflation-rate',
      'unemployment-rate',
      'public-debt',
      'trade-balance',
    ],
  },
  {
    id: 'living-standards',
    name: 'Living Standards (5)',
    description: 'Quality of life, individual income benchmarks, human development, and demographics.',
    indicatorIds: [
      'gdp-per-capita-nominal',
      'gdp-per-capita-ppp',
      'hdi',
      'unemployment-rate',
      'population',
    ],
  },
  {
    id: 'trade-structure',
    name: 'Trade & Sectors (7)',
    description: 'External balances, import/export volumes, and structural breakdown of agriculture, industry, services, and tech.',
    indicatorIds: [
      'nominal-gdp',
      'trade-balance',
      'exports',
      'imports',
      'services-share',
      'industry-share',
      'tech-finance-share',
    ],
  },
];

export const DEFAULT_SELECTED_INDICATOR_IDS = [
  'nominal-gdp',
  'ppp-gdp',
  'global-rank',
  'gdp-per-capita-nominal',
  'gdp-per-capita-ppp',
  'hdi',
  'growth-rate',
  'inflation-rate',
  'unemployment-rate',
  'public-debt',
  'population',
  'trade-balance',
];

export function getIndicatorById(id: string): EconomicIndicatorDef | undefined {
  return ALL_INDICATORS.find((i) => i.id === id);
}

export function getIndicatorsByCategory(categoryId: IndicatorCategoryId): EconomicIndicatorDef[] {
  return ALL_INDICATORS.filter((i) => i.categoryId === categoryId);
}
