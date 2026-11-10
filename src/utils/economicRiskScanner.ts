import { EconomicEntity } from '../types';

export type RiskSeverity = 'critical' | 'high' | 'moderate' | 'low';

export type RiskCategory =
  | 'fiscal_debt'
  | 'inflation'
  | 'growth_stagnation'
  | 'unemployment'
  | 'external_trade'
  | 'structural_concentration';

export interface RedFlagAlert {
  id: string;
  category: RiskCategory;
  severity: RiskSeverity;
  entity: EconomicEntity;
  indicatorName: string;
  currentValue: number;
  formattedValue: string;
  thresholdValue: string;
  title: string;
  summary: string;
  transmissionRisk: string;
  copilotPrompt: string;
}

export interface RiskDimensionScore {
  category: RiskCategory;
  name: string;
  scoreA: number; // 0 - 100 (higher = worse risk)
  scoreB: number;
  severityA: RiskSeverity;
  severityB: RiskSeverity;
  metricLabel: string;
  valueA: number;
  valueB: number;
  formattedValA: string;
  formattedValB: string;
  benchmarkThreshold: string;
  insight: string;
}

export interface EntityRiskProfile {
  entity: EconomicEntity;
  overallScore: number; // 0 - 100 (higher = riskier)
  overallTier: RiskSeverity;
  criticalCount: number;
  highCount: number;
  moderateCount: number;
  primaryVulnerability: string;
  fiscalSpaceAssessment: string;
}

export interface ComprehensiveRiskAssessment {
  entityAProfile: EntityRiskProfile;
  entityBProfile: EntityRiskProfile;
  relativeRiskWinner: 'A' | 'B' | 'parity'; // entity with lower risk
  divergenceScore: number;
  totalAlertsCount: number;
  criticalAlertsCount: number;
  redFlags: RedFlagAlert[];
  dimensions: RiskDimensionScore[];
  executiveRiskDossier: string;
}

/**
 * Maps score (0 - 100) to standard RiskSeverity
 */
export function getSeverityFromScore(score: number): RiskSeverity {
  if (score >= 70) return 'critical';
  if (score >= 50) return 'high';
  if (score >= 30) return 'moderate';
  return 'low';
}

/**
 * Calculates risk score (0-100) and assesses red flags for sovereign debt
 */
function evaluateDebtRisk(entity: EconomicEntity): {
  score: number;
  severity: RiskSeverity;
  redFlag: RedFlagAlert | null;
} {
  const debt = entity.publicDebtToGdp;
  let score = 0;
  if (debt >= 130) score = 95;
  else if (debt >= 110) score = 80;
  else if (debt >= 90) score = 65;
  else if (debt >= 75) score = 45;
  else if (debt >= 60) score = 30;
  else score = Math.max(10, Math.round((debt / 60) * 25));

  const severity = getSeverityFromScore(score);
  let redFlag: RedFlagAlert | null = null;

  if (severity === 'critical' || severity === 'high') {
    redFlag = {
      id: `${entity.id}-debt-risk`,
      category: 'fiscal_debt',
      severity,
      entity,
      indicatorName: 'Public Debt to GDP',
      currentValue: debt,
      formattedValue: `${debt.toFixed(1)}% GDP`,
      thresholdValue: 'Threshold: >90% (High), >110% (Critical)',
      title: `${entity.shortName}: Severe Sovereign Debt Leverage`,
      summary: `${entity.name}'s sovereign public debt stands at ${debt.toFixed(1)}% of GDP, well above the Maastricht 60% standard and IMF prudential safety corridors.`,
      transmissionRisk: 'High borrowing yields erode discretionary fiscal space. Future budget deficits must absorb rising interest debt service, leaving minimal buffer for economic shocks.',
      copilotPrompt: `How vulnerable is ${entity.name} to higher global refinancing rates given its ${debt.toFixed(1)}% public debt-to-GDP ratio compared to ${entity.shortName}?`,
    };
  }

  return { score, severity, redFlag };
}

/**
 * Calculates risk score and assesses inflation red flags
 */
function evaluateInflationRisk(entity: EconomicEntity): {
  score: number;
  severity: RiskSeverity;
  redFlag: RedFlagAlert | null;
} {
  const infl = entity.inflationRate;
  let score = 0;

  if (infl >= 7.0) score = 90;
  else if (infl >= 5.0) score = 75;
  else if (infl >= 3.8) score = 55;
  else if (infl >= 2.8) score = 35;
  else if (infl >= 1.5) score = 15; // Healthy 2% zone
  else if (infl >= 0.5) score = 25; // Disinflation
  else score = 70; // Deflation threat (<0.5%)

  const severity = getSeverityFromScore(score);
  let redFlag: RedFlagAlert | null = null;

  if (severity === 'critical' || severity === 'high' || infl < 0.2) {
    const isDeflation = infl < 0.5;
    redFlag = {
      id: `${entity.id}-inflation-risk`,
      category: 'inflation',
      severity: isDeflation ? 'high' : severity,
      entity,
      indicatorName: 'Inflation Rate (CPI YoY)',
      currentValue: infl,
      formattedValue: `${infl.toFixed(1)}% YoY`,
      thresholdValue: isDeflation ? 'Threshold: <0.5% (Deflation Trap)' : 'Threshold: >4.5% (Rapid Inflation)',
      title: isDeflation
        ? `${entity.shortName}: Persistent Deflation / Sub-Target Drag`
        : `${entity.shortName}: Rapid Price Inflation Pressure`,
      summary: isDeflation
        ? `${entity.name} faces sub-target price growth (${infl.toFixed(1)}%), generating consumer postponement and debt-deflation headwinds.`
        : `${entity.name}'s annual CPI inflation of ${infl.toFixed(1)}% outpaces standard central bank targets, depressing real consumer purchasing power.`,
      transmissionRisk: isDeflation
        ? 'Real debt liabilities swell in purchasing terms, discouraging corporate capital investments and domestic credit expansion.'
        : 'Forces restrictive monetary policy, increases commercial debt financing costs, and triggers wage-price friction across key sectors.',
      copilotPrompt: `Analyze the inflation trajectory of ${entity.name} (${infl.toFixed(1)}%) versus peer benchmarks and its transmission into monetary policy tightening.`,
    };
  }

  return { score, severity, redFlag };
}

/**
 * Calculates growth stagnation / recession vulnerability
 */
function evaluateGrowthRisk(entity: EconomicEntity): {
  score: number;
  severity: RiskSeverity;
  redFlag: RedFlagAlert | null;
} {
  const growth = entity.gdpGrowthRate;
  let score = 0;

  if (growth < 0.0) score = 95; // Outright recession
  else if (growth <= 0.8) score = 75; // Stagnation
  else if (growth <= 1.4) score = 55; // Sluggish
  else if (growth <= 2.2) score = 30; // Modest
  else score = Math.max(10, Math.round(30 - (growth - 2.2) * 5)); // Strong growth

  const severity = getSeverityFromScore(score);
  let redFlag: RedFlagAlert | null = null;

  if (severity === 'critical' || severity === 'high') {
    const isContraction = growth < 0.0;
    redFlag = {
      id: `${entity.id}-growth-risk`,
      category: 'growth_stagnation',
      severity,
      entity,
      indicatorName: 'Real GDP Growth Rate',
      currentValue: growth,
      formattedValue: `${growth > 0 ? '+' : ''}${growth.toFixed(1)}%`,
      thresholdValue: 'Threshold: <0% (Contraction), <1.0% (Stagnation)',
      title: isContraction
        ? `${entity.shortName}: Economic Contraction / Recession Shock`
        : `${entity.shortName}: Persistent Output Stagnation`,
      summary: isContraction
        ? `${entity.name} is registering negative real economic growth (${growth.toFixed(1)}%), triggering output gap expansion.`
        : `${entity.name}'s real growth rate of ${growth.toFixed(1)}% sits under potential output, indicating weak domestic aggregate demand.`,
      transmissionRisk: 'Stagnant output compresses tax revenues, widens fiscal deficits, and raises default risk across cyclical industries.',
      copilotPrompt: `Provide an executive stress-test on how ${entity.name} can escape economic stagnation (${growth.toFixed(1)}% growth) compared to ${entity.shortName}.`,
    };
  }

  return { score, severity, redFlag };
}

/**
 * Calculates labor slack and unemployment stress
 */
function evaluateLaborRisk(entity: EconomicEntity): {
  score: number;
  severity: RiskSeverity;
  redFlag: RedFlagAlert | null;
} {
  const unemp = entity.unemploymentRate;
  let score = 0;

  if (unemp >= 11.0) score = 90;
  else if (unemp >= 8.0) score = 70;
  else if (unemp >= 6.0) score = 50;
  else if (unemp >= 4.5) score = 30;
  else score = Math.max(10, Math.round(unemp * 5));

  const severity = getSeverityFromScore(score);
  let redFlag: RedFlagAlert | null = null;

  if (severity === 'critical' || severity === 'high') {
    redFlag = {
      id: `${entity.id}-labor-risk`,
      category: 'unemployment',
      severity,
      entity,
      indicatorName: 'Unemployment Rate',
      currentValue: unemp,
      formattedValue: `${unemp.toFixed(1)}%`,
      thresholdValue: 'Threshold: >7.0% (Elevated), >10% (Severe)',
      title: `${entity.shortName}: Elevated Labor Market Slack`,
      summary: `${entity.name} maintains an unemployment rate of ${unemp.toFixed(1)}%, signaling underutilized labor capacity and elevated social safety net costs.`,
      transmissionRisk: 'Persistent labor slack dampens consumer spending, impairs domestic tax bases, and risks human capital erosion.',
      copilotPrompt: `Evaluate structural labor market bottlenecks in ${entity.name} (${unemp.toFixed(1)}% unemployment) compared to ${entity.shortName}.`,
    };
  }

  return { score, severity, redFlag };
}

/**
 * Calculates external trade imbalance & balance of payments risk
 */
function evaluateTradeRisk(entity: EconomicEntity): {
  score: number;
  severity: RiskSeverity;
  redFlag: RedFlagAlert | null;
} {
  const trade = entity.tradeBalance ?? (entity.exports && entity.imports ? entity.exports - entity.imports : 0);
  const gdp = Math.max(1, entity.nominalGdp);
  const tradeGdpPct = (trade / gdp) * 100;
  let score = 0;

  if (tradeGdpPct <= -5.5) score = 85; // Large current account deficit vulnerability
  else if (tradeGdpPct <= -3.0) score = 65; // Moderate deficit
  else if (tradeGdpPct <= -1.0) score = 40; // Manageable deficit
  else if (tradeGdpPct <= 4.0) score = 20; // Balanced
  else if (tradeGdpPct <= 9.0) score = 30; // Solid surplus
  else score = 45; // Extreme export dependency vulnerability

  const severity = getSeverityFromScore(score);
  let redFlag: RedFlagAlert | null = null;

  if (tradeGdpPct <= -3.5) {
    redFlag = {
      id: `${entity.id}-trade-risk`,
      category: 'external_trade',
      severity: tradeGdpPct <= -5.5 ? 'critical' : 'high',
      entity,
      indicatorName: 'Merchandise Trade Deficit / GDP',
      currentValue: tradeGdpPct,
      formattedValue: `${tradeGdpPct.toFixed(1)}% of GDP ($${Math.abs(Math.round(trade))}B deficit)`,
      thresholdValue: 'Threshold: Deficit > 3.5% of GDP',
      title: `${entity.shortName}: Large External Trade Imbalance`,
      summary: `${entity.name} runs an external merchandise deficit equivalent to ${Math.abs(tradeGdpPct).toFixed(1)}% of GDP, reliant on foreign financing inflows.`,
      transmissionRisk: 'Elevates foreign exchange vulnerability during global risk-off rotations; persistent deficits require sustained capital account inflows.',
      copilotPrompt: `Assess balance of payment risks and foreign currency exposure for ${entity.name}'s trade deficit (${tradeGdpPct.toFixed(1)}% of GDP).`,
    };
  }

  return { score, severity, redFlag };
}

/**
 * Calculates structural sector monoculture or demographic vulnerability
 */
function evaluateStructuralRisk(entity: EconomicEntity): {
  score: number;
  severity: RiskSeverity;
  redFlag: RedFlagAlert | null;
} {
  const services = entity.sectorShare.services;
  const hdi = entity.hdi;
  let score = 20;

  if (services >= 85 || services <= 40) score += 25; // Sector skew
  if (hdi < 0.75) score += 40;
  else if (hdi < 0.85) score += 20;

  const severity = getSeverityFromScore(score);
  let redFlag: RedFlagAlert | null = null;

  if (hdi < 0.80) {
    redFlag = {
      id: `${entity.id}-structural-risk`,
      category: 'structural_concentration',
      severity: 'moderate',
      entity,
      indicatorName: 'Human Development & Structural Capital',
      currentValue: hdi,
      formattedValue: `HDI: ${hdi.toFixed(3)}`,
      thresholdValue: 'Threshold: HDI < 0.82',
      title: `${entity.shortName}: Structural Development Gap`,
      summary: `${entity.name}'s HDI index (${hdi.toFixed(3)}) indicates potential long-term human capital constraints relative to advanced sovereign peers.`,
      transmissionRisk: 'Limits long-term Total Factor Productivity (TFP) growth and high-tech sector transition.',
      copilotPrompt: `Compare long-term human capital development and structural productivity between ${entity.name} and ${entity.shortName}.`,
    };
  }

  return { score, severity, redFlag };
}

/**
 * Automatically scans both selected entities and computes a comprehensive risk dossier
 */
export function scanEconomicRisks(
  entityA: EconomicEntity,
  entityB: EconomicEntity
): ComprehensiveRiskAssessment {
  // 1. Evaluate Entity A
  const debtA = evaluateDebtRisk(entityA);
  const inflA = evaluateInflationRisk(entityA);
  const growthA = evaluateGrowthRisk(entityA);
  const laborA = evaluateLaborRisk(entityA);
  const tradeA = evaluateTradeRisk(entityA);
  const structA = evaluateStructuralRisk(entityA);

  // 2. Evaluate Entity B
  const debtB = evaluateDebtRisk(entityB);
  const inflB = evaluateInflationRisk(entityB);
  const growthB = evaluateGrowthRisk(entityB);
  const laborB = evaluateLaborRisk(entityB);
  const tradeB = evaluateTradeRisk(entityB);
  const structB = evaluateStructuralRisk(entityB);

  // Aggregate Red Flags
  const allFlags: RedFlagAlert[] = [
    debtA.redFlag,
    inflA.redFlag,
    growthA.redFlag,
    laborA.redFlag,
    tradeA.redFlag,
    structA.redFlag,
    debtB.redFlag,
    inflB.redFlag,
    growthB.redFlag,
    laborB.redFlag,
    tradeB.redFlag,
    structB.redFlag,
  ].filter((f): f is RedFlagAlert => f !== null);

  // Sort red flags by severity (critical first, then high, then moderate)
  const severityRank: Record<RiskSeverity, number> = {
    critical: 4,
    high: 3,
    moderate: 2,
    low: 1,
  };
  allFlags.sort((a, b) => severityRank[b.severity] - severityRank[a.severity]);

  // Overall Score Calculation
  // Weights: Debt (30%), Inflation (25%), Growth (20%), Labor (15%), Trade (10%)
  const computeOverall = (
    debt: number,
    infl: number,
    growth: number,
    labor: number,
    trade: number
  ) => {
    return Math.round(
      debt * 0.3 + infl * 0.25 + growth * 0.2 + labor * 0.15 + trade * 0.1
    );
  };

  const scoreTotalA = computeOverall(
    debtA.score,
    inflA.score,
    growthA.score,
    laborA.score,
    tradeA.score
  );
  const scoreTotalB = computeOverall(
    debtB.score,
    inflB.score,
    growthB.score,
    laborB.score,
    tradeB.score
  );

  const getPrimaryVulnerability = (
    debt: number,
    infl: number,
    growth: number,
    labor: number,
    trade: number
  ) => {
    const scores = [
      { name: 'Sovereign Debt Leverage', score: debt },
      { name: 'Inflationary Pressures', score: infl },
      { name: 'Growth Stagnation', score: growth },
      { name: 'Labor Slack', score: labor },
      { name: 'External Deficit Exposure', score: trade },
    ];
    scores.sort((a, b) => b.score - a.score);
    return scores[0].name;
  };

  const flagsA = allFlags.filter((f) => f.entity.id === entityA.id);
  const flagsB = allFlags.filter((f) => f.entity.id === entityB.id);

  const profileA: EntityRiskProfile = {
    entity: entityA,
    overallScore: scoreTotalA,
    overallTier: getSeverityFromScore(scoreTotalA),
    criticalCount: flagsA.filter((f) => f.severity === 'critical').length,
    highCount: flagsA.filter((f) => f.severity === 'high').length,
    moderateCount: flagsA.filter((f) => f.severity === 'moderate').length,
    primaryVulnerability: getPrimaryVulnerability(
      debtA.score,
      inflA.score,
      growthA.score,
      laborA.score,
      tradeA.score
    ),
    fiscalSpaceAssessment:
      entityA.publicDebtToGdp >= 100
        ? 'Severely Constrained'
        : entityA.publicDebtToGdp >= 75
        ? 'Narrow / Moderate'
        : 'Substantial Headroom',
  };

  const profileB: EntityRiskProfile = {
    entity: entityB,
    overallScore: scoreTotalB,
    overallTier: getSeverityFromScore(scoreTotalB),
    criticalCount: flagsB.filter((f) => f.severity === 'critical').length,
    highCount: flagsB.filter((f) => f.severity === 'high').length,
    moderateCount: flagsB.filter((f) => f.severity === 'moderate').length,
    primaryVulnerability: getPrimaryVulnerability(
      debtB.score,
      inflB.score,
      growthB.score,
      laborB.score,
      tradeB.score
    ),
    fiscalSpaceAssessment:
      entityB.publicDebtToGdp >= 100
        ? 'Severely Constrained'
        : entityB.publicDebtToGdp >= 75
        ? 'Narrow / Moderate'
        : 'Substantial Headroom',
  };

  // Dimensions side-by-side array
  const dimensions: RiskDimensionScore[] = [
    {
      category: 'fiscal_debt',
      name: 'Sovereign Debt Leverage',
      scoreA: debtA.score,
      scoreB: debtB.score,
      severityA: debtA.severity,
      severityB: debtB.severity,
      metricLabel: 'Public Debt / GDP',
      valueA: entityA.publicDebtToGdp,
      valueB: entityB.publicDebtToGdp,
      formattedValA: `${entityA.publicDebtToGdp.toFixed(1)}%`,
      formattedValB: `${entityB.publicDebtToGdp.toFixed(1)}%`,
      benchmarkThreshold: '< 60% Maastricht Safe Corridor',
      insight:
        entityA.publicDebtToGdp > entityB.publicDebtToGdp
          ? `${entityA.shortName} carries a +${(entityA.publicDebtToGdp - entityB.publicDebtToGdp).toFixed(1)}pp higher sovereign debt load.`
          : `${entityB.shortName} carries a +${(entityB.publicDebtToGdp - entityA.publicDebtToGdp).toFixed(1)}pp higher sovereign debt load.`,
    },
    {
      category: 'inflation',
      name: 'Inflationary Shock / CPI',
      scoreA: inflA.score,
      scoreB: inflB.score,
      severityA: inflA.severity,
      severityB: inflB.severity,
      metricLabel: 'CPI YoY',
      valueA: entityA.inflationRate,
      valueB: entityB.inflationRate,
      formattedValA: `${entityA.inflationRate.toFixed(1)}%`,
      formattedValB: `${entityB.inflationRate.toFixed(1)}%`,
      benchmarkThreshold: '2.0% Central Bank Price Target',
      insight:
        Math.abs(entityA.inflationRate - 2.0) > Math.abs(entityB.inflationRate - 2.0)
          ? `${entityA.shortName} deviates further from target price stability.`
          : `${entityB.shortName} deviates further from target price stability.`,
    },
    {
      category: 'growth_stagnation',
      name: 'Output Growth & Recession Risk',
      scoreA: growthA.score,
      scoreB: growthB.score,
      severityA: growthA.severity,
      severityB: growthB.severity,
      metricLabel: 'Real GDP Growth',
      valueA: entityA.gdpGrowthRate,
      valueB: entityB.gdpGrowthRate,
      formattedValA: `${entityA.gdpGrowthRate > 0 ? '+' : ''}${entityA.gdpGrowthRate.toFixed(1)}%`,
      formattedValB: `${entityB.gdpGrowthRate > 0 ? '+' : ''}${entityB.gdpGrowthRate.toFixed(1)}%`,
      benchmarkThreshold: '> 2.0% Potential Trend',
      insight:
        entityA.gdpGrowthRate >= entityB.gdpGrowthRate
          ? `${entityA.shortName} holds a +${(entityA.gdpGrowthRate - entityB.gdpGrowthRate).toFixed(1)}pp growth premium.`
          : `${entityB.shortName} holds a +${(entityB.gdpGrowthRate - entityA.gdpGrowthRate).toFixed(1)}pp growth premium.`,
    },
    {
      category: 'unemployment',
      name: 'Labor Slack & Underemployment',
      scoreA: laborA.score,
      scoreB: laborB.score,
      severityA: laborA.severity,
      severityB: laborB.severity,
      metricLabel: 'Unemployment Rate',
      valueA: entityA.unemploymentRate,
      valueB: entityB.unemploymentRate,
      formattedValA: `${entityA.unemploymentRate.toFixed(1)}%`,
      formattedValB: `${entityB.unemploymentRate.toFixed(1)}%`,
      benchmarkThreshold: '< 5.0% NAIRU / Full Employment',
      insight:
        entityA.unemploymentRate < entityB.unemploymentRate
          ? `${entityA.shortName} displays a tighter labor market by ${(entityB.unemploymentRate - entityA.unemploymentRate).toFixed(1)}pp.`
          : `${entityB.shortName} displays a tighter labor market by ${(entityA.unemploymentRate - entityB.unemploymentRate).toFixed(1)}pp.`,
    },
    {
      category: 'external_trade',
      name: 'External Balance of Payments',
      scoreA: tradeA.score,
      scoreB: tradeB.score,
      severityA: tradeA.severity,
      severityB: tradeB.severity,
      metricLabel: 'Trade Balance / GDP',
      valueA: entityA.tradeBalance ?? 0,
      valueB: entityB.tradeBalance ?? 0,
      formattedValA:
        entityA.tradeBalance !== undefined
          ? `${entityA.tradeBalance >= 0 ? '+' : ''}$${Math.round(entityA.tradeBalance)}B`
          : 'N/A',
      formattedValB:
        entityB.tradeBalance !== undefined
          ? `${entityB.tradeBalance >= 0 ? '+' : ''}$${Math.round(entityB.tradeBalance)}B`
          : 'N/A',
      benchmarkThreshold: 'Balanced Trade Account (± 2% GDP)',
      insight:
        (entityA.tradeBalance ?? 0) >= (entityB.tradeBalance ?? 0)
          ? `${entityA.shortName} registers a stronger net merchandise balance.`
          : `${entityB.shortName} registers a stronger net merchandise balance.`,
    },
  ];

  const relativeRiskWinner =
    scoreTotalA < scoreTotalB ? 'A' : scoreTotalB < scoreTotalA ? 'B' : 'parity';
  const divergenceScore = Math.abs(scoreTotalA - scoreTotalB);

  // Generate executive risk synthesis
  const safest = relativeRiskWinner === 'A' ? entityA : entityB;
  const vulnerable = relativeRiskWinner === 'A' ? entityB : entityA;
  const executiveRiskDossier =
    allFlags.length === 0
      ? `Both ${entityA.name} and ${entityB.name} display resilient macroeconomic baselines with no critical fiscal red flags detected.`
      : `${vulnerable.name} exhibits elevated systemic vulnerability (Risk Index: ${Math.max(scoreTotalA, scoreTotalB)}/100) compared to ${safest.name} (Risk Index: ${Math.min(scoreTotalA, scoreTotalB)}/100). Primary stress factors stem from ${vulnerable.shortName}'s ${relativeRiskWinner === 'A' ? profileB.primaryVulnerability.toLowerCase() : profileA.primaryVulnerability.toLowerCase()}, narrowing policy flexibility.`;

  return {
    entityAProfile: profileA,
    entityBProfile: profileB,
    relativeRiskWinner,
    divergenceScore,
    totalAlertsCount: allFlags.length,
    criticalAlertsCount: allFlags.filter((f) => f.severity === 'critical').length,
    redFlags: allFlags,
    dimensions,
    executiveRiskDossier,
  };
}
