import { EconomicEntity } from '../types';
import { HistoricalTimeRange } from '../data/historicalExtendedData';

export type AppTabType =
  | 'overview'
  | 'world-map'
  | 'charts'
  | 'trends'
  | 'copilot'
  | 'fiscal'
  | 'what-if'
  | 'heatmap'
  | 'history'
  | 'projection'
  | 'sectors'
  | 'radar'
  | 'equivalence';

export interface SnapshotVoiceCommandResult {
  isSnapshotCommand: boolean;
  rawText: string;
  entityA: EconomicEntity;
  entityB: EconomicEntity;
  targetTab: AppTabType;
  targetTimeRange?: HistoricalTimeRange;
  summaryExplanation: string;
  spokenFeedback: string;
}

// Comprehensive aliases for sovereign nations and subnational regions in English & Vietnamese
const ENTITY_ALIASES: Record<string, string[]> = {
  // Sovereign Countries
  us: ['united states', 'usa', 'united states of america', 'america', 'american', 'hoa kỳ', 'mỹ', 'nuoc my', 'nước mỹ', 'hợp chúng quốc'],
  cn: ['china', 'chinese', 'prc', 'trung quốc', 'trung hoa', 'trung quoc'],
  de: ['germany', 'german', 'deutschland', 'đức', 'nuoc duc', 'nước đức', 'chlb đức'],
  jp: ['japan', 'japanese', 'nippon', 'nhật bản', 'nhat ban', 'nhật', 'xứ phù tang'],
  in: ['india', 'indian', 'bharat', 'ấn độ', 'an do'],
  gb: ['united kingdom', 'uk', 'britain', 'great britain', 'england', 'british', 'anh', 'nước anh', 'vương quốc anh', 'nuoc anh'],
  fr: ['france', 'french', 'pháp', 'nuoc phap', 'nước pháp', 'cộng hòa pháp'],
  ca: ['canada', 'canadian'],
  au: ['australia', 'australian', 'úc', 'nuoc uc', 'nước úc'],
  kr: ['south korea', 'korea', 'korean', 'hàn quốc', 'han quoc', 'hàn', 'nam triều tiên'],
  it: ['italy', 'italian', 'italia', 'ý', 'nuoc y', 'nước ý'],
  br: ['brazil', 'brazilian', 'brasil'],
  ru: ['russia', 'russian', 'nga', 'nuoc nga', 'nước nga', 'liên bang nga'],
  vn: ['vietnam', 'viet nam', 'vietnamese', 'việt nam', 'viet'],
  sg: ['singapore', 'sing', 'đảo quốc sư tử'],
  id: ['indonesia', 'indo'],
  th: ['thailand', 'thai', 'thái lan', 'thai lan', 'xiêm'],
  my: ['malaysia', 'mã lai'],
  mx: ['mexico', 'mê-hi-cô'],
  sa: ['saudi arabia', 'saudi', 'ả rập xê út', 'a rap xe ut'],
  za: ['south africa', 'nam phi'],
  es: ['spain', 'spanish', 'espana', 'tây ban nha', 'tay ban nha'],
  nl: ['netherlands', 'holland', 'dutch', 'hà lan', 'ha lan'],
  ch: ['switzerland', 'swiss', 'thụy sĩ', 'thuy si'],
  pl: ['poland', 'polish', 'ba lan'],

  // Subnational Regions
  'us-ca': ['california', 'cali', 'bang california'],
  'us-tx': ['texas', 'bang texas'],
  'us-ny': ['new york', 'new york state', 'bang new york'],
  'us-fl': ['florida', 'bang florida'],
  'cn-gd': ['guangdong', 'canton', 'quảng đông', 'quang dong'],
  'cn-js': ['jiangsu', 'giang tô', 'giang to'],
  'de-by': ['bavaria', 'bayern'],
  'jp-tyo': ['tokyo', 'vùng tokyo'],
  'gb-lon': ['london', 'greater london'],
  'fr-idf': ['paris region', 'ile de france', 'île-de-france', 'vùng paris'],
  'vn-hcm': ['ho chi minh city', 'tp hcm', 'thành phố hồ chí minh', 'sài gòn', 'saigon', 'hcm'],
  'au-nsw': ['new south wales', 'sydney'],
};

/**
 * Normalizes text for matching: converts diacritics where appropriate and removes punctuation
 */
function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[,\.\?!;:"'\(\)\[\]\{\}]/g, ' ')
    .replace(/\s+/g, ' ');
}

/**
 * Finds all candidate entities mentioned in the query text.
 * Returns distinct entities sorted by their appearance order in the speech.
 */
function extractEntities(
  normalizedQuery: string,
  allEntities: EconomicEntity[]
): { entity: EconomicEntity; index: number }[] {
  const matches: { entity: EconomicEntity; index: number; length: number }[] = [];
  const foundEntityIds = new Set<string>();

  // Map of id -> entity
  const entityMap = new Map<string, EconomicEntity>();
  for (const ent of allEntities) {
    entityMap.set(ent.id, ent);
  }

  // Helper to check pattern match with word boundary
  const searchMatch = (alias: string, entityId: string) => {
    const normAlias = normalizeString(alias);
    if (!normAlias) return;

    // Use boundary matching
    const escaped = normAlias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(?:^|\\s)${escaped}(?:\\s|$)`, 'i');
    const match = normalizedQuery.match(regex);

    if (match && match.index !== undefined) {
      const entity = entityMap.get(entityId);
      if (entity && !foundEntityIds.has(entity.id)) {
        // Adjust index to start of matched alias word
        const actualIndex = match.index + (match[0].startsWith(' ') ? 1 : 0);
        matches.push({ entity, index: actualIndex, length: normAlias.length });
        foundEntityIds.add(entity.id);
      }
    }
  };

  // 1. Check configured aliases first (ordered by longest alias first)
  const aliasEntries = Object.entries(ENTITY_ALIASES);
  // Sort aliases by length descending so longer phrases match first
  for (const [id, aliases] of aliasEntries) {
    const sorted = [...aliases].sort((a, b) => b.length - a.length);
    for (const alias of sorted) {
      searchMatch(alias, id);
    }
  }

  // 2. Check full names and short names from entity database
  for (const ent of allEntities) {
    if (!foundEntityIds.has(ent.id)) {
      searchMatch(ent.name, ent.id);
      if (!foundEntityIds.has(ent.id) && ent.shortName) {
        searchMatch(ent.shortName, ent.id);
      }
    }
  }

  // Sort by appearance index in text
  return matches.sort((a, b) => a.index - b.index);
}

/**
 * Extracts requested time horizon from speech text
 */
function extractTimeRange(query: string): HistoricalTimeRange | undefined {
  const norm = query.toLowerCase();

  // 5 years / 5 năm
  if (
    /(?:last|past|previous)?\s*5\s*(?:years?|y|yrs?)/i.test(norm) ||
    /5\s*năm(?:\s*(?:qua|trước|gần\s*đây))?/i.test(norm) ||
    /năm\s*năm/i.test(norm)
  ) {
    return '5y';
  }

  // 10 years / 10 năm
  if (
    /(?:last|past|previous)?\s*10\s*(?:years?|y|yrs?)/i.test(norm) ||
    /10\s*năm(?:\s*(?:qua|trước|gần\s*đây))?/i.test(norm) ||
    /thập\s*kỷ/i.test(norm) ||
    /mười\s*năm/i.test(norm)
  ) {
    return '10y';
  }

  // 15 years
  if (
    /(?:last|past|previous)?\s*15\s*(?:years?|y|yrs?)/i.test(norm) ||
    /15\s*năm/i.test(norm)
  ) {
    return '15y';
  }

  // 20 years
  if (
    /(?:last|past|previous)?\s*20\s*(?:years?|y|yrs?)/i.test(norm) ||
    /20\s*năm/i.test(norm) ||
    /hai\s*mươi\s*năm/i.test(norm)
  ) {
    return '20y';
  }

  // All time / max
  if (/all\s*(?:time|history)|toàn\s*bộ|tất\s*cả|toàn\s*thời\s*gian/i.test(norm)) {
    return 'all';
  }

  return undefined;
}

/**
 * Extracts target navigation tab from query intent
 */
function extractTargetTab(query: string, timeRange?: HistoricalTimeRange): AppTabType {
  const norm = query.toLowerCase();

  // World map / Choropleth map
  if (/world\s*map|choropleth|global\s*map|bản\s*đồ\s*thế\s*giới|bản\s*đồ|địa\s*lý|toàn\s*cầu/i.test(norm)) {
    return 'world-map';
  }

  // Economic Risk Monitor & AI Copilot
  if (/risk|red\s*flag|warning|hazard|rủi\s*ro|cảnh\s*báo|copilot|ai\s*analyst|analyst/i.test(norm)) {
    return 'copilot';
  }

  // Fiscal policy tab
  if (
    /fiscal|tax|debt|deficit|chính\s*sách\s*tài\s*khóa|tài\s*khóa|ngân\s*sách|thâm\s*hụt|nợ\s*công/i.test(
      norm
    )
  ) {
    return 'fiscal';
  }

  // What-if scenario builder
  if (/what\s*if|scenario|simulation|giả\s*định|kịch\s*bản|mô\s*phỏng/i.test(norm)) {
    return 'what-if';
  }

  // Historical deep trends (20Y history)
  if (/historical|deep\s*history|lịch\s*sử\s*dài|lịch\s*sử\s*20/i.test(norm)) {
    return 'history';
  }

  // Macro Trends
  if (/macro\s*trends|toàn\s*cầu|xu\s*hướng\s*vĩ\s*mô/i.test(norm)) {
    return 'trends';
  }

  // Sectors & Composition
  if (/sector|sectors|composition|cơ\s*cấu|ngành|nông\s*nghiệp|công\s*nghiệp|dịch\s*vụ/i.test(norm)) {
    return 'sectors';
  }

  // Economic Radar
  if (/radar|spider|mạng\s*nhện|đa\s*chiều|toàn\s*diện/i.test(norm)) {
    return 'radar';
  }

  // Variance Heatmap
  if (/heatmap|variance|bản\s*đồ\s*nhiệt|độ\s*lệch/i.test(norm)) {
    return 'heatmap';
  }

  // Growth Projection
  if (/projection|forecast|future|dự\s*báo|tương\s*lai|2035/i.test(norm)) {
    return 'projection';
  }

  // Equivalence Calculator
  if (/equivalence|calculator|tương\s*đương|quy\s*đổi/i.test(norm)) {
    return 'equivalence';
  }

  // Interactive Charts (Default when time range or trend/line/bar/pie is specified)
  if (
    timeRange ||
    /chart|charts|biểu\s*đồ|đồ\s*thị|line|bar|pie|donut|cột|đường|tròn|vành\s*khăn|trend|xu\s*hướng/i.test(norm)
  ) {
    return 'charts';
  }

  // General comparative overview
  return 'charts';
}

/**
 * Checks if query contains Snapshot or comparison command triggers
 */
function hasSnapshotCommandTrigger(query: string): boolean {
  const norm = query.toLowerCase();

  const commandTriggers = [
    'compare',
    'so sánh',
    'so sanh',
    'snapshot',
    'vs',
    'versus',
    'đối chiếu',
    'doi chieu',
    'so với',
    'so voi',
    'jump to',
    'chuyển sang',
    'xem',
    'show',
    'open',
    'hiển thị',
    'biểu đồ',
    'chart',
    'last 5 years',
    '5 năm qua',
    '5 years',
    '10 years',
    'between',
    'giữa',
  ];

  return commandTriggers.some((trigger) => norm.includes(trigger));
}

/**
 * Translates tab name for display
 */
export function getTabDisplayName(tab: AppTabType): { en: string; vi: string } {
  switch (tab) {
    case 'world-map':
      return { en: 'Economic World Map', vi: 'Bản đồ Kinh tế Thế giới' };
    case 'charts':
      return { en: 'Interactive Visual Charts', vi: 'Biểu đồ Tương tác' };
    case 'fiscal':
      return { en: 'Fiscal Policy AI', vi: 'Chính sách Tài khóa AI' };
    case 'history':
      return { en: 'Historical Trends (20Y)', vi: 'Xu hướng Lịch sử 20Y' };
    case 'trends':
      return { en: 'Macro Trends Tab', vi: 'Xu hướng Vĩ mô' };
    case 'what-if':
      return { en: 'What-If Scenario Lab', vi: 'Kịch bản Giả định' };
    case 'heatmap':
      return { en: 'Variance Heatmap', vi: 'Bản đồ nhiệt Độ lệch' };
    case 'projection':
      return { en: 'Growth Projection Lab', vi: 'Phòng thí nghiệm Dự báo' };
    case 'sectors':
      return { en: 'Sectors & Composition', vi: 'Cơ cấu Ngành' };
    case 'radar':
      return { en: 'Economic Radar', vi: 'Radar Đa chiều' };
    case 'equivalence':
      return { en: 'Equivalence Calculator', vi: 'Công cụ Tính Tương đương' };
    case 'copilot':
      return { en: 'Macro Copilot', vi: 'Copilot Vĩ mô' };
    case 'overview':
    default:
      return { en: 'Indicators & Specs', vi: 'Chỉ số & Tổng quan' };
  }
}

/**
 * Main parser: analyzes spoken or typed query to determine if it is a Snapshot command.
 * Returns parsed entities, target tab, time horizon, and feedback messages.
 */
export function parseVoiceSnapshotCommand(
  rawQuery: string,
  allEntities: EconomicEntity[],
  currentEntityA?: EconomicEntity,
  currentEntityB?: EconomicEntity
): SnapshotVoiceCommandResult | null {
  if (!rawQuery || rawQuery.trim().length < 3) {
    return null;
  }

  const normalized = normalizeString(rawQuery);
  const isTriggered = hasSnapshotCommandTrigger(normalized);

  const matchedEntities = extractEntities(normalized, allEntities);

  // If no entities matched and no trigger, it's not a snapshot command
  if (!isTriggered && matchedEntities.length === 0) {
    return null;
  }

  let finalEntityA: EconomicEntity | undefined;
  let finalEntityB: EconomicEntity | undefined;

  if (matchedEntities.length >= 2) {
    finalEntityA = matchedEntities[0].entity;
    finalEntityB = matchedEntities[1].entity;
  } else if (matchedEntities.length === 1) {
    // Only 1 entity specified in speech: pair with whichever current entity is different
    const matched = matchedEntities[0].entity;
    if (currentEntityA && currentEntityA.id !== matched.id) {
      finalEntityA = currentEntityA;
      finalEntityB = matched;
    } else if (currentEntityB && currentEntityB.id !== matched.id) {
      finalEntityA = matched;
      finalEntityB = currentEntityB;
    } else {
      // Fallback
      finalEntityA = matched;
      finalEntityB = allEntities.find((e) => e.id !== matched.id) || allEntities[0];
    }
  } else {
    // No entities explicitly named in query (e.g. "Compare the last 5 years" or "Show fiscal policy")
    // If command trigger exists with timeRange or tab, keep current entities
    if (isTriggered && currentEntityA && currentEntityB) {
      finalEntityA = currentEntityA;
      finalEntityB = currentEntityB;
    } else {
      return null;
    }
  }

  // Prevent comparing the exact same entity
  if (finalEntityA.id === finalEntityB.id) {
    const alternative = allEntities.find((e) => e.id !== finalEntityA?.id);
    if (alternative) {
      finalEntityB = alternative;
    }
  }

  const timeRange = extractTimeRange(normalized);
  const targetTab = extractTargetTab(normalized, timeRange);

  const tabLabels = getTabDisplayName(targetTab);
  const timeHorizonText = timeRange
    ? timeRange === '5y'
      ? '5 Years'
      : timeRange === '10y'
      ? '10 Years'
      : timeRange === '20y'
      ? '20 Years'
      : timeRange
    : '';

  const summaryExplanation = `Comparing ${finalEntityA.name} ${finalEntityA.flag} vs ${finalEntityB.name} ${finalEntityB.flag}${
    timeHorizonText ? ` (${timeHorizonText})` : ''
  } → Jumping to ${tabLabels.en}`;

  const spokenFeedback = `Comparing ${finalEntityA.name} and ${finalEntityB.name}${
    timeHorizonText ? ` over the last ${timeHorizonText}` : ''
  }. Navigating to ${tabLabels.en}.`;

  return {
    isSnapshotCommand: true,
    rawText: rawQuery,
    entityA: finalEntityA,
    entityB: finalEntityB,
    targetTab,
    targetTimeRange: timeRange,
    summaryExplanation,
    spokenFeedback,
  };
}

/**
 * Curated list of quick voice snapshot command examples for user test / guidance
 */
export const SNAPSHOT_VOICE_EXAMPLES = [
  {
    text: 'Compare the last 5 years for Germany vs France',
    lang: 'en-US' as const,
    badge: '5Y Trend',
    description: 'Auto-selects Germany & France, sets 5Y line chart & jumps to Charts',
  },
  {
    text: 'So sánh 5 năm qua giữa Đức và Pháp',
    lang: 'vi-VN' as const,
    badge: 'Tiếng Việt',
    description: 'Tự động chọn Đức & Pháp, cấu hình biểu đồ 5 năm & chuyển tab',
  },
  {
    text: 'Show fiscal policy for United States vs China',
    lang: 'en-US' as const,
    badge: 'Fiscal AI',
    description: 'Selects US & China, opens Fiscal Policy Analyzer',
  },
  {
    text: 'Compare 10 years for California vs Texas',
    lang: 'en-US' as const,
    badge: 'Subnational',
    description: 'Compares US mega-states over a 10-year horizon in Interactive Charts',
  },
  {
    text: 'So sánh chính sách tài khóa của Nhật Bản và Đức',
    lang: 'vi-VN' as const,
    badge: 'Tài khóa',
    description: 'Mở tab phân tích tài khóa Nhật Bản và Đức',
  },
  {
    text: 'Historical trends for Vietnam vs Thailand',
    lang: 'en-US' as const,
    badge: 'Deep 20Y',
    description: 'Opens 20-year deep historical trajectory for ASEAN economies',
  },
];
