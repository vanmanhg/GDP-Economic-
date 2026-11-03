import { CopilotScenarioPreset } from '../types';

export const COPILOT_SCENARIO_PRESETS: CopilotScenarioPreset[] = [
  {
    id: 'stagflation-energy',
    title: 'Stagflationary Energy Shock',
    tagline: 'Crude climbs to $125/bbl with persistent natural gas supply crunch',
    category: 'geopolitical',
    severityLabel: 'High Severity',
    description:
      'Simulates a sharp supply-driven energy price shock that simultaneously elevates consumer inflation expectations while dampening corporate margins and real household disposable income.',
    promptTemplate:
      'Evaluate the comparative resilience of both economies facing a sustained 40% energy commodity cost spike over 18 months. How do their respective energy import reliance, industrial intensity, and monetary response flexibility dictate GDP growth and inflationary divergence?',
  },
  {
    id: 'yield-curve-shock',
    title: 'Rapid 200 bps Yield Curve Spike',
    tagline: 'Aggressive benchmark rate hikes tighten sovereign and private refinancing',
    category: 'monetary',
    severityLabel: 'Severe Stress',
    description:
      'Models an aggressive central bank tightening cycle to combat sticky core price pressures, testing each economy’s debt-servicing capacity, banking liquidity, and capital investment rates.',
    promptTemplate:
      'Analyze the economic divergence if long-term borrowing yields increase by 200 basis points over the next 12 months. Compare the impact on sovereign debt refinancing costs, housing market transaction volumes, and business capital expenditures between the two entities.',
  },
  {
    id: 'trade-tariff-escalation',
    title: 'Bilateral Tariff & Export Restriction',
    tagline: 'Strategic 20% across-the-board tariffs on key manufactured goods and tech',
    category: 'trade',
    severityLabel: 'Structural Pivot',
    description:
      'Examines the ripple effects of rising protectionism, bilateral import tariffs, and export licensing curbs on high-value technologies, advanced manufacturing, and agricultural corridors.',
    promptTemplate:
      'Stress-test both economies against an unexpected 20% tariff barrier imposed across manufacturing and technology exports. Which economy suffers the steeper terms-of-trade loss, and how do domestic supply chains adapt over a 2-year horizon?',
  },
  {
    id: 'ai-productivity-dividend',
    title: 'Hyperscale AI Productivity Surge',
    tagline: 'Rapid automation generates structural 15% labor productivity dividend',
    category: 'tech',
    severityLabel: 'Expansionary',
    description:
      'Explores the upside scenario where widespread generative AI and robotic automation accelerate services sector productivity, software capital accumulation, and corporate operating margins.',
    promptTemplate:
      'Model the comparative growth trajectories if enterprise AI adoption drives a sustained 1.0 percentage point annual total factor productivity dividend over the next 3 years. Which economy is better positioned to capture software rents, patent value, and skilled labor reallocation?',
  },
  {
    id: 'sovereign-debt-squeeze',
    title: 'Sovereign Debt Roll-Over Squeeze',
    tagline: 'Widening sovereign credit spreads force mandatory budgetary consolidation',
    category: 'fiscal',
    severityLabel: 'High Strain',
    description:
      'Assesses vulnerability when debt-to-GDP dynamics trigger sovereign credit rating reviews, demanding spending freezes, tax increases, or emergency rainy-day reserve drawdowns.',
    promptTemplate:
      'Compare the fiscal vulnerability and budget flexibility of both entities if government debt refinancing costs double while tax revenues decelerate. How do statutory debt rules or constitutional balanced budget mandates limit their counter-cyclical stimulus?',
  },
  {
    id: 'supply-chain-chokepoint',
    title: 'Critical Materials Supply Chokepoint',
    tagline: 'Disruption in maritime shipping corridors and semiconductor inputs',
    category: 'supply_chain',
    severityLabel: 'Elevated Friction',
    description:
      'Simulates extended delays in maritime transit routes coupled with export controls on rare earth elements and specialized silicon hardware, causing factory production stoppages.',
    promptTemplate:
      'Assess how each economy handles a prolonged 6-month logistics and critical mineral supply choke. Contrast their domestic manufacturing redundancy, inventory buffers, and alternative trade corridor access.',
  },
];

export const QUICK_PROMPT_SUGGESTIONS = [
  'How do their sovereign debt burdens affect their room for counter-cyclical fiscal stimulus?',
  'Compare their labor market flexibility and unemployment risk during an unexpected global recession.',
  'Which economy has greater competitive moats in high-value services and technological intellectual property?',
  'How would a 15% depreciation of the domestic currency impact trade balances and consumer prices?',
  'What structural demographic headwinds will exert the greatest pressure on public finances by 2030?',
];
