import { EconomicEntity } from '../types';
import { getRelevantMilestones } from '../data/milestonesData';

export interface CreateSpreadsheetOptions {
  includeHistorical?: boolean;
  includeSectors?: boolean;
  includeMilestones?: boolean;
  customTitle?: string;
}

export interface DriveFileItem {
  id: string;
  name: string;
  modifiedTime?: string;
  webViewLink?: string;
}

export interface SpreadsheetMetadata {
  title: string;
  sheets: Array<{
    sheetId: number;
    title: string;
    rowCount?: number;
    columnCount?: number;
  }>;
}

/**
 * Creates a rich, multi-tab Google Spreadsheet comparing two economies.
 */
export async function createComparisonSpreadsheet(
  accessToken: string,
  entityA: EconomicEntity,
  entityB: EconomicEntity,
  options: CreateSpreadsheetOptions = {}
): Promise<{ spreadsheetId: string; spreadsheetUrl: string; title: string }> {
  const timestamp = new Date().toISOString().split('T')[0];
  const title =
    options.customTitle?.trim() ||
    `Economic Comparison: ${entityA.shortName} vs ${entityB.shortName} (${timestamp})`;

  // 1. Define Sheets to create
  const sheetsToCreate: Array<{ properties: { title: string } }> = [
    { properties: { title: 'Macro Specs' } },
  ];

  if (options.includeHistorical !== false) {
    sheetsToCreate.push({ properties: { title: '10-Year Trajectory' } });
  }
  if (options.includeSectors !== false) {
    sheetsToCreate.push({ properties: { title: 'Sector Breakdown' } });
  }
  if (options.includeMilestones !== false) {
    sheetsToCreate.push({ properties: { title: 'Policy Milestones' } });
  }

  // 2. Initialize Spreadsheet via Sheets v4 API
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: { title },
      sheets: sheetsToCreate,
    }),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Failed to create spreadsheet (${createRes.status}): ${errText}`);
  }

  const createdData = await createRes.json();
  const spreadsheetId = createdData.spreadsheetId;
  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // 3. Prepare Tab Data
  const valueRanges: Array<{ range: string; values: (string | number)[][] }> = [];

  // Sheet 1: Macro Specs
  const specRows: (string | number)[][] = [
    ['ECONOMIC BENCHMARK SPEC SHEET', '', '', '', ''],
    [`Comparison: ${entityA.name} vs. ${entityB.name}`, '', '', '', ''],
    [`Generated: ${new Date().toLocaleString()}`, '', '', '', ''],
    [''],
    ['Indicator', 'Category', `${entityA.name} (${entityA.type})`, `${entityB.name} (${entityB.type})`, 'Absolute Difference', 'Advantage / Lead'],
    ['Nominal GDP ($B)', 'Output', entityA.nominalGdp, entityB.nominalGdp, Math.abs(entityA.nominalGdp - entityB.nominalGdp), entityA.nominalGdp >= entityB.nominalGdp ? entityA.shortName : entityB.shortName],
    ['GDP (PPP) ($B)', 'Output', entityA.gdpPpp, entityB.gdpPpp, Math.abs(entityA.gdpPpp - entityB.gdpPpp), entityA.gdpPpp >= entityB.gdpPpp ? entityA.shortName : entityB.shortName],
    ['Global GDP Rank (Equiv.)', 'Rank', entityA.globalGdpRank, entityB.globalGdpRank, Math.abs(entityA.globalGdpRank - entityB.globalGdpRank), entityA.globalGdpRank <= entityB.globalGdpRank ? entityA.shortName : entityB.shortName],
    ['GDP Per Capita Nominal ($)', 'Wealth', entityA.gdpPerCapitaNominal, entityB.gdpPerCapitaNominal, Math.abs(entityA.gdpPerCapitaNominal - entityB.gdpPerCapitaNominal), entityA.gdpPerCapitaNominal >= entityB.gdpPerCapitaNominal ? entityA.shortName : entityB.shortName],
    ['GDP Per Capita PPP ($)', 'Wealth', entityA.gdpPerCapitaPpp, entityB.gdpPerCapitaPpp, Math.abs(entityA.gdpPerCapitaPpp - entityB.gdpPerCapitaPpp), entityA.gdpPerCapitaPpp >= entityB.gdpPerCapitaPpp ? entityA.shortName : entityB.shortName],
    ['Population (M)', 'Demographics', entityA.population, entityB.population, Math.abs(entityA.population - entityB.population), '-'],
    ['Real GDP Growth Rate (%)', 'Dynamics', entityA.gdpGrowthRate, entityB.gdpGrowthRate, +(entityA.gdpGrowthRate - entityB.gdpGrowthRate).toFixed(2), entityA.gdpGrowthRate >= entityB.gdpGrowthRate ? entityA.shortName : entityB.shortName],
    ['Inflation Rate (CPI % YoY)', 'Prices', entityA.inflationRate, entityB.inflationRate, +(entityA.inflationRate - entityB.inflationRate).toFixed(2), entityA.inflationRate <= entityB.inflationRate ? entityA.shortName : entityB.shortName],
    ['Unemployment Rate (%)', 'Labor', entityA.unemploymentRate, entityB.unemploymentRate, +(entityA.unemploymentRate - entityB.unemploymentRate).toFixed(2), entityA.unemploymentRate <= entityB.unemploymentRate ? entityA.shortName : entityB.shortName],
    ['Public Debt-to-GDP (%)', 'Fiscal', entityA.publicDebtToGdp, entityB.publicDebtToGdp, +(entityA.publicDebtToGdp - entityB.publicDebtToGdp).toFixed(2), entityA.publicDebtToGdp <= entityB.publicDebtToGdp ? entityA.shortName : entityB.shortName],
    ['Human Development Index (HDI)', 'Living Standards', entityA.hdi, entityB.hdi, +(entityA.hdi - entityB.hdi).toFixed(3), entityA.hdi >= entityB.hdi ? entityA.shortName : entityB.shortName],
    ['Top Core Industries', 'Composition', entityA.topIndustries.join(', '), entityB.topIndustries.join(', '), '-', '-'],
  ];
  valueRanges.push({ range: "'Macro Specs'!A1", values: specRows });

  // Sheet 2: 10-Year Trajectory
  if (options.includeHistorical !== false) {
    const years = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024];
    const baseA = entityA.history[0]?.nominalGdp || 1;
    const baseB = entityB.history[0]?.nominalGdp || 1;

    const histRows: (string | number)[][] = [
      ['HISTORICAL 10-YEAR TRAJECTORY (2015 - 2024)'],
      ['Year', `${entityA.shortName} Nominal GDP ($B)`, `${entityB.shortName} Nominal GDP ($B)`, `${entityA.shortName} Per Capita ($)`, `${entityB.shortName} Per Capita ($)`, `${entityA.shortName} Index (2015=100)`, `${entityB.shortName} Index (2015=100)`],
    ];

    for (const yr of years) {
      const ptA = entityA.history.find((h) => h.year === yr) || { nominalGdp: 0, gdpPerCapita: 0 };
      const ptB = entityB.history.find((h) => h.year === yr) || { nominalGdp: 0, gdpPerCapita: 0 };
      const idxA = +((ptA.nominalGdp / baseA) * 100).toFixed(1);
      const idxB = +((ptB.nominalGdp / baseB) * 100).toFixed(1);

      histRows.push([yr, ptA.nominalGdp, ptB.nominalGdp, ptA.gdpPerCapita, ptB.gdpPerCapita, idxA, idxB]);
    }
    valueRanges.push({ range: "'10-Year Trajectory'!A1", values: histRows });
  }

  // Sheet 3: Sector Breakdown
  if (options.includeSectors !== false) {
    const secRows: (string | number)[][] = [
      ['SECTOR & INDUSTRY COMPOSITION (% OF GDP)'],
      ['Sector Category', `${entityA.shortName} Share (%)`, `${entityB.shortName} Share (%)`, 'Difference (% pts)', 'Higher Concentration'],
      ['Services Sector', entityA.sectorShare.services, entityB.sectorShare.services, +(entityA.sectorShare.services - entityB.sectorShare.services).toFixed(1), entityA.sectorShare.services >= entityB.sectorShare.services ? entityA.shortName : entityB.shortName],
      ['Industry & Manufacturing', entityA.sectorShare.industry, entityB.sectorShare.industry, +(entityA.sectorShare.industry - entityB.sectorShare.industry).toFixed(1), entityA.sectorShare.industry >= entityB.sectorShare.industry ? entityA.shortName : entityB.shortName],
      ['Agriculture & Primary Resources', entityA.sectorShare.agriculture, entityB.sectorShare.agriculture, +(entityA.sectorShare.agriculture - entityB.sectorShare.agriculture).toFixed(1), entityA.sectorShare.agriculture >= entityB.sectorShare.agriculture ? entityA.shortName : entityB.shortName],
    ];

    if (entityA.sectorShare.techAndFinance !== undefined || entityB.sectorShare.techAndFinance !== undefined) {
      const valA = entityA.sectorShare.techAndFinance ?? 0;
      const valB = entityB.sectorShare.techAndFinance ?? 0;
      secRows.push([
        'Tech & High-Skill Services',
        valA,
        valB,
        +(valA - valB).toFixed(1),
        valA >= valB ? entityA.shortName : entityB.shortName,
      ]);
    }
    valueRanges.push({ range: "'Sector Breakdown'!A1", values: secRows });
  }

  // Sheet 4: Policy Milestones
  if (options.includeMilestones !== false) {
    const milestones = getRelevantMilestones(entityA, entityB, 'all');
    const mileRows: (string | number)[][] = [
      ['ECONOMIC MILESTONES & FISCAL POLICY RECORD (2015 - 2024)'],
      ['Year', 'Entity / Scope', 'Policy Category', 'Milestone Title', 'Description', 'Impact Metric', 'Policy Details'],
    ];

    for (const m of milestones) {
      const scopeLabel =
        m.entityId === 'global'
          ? 'Global Macro'
          : m.entityId === entityA.id
          ? entityA.name
          : entityB.name;
      mileRows.push([
        m.year,
        scopeLabel,
        m.category,
        m.title,
        m.description,
        m.keyStat || '-',
        m.policyDetails || '-',
      ]);
    }
    valueRanges.push({ range: "'Policy Milestones'!A1", values: mileRows });
  }

  // 4. Batch update values
  const batchRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: valueRanges,
      }),
    }
  );

  if (!batchRes.ok) {
    console.warn('Batch update values warning:', await batchRes.text());
  }

  return {
    spreadsheetId,
    spreadsheetUrl,
    title,
  };
}

/**
 * List recent spreadsheets from Google Drive.
 */
export async function listUserSpreadsheets(accessToken: string): Promise<DriveFileItem[]> {
  const query = encodeURIComponent("mimeType='application/vnd.google-apps.spreadsheet' and trashed=false");
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&orderBy=modifiedTime%20desc&pageSize=12&fields=files(id,name,modifiedTime,webViewLink)`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to list spreadsheets: ${errText}`);
  }

  const data = await res.json();
  return data.files || [];
}

/**
 * Fetch spreadsheet metadata (tabs and title).
 */
export async function getSpreadsheetMetadata(
  accessToken: string,
  spreadsheetId: string
): Promise<SpreadsheetMetadata> {
  const cleanId = extractSpreadsheetId(spreadsheetId);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}?fields=properties.title,sheets.properties(sheetId,title,gridProperties)`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to fetch spreadsheet metadata: ${errText}`);
  }

  const data = await res.json();
  return {
    title: data.properties?.title || 'Untitled Spreadsheet',
    sheets: (data.sheets || []).map((s: any) => ({
      sheetId: s.properties?.sheetId,
      title: s.properties?.title || 'Sheet1',
      rowCount: s.properties?.gridProperties?.rowCount,
      columnCount: s.properties?.gridProperties?.columnCount,
    })),
  };
}

/**
 * Read cell values from a sheet range.
 */
export async function readSpreadsheetValues(
  accessToken: string,
  spreadsheetId: string,
  range: string
): Promise<(string | number)[][]> {
  const cleanId = extractSpreadsheetId(spreadsheetId);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/${encodeURIComponent(range)}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to read sheet values: ${errText}`);
  }

  const data = await res.json();
  return data.values || [];
}

/**
 * Appends comparison rows to an existing spreadsheet tab.
 */
export async function appendComparisonToSpreadsheet(
  accessToken: string,
  spreadsheetId: string,
  sheetTitle: string,
  entityA: EconomicEntity,
  entityB: EconomicEntity
): Promise<{ updatedRows: number }> {
  const cleanId = extractSpreadsheetId(spreadsheetId);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/${encodeURIComponent(sheetTitle)}:append?valueInputOption=USER_ENTERED`;

  const timestamp = new Date().toLocaleString();
  const rowsToAppend = [
    ['--- COMPARISON LOGGED ---', timestamp, '', ''],
    ['Comparison Pair', `${entityA.name} (${entityA.shortName})`, 'vs.', `${entityB.name} (${entityB.shortName})`],
    ['Nominal GDP ($B)', entityA.nominalGdp, 'vs.', entityB.nominalGdp],
    ['GDP Per Capita ($)', entityA.gdpPerCapitaNominal, 'vs.', entityB.gdpPerCapitaNominal],
    ['Real Growth (%)', entityA.gdpGrowthRate, 'vs.', entityB.gdpGrowthRate],
    ['Inflation CPI (%)', entityA.inflationRate, 'vs.', entityB.inflationRate],
    ['Public Debt / GDP (%)', entityA.publicDebtToGdp, 'vs.', entityB.publicDebtToGdp],
    [''],
  ];

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: rowsToAppend,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to append rows: ${errText}`);
  }

  const data = await res.json();
  return { updatedRows: data.updates?.updatedRows || rowsToAppend.length };
}

/**
 * Extracts a spreadsheet ID from a raw ID or full Google Sheets URL.
 */
export function extractSpreadsheetId(input: string): string {
  const trimmed = input.trim();
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return trimmed;
}
