import { EconomicEntity, EconomicNewsResponse, GlobalMacroTrend } from '../types';

export function getFallbackNews(
  entityA: Partial<EconomicEntity>,
  entityB: Partial<EconomicEntity>
): EconomicNewsResponse {
  const nameA = entityA.name || entityA.shortName || 'Economy A';
  const nameB = entityB.name || entityB.shortName || 'Economy B';
  const shortA = entityA.shortName || nameA;
  const shortB = entityB.shortName || nameB;
  const isSubnationalA = entityA.type === 'region';
  const isSubnationalB = entityB.type === 'region';

  const bankA = isSubnationalA ? `${nameA} Economic Council` : `${nameA} Central Bank`;
  const bankB = isSubnationalB ? `${nameB} Treasury` : `${nameB} Central Bank`;

  const globalTrends: GlobalMacroTrend[] = [
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
    },
    {
      id: 'trend-ai-tech-boom',
      title: 'AI Infrastructure & High-Performance Computing Boom',
      theme: 'technology',
      headline: 'Hyperscale data center investments and AI adoption stimulate structural productivity.',
      description: 'Trillions in private capital expenditure flow into semiconductor fabrication, power grid interconnects, and enterprise automation, driving cross-border technological leadership.',
      impactA: {
        type: entityA.topIndustries?.some((ind) => /tech|software|hardware|semiconductor/i.test(ind)) ? 'tailwind' : 'neutral',
        summary: `${shortA} captures significant venture capital and hardware deployment, driving tech services output and corporate tax generation.`,
      },
      impactB: {
        type: entityB.topIndustries?.some((ind) => /finance|fintech|biotech|advanced/i.test(ind)) ? 'tailwind' : 'neutral',
        summary: `Enterprise adoption accelerates automation in professional services and financial infrastructure.`,
      },
      keyMetricLink: 'Services Share & Per Capita Productivity',
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
    },
  ];

  return {
    source: 'curated_fallback',
    macroBriefing: `Latest macroeconomic briefing for ${nameA} and ${nameB}: Global monetary policies, supply chain friend-shoring, and technology infrastructure investments are currently the dominant external drivers. While ${shortA} leverages strength in ${entityA.topIndustries?.slice(0, 2).join(' and ') || 'leading domestic sectors'}, ${shortB} is positioning around ${entityB.topIndustries?.slice(0, 2).join(' and ') || 'key export services'} amid evolving cross-border trade relationships.`,
    searchedQueries: [
      `${nameA} economic growth, central bank decisions and fiscal outlook`,
      `${nameB} GDP performance, trade flows and macroeconomic indicators`,
      `Global economic trends affecting ${nameA} vs ${nameB} trade and inflation`,
      `International monetary policy and industrial strategy benchmarks 2025-2026`,
    ],
    globalTrends: globalTrends.map((trend) => ({
      ...trend,
      correlation: {
        metricName:
          trend.theme === 'monetary'
            ? 'Inflation Rate (CPI)'
            : trend.theme === 'trade'
            ? 'Trade Balance & Gross Exports'
            : trend.theme === 'technology'
            ? 'Real GDP Growth'
            : 'Public Debt-to-GDP',
        observedChange:
          trend.theme === 'monetary'
            ? 'Refinancing spread sensitivity & policy rate friction'
            : trend.theme === 'trade'
            ? 'Supply chain re-routing & tariff margin absorption'
            : trend.theme === 'technology'
            ? '+0.4% to +0.8% annual structural productivity uplift'
            : '+1.5% to +3.0% annual CAPEX debt acceleration',
        impactDirection: trend.theme === 'technology' ? 'positive' : 'divergent',
        correlationType:
          trend.theme === 'monetary'
            ? 'direct_driver'
            : trend.theme === 'technology'
            ? 'leading_indicator'
            : 'structural_lag',
        explanation: `Global ${trend.title.toLowerCase()} directly influences national cost of capital and domestic factor productivity.`,
      },
    })),
    articles: [
      {
        id: `fb-${entityA.id || 'a'}-1`,
        title: `${bankA} Reviews Macroeconomic Trajectory and Sovereign Outlook`,
        summary: `Macroeconomic analysts evaluate labor market resilience and price indexes, pointing to a data-driven fiscal and monetary trajectory over the coming quarters.`,
        entity: nameA,
        category: isSubnationalA ? 'fiscal' : 'monetary',
        source: 'Financial Times',
        url: 'https://www.ft.com',
        date: 'Recent',
        correlation: {
          metricName: 'Inflation Rate (CPI)',
          observedChange: `${(entityA.inflationRate ?? 2.8).toFixed(1)}% current annual rate`,
          impactDirection: (entityA.inflationRate ?? 2.8) > 3.0 ? 'negative' : 'positive',
          correlationType: 'direct_driver',
          explanation: `Central bank policy guidance directly conditions borrowing costs and price-level stabilization for ${shortA}.`,
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
          observedChange: `${(entityB.publicDebtToGdp ?? 85).toFixed(1)}% sovereign debt load`,
          impactDirection: (entityB.publicDebtToGdp ?? 85) > 90 ? 'negative' : 'neutral',
          correlationType: 'structural_lag',
          explanation: `Public capital commitments and budgetary consolidation targets govern ${shortB}'s long-term sovereign debt dynamics.`,
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
          observedChange: `Net ${(entityA.tradeBalance ?? 0) >= 0 ? 'Surplus' : 'Deficit'} for ${shortA} vs ${(entityB.tradeBalance ?? 0) >= 0 ? 'Surplus' : 'Deficit'} for ${shortB}`,
          impactDirection: 'divergent',
          correlationType: 'direct_driver',
          explanation: `Bilateral trade terms and tariff regimes directly impact foreign currency reserves and net export components of GDP.`,
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
          observedChange: `${(entityA.gdpGrowthRate ?? 2.1) >= 0 ? '+' : ''}${(entityA.gdpGrowthRate ?? 2.1).toFixed(1)}% annual expansion`,
          impactDirection: (entityA.gdpGrowthRate ?? 2.1) > 2.0 ? 'positive' : 'neutral',
          correlationType: 'direct_driver',
          explanation: `Resilient service output and private investment bolster aggregate demand and sustain headline GDP growth.`,
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
          observedChange: `${(entityB.unemploymentRate ?? 4.2).toFixed(1)}% labor force participation`,
          impactDirection: 'positive',
          correlationType: 'leading_indicator',
          explanation: `Targeted state subsidies and workforce programs stimulate high-value job creation in advanced manufacturing.`,
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
          observedChange: `$${Math.round(entityA.gdpPerCapitaNominal || entityA.gdpPerCapitaPpp || 65000).toLocaleString()} (${shortA}) vs $${Math.round(entityB.gdpPerCapitaNominal || entityB.gdpPerCapitaPpp || 48000).toLocaleString()} (${shortB})`,
          impactDirection: 'divergent',
          correlationType: 'structural_lag',
          explanation: `Long-term total factor productivity and human capital accumulation dictate relative living standard divergence.`,
        },
      },
    ],
  };
}
