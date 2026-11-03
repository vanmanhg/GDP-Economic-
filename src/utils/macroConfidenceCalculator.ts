import { EconomicEntity, CopilotAnalysisResult } from '../types';

export type SentimentLevel =
  | 'bullish'
  | 'resilient'
  | 'neutral'
  | 'cautious'
  | 'bearish';

export interface MacroConfidencePillars {
  fiscalBuffer: number;      // 0 - 100
  growthEngine: number;      // 0 - 100
  inflationShield: number;   // 0 - 100
  laborResilience: number;   // 0 - 100
  externalTrade: number;     // 0 - 100
}

export interface MacroConfidenceScore {
  score: number; // 0 - 100 integer
  sentiment: 'Bullish / Robust' | 'Resilient / Stable' | 'Neutral / Balanced' | 'Cautious / Vulnerable' | 'Elevated Risk / Bearish';
  sentimentLevel: SentimentLevel;
  sentimentColor: string; // Tailwind color class
  pillars: MacroConfidencePillars;
  primaryStrength: string;
  primaryRisk: string;
  summaryTakeaway: string;
  deltaVsPeer: number; // score - peerScore
}

/**
 * Calculates a rigorous Macroeconomic Confidence Score (0 - 100)
 * for a specific country or region within the current comparative context.
 */
export function calculateMacroConfidence(
  target: EconomicEntity,
  counterpart: EconomicEntity,
  analysisResult?: CopilotAnalysisResult | null
): MacroConfidenceScore {
  // 1. Fiscal Buffer Pillar (Debt-to-GDP, subnational constraints, fiscal space)
  const debt = target.publicDebtToGdp ?? 75;
  let fiscalBuffer = 100 - debt * 0.65;
  if (target.type === 'region') {
    // Regions often have balanced budget mandates preventing sovereign bond runaway
    fiscalBuffer += 6;
  }
  fiscalBuffer = Math.max(12, Math.min(95, Math.round(fiscalBuffer)));

  // 2. Growth Engine Pillar (Real GDP growth, per capita output scale)
  const growth = target.gdpGrowthRate ?? 2.0;
  let growthBase = 50 + growth * 14;
  const perCapita = target.gdpPerCapitaNominal || target.gdpPerCapitaPpp || 45000;
  if (perCapita > 60000) growthBase += 8;
  else if (perCapita > 40000) growthBase += 4;
  else if (perCapita < 15000) growthBase -= 6;
  const growthEngine = Math.max(15, Math.min(98, Math.round(growthBase)));

  // 3. Inflation Shield Pillar (CPI deviation from 2.0% target)
  const infl = target.inflationRate ?? 2.8;
  const inflDistance = Math.abs(infl - 2.0);
  let inflationShield = 95 - inflDistance * 16;
  if (infl > 5.0) inflationShield -= 15;
  if (infl < 0.5) inflationShield -= 10; // Deflation risk
  const finalInflationShield = Math.max(10, Math.min(96, Math.round(inflationShield)));

  // 4. Labor Resilience Pillar (Unemployment rate & HDI)
  const unemp = target.unemploymentRate ?? 4.5;
  let laborBase = 96 - (unemp - 3.2) * 9.5;
  const hdi = target.hdi ?? 0.85;
  laborBase += (hdi - 0.8) * 40;
  const laborResilience = Math.max(15, Math.min(97, Math.round(laborBase)));

  // 5. External Trade & Global Stance Pillar
  const trade = target.tradeBalance ?? 0;
  const gdp = target.nominalGdp || 2000;
  const tradeRatio = (trade / gdp) * 100; // % of GDP
  let tradeBase = 60 + tradeRatio * 4;
  if (target.globalGdpRank && target.globalGdpRank <= 5) tradeBase += 8;
  const externalTrade = Math.max(15, Math.min(96, Math.round(tradeBase)));

  // Scenario-specific stress shock adjustment if analysis has projections
  let scenarioAdjustment = 0;
  if (analysisResult?.projections) {
    const isTargetEntityA = analysisResult.policyRecommendations?.entityA !== undefined;
    const gdpProj = analysisResult.projections.find((p) => /gdp/i.test(p.indicator));
    if (gdpProj) {
      const proj = isTargetEntityA ? gdpProj.entityAProjection : gdpProj.entityBProjection;
      if (proj?.impactVector === 'positive') scenarioAdjustment += 5;
      else if (proj?.impactVector === 'negative') scenarioAdjustment -= 6;
      else if (proj?.impactVector === 'volatile') scenarioAdjustment -= 4;
    }
  }

  // Weighted Total Confidence Score (0 - 100)
  // Weightings: Growth (28%), Fiscal (24%), Inflation (20%), Labor (16%), Trade (12%)
  const rawScore =
    growthEngine * 0.28 +
    fiscalBuffer * 0.24 +
    finalInflationShield * 0.20 +
    laborResilience * 0.16 +
    externalTrade * 0.12 +
    scenarioAdjustment;

  const score = Math.max(5, Math.min(98, Math.round(rawScore)));

  // Compute counterpart score for relative delta
  const peerDebt = counterpart.publicDebtToGdp ?? 75;
  const peerGrowth = counterpart.gdpGrowthRate ?? 2.0;
  const peerInfl = counterpart.inflationRate ?? 2.8;
  const peerUnemp = counterpart.unemploymentRate ?? 4.5;
  const peerRaw =
    (100 - peerDebt * 0.65) * 0.24 +
    (50 + peerGrowth * 14) * 0.28 +
    (95 - Math.abs(peerInfl - 2.0) * 16) * 0.20 +
    (96 - (peerUnemp - 3.2) * 9.5) * 0.16 +
    60 * 0.12;
  const peerScore = Math.max(5, Math.min(98, Math.round(peerRaw)));
  const deltaVsPeer = score - peerScore;

  // Sentiment bracket
  let sentiment: MacroConfidenceScore['sentiment'] = 'Neutral / Balanced';
  let sentimentLevel: SentimentLevel = 'neutral';
  let sentimentColor = 'text-amber-600 dark:text-amber-400';

  if (score >= 80) {
    sentiment = 'Bullish / Robust';
    sentimentLevel = 'bullish';
    sentimentColor = 'text-emerald-600 dark:text-emerald-400';
  } else if (score >= 66) {
    sentiment = 'Resilient / Stable';
    sentimentLevel = 'resilient';
    sentimentColor = 'text-teal-600 dark:text-teal-400';
  } else if (score >= 50) {
    sentiment = 'Neutral / Balanced';
    sentimentLevel = 'neutral';
    sentimentColor = 'text-amber-600 dark:text-amber-400';
  } else if (score >= 35) {
    sentiment = 'Cautious / Vulnerable';
    sentimentLevel = 'cautious';
    sentimentColor = 'text-orange-600 dark:text-orange-400';
  } else {
    sentiment = 'Elevated Risk / Bearish';
    sentimentLevel = 'bearish';
    sentimentColor = 'text-rose-600 dark:text-rose-400';
  }

  // Determine top strength and risk
  const pillarList = [
    { name: 'Growth Engine', score: growthEngine, desc: `Real GDP growth at ${growth >= 0 ? '+' : ''}${growth.toFixed(1)}%` },
    { name: 'Fiscal Buffer', score: fiscalBuffer, desc: `Debt-to-GDP anchored at ${debt.toFixed(1)}%` },
    { name: 'Inflation Shield', score: finalInflationShield, desc: `CPI inflation manageable at ${infl.toFixed(1)}%` },
    { name: 'Labor Resilience', score: laborResilience, desc: `Unemployment contained at ${unemp.toFixed(1)}%` },
    { name: 'External Trade', score: externalTrade, desc: `Trade balance at $${trade >= 0 ? '+' : ''}${trade}B` },
  ];

  pillarList.sort((a, b) => b.score - a.score);
  const primaryStrength = `${pillarList[0].name} (${pillarList[0].desc})`;
  const primaryRisk = `${pillarList[pillarList.length - 1].name} (${pillarList[pillarList.length - 1].desc})`;

  const shortName = target.shortName || target.name;
  const peerShort = counterpart.shortName || counterpart.name;
  const summaryTakeaway = `${shortName} scores ${score}/100 in macroeconomic confidence (${sentiment}), ${
    deltaVsPeer > 0
      ? `outperforming ${peerShort} by +${deltaVsPeer} pts primarily via superior ${pillarList[0].name.toLowerCase()}`
      : deltaVsPeer < 0
      ? `trailing ${peerShort} by ${Math.abs(deltaVsPeer)} pts due to greater drag in ${pillarList[pillarList.length - 1].name.toLowerCase()}`
      : `on par with ${peerShort} across balanced macro aggregates`
  }.`;

  return {
    score,
    sentiment,
    sentimentLevel,
    sentimentColor,
    pillars: {
      fiscalBuffer,
      growthEngine,
      inflationShield: finalInflationShield,
      laborResilience,
      externalTrade,
    },
    primaryStrength,
    primaryRisk,
    summaryTakeaway,
    deltaVsPeer,
  };
}
