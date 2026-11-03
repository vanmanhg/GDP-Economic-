import { EconomicMilestone, MilestoneCategory, EconomicEntity } from '../types';

export const ECONOMIC_MILESTONES: EconomicMilestone[] = [
  // ==========================================
  // GLOBAL MACROECONOMIC SHOCKS & REGIMES
  // ==========================================
  {
    id: 'global-2015-commodities',
    year: 2015,
    entityId: 'global',
    title: 'Global Commodity & Oil Price Slump',
    category: 'macro_shock',
    impactType: 'neutral',
    description: 'Crude oil tumbled below $40/bbl due to US shale supply growth and OPEC production policy, dampening inflation worldwide and hitting resource exporters.',
    policyDetails: 'Central banks in Europe and Japan pushed deeper into negative policy interest rates to ward off deflationary pressures.',
    keyStat: 'Crude oil drops -47% YoY',
  },
  {
    id: 'global-2016-brexit-shock',
    year: 2016,
    entityId: 'global',
    title: 'Brexit Referendum & Political Shifts',
    category: 'reform_trade',
    impactType: 'policy_shift',
    description: 'The UK voted to leave the European Union, causing immediate sterling depreciation and sparking long-term global trade and supply-chain recalibrations.',
    policyDetails: 'Global financial centers prepared for fragmentation in cross-border capital market clearance and customs borders.',
    keyStat: 'Sterling drops 15% to 30-year low',
  },
  {
    id: 'global-2017-tax-repatriation',
    year: 2017,
    entityId: 'global',
    title: 'Global Corporate Tax Arbitrage Shift',
    category: 'fiscal',
    impactType: 'positive',
    description: 'Sweeping corporate rate cuts in the US set off competitive fiscal rate reductions across OECD economies and prompted massive offshore cash repatriation.',
    policyDetails: 'Multinational tech and pharmaceutical balance sheets reallocated hundreds of billions in overseas liquidity.',
    keyStat: 'US corporate rate: 35% → 21%',
  },
  {
    id: 'global-2018-tariff-escalation',
    year: 2018,
    entityId: 'global',
    title: 'US-China Trade Tariff War Escalation',
    category: 'reform_trade',
    impactType: 'negative',
    description: 'Bilateral tariffs under US Section 301 and retaliatory Chinese levies affected over $350B of global trade flows, prompting supply chain diversification.',
    policyDetails: 'Manufacturing hubs in Southeast Asia (Vietnam, Malaysia) and Mexico experienced accelerated nearshoring and trade rerouting.',
    keyStat: 'Tariffs on $350B+ trade volume',
  },
  {
    id: 'global-2019-rate-pivot',
    year: 2019,
    entityId: 'global',
    title: 'Central Bank "Insurance" Rate Cuts',
    category: 'monetary',
    impactType: 'policy_shift',
    description: 'Signs of industrial slowdown and inverted bond yield curves prompted the Federal Reserve and ECB to pause monetary tightening and execute precautionary rate cuts.',
    policyDetails: 'Yield curve inversion raised recession concerns, prompting preemptive monetary easing across advanced economies.',
    keyStat: 'Fed cuts 3 times (75 bps total)',
  },
  {
    id: 'global-2020-covid-stimulus',
    year: 2020,
    entityId: 'global',
    title: 'COVID-19 Pandemic & Coordinated Global Stimulus',
    category: 'macro_shock',
    impactType: 'negative',
    description: 'Worldwide pandemic lockdowns shuttered commercial activity, precipitating the sharpest global economic contraction since the Great Depression.',
    policyDetails: 'Governments responded with over $16 Trillion in fiscal stimulus, while major central banks enacted emergency zero-rate cuts and unlimited QE bond purchases.',
    keyStat: 'Global GDP -3.1%; $16T+ fiscal aid',
  },
  {
    id: 'global-2021-supply-rebound',
    year: 2021,
    entityId: 'global',
    title: 'Reopening Bottlenecks & Container Shipping Surge',
    category: 'macro_shock',
    impactType: 'neutral',
    description: 'Rapid vaccination rollouts triggered explosive demand for durable goods, overwhelming ports and semi-conductor fabrication capacity.',
    policyDetails: 'Surging container freight rates (+500%) and energy commodity shortages sowed the initial seeds of 40-year-high consumer inflation.',
    keyStat: 'Shipping spot rates +500%',
  },
  {
    id: 'global-2022-inflation-tightening',
    year: 2022,
    entityId: 'global',
    title: 'Synchronized Monetary Tightening & Energy Shock',
    category: 'monetary',
    impactType: 'policy_shift',
    description: 'The Russia-Ukraine conflict sparked an acute European gas crisis and commodity spike. Global central banks responded with the most aggressive synchronized rate hikes in 40 years.',
    policyDetails: 'The Federal Reserve, ECB, Bank of England, and others executed multiple 50 and 75 bps mega-hikes to curb inflation exceeding 9-10%.',
    keyStat: 'Fed hikes 425 bps in 10 months',
  },
  {
    id: 'global-2023-ai-boom',
    year: 2023,
    entityId: 'global',
    title: 'Generative AI Capex Surge & Disinflation',
    category: 'fiscal',
    impactType: 'positive',
    description: 'Breakthrough advances in Generative AI triggered a global tech capital expenditure boom in high-performance semiconductors, datacenters, and power grids.',
    policyDetails: 'Supply chain normalization and declining energy prices accelerated headline disinflation across North America and Europe.',
    keyStat: 'AI datacenter capex exceeds $150B',
  },
  {
    id: 'global-2024-easing-cycle',
    year: 2024,
    entityId: 'global',
    title: 'Global Monetary Easing & Industrial Subsidies',
    category: 'monetary',
    impactType: 'policy_shift',
    description: 'With inflation cooling toward central bank 2% targets, the ECB, Fed, Bank of Canada, and Bank of England pivoted into rate-cutting cycles.',
    policyDetails: 'Nations intensified fiscal subsidies for green manufacturing and domestic chip fabrication (US IRA/CHIPS, EU Net Zero Industry Act).',
    keyStat: 'Fed & ECB begin rate reductions',
  },

  // ==========================================
  // UNITED STATES & US STATES (California, Texas, New York, Florida)
  // ==========================================
  {
    id: 'us-2017-tcja',
    year: 2017,
    entityId: 'us',
    title: 'Tax Cuts and Jobs Act (TCJA)',
    category: 'fiscal',
    impactType: 'policy_shift',
    description: 'Permanent reduction of federal statutory corporate income tax from 35% to 21% and temporary individual income tax reductions.',
    policyDetails: 'Introduced 100% bonus depreciation for business equipment and enacted a one-time deemed repatriation tax on foreign earnings.',
    keyStat: 'Corporate tax slashed: 35% → 21%',
  },
  {
    id: 'us-2020-cares-act',
    year: 2020,
    entityId: 'us',
    title: 'CARES Act & Emergency Federal Spending',
    category: 'fiscal',
    impactType: 'positive',
    description: 'The historic $2.2 Trillion CARES Act delivered economic impact payments, Paycheck Protection Program (PPP) forgivable loans, and enhanced unemployment benefits.',
    policyDetails: 'Federal Reserve lowered the federal funds target to 0.00%–0.25% and introduced novel credit facilities for municipalities and corporate bonds.',
    keyStat: '$2.2 Trillion CARES fiscal stimulus',
  },
  {
    id: 'us-2021-arp-infrastructure',
    year: 2021,
    entityId: 'us',
    title: 'American Rescue Plan & Infrastructure Act',
    category: 'fiscal',
    impactType: 'positive',
    description: '$1.9 Trillion American Rescue Plan stimulus checks followed by the $1.2 Trillion Bipartisan Infrastructure Law (IIJA) upgrading transportation, broadband, and utilities.',
    policyDetails: 'Provided direct assistance to state and local governments, insulating public sector payrolls from recessionary cuts.',
    keyStat: '$1.9T ARP + $1.2T Infrastructure Act',
  },
  {
    id: 'us-2022-chips-ira',
    year: 2022,
    entityId: 'us',
    title: 'CHIPS Act & Inflation Reduction Act (IRA)',
    category: 'fiscal',
    impactType: 'policy_shift',
    description: 'Enacted $52.7B in domestic semiconductor manufacturing subsidies (CHIPS) and $369B in clean energy tax credits and healthcare reforms (IRA).',
    policyDetails: 'Catalyzed over $200B in private semiconductor fabrication and clean technology manufacturing investments across American states.',
    keyStat: '$52.7B CHIPS + $369B Clean Energy credits',
  },
  {
    id: 'us-2023-debt-ceiling-fed-peak',
    year: 2023,
    entityId: 'us',
    title: 'Fiscal Responsibility Act & Fed Terminal Rate',
    category: 'monetary',
    impactType: 'neutral',
    description: 'Congress resolved the debt ceiling standoff by capping non-defense discretionary spending for two years, while the Fed raised rates to a 22-year peak of 5.25%-5.50%.',
    policyDetails: 'Despite monetary tightening, US GDP growth surprised to the upside (+2.5%), powered by resilient consumer spending and federal subsidies.',
    keyStat: 'Fed funds rate reaches peak 5.25-5.50%',
  },
  {
    id: 'us-2024-rate-cut-cycle',
    year: 2024,
    entityId: 'us',
    title: 'Federal Reserve Rate Cutting Pivot',
    category: 'monetary',
    impactType: 'policy_shift',
    description: 'Federal Open Market Committee initiated its easing cycle with a 50 bps cut in September 2024 as inflation moderated to 2.4% and the labor market cooled.',
    policyDetails: 'Public debt surpassed $35 Trillion (~122% of GDP), intensifying congressional focus on debt servicing and expiring 2017 tax cuts.',
    keyStat: '50 bps initial rate reduction',
  },

  // California
  {
    id: 'us-ca-2018-fifth-economy',
    year: 2018,
    entityId: 'us-ca',
    title: 'California Becomes 5th Largest World Economy',
    category: 'macro_shock',
    impactType: 'positive',
    description: 'Surpassed the United Kingdom in nominal GDP, driven by tech valuations in Silicon Valley, agricultural dominance, and strong entertainment and biotech sectors.',
    policyDetails: 'Robust capital gains revenue filled state budget reserve accounts to historic capacity under Proposition 2 rainy day requirements.',
    keyStat: 'GDP hits $3.0T; passes UK',
  },
  {
    id: 'us-ca-2020-covid-response',
    year: 2020,
    entityId: 'us-ca',
    title: 'First Statewide Lockdown & Tech Outperformance',
    category: 'macro_shock',
    impactType: 'neutral',
    description: 'California implemented early containment measures. While hospitality and small retail suffered, tech platforms (cloud, SaaS, streaming) saw explosive revenue growth.',
    policyDetails: 'Tech IPOs and capital gains delivered unexpected windfall tax receipts to the state treasury toward the end of the year.',
    keyStat: 'Tech market caps surge; IPO receipts boom',
  },
  {
    id: 'us-ca-2021-comeback-plan',
    year: 2021,
    entityId: 'us-ca',
    title: 'California Comeback Plan ($100B Budget Surplus)',
    category: 'fiscal',
    impactType: 'positive',
    description: 'Governor and Legislature enacted the $100 Billion California Comeback Plan, capitalizing on an unprecedented $76 Billion operating budget surplus.',
    policyDetails: 'Distributed $8.1B in direct "Golden State Stimulus" payments to middle and low-income residents and cleared billions in rent and utility debt.',
    keyStat: '$76B operating surplus; $100B package',
  },
  {
    id: 'us-ca-2022-record-surplus-rebate',
    year: 2022,
    entityId: 'us-ca',
    title: 'Record $97.5B Surplus & Middle-Class Tax Refund',
    category: 'fiscal',
    impactType: 'positive',
    description: 'State reported an all-time record $97.5 Billion budget surplus, triggering constitutional Gann Limit considerations and state tax refund checks.',
    policyDetails: 'Enacted $9.5B "Middle Class Tax Refund" payments sending up to $1,050 to California tax filers to offset high retail gasoline prices.',
    keyStat: '$97.5B peak budget surplus',
  },
  {
    id: 'us-ca-2023-deficit-ai-boom',
    year: 2023,
    entityId: 'us-ca',
    title: 'Tech Valuation Reset & Generative AI Boom',
    category: 'fiscal',
    impactType: 'policy_shift',
    description: 'Delayed tax filing deadlines from severe atmospheric river storms combined with 2022 tech valuation declines created a $31B state budget deficit.',
    policyDetails: 'Concurrently, Silicon Valley emerged as the epicenter of global Generative AI venture capital, capturing over 50% of worldwide AI funding.',
    keyStat: '$31B budget deficit; >50% of global AI VC',
  },
  {
    id: 'us-ca-2024-budget-stabilization',
    year: 2024,
    entityId: 'us-ca',
    title: 'State Budget Realignment & $20 Min Wage Law',
    category: 'fiscal',
    impactType: 'policy_shift',
    description: 'Legislature balanced a $45B budget shortfall using $16B from rainy day reserves and targeted program reductions without broad-based tax increases.',
    policyDetails: 'AB 1228 went into effect, instituting a nation-leading $20/hr minimum wage for fast-food workers with sector council oversight.',
    keyStat: '$16B reserve drawdown; $20/hr wage rule',
  },

  // Texas
  {
    id: 'us-tx-2019-school-tax-reform',
    year: 2019,
    entityId: 'us-tx',
    title: 'House Bill 3 School Finance & Tax Reform',
    category: 'fiscal',
    impactType: 'positive',
    description: 'The 86th Texas Legislature passed landmark House Bill 3, committing $11.6 Billion to public education and local school property tax compression.',
    policyDetails: 'Lowered school property tax rates statewide and increased state funding share for public education programs.',
    keyStat: '$11.6B education & tax compression act',
  },
  {
    id: 'us-tx-2020-oil-crash-resilience',
    year: 2020,
    entityId: 'us-tx',
    title: 'Negative WTI Crude Crash & Economic Pivot',
    category: 'macro_shock',
    impactType: 'negative',
    description: 'West Texas Intermediate crude oil briefly crashed to -$37/barrel in April 2020 amid pandemic storage saturation, hitting drilling and severance tax collections.',
    policyDetails: 'Strong corporate relocation inflows and diversification into advanced manufacturing and tech cushioned the downturn.',
    keyStat: 'WTI crude crashes to -$37/bbl',
  },
  {
    id: 'us-tx-2021-uri-relocations',
    year: 2021,
    entityId: 'us-tx',
    title: 'Winter Storm Uri & Major Corporate Relocations',
    category: 'macro_shock',
    impactType: 'neutral',
    description: 'Catastrophic winter storm caused grid failure and $130B in estimated economic damage, sparking urgent ERCOT electricity market reforms.',
    policyDetails: 'Despite the storm, Texas recorded record corporate relocations including Tesla moving global headquarters to Austin and Oracle relocating to Austin.',
    keyStat: 'Tesla & Oracle move HQ; ERCOT overhauled',
  },
  {
    id: 'us-tx-2023-historic-surplus-property-tax',
    year: 2023,
    entityId: 'us-tx',
    title: 'Record $32.7B Surplus & $18B Property Tax Cut',
    category: 'fiscal',
    impactType: 'positive',
    description: 'Buoyed by surging oil severance taxes, sales tax collections, and economic expansion, Texas generated a historic $32.7 Billion budget surplus.',
    policyDetails: 'Approved an $18 Billion property tax relief package increasing the homestead exemption to $100,000 and created the Texas CHIPS Act ($1.4B).',
    keyStat: '$32.7B surplus; $18B property tax relief',
  },
  {
    id: 'us-tx-2024-eighth-largest-economy',
    year: 2024,
    entityId: 'us-tx',
    title: 'Texas Economy Reaches $2.6T (8th in World Equiv.)',
    category: 'fiscal',
    impactType: 'positive',
    description: 'Nominal GDP crossed $2.6 Trillion, cementing Texas as equivalent to the 8th largest economy in the world, outproducing Italy, Russia, and Canada.',
    policyDetails: 'Crude oil output reached a record 5.6 million barrels per day, driving high export volumes through Corpus Christi and Houston.',
    keyStat: 'GDP reaches $2.6T; 5.6M bpd crude record',
  },

  // ==========================================
  // UNITED KINGDOM & LONDON
  // ==========================================
  {
    id: 'gb-2016-brexit-vote',
    year: 2016,
    entityId: 'gb',
    title: 'EU Referendum (Brexit) Decision',
    category: 'reform_trade',
    impactType: 'policy_shift',
    description: 'UK voted 51.9% to 48.1% to leave the European Union. Sterling fell to 30-year lows against the USD and BoE cut the base interest rate to 0.25%.',
    policyDetails: 'Bank of England initiated a £60B government bond purchase program and £10B corporate bond facility to buffer financial markets.',
    keyStat: 'Sterling drops 15%; BoE cuts to 0.25%',
  },
  {
    id: 'gb-2020-furlough-lockdown',
    year: 2020,
    entityId: 'gb',
    title: 'Coronavirus Job Retention Scheme (Furlough)',
    category: 'fiscal',
    impactType: 'positive',
    description: 'Chancellor Rishi Sunak introduced the furlough scheme paying 80% of wages up to £2,500/month, supporting 11.6 million jobs at a cost of £70B.',
    policyDetails: 'UK GDP contracted by 10.4% in 2020, the largest annual drop in over 300 years, while public borrowing reached £320B (15% of GDP).',
    keyStat: '£70B Furlough Scheme; GDP -10.4%',
  },
  {
    id: 'gb-2021-tca-eu-exit',
    year: 2021,
    entityId: 'gb',
    title: 'EU-UK Trade and Cooperation Agreement Takes Effect',
    category: 'reform_trade',
    impactType: 'policy_shift',
    description: 'UK formally exited the EU single market and customs union on January 1, 2021. Replaced free movement with tariff-free but regulatory-checked trade.',
    policyDetails: 'Introduced new customs declarations and sanitary controls on cross-channel freight while ending passporting for London financial services.',
    keyStat: 'Formal departure from EU Single Market',
  },
  {
    id: 'gb-2022-mini-budget-crisis',
    year: 2022,
    entityId: 'gb',
    title: 'Kwasi Kwarteng "Mini-Budget" & Gilt Market Crisis',
    category: 'fiscal',
    impactType: 'negative',
    description: 'Unveiled £45B in unfunded tax cuts without fiscal oversight from the OBR. Triggered a sudden collapse in gilt prices and sterling, threatening UK pension funds.',
    policyDetails: 'Bank of England intervened with a £65B emergency gilt purchase facility; Prime Minister Truss and Chancellor Kwarteng resigned shortly after.',
    keyStat: '30Y Gilt yields spike +120 bps; emergency BoE QE',
  },
  {
    id: 'gb-2023-corp-tax-hike-full-expensing',
    year: 2023,
    entityId: 'gb',
    title: 'Corporation Tax Hike & Permanent Full Expensing',
    category: 'fiscal',
    impactType: 'policy_shift',
    description: 'UK headline corporation tax increased from 19% to 25% for profits over £250k to help consolidate public finances after pandemic spending.',
    policyDetails: 'Chancellor Hunt instituted permanent "Full Expensing" for corporate capital investments, allowing 100% first-year tax write-offs for plant and machinery.',
    keyStat: 'Corporation tax: 19% → 25%; Full expensing',
  },
  {
    id: 'gb-2024-monetary-pivot-labour',
    year: 2024,
    entityId: 'gb',
    title: 'Bank of England Cuts Rates & Labour Fiscal Rules',
    category: 'monetary',
    impactType: 'policy_shift',
    description: 'Bank of England executed its first interest rate cut in 4 years (5.25% to 5.00%) as headline CPI returned to the 2% target.',
    policyDetails: 'New Labour government conducted public spending audits and affirmed adherence to strict fiscal rules requiring debt to fall as a share of GDP within 5 years.',
    keyStat: 'BoE cuts base rate to 5.00%',
  },

  // Greater London
  {
    id: 'gb-lon-2019-fintech-hub',
    year: 2019,
    entityId: 'gb-lon',
    title: 'London FinTech Investment Eclipse of European Peers',
    category: 'fiscal',
    impactType: 'positive',
    description: 'London attracted over $9.7B in venture capital investment into financial technology, exceeding Paris, Frankfurt, and Berlin combined.',
    policyDetails: 'FCA regulatory sandbox and open banking mandates bolstered London’s competitive edge despite looming Brexit deadlines.',
    keyStat: '$9.7B FinTech venture capital raised',
  },
  {
    id: 'gb-lon-2022-elizabeth-line',
    year: 2022,
    entityId: 'gb-lon',
    title: 'Elizabeth Line (Crossrail) Opens to Traffic',
    category: 'fiscal',
    impactType: 'positive',
    description: 'The £19B Elizabeth Line began passenger services, connecting Heathrow and Reading to the City of London and Canary Wharf with 10% capacity expansion.',
    policyDetails: 'Significantly reduced commute times and catalyzed billions in commercial real estate developments along the route.',
    keyStat: '£19B infrastructure project opens',
  },

  // ==========================================
  // GERMANY & GERMAN STATES (Bavaria, Baden-Württemberg)
  // ==========================================
  {
    id: 'de-2020-debt-brake-suspension',
    year: 2020,
    entityId: 'de',
    title: 'Suspension of "Schuldenbremse" (Debt Brake)',
    category: 'fiscal',
    impactType: 'policy_shift',
    description: 'Bundestag suspended the constitutional debt brake for the first time since its 2009 inception, passing a €130 Billion economic stimulus package.',
    policyDetails: 'Temporary VAT reduction (19% to 16%) and family bonuses deployed to sustain domestic consumer demand during lockdowns.',
    keyStat: '€130B stimulus; Debt Brake suspended',
  },
  {
    id: 'de-2022-zeitenwende-energy-shield',
    year: 2022,
    entityId: 'de',
    title: '"Zeitenwende" Defense Fund & €200B Energy Shield',
    category: 'fiscal',
    impactType: 'policy_shift',
    description: 'Chancellor Scholz proclaimed a historic geopolitical turning point, approving a €100B special fund for the Bundeswehr armed forces.',
    policyDetails: 'Following Russian gas cutoffs, Germany enacted a €200 Billion "Doppel-Wumms" Economic Defense Shield capping electricity and heating prices.',
    keyStat: '€100B military fund + €200B energy shield',
  },
  {
    id: 'de-2023-court-debt-brake-ruling',
    year: 2023,
    entityId: 'de',
    title: 'Constitutional Court Climate Fund Debt Ruling',
    category: 'fiscal',
    impactType: 'negative',
    description: 'Federal Constitutional Court (Karlsruhe) ruled the reallocation of €60B in unused pandemic credit to the Climate & Transformation Fund (KTF) unconstitutional.',
    policyDetails: 'Triggered immediate federal budget freezes, cancellation of planned industrial energy subsidies, and forced return to strict fiscal austerity.',
    keyStat: '€60B climate funding invalidated by court',
  },
  {
    id: 'de-2024-industrial-stagnation-reform',
    year: 2024,
    entityId: 'de',
    title: 'Growth Initiative & Structural Competitiveness Package',
    category: 'reform_trade',
    impactType: 'neutral',
    description: 'Confronting two consecutive years of near-zero real growth and high industrial power prices, federal cabinet passed 49-point Growth Initiative.',
    policyDetails: 'Targeted accelerated tax depreciation for clean machinery, skilled immigration facilitation, and corporate research tax allowances.',
    keyStat: '49-point Growth Initiative enacted',
  },

  // ==========================================
  // CHINA & PROVINCES (Guangdong, Jiangsu)
  // ==========================================
  {
    id: 'cn-2015-made-in-china-2025',
    year: 2015,
    entityId: 'cn',
    title: '"Made in China 2025" Strategic Blueprint',
    category: 'reform_trade',
    impactType: 'policy_shift',
    description: 'State Council launched the landmark industrial plan targeting 70% domestic self-sufficiency in 10 priority high-tech sectors including EVs and robotics.',
    policyDetails: 'Coordinated state credit, provincial subsidies, and local industrial parks around advanced hardware manufacturing.',
    keyStat: '10 strategic tech sectors prioritized',
  },
  {
    id: 'cn-2018-tariff-friction',
    year: 2018,
    entityId: 'cn',
    title: 'Bilateral Tariff War & Export Diversification',
    category: 'reform_trade',
    impactType: 'neutral',
    description: 'US placed 25% tariffs on $250B of Chinese goods; China responded with reciprocal levies on $110B of US agricultural and industrial products.',
    policyDetails: 'Chinese exporters diversified into Belt and Road Initiative (BRI) and ASEAN markets, which soon surpassed the US as China’s largest trading partner.',
    keyStat: 'ASEAN becomes China’s #1 trade partner',
  },
  {
    id: 'cn-2020-dual-circulation',
    year: 2020,
    entityId: 'cn',
    title: '"Dual Circulation" Economic Framework',
    category: 'reform_trade',
    impactType: 'policy_shift',
    description: 'Beijing articulated a new paradigm prioritizing domestic consumption and domestic supply-chain autonomy (internal circulation) while remaining open to global trade.',
    policyDetails: 'China was the sole major world economy to register positive GDP growth (+2.2%) in 2020 due to rapid industrial reopening.',
    keyStat: 'GDP +2.2% in 2020 (sole major growing economy)',
  },
  {
    id: 'cn-2021-three-red-lines-real-estate',
    year: 2021,
    entityId: 'cn',
    title: '"Three Red Lines" Real Estate Deleveraging',
    category: 'fiscal',
    impactType: 'negative',
    description: 'Regulators enforced strict balance-sheet borrowing constraints on property developers, triggering liquidity crises and default by China Evergrande Group.',
    policyDetails: 'Began multi-year property market contraction that severely curtailed local government land-sale revenues across provinces.',
    keyStat: 'Strict leverage caps on property developers',
  },
  {
    id: 'cn-2023-ev-export-leadership',
    year: 2023,
    entityId: 'cn',
    title: 'China Becomes World’s #1 Automobile Exporter',
    category: 'reform_trade',
    impactType: 'positive',
    description: 'Surpassed Japan to become the world’s top automotive exporter with 5.22 million vehicles shipped, led by battery electric vehicles (BEVs) and hybrids.',
    policyDetails: 'Guangdong and Jiangsu mega-factories (BYD, CATL) drove unprecedented global market share gains in battery and EV manufacturing.',
    keyStat: '5.22M vehicles exported; passes Japan',
  },
  {
    id: 'cn-2024-stimulus-package',
    year: 2024,
    entityId: 'cn',
    title: 'Broad Monetary & Fiscal Stimulus Package',
    category: 'monetary',
    impactType: 'positive',
    description: 'PBOC, CSRC, and Ministry of Finance announced synchronized stimulus including 50 bps reserve requirement (RRR) cut, mortgage rate reductions, and sovereign debt issuance.',
    policyDetails: 'Pledged over ¥2 Trillion in ultra-long special sovereign bonds to support consumer trade-ins and recapitalize state commercial banks.',
    keyStat: '50 bps RRR cut; ¥2T special sovereign bond quota',
  },

  // Guangdong
  {
    id: 'cn-gd-2019-greater-bay-area',
    year: 2019,
    entityId: 'cn-gd',
    title: 'Greater Bay Area (GBA) Masterplan Unveiled',
    category: 'reform_trade',
    impactType: 'positive',
    description: 'Central government published outline development plan integrating Guangdong’s 9 Pearl River Delta cities with Hong Kong and Macao into an 86-million-person cluster.',
    policyDetails: 'High-speed rail connections and simplified cross-border financial and professional services qualifications implemented.',
    keyStat: '86M population integrated economic zone',
  },
  {
    id: 'cn-gd-2023-byd-ev-surge',
    year: 2023,
    entityId: 'cn-gd',
    title: 'Guangdong EV & High-Tech Export Milestone',
    category: 'reform_trade',
    impactType: 'positive',
    description: 'Shenzhen-headquartered BYD briefly overtook Tesla in global pure EV deliveries in Q4 2023, establishing Guangdong as the world center of the EV supply chain.',
    policyDetails: 'Provincial GVA exceeded ¥13.5 Trillion ($1.9T), equivalent in size to the entire economy of South Korea or Australia.',
    keyStat: 'Provincial GDP matches South Korea (~$1.9T)',
  },

  // ==========================================
  // JAPAN & TOKYO
  // ==========================================
  {
    id: 'jp-2016-nirp-ycc',
    year: 2016,
    entityId: 'jp',
    title: 'Negative Interest Rates & Yield Curve Control (YCC)',
    category: 'monetary',
    impactType: 'policy_shift',
    description: 'Bank of Japan under Governor Kuroda introduced negative interest rates (-0.1%) and pioneered Yield Curve Control, pegging 10-year JGB yields near 0.0%.',
    policyDetails: 'Massive qualitative and quantitative monetary easing designed to shake Japan out of a quarter-century of deflationary expectations.',
    keyStat: 'Policy rate cut to -0.1%; 10Y yield pegged to 0%',
  },
  {
    id: 'jp-2019-consumption-tax-10',
    year: 2019,
    entityId: 'jp',
    title: 'Consumption Tax Raised to 10%',
    category: 'fiscal',
    impactType: 'policy_shift',
    description: 'National sales tax rate increased from 8% to 10% to secure sustainable funding for Japan’s rapidly expanding social security and eldercare obligations.',
    policyDetails: 'Introduced targeted cashless payment rebates and food exemptions to soften consumer demand volatility.',
    keyStat: 'Consumption tax raised from 8% to 10%',
  },
  {
    id: 'jp-2020-record-stimulus-package',
    year: 2020,
    entityId: 'jp',
    title: 'Record ¥117 Trillion Emergency Economic Package',
    category: 'fiscal',
    impactType: 'positive',
    description: 'Prime Minister Abe approved the largest stimulus package in Japanese history (¥117.1T, ~21% of GDP) with direct ¥100,000 cash handouts per citizen.',
    policyDetails: 'Tokyo 2020 Olympic and Paralympic Games postponed by one year due to global pandemic spread.',
    keyStat: '¥117.1T emergency package (~21% GDP)',
  },
  {
    id: 'jp-2024-exit-negative-rates',
    year: 2024,
    entityId: 'jp',
    title: 'Historic End of Negative Interest Rate Era',
    category: 'monetary',
    impactType: 'policy_shift',
    description: 'Under Governor Ueda, Bank of Japan raised short-term interest rates for the first time in 17 years, terminating negative interest rates and YCC.',
    policyDetails: 'Historic "Shunto" spring wage negotiations secured average salary increases exceeding 5.1%, confirming sustained virtuous wage-price dynamics.',
    keyStat: 'First rate hike in 17 years; Shunto wages +5.1%',
  },

  // ==========================================
  // INDIA & MAHARASHTRA
  // ==========================================
  {
    id: 'in-2016-demonetization-ibc',
    year: 2016,
    entityId: 'in',
    title: 'Currency Demonetization & Bankruptcy Code',
    category: 'reform_trade',
    impactType: 'neutral',
    description: 'Government demonetized 86% of circulating cash (₹500 & ₹1,000 notes) overnight to promote digital transactions and curb illicit wealth.',
    policyDetails: 'Parliament passed landmark Insolvency and Bankruptcy Code (IBC) cleaning up non-performing bank loans across the banking sector.',
    keyStat: 'Insolvency & Bankruptcy Code enacted',
  },
  {
    id: 'in-2017-gst-rollout',
    year: 2017,
    entityId: 'in',
    title: 'Nationwide Goods and Services Tax (GST) Rollout',
    category: 'fiscal',
    impactType: 'positive',
    description: 'Replaced a labyrinth of cascading state and federal excise taxes with a unified national GST, creating a seamless single internal market across India.',
    policyDetails: 'Constitutional amendment streamlined logistics and drastically reduced interstate transport checkpoint wait times.',
    keyStat: 'Unified 17 separate federal & state taxes',
  },
  {
    id: 'in-2019-corporate-tax-cut',
    year: 2019,
    entityId: 'in',
    title: 'Sweeping Corporate Income Tax Cut to 22%',
    category: 'fiscal',
    impactType: 'positive',
    description: 'Finance Minister slashed base corporate tax from 30% to 22% for existing firms and to 15% for newly incorporated manufacturing plants.',
    policyDetails: 'Brought Indian statutory corporate tax into competitive alignment with East Asian manufacturing hubs to attract foreign direct investment.',
    keyStat: 'Corporate tax: 30% → 22% (15% for new manufacturing)',
  },
  {
    id: 'in-2022-fifth-largest-economy',
    year: 2022,
    entityId: 'in',
    title: 'India Surpasses United Kingdom as 5th Economy',
    category: 'macro_shock',
    impactType: 'positive',
    description: 'India overtook the United Kingdom in nominal GDP, solidifying its position as the fastest-growing major economy globally.',
    policyDetails: 'Reserve Bank of India navigated global inflation with calibrated rate increases to 6.50% while foreign exchange reserves stayed above $600B.',
    keyStat: 'GDP overtakes UK; 5th in world ranking',
  },
  {
    id: 'in-2024-infrastructure-capex-budget',
    year: 2024,
    entityId: 'in',
    title: 'Record ₹11.11 Lakh Crore Capex Allocation',
    category: 'fiscal',
    impactType: 'positive',
    description: 'Union Budget elevated capital expenditure to ₹11.11 Lakh Crore (3.4% of GDP) for high-speed expressways, dedicated freight corridors, and ports.',
    policyDetails: 'GDP expanded at a world-leading 7.2% rate, driven by manufacturing PLI incentives and domestic digital public infrastructure (UPI/ONDC).',
    keyStat: '₹11.11 Lakh Cr capital expenditure (~$134B)',
  },

  // ==========================================
  // FRANCE
  // ==========================================
  {
    id: 'fr-2017-macron-reforms',
    year: 2017,
    entityId: 'fr',
    title: 'Labor Code Overhaul & Wealth Tax Replacement',
    category: 'fiscal',
    impactType: 'policy_shift',
    description: 'President Macron enacted executive ordinances reforming the French labor code and replaced the Solidarity Wealth Tax (ISF) with a real estate-only tax (IFI).',
    policyDetails: 'Capped dismissal damages for employment tribunals and phased corporate tax reductions down toward 25%.',
    keyStat: 'Labor ordinances; ISF replaced with IFI',
  },
  {
    id: 'fr-2020-france-relance',
    year: 2020,
    entityId: 'fr',
    title: 'France Relance €100 Billion Recovery Plan',
    category: 'fiscal',
    impactType: 'positive',
    description: 'Approved €100B recovery package targeting ecological transition (€30B), economic competitiveness (€34B), and social cohesion (€36B).',
    policyDetails: 'Cut production taxes on businesses (CVAE) by €10B per year to incentivize industrial reshoring.',
    keyStat: '€100B package; €10B/yr production tax cuts',
  },
  {
    id: 'fr-2023-pension-reform',
    year: 2023,
    entityId: 'fr',
    title: 'Enactment of Pension Reform (Retirement Age to 64)',
    category: 'fiscal',
    impactType: 'policy_shift',
    description: 'Government utilized constitutional mechanism Article 49.3 to raise the statutory retirement age from 62 to 64 to eliminate projected structural pension deficits.',
    policyDetails: 'Sparked nationwide industrial action but secured sovereign credit credibility with European fiscal monitors.',
    keyStat: 'Statutory retirement age raised: 62 → 64',
  },

  // ==========================================
  // CANADA & ONTARIO
  // ==========================================
  {
    id: 'ca-2018-cusma-usmca',
    year: 2018,
    entityId: 'ca',
    title: 'CUSMA / USMCA Trade Agreement Concluded',
    category: 'reform_trade',
    impactType: 'policy_shift',
    description: 'Canada, the US, and Mexico concluded negotiations replacing the 1994 NAFTA with the United States-Mexico-Canada Agreement (CUSMA/USMCA).',
    policyDetails: 'Raised automotive regional value content to 75% and secured cross-border access for Canadian resource and manufacturing supply chains.',
    keyStat: 'USMCA replaces NAFTA; 75% auto rule',
  },
  {
    id: 'ca-2020-cerb-emergency',
    year: 2020,
    entityId: 'ca',
    title: 'Canada Emergency Response Benefit (CERB)',
    category: 'fiscal',
    impactType: 'positive',
    description: 'Federal government launched the CERB program providing C$2,000 per 4-week period to workers affected by pandemic shutdowns, distributing C$81.6B.',
    policyDetails: 'Federal deficit reached C$327 Billion (14.8% of GDP), the highest peacetime shortfall in Canadian history.',
    keyStat: 'C$81.6B CERB aid; C$327B federal deficit',
  },
  {
    id: 'ca-2024-rate-cut-first-g7',
    year: 2024,
    entityId: 'ca',
    title: 'Bank of Canada Becomes First G7 Central Bank to Cut Rates',
    category: 'monetary',
    impactType: 'policy_shift',
    description: 'Governor Macklem cut the policy interest rate by 25 bps in June 2024, making Canada the first G7 central bank to begin easing after the inflation cycle.',
    policyDetails: 'Concurrently, federal budget raised the capital gains inclusion rate from 50% to 66.7% for corporations and individuals over C$250k.',
    keyStat: 'First G7 bank to cut; capital gains tax revision',
  },

  // ==========================================
  // AUSTRALIA & NEW SOUTH WALES
  // ==========================================
  {
    id: 'au-2020-jobkeeper-border-closure',
    year: 2020,
    entityId: 'au',
    title: 'JobKeeper Wage Subsidy & International Border Closures',
    category: 'fiscal',
    impactType: 'positive',
    description: 'Federal government introduced the A$89 Billion JobKeeper wage subsidy maintaining employee attachment during complete international border closures.',
    policyDetails: 'Reserve Bank of Australia cut the cash rate target to a record low of 0.10% and launched quantitative bond buying.',
    keyStat: 'A$89B JobKeeper scheme; cash rate at 0.10%',
  },
  {
    id: 'au-2023-resource-surplus',
    year: 2023,
    entityId: 'au',
    title: 'Resource Export Boom Delivers Consecutive Budget Surpluses',
    category: 'fiscal',
    impactType: 'positive',
    description: 'High global prices for iron ore, metallurgical coal, and liquefied natural gas (LNG) generated a surprise A$22.1B federal budget surplus.',
    policyDetails: 'The first back-to-back Australian federal budget surpluses in nearly two decades substantially lowered net sovereign debt issuance.',
    keyStat: 'A$22.1B federal budget surplus',
  },
  {
    id: 'au-2024-stage-3-tax-restructuring',
    year: 2024,
    entityId: 'au',
    title: 'Restructuring of Stage 3 Personal Income Tax Cuts',
    category: 'fiscal',
    impactType: 'policy_shift',
    description: 'Albanese government redesigned the legislated Stage 3 tax cuts, redirecting savings towards low and middle-income earners facing cost-of-living pressures.',
    policyDetails: 'Delivered tax relief to all 13.6 million Australian taxpayers while halving the benefit for top-bracket earners.',
    keyStat: 'Stage 3 tax cuts redirected to 13.6M taxpayers',
  },
];

/**
 * Returns all milestones applicable to an entity (including its parent country if it is a region)
 */
export function getMilestonesForEntity(entity: EconomicEntity): EconomicMilestone[] {
  const ids = [entity.id];
  if (entity.countryId) {
    ids.push(entity.countryId);
  }

  return ECONOMIC_MILESTONES.filter((m) => ids.includes(m.entityId));
}

/**
 * Returns all milestones relevant to a comparison between Entity A and Entity B,
 * including global macroeconomic events.
 */
export function getRelevantMilestones(
  entityA: EconomicEntity,
  entityB: EconomicEntity,
  categoryFilter?: MilestoneCategory | 'all'
): EconomicMilestone[] {
  const applicableIds = new Set<string>(['global', entityA.id, entityB.id]);

  if (entityA.countryId) applicableIds.add(entityA.countryId);
  if (entityB.countryId) applicableIds.add(entityB.countryId);

  return ECONOMIC_MILESTONES.filter((m) => {
    const matchesEntity = applicableIds.has(m.entityId);
    if (!matchesEntity) return false;
    if (categoryFilter && categoryFilter !== 'all') {
      return m.category === categoryFilter;
    }
    return true;
  }).sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    // Put global first, then specific
    if (a.entityId === 'global' && b.entityId !== 'global') return -1;
    if (b.entityId === 'global' && a.entityId !== 'global') return 1;
    return 0;
  });
}

/**
 * Quick helper to get milestones for a specific year for the current comparison
 */
export function getMilestonesForYear(
  year: number,
  entityA: EconomicEntity,
  entityB: EconomicEntity
): {
  globalMilestones: EconomicMilestone[];
  entityAMilestones: EconomicMilestone[];
  entityBMilestones: EconomicMilestone[];
} {
  const aIds = new Set<string>([entityA.id]);
  if (entityA.countryId) aIds.add(entityA.countryId);

  const bIds = new Set<string>([entityB.id]);
  if (entityB.countryId) bIds.add(entityB.countryId);

  const yearMilestones = ECONOMIC_MILESTONES.filter((m) => m.year === year);

  const globalMilestones = yearMilestones.filter((m) => m.entityId === 'global');
  const entityAMilestones = yearMilestones.filter((m) => aIds.has(m.entityId));
  const entityBMilestones = yearMilestones.filter((m) => bIds.has(m.entityId));

  return {
    globalMilestones,
    entityAMilestones,
    entityBMilestones,
  };
}
