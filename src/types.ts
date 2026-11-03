export type EntityType = 'country' | 'region';

export type ContinentalRegion = 'Americas' | 'Europe' | 'Asia-Pacific' | 'Middle East & Africa';

export interface SectorShare {
  agriculture: number; // percentage
  industry: number;    // percentage
  services: number;    // percentage
  techAndFinance?: number; // percentage sub-component of services/industry
}

export interface HistoricalDataPoint {
  year: number;
  nominalGdp: number; // in billions USD
  gdpPerCapita: number; // in USD
}

export interface EconomicEntity {
  id: string;
  name: string;
  shortName: string;
  type: EntityType;
  countryId?: string; // For regions, ID of the parent country
  countryName?: string; // For regions, name of parent country
  flag: string; // Unicode flag emoji or emblem
  continent: ContinentalRegion;
  currency: string;
  currencySymbol: string;
  
  // Core Indicators
  nominalGdp: number;          // in Billions USD (e.g. 28780 for $28.78 Trillion)
  gdpPpp: number;              // in Billions Int$ PPP
  gdpPerCapitaNominal: number; // in USD
  gdpPerCapitaPpp: number;     // in Int$ PPP
  population: number;          // in Millions
  gdpGrowthRate: number;       // Annual % real GDP growth
  inflationRate: number;       // % CPI YoY
  unemploymentRate: number;    // %
  publicDebtToGdp: number;     // % of GDP
  hdi: number;                 // Human Development Index (0 - 1.0)
  
  // Structure & Trade
  sectorShare: SectorShare;
  tradeBalance?: number;       // in Billions USD
  exports?: number;            // in Billions USD
  imports?: number;            // in Billions USD
  topIndustries: string[];
  
  // Time Series & Insights
  history: HistoricalDataPoint[];
  globalGdpRank: number;       // Global ranking if compared as an independent economic entity
  capitalOrMajorCity: string;
  summaryNote: string;
}

export interface CuratedComparison {
  id: string;
  title: string;
  subtitle: string;
  entityAId: string;
  entityBId: string;
  tag: string;
}

export type MilestoneCategory = 'fiscal' | 'monetary' | 'macro_shock' | 'reform_trade';

export interface EconomicMilestone {
  id: string;
  year: number;
  entityId: string; // 'global' or entity ID (e.g. 'us', 'gb', 'us-ca', 'de', 'cn', etc.)
  entityName?: string;
  title: string;
  category: MilestoneCategory;
  description: string;
  policyDetails?: string;
  impactType: 'positive' | 'negative' | 'neutral' | 'policy_shift';
  keyStat?: string;
}

export interface MetricCorrelation {
  metricName: string; // e.g. "Real GDP Growth", "Inflation Rate (CPI)", "Unemployment Rate", "Public Debt-to-GDP", "Trade Balance"
  observedChange: string; // e.g. "+0.6% YoY growth", "-0.8% deficit reduction", "+120 bps rate pressure"
  impactDirection: 'positive' | 'negative' | 'neutral' | 'divergent';
  correlationType: 'direct_driver' | 'counter_cyclical' | 'structural_lag' | 'leading_indicator';
  explanation: string;
}

export interface GlobalMacroTrend {
  id: string;
  title: string;
  theme: 'monetary' | 'trade' | 'commodities' | 'technology' | 'geopolitics';
  headline: string;
  description: string;
  impactA: {
    type: 'tailwind' | 'headwind' | 'neutral';
    summary: string;
  };
  impactB: {
    type: 'tailwind' | 'headwind' | 'neutral';
    summary: string;
  };
  keyMetricLink?: string;
  correlation?: MetricCorrelation;
}

export interface EconomicNewsArticle {
  id: string;
  title: string;
  summary: string;
  entity: string;
  category: 'fiscal' | 'monetary' | 'growth' | 'trade' | 'reform' | 'tech';
  source: string;
  url: string;
  date?: string;
  correlation?: MetricCorrelation;
}

export interface EconomicNewsResponse {
  source: 'google_search_grounding' | 'curated_fallback';
  macroBriefing: string;
  searchedQueries: string[];
  articles: EconomicNewsArticle[];
  globalTrends?: GlobalMacroTrend[];
  webSources?: Array<{ uri: string; title: string }>;
  searchEntryPoint?: string | null;
  error?: string;
}

export type ChartColorThemeId =
  | 'indigo-emerald'
  | 'colorblind-safe'
  | 'high-contrast'
  | 'tritanopia'
  | 'warm-sunset';

export interface ChartColorPalette {
  id: ChartColorThemeId;
  name: string;
  subtitle: string;
  colorA: string;
  colorB: string;
  colorC: string;
  bgBadgeA: string;
  bgBadgeB: string;
  bgBadgeC: string;
  textBadgeA: string;
  textBadgeB: string;
  textBadgeC: string;
}

export interface CountrySpotlightData {
  source: 'gemini_3_8_flash' | 'curated_fallback';
  entityId: string;
  entityName: string;
  shortName: string;
  flag: string;
  executiveHeadline: string;
  momentumRating: 'Accelerating' | 'Steady Growth' | 'Moderating' | 'Elevated Vulnerability';
  paragraphs: [string, string, string];
  strengths: Array<{ title: string; detail: string; indicatorLink?: string }>;
  risks: Array<{ title: string; detail: string; indicatorLink?: string }>;
  keySignals: Array<{ label: string; value: string; assessment: string }>;
  generatedAt: string;
}

// ==========================================
// FISCAL POLICY ANALYZER TYPES
// ==========================================

export type FiscalFocusAngle =
  | 'all'
  | 'deficit_debt'
  | 'taxation'
  | 'industrial_subsidies'
  | 'welfare_demographics';

export interface FiscalPillar {
  pillar: string;
  description: string;
  impact: string;
}

export interface EconomicReform {
  year: string;
  title: string;
  description: string;
  strategicGoal: string;
  budgetScale?: string;
}

export interface EntityFiscalProfile {
  name: string;
  shortName: string;
  flag: string;
  fiscalPosture: 'Expansionary' | 'Neutral / Moderate' | 'Consolidative / Austere' | 'Targeted Stimulus';
  fiscalHealthRating: 'Robust / Low Risk' | 'Moderate Risk' | 'Elevated Deficit Stress' | 'High Debt Strain';
  deficitTrend: string;
  headlineStrategy: string;
  corePillars: FiscalPillar[];
  recentReforms: EconomicReform[];
  strengths: string[];
  vulnerabilities: string[];
}

export interface SideBySideComparisonItem {
  domain: string;
  entityAStance: string;
  entityBStance: string;
  contrastTakeaway: string;
  advantageEntity?: 'entityA' | 'entityB' | 'neutral';
}

export interface FiscalPolicyAnalysisResponse {
  source: 'gemini_3_8_flash' | 'curated_fallback';
  executiveSynthesis: string;
  divergenceScore: number; // 1 - 10
  keyPhilosophicalContrast: string;
  focusAngle: string;
  customQuestion?: string;
  customAnswer?: string;
  entityA: EntityFiscalProfile;
  entityB: EntityFiscalProfile;
  sideBySideComparison: SideBySideComparisonItem[];
  strategicOutlook: {
    sharedChallenges: string[];
    policyLessons: string[];
    implicationsForGrowth: string;
  };
  error?: string;
}

export interface RecentComparisonItem {
  id: string;
  entityAId: string;
  entityBId: string;
  entityA: EconomicEntity;
  entityB: EconomicEntity;
  timestamp: number;
}

export interface CopilotScenarioPreset {
  id: string;
  title: string;
  tagline: string;
  category: 'monetary' | 'trade' | 'supply_chain' | 'fiscal' | 'geopolitical' | 'tech';
  description: string;
  promptTemplate: string;
  severityLabel: string;
}

export interface CopilotIndicatorProjection {
  indicator: string;
  entityAProjection: {
    baseline: string;
    projectedShift: string;
    impactVector: 'positive' | 'negative' | 'neutral' | 'volatile';
    deltaBps: string;
  };
  entityBProjection: {
    baseline: string;
    projectedShift: string;
    impactVector: 'positive' | 'negative' | 'neutral' | 'volatile';
    deltaBps: string;
  };
  divergenceTakeaway: string;
}

export interface CopilotTransmissionMechanism {
  title: string;
  entityAResponse: string;
  entityBResponse: string;
  divergenceFactor: string;
}

export type HistoricalMetricKey =
  | 'nominalGdp'
  | 'gdpPerCapita'
  | 'gdpGrowthRate'
  | 'inflationRate'
  | 'unemploymentRate'
  | 'publicDebtToGdp'
  | 'growthIndex';

export interface CopilotAnalysisResult {
  source: 'gemini_3_8_flash' | 'curated_fallback';
  scenarioTitle: string;
  query: string;
  executiveThesis: string[];
  keyTransmissionMechanisms: CopilotTransmissionMechanism[];
  asymmetricVulnerabilities: {
    entityA: string[];
    entityB: string[];
  };
  projections: CopilotIndicatorProjection[];
  policyRecommendations: {
    entityA: string;
    entityB: string;
  };
  discussedMultiYearMetrics?: HistoricalMetricKey[];
  timestamp: string;
  error?: string;
}

export interface CopilotChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  scenarioTitle?: string;
  analysisResult?: CopilotAnalysisResult;
  discussedMetrics?: HistoricalMetricKey[];
}


