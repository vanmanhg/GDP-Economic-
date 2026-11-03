import { HistoricalMetricKey, HISTORICAL_METRIC_SPECS } from '../data/historicalExtendedData';

export interface DetectedIndicatorToken {
  key: HistoricalMetricKey;
  matchedText: string;
  startIndex: number;
  endIndex: number;
}

export const INDICATOR_PATTERNS: Array<{
  key: HistoricalMetricKey;
  regex: RegExp;
  label: string;
}> = [
  {
    key: 'gdpGrowthRate',
    regex: /\b(real\s+gdp\s+growth(\s+rate)?|gdp\s+growth(\s+rate)?|annual\s+growth(\s+trajectory)?|economic\s+growth|gdp\s+expansion|growth\s+rate)\b/gi,
    label: 'Real GDP Growth',
  },
  {
    key: 'inflationRate',
    regex: /\b(inflation(\s+rate)?|cpi(\s+inflation)?|consumer\s+price\s+index|price\s+pressures|headline\s+inflation|core\s+inflation)\b/gi,
    label: 'Inflation (CPI)',
  },
  {
    key: 'unemploymentRate',
    regex: /\b(unemployment(\s+rate)?|jobless\s+rate|labor\s+market|civilian\s+unemployment)\b/gi,
    label: 'Unemployment Rate',
  },
  {
    key: 'publicDebtToGdp',
    regex: /\b(public\s+debt(-to-gdp)?|debt-to-gdp(\s+ratio)?|sovereign\s+debt(\s+burdens?)?|government\s+debt|gross\s+debt)\b/gi,
    label: 'Public Debt-to-GDP',
  },
  {
    key: 'gdpPerCapita',
    regex: /\b(gdp\s+per\s+capita|per-capita\s+output|per\s+capita\s+income|living\s+standards?|per-capita\s+gdp)\b/gi,
    label: 'GDP Per Capita',
  },
  {
    key: 'nominalGdp',
    regex: /\b(nominal\s+gdp|gross\s+domestic\s+product|economic\s+output|gdp\s+scale)\b/gi,
    label: 'Nominal GDP',
  },
];

/**
 * Detects all distinct indicators discussed in a string of text.
 */
export function detectDiscussedIndicators(text: string): HistoricalMetricKey[] {
  if (!text) return [];
  const found = new Set<HistoricalMetricKey>();

  for (const item of INDICATOR_PATTERNS) {
    // Reset regex index
    item.regex.lastIndex = 0;
    if (item.regex.test(text)) {
      found.add(item.key);
    }
  }

  return Array.from(found);
}

/**
 * Segments a paragraph into plain text chunks and indicator mentions,
 * enabling inline mini-sparkline placement immediately following the first mention.
 */
export interface TextSegment {
  type: 'text' | 'indicator';
  content: string;
  metricKey?: HistoricalMetricKey;
  spec?: (typeof HISTORICAL_METRIC_SPECS)[HistoricalMetricKey];
}

export function parseParagraphWithIndicators(paragraph: string): TextSegment[] {
  if (!paragraph) return [];

  // Find matches with their positions
  const matches: Array<{
    key: HistoricalMetricKey;
    start: number;
    end: number;
    matched: string;
  }> = [];

  const matchedKeysInPara = new Set<HistoricalMetricKey>();

  for (const item of INDICATOR_PATTERNS) {
    item.regex.lastIndex = 0;
    let match: RegExpExecArray | null;
    // Only capture the first mention of each indicator per paragraph to avoid visual clutter
    while ((match = item.regex.exec(paragraph)) !== null) {
      if (!matchedKeysInPara.has(item.key)) {
        matchedKeysInPara.add(item.key);
        matches.push({
          key: item.key,
          start: match.index,
          end: match.index + match[0].length,
          matched: match[0],
        });
        break;
      }
    }
  }

  if (matches.length === 0) {
    return [{ type: 'text', content: paragraph }];
  }

  // Sort by start index
  matches.sort((a, b) => a.start - b.start);

  const segments: TextSegment[] = [];
  let currentIndex = 0;

  for (const m of matches) {
    if (m.start > currentIndex) {
      segments.push({
        type: 'text',
        content: paragraph.slice(currentIndex, m.start),
      });
    }

    // Indicator segment
    segments.push({
      type: 'indicator',
      content: paragraph.slice(m.start, m.end),
      metricKey: m.key,
      spec: HISTORICAL_METRIC_SPECS[m.key],
    });

    currentIndex = m.end;
  }

  if (currentIndex < paragraph.length) {
    segments.push({
      type: 'text',
      content: paragraph.slice(currentIndex),
    });
  }

  return segments;
}
