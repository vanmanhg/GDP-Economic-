import {
  EconomicEntity,
  EntityFiscalProfile,
  FiscalFocusAngle,
  FiscalPolicyAnalysisResponse,
} from '../types';

export function getEntityFiscalProfile(entity: Partial<EconomicEntity>): EntityFiscalProfile {
  const id = entity.id || '';
  const name = entity.name || entity.shortName || 'Economy';
  const shortName = entity.shortName || name;
  const flag = entity.flag || '🌐';
  const debt = entity.publicDebtToGdp ?? 75;
  const isSubnational = entity.type === 'region';

  if (id === 'us') {
    return {
      name: 'United States',
      shortName: 'USA',
      flag: '🇺🇸',
      fiscalPosture: 'Expansionary',
      fiscalHealthRating: 'Elevated Deficit Stress',
      deficitTrend: '-6.2% of GDP (~$1.9T annual federal deficit)',
      headlineStrategy:
        'Supply-side modern industrial strategy combining large-scale strategic subsidies (semiconductors, clean tech) with structural entitlement spending and heavy reliance on Treasury market liquidity.',
      corePillars: [
        {
          pillar: 'Industrial Policy & Subsidies',
          description:
            'Federal tax credits and direct grants catalyzing domestic manufacturing, clean energy deployment, and advanced semiconductor fabrication.',
          impact:
            'Accelerated private CAPEX in high-tech manufacturing; increased medium-term federal outlays.',
        },
        {
          pillar: 'Federal Taxation & Revenue',
          description:
            'Flat 21% federal corporate income tax rate, TCJA individual brackets, and 15% corporate alternative minimum tax (CAMT).',
          impact:
            'High business investment responsiveness, balanced against lower structural tax revenue collection as a % of GDP (approx 16-17%).',
        },
        {
          pillar: 'Mandatory Entitlement Obligations',
          description:
            'Social Security, Medicare, Medicaid, and rising net interest payments consuming over 65% of annual federal budgetary receipts.',
          impact:
            'Non-discretionary spending locks in persistent deficits regardless of political administration.',
        },
        {
          pillar: 'Treasury Debt Issuance',
          description:
            'World reserve currency status allows immense debt absorption, but surging net interest expense surpasses defense spending.',
          impact:
            'Heightened sensitivity of federal budget balance to Federal Reserve policy rate decisions.',
        },
      ],
      recentReforms: [
        {
          year: '2022',
          title: 'Inflation Reduction Act (IRA)',
          description:
            'Established uncapped 10-year clean energy tax credits, drug price negotiation for Medicare, and a 1% excise tax on corporate stock buybacks.',
          strategicGoal:
            'Decarbonize the industrial energy grid and revitalize domestic battery/EV supply chains.',
          budgetScale: '$369B authorized tax credits & spending',
        },
        {
          year: '2022',
          title: 'CHIPS and Science Act',
          description:
            'Provided direct funding subsidies and 25% advanced manufacturing investment tax credits for domestic semiconductor foundry construction.',
          strategicGoal:
            'Reshore national defense-critical microchip fabrication and R&D facilities.',
          budgetScale: '$52.7B in direct subsidies + $24B tax incentives',
        },
        {
          year: '2021',
          title: 'Infrastructure Investment and Jobs Act (IIJA)',
          description:
            'Bipartisan 5-year authorization targeting surface transportation, power grid modernization, passenger rail, and nationwide broadband rollout.',
          strategicGoal: 'Upgrade foundational physical logistics and close digital divide.',
          budgetScale: '$1.2 Trillion ($550B new federal spending)',
        },
        {
          year: '2023-2024',
          title: 'Fiscal Responsibility Act (Debt Ceiling Accord)',
          description:
            'Instituted statutory caps on non-defense discretionary spending for FY2024 and FY2025, with automatic across-the-board sequestration triggers.',
          strategicGoal:
            'Enforce short-term discretionary spending discipline while deferring entitlement reform.',
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
      headlineStrategy:
        'Strict adherence to fiscal rules to rebuild credibility post-Gilt crisis, targeting falling debt-to-GDP within 5 years while increasing public investment through revised accounting rules.',
      corePillars: [
        {
          pillar: 'Statutory Fiscal Anchors',
          description:
            'Mandate to have public sector net debt (now redefined to net financial liabilities) falling as a share of GDP in the 5th year of the forecast.',
          impact:
            'Restricts discretionary departmental budgets while carving out headroom for infrastructure investments.',
        },
        {
          pillar: 'High Tax Burden & Fiscal Drag',
          description:
            'Frozen personal allowance thresholds pulling workers into higher income tax bands; 25% corporation tax rate.',
          impact:
            'Tax receipts reaching highest post-WWII share of GDP (~37%), depressing real disposable wage growth.',
        },
        {
          pillar: 'Targeted Capital Investment',
          description:
            'Establishment of the National Wealth Fund and Great British Energy to mobilize private capital into clean transition.',
          impact:
            'Directs constrained Treasury funds to co-invest alongside pension funds and sovereign partners.',
        },
        {
          pillar: 'National Health & Welfare Pressures',
          description:
            'Severe strain on NHS waiting lists and escalating disability/sickness benefit rolls constraining fiscal maneuverability.',
          impact:
            'Forces trade-offs between day-to-day public service delivery and capital modernization.',
        },
      ],
      recentReforms: [
        {
          year: '2024',
          title: 'Autumn Budget & Fiscal Framework Reset',
          description:
            'Shifted debt target to Public Sector Net Financial Liabilities (PSNFL), raising employer National Insurance contributions and capital gains tax.',
          strategicGoal:
            'Unlock ~£20-30B in balance sheet space for transport, schools, and NHS hospital construction.',
          budgetScale: '£40B annual tax increase package',
        },
        {
          year: '2023',
          title: 'Permanent Full Expensing Reform',
          description:
            'Allowed businesses to write off 100% of the cost of qualifying plant and machinery investment against taxable profits in Year 1.',
          strategicGoal:
            'Overcome chronic UK business underinvestment compared to G7 peers.',
          budgetScale: '£10B annual corporate investment incentive',
        },
        {
          year: '2022-2023',
          title: 'Energy Profits Levy & Fiscal Stabilization',
          description:
            'Instituted 35% windfall tax on North Sea oil and gas producers alongside temporary electricity generator levy to fund household utility subsidies.',
          strategicGoal:
            'Shield consumers from Ukraine shock without triggering unanchored gilt yield spikes.',
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
      deficitTrend: 'Constitutional balanced budget requirement (managed via reserves)',
      headlineStrategy:
        'Highly progressive tax structure financing nation-leading climate, education, and infrastructure projects, counter-balanced by rigid constitutional reserve replenishment rules.',
      corePillars: [
        {
          pillar: 'Progressive Revenue Mobilization',
          description:
            'Top personal marginal income tax rate of 13.3% and 8.84% corporate franchise tax; top 1% taxpayers generate nearly 50% of personal income tax revenues.',
          impact:
            'Extreme sensitivity to tech IPO cycles, stock market swings, and Silicon Valley capital gains.',
        },
        {
          pillar: 'Constitutional Reserve Disciplines',
          description:
            'Proposition 2 mandates annual deposits into the Budget Stabilization Account (Rainy Day Fund) and school reserves during boom years.',
          impact:
            'Provides tens of billions in liquidity cushions to absorb sharp revenue contractions without immediate systemic austerity.',
        },
        {
          pillar: 'Cap-and-Trade & Climate Investments',
          description:
            'Auction revenues from the state Greenhouse Gas Reduction Fund dedicated to clean transit, high-speed rail, and grid decarbonization.',
          impact: 'Autonomous green financing mechanism outside the general fund.',
        },
        {
          pillar: 'Public Infrastructure Bonds',
          description:
            'Frequent voter-approved General Obligation bonds funding water reservoirs, schools, wildfire mitigation, and affordable housing.',
          impact:
            'Leverages high state bond ratings to spread capital costs across 30-year amortization windows.',
        },
      ],
      recentReforms: [
        {
          year: '2024',
          title: 'Proposition 4 Climate & Clean Water Bond',
          description:
            'Voter-approved bond issuing $10 billion for safe drinking water, forest health, wildfire prevention, and climate-resilient coastal infrastructure.',
          strategicGoal:
            'Hedge agricultural regions and urban centers against acute climate shocks.',
          budgetScale: '$10 Billion General Obligation issuance',
        },
        {
          year: '2023-2024',
          title: 'Multi-Tiered Budget Deficit Normalization Act',
          description:
            'Addressed a multi-year $45B+ budget contraction using $16B in rainy day reserves, spending reductions, delayed capital outlays, and internal borrowing.',
          strategicGoal:
            'Preserve core healthcare (Medi-Cal expansion) and K-12 education funding guarantees under Proposition 98.',
          budgetScale: '$45B balance sheet reconciliation',
        },
        {
          year: '2022',
          title: 'Middle Class Tax Refund & Gas Price Relief',
          description:
            'Disbursed $9.5 billion in direct cash stimulus payments to 31 million residents using historical post-pandemic budget windfall surplus.',
          strategicGoal:
            'Offset high retail gasoline and utility price surges during peak inflationary cycle.',
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
      headlineStrategy:
        'Constitutional debt brake (Schuldenbremse) enforcing strict balance sheet discipline, balancing industrial transformation with rigorous deficit limits.',
      corePillars: [
        {
          pillar: 'Constitutional Schuldenbremse',
          description:
            'Article 115 of the Basic Law caps structural federal borrowing at 0.35% of GDP under normal macroeconomic conditions.',
          impact:
            'Keeps sovereign debt-to-GDP (~63%) lowest among G7 nations; limits public investment in aging transport and energy grids.',
        },
        {
          pillar: 'Off-Budget Special Funds (Sondervermögen)',
          description:
            'Dedicated multi-year vehicles such as the Bundeswehr Defense Modernization Fund (€100B) and Climate and Transformation Fund (KTF).',
          impact:
            'Allows specific strategic priorities to be financed while maintaining formal federal budget compliance.',
        },
        {
          pillar: 'High Social Contribution & Payroll Surcharges',
          description:
            'Comprehensive statutory social insurance system (pension, health, long-term care) financed via joint employee-employer contributions.',
          impact:
            'High non-wage labor costs placing pressure on industrial competitiveness amid an aging demographic.',
        },
        {
          pillar: 'Green Industrial Support',
          description:
            'Subsidies for semiconductor fabrication (e.g. Magdeburg/Dresden) and industrial electricity price discounts for energy-intensive sectors.',
          impact:
            'Aims to protect heavy chemical and automotive manufacturing during power transition.',
        },
      ],
      recentReforms: [
        {
          year: '2024',
          title: 'Growth Opportunity Act (Wachstumschancengesetz)',
          description:
            'Enacted €3.2 billion annual corporate tax relief package, expanding tax loss carry-backs and providing premium incentives for energy-efficiency investments.',
          strategicGoal:
            'Stimulate stagnant industrial private investment and simplify corporate tax reporting.',
          budgetScale: '€3.2B annual tax relief',
        },
        {
          year: '2023',
          title: 'Constitutional Court Budget Verdict Adjustment',
          description:
            'Federal Constitutional Court ruled retroactive re-allocation of €60B unused pandemic credit authorizations unconstitutional.',
          strategicGoal:
            'Re-anchored federal spending strictly within the legal bounds of the debt brake.',
          budgetScale: 'Forced €60B reallocation and budget freeze',
        },
        {
          year: '2022',
          title: 'Sondervermögen Bundeswehr (Defense Special Fund)',
          description:
            'Constitutional amendment creating a €100 billion debt-financed procurement vehicle for military hardware and equipment modernization.',
          strategicGoal:
            'Meet NATO 2% of GDP defense expenditure guideline and upgrade military readiness.',
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
      headlineStrategy:
        'State-directed proactive fiscal policy leveraging ultra-long central government bonds, local government special bond quotas, and targeted tax breaks to fuel advanced manufacturing and debt restructuring.',
      corePillars: [
        {
          pillar: 'Ultra-Long Special Treasury Bonds',
          description:
            'Issuance of dedicated 20- to 50-year sovereign bonds outside standard budget deficit targets to finance major national technological infrastructure.',
          impact:
            'Shifts fiscal burden from strained local provinces to central government sovereign balance sheet.',
        },
        {
          pillar: 'Local Government Debt Refinancing',
          description:
            'Massive debt-swap programs allowing local governments to issue low-interest official bonds to replace high-cost off-budget LGFV debt.',
          impact:
            'Mitigates regional banking insolvency risks and unclogs municipal balance sheets.',
        },
        {
          pillar: 'Strategic Tech Tax Incentives',
          description:
            '15% preferential corporate income tax (vs 25% standard) for certified high-tech enterprises and 100% additional deduction for R&D outlays.',
          impact:
            'World-leading R&D expenditure in batteries, solar PV, humanoid robotics, and electric vehicles.',
        },
        {
          pillar: 'Consumer Trade-in & Equipment Subsidies',
          description:
            'Direct fiscal vouchers and interest rebates for consumers trading in appliances and automobiles, alongside industrial equipment upgrades.',
          impact:
            'Direct attempt to stimulate domestic consumption to balance heavy export dependence.',
        },
      ],
      recentReforms: [
        {
          year: '2024',
          title: '10-Trillion-Yuan Local Government Debt Swap Program',
          description:
            'Approved 6-trillion-yuan local debt ceiling increase plus 4-trillion-yuan special bond reallocation over 5 years to resolve hidden municipal debt.',
          strategicGoal:
            'Free up local governments from debt service burdens so they can restart public procurement.',
          budgetScale: '10 Trillion RMB ($1.4 Trillion USD)',
        },
        {
          year: '2024',
          title: 'Ultra-Long Special Central Treasury Bond Program',
          description:
            '1-trillion-yuan annual quota of ultra-long special treasury bonds to support food security, digital infrastructure, and frontier science.',
          strategicGoal:
            'Drive national strategic capacity without inflating regular headline budgetary deficits.',
          budgetScale: '1 Trillion RMB ($140B USD) annual tranche',
        },
        {
          year: '2024',
          title: 'National Equipment & Consumer Goods Trade-in Scheme',
          description:
            'Central treasury subsidies providing cash allowances for energy-efficient home appliances and trade-in of older passenger cars for EVs.',
          strategicGoal:
            'Accelerate industrial equipment efficiency and counter domestic deflationary pressures.',
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
      headlineStrategy:
        'High-debt fiscal expansion backed by domestic sovereign bond absorption, targeting household inflation subsidies, GX green transformation bonds, and doubling defense outlays.',
      corePillars: [
        {
          pillar: 'Supplementary Budget Packages',
          description:
            'Regular multi-trillion yen supplementary budgets providing electricity/gas utility subsidies, regional revitalization grants, and one-off cash transfers.',
          impact:
            'Mitigates imported inflation shocks on middle-income households while sustaining elevated fiscal deficits.',
        },
        {
          pillar: 'GX (Green Transformation) Economic Transition Bonds',
          description:
            'Issuance of ¥20 trillion in government-backed green transformation bonds over a decade to catalyze private low-carbon investments.',
          impact:
            'Pioneering sovereign climate transition framework repaid through future carbon pricing receipts.',
        },
        {
          pillar: 'Defense Modernization Mobilization',
          description:
            'Multi-year plan to double defense spending to 2% of GDP (~¥43 trillion over 5 years), funded through expenditure reprioritization and corporate tax surcharges.',
          impact: 'Historic shift in post-war pacifist fiscal allocation.',
        },
        {
          pillar: 'Wage-Hike Corporate Tax Incentives',
          description:
            'Tax deductions allowing companies raising domestic wages by over 3-4% to deduct up to 40% of the wage increase from corporate tax liability.',
          impact: 'Encouraged largest Japanese spring wage (Shunto) increases in 33 years.',
        },
      ],
      recentReforms: [
        {
          year: '2024',
          title: 'Fixed-Amount Income and Residence Tax Cut',
          description:
            'One-off ¥40,000 tax reduction per individual (and family dependents) designed to offset real wage declines during inflation peak.',
          strategicGoal:
            'Deliver temporary disposable income relief while long-term wage increases solidify.',
          budgetScale: '¥3.3 Trillion ($22B USD)',
        },
        {
          year: '2023',
          title: 'GX Promotion Act (Green Transition Bond Issuance)',
          description:
            'Established the legal framework for the ¥20 trillion GX bond issuance program and scheduled implementation of carbon levies starting 2028.',
          strategicGoal:
            'Catalyze ¥150 trillion in public-private green transformation over 10 years.',
          budgetScale: '¥20 Trillion ($130B USD) public bond program',
        },
        {
          year: '2022-2023',
          title: 'Five-Year Defense Buildup Plan',
          description:
            'Comprehensive reallocation committing ¥43 trillion over 5 years for counterstrike capabilities, unmanned systems, and ammunition stockpiles.',
          strategicGoal:
            'Elevate Japan’s security budget to 2% of GDP in response to Indo-Pacific tensions.',
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

  // Dynamic profile for any other country/region
  const posture: EntityFiscalProfile['fiscalPosture'] =
    debt > 100
      ? 'Consolidative / Austere'
      : debt > 60
        ? 'Neutral / Moderate'
        : 'Expansionary';

  const health: EntityFiscalProfile['fiscalHealthRating'] =
    debt > 120
      ? 'High Debt Strain'
      : debt > 80
        ? 'Elevated Deficit Stress'
        : debt > 50
          ? 'Moderate Risk'
          : 'Robust / Low Risk';

  return {
    name,
    shortName,
    flag,
    fiscalPosture: posture,
    fiscalHealthRating: health,
    deficitTrend: isSubnational
      ? 'Subnational Balanced Budget Rule'
      : `Estimated -${(debt * 0.04).toFixed(1)}% of GDP`,
    headlineStrategy: isSubnational
      ? `State/regional budget structure prioritizing education, public health, and localized infrastructure within balanced-budget statutes.`
      : `National fiscal framework balancing debt sustainability, infrastructure modernization, and domestic tax revenue collection.`,
    corePillars: [
      {
        pillar: isSubnational ? 'Regional Revenue & Transfers' : 'Tax Base Administration',
        description: isSubnational
          ? 'Combines localized sales/income taxes with intergovernmental transfers from the national treasury.'
          : 'Corporate, personal income, and value-added/goods tax regimes designed to finance public administration.',
        impact: 'Maintains baseline public service delivery while sensitive to regional economic activity.',
      },
      {
        pillar: 'Public Investment & Infrastructure',
        description:
          'Capital outlays directed toward transportation, energy transmission, and municipal public works.',
        impact: 'Generates long-term productivity gains and supports employment in construction.',
      },
      {
        pillar: 'Social Safety Net & Public Services',
        description:
          'Allocations for public healthcare, basic education, and targeted social welfare transfers.',
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
        title: isSubnational
          ? `${name} Capital Works & Resilience Plan`
          : `${name} National Budget Modernization Act`,
        description:
          'Multi-year budget reorientation focusing on green transition projects, digital governance, and inflation relief.',
        strategicGoal:
          'Modernize infrastructure while maintaining fiscal sustainability benchmarks.',
        budgetScale: 'Multi-billion budget allocation',
      },
      {
        year: '2022',
        title: `${name} Post-Pandemic Fiscal Recovery Framework`,
        description:
          'Rationalized temporary crisis spending lines and replenished emergency fiscal stabilization reserves.',
        strategicGoal:
          'Normalize public expenditure trajectory following extraordinary pandemic stimulus.',
        budgetScale: 'Stabilization program',
      },
    ],
    strengths: [
      'Institutional adherence to budgetary transparency and statistical standards.',
      'Targeted capital expenditure programs supporting critical regional logistics.',
      'Resilient tax compliance mechanisms and diversified revenue sources.',
    ],
    vulnerabilities: [
      debt > 80
        ? 'Elevated public debt servicing burden in a higher global interest rate environment.'
        : 'Exposure to global commodity price swings and external demand fluctuations.',
      'Demographic shifts putting upward pressure on health and pension expenditure.',
      isSubnational
        ? 'Statutory inability to engage in deficit financing during acute regional recessions.'
        : 'Fiscal headroom constrained by mandatory non-discretionary spending.',
    ],
  };
}

export function getFallbackFiscalAnalysis(
  entityA: Partial<EconomicEntity>,
  entityB: Partial<EconomicEntity>,
  focusAngle: FiscalFocusAngle = 'all',
  customQuestion?: string
): FiscalPolicyAnalysisResponse {
  const profileA = getEntityFiscalProfile(entityA);
  const profileB = getEntityFiscalProfile(entityB);
  const nameA = profileA.name;
  const nameB = profileB.name;

  const debtA = entityA.publicDebtToGdp ?? 70;
  const debtB = entityB.publicDebtToGdp ?? 70;
  const debtDiff = Math.abs(debtA - debtB);
  const divergenceScore = Math.min(
    9,
    Math.max(
      3,
      Math.round(3 + debtDiff / 20 + (profileA.fiscalPosture !== profileB.fiscalPosture ? 2 : 0))
    )
  );

  const sideBySideComparison = [
    {
      domain: 'Fiscal Rules & Debt Anchors',
      entityAStance:
        entityA.type === 'region'
          ? 'Strict constitutional balanced budget requirement with emergency rainy day reserves.'
          : `${nameA} relies on legislative caps and medium-term debt projections (Debt: ${debtA}% of GDP).`,
      entityBStance:
        entityB.type === 'region'
          ? 'Strict constitutional balanced budget requirement with emergency rainy day reserves.'
          : `${nameB} enforces statutory fiscal targets (Debt: ${debtB}% of GDP).`,
      contrastTakeaway: `${nameA} demonstrates ${
        debtA > debtB ? 'a higher structural debt tolerance' : 'greater debt discipline'
      } compared to ${nameB}'s balance sheet framework.`,
      advantageEntity: (debtA < debtB ? 'entityA' : 'entityB') as 'entityA' | 'entityB' | 'neutral',
    },
    {
      domain: 'Industrial Policy & Subsidies',
      entityAStance: `${profileA.corePillars[0]?.description || 'Strategic subsidies in targeted growth sectors.'}`,
      entityBStance: `${profileB.corePillars[0]?.description || 'Targeted economic incentives for priority domestic sectors.'}`,
      contrastTakeaway: `${nameA} focuses policy on ${
        profileA.recentReforms[0]?.strategicGoal || 'technological transition'
      }, whereas ${nameB} prioritizes ${
        profileB.recentReforms[0]?.strategicGoal || 'broad-based economic modernization'
      }.`,
      advantageEntity: 'neutral' as const,
    },
    {
      domain: 'Tax Structure & Competitiveness',
      entityAStance: `${profileA.corePillars[1]?.description || 'Diversified tax collection with targeted deductions.'}`,
      entityBStance: `${profileB.corePillars[1]?.description || 'Structured corporate and personal tax collection framework.'}`,
      contrastTakeaway: `Key trade-off between ${nameA}'s revenue yield and ${nameB}'s supply-side investment incentives.`,
      advantageEntity: 'neutral' as const,
    },
    {
      domain: 'Social Safety Net & Entitlements',
      entityAStance: `${profileA.corePillars[2]?.description || 'Social welfare and health allocations consume substantial budget share.'}`,
      entityBStance: `${profileB.corePillars[2]?.description || 'Welfare and pension commitments tied to demographic trajectory.'}`,
      contrastTakeaway: `Both entities encounter demographic cost pressures, with ${nameA} managing ${
        profileA.vulnerabilities[1] || 'rising outlays'
      } while ${nameB} faces ${profileB.vulnerabilities[1] || 'aging challenges'}.`,
      advantageEntity: 'neutral' as const,
    },
    {
      domain: 'Deficit Financing & Headroom',
      entityAStance: `${profileA.deficitTrend}`,
      entityBStance: `${profileB.deficitTrend}`,
      contrastTakeaway: `${nameA} exhibits ${profileA.fiscalHealthRating.toLowerCase()} status, contrasted with ${nameB}'s ${profileB.fiscalHealthRating.toLowerCase()} profile.`,
      advantageEntity: (profileA.fiscalHealthRating.includes('Robust')
        ? 'entityA'
        : profileB.fiscalHealthRating.includes('Robust')
          ? 'entityB'
          : 'neutral') as 'entityA' | 'entityB' | 'neutral',
    },
  ];

  let customAnswer: string | undefined = undefined;
  if (customQuestion && customQuestion.trim()) {
    customAnswer = `Comparative Policy Assessment on "${customQuestion}": When evaluating ${nameA} and ${nameB}, the primary institutional divergence lies in their statutory debt flexibility and revenue mobilization mechanisms. ${nameA} (${profileA.fiscalPosture}) relies on ${profileA.headlineStrategy.slice(
      0,
      140
    )}... In contrast, ${nameB} (${profileB.fiscalPosture}) prioritizes ${profileB.headlineStrategy.slice(
      0,
      140
    )}... Consequently, ${nameA} possesses ${
      debtA < debtB
        ? 'greater counter-cyclical borrowing headroom'
        : 'a more constrained fiscal buffer'
    }, while ${nameB} benefits from ${profileB.strengths[0] || 'institutional credibility'}.`;
  }

  return {
    source: 'curated_fallback',
    executiveSynthesis: `${nameA} and ${nameB} represent distinct macroeconomic philosophies. ${nameA} operates under a ${profileA.fiscalPosture.toLowerCase()} posture (${profileA.deficitTrend}) prioritizing ${profileA.headlineStrategy
      .split(',')[0]
      .toLowerCase()}, whereas ${nameB} operates under a ${profileB.fiscalPosture.toLowerCase()} framework (${profileB.deficitTrend}) focused on ${profileB.headlineStrategy
      .split(',')[0]
      .toLowerCase()}. The divergence reflects differing tolerance for sovereign leverage and contrasting institutional mandates for state industrial intervention.`,
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
