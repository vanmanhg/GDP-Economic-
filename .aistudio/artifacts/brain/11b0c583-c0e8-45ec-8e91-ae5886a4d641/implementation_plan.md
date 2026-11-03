# Interactive AI Macro Analyst Copilot

A dedicated, intelligence-driven macroeconomic copilot integrated into the GDP & Economic Indicator Comparator that allows policymakers, institutional analysts, and macro researchers to interrogate bilateral economic differentials, simulate policy stress tests, and explore real-world crisis shock scenarios using Gemini 3.8 Flash.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following product decisions were confirmed during the interactive interview:
> - **Core Capability**: Interactive AI Macro Analyst Copilot to query comparison data and forecast impacts between the active entities.
> - **Primary Placement**: Dedicated top-level tab (`AI Analyst Copilot`) alongside Indicators & Specs, Macro Trends, and Fiscal Policy AI.
> - **Interaction Modality**: Dual trigger support providing both structured crisis/shock presets (e.g. Energy Supply Disruption, Stagflationary Rate Spike, High-Tech Export Restriction, Sovereign Debt Squeeze) and open-ended natural language prompts with suggested query chips.
>
> **Recommended Architectural Choices**:
> - Server-side Gemini 3.8 Flash proxy with structured JSON streaming/response formatting and automatic caching (15-min TTL) to ensure instant recall.
> - Grounded context injection feeding both entities' harmonized macro indicators (GDP, growth, inflation, debt-to-GDP, unemployment, trade balances, top industries, and historical 20-year CAGRs).
> - High-density tabular impact matrix linking AI assessments to concrete indicator projections with direction vectors (+/-, delta bps, time horizon).

---

## 1. Overview & Core Concept

### What It Does
The **AI Macro Analyst Copilot** transforms static economic tables into an interactive, reasoning-enabled briefing workstation. Users can select any two comparative entities (sovereign nations or subnational regions such as California vs. United Kingdom) and:
1. Run structured stress-test presets (e.g., *Stagflationary Energy Shock*, *Currency Devaluation Pressure*, *Supply-Chain Decoupling*, *High-Yield Sovereign Debt Refinancing Squeeze*).
2. Enter custom natural-language macroeconomic inquiries (e.g., *"How would a 200 bps interest rate hike affect CA technology investments vs UK manufacturing output?"* or *"Compare their fiscal resilience against a global energy embargo"*).
3. Review structured responses featuring executive synthesis, bilateral winner/loser divergence analysis, key structural mechanisms, and a numeric indicator shift matrix estimating 1–3 year trajectories.

### Target Audience & Persona
- **Macroeconomic & Sovereign Risk Analysts**: Evaluating cross-border investment exposure, sovereign credit risk, and fiscal sustainability.
- **Corporate Strategists & Policy Advisors**: Modeling the real-world trade and regulatory implications of industrial policies and tariff changes.
- **Economics Students & Researchers**: Interactively exploring how institutional differences (currency issuer vs. subnational state) change macro outcomes.

### Key Value
Bridges the gap between raw macroeconomic figures and actionable causal reasoning, explaining *why* differences exist and *how* external shocks propagate through each economy's structural composition.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Discovery & Navigation**:
   - The user selects entities from the top navigation bar or curated comparisons (e.g., California vs. United Kingdom).
   - In the Section Navigation Bar, a new top-level tab button titled `AI Analyst Copilot` appears with a distinct indigo/violet icon and indicator badge.
2. **Preset Exploration & Query Dispatch**:
   - Entering the tab displays the **Macro Stress-Test & Crisis Scenario Rail**: 6 clickable scenario cards with concise operational summaries.
   - Below the presets, an **Interactive Query Bar** provides a rich input textarea with contextual quick-prompt suggestion chips (*"Fiscal headroom under rising yields"*, *"AI productivity dividend over 5 years"*, *"Labor market elasticity"*).
   - The user clicks a preset or types a custom question and hits **"Run Macro Analysis"** (`Cmd/Ctrl + Enter`).
3. **Structured Analytical Synthesis**:
   - The interface reveals a 3-part intelligence dossier:
     - **Executive Comparative Thesis**: 2–3 paragraphs outlining relative macroeconomic transmission mechanisms and institutional divergences.
     - **Bilateral Resilience Scorecard**: Structured cards detailing Comparative Advantage, Primary Transmission Vector, and Asymmetric Vulnerabilities.
     - **Projected Indicator Impact Matrix**: High-density tabular layout demonstrating expected shifts across Real GDP Growth, Inflation (CPI), Unemployment, and Public Debt-to-GDP with direction arrows and estimated delta bps.
4. **Follow-Up & Export**:
   - Users can ask contextual follow-up questions within the active thread, copy the executive briefing to clipboard with 1 click, or print the briefing in the high-contrast physical document layout.

### Visual Identity & Theme
- **Aesthetic Direction**: Institutional Macroeconomic Intelligence Terminal. High-density, disciplined typography, clear visual hierarchy, avoiding generic AI purple gradients or pulsing decorative status dots.
- **Color Palette & Discipline**:
  - *Dominant Canvas (60%)*: Crisp neutral slate (`bg-slate-50 dark:bg-slate-950`).
  - *Structural Surfaces (30%)*: Subdued card panels with hairline borders (`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800`).
  - *Accent Allocation (10%)*: Deep indigo (`#4338ca` / `#6366f1`) for Entity A and Emerald (`#059669` / `#10b981`) for Entity B to preserve entity identity across the entire app.
- **Typography & Tabular Discipline**:
  - Clean display font hierarchy with `Plus Jakarta Sans` / `DM Sans`.
  - Monospace tabular figures (`font-mono tabular-nums`) strictly enforced for all delta metrics, basis point estimates, and comparative percentages.
  - Quiet typographic separators (`·`, `/`) instead of static pill enclosure badges.

---

## 3. Key Product Decisions & Trade-Offs

### Decision 1: Hybrid Triggering (Structured Presets + Natural Language Chat)
- **Chosen Approach**: Combine a curated library of 6 macroeconomic stress-test presets with a freeform prompt input and contextual query chips.
- **Why**: Pure chat leaves users staring at an empty prompt with no domain guidance; presets alone restrict users from asking specific questions about their chosen countries.
- **Alternatives Considered**: Chat-only assistant (too vague, high friction) or rigid dropdown selector (inflexible).

### Decision 2: Grounded Server-Side Context Injection
- **Chosen Approach**: All requests are routed through `POST /api/copilot/analyze` in `server.ts`. The server injects the complete verified indicator set, trade balances, top industries, and sovereign status of Entity A and Entity B into Gemini 3.8 Flash's system prompt with strict JSON schema constraints.
- **Why**: Eliminates hallucinated statistics. The AI references actual figures from the applet's database ($3.89T CA GDP, 48.2% debt vs $3.34T UK GDP, 97.8% debt).
- **Alternatives Considered**: Client-side Gemini calls (strictly prohibited by environment constraints and security guidelines).

### Decision 3: Deterministic Curated Fallback Engine
- **Chosen Approach**: Comprehensive offline fallback engine that generates deep, entity-specific analytical matrices even if network issues or rate limits occur.
- **Why**: Guarantees zero blank screens, broken states, or application timeouts.

---

## 4. Technical Architecture & Data Strategy

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           BROWSER CLIENT (React SPA)                        │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ Navigation Tabs: [Overview] [Macro Trends] [Fiscal AI] [AI Copilot]    │  │
│  └───────────────────────────────────┬───────────────────────────────────┘  │
│                                      │                                       │
│                         ┌────────────┴────────────┐                          │
│                         │  MacroAnalystCopilot    │                          │
│                         └─────┬─────────────┬─────┘                          │
│                               │             │                                │
│          ┌────────────────────┴─────┐ ┌─────┴─────────────────────┐          │
│          │ ScenarioPresetsRail      │ │ CopilotPromptConsole      │          │
│          │ (6 Macro Shock Cards)    │ │ (Textarea + Quick Chips)  │          │
│          └────────────────────┬─────┘ └─────┬─────────────────────┘          │
│                               │             │                                │
│                         ┌─────┴─────────────┴─────┐                          │
│                         │ Active Analysis Dossier │                          │
│                         │ ├─ ExecutiveSynthesis   │                          │
│                         │ ├─ ResilienceCards      │                          │
│                         │ └─ IndicatorImpactTable │                          │
│                         └─────────────┬───────────┘                          │
└───────────────────────────────────────┼──────────────────────────────────────┘
                                        │ HTTP POST /api/copilot/analyze
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         NODE.JS / EXPRESS SERVER                             │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ POST /api/copilot/analyze                                             │  │
│  │ ├─ Verify cached scenario (15-min in-memory cache)                    │  │
│  │ ├─ Inject Entity A & B Macro Data Grounding                           │  │
│  │ ├─ Call Gemini 3.8 Flash with Type.OBJECT responseSchema              │  │
│  │ └─ Graceful timeout fallback to getFallbackCopilotAnalysis()          │  │
│  └───────────────────────────────────┬───────────────────────────────────┘  │
│                                      │                                       │
│                                      ▼                                       │
│                         ┌─────────────────────────┐                          │
│                         │ Google GenAI SDK        │                          │
│                         │ Model: gemini-3.8-flash │                          │
│                         └─────────────────────────┘                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Data Model & TypeScript Interfaces

```typescript
export interface CopilotScenarioPreset {
  id: string;
  title: string;
  tagline: string;
  category: 'monetary' | 'trade' | 'supply_chain' | 'fiscal' | 'geopolitical' | 'tech';
  description: string;
  promptTemplate: string;
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

export interface CopilotAnalysisResult {
  source: 'gemini_3_8_flash' | 'curated_fallback';
  scenarioTitle: string;
  executiveThesis: string[];
  keyTransmissionMechanisms: Array<{
    title: string;
    entityAResponse: string;
    entityBResponse: string;
    divergenceFactor: string;
  }>;
  asymmetricVulnerabilities: {
    entityA: string[];
    entityB: string[];
  };
  projections: CopilotIndicatorProjection[];
  policyRecommendations: {
    entityA: string;
    entityB: string;
  };
  timestamp: string;
}
```

### Verification & Quality Plan
1. **Interactive Verification**: Test selecting different pairs (e.g., California vs United Kingdom, Texas vs Germany, Japan vs United States), running presets, and submitting custom freeform prompts.
2. **Grounding Verification**: Ensure responses accurately reflect whether an entity is a subnational state (cannot issue fiat currency, must balance budget) versus a sovereign nation.
3. **Compilation & Responsiveness**: Run `lint_applet` (`tsc --noEmit`) and `compile_applet` (`vite build`) to confirm clean TypeScript compilation with zero lint warnings.
