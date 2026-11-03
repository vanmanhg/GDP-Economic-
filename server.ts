import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return null;
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
    });
  }
  return aiClient;
}

// Timeout helper to prevent hanging requests if Gemini is 503 unavailable or rate-limited
async function callAiWithTimeout<T>(promise: Promise<T>, timeoutMs: number = 3800): Promise<T> {
  let timer: NodeJS.Timeout | null = null;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`AI generation timed out after ${timeoutMs}ms`)), timeoutMs);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

// In-memory news cache (15-minute TTL) to prevent repeated calls and quota exhaustion
interface CachedNews {
  timestamp: number;
  data: any;
}
const newsCache = new Map<string, CachedNews>();
const CACHE_TTL_MS = 15 * 60 * 1000;

// In-memory fiscal policy analysis cache (20-minute TTL)
interface CachedFiscalAnalysis {
  timestamp: number;
  data: any;
}
const fiscalCache = new Map<string, CachedFiscalAnalysis>();
const FISCAL_CACHE_TTL_MS = 20 * 60 * 1000;

// In-memory country spotlight cache (20-minute TTL)
interface CachedSpotlight {
  timestamp: number;
  data: any;
}
const spotlightCache = new Map<string, CachedSpotlight>();
const SPOTLIGHT_CACHE_TTL_MS = 20 * 60 * 1000;

function getFallbackSpotlight(entity: any) {
  const name = entity.name || entity.shortName || 'Selected Economy';
  const shortName = entity.shortName || name;
  const flag = entity.flag || '🌐';
  const gdp = entity.gdp || 1000;
  const perCapita = entity.gdpPerCapita || 45000;
  const growth = entity.gdpGrowthRate ?? 2.0;
  const inflation = entity.inflationRate ?? 2.8;
  const unemployment = entity.unemploymentRate ?? 4.5;
  const debt = entity.publicDebtToGdp ?? 80;
  const industries = entity.topIndustries || ['Services', 'Technology', 'Advanced Manufacturing'];

  const momentumRating =
    growth > 3.0 ? 'Accelerating' : growth > 1.2 ? 'Steady Growth' : growth >= 0 ? 'Moderating' : 'Elevated Vulnerability';

  const p1 = `${name} (${flag}) maintains a gross domestic product of approximately $${Math.round(gdp).toLocaleString()} billion with an annual growth trajectory currently calibrated at ${growth >= 0 ? '+' : ''}${growth.toFixed(1)}%. Macroeconomic conditions reflect ongoing adjustments to global monetary cycles, with domestic inflation standing at ${inflation.toFixed(1)}% and an unemployment level of ${unemployment.toFixed(1)}%. Household real consumption and private enterprise investment remain key pillars supporting aggregate demand across major urban and industrial centers.`;

  const p2 = `Structurally, ${shortName} possesses competitive moats anchored in ${industries.slice(0, 3).join(', ')}. With GDP per capita reaching $${Math.round(perCapita).toLocaleString()}, the economy demonstrates high labor value-add and capital efficiency. Strategic capital expenditure in digital infrastructure, supply chain modernization, and human capital continues to generate export competitiveness and attract substantial domestic and foreign direct investment.`;

  const p3 = `However, significant downside vulnerabilities persist, foremost being public debt which stands at ${debt.toFixed(1)}% of GDP. Surging debt-servicing outlays amid higher terminal interest rates constrain discretionary budgetary room for future counter-cyclical fiscal intervention. Furthermore, geoeconomic fragmentation, industrial transition costs, and demographic shifts present headwinds that demand prudent fiscal consolidation and sustained structural productivity reforms.`;

  const strengths = [
    {
      title: `High Factor Productivity & Sector Leadership`,
      detail: `World-class capability across ${industries[0] || 'core industries'} with robust per-capita output of $${Math.round(perCapita).toLocaleString()}.`,
      indicatorLink: 'GDP Per Capita & Services Share',
    },
    {
      title: `Stable Labor Market Fundamentals`,
      detail: `Unemployment contained at ${unemployment.toFixed(1)}%, ensuring resilient domestic consumption and personal income tax receipts.`,
      indicatorLink: 'Unemployment Rate',
    },
    {
      title: `Strategic Innovation & Private CAPEX`,
      detail: `High concentration of research clusters, venture investment, and enterprise technology adoption.`,
      indicatorLink: 'Real GDP Growth',
    },
    {
      title: `Resilient Macroeconomic Framework`,
      detail: `Transparent institutional oversight, established legal safeguards, and deep capital market accessibility.`,
      indicatorLink: 'Fiscal Health & Debt Anchors',
    },
  ];

  const risks = [
    {
      title: `Sovereign Debt Accumulation & Financing Pressure`,
      detail: `Debt-to-GDP at ${debt.toFixed(1)}% exposes national accounts to bond yield volatility and sovereign refinancing spreads.`,
      indicatorLink: 'Public Debt-to-GDP',
    },
    {
      title: `Persistent Core Price Strains`,
      detail: `Inflation of ${inflation.toFixed(1)}% limits central bank flexibility and tests consumer purchasing power across essential goods.`,
      indicatorLink: 'Inflation Rate (CPI)',
    },
    {
      title: `External Trade Friction & Supply Exposure`,
      detail: `Shifting bilateral trade pacts and supply-chain realignments affect primary export corridors and import input costs.`,
      indicatorLink: 'Trade Balance',
    },
    {
      title: `Structural Demographic & Entitlement Pressures`,
      detail: `Aging workforce demographics and healthcare obligations increasingly crowd out discretionary public capital investments.`,
      indicatorLink: 'Dependency Ratio & Entitlements',
    },
  ];

  const keySignals = [
    {
      label: 'Real GDP Growth',
      value: `${growth >= 0 ? '+' : ''}${growth.toFixed(1)}%`,
      assessment: growth >= 2.0 ? 'Resilient Expansion' : 'Subdued Momentum',
    },
    {
      label: 'Inflation (CPI)',
      value: `${inflation.toFixed(1)}%`,
      assessment: inflation <= 3.0 ? 'Target Range' : 'Elevated Friction',
    },
    {
      label: 'Public Debt / GDP',
      value: `${debt.toFixed(1)}%`,
      assessment: debt <= 60 ? 'Sustainable' : debt <= 100 ? 'Moderate Strain' : 'Elevated Risk',
    },
    {
      label: 'Labor Market',
      value: `${unemployment.toFixed(1)}% Unemp.`,
      assessment: unemployment <= 5.0 ? 'Tight & Strong' : 'Slack Present',
    },
  ];

  return {
    source: 'curated_fallback',
    entityId: entity.id || 'unknown',
    entityName: name,
    shortName,
    flag,
    executiveHeadline: `${name} Macro Stance: ${momentumRating === 'Accelerating' ? 'Expanding on Capital Investment & Productivity' : momentumRating === 'Steady Growth' ? 'Resilient Expansion Balancing High Refinancing Costs' : 'Navigating Structural Headwinds & Budgetary Adjustments'}`,
    momentumRating,
    paragraphs: [p1, p2, p3],
    strengths,
    risks,
    keySignals,
    generatedAt: new Date().toISOString(),
  };
}

// In-memory Macro Analyst Copilot cache (15-minute TTL)
interface CachedCopilotAnalysis {
  timestamp: number;
  data: any;
}
const copilotCache = new Map<string, CachedCopilotAnalysis>();
const COPILOT_CACHE_TTL_MS = 15 * 60 * 1000;

function getFallbackCopilotAnalysis(entityA: any, entityB: any, query: string = '', presetId?: string) {
  const nameA = entityA.name || entityA.shortName || 'Entity A';
  const nameB = entityB.name || entityB.shortName || 'Entity B';
  const shortA = entityA.shortName || nameA;
  const shortB = entityB.shortName || nameB;
  const flagA = entityA.flag || '🇺🇸';
  const flagB = entityB.flag || '🇬🇧';
  const isRegionA = entityA.type === 'region' || entityA.type === 'subnational';
  const isRegionB = entityB.type === 'region' || entityB.type === 'subnational';

  const gdpA = entityA.nominalGdp || 2500;
  const gdpB = entityB.nominalGdp || 2500;
  const growthA = entityA.gdpGrowthRate ?? 2.0;
  const growthB = entityB.gdpGrowthRate ?? 1.5;
  const inflA = entityA.inflationRate ?? 2.8;
  const inflB = entityB.inflationRate ?? 2.5;
  const unempA = entityA.unemploymentRate ?? 4.5;
  const unempB = entityB.unemploymentRate ?? 4.2;
  const debtA = entityA.publicDebtToGdp ?? 65;
  const debtB = entityB.publicDebtToGdp ?? 95;
  const tradeA = entityA.tradeBalance ?? -30;
  const tradeB = entityB.tradeBalance ?? -50;
  const indA = entityA.topIndustries || ['Technology', 'Services', 'Manufacturing'];
  const indB = entityB.topIndustries || ['Finance', 'Services', 'Advanced Engineering'];

  let scenarioTitle = 'Comparative Macroeconomic Stress Assessment';
  let deltaGdpA = -0.5;
  let deltaGdpB = -0.8;
  let deltaInflA = +0.6;
  let deltaInflB = +0.9;
  let deltaDebtA = +2.4;
  let deltaDebtB = +4.5;
  let deltaUnempA = +0.4;
  let deltaUnempB = +0.6;

  if (presetId === 'stagflation-energy' || /energy|oil|gas|stagflation/i.test(query)) {
    scenarioTitle = 'Stagflationary Energy Commodity Shock Simulation';
    deltaGdpA = -0.7;
    deltaGdpB = -1.2;
    deltaInflA = +1.4;
    deltaInflB = +1.9;
    deltaDebtA = +3.1;
    deltaDebtB = +5.2;
    deltaUnempA = +0.5;
    deltaUnempB = +0.8;
  } else if (presetId === 'yield-curve-shock' || /yield|rate|interest|tightening|hiking/i.test(query)) {
    scenarioTitle = 'Rapid 200 bps Yield Spike & Refinancing Squeeze';
    deltaGdpA = -0.9;
    deltaGdpB = -1.1;
    deltaInflA = -0.4;
    deltaInflB = -0.3;
    deltaDebtA = +4.2;
    deltaDebtB = +7.8;
    deltaUnempA = +0.6;
    deltaUnempB = +0.7;
  } else if (presetId === 'trade-tariff-escalation' || /tariff|trade|protectionism|export/i.test(query)) {
    scenarioTitle = 'Bilateral Tariff & Export Barrier Stress Test';
    deltaGdpA = -0.6;
    deltaGdpB = -0.9;
    deltaInflA = +0.8;
    deltaInflB = +0.7;
    deltaDebtA = +1.8;
    deltaDebtB = +3.0;
    deltaUnempA = +0.4;
    deltaUnempB = +0.5;
  } else if (presetId === 'ai-productivity-dividend' || /ai|technology|productivity|automation/i.test(query)) {
    scenarioTitle = 'Hyperscale AI & Automation Productivity Scenario';
    deltaGdpA = +1.4;
    deltaGdpB = +0.8;
    deltaInflA = -0.6;
    deltaInflB = -0.4;
    deltaDebtA = -2.5;
    deltaDebtB = -1.8;
    deltaUnempA = -0.3;
    deltaUnempB = -0.1;
  } else if (presetId === 'sovereign-debt-squeeze' || /debt|fiscal|bond|spread|consolidation/i.test(query)) {
    scenarioTitle = 'Sovereign Debt Roll-Over & Fiscal Consolidation';
    deltaGdpA = -0.8;
    deltaGdpB = -1.5;
    deltaInflA = -0.2;
    deltaInflB = +0.3;
    deltaDebtA = +5.5;
    deltaDebtB = +9.4;
    deltaUnempA = +0.7;
    deltaUnempB = +1.1;
  } else if (presetId === 'supply-chain-chokepoint' || /supply|mineral|shipping|semiconductor/i.test(query)) {
    scenarioTitle = 'Critical Materials Supply Chokepoint Stress Test';
    deltaGdpA = -0.8;
    deltaGdpB = -0.7;
    deltaInflA = +1.1;
    deltaInflB = +1.0;
    deltaDebtA = +2.0;
    deltaDebtB = +2.8;
    deltaUnempA = +0.5;
    deltaUnempB = +0.4;
  }

  const p1 = `When stress-testing ${nameA} (${flagA}) against ${nameB} (${flagB}) under "${query || scenarioTitle}", macro transmission diverts primarily along their structural industrial footprints and debt servicing tolerance. ${nameA}, with an initial output of $${Math.round(gdpA).toLocaleString()}B and baseline growth of ${growthA.toFixed(1)}%, exhibits distinct resilience in ${indA.slice(0, 2).join(' and ')}, yet faces transmission friction through capital market sensitivity. Conversely, ${nameB} ($${Math.round(gdpB).toLocaleString()}B, baseline growth ${growthB.toFixed(1)}%) confronts immediate exposure through its ${indB.slice(0, 2).join(' and ')} sectors.`;

  const p2 = `A decisive axis of divergence emerges across their balance sheets and sovereign institutional frameworks. ${nameA}'s public debt burden of ${debtA.toFixed(1)}% of GDP ${isRegionA ? '(bound by subnational balanced-budget statutes)' : '(anchored by sovereign reserve currency status)'} provides a contrasting buffer to ${nameB}'s ${debtB.toFixed(1)}% debt ratio. Under elevated refinancing spreads, ${nameB} faces approximately ${(Math.abs(debtB - debtA) * 0.15).toFixed(1)}% higher annual fiscal drag from interest indexation, restricting counter-cyclical budget support and forcing tighter fiscal prioritization.`;

  const p3 = `Over an 18-to-36 month horizon, the equilibrium projection indicates ${deltaGdpA > deltaGdpB ? `${shortA} absorbs the shock with shallower real GDP contraction and faster private CAPEX recovery` : `${shortB} benefits from superior institutional stabilization`}. However, both economies must navigate structural second-order effects: ${shortA} must safeguard ${indA[0] || 'core sector'} employment and state revenues, while ${shortB} must protect foreign direct investment and avoid prolonged productivity hysteresis.`;

  const keyTransmissionMechanisms = [
    {
      title: 'Cost of Capital & Sovereign Refinancing Spreads',
      entityAResponse: `${shortA} (Debt: ${debtA.toFixed(1)}% of GDP) absorbs yield widening with moderate fiscal headroom, though private credit spreads temper venture and corporate CAPEX.`,
      entityBResponse: `${shortB} (Debt: ${debtB.toFixed(1)}% of GDP) experiences acute interest cost indexation, increasing sovereign debt service outlays and narrowing discretionary budget allocations.`,
      divergenceFactor: `${shortA} retains a ${(Math.abs(debtB - debtA)).toFixed(1)} percentage point debt-to-GDP advantage, creating greater counter-cyclical flexibility.`,
    },
    {
      title: 'Domestic Sector Value-Add & Supply Chain Elasticity',
      entityAResponse: `Concentration in ${indA.slice(0, 2).join(', ')} provides pricing power and intangible asset protection, though supply bottlenecks elevate input costs.`,
      entityBResponse: `Reliance on ${indB.slice(0, 2).join(', ')} offers diversified services revenue, but exposes domestic operating margins to international terms-of-trade shifts.`,
      divergenceFactor: `${shortA}'s intellectual property concentration yields higher margin absorption compared to ${shortB}'s trade-exposed cost structure.`,
    },
    {
      title: 'Labor Market Cushion & Real Disposable Income',
      entityAResponse: `Unemployment base of ${unempA.toFixed(1)}% widens slightly, buffered by high-productivity services and resilient labor reallocation.`,
      entityBResponse: `Unemployment base of ${unempB.toFixed(1)}% faces pressure in energy-intensive and consumer-facing services, dampening household consumption.`,
      divergenceFactor: `Real wage elasticity differs by ${(Math.abs(growthA - growthB)).toFixed(1)}% due to disparate productivity gains and collective bargaining structures.`,
    },
  ];

  const asymmetricVulnerabilities = {
    entityA: [
      `High revenue sensitivity to asset market valuations, corporate profits, and top-tier income tax receipts.`,
      `${isRegionA ? 'Statutory constitutional restriction against deficit financing during prolonged regional recessions.' : 'Persistent trade deficit requiring foreign capital inflows to maintain balance of payments.'}`,
      `Elevated living and business operating costs that amplify consumer margin compression during price spikes.`,
    ],
    entityB: [
      `Higher baseline debt load (${debtB.toFixed(1)}% of GDP) leaving minimal leeway for untargeted fiscal stimulus.`,
      `Sustained dependence on imported intermediate energy and manufactured goods (${tradeB < 0 ? `Trade deficit of $${Math.abs(tradeB)}B` : 'Import reliance'}).`,
      `Long-term total factor productivity lag dampening the speed of post-shock supply-side recovery.`,
    ],
  };

  const projections = [
    {
      indicator: 'Real GDP Growth',
      entityAProjection: {
        baseline: `${growthA.toFixed(1)}%`,
        projectedShift: `${(growthA + deltaGdpA).toFixed(1)}%`,
        impactVector: deltaGdpA >= 0 ? 'positive' : 'negative',
        deltaBps: `${deltaGdpA >= 0 ? '+' : ''}${Math.round(deltaGdpA * 100)} bps`,
      },
      entityBProjection: {
        baseline: `${growthB.toFixed(1)}%`,
        projectedShift: `${(growthB + deltaGdpB).toFixed(1)}%`,
        impactVector: deltaGdpB >= 0 ? 'positive' : 'negative',
        deltaBps: `${deltaGdpB >= 0 ? '+' : ''}${Math.round(deltaGdpB * 100)} bps`,
      },
      divergenceTakeaway: `${shortA} outpaces ${shortB} by ${Math.abs(Math.round((deltaGdpA - deltaGdpB) * 100))} bps due to higher value-add industry insulation.`,
    },
    {
      indicator: 'Inflation (CPI YoY)',
      entityAProjection: {
        baseline: `${inflA.toFixed(1)}%`,
        projectedShift: `${(inflA + deltaInflA).toFixed(1)}%`,
        impactVector: deltaInflA <= 0 ? 'positive' : deltaInflA > 1.0 ? 'volatile' : 'negative',
        deltaBps: `${deltaInflA >= 0 ? '+' : ''}${Math.round(deltaInflA * 100)} bps`,
      },
      entityBProjection: {
        baseline: `${inflB.toFixed(1)}%`,
        projectedShift: `${(inflB + deltaInflB).toFixed(1)}%`,
        impactVector: deltaInflB <= 0 ? 'positive' : deltaInflB > 1.0 ? 'volatile' : 'negative',
        deltaBps: `${deltaInflB >= 0 ? '+' : ''}${Math.round(deltaInflB * 100)} bps`,
      },
      divergenceTakeaway: `${shortB} absorbs ${Math.abs(Math.round((deltaInflB - deltaInflA) * 100))} bps higher headline pressure due to import pass-through.`,
    },
    {
      indicator: 'Unemployment Rate',
      entityAProjection: {
        baseline: `${unempA.toFixed(1)}%`,
        projectedShift: `${(unempA + deltaUnempA).toFixed(1)}%`,
        impactVector: deltaUnempA <= 0 ? 'positive' : 'negative',
        deltaBps: `${deltaUnempA >= 0 ? '+' : ''}${Math.round(deltaUnempA * 100)} bps`,
      },
      entityBProjection: {
        baseline: `${unempB.toFixed(1)}%`,
        projectedShift: `${(unempB + deltaUnempB).toFixed(1)}%`,
        impactVector: deltaUnempB <= 0 ? 'positive' : 'negative',
        deltaBps: `${deltaUnempB >= 0 ? '+' : ''}${Math.round(deltaUnempB * 100)} bps`,
      },
      divergenceTakeaway: `Labor market divergence remains moderate, anchored by resilient services employment in both entities.`,
    },
    {
      indicator: 'Public Debt-to-GDP',
      entityAProjection: {
        baseline: `${debtA.toFixed(1)}%`,
        projectedShift: `${(debtA + deltaDebtA).toFixed(1)}%`,
        impactVector: deltaDebtA <= 0 ? 'positive' : 'negative',
        deltaBps: `${deltaDebtA >= 0 ? '+' : ''}${Math.round(deltaDebtA * 100)} bps`,
      },
      entityBProjection: {
        baseline: `${debtB.toFixed(1)}%`,
        projectedShift: `${(debtB + deltaDebtB).toFixed(1)}%`,
        impactVector: deltaDebtB <= 0 ? 'positive' : 'negative',
        deltaBps: `${deltaDebtB >= 0 ? '+' : ''}${Math.round(deltaDebtB * 100)} bps`,
      },
      divergenceTakeaway: `${shortB}'s debt ratio deteriorates by ${Math.round((deltaDebtB - deltaDebtA) * 100)} bps more due to compounding refinancing costs.`,
    },
  ];

  const policyRecommendations = {
    entityA: `Prioritize liquidity preservation in state/budgetary stabilization reserves, incentivize domestic technological investment, and protect low-income households from utility rate shocks.`,
    entityB: `Maintain strict medium-term debt trajectory discipline to anchor sovereign bond yields, accelerate strategic energy grid interconnects, and expand permanent full expensing for private industrial capital.`,
  };

  return {
    source: 'curated_fallback',
    scenarioTitle,
    query: query || scenarioTitle,
    executiveThesis: [p1, p2, p3],
    keyTransmissionMechanisms,
    asymmetricVulnerabilities,
    projections,
    policyRecommendations,
    discussedMultiYearMetrics: [
      'gdpGrowthRate',
      'inflationRate',
      'publicDebtToGdp',
      'unemploymentRate',
      'nominalGdp',
      'gdpPerCapita',
    ],
    timestamp: new Date().toISOString(),
  };
}

function getFallbackNews(entityA: any, entityB: any) {
  const nameA = entityA.name || entityA.shortName || 'Economy A';
  const nameB = entityB.name || entityB.shortName || 'Economy B';
  const shortA = entityA.shortName || nameA;
  const shortB = entityB.shortName || nameB;
  const isSubnationalA = entityA.type === 'subnational' || entityA.type === 'region';
  const isSubnationalB = entityB.type === 'subnational' || entityB.type === 'region';

  const bankA = isSubnationalA ? `${nameA} Economic Council` : `${nameA} Central Bank`;
  const bankB = isSubnationalB ? `${nameB} Treasury` : `${nameB} Central Bank`;

  const globalTrends = [
    {
      id: 'trend-monetary-rates',
      title: 'Global Monetary Policy & Neutral Rate Divergence',
      theme: 'monetary',
      headline: 'Central banks navigate diverging terminal rates, impacting sovereign debt service costs.',
      description: 'Major central banks face contrasting growth trajectories and sticky service inflation, driving currency volatility and variable borrowing costs across developed and regional markets.',
      impactA: {
        type: (entityA.publicDebtToGdp ?? 80) > 100 ? 'headwind' : 'neutral',
        summary: `With public debt at ${entityA.publicDebtToGdp ?? 'approx 80'}% of GDP, refinancing costs remain sensitive to benchmark yield curves and long-dated bond spreads.`,
      },
      impactB: {
        type: (entityB.publicDebtToGdp ?? 80) > 100 ? 'headwind' : 'neutral',
        summary: `Yield levels affect domestic mortgage refinancing and sovereign debt trajectory, constraining discretionary budgetary room.`,
      },
      keyMetricLink: 'Public Debt-to-GDP & Inflation Rate',
      correlation: {
        metricName: 'Inflation Rate (CPI)',
        observedChange: 'Rate transmission & terminal policy spread divergence',
        impactDirection: 'divergent',
        correlationType: 'direct_driver',
        explanation: 'Central bank terminal rate calibration directly dictates domestic refinancing costs and credit expansion.',
      },
    },
    {
      id: 'trend-trade-tariffs',
      title: 'Geoeconomic Fragmentation & Industrial Subsidies',
      theme: 'trade',
      headline: 'Strategic tariff frameworks and friend-shoring reshape international trade corridors.',
      description: 'Global trade policies increasingly prioritize domestic manufacturing security, localized critical minerals access, and selective export controls over pure low-cost efficiency.',
      impactA: {
        type: (entityA.tradeBalance ?? 0) < 0 ? 'headwind' : 'tailwind',
        summary: `${shortA}'s ${entityA.topIndustries?.[0] || 'core sector'} confronts evolving compliance rules, tariff scrutiny, and supply-chain diversification demands.`,
      },
      impactB: {
        type: (entityB.tradeBalance ?? 0) < 0 ? 'headwind' : 'tailwind',
        summary: `Trade partners adapt to new bilateral trade pacts and supply-chain resilience mandates across advanced manufacturing and services.`,
      },
      keyMetricLink: 'Gross Exports, Imports & Trade Balance',
      correlation: {
        metricName: 'Trade Balance',
        observedChange: 'Bilateral export margin re-allocation & input tariff friction',
        impactDirection: (entityA.tradeBalance ?? 0) < 0 ? 'negative' : 'positive',
        correlationType: 'direct_driver',
        explanation: 'Strategic friend-shoring and tariffs directly alter trade balances and sovereign currency flows.',
      },
    },
    {
      id: 'trend-ai-tech-boom',
      title: 'AI Infrastructure & High-Performance Computing Boom',
      theme: 'technology',
      headline: 'Hyperscale data center investments and AI adoption stimulate structural productivity.',
      description: 'Trillions in private capital expenditure flow into semiconductor fabrication, power grid interconnects, and enterprise automation, driving cross-border technological leadership.',
      impactA: {
        type: entityA.topIndustries?.some((ind: string) => /tech|software|hardware|semiconductor/i.test(ind)) ? 'tailwind' : 'neutral',
        summary: `${shortA} captures significant venture capital and hardware deployment, driving tech services output and corporate tax generation.`,
      },
      impactB: {
        type: entityB.topIndustries?.some((ind: string) => /finance|fintech|biotech|advanced/i.test(ind)) ? 'tailwind' : 'neutral',
        summary: `Enterprise adoption accelerates automation in professional services and financial infrastructure.`,
      },
      keyMetricLink: 'Services Share & Per Capita Productivity',
      correlation: {
        metricName: 'Real GDP Growth',
        observedChange: '+0.4% to +0.8% structural productivity lift in services',
        impactDirection: 'positive',
        correlationType: 'leading_indicator',
        explanation: 'Private CAPEX in compute and automation creates high-multiplier value-add reflected in GDP per capita.',
      },
    },
    {
      id: 'trend-energy-transition',
      title: 'Global Energy Rebalancing & Clean Transition CAPEX',
      theme: 'commodities',
      headline: 'Renewable deployment accelerates alongside fossil fuel volatility and power grid strains.',
      description: 'Electrification mandates and industrial decarbonization necessitate unprecedented capital investment in green hydrogen, battery storage, and transmission networks.',
      impactA: {
        type: 'tailwind',
        summary: `Strategic clean energy initiatives and emission targets create high-multiplier green jobs, though industrial electricity tariffs require careful monitoring.`,
      },
      impactB: {
        type: 'neutral',
        summary: `Balancing energy security against net-zero targets shapes sovereign capital allocations and industrial competitiveness.`,
      },
      keyMetricLink: 'Industry Share & Infrastructure Multipliers',
      correlation: {
        metricName: 'Public Debt-to-GDP',
        observedChange: 'Surge in state co-financing & transition bond issuance',
        impactDirection: 'neutral',
        correlationType: 'structural_lag',
        explanation: 'Long-term clean infrastructure mandates require significant upfront capital expenditure.',
      },
    },
  ];

  return {
    source: 'curated_fallback',
    macroBriefing: `Latest macroeconomic briefing for ${nameA} and ${nameB}: Monetary and fiscal authorities monitor growth indicators and persistent price pressures, balancing fiscal discipline against targeted investments in infrastructure and strategic industries.`,
    searchedQueries: [
      `${nameA} economic growth and fiscal policy updates`,
      `${nameB} central bank interest rates inflation outlook`,
      `${nameA} vs ${nameB} trade flows and industrial strategy`,
    ],
    globalTrends,
    articles: [
      {
        id: `fb-${entityA.id || 'a'}-1`,
        title: `${bankA} Reviews Economic Trajectory and Growth Outlook`,
        summary: `Macroeconomic analysts evaluate labor market resilience and price indexes, pointing to a data-driven fiscal and monetary trajectory over the coming quarters.`,
        entity: nameA,
        category: isSubnationalA ? 'fiscal' : 'monetary',
        source: 'Financial Times',
        url: 'https://www.ft.com',
        date: 'Recent',
        correlation: {
          metricName: 'Inflation Rate (CPI)',
          observedChange: `${(entityA.inflationRate ?? 2.8).toFixed(1)}% annual print`,
          impactDirection: (entityA.inflationRate ?? 2.8) > 3.0 ? 'negative' : 'positive',
          correlationType: 'direct_driver',
          explanation: `Central bank policy guidance anchors inflationary expectations and influences domestic credit conditions for ${shortA}.`,
        },
      },
      {
        id: `fb-${entityB.id || 'b'}-2`,
        title: `${bankB} Outlines Multi-Year Strategic Investment and Fiscal Program`,
        summary: `Policy officials present updated budgetary priorities focused on digital transformation, energy resilience, and public sector balance sheet health.`,
        entity: nameB,
        category: 'fiscal',
        source: 'Reuters',
        url: 'https://www.reuters.com',
        date: 'Recent',
        correlation: {
          metricName: 'Public Debt-to-GDP',
          observedChange: `${(entityB.publicDebtToGdp ?? 85).toFixed(1)}% debt ratio`,
          impactDirection: (entityB.publicDebtToGdp ?? 85) > 90 ? 'negative' : 'neutral',
          correlationType: 'structural_lag',
          explanation: `Multi-year capital allocations directly determine ${shortB}'s sovereign deficit and debt-to-GDP trajectory.`,
        },
      },
      {
        id: `fb-joint-3`,
        title: `Comparative Economic Trends: ${nameA} and ${nameB} Commercial Dynamics`,
        summary: `Cross-border trade, capital allocation, and supply-chain realignments continue to shape bilateral economic ties amid changing global trade policies.`,
        entity: 'Both / Global',
        category: 'trade',
        source: 'Bloomberg Economics',
        url: 'https://www.bloomberg.com',
        date: 'Recent',
        correlation: {
          metricName: 'Trade Balance',
          observedChange: `Bilateral balance: ${shortA} ${(entityA.tradeBalance ?? 0) >= 0 ? 'Surplus' : 'Deficit'} vs ${shortB} ${(entityB.tradeBalance ?? 0) >= 0 ? 'Surplus' : 'Deficit'}`,
          impactDirection: 'divergent',
          correlationType: 'direct_driver',
          explanation: `Cross-border commercial trade flows and tariff barriers directly determine net export contributions to GDP.`,
        },
      },
      {
        id: `fb-${entityA.id || 'a'}-4`,
        title: `${nameA} Productivity and Domestic Output Indicators Show Stability`,
        summary: `Recent regional accounts indicate sustained service sector performance and private capital expenditure despite shifting international headwinds.`,
        entity: nameA,
        category: 'growth',
        source: 'Wall Street Journal',
        url: 'https://www.wsj.com',
        date: 'Recent',
        correlation: {
          metricName: 'Real GDP Growth',
          observedChange: `${(entityA.gdpGrowthRate ?? 2.1) >= 0 ? '+' : ''}${(entityA.gdpGrowthRate ?? 2.1).toFixed(1)}% annual rate`,
          impactDirection: (entityA.gdpGrowthRate ?? 2.1) > 2.0 ? 'positive' : 'neutral',
          correlationType: 'direct_driver',
          explanation: `Private investment in services and consumer demand sustain headline real GDP growth rate.`,
        },
      },
      {
        id: `fb-${entityB.id || 'b'}-5`,
        title: `${nameB} Advances Industrial Policy and Technology Sector Incentives`,
        summary: `Targeted structural reforms aim to accelerate advanced manufacturing, renewable power infrastructure, and research & development funding.`,
        entity: nameB,
        category: 'reform',
        source: 'The Economist',
        url: 'https://www.economist.com',
        date: 'Recent',
        correlation: {
          metricName: 'Unemployment Rate',
          observedChange: `${(entityB.unemploymentRate ?? 4.2).toFixed(1)}% unemployment`,
          impactDirection: 'positive',
          correlationType: 'leading_indicator',
          explanation: `Targeted manufacturing incentives stimulate domestic employment and raise labor participation rates.`,
        },
      },
      {
        id: `fb-joint-6`,
        title: `OECD & IMF Publish Macroeconomic Assessment on ${nameA} and ${nameB}`,
        summary: `International multilateral reports project diverging productivity metrics, evaluating sovereign debt-to-GDP trajectories and inflation forecasts.`,
        entity: 'Both / Global',
        category: 'growth',
        source: 'OECD Macroeconomic Reports',
        url: 'https://www.oecd.org',
        date: 'Recent',
        correlation: {
          metricName: 'GDP Per Capita',
          observedChange: `$${Math.round(entityA.gdpPerCapita || 65000).toLocaleString()} vs $${Math.round(entityB.gdpPerCapita || 48000).toLocaleString()}`,
          impactDirection: 'divergent',
          correlationType: 'structural_lag',
          explanation: `Total factor productivity gains and institutional capital allocation drive persistent living standard differences.`,
        },
      },
    ],
  };
}

// Helper to assemble detailed curated fiscal profiles
function getEntityFiscalProfile(entity: any): any {
  const id = entity.id || '';
  const name = entity.name || entity.shortName || 'Economy';
  const flag = entity.flag || '🌐';
  const debt = entity.publicDebtToGdp ?? 75;
  const isSubnational = entity.type === 'region' || entity.type === 'subnational';

  if (id === 'us') {
    return {
      name: 'United States',
      shortName: 'USA',
      flag: '🇺🇸',
      fiscalPosture: 'Expansionary',
      fiscalHealthRating: 'Elevated Deficit Stress',
      deficitTrend: '-6.2% of GDP (~$1.9T annual federal deficit)',
      headlineStrategy: 'Supply-side modern industrial strategy combining large-scale strategic subsidies (semiconductors, clean tech) with structural entitlement spending and heavy reliance on Treasury market liquidity.',
      corePillars: [
        {
          pillar: 'Industrial Policy & Subsidies',
          description: 'Federal tax credits and direct grants catalyzing domestic manufacturing, clean energy deployment, and advanced semiconductor fabrication.',
          impact: 'Accelerated private CAPEX in high-tech manufacturing; increased medium-term federal outlays.',
        },
        {
          pillar: 'Federal Taxation & Revenue',
          description: 'Flat 21% federal corporate income tax rate, TCJA individual brackets, and 15% corporate alternative minimum tax (CAMT).',
          impact: 'High business investment responsiveness, balanced against lower structural tax revenue collection as a % of GDP (approx 16-17%).',
        },
        {
          pillar: 'Mandatory Entitlement Obligations',
          description: 'Social Security, Medicare, Medicaid, and rising net interest payments consuming over 65% of annual federal budgetary receipts.',
          impact: 'Non-discretionary spending locks in persistent deficits regardless of political administration.',
        },
        {
          pillar: 'Treasury Debt Issuance',
          description: 'World reserve currency status allows immense debt absorption, but surging net interest expense surpasses defense spending.',
          impact: 'Heightened sensitivity of federal budget balance to Federal Reserve policy rate decisions.',
        },
      ],
      recentReforms: [
        {
          year: '2022',
          title: 'Inflation Reduction Act (IRA)',
          description: 'Established uncapped 10-year clean energy tax credits, drug price negotiation for Medicare, and a 1% excise tax on corporate stock buybacks.',
          strategicGoal: 'Decarbonize the industrial energy grid and revitalize domestic battery/EV supply chains.',
          budgetScale: '$369B authorized tax credits & spending',
        },
        {
          year: '2022',
          title: 'CHIPS and Science Act',
          description: 'Provided direct funding subsidies and 25% advanced manufacturing investment tax credits for domestic semiconductor foundry construction.',
          strategicGoal: 'Reshore national defense-critical microchip fabrication and R&D facilities.',
          budgetScale: '$52.7B in direct subsidies + $24B tax incentives',
        },
        {
          year: '2021',
          title: 'Infrastructure Investment and Jobs Act (IIJA)',
          description: 'Bipartisan 5-year authorization targeting surface transportation, power grid modernization, passenger rail, and nationwide broadband rollout.',
          strategicGoal: 'Upgrade foundational physical logistics and close digital divide.',
          budgetScale: '$1.2 Trillion ($550B new federal spending)',
        },
        {
          year: '2023-2024',
          title: 'Fiscal Responsibility Act (Debt Ceiling Accord)',
          description: 'Instituted statutory caps on non-defense discretionary spending for FY2024 and FY2025, with automatic across-the-board sequestration triggers.',
          strategicGoal: 'Enforce short-term discretionary spending discipline while deferring entitlement reform.',
          budgetScale: 'Estimated ~$1.5T deficit reduction over 10 years',
        },
      ],
      strengths: [
        'Global reserve currency hegemony (USD) ensures virtually unmatched sovereign borrowing capacity.',
        'High fiscal multiplier in private innovation and capital investment via market-driven tax credits.',
        'Dynamic labor market and flexible corporate structures absorb tax shifts rapidly.',
      ],
      vulnerabilities: [
        'Annual debt service costs surpassing $1 Trillion annually as high-rate Treasury bills roll over.',
        'Entitlement trust fund depletion dates approaching in the 2030s without consensus reform.',
        'Absence of a credible medium-term fiscal anchor or binding constitutional balanced-budget rule.',
      ],
    };
  }

  if (id === 'gb') {
    return {
      name: 'United Kingdom',
      shortName: 'UK',
      flag: '🇬🇧',
      fiscalPosture: 'Consolidative / Austere',
      fiscalHealthRating: 'Moderate Risk',
      deficitTrend: '-4.4% of GDP (Steadily narrowing toward 2.0%)',
      headlineStrategy: 'Strict adherence to fiscal rules to rebuild credibility post-Gilt crisis, targeting falling debt-to-GDP within 5 years while increasing public investment through revised accounting rules.',
      corePillars: [
        {
          pillar: 'Statutory Fiscal Anchors',
          description: 'Mandate to have public sector net debt (now redefined to net financial liabilities) falling as a share of GDP in the 5th year of the forecast.',
          impact: 'Restricts discretionary departmental budgets while carving out headroom for infrastructure investments.',
        },
        {
          pillar: 'High Tax Burden & Fiscal Drag',
          description: 'Frozen personal allowance thresholds pulling workers into higher income tax bands; 25% corporation tax rate.',
          impact: 'Tax receipts reaching highest post-WWII share of GDP (~37%), depressing real disposable wage growth.',
        },
        {
          pillar: 'Targeted Capital Investment',
          description: 'Establishment of the National Wealth Fund and Great British Energy to mobilize private capital into clean transition.',
          impact: 'Directs constrained Treasury funds to co-invest alongside pension funds and sovereign partners.',
        },
        {
          pillar: 'National Health & Welfare Pressures',
          description: 'Severe strain on NHS waiting lists and escalating disability/sickness benefit rolls constraining fiscal maneuverability.',
          impact: 'Forces trade-offs between day-to-day public service delivery and capital modernization.',
        },
      ],
      recentReforms: [
        {
          year: '2024',
          title: 'Autumn Budget & Fiscal Framework Reset',
          description: 'Shifted debt target to Public Sector Net Financial Liabilities (PSNFL), raising employer National Insurance contributions and capital gains tax.',
          strategicGoal: 'Unlock ~£20-30B in balance sheet space for transport, schools, and NHS hospital construction.',
          budgetScale: '£40B annual tax increase package',
        },
        {
          year: '2023',
          title: 'Permanent Full Expensing Reform',
          description: 'Allowed businesses to write off 100% of the cost of qualifying plant and machinery investment against taxable profits in Year 1.',
          strategicGoal: 'Overcome chronic UK business underinvestment compared to G7 peers.',
          budgetScale: '£10B annual corporate investment incentive',
        },
        {
          year: '2022-2023',
          title: 'Energy Profits Levy & Fiscal Stabilization',
          description: 'Instituted 35% windfall tax on North Sea oil and gas producers alongside temporary electricity generator levy to fund household utility subsidies.',
          strategicGoal: 'Shield consumers from Ukraine shock without triggering unanchored gilt yield spikes.',
          budgetScale: 'Raised £14B+ during peak energy price spikes',
        },
      ],
      strengths: [
        'Institutional rigor overseen by the independent Office for Budget Responsibility (OBR).',
        'Deep domestic institutional gilt market supported by pension funds and international investors.',
        'Permanent capital expensing ranks among the most competitive capital allowance regimes in the OECD.',
      ],
      vulnerabilities: [
        'Near-capacity tax-to-GDP ratio limits further revenue mobilization without dampening productivity.',
        'High public debt interest indexation due to large proportion of index-linked gilts (over 20%).',
        'Persistent public sector productivity stagnation requiring higher cash injections for identical output.',
      ],
    };
  }

  if (id === 'us-ca') {
    return {
      name: 'California',
      shortName: 'California',
      flag: '🐻',
      fiscalPosture: 'Targeted Stimulus',
      fiscalHealthRating: 'Moderate Risk',
      deficitTrend: 'Constitutional balanced budget requirement (surplus/deficit managed via reserves)',
      headlineStrategy: 'Highly progressive tax structure financing nation-leading climate, education, and infrastructure projects, counter-balanced by rigid constitutional reserve replenishment rules.',
      corePillars: [
        {
          pillar: 'Progressive Revenue Mobilization',
          description: 'Top personal marginal income tax rate of 13.3% and 8.84% corporate franchise tax; top 1% taxpayers generate nearly 50% of personal income tax revenues.',
          impact: 'Extreme sensitivity to tech IPO cycles, stock market swings, and Silicon Valley capital gains.',
        },
        {
          pillar: 'Constitutional Reserve Disciplines',
          description: 'Proposition 2 mandates annual deposits into the Budget Stabilization Account (Rainy Day Fund) and school reserves during boom years.',
          impact: 'Provides tens of billions in liquidity cushions to absorb sharp revenue contractions without immediate systemic austerity.',
        },
        {
          pillar: 'Cap-and-Trade & Climate Investments',
          description: 'Auction revenues from the state Greenhouse Gas Reduction Fund dedicated to clean transit, high-speed rail, and grid decarbonization.',
          impact: 'Autonomous green financing mechanism outside the general fund.',
        },
        {
          pillar: 'Public Infrastructure Bonds',
          description: 'Frequent voter-approved General Obligation bonds funding water reservoirs, schools, wildfire mitigation, and affordable housing.',
          impact: 'Leverages high state bond ratings to spread capital costs across 30-year amortization windows.',
        },
      ],
      recentReforms: [
        {
          year: '2024',
          title: 'Proposition 4 Climate & Clean Water Bond',
          description: 'Voter-approved bond issuing $10 billion for safe drinking water, forest health, wildfire prevention, and climate-resilient coastal infrastructure.',
          strategicGoal: 'Hedge agricultural regions and urban centers against acute climate shocks.',
          budgetScale: '$10 Billion General Obligation issuance',
        },
        {
          year: '2023-2024',
          title: 'Multi-Tiered Budget Deficit Normalization Act',
          description: 'Addressed a multi-year $45B+ budget contraction using $16B in rainy day reserves, spending reductions, delayed capital outlays, and internal borrowing.',
          strategicGoal: 'Preserve core healthcare (Medi-Cal expansion) and K-12 education funding guarantees under Proposition 98.',
          budgetScale: '$45B balance sheet reconciliation',
        },
        {
          year: '2022',
          title: 'Middle Class Tax Refund & Gas Price Relief',
          description: 'Disbursed $9.5 billion in direct cash stimulus payments to 31 million residents using historical post-pandemic budget windfall surplus.',
          strategicGoal: 'Offset high retail gasoline and utility price surges during peak inflationary cycle.',
          budgetScale: '$9.5 Billion one-time rebate',
        },
      ],
      strengths: [
        'Enormous economic scale ($4.1T output) and high innovation density provides rapid taxable recovery.',
        'Substantial constitutional rainy day reserves (over $20B when fully capitalized).',
        'State-level climate regulatory mechanisms create independent revenue streams (Cap-and-Trade).',
      ],
      vulnerabilities: [
        'Revenue roller-coaster effect: heavy reliance on volatile tech stock options and capital gains.',
        'High cost of doing business and state income tax triggers selective corporate entity out-migration.',
        'Unfunded local government and CalPERS/CalSTRS public employee pension liabilities.',
      ],
    };
  }

  if (id === 'de') {
    return {
      name: 'Germany',
      shortName: 'Germany',
      flag: '🇩🇪',
      fiscalPosture: 'Consolidative / Austere',
      fiscalHealthRating: 'Robust / Low Risk',
      deficitTrend: '-1.8% of GDP (Strictly constrained by constitutional ceiling)',
      headlineStrategy: 'Constitutional debt brake (Schuldenbremse) enforcing strict balance sheet discipline, balancing industrial transformation with rigorous deficit limits.',
      corePillars: [
        {
          pillar: 'Constitutional Schuldenbremse',
          description: 'Article 115 of the Basic Law caps structural federal borrowing at 0.35% of GDP under normal macroeconomic conditions.',
          impact: 'Keeps sovereign debt-to-GDP (~63%) lowest among G7 nations; limits public investment in aging transport and energy grids.',
        },
        {
          pillar: 'Off-Budget Special Funds (Sondervermögen)',
          description: 'Dedicated multi-year vehicles such as the Bundeswehr Defense Modernization Fund (€100B) and Climate and Transformation Fund (KTF).',
          impact: 'Allows specific strategic priorities to be financed while maintaining formal federal budget compliance.',
        },
        {
          pillar: 'High Social Contribution & Payroll Surcharges',
          description: 'Comprehensive statutory social insurance system (pension, health, long-term care) financed via joint employee-employer contributions.',
          impact: 'High non-wage labor costs placing pressure on industrial competitiveness amid an aging demographic.',
        },
        {
          pillar: 'Green Industrial Support',
          description: 'Subsidies for semiconductor fabrication (e.g. Magdeburg/Dresden) and industrial electricity price discounts for energy-intensive sectors.',
          impact: 'Aims to protect heavy chemical and automotive manufacturing during power transition.',
        },
      ],
      recentReforms: [
        {
          year: '2024',
          title: 'Growth Opportunity Act (Wachstumschancengesetz)',
          description: 'Enacted €3.2 billion annual corporate tax relief package, expanding tax loss carry-backs and providing premium incentives for energy-efficiency investments.',
          strategicGoal: 'Stimulate stagnant industrial private investment and simplify corporate tax reporting.',
          budgetScale: '€3.2B annual tax relief',
        },
        {
          year: '2023',
          title: 'Constitutional Court Budget Verdict Adjustment',
          description: 'Federal Constitutional Court ruled retroactive re-allocation of €60B unused pandemic credit authorizations unconstitutional.',
          strategicGoal: 'Re-anchored federal spending strictly within the legal bounds of the debt brake.',
          budgetScale: 'Forced €60B reallocation and budget freeze',
        },
        {
          year: '2022',
          title: 'Sondervermögen Bundeswehr (Defense Special Fund)',
          description: 'Constitutional amendment creating a €100 billion debt-financed procurement vehicle for military hardware and equipment modernization.',
          strategicGoal: 'Meet NATO 2% of GDP defense expenditure guideline and upgrade military readiness.',
          budgetScale: '€100 Billion debt-financed special fund',
        },
      ],
      strengths: [
        'Lowest sovereign debt ratio in the G7 provides sterling credit rating (AAA) and minimal bond risk spreads.',
        'High export diversification and formidable Mittelstand manufacturing equity cushions.',
        'High international credibility of federal bund securities as the European benchmark asset.',
      ],
      vulnerabilities: [
        'Chronic public underinvestment in railways, bridges, digital administration, and school facilities.',
        'Fastest aging population in Western Europe placing ballooning strain on statutory pension subsidies.',
        'Rigid constitutional debt constraints inhibit counter-cyclical fiscal stimulus during manufacturing slumps.',
      ],
    };
  }

  if (id === 'cn') {
    return {
      name: 'China',
      shortName: 'China',
      flag: '🇨🇳',
      fiscalPosture: 'Expansionary',
      fiscalHealthRating: 'Moderate Risk',
      deficitTrend: '-3.8% official target (~7.5% augmented IMF fiscal deficit)',
      headlineStrategy: 'State-directed proactive fiscal policy leveraging ultra-long central government bonds, local government special bond quotas, and targeted tax breaks to fuel advanced manufacturing and debt restructuring.',
      corePillars: [
        {
          pillar: 'Ultra-Long Special Treasury Bonds',
          description: 'Issuance of dedicated 20- to 50-year sovereign bonds outside standard budget deficit targets to finance major national technological infrastructure.',
          impact: 'Shifts fiscal burden from strained local provinces to central government sovereign balance sheet.',
        },
        {
          pillar: 'Local Government Debt Refinancing',
          description: 'Massive debt-swap programs allowing local governments to issue low-interest official bonds to replace high-cost off-budget LGFV debt.',
          impact: 'Mitigates regional banking insolvency risks and unclogs municipal balance sheets.',
        },
        {
          pillar: 'Strategic Tech Tax Incentives',
          description: '15% preferential corporate income tax (vs 25% standard) for certified high-tech enterprises and 100% additional deduction for R&D outlays.',
          impact: 'World-leading R&D expenditure in batteries, solar PV, humanoid robotics, and electric vehicles.',
        },
        {
          pillar: 'Consumer Trade-in & Equipment Subsidies',
          description: 'Direct fiscal vouchers and interest rebates for consumers trading in appliances and automobiles, alongside industrial equipment upgrades.',
          impact: 'Direct attempt to stimulate domestic consumption to balance heavy export dependence.',
        },
      ],
      recentReforms: [
        {
          year: '2024',
          title: '10-Trillion-Yuan Local Government Debt Swap Program',
          description: 'Approved 6-trillion-yuan local debt ceiling increase plus 4-trillion-yuan special bond reallocation over 5 years to resolve hidden municipal debt.',
          strategicGoal: 'Free up local governments from debt service burdens so they can restart public procurement.',
          budgetScale: '10 Trillion RMB ($1.4 Trillion USD)',
        },
        {
          year: '2024',
          title: 'Ultra-Long Special Central Treasury Bond Program',
          description: '1-trillion-yuan annual quota of ultra-long special treasury bonds to support food security, digital infrastructure, and frontier science.',
          strategicGoal: 'Drive national strategic capacity without inflating regular headline budgetary deficits.',
          budgetScale: '1 Trillion RMB ($140B USD) annual tranche',
        },
        {
          year: '2024',
          title: 'National Equipment & Consumer Goods Trade-in Scheme',
          description: 'Central treasury subsidies providing cash allowances for energy-efficient home appliances and trade-in of older passenger cars for EVs.',
          strategicGoal: 'Accelerate industrial equipment efficiency and counter domestic deflationary pressures.',
          budgetScale: '300 Billion RMB ($42B USD)',
        },
      ],
      strengths: [
        'Vast domestic state banking system and capital controls allow internal absorption of sovereign debt.',
        'Unparalleled state capability to direct capital into strategic industries (EVs, clean energy, semiconductors).',
        'Relatively low explicit central government debt-to-GDP provides room for central balance sheet expansion.',
      ],
      vulnerabilities: [
        'Depressed land-sale revenues from prolonged real estate correction crippling local municipality revenues.',
        'High implicit local government financing vehicle (LGFV) debt overhang exceeding 50% of GDP.',
        'Relatively underdeveloped social safety net and pension payouts constrain household consumer spending.',
      ],
    };
  }

  if (id === 'jp') {
    return {
      name: 'Japan',
      shortName: 'Japan',
      flag: '🇯🇵',
      fiscalPosture: 'Targeted Stimulus',
      fiscalHealthRating: 'High Debt Strain',
      deficitTrend: '-5.0% of GDP (Gross debt > 250% of GDP)',
      headlineStrategy: 'High-debt fiscal expansion backed by domestic sovereign bond absorption, targeting household inflation subsidies, GX green transformation bonds, and doubling defense outlays.',
      corePillars: [
        {
          pillar: 'Supplementary Budget Packages',
          description: 'Regular multi-trillion yen supplementary budgets providing electricity/gas utility subsidies, regional revitalization grants, and one-off cash transfers.',
          impact: 'Mitigates imported inflation shocks on middle-income households while sustaining elevated fiscal deficits.',
        },
        {
          pillar: 'GX (Green Transformation) Economic Transition Bonds',
          description: 'Issuance of ¥20 trillion in government-backed green transformation bonds over a decade to catalyze private low-carbon investments.',
          impact: 'Pioneering sovereign climate transition framework repaid through future carbon pricing receipts.',
        },
        {
          pillar: 'Defense Modernization Mobilization',
          description: 'Multi-year plan to double defense spending to 2% of GDP (~¥43 trillion over 5 years), funded through expenditure reprioritization and corporate tax surcharges.',
          impact: 'Historic shift in post-war pacifist fiscal allocation.',
        },
        {
          pillar: 'Wage-Hike Corporate Tax Incentives',
          description: 'Tax deductions allowing companies raising domestic wages by over 3-4% to deduct up to 40% of the wage increase from corporate tax liability.',
          impact: 'Encouraged largest Japanese spring wage (Shunto) increases in 33 years.',
        },
      ],
      recentReforms: [
        {
          year: '2024',
          title: 'Fixed-Amount Income and Residence Tax Cut',
          description: 'One-off ¥40,000 tax reduction per individual (and family dependents) designed to offset real wage declines during inflation peak.',
          strategicGoal: 'Deliver temporary disposable income relief while long-term wage increases solidify.',
          budgetScale: '¥3.3 Trillion ($22B USD)',
        },
        {
          year: '2023',
          title: 'GX Promotion Act (Green Transition Bond Issuance)',
          description: 'Established the legal framework for the ¥20 trillion GX bond issuance program and scheduled implementation of carbon levies starting 2028.',
          strategicGoal: 'Catalyze ¥150 trillion in public-private green transformation over 10 years.',
          budgetScale: '¥20 Trillion ($130B USD) public bond program',
        },
        {
          year: '2022-2023',
          title: 'Five-Year Defense Buildup Plan',
          description: 'Comprehensive reallocation committing ¥43 trillion over 5 years for counterstrike capabilities, unmanned systems, and ammunition stockpiles.',
          strategicGoal: 'Elevate Japan’s security budget to 2% of GDP in response to Indo-Pacific tensions.',
          budgetScale: '¥43 Trillion ($285B USD) over 5 years',
        },
      ],
      strengths: [
        'Virtually all sovereign debt is denominated in domestic currency (Yen) and held overwhelmingly by domestic institutions.',
        'World’s largest net international creditor nation with extensive overseas foreign assets providing a sovereign buffer.',
        'Exceptional social cohesion and tax compliance record.',
      ],
      vulnerabilities: [
        'Gross debt-to-GDP exceeding 250% makes budget balance acutely vulnerable to rising Bank of Japan interest rates.',
        'World’s most severe super-aged demographic (over 29% aged 65+) consuming expanding healthcare and pension budgets.',
        'Weak domestic currency (JPY) inflates import costs of energy and food, requiring recurring fiscal subsidies.',
      ],
    };
  }

  // Generic dynamic profile for any other country or subnational entity
  const posture = debt > 100 ? 'Consolidative / Austere' : debt > 60 ? 'Neutral / Moderate' : 'Expansionary';
  const health = debt > 120 ? 'High Debt Strain' : debt > 80 ? 'Elevated Deficit Stress' : debt > 50 ? 'Moderate Risk' : 'Robust / Low Risk';

  return {
    name,
    shortName: entity.shortName || name,
    flag,
    fiscalPosture: posture,
    fiscalHealthRating: health,
    deficitTrend: isSubnational ? 'Subnational Balanced Budget Rule' : `Estimated -${(debt * 0.04).toFixed(1)}% of GDP`,
    headlineStrategy: isSubnational
      ? `State/regional budget structure prioritizing education, public health, and localized infrastructure within balanced-budget statutes.`
      : `National fiscal framework balancing debt sustainability, infrastructure modernization, and domestic tax revenue collection.`,
    corePillars: [
      {
        pillar: isSubnational ? 'Regional Revenue & Transfers' : 'Tax Base Administration',
        description: isSubnational
          ? 'Combines localized sales/income taxes with intergovernmental transfers from the federal treasury.'
          : 'Corporate, personal income, and value-added/goods tax regimes designed to finance public administration.',
        impact: 'Maintains baseline public service delivery while sensitive to regional economic activity.',
      },
      {
        pillar: 'Public Investment & Infrastructure',
        description: 'Capital outlays directed toward transportation, energy transmission, and municipal public works.',
        impact: 'Generates long-term productivity gains and supports employment in construction.',
      },
      {
        pillar: 'Social Safety Net & Public Services',
        description: 'Allocations for public healthcare, basic education, and targeted social welfare transfers.',
        impact: 'Acts as an automatic stabilizer during cyclical macroeconomic downturns.',
      },
      {
        pillar: isSubnational ? 'Municipal Bond Financing' : 'Sovereign Debt Management',
        description: isSubnational
          ? 'Use of voter-approved general obligation and revenue bonds for capital improvements.'
          : 'Issuance of medium- and long-term sovereign debt instruments to finance budgetary gaps.',
        impact: 'Requires prudent debt management to maintain favorable credit ratings.',
      },
    ],
    recentReforms: [
      {
        year: '2023-2024',
        title: isSubnational ? `${name} Capital Works & Resilience Plan` : `${name} National Budget Modernization Act`,
        description: 'Multi-year budget reorientation focusing on green transition projects, digital governance, and inflation relief.',
        strategicGoal: 'Modernize infrastructure while maintaining fiscal sustainability benchmarks.',
        budgetScale: 'Multi-billion budget allocation',
      },
      {
        year: '2022',
        title: `${name} Post-Pandemic Fiscal Recovery Framework`,
        description: 'Rationalized temporary crisis spending lines and replenished emergency fiscal stabilization reserves.',
        strategicGoal: 'Normalize public expenditure trajectory following extraordinary pandemic stimulus.',
        budgetScale: 'Stabilization program',
      },
    ],
    strengths: [
      'Institutional adherence to budgetary transparency and statistical standards.',
      'Targeted capital expenditure programs supporting critical regional logistics.',
      'Resilient tax compliance mechanisms and diversified revenue sources.',
    ],
    vulnerabilities: [
      debt > 80 ? 'Elevated public debt servicing burden in a higher global interest rate environment.' : 'Exposure to global commodity price swings and external demand fluctuations.',
      'Demographic shifts putting upward pressure on health and pension expenditure.',
      isSubnational ? 'Statutory inability to engage in deficit financing during acute regional recessions.' : 'Fiscal headroom constrained by mandatory non-discretionary spending.',
    ],
  };
}

function getFallbackFiscalAnalysis(entityA: any, entityB: any, focusAngle: string = 'all', customQuestion?: string) {
  const profileA = getEntityFiscalProfile(entityA);
  const profileB = getEntityFiscalProfile(entityB);
  const nameA = profileA.name;
  const nameB = profileB.name;

  // Calculate divergence score based on debt difference and postures
  const debtDiff = Math.abs((entityA.publicDebtToGdp ?? 70) - (entityB.publicDebtToGdp ?? 70));
  const divergenceScore = Math.min(9, Math.max(3, Math.round(3 + (debtDiff / 20) + (profileA.fiscalPosture !== profileB.fiscalPosture ? 2 : 0))));

  const sideBySideComparison = [
    {
      domain: 'Fiscal Rules & Debt Anchors',
      entityAStance: entityA.type === 'subnational' ? 'Strict constitutional balanced budget requirement with emergency rainy day reserves.' : `${nameA} relies on legislative caps and medium-term debt projections (Debt: ${entityA.publicDebtToGdp}% of GDP).`,
      entityBStance: entityB.type === 'subnational' ? 'Strict constitutional balanced budget requirement with emergency rainy day reserves.' : `${nameB} enforces statutory fiscal targets (Debt: ${entityB.publicDebtToGdp}% of GDP).`,
      contrastTakeaway: `${nameA} demonstrates ${entityA.publicDebtToGdp > entityB.publicDebtToGdp ? 'a higher structural debt tolerance' : 'greater debt discipline'} compared to ${nameB}'s balance sheet framework.`,
      advantageEntity: entityA.publicDebtToGdp < entityB.publicDebtToGdp ? 'entityA' : 'entityB',
    },
    {
      domain: 'Industrial Policy & Subsidies',
      entityAStance: `${profileA.corePillars[0]?.description || 'Strategic subsidies in targeted growth sectors.'}`,
      entityBStance: `${profileB.corePillars[0]?.description || 'Targeted economic incentives for priority domestic sectors.'}`,
      contrastTakeaway: `${nameA} focuses policy on ${profileA.recentReforms[0]?.strategicGoal || 'technological transition'}, whereas ${nameB} prioritizes ${profileB.recentReforms[0]?.strategicGoal || 'broad-based economic modernization'}.`,
      advantageEntity: 'neutral',
    },
    {
      domain: 'Tax Structure & Competitiveness',
      entityAStance: `${profileA.corePillars[1]?.description || 'Diversified tax collection with targeted deductions.'}`,
      entityBStance: `${profileB.corePillars[1]?.description || 'Structured corporate and personal tax collection framework.'}`,
      contrastTakeaway: `Key trade-off between ${nameA}'s revenue yield and ${nameB}'s supply-side investment incentives.`,
      advantageEntity: 'neutral',
    },
    {
      domain: 'Social Safety Net & Entitlements',
      entityAStance: `${profileA.corePillars[2]?.description || 'Social welfare and health allocations consume substantial budget share.'}`,
      entityBStance: `${profileB.corePillars[2]?.description || 'Welfare and pension commitments tied to demographic trajectory.'}`,
      contrastTakeaway: `Both entities encounter demographic cost pressures, with ${nameA} managing ${profileA.vulnerabilities[1] || 'rising outlays'} while ${nameB} faces ${profileB.vulnerabilities[1] || 'aging challenges'}.`,
      advantageEntity: 'neutral',
    },
    {
      domain: 'Deficit Financing & Headroom',
      entityAStance: `${profileA.deficitTrend}`,
      entityBStance: `${profileB.deficitTrend}`,
      contrastTakeaway: `${nameA} exhibits ${profileA.fiscalHealthRating.toLowerCase()} status, contrasted with ${nameB}'s ${profileB.fiscalHealthRating.toLowerCase()} profile.`,
      advantageEntity: profileA.fiscalHealthRating.includes('Robust') ? 'entityA' : profileB.fiscalHealthRating.includes('Robust') ? 'entityB' : 'neutral',
    },
  ];

  let customAnswer: string | undefined = undefined;
  if (customQuestion && customQuestion.trim()) {
    customAnswer = `Comparative Policy Assessment on "${customQuestion}": When evaluating ${nameA} and ${nameB}, the primary institutional divergence lies in their statutory debt flexibility and revenue mobilization mechanisms. ${nameA} (${profileA.fiscalPosture}) relies on ${profileA.headlineStrategy.slice(0, 140)}... In contrast, ${nameB} (${profileB.fiscalPosture}) prioritizes ${profileB.headlineStrategy.slice(0, 140)}... Consequently, ${nameA} possesses ${entityA.publicDebtToGdp < entityB.publicDebtToGdp ? 'greater counter-cyclical borrowing headroom' : 'a more constrained fiscal buffer'}, while ${nameB} benefits from ${profileB.strengths[0] || 'institutional credibility'}.`;
  }

  return {
    source: 'curated_fallback',
    executiveSynthesis: `${nameA} and ${nameB} represent distinct macroeconomic philosophies. ${nameA} operates under a ${profileA.fiscalPosture.toLowerCase()} posture (${profileA.deficitTrend}) prioritizing ${profileA.headlineStrategy.split(',')[0].toLowerCase()}, whereas ${nameB} operates under a ${profileB.fiscalPosture.toLowerCase()} framework (${profileB.deficitTrend}) focused on ${profileB.headlineStrategy.split(',')[0].toLowerCase()}. The divergence reflects differing tolerance for sovereign leverage and contrasting institutional mandates for state industrial intervention.`,
    divergenceScore,
    keyPhilosophicalContrast: `${profileA.fiscalPosture} vs ${profileB.fiscalPosture}`,
    focusAngle,
    customQuestion,
    customAnswer,
    entityA: profileA,
    entityB: profileB,
    sideBySideComparison,
    strategicOutlook: {
      sharedChallenges: [
        'Rising long-term borrowing costs and elevated debt refinancing yields in global capital markets.',
        'Escalating healthcare and statutory pension expenditures driven by population aging.',
        'High capital requirements for climate transition and industrial grid decarbonization.',
      ],
      policyLessons: [
        `${nameA}'s experience highlights the power of targeted capital incentives, but reinforces the necessity of non-discretionary spending containment.`,
        `${nameB}'s framework illustrates the stability of credible fiscal anchors, while highlighting the risk of underinvesting in foundational public infrastructure.`,
      ],
      implicationsForGrowth: `Over the next decade, ${nameA}'s fiscal strategy supports near-term capital expenditure and industrial reshoring, while ${nameB}'s model safeguards sovereign creditworthiness and macro stability, setting up a structural test of debt-financed growth versus fiscal discipline.`,
    },
  };
}

async function startServer() {
  const app = express();

  const PORT = 3000;

  app.use(express.json());

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // GET /api/forex/rates: Real-time live foreign exchange rates feed
  let cachedForexRates: { timestamp: number; rates: Record<string, number>; source: string; base: string } | null = null;
  const FOREX_CACHE_TTL_MS = 15 * 60 * 1000;

  const DEFAULT_FOREX_RATES: Record<string, number> = {
    USD: 1.0,
    EUR: 0.923,
    GBP: 0.791,
    JPY: 153.2,
    CNY: 7.24,
    INR: 84.1,
    CAD: 1.385,
    AUD: 1.524,
    KRW: 1385.0,
    BRL: 5.72,
    CHF: 0.884,
    RUB: 97.2,
    MXN: 20.05,
    IDR: 15720.0,
    SAR: 3.75,
    TRY: 34.3,
    TWD: 32.15,
    PLN: 4.02,
    SEK: 10.65,
    ARS: 990.0,
    NOK: 10.95,
    ILS: 3.75,
    SGD: 1.32,
    AED: 3.67,
    ZAR: 17.65,
  };

  app.get('/api/forex/rates', async (_req, res) => {
    if (cachedForexRates && Date.now() - cachedForexRates.timestamp < FOREX_CACHE_TTL_MS) {
      return res.json(cachedForexRates);
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2500);
      const apiRes = await fetch('https://open.er-api.com/v6/latest/USD', {
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (apiRes.ok) {
        const data = await apiRes.json();
        if (data && data.rates) {
          cachedForexRates = {
            timestamp: Date.now(),
            base: 'USD',
            rates: { ...DEFAULT_FOREX_RATES, ...data.rates },
            source: 'open_er_api_live',
          };
          return res.json(cachedForexRates);
        }
      }
    } catch (_err) {
      // Fallback below
    }

    cachedForexRates = {
      timestamp: Date.now(),
      base: 'USD',
      rates: DEFAULT_FOREX_RATES,
      source: 'benchmark_forex_feed',
    };
    return res.json(cachedForexRates);
  });

  // POST /api/news: Pull recent financial & economic policy headlines using Google Search Grounding
  app.post('/api/news', async (req, res) => {
    try {
      const { entityA, entityB, topic } = req.body;

      if (!entityA || !entityB) {
        return res.status(400).json({ error: 'entityA and entityB are required' });
      }

      const idA = entityA.id || 'a';
      const idB = entityB.id || 'b';
      const cacheKey = `${idA}_${idB}_${topic || 'all'}`;

      // Check in-memory cache
      const cached = newsCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        return res.json(cached.data);
      }

      const nameA = entityA.name || entityA.shortName || 'Economy A';
      const nameB = entityB.name || entityB.shortName || 'Economy B';
      const topicFilter = topic && topic !== 'all' ? ` focusing on ${topic}` : '';

      const prompt = `Use Google Search to find recent financial, macroeconomic, and economic policy headlines for ${nameA} and ${nameB}${topicFilter}.
Look for news regarding:
1. GDP growth updates, recession risks, or expansion forecasts.
2. Central bank monetary policy decisions, interest rate paths, and inflation prints.
3. Fiscal policy, government budgets, stimulus packages, tax reforms, or national debt.
4. Trade policies, tariffs, supply chains, or industrial strategy.

Return your response strictly as a single, valid JSON object without markdown fences, matching this exact schema:
{
  "macroBriefing": "A 2-3 sentence executive briefing synthesizing the latest comparative economic and policy stance between ${nameA} and ${nameB}.",
  "searchedQueries": ["search query 1", "search query 2", "search query 3"],
  "globalTrends": [
    {
      "id": "trend-slug",
      "title": "Title of global trend",
      "theme": "monetary" | "trade" | "commodities" | "technology" | "geopolitics",
      "headline": "1-sentence summary of trend",
      "description": "2-sentence overview",
      "impactA": { "type": "tailwind" | "headwind" | "neutral", "summary": "Impact on ${nameA}" },
      "impactB": { "type": "tailwind" | "headwind" | "neutral", "summary": "Impact on ${nameB}" },
      "keyMetricLink": "Name of relevant metric",
      "correlation": {
        "metricName": "Real GDP Growth" | "Inflation Rate (CPI)" | "Unemployment Rate" | "Public Debt-to-GDP" | "Trade Balance",
        "observedChange": "Observed indicator direction/shift",
        "impactDirection": "positive" | "negative" | "neutral" | "divergent",
        "correlationType": "direct_driver" | "counter_cyclical" | "structural_lag" | "leading_indicator",
        "explanation": "1-sentence linking the macro event to observed indicator movement."
      }
    }
  ],
  "articles": [
    {
      "id": "unique-slug",
      "title": "Clear journalistic headline",
      "summary": "Concise 2-sentence summary explaining the event and its economic implication.",
      "entity": "${nameA}" or "${nameB}" or "Both / Global",
      "category": "fiscal" | "monetary" | "growth" | "trade" | "reform" | "tech",
      "source": "Name of publisher (e.g. Reuters, Bloomberg, Financial Times, WSJ, CNBC, BBC, etc.)",
      "url": "Actual source URL from search",
      "date": "Recent date or time indication",
      "correlation": {
        "metricName": "Real GDP Growth" | "Inflation Rate (CPI)" | "Unemployment Rate" | "Public Debt-to-GDP" | "Trade Balance",
        "observedChange": "Observed indicator direction/shift",
        "impactDirection": "positive" | "negative" | "neutral" | "divergent",
        "correlationType": "direct_driver" | "counter_cyclical" | "structural_lag" | "leading_indicator",
        "explanation": "1-sentence linking this news event to the observed change in this economic indicator."
      }
    }
  ]
}
Provide 3-4 global trends and at least 6-8 high quality, distinct, and verified recent news items with clear indicator correlations.`;

      let responseText = '';
      let groundingMetadata: any = null;
      let usedFallback = false;

      try {
        const ai = getAiClient();
        if (!ai) {
          usedFallback = true;
        } else {
          const response = await callAiWithTimeout(
            ai.models.generateContent({
              model: 'gemini-3.8-flash',
              contents: prompt,
              config: {
                tools: [{ googleSearch: {} }],
              },
            }),
            4000
          );

          responseText = response.text || '';
          groundingMetadata = response.candidates?.[0]?.groundingMetadata || null;
        }
      } catch (_err) {
        // Quota exhaustion (429), high demand (503), or timeout - gracefully fall back
        usedFallback = true;
      }

      if (usedFallback || !responseText) {
        const fallbackData = getFallbackNews(entityA, entityB);
        newsCache.set(cacheKey, { timestamp: Date.now(), data: fallbackData });
        return res.json(fallbackData);
      }

      // Clean markdown code blocks if the model wrapped the JSON
      let cleaned = responseText.trim();
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      let parsedData: any = {};
      try {
        parsedData = JSON.parse(cleaned);
      } catch (_jsonErr) {
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            parsedData = JSON.parse(jsonMatch[0]);
          } catch {
            const fallbackData = getFallbackNews(entityA, entityB);
            newsCache.set(cacheKey, { timestamp: Date.now(), data: fallbackData });
            return res.json(fallbackData);
          }
        } else {
          const fallbackData = getFallbackNews(entityA, entityB);
          newsCache.set(cacheKey, { timestamp: Date.now(), data: fallbackData });
          return res.json(fallbackData);
        }
      }

      // Extract verified grounding web chunks if available
      const webSources = (groundingMetadata?.groundingChunks || [])
        .map((chunk: any) => chunk.web)
        .filter(Boolean);

      const searchedQueries =
        groundingMetadata?.webSearchQueries ||
        parsedData.searchedQueries || [
          `${nameA} economic policy news`,
          `${nameB} fiscal and central bank updates`,
        ];

      // Enrich articles with actual grounding URLs if URL was generic
      const enrichedArticles = (parsedData.articles || []).map((art: any, index: number) => {
        const matchingWeb = webSources[index % (webSources.length || 1)];
        return {
          ...art,
          url: art.url && art.url.startsWith('http') ? art.url : (matchingWeb?.uri || 'https://news.google.com'),
          source: art.source || matchingWeb?.title || 'Financial News Wire',
        };
      });

      const fallbackData = getFallbackNews(entityA, entityB);
      const responsePayload = {
        source: 'google_search_grounding',
        macroBriefing: parsedData.macroBriefing || fallbackData.macroBriefing,
        searchedQueries,
        globalTrends: Array.isArray(parsedData.globalTrends) && parsedData.globalTrends.length > 0 ? parsedData.globalTrends : fallbackData.globalTrends,
        webSources,
        articles: enrichedArticles.length > 0 ? enrichedArticles : fallbackData.articles,
        searchEntryPoint: groundingMetadata?.searchEntryPoint?.renderedContent || null,
      };

      newsCache.set(cacheKey, { timestamp: Date.now(), data: responsePayload });
      return res.json(responsePayload);
    } catch (_err) {
      const fallbackData = getFallbackNews(req.body.entityA || {}, req.body.entityB || {});
      return res.json(fallbackData);
    }
  });

  // POST /api/fiscal-policy/analyze: Side-by-side AI-powered fiscal strategy & major economic reforms analyzer
  app.post('/api/fiscal-policy/analyze', async (req, res) => {
    try {
      const { entityA, entityB, focusAngle = 'all', customQuestion } = req.body;

      if (!entityA || !entityB) {
        return res.status(400).json({ error: 'entityA and entityB are required' });
      }

      const idA = entityA.id || 'a';
      const idB = entityB.id || 'b';
      const qHash = customQuestion ? customQuestion.trim().toLowerCase().slice(0, 40) : '';
      const cacheKey = `${idA}_${idB}_${focusAngle}_${qHash}`;

      // Check cache
      const cached = fiscalCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < FISCAL_CACHE_TTL_MS) {
        return res.json(cached.data);
      }

      const nameA = entityA.name || entityA.shortName || 'Economy A';
      const nameB = entityB.name || entityB.shortName || 'Economy B';
      const typeA = entityA.type === 'region' || entityA.type === 'subnational' ? 'Subnational Region / State' : 'Sovereign Nation';
      const typeB = entityB.type === 'region' || entityB.type === 'subnational' ? 'Subnational Region / State' : 'Sovereign Nation';


      let promptFocusInstruction = '';
      if (focusAngle === 'deficit_debt') {
        promptFocusInstruction = 'Place primary focus on sovereign debt sustainability, debt-to-GDP ratios, deficit trends, fiscal rules (e.g. debt brake, statutory anchors), and bond market financing vulnerabilities.';
      } else if (focusAngle === 'taxation') {
        promptFocusInstruction = 'Place primary focus on corporate tax rates, personal income tax progressivity, capital gains, tax credits, and revenue mobilization versus economic competitiveness.';
      } else if (focusAngle === 'industrial_subsidies') {
        promptFocusInstruction = 'Place primary focus on modern industrial policy, strategic state subsidies (e.g., semiconductors, clean energy, AI), state aid rules, and public investment in manufacturing capacity.';
      } else if (focusAngle === 'welfare_demographics') {
        promptFocusInstruction = 'Place primary focus on pension commitments, healthcare expenditures, social safety net funding, and the fiscal strain of aging demographics.';
      }

      const customQueryClause = customQuestion && customQuestion.trim()
        ? `The user also specifically asked: "${customQuestion}". In your response, provide an in-depth "customAnswer" field directly addressing this comparative question.`
        : '';

      const prompt = `You are a world-class macroeconomic analyst and sovereign fiscal policy specialist.
Perform a rigorous, side-by-side comparative analysis of the current government fiscal strategies and major recent economic reforms of two entities:
1. ${nameA} (${typeA}, Debt-to-GDP: ${entityA.publicDebtToGdp ?? 'N/A'}%, GDP Growth: ${entityA.gdpGrowthRate ?? 'N/A'}%, Inflation: ${entityA.inflationRate ?? 'N/A'}%)
2. ${nameB} (${typeB}, Debt-to-GDP: ${entityB.publicDebtToGdp ?? 'N/A'}%, GDP Growth: ${entityB.gdpGrowthRate ?? 'N/A'}%, Inflation: ${entityB.inflationRate ?? 'N/A'}%)

${promptFocusInstruction}
${customQueryClause}

Return your analysis strictly as a single valid JSON object without markdown fences, matching this exact schema:
{
  "executiveSynthesis": "Comprehensive 3-4 sentence comparative synthesis contrasting their overarching fiscal stance, philosophy (e.g., industrial interventionism vs balanced-budget restraint vs deficit expansion), and macro sustainability.",
  "divergenceScore": 7,
  "keyPhilosophicalContrast": "Short punchy contrast label (e.g., Supply-Side Subsidies vs Constitutional Debt Brake)",
  "focusAngle": "${focusAngle}",
  ${customQuestion ? `"customQuestion": "${customQuestion.replace(/"/g, '\\"')}",` : ''}
  ${customQuestion ? `"customAnswer": "Thorough 2-3 paragraph side-by-side answer to the user's question with specific policy evidence and balance sheet data.",` : ''}
  "entityA": {
    "name": "${nameA}",
    "shortName": "${entityA.shortName || nameA}",
    "flag": "${entityA.flag || '🌐'}",
    "fiscalPosture": "Expansionary",
    "fiscalHealthRating": "Elevated Deficit Stress",
    "deficitTrend": "Current deficit posture, e.g. -6.2% of GDP ($1.8T federal deficit)",
    "headlineStrategy": "2-sentence summary of the governing administration's core fiscal strategy.",
    "corePillars": [
      {
        "pillar": "Name of fiscal pillar (e.g., Strategic Industrial Subsidies, Corporate Tax Competitiveness, Entitlement Spending, Reserve Funds)",
        "description": "Specific details of this pillar in action.",
        "impact": "Economic and budgetary impact."
      }
    ],
    "recentReforms": [
      {
        "year": "e.g. 2022-2024",
        "title": "Specific reform, bill, or legislation name (e.g., Inflation Reduction Act, CHIPS Act, Proposition 4)",
        "description": "Key provisions and structural changes enacted.",
        "strategicGoal": "What the reform aimed to achieve.",
        "budgetScale": "Financial commitment or revenue impact (e.g., $369B authorized)"
      }
    ],
    "strengths": ["Key fiscal strength 1", "Key fiscal strength 2", "Key fiscal strength 3"],
    "vulnerabilities": ["Sovereign risk 1", "Sovereign risk 2", "Sovereign risk 3"]
  },
  "entityB": {
    "name": "${nameB}",
    "shortName": "${entityB.shortName || nameB}",
    "flag": "${entityB.flag || '🌐'}",
    "fiscalPosture": "Consolidative / Austere",
    "fiscalHealthRating": "Moderate Risk",
    "deficitTrend": "Current deficit posture",
    "headlineStrategy": "2-sentence summary of core fiscal strategy.",
    "corePillars": [
      {
        "pillar": "Pillar name",
        "description": "Specific details",
        "impact": "Economic and budgetary impact"
      }
    ],
    "recentReforms": [
      {
        "year": "Year",
        "title": "Reform/Bill name",
        "description": "Provisions",
        "strategicGoal": "Goal",
        "budgetScale": "Scale"
      }
    ],
    "strengths": ["Strength 1", "Strength 2", "Strength 3"],
    "vulnerabilities": ["Vulnerability 1", "Vulnerability 2", "Vulnerability 3"]
  },
  "sideBySideComparison": [
    {
      "domain": "Fiscal Rules & Debt Anchors",
      "entityAStance": "Detailed stance for ${nameA}",
      "entityBStance": "Detailed stance for ${nameB}",
      "contrastTakeaway": "Analytical contrast explaining who is more constrained and why.",
      "advantageEntity": "entityA"
    },
    {
      "domain": "Industrial Policy & State Subsidies",
      "entityAStance": "Stance for ${nameA}",
      "entityBStance": "Stance for ${nameB}",
      "contrastTakeaway": "Contrast takeaway",
      "advantageEntity": "neutral"
    },
    {
      "domain": "Tax Structure & Capital Competitiveness",
      "entityAStance": "Stance for ${nameA}",
      "entityBStance": "Stance for ${nameB}",
      "contrastTakeaway": "Contrast takeaway",
      "advantageEntity": "neutral"
    },
    {
      "domain": "Social Safety Net & Entitlements",
      "entityAStance": "Stance for ${nameA}",
      "entityBStance": "Stance for ${nameB}",
      "contrastTakeaway": "Contrast takeaway",
      "advantageEntity": "neutral"
    },
    {
      "domain": "Deficit Financing & Market Headroom",
      "entityAStance": "Stance for ${nameA}",
      "entityBStance": "Stance for ${nameB}",
      "contrastTakeaway": "Contrast takeaway",
      "advantageEntity": "entityB"
    }
  ],
  "strategicOutlook": {
    "sharedChallenges": ["Shared fiscal challenge 1", "Shared fiscal challenge 2", "Shared fiscal challenge 3"],
    "policyLessons": ["Cross-border policy lesson 1", "Cross-border policy lesson 2"],
    "implicationsForGrowth": "2-3 sentence projection on how their respective fiscal paths will affect GDP growth and sovereign stability over the next decade."
  }
}
Provide at least 3-4 distinct core pillars and 3-4 real, accurate recent reforms for each entity. Ensure all data reflects genuine fiscal legislation and policy.`;

      let responseText = '';
      let usedFallback = false;

      try {
        const ai = getAiClient();
        if (!ai) {
          usedFallback = true;
        } else {
          const response = await callAiWithTimeout(
            ai.models.generateContent({
              model: 'gemini-3.8-flash',
              contents: prompt,
              config: {
                responseMimeType: 'application/json',
              },
            }),
            3800
          );
          responseText = response.text || '';
        }
      } catch (_err) {
        usedFallback = true;
      }

      if (usedFallback || !responseText) {
        const fallbackData = getFallbackFiscalAnalysis(entityA, entityB, focusAngle, customQuestion);
        fiscalCache.set(cacheKey, { timestamp: Date.now(), data: fallbackData });
        return res.json(fallbackData);
      }

      let cleaned = responseText.trim();
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      let parsedData: any = {};
      try {
        parsedData = JSON.parse(cleaned);
      } catch {
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            parsedData = JSON.parse(jsonMatch[0]);
          } catch {
            const fallbackData = getFallbackFiscalAnalysis(entityA, entityB, focusAngle, customQuestion);
            fiscalCache.set(cacheKey, { timestamp: Date.now(), data: fallbackData });
            return res.json(fallbackData);
          }
        } else {
          const fallbackData = getFallbackFiscalAnalysis(entityA, entityB, focusAngle, customQuestion);
          fiscalCache.set(cacheKey, { timestamp: Date.now(), data: fallbackData });
          return res.json(fallbackData);
        }
      }

      const responsePayload = {
        source: 'gemini_3_8_flash',
        executiveSynthesis: parsedData.executiveSynthesis || '',
        divergenceScore: typeof parsedData.divergenceScore === 'number' ? parsedData.divergenceScore : 6,
        keyPhilosophicalContrast: parsedData.keyPhilosophicalContrast || 'Strategic Fiscal Divergence',
        focusAngle: parsedData.focusAngle || focusAngle,
        customQuestion: customQuestion || undefined,
        customAnswer: parsedData.customAnswer || undefined,
        entityA: {
          ...parsedData.entityA,
          flag: parsedData.entityA?.flag || entityA.flag || '🌐',
        },
        entityB: {
          ...parsedData.entityB,
          flag: parsedData.entityB?.flag || entityB.flag || '🌐',
        },
        sideBySideComparison: Array.isArray(parsedData.sideBySideComparison) ? parsedData.sideBySideComparison : [],
        strategicOutlook: parsedData.strategicOutlook || {
          sharedChallenges: [],
          policyLessons: [],
          implicationsForGrowth: '',
        },
      };

      fiscalCache.set(cacheKey, { timestamp: Date.now(), data: responsePayload });
      return res.json(responsePayload);
    } catch (_err) {
      const fallbackData = getFallbackFiscalAnalysis(req.body.entityA || {}, req.body.entityB || {}, req.body.focusAngle, req.body.customQuestion);
      return res.json(fallbackData);
    }
  });

  // POST /api/spotlight/generate: 3-paragraph executive macroeconomic climate briefing with strengths & risks using Gemini
  app.post('/api/spotlight/generate', async (req, res) => {
    try {
      const { entity } = req.body;
      if (!entity) {
        return res.status(400).json({ error: 'entity object is required' });
      }

      const id = entity.id || 'unknown';
      const cacheKey = `spotlight_${id}`;

      // Check in-memory cache
      const cached = spotlightCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < SPOTLIGHT_CACHE_TTL_MS) {
        return res.json(cached.data);
      }

      const name = entity.name || entity.shortName || 'Economy';
      const type = entity.type === 'region' || entity.type === 'subnational' ? 'Subnational Region / State' : 'Sovereign Nation';
      const prompt = `You are a chief sovereign macroeconomic analyst at an international financial institution.
Generate an authoritative, rigorous 3-paragraph executive summary about ${name}'s current economic climate, including key structural strengths and downside vulnerabilities.

Entity Profile:
- Entity: ${name} (${entity.shortName || name})
- Classification: ${type}
- Nominal GDP: $${entity.gdp || 'N/A'} Billion USD
- GDP Per Capita: $${entity.gdpPerCapita || 'N/A'} USD
- Real Growth Rate: ${entity.gdpGrowthRate ?? 'N/A'}%
- Inflation Rate (CPI): ${entity.inflationRate ?? 'N/A'}%
- Unemployment Rate: ${entity.unemploymentRate ?? 'N/A'}%
- Public Debt-to-GDP: ${entity.publicDebtToGdp ?? 'N/A'}%
- Trade Balance: $${entity.tradeBalance ?? 'N/A'} Billion USD
- Core Sectors & Industries: ${entity.topIndustries?.join(', ') || 'Diversified economy'}

Formatting & Analytical Guidelines:
Return strictly a single JSON object without markdown code fences matching this exact schema:
{
  "executiveHeadline": "A 1-sentence analytical headline synthesizing ${name}'s overall macroeconomic momentum and risk posture.",
  "momentumRating": "Accelerating" | "Steady Growth" | "Moderating" | "Elevated Vulnerability",
  "paragraphs": [
    "Paragraph 1: Comprehensive assessment of current macroeconomic climate, real GDP growth momentum, domestic aggregate demand, central bank / monetary policy stance, and inflation trajectory.",
    "Paragraph 2: Deep dive into core structural strengths, key industries (${entity.topIndustries?.slice(0, 3).join(', ') || 'dominant sectors'}), labor productivity, human capital, private capital investments, and global competitive moats.",
    "Paragraph 3: Critical evaluation of downside vulnerabilities, sovereign debt burdens (${entity.publicDebtToGdp ?? 80}% of GDP), refinancing costs, demographic shifts, external trade exposure, and budgetary consolidation pressures."
  ],
  "strengths": [
    { "title": "Strength Title", "detail": "1-2 sentence analytical detail", "indicatorLink": "Relevant economic metric name" }
  ],
  "risks": [
    { "title": "Risk Factor Title", "detail": "1-2 sentence analytical detail", "indicatorLink": "Relevant economic metric name" }
  ],
  "keySignals": [
    { "label": "Real GDP Growth", "value": "${entity.gdpGrowthRate ?? 2.0}%", "assessment": "Analytical assessment tag" },
    { "label": "Inflation (CPI)", "value": "${entity.inflationRate ?? 2.8}%", "assessment": "Analytical assessment tag" },
    { "label": "Public Debt / GDP", "value": "${entity.publicDebtToGdp ?? 80}%", "assessment": "Analytical assessment tag" },
    { "label": "Labor Market", "value": "${entity.unemploymentRate ?? 4.0}% Unemp.", "assessment": "Analytical assessment tag" }
  ]
}
Ensure each paragraph is a substantial, highly articulate analytical narrative (4-6 sentences).
Provide exactly 4 distinct strengths and 4 distinct risks.`;

      let responseText = '';
      let usedFallback = false;

      try {
        const ai = getAiClient();
        if (!ai) {
          usedFallback = true;
        } else {
          const response = await callAiWithTimeout(
            ai.models.generateContent({
              model: 'gemini-3.8-flash',
              contents: prompt,
              config: {
                responseMimeType: 'application/json',
              },
            }),
            4200
          );
          responseText = response.text || '';
        }
      } catch (_err) {
        usedFallback = true;
      }

      if (usedFallback || !responseText) {
        const fallbackData = getFallbackSpotlight(entity);
        spotlightCache.set(cacheKey, { timestamp: Date.now(), data: fallbackData });
        return res.json(fallbackData);
      }

      let cleaned = responseText.trim();
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      let parsedData: any = {};
      try {
        parsedData = JSON.parse(cleaned);
      } catch {
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            parsedData = JSON.parse(jsonMatch[0]);
          } catch {
            const fallbackData = getFallbackSpotlight(entity);
            spotlightCache.set(cacheKey, { timestamp: Date.now(), data: fallbackData });
            return res.json(fallbackData);
          }
        } else {
          const fallbackData = getFallbackSpotlight(entity);
          spotlightCache.set(cacheKey, { timestamp: Date.now(), data: fallbackData });
          return res.json(fallbackData);
        }
      }

      const fallbackData = getFallbackSpotlight(entity);
      const paragraphs =
        Array.isArray(parsedData.paragraphs) && parsedData.paragraphs.length >= 3
          ? [parsedData.paragraphs[0], parsedData.paragraphs[1], parsedData.paragraphs[2]]
          : fallbackData.paragraphs;

      const responsePayload = {
        source: 'gemini_3_8_flash',
        entityId: id,
        entityName: entity.name || entity.shortName || 'Economy',
        shortName: entity.shortName || entity.name,
        flag: entity.flag || '🌐',
        executiveHeadline: parsedData.executiveHeadline || fallbackData.executiveHeadline,
        momentumRating: parsedData.momentumRating || fallbackData.momentumRating,
        paragraphs,
        strengths:
          Array.isArray(parsedData.strengths) && parsedData.strengths.length > 0
            ? parsedData.strengths
            : fallbackData.strengths,
        risks:
          Array.isArray(parsedData.risks) && parsedData.risks.length > 0
            ? parsedData.risks
            : fallbackData.risks,
        keySignals:
          Array.isArray(parsedData.keySignals) && parsedData.keySignals.length > 0
            ? parsedData.keySignals
            : fallbackData.keySignals,
        generatedAt: new Date().toISOString(),
      };

      spotlightCache.set(cacheKey, { timestamp: Date.now(), data: responsePayload });
      return res.json(responsePayload);
    } catch (_err) {
      const fallbackData = getFallbackSpotlight(req.body.entity || {});
      return res.json(fallbackData);
    }
  });

  // POST /api/copilot/analyze: Interactive Macro Analyst Copilot query & crisis scenario evaluation
  app.post('/api/copilot/analyze', async (req, res) => {
    try {
      const { entityA, entityB, query, presetId } = req.body;
      if (!entityA || !entityB) {
        return res.status(400).json({ error: 'entityA and entityB are required' });
      }

      const idA = entityA.id || 'a';
      const idB = entityB.id || 'b';
      const cleanQuery = (query || presetId || 'General comparative macroeconomic stress assessment').trim();
      const cacheKey = `${idA}_${idB}_${cleanQuery.toLowerCase().slice(0, 80)}`;

      const cached = copilotCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < COPILOT_CACHE_TTL_MS) {
        return res.json(cached.data);
      }

      const nameA = entityA.name || entityA.shortName || 'Entity A';
      const nameB = entityB.name || entityB.shortName || 'Entity B';
      const shortA = entityA.shortName || nameA;
      const shortB = entityB.shortName || nameB;

      const prompt = `You are a Senior Sovereign Macroeconomist and Crisis Risk Assessor evaluating two comparative economic entities:

ENTITY A:
Name: ${nameA} (${shortA})
Type: ${entityA.type}
Flag: ${entityA.flag || '🇺🇸'}
Nominal GDP: $${entityA.nominalGdp} Billion USD
GDP Per Capita: $${entityA.gdpPerCapitaNominal || entityA.gdpPerCapitaPpp || 65000} USD
Real GDP Growth Rate: ${entityA.gdpGrowthRate}%
Inflation Rate (CPI): ${entityA.inflationRate}%
Unemployment Rate: ${entityA.unemploymentRate}%
Public Debt / GDP: ${entityA.publicDebtToGdp}%
Trade Balance: $${entityA.tradeBalance ?? 0} Billion USD
Top Industries: ${entityA.topIndustries?.join(', ') || 'Technology, Advanced Manufacturing, Services'}

ENTITY B:
Name: ${nameB} (${shortB})
Type: ${entityB.type}
Flag: ${entityB.flag || '🇬🇧'}
Nominal GDP: $${entityB.nominalGdp} Billion USD
GDP Per Capita: $${entityB.gdpPerCapitaNominal || entityB.gdpPerCapitaPpp || 48000} USD
Real GDP Growth Rate: ${entityB.gdpGrowthRate}%
Inflation Rate (CPI): ${entityB.inflationRate}%
Unemployment Rate: ${entityB.unemploymentRate}%
Public Debt / GDP: ${entityB.publicDebtToGdp}%
Trade Balance: $${entityB.tradeBalance ?? 0} Billion USD
Top Industries: ${entityB.topIndustries?.join(', ') || 'Financial Services, Professional Services, Manufacturing'}

MACROECONOMIC INQUIRY / STRESS-TEST SCENARIO:
"${cleanQuery}"

Provide a rigorous, institutional-quality comparative macroeconomic evaluation in valid JSON strictly matching this structure:
{
  "scenarioTitle": "Descriptive analytical title for the scenario or inquiry",
  "executiveThesis": [
    "Paragraph 1: Detailed assessment of macroeconomic transmission channels and initial demand/supply impacts on both entities.",
    "Paragraph 2: Comparative balance sheet analysis, sovereign debt burden differentials (${entityA.publicDebtToGdp}% vs ${entityB.publicDebtToGdp}%), interest refinancing exposure, and statutory/currency constraints.",
    "Paragraph 3: Projected 18-to-36 month equilibrium landing, relative resilience differentials, and post-shock recovery trajectories."
  ],
  "keyTransmissionMechanisms": [
    {
      "title": "Cost of Capital & Sovereign Refinancing Spreads",
      "entityAResponse": "Detailed impact on ${shortA}'s financial conditions and debt servicing.",
      "entityBResponse": "Detailed impact on ${shortB}'s financial conditions and debt servicing.",
      "divergenceFactor": "Core structural rationale explaining why they diverge."
    },
    {
      "title": "Industry Value-Add & Supply Chain Elasticity",
      "entityAResponse": "Impact on ${shortA}'s primary export and domestic sectors.",
      "entityBResponse": "Impact on ${shortB}'s primary export and domestic sectors.",
      "divergenceFactor": "Comparative advantage or exposure differences."
    },
    {
      "title": "Labor Market & Real Disposable Income",
      "entityAResponse": "Employment and household wage dynamics in ${shortA}.",
      "entityBResponse": "Employment and household wage dynamics in ${shortB}.",
      "divergenceFactor": "Differences in wage elasticity and workforce flexibility."
    }
  ],
  "asymmetricVulnerabilities": {
    "entityA": ["Vulnerability 1 for ${shortA}", "Vulnerability 2 for ${shortA}", "Vulnerability 3 for ${shortA}"],
    "entityB": ["Vulnerability 1 for ${shortB}", "Vulnerability 2 for ${shortB}", "Vulnerability 3 for ${shortB}"]
  },
  "projections": [
    {
      "indicator": "Real GDP Growth",
      "entityAProjection": {
        "baseline": "${entityA.gdpGrowthRate}%",
        "projectedShift": "Projected % e.g. 1.3%",
        "impactVector": "negative",
        "deltaBps": "-70 bps"
      },
      "entityBProjection": {
        "baseline": "${entityB.gdpGrowthRate}%",
        "projectedShift": "Projected % e.g. 0.3%",
        "impactVector": "negative",
        "deltaBps": "-120 bps"
      },
      "divergenceTakeaway": "1 sentence comparative takeaway on real GDP"
    },
    {
      "indicator": "Inflation (CPI YoY)",
      "entityAProjection": {
        "baseline": "${entityA.inflationRate}%",
        "projectedShift": "Projected % e.g. 3.9%",
        "impactVector": "volatile",
        "deltaBps": "+110 bps"
      },
      "entityBProjection": {
        "baseline": "${entityB.inflationRate}%",
        "projectedShift": "Projected % e.g. 4.4%",
        "impactVector": "volatile",
        "deltaBps": "+180 bps"
      },
      "divergenceTakeaway": "1 sentence comparative takeaway on inflation"
    },
    {
      "indicator": "Unemployment Rate",
      "entityAProjection": {
        "baseline": "${entityA.unemploymentRate}%",
        "projectedShift": "Projected % e.g. 5.7%",
        "impactVector": "negative",
        "deltaBps": "+40 bps"
      },
      "entityBProjection": {
        "baseline": "${entityB.unemploymentRate}%",
        "projectedShift": "Projected % e.g. 4.9%",
        "impactVector": "negative",
        "deltaBps": "+70 bps"
      },
      "divergenceTakeaway": "1 sentence comparative takeaway on labor"
    },
    {
      "indicator": "Public Debt-to-GDP",
      "entityAProjection": {
        "baseline": "${entityA.publicDebtToGdp}%",
        "projectedShift": "Projected % e.g. 51.5%",
        "impactVector": "negative",
        "deltaBps": "+330 bps"
      },
      "entityBProjection": {
        "baseline": "${entityB.publicDebtToGdp}%",
        "projectedShift": "Projected % e.g. 103.2%",
        "impactVector": "negative",
        "deltaBps": "+540 bps"
      },
      "divergenceTakeaway": "1 sentence comparative takeaway on sovereign debt"
    }
  ],
  "policyRecommendations": {
    "entityA": "Actionable policy priority for ${shortA} over the next 12-24 months.",
    "entityB": "Actionable policy priority for ${shortB} over the next 12-24 months."
  }
}
Ensure each paragraph in executiveThesis is substantial and analytical (4-6 sentences).
Ensure deltaBps values are realistic and impactVector is one of 'positive', 'negative', 'neutral', 'volatile'.`;

      let responseText = '';
      let usedFallback = false;

      try {
        const ai = getAiClient();
        if (!ai) {
          usedFallback = true;
        } else {
          const response = await callAiWithTimeout(
            ai.models.generateContent({
              model: 'gemini-3.8-flash',
              contents: prompt,
              config: {
                responseMimeType: 'application/json',
              },
            }),
            4200
          );
          responseText = response.text || '';
        }
      } catch (_err) {
        usedFallback = true;
      }

      if (usedFallback || !responseText) {
        const fallbackData = getFallbackCopilotAnalysis(entityA, entityB, cleanQuery, presetId);
        copilotCache.set(cacheKey, { timestamp: Date.now(), data: fallbackData });
        return res.json(fallbackData);
      }

      let cleaned = responseText.trim();
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      let parsedData: any = {};
      try {
        parsedData = JSON.parse(cleaned);
      } catch {
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            parsedData = JSON.parse(jsonMatch[0]);
          } catch {
            const fallbackData = getFallbackCopilotAnalysis(entityA, entityB, cleanQuery, presetId);
            copilotCache.set(cacheKey, { timestamp: Date.now(), data: fallbackData });
            return res.json(fallbackData);
          }
        } else {
          const fallbackData = getFallbackCopilotAnalysis(entityA, entityB, cleanQuery, presetId);
          copilotCache.set(cacheKey, { timestamp: Date.now(), data: fallbackData });
          return res.json(fallbackData);
        }
      }

      const fallbackData = getFallbackCopilotAnalysis(entityA, entityB, cleanQuery, presetId);
      const executiveThesis =
        Array.isArray(parsedData.executiveThesis) && parsedData.executiveThesis.length >= 3
          ? parsedData.executiveThesis
          : fallbackData.executiveThesis;

      const responsePayload = {
        source: 'gemini_3_8_flash',
        scenarioTitle: parsedData.scenarioTitle || fallbackData.scenarioTitle,
        query: cleanQuery,
        executiveThesis,
        keyTransmissionMechanisms:
          Array.isArray(parsedData.keyTransmissionMechanisms) && parsedData.keyTransmissionMechanisms.length > 0
            ? parsedData.keyTransmissionMechanisms
            : fallbackData.keyTransmissionMechanisms,
        asymmetricVulnerabilities:
          parsedData.asymmetricVulnerabilities && parsedData.asymmetricVulnerabilities.entityA
            ? parsedData.asymmetricVulnerabilities
            : fallbackData.asymmetricVulnerabilities,
        projections:
          Array.isArray(parsedData.projections) && parsedData.projections.length > 0
            ? parsedData.projections
            : fallbackData.projections,
        policyRecommendations:
          parsedData.policyRecommendations && parsedData.policyRecommendations.entityA
            ? parsedData.policyRecommendations
            : fallbackData.policyRecommendations,
        discussedMultiYearMetrics:
          Array.isArray(parsedData.discussedMultiYearMetrics) && parsedData.discussedMultiYearMetrics.length > 0
            ? parsedData.discussedMultiYearMetrics
            : fallbackData.discussedMultiYearMetrics,
        timestamp: new Date().toISOString(),
      };

      copilotCache.set(cacheKey, { timestamp: Date.now(), data: responsePayload });
      return res.json(responsePayload);
    } catch (_err) {
      const fallbackData = getFallbackCopilotAnalysis(req.body.entityA || {}, req.body.entityB || {}, req.body.query || '', req.body.presetId);
      return res.json(fallbackData);
    }
  });


  // Vite integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
