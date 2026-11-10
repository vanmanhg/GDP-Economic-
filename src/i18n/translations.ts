export type SupportedLanguage =
  | 'en' // English
  | 'fr' // French
  | 'de' // German
  | 'zh' // Chinese (Simplified)
  | 'ja' // Japanese
  | 'ko' // Korean
  | 'th' // Thai
  | 'vi' // Vietnamese
  | 'hi'; // Indian (Hindi)

export interface LanguageInfo {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
  speechCode: string;
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸', speechCode: 'en-US' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳', speechCode: 'vi-VN' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', speechCode: 'fr-FR' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', speechCode: 'de-DE' },
  { code: 'zh', name: 'Chinese', nativeName: '简体中文', flag: '🇨🇳', speechCode: 'zh-CN' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵', speechCode: 'ja-JP' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷', speechCode: 'ko-KR' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย', flag: '🇹🇭', speechCode: 'th-TH' },
  { code: 'hi', name: 'Hindi (India)', nativeName: 'हिन्दी', flag: '🇮🇳', speechCode: 'hi-IN' },
];

export interface TranslationDictionary {
  // Brand & Header
  appTitle: string;
  appSubtitle: string;
  tagNationsAndRegions: string;
  searchPlaceholder: string;
  liveFxButton: string;
  darkMode: string;
  lightMode: string;
  indicatorsButton: string;
  fiveWayLab: string;
  recentSessions: string;
  exportReport: string;
  googleSheets: string;
  languageSelect: string;

  // Tabs
  tabOverview: string;
  tabWorldMap: string;
  tabCharts: string;
  tabTrends: string;
  tabFiscal: string;
  tabCopilot: string;
  tabWhatIf: string;
  tabHeatmap: string;
  tabHistory: string;
  tabProjection: string;
  tabSectors: string;
  tabRadar: string;
  tabEquivalence: string;

  // Interactive Charts Header & Modes
  chartVisualizationBadge: string;
  chartInteractiveSubtitle: string;
  chartMainTitle: string;
  chartMainDesc: string;
  chartModeAll: string;
  chartModeLine: string;
  chartModeBar: string;
  chartModePie: string;
  chartGdpDifference: string;
  chartLeadBadge: string;

  // Comparative Pie Chart
  pieBadge: string;
  pieTagline: string;
  pieModeDonut: string;
  pieModeSolid: string;
  pieExportPng: string;
  pieExporting: string;
  pieMetricSector: string;
  pieMetricBilateralGdp: string;
  pieMetricTrade: string;
  pieMetricFiscalDebt: string;
  pieTitleSector: string;
  pieSubtitleSector: string;
  pieTitleBilateral: string;
  pieSubtitleBilateral: string;
  pieTitleTrade: string;
  pieSubtitleTrade: string;
  pieTitleFiscal: string;
  pieSubtitleFiscal: string;
  piePartyA: string;
  piePartyB: string;
  pieTableTitle: string;
  pieTableSubtitle: string;
  pieColCategory: string;
  pieColDelta: string;
  pieEquivalentShare: string;
  pieHigher: string;
  pieTooltipShare: string;
  pieTooltipAbs: string;
  pieTooltipDelta: string;

  // Comparative Bar Chart
  barCohortTop10: string;
  barCohortG7: string;
  barCohortAsiaPacific: string;
  barCohortEurope: string;
  barCohortAmericas: string;
  barCohortSubnational: string;
  barCohortCustom: string;
  barSortDesc: string;
  barSortAsc: string;
  barSortDefault: string;
  barHorizontal: string;
  barVertical: string;
  barCohortAvg: string;
  barCohortMedian: string;
  barHoverInstruction: string;

  // Hero & General
  vs: string;
  swapEntities: string;
  compareButton: string;
  nominalGdp: string;
  gdpPerCapita: string;
  growthRate: string;
  inflation: string;
  unemployment: string;
  publicDebt: string;
  population: string;
  hdi: string;
  rank: string;
  sovereignCountry: string;
  subnationalRegion: string;
}

export const TRANSLATIONS: Record<SupportedLanguage, TranslationDictionary> = {
  // ==========================================
  // ENGLISH (en)
  // ==========================================
  en: {
    appTitle: 'GDP & Macro Comparator',
    appSubtitle: 'Benchmarking sovereign countries and subnational economies',
    tagNationsAndRegions: 'Nations & Regions',
    searchPlaceholder: 'Search country or region (e.g. Germany, California)...',
    liveFxButton: 'Live FX',
    darkMode: 'Dark',
    lightMode: 'Light',
    indicatorsButton: 'Indicators',
    fiveWayLab: '5-Way Lab',
    recentSessions: 'Recent',
    exportReport: 'Export',
    googleSheets: 'Sheets',
    languageSelect: 'Language',

    tabOverview: 'Indicators & Specs',
    tabWorldMap: 'Economic World Map',
    tabCharts: 'Interactive Charts',
    tabTrends: 'Macro Trends',
    tabFiscal: 'Fiscal Policy AI',
    tabCopilot: 'AI Copilot',
    tabWhatIf: 'What-If Lab',
    tabHeatmap: 'Variance Heatmap',
    tabHistory: '20Y History',
    tabProjection: 'Growth 2035',
    tabSectors: 'Sectors & GVA',
    tabRadar: 'Radar Profile',
    tabEquivalence: 'Equivalence Lab',

    chartVisualizationBadge: 'Economic Data Visualization',
    chartInteractiveSubtitle: 'Multidimensional interactive inspection & data points',
    chartMainTitle: 'Comparative GDP & Macroeconomic Charts',
    chartMainDesc: 'Explore multi-year trajectory line charts, benchmark ranking bar charts, and structural composition pie charts between {entityA} and {entityB}.',
    chartModeAll: 'All (Combined)',
    chartModeLine: 'Line Chart',
    chartModeBar: 'Bar Chart',
    chartModePie: 'Pie Chart',
    chartGdpDifference: 'GDP Scale Difference',
    chartLeadBadge: 'ahead',

    pieBadge: 'Pie & Donut Charts',
    pieTagline: 'Structural Share & Economic Composition',
    pieModeDonut: 'Donut',
    pieModeSolid: 'Solid Pie',
    pieExportPng: 'Download PNG',
    pieExporting: 'Exporting...',
    pieMetricSector: 'GVA Sector Breakdown',
    pieMetricBilateralGdp: 'Global GDP Share',
    pieMetricTrade: 'Trade & Export/Import',
    pieMetricFiscalDebt: 'Debt vs Fiscal Headroom',
    pieTitleSector: 'Gross Value Added (GVA) Sector Composition',
    pieSubtitleSector: 'Relative contribution of Services, Industry, and Agriculture to national GDP output',
    pieTitleBilateral: 'Bilateral & Global GDP Output Share',
    pieSubtitleBilateral: 'Relative output comparison against counterpart and global GDP (~$105T USD)',
    pieTitleTrade: 'Foreign Trade Volume & Flow Structure',
    pieSubtitleTrade: 'Proportion of Exports vs Imports in total foreign trade turnover',
    pieTitleFiscal: 'Public Debt Structure & Fiscal Headroom',
    pieSubtitleFiscal: 'Public Debt to GDP burden versus sovereign borrowing safety headroom',
    piePartyA: 'Entity A',
    piePartyB: 'Entity B',
    pieTableTitle: 'Structural Share & Variance Analysis Table',
    pieTableSubtitle: 'Direct percentage point delta comparison across economic components',
    pieColCategory: 'COMPONENT CATEGORY',
    pieColDelta: 'DELTA VARIANCE (A vs B)',
    pieEquivalentShare: 'Equivalent Share (0.0%)',
    pieHigher: 'higher',
    pieTooltipShare: 'Percentage Share:',
    pieTooltipAbs: 'Absolute Value:',
    pieTooltipDelta: 'Delta vs',

    barCohortTop10: 'World Top 10',
    barCohortG7: 'G7 Nations',
    barCohortAsiaPacific: 'Asia-Pacific',
    barCohortEurope: 'Europe',
    barCohortAmericas: 'Americas',
    barCohortSubnational: 'States & Regions',
    barCohortCustom: 'Custom Selection',
    barSortDesc: 'Highest first',
    barSortAsc: 'Lowest first',
    barSortDefault: 'Default order',
    barHorizontal: 'Horizontal Bar',
    barVertical: 'Vertical Column',
    barCohortAvg: 'Cohort Average',
    barCohortMedian: 'Cohort Median',
    barHoverInstruction: 'Hover over bars to inspect underlying data points',

    vs: 'vs',
    swapEntities: 'Swap Entities',
    compareButton: 'Compare',
    nominalGdp: 'Nominal GDP',
    gdpPerCapita: 'GDP Per Capita',
    growthRate: 'Annual Growth Rate',
    inflation: 'Inflation Rate (CPI)',
    unemployment: 'Unemployment Rate',
    publicDebt: 'Public Debt / GDP',
    population: 'Population',
    hdi: 'Human Development Index',
    rank: 'Global Rank',
    sovereignCountry: 'Sovereign Country',
    subnationalRegion: 'Subnational Region',
  },

  // ==========================================
  // VIETNAMESE (vi)
  // ==========================================
  vi: {
    appTitle: 'So sánh GDP & Kinh tế Vĩ mô',
    appSubtitle: 'Đối chuẩn kinh tế quốc gia và các khu vực địa phương',
    tagNationsAndRegions: 'Quốc gia & Khu vực',
    searchPlaceholder: 'Tìm kiếm quốc gia hoặc khu vực (ví dụ: Đức, California)...',
    liveFxButton: 'Tỷ giá Trực tiếp',
    darkMode: 'Tối',
    lightMode: 'Sáng',
    indicatorsButton: 'Chỉ số',
    fiveWayLab: 'So sánh 5 Bên',
    recentSessions: 'Gần đây',
    exportReport: 'Xuất Báo cáo',
    googleSheets: 'Sheets',
    languageSelect: 'Ngôn ngữ',

    tabOverview: 'Chỉ số & Tổng quan',
    tabWorldMap: 'Bản đồ Kinh tế',
    tabCharts: 'Biểu đồ Tương tác',
    tabTrends: 'Xu hướng Vĩ mô',
    tabFiscal: 'Chính sách Tài khóa',
    tabCopilot: 'AI Copilot',
    tabWhatIf: 'Phòng Giả định',
    tabHeatmap: 'Bản đồ Nhiệt',
    tabHistory: 'Lịch sử 20 Năm',
    tabProjection: 'Dự báo 2035',
    tabSectors: 'Cơ cấu Ngành',
    tabRadar: 'Biểu đồ Radar',
    tabEquivalence: 'Quy đổi Tương đương',

    chartVisualizationBadge: 'Trực quan hóa Dữ liệu Kinh tế',
    chartInteractiveSubtitle: 'Tương tác đa chiều & Xem trước điểm dữ liệu',
    chartMainTitle: 'Biểu đồ So sánh GDP & Chỉ số Vĩ mô',
    chartMainDesc: 'Khám phá xu hướng dài hạn qua biểu đồ đường, phân tích xếp hạng qua biểu đồ cột, và so sánh cơ cấu tỷ trọng qua biểu đồ tròn giữa {entityA} và {entityB}.',
    chartModeAll: 'Tất cả (All)',
    chartModeLine: 'Biểu đồ Đường',
    chartModeBar: 'Biểu đồ Cột',
    chartModePie: 'Biểu đồ Tròn',
    chartGdpDifference: 'Chênh lệch Quy mô GDP',
    chartLeadBadge: 'dẫn trước',

    pieBadge: 'Biểu đồ Tròn & Vành khăn',
    pieTagline: 'Phân bổ Tỷ trọng & Cơ cấu Kinh tế',
    pieModeDonut: 'Vành khăn',
    pieModeSolid: 'Tròn đặc',
    pieExportPng: 'Tải PNG',
    pieExporting: 'Đang xuất...',
    pieMetricSector: 'Cơ cấu Kinh tế (GVA)',
    pieMetricBilateralGdp: 'Thị phần GDP Toàn cầu',
    pieMetricTrade: 'Cán cân Xuất Nhập khẩu',
    pieMetricFiscalDebt: 'Nợ công & Dư địa Tài khóa',
    pieTitleSector: 'Cơ cấu Giá trị Gia tăng Khu vực Kinh tế (GVA)',
    pieSubtitleSector: 'Tỷ trọng đóng góp của Dịch vụ, Công nghiệp và Nông nghiệp trong Tổng sản lượng GDP',
    pieTitleBilateral: 'Thị phần Sản lượng GDP Song phương & Toàn cầu',
    pieSubtitleBilateral: 'So sánh quy mô tương đối giữa hai nền kinh tế và tỷ trọng trong tổng GDP toàn cầu (~$105T USD)',
    pieTitleTrade: 'Cơ cấu Thương mại & Cán cân Xuất Nhập khẩu',
    pieSubtitleTrade: 'Tỷ lệ phân bổ giữa Kim ngạch Xuất khẩu và Nhập khẩu trong tổng doanh số thương mại quốc tế',
    pieTitleFiscal: 'Cấu trúc Nợ công & Dư địa Tài khóa',
    pieSubtitleFiscal: 'Tương quan giữa Tỷ lệ Nợ công/GDP và Dư địa vay nợ an toàn của ngân sách nhà nước',
    piePartyA: 'Bên A',
    piePartyB: 'Bên B',
    pieTableTitle: 'Bảng Đối chiếu Tỷ trọng & Chênh lệch Cơ cấu',
    pieTableSubtitle: 'Phân tích chênh lệch phần trăm điểm (percentage point delta) giữa hai nền kinh tế',
    pieColCategory: 'DANH MỤC THÀNH PHẦN',
    pieColDelta: 'CHÊNH LỆCH DELTA (A vs B)',
    pieEquivalentShare: 'Tỷ trọng tương đương (0.0%)',
    pieHigher: 'cao hơn',
    pieTooltipShare: 'Tỷ trọng phần trăm:',
    pieTooltipAbs: 'Giá trị tuyệt đối:',
    pieTooltipDelta: 'Chênh lệch so với',

    barCohortTop10: 'Top 10 Thế giới',
    barCohortG7: 'Khối G7',
    barCohortAsiaPacific: 'Châu Á - TBD',
    barCohortEurope: 'Châu Âu',
    barCohortAmericas: 'Châu Mỹ',
    barCohortSubnational: 'Bang & Khu vực',
    barCohortCustom: 'Tùy chọn riêng',
    barSortDesc: 'Cao xuống thấp',
    barSortAsc: 'Thấp lên cao',
    barSortDefault: 'Thứ tự mặc định',
    barHorizontal: 'Thanh ngang',
    barVertical: 'Cột dọc',
    barCohortAvg: 'Trung bình nhóm',
    barCohortMedian: 'Trung vị nhóm',
    barHoverInstruction: 'Di chuột qua các cột để xem chi tiết điểm dữ liệu',

    vs: 'so với',
    swapEntities: 'Đổi vị trí',
    compareButton: 'So sánh',
    nominalGdp: 'GDP Danh nghĩa',
    gdpPerCapita: 'GDP Bình quân',
    growthRate: 'Tốc độ Tăng trưởng',
    inflation: 'Tỷ lệ Lạm phát',
    unemployment: 'Tỷ lệ Thất nghiệp',
    publicDebt: 'Nợ công / GDP',
    population: 'Dân số',
    hdi: 'Chỉ số Phát triển Con người',
    rank: 'Hạng toàn cầu',
    sovereignCountry: 'Quốc gia độc lập',
    subnationalRegion: 'Khu vực địa phương',
  },

  // ==========================================
  // FRENCH (fr)
  // ==========================================
  fr: {
    appTitle: 'Comparateur de PIB & Macroéconomie',
    appSubtitle: 'Analyse comparative des pays souverains et des économies régionales',
    tagNationsAndRegions: 'Nations & Régions',
    searchPlaceholder: 'Rechercher un pays ou une région (ex: Allemagne, Californie)...',
    liveFxButton: 'Taux de Change',
    darkMode: 'Sombre',
    lightMode: 'Clair',
    indicatorsButton: 'Indicateurs',
    fiveWayLab: 'Labo 5 Entités',
    recentSessions: 'Récents',
    exportReport: 'Exporter',
    googleSheets: 'Sheets',
    languageSelect: 'Langue',

    tabOverview: 'Indicateurs & Fiches',
    tabWorldMap: 'Carte Économique Mondiale',
    tabCharts: 'Graphiques Interactifs',
    tabTrends: 'Tendances Macro',
    tabFiscal: 'Politique Budgétaire IA',
    tabCopilot: 'Copilote IA',
    tabWhatIf: 'Scénarios "Et Si"',
    tabHeatmap: 'Carte Thermique',
    tabHistory: 'Histoire sur 20 Ans',
    tabProjection: 'Croissance 2035',
    tabSectors: 'Secteurs & VAB',
    tabRadar: 'Profil Radar',
    tabEquivalence: 'Équivalences',

    chartVisualizationBadge: 'Visualisation de Données Économiques',
    chartInteractiveSubtitle: 'Inspection interactive multidimensionnelle et points de données',
    chartMainTitle: 'Graphiques Comparatifs de PIB et Indicateurs Macro',
    chartMainDesc: 'Explorez les graphiques linéaires historiques, les diagrammes en barres de classement et les graphiques circulaires de structure entre {entityA} et {entityB}.',
    chartModeAll: 'Tous (Combiné)',
    chartModeLine: 'Graphique Linéaire',
    chartModeBar: 'Diagramme en Barres',
    chartModePie: 'Graphique Circulaire',
    chartGdpDifference: 'Écart de PIB Nominal',
    chartLeadBadge: 'en tête',

    pieBadge: 'Graphiques Circulaires & Donut',
    pieTagline: 'Répartition Structurelle & Composition Économique',
    pieModeDonut: 'Donut',
    pieModeSolid: 'Circulaire Plein',
    pieExportPng: 'Télécharger PNG',
    pieExporting: 'Exportation...',
    pieMetricSector: 'Répartition Sectorielle (VAB)',
    pieMetricBilateralGdp: 'Part du PIB Mondial',
    pieMetricTrade: 'Commerce & Import/Export',
    pieMetricFiscalDebt: 'Dette vs Marge Budgétaire',
    pieTitleSector: 'Valeur Ajoutée Brute (VAB) par Secteur',
    pieSubtitleSector: 'Contribution relative des services, de l\'industrie et de l\'agriculture au PIB',
    pieTitleBilateral: 'Part du PIB Bilatéral et Mondial',
    pieSubtitleBilateral: 'Comparaison relative de production par rapport au PIB mondial (~105 000 Md$ USD)',
    pieTitleTrade: 'Structure des Flux Commerciaux',
    pieSubtitleTrade: 'Proportion des exportations et importations dans le volume d\'échanges',
    pieTitleFiscal: 'Structure de Dette Publique & Marge Budgétaire',
    pieSubtitleFiscal: 'Ratio Dette/PIB comparé à la marge de sécurité souveraine',
    piePartyA: 'Partie A',
    piePartyB: 'Partie B',
    pieTableTitle: 'Tableau Comparatif des Parts Structurelles',
    pieTableSubtitle: 'Analyse des écarts en points de pourcentage entre les deux économies',
    pieColCategory: 'CATÉGORIE COMPOSANTE',
    pieColDelta: 'ÉCART DELTA (A vs B)',
    pieEquivalentShare: 'Part Équivalente (0,0%)',
    pieHigher: 'plus élevé',
    pieTooltipShare: 'Part en pourcentage :',
    pieTooltipAbs: 'Valeur absolue :',
    pieTooltipDelta: 'Écart par rapport à',

    barCohortTop10: 'Top 10 Mondial',
    barCohortG7: 'Pays du G7',
    barCohortAsiaPacific: 'Asie-Pacifique',
    barCohortEurope: 'Europe',
    barCohortAmericas: 'Amériques',
    barCohortSubnational: 'États & Régions',
    barCohortCustom: 'Sélection Personnalisée',
    barSortDesc: 'Décroissant',
    barSortAsc: 'Croissant',
    barSortDefault: 'Ordre par défaut',
    barHorizontal: 'Barres Horizontales',
    barVertical: 'Colonnes Verticales',
    barCohortAvg: 'Moyenne du Groupe',
    barCohortMedian: 'Médiane du Groupe',
    barHoverInstruction: 'Survolez les barres pour afficher les détails précis',

    vs: 'contre',
    swapEntities: 'Inverser',
    compareButton: 'Comparer',
    nominalGdp: 'PIB Nominal',
    gdpPerCapita: 'PIB Par Habitant',
    growthRate: 'Taux de Croissance Annuel',
    inflation: 'Taux d\'Inflation',
    unemployment: 'Taux de Chômage',
    publicDebt: 'Dette Publique / PIB',
    population: 'Population',
    hdi: 'Indice de Dév. Humain',
    rank: 'Rang Mondial',
    sovereignCountry: 'Pays Souverain',
    subnationalRegion: 'Région / État Fédéré',
  },

  // ==========================================
  // GERMAN (de)
  // ==========================================
  de: {
    appTitle: 'BIP & Makroökonomischer Vergleich',
    appSubtitle: 'Benchmarking von Nationalstaaten und subnationalen Wirtschaftsregionen',
    tagNationsAndRegions: 'Nationen & Regionen',
    searchPlaceholder: 'Land oder Region suchen (z.B. Deutschland, Kalifornien)...',
    liveFxButton: 'Live-Wechselkurse',
    darkMode: 'Dunkel',
    lightMode: 'Hell',
    indicatorsButton: 'Indikatoren',
    fiveWayLab: '5-Wege-Labor',
    recentSessions: 'Zuletzt',
    exportReport: 'Exportieren',
    googleSheets: 'Sheets',
    languageSelect: 'Sprache',

    tabOverview: 'Indikatoren & Daten',
    tabWorldMap: 'Wirtschaftsweltkarte',
    tabCharts: 'Interaktive Diagramme',
    tabTrends: 'Makro-Trends',
    tabFiscal: 'Finanzpolitik-KI',
    tabCopilot: 'KI-Copilot',
    tabWhatIf: 'Was-wäre-wenn-Labor',
    tabHeatmap: 'Varianz-Heatmap',
    tabHistory: '20-Jahre-Historie',
    tabProjection: 'Wachstum 2035',
    tabSectors: 'Sektoren & BWS',
    tabRadar: 'Radar-Profil',
    tabEquivalence: 'Äquivalenzrechner',

    chartVisualizationBadge: 'Wirtschaftsdaten-Visualisierung',
    chartInteractiveSubtitle: 'Multidimensionale interaktive Datenanalyse',
    chartMainTitle: 'Vergleichende BIP- & Makro-Diagramme',
    chartMainDesc: 'Untersuchen Sie historische Liniendiagramme, vergleichende Balkendiagramme und strukturelle Kreisdiagramme zwischen {entityA} und {entityB}.',
    chartModeAll: 'Alle (Kombiniert)',
    chartModeLine: 'Liniendiagramm',
    chartModeBar: 'Balkendiagramm',
    chartModePie: 'Kreisdiagramm',
    chartGdpDifference: 'BIP-Differenz',
    chartLeadBadge: 'in Führung',

    pieBadge: 'Kreis- & Donut-Diagramme',
    pieTagline: 'Strukturanteile & Wirtschaftszusammensetzung',
    pieModeDonut: 'Donut',
    pieModeSolid: 'Vollkreis',
    pieExportPng: 'PNG herunterladen',
    pieExporting: 'Wird exportiert...',
    pieMetricSector: 'Sektoraufteilung (BWS)',
    pieMetricBilateralGdp: 'Weltweiter BIP-Anteil',
    pieMetricTrade: 'Außenhandel & Bilanz',
    pieMetricFiscalDebt: 'Schulden vs. Spielraum',
    pieTitleSector: 'Bruttowertschöpfung (BWS) nach Sektoren',
    pieSubtitleSector: 'Beitrag von Dienstleistungen, Industrie und Landwirtschaft zum Bruttoinlandsprodukt',
    pieTitleBilateral: 'Bilateraler und globaler BIP-Ausstoßanteil',
    pieSubtitleBilateral: 'Relativer Vergleich zur globalen Wirtschaftsleistung (~105 Billionen USD)',
    pieTitleTrade: 'Außenhandelsstruktur (Ex- & Importe)',
    pieSubtitleTrade: 'Verhältnis von Exporten und Importen am gesamten Handelsvolumen',
    pieTitleFiscal: 'Staatsschuldenstruktur & Haushaltsspielraum',
    pieSubtitleFiscal: 'Schuldenquote im Vergleich zum fiskalischen Sicherheitsspielraum',
    piePartyA: 'Partei A',
    piePartyB: 'Partei B',
    pieTableTitle: 'Strukturelle Varianz- & Vergleichstabelle',
    pieTableSubtitle: 'Direkter Prozentpunkte-Abweichungsvergleich zwischen beiden Volkswirtschaften',
    pieColCategory: 'KOMPONENTEN-KATEGORIE',
    pieColDelta: 'DELTA-ABWEICHUNG (A vs. B)',
    pieEquivalentShare: 'Gleicher Anteil (0,0%)',
    pieHigher: 'höher',
    pieTooltipShare: 'Prozentanteil:',
    pieTooltipAbs: 'Absoluter Wert:',
    pieTooltipDelta: 'Differenz zu',

    barCohortTop10: 'Welt-Top-10',
    barCohortG7: 'G7-Staaten',
    barCohortAsiaPacific: 'Asien-Pazifik',
    barCohortEurope: 'Europa',
    barCohortAmericas: 'Amerika',
    barCohortSubnational: 'Bundesstaaten & Regionen',
    barCohortCustom: 'Benutzerdefiniert',
    barSortDesc: 'Absteigend',
    barSortAsc: 'Aufsteigend',
    barSortDefault: 'Standard-Reihenfolge',
    barHorizontal: 'Horizontale Balken',
    barVertical: 'Vertikale Säulen',
    barCohortAvg: 'Gruppendurchschnitt',
    barCohortMedian: 'Gruppenmedian',
    barHoverInstruction: 'Fahren Sie mit der Maus über die Balken für Details',

    vs: 'gegenüber',
    swapEntities: 'Tauschen',
    compareButton: 'Vergleichen',
    nominalGdp: 'Nominales BIP',
    gdpPerCapita: 'BIP pro Kopf',
    growthRate: 'Jährliche Wachstumsrate',
    inflation: 'Inflationsrate (VPI)',
    unemployment: 'Arbeitslosenquote',
    publicDebt: 'Staatsverschuldung / BIP',
    population: 'Bevölkerung',
    hdi: 'Human Development Index',
    rank: 'Weltrang',
    sovereignCountry: 'Souveräner Staat',
    subnationalRegion: 'Subnationale Region',
  },

  // ==========================================
  // CHINESE (zh - Simplified)
  // ==========================================
  zh: {
    appTitle: 'GDP与宏观经济对比分析系统',
    appSubtitle: '主权国家与次国家区域经济体基准对比平台',
    tagNationsAndRegions: '国家与区域',
    searchPlaceholder: '搜索国家或区域（如：德国、加利福尼亚）...',
    liveFxButton: '实时汇率',
    darkMode: '深色',
    lightMode: '浅色',
    indicatorsButton: '经济指标',
    fiveWayLab: '五方综合对比',
    recentSessions: '最近对比',
    exportReport: '导出报告',
    googleSheets: '表格同步',
    languageSelect: '语言切换',

    tabOverview: '指标与概览',
    tabWorldMap: '世界经济地图',
    tabCharts: '交互式图表',
    tabTrends: '宏观大趋势',
    tabFiscal: '财政政策AI',
    tabCopilot: 'AI副驾驶分析',
    tabWhatIf: '情景推演实验室',
    tabHeatmap: '方差热力图',
    tabHistory: '20年历史轨迹',
    tabProjection: '2035增长预测',
    tabSectors: '产业结构与GVA',
    tabRadar: '雷达画像',
    tabEquivalence: '等效折算器',

    chartVisualizationBadge: '经济数据可视化分析',
    chartInteractiveSubtitle: '多维交互式数据透视与细节预览',
    chartMainTitle: 'GDP规模与宏观指标对比图表',
    chartMainDesc: '探索 {entityA} 与 {entityB} 之间的长期趋势折线图、综合排名柱状图以及产业结构饼图/环形图。',
    chartModeAll: '全部显示 (综合模式)',
    chartModeLine: '折线走势图',
    chartModeBar: '对比柱状图',
    chartModePie: '结构饼图',
    chartGdpDifference: 'GDP规模差距',
    chartLeadBadge: '领先',

    pieBadge: '饼图与环形图',
    pieTagline: '结构占比与经济产业构成',
    pieModeDonut: '环形图',
    pieModeSolid: '实心饼图',
    pieExportPng: '下载高清PNG',
    pieExporting: '正在导出...',
    pieMetricSector: '产业增加值构成 (GVA)',
    pieMetricBilateralGdp: '全球GDP产出份额',
    pieMetricTrade: '进出口贸易结构',
    pieMetricFiscalDebt: '债务率与财政安全空间',
    pieTitleSector: '三大产业增加值结构占比 (GVA)',
    pieSubtitleSector: '服务业、工业与制造业、农业对国内生产总值的相对贡献',
    pieTitleBilateral: '双边产出与全球GDP份额对比',
    pieSubtitleBilateral: '两国经济规模相对于全球约105万亿美元GDP总产出的占比份额',
    pieTitleTrade: '对外贸易结构与进出口比例',
    pieSubtitleTrade: '出口额与进口额在国际贸易总额中的相对构成',
    pieTitleFiscal: '公共债务结构与财政赤字安全空间',
    pieSubtitleFiscal: '政府负债率与国家主权财政借贷安全缓冲空间对比',
    piePartyA: '甲方',
    piePartyB: '乙方',
    pieTableTitle: '结构性份额与方差对比分析表',
    pieTableSubtitle: '两大经济体在各项构成中的百分点差距（Percentage Point Delta）',
    pieColCategory: '经济构成项目',
    pieColDelta: '差值幅度 (A对比B)',
    pieEquivalentShare: '占比持平 (0.0%)',
    pieHigher: '更高',
    pieTooltipShare: '占比百分比:',
    pieTooltipAbs: '绝对规模:',
    pieTooltipDelta: '对比差值:',

    barCohortTop10: '全球前10大经济体',
    barCohortG7: 'G7集团',
    barCohortAsiaPacific: '亚太地区',
    barCohortEurope: '欧洲地区',
    barCohortAmericas: '美洲地区',
    barCohortSubnational: '次国家州/省/大区',
    barCohortCustom: '自定义对比组',
    barSortDesc: '从高到低降序',
    barSortAsc: '从低到高升序',
    barSortDefault: '默认排序',
    barHorizontal: '横向条形图',
    barVertical: '纵向柱形图',
    barCohortAvg: '对比组均值',
    barCohortMedian: '对比组中位数',
    barHoverInstruction: '悬停在柱状条上以查看详细数据点',

    vs: '对比',
    swapEntities: '互换对比实体',
    compareButton: '开始对比',
    nominalGdp: '名义GDP',
    gdpPerCapita: '人均GDP',
    growthRate: '年经济增长率',
    inflation: '通胀率 (CPI)',
    unemployment: '失业率',
    publicDebt: '公共债务率 / GDP',
    population: '人口总量',
    hdi: '人类发展指数 (HDI)',
    rank: '全球排名',
    sovereignCountry: '主权国家',
    subnationalRegion: '地方区域/省州',
  },

  // ==========================================
  // JAPANESE (ja)
  // ==========================================
  ja: {
    appTitle: 'GDP・マクロ経済比較分析システム',
    appSubtitle: '主権国家および地方経済圏のベンチマーク比較プラットフォーム',
    tagNationsAndRegions: '国家＆地域',
    searchPlaceholder: '国または地域を検索（例：ドイツ、カリフォルニア）...',
    liveFxButton: 'リアルタイム為替',
    darkMode: 'ダーク',
    lightMode: 'ライト',
    indicatorsButton: '経済指標',
    fiveWayLab: '5カ国同時比較ラボ',
    recentSessions: '最近の履歴',
    exportReport: 'レポート出力',
    googleSheets: 'スプレッドシート',
    languageSelect: '言語選択',

    tabOverview: '指標・基本スペック',
    tabWorldMap: '世界経済マップ',
    tabCharts: 'インタラクティブグラフ',
    tabTrends: 'マクロトレンド',
    tabFiscal: '財政政策AI',
    tabCopilot: 'AIコパイロット',
    tabWhatIf: 'シナリオ推計ラボ',
    tabHeatmap: '偏差ヒートマップ',
    tabHistory: '20年の長期推移',
    tabProjection: '2035年成長予測',
    tabSectors: '産業構成・GVA',
    tabRadar: 'レーダープロファイル',
    tabEquivalence: '経済規模換算器',

    chartVisualizationBadge: '経済データビジュアライゼーション',
    chartInteractiveSubtitle: '多角的なデータ検証と詳細プレビュー',
    chartMainTitle: 'GDP規模・マクロ経済指標比較チャート',
    chartMainDesc: '{entityA} と {entityB} の複数年推移折れ線グラフ、順位比較バーチャート、構造比率円グラフを探索します。',
    chartModeAll: 'すべて表示 (統合)',
    chartModeLine: '折れ線グラフ',
    chartModeBar: '棒グラフ',
    chartModePie: '円グラフ',
    chartGdpDifference: 'GDP規模格差',
    chartLeadBadge: 'リード',

    pieBadge: '円グラフ＆ドーナツチャート',
    pieTagline: '構造比率と産業構成分析',
    pieModeDonut: 'ドーナツ型',
    pieModeSolid: '標準円グラフ',
    pieExportPng: '高解像度PNG保存',
    pieExporting: '出力中...',
    pieMetricSector: '産業別総付加価値 (GVA)',
    pieMetricBilateralGdp: '世界GDPシェア',
    pieMetricTrade: '貿易収支・輸出入構成',
    pieMetricFiscalDebt: '債務比率と財政余力',
    pieTitleSector: '産業別総付加価値構成 (GVA)',
    pieSubtitleSector: '国内総生産に対するサービス業、製造業、農業の相対的寄与度',
    pieTitleBilateral: '2カ国間および世界全体でのGDPシェア',
    pieSubtitleBilateral: '世界全体のGDP規模（約105兆米ドル）に対する相対シェア',
    pieTitleTrade: '貿易取引高と輸出入構造',
    pieSubtitleTrade: '貿易総取引額に占める輸出と輸入の構成比率',
    pieTitleFiscal: '政府債務比率と財政安全余力',
    pieSubtitleFiscal: '対GDP公的債務残高と財政借入余力の対比',
    piePartyA: '主体A',
    piePartyB: '主体B',
    pieTableTitle: '構成比率・格差分析一覧表',
    pieTableSubtitle: '両経済体におけるパーセンテージポイント差（Delta）の比較',
    pieColCategory: '構成項目',
    pieColDelta: '格差デルタ (A vs B)',
    pieEquivalentShare: '同等シェア (0.0%)',
    pieHigher: '高い',
    pieTooltipShare: '構成比率:',
    pieTooltipAbs: '絶対金額:',
    pieTooltipDelta: '対比差額:',

    barCohortTop10: '世界トップ10',
    barCohortG7: 'G7主要国',
    barCohortAsiaPacific: 'アジア太平洋',
    barCohortEurope: 'ヨーロッパ',
    barCohortAmericas: '米州地域',
    barCohortSubnational: '州・地方経済圏',
    barCohortCustom: 'カスタム選択',
    barSortDesc: '高い順（降順）',
    barSortAsc: '低い順（昇順）',
    barSortDefault: '標準順序',
    barHorizontal: '横棒グラフ',
    barVertical: '縦棒グラフ',
    barCohortAvg: 'コホート平均値',
    barCohortMedian: 'コホート中央値',
    barHoverInstruction: '各バーにマウスを合わせるとデータ詳細が表示されます',

    vs: '対',
    swapEntities: '比較順を入替',
    compareButton: '比較実行',
    nominalGdp: '名目GDP',
    gdpPerCapita: '一人当たりGDP',
    growthRate: '年間経済成長率',
    inflation: 'インフレ率 (CPI)',
    unemployment: '失業率',
    publicDebt: '公的債務比率 / GDP',
    population: '総人口',
    hdi: '人間開発指数 (HDI)',
    rank: '世界順位',
    sovereignCountry: '主権国家',
    subnationalRegion: '地方自治体・州',
  },

  // ==========================================
  // KOREAN (ko)
  // ==========================================
  ko: {
    appTitle: 'GDP 및 거시경제 비교 분석기',
    appSubtitle: '주권 국가 및 하위 지방 경제권 벤치마킹 분석 플랫폼',
    tagNationsAndRegions: '국가 및 지역',
    searchPlaceholder: '국가 또는 지역 검색 (예: 독일, 캘리포니아)...',
    liveFxButton: '실시간 환율',
    darkMode: '다크 모드',
    lightMode: '라이트 모드',
    indicatorsButton: '경제 지표',
    fiveWayLab: '5자 종합 비교',
    recentSessions: '최근 세션',
    exportReport: '보고서 내보내기',
    googleSheets: '시트 연동',
    languageSelect: '언어 설정',

    tabOverview: '지표 및 개요',
    tabWorldMap: '세계 경제 지도',
    tabCharts: '인터랙티브 차트',
    tabTrends: '거시경제 트렌드',
    tabFiscal: '재정 정책 AI',
    tabCopilot: 'AI 코파일럿',
    tabWhatIf: '시나리오 랩',
    tabHeatmap: '편차 히트맵',
    tabHistory: '20년 장기 추이',
    tabProjection: '2035년 성장 전망',
    tabSectors: '산업 구성 & GVA',
    tabRadar: '레이더 프로필',
    tabEquivalence: '등가 환산기',

    chartVisualizationBadge: '경제 데이터 시각화 분석',
    chartInteractiveSubtitle: '다차원 인터랙티브 탐색 및 데이터 포인트 미리보기',
    chartMainTitle: 'GDP 규모 및 거시 지표 비교 차트',
    chartMainDesc: '{entityA}와 {entityB} 간의 장기 추세 꺾은선형 차트, 비교 순위 막대형 차트 및 구조적 비율 원형 차트를 확인하세요.',
    chartModeAll: '전체 보기 (통합 모드)',
    chartModeLine: '꺾은선형 차트',
    chartModeBar: '막대형 차트',
    chartModePie: '원형 차트',
    chartGdpDifference: 'GDP 규모 격차',
    chartLeadBadge: '우위 선점',

    pieBadge: '원형 및 도넛 차트',
    pieTagline: '구조적 비중 및 산업 구성 분석',
    pieModeDonut: '도넛형',
    pieModeSolid: '채워진 원형',
    pieExportPng: '고화질 PNG 다운로드',
    pieExporting: '내보내는 중...',
    pieMetricSector: '산업별 부가가치 구성 (GVA)',
    pieMetricBilateralGdp: '글로벌 GDP 점유율',
    pieMetricTrade: '무역 수지 및 수출입 구성',
    pieMetricFiscalDebt: '국가 부채와 재정 여력',
    pieTitleSector: '산업별 총부가가치(GVA) 비중 구성',
    pieSubtitleSector: '국내총생산에 대한 서비스업, 제조업 및 농업의 상대적 기여도',
    pieTitleBilateral: '양자 간 및 전 세계 GDP 산출 점유율',
    pieSubtitleBilateral: '전 세계 총생산(약 105조 달러) 대비 상대적 경제 규모 비중',
    pieTitleTrade: '대외 무역 규모 및 수출입 흐름 구조',
    pieSubtitleTrade: '국제 무역 총거래액 중 수출액과 수입액의 비중 분포',
    pieTitleFiscal: '국가 채무 구조 및 재정 건전성 여력',
    pieSubtitleFiscal: 'GDP 대비 정부 부채율과 추가 차입 안전 마진의 상관관계',
    piePartyA: '당사국 A',
    piePartyB: '당사국 B',
    pieTableTitle: '구조적 점유율 및 편차 대조표',
    pieTableSubtitle: '양국 경제 간의 퍼센트포인트 차이(Percentage Point Delta) 분석',
    pieColCategory: '구성 항목',
    pieColDelta: '격차 델타 (A vs B)',
    pieEquivalentShare: '동일 비중 (0.0%)',
    pieHigher: '더 높음',
    pieTooltipShare: '점유율 비율:',
    pieTooltipAbs: '절대 금액:',
    pieTooltipDelta: '상대 대비 차이:',

    barCohortTop10: '글로벌 Top 10',
    barCohortG7: 'G7 선진국',
    barCohortAsiaPacific: '아시아·태평양',
    barCohortEurope: '유럽',
    barCohortAmericas: '아메리카',
    barCohortSubnational: '주 및 지방 자치체',
    barCohortCustom: '사용자 지정 선택',
    barSortDesc: '높은 순서대로',
    barSortAsc: '낮은 순서대로',
    barSortDefault: '기본 정렬',
    barHorizontal: '가로 막대형',
    barVertical: '세로 기둥형',
    barCohortAvg: '그룹 평균값',
    barCohortMedian: '그룹 중앙값',
    barHoverInstruction: '막대 위에 마우스를 올리면 데이터 세부 정보가 표시됩니다',

    vs: '대비',
    swapEntities: '순서 맞바꾸기',
    compareButton: '비교하기',
    nominalGdp: '명목 GDP',
    gdpPerCapita: '1인당 GDP',
    growthRate: '연간 경제성장률',
    inflation: '물가상승률 (CPI)',
    unemployment: '실업률',
    publicDebt: '국가부채비율 / GDP',
    population: '총인구',
    hdi: '인간개발지수 (HDI)',
    rank: '글로벌 순위',
    sovereignCountry: '독립 주권국',
    subnationalRegion: '지방 자치 지역',
  },

  // ==========================================
  // THAI (th)
  // ==========================================
  th: {
    appTitle: 'ระบบเปรียบเทียบ GDP และเศรษฐกิจมหภาค',
    appSubtitle: 'การเปรียบเทียบเกณฑ์มาตรฐานระหว่างประเทศอธิปไตยและเขตเศรษฐกิจภูมิภาค',
    tagNationsAndRegions: 'ประเทศและภูมิภาค',
    searchPlaceholder: 'ค้นหาประเทศหรือภูมิภาค (เช่น เยอรมนี, แคลิฟอร์เนีย)...',
    liveFxButton: 'อัตราแลกเปลี่ยนสด',
    darkMode: 'โหมดมืด',
    lightMode: 'โหมดสว่าง',
    indicatorsButton: 'ตัวชี้วัด',
    fiveWayLab: 'ห้องทดลอง 5 ฝ่าย',
    recentSessions: 'ประวัติล่าสุด',
    exportReport: 'ส่งออกรายงาน',
    googleSheets: 'กูเกิลชีต',
    languageSelect: 'เปลี่ยนภาษา',

    tabOverview: 'ตัวชี้วัดและข้อมูลจำเพาะ',
    tabWorldMap: 'แผนที่เศรษฐกิจโลก',
    tabCharts: 'กราฟเชิงโต้ตอบ',
    tabTrends: 'แนวโน้มมหภาค',
    tabFiscal: 'นโยบายการคลัง AI',
    tabCopilot: 'AI วิเคราะห์ร่วม',
    tabWhatIf: 'ห้องจำลองสถานการณ์',
    tabHeatmap: 'แผนที่ความแปรปรวน',
    tabHistory: 'ประวัติศาสตร์ 20 ปี',
    tabProjection: 'คาดการณ์การเติบโต 2035',
    tabSectors: 'โครงสร้างภาคเศรษฐกิจ (GVA)',
    tabRadar: 'เรดาร์โปรไฟล์',
    tabEquivalence: 'เครื่องคำนวณความเท่าเทียม',

    chartVisualizationBadge: 'การสร้างภาพข้อมูลทางเศรษฐกิจ',
    chartInteractiveSubtitle: 'การตรวจสอบข้อมูลเชิงโต้ตอบหลายมิติพร้อมดูจุดข้อมูลล่วงหน้า',
    chartMainTitle: 'กราฟเปรียบเทียบ GDP และตัวชี้วัดเศรษฐกิจมหภาค',
    chartMainDesc: 'สำรวจกราฟเส้นแนวโน้มระยะยาว กราฟแท่งจัดอันดับความสามารถในการแข่งขัน และกราฟวงกลมโครงสร้างสัดส่วนระหว่าง {entityA} และ {entityB}',
    chartModeAll: 'แสดงทั้งหมด (รวม)',
    chartModeLine: 'กราฟเส้น',
    chartModeBar: 'กราฟแท่ง',
    chartModePie: 'กราฟวงกลม',
    chartGdpDifference: 'ส่วนต่างขนาด GDP',
    chartLeadBadge: 'นำหน้า',

    pieBadge: 'กราฟวงกลมและโดนัท',
    pieTagline: 'การกระจายสัดส่วนและโครงสร้างทางเศรษฐกิจ',
    pieModeDonut: 'โดนัท',
    pieModeSolid: 'วงกลมทึบ',
    pieExportPng: 'ดาวน์โหลด PNG',
    pieExporting: 'กำลังส่งออก...',
    pieMetricSector: 'โครงสร้างภาคเศรษฐกิจ (GVA)',
    pieMetricBilateralGdp: 'ส่วนแบ่ง GDP โลก',
    pieMetricTrade: 'โครงสร้างการค้าระหว่างประเทศ',
    pieMetricFiscalDebt: 'หนี้สาธารณะและพื้นที่ทางการคลัง',
    pieTitleSector: 'มูลค่าเพิ่มขั้นต้นตามภาคเศรษฐกิจ (GVA)',
    pieSubtitleSector: 'สัดส่วนการสนับสนุนของภาคบริการ ภาคอุตสาหกรรม และภาคเกษตรกรรมต่อ GDP',
    pieTitleBilateral: 'ส่วนแบ่งผลผลิต GDP ทวิภาคีและระดับโลก',
    pieSubtitleBilateral: 'การเปรียบเทียบขนาดสัมพัทธ์ต่อผลผลิตมวลรวมของโลก (~105 ล้านล้านดอลลาร์สหรัฐ)',
    pieTitleTrade: 'โครงสร้างปริมาณการค้าและการนำเข้า-ส่งออก',
    pieSubtitleTrade: 'สัดส่วนมูลค่าการส่งออกและการนำเข้าต่อปริมาณการค้าระหว่างประเทศทั้งหมด',
    pieTitleFiscal: 'โครงสร้างหนี้สาธารณะและพื้นที่ความปลอดภัยทางการคลัง',
    pieSubtitleFiscal: 'ภาระหนี้ภาครัฐต่อ GDP เทียบกับพื้นที่ความปลอดภัยในการกู้ยืมเงิน',
    piePartyA: 'ฝ่าย A',
    piePartyB: 'ฝ่าย B',
    pieTableTitle: 'ตารางวิเคราะห์สัดส่วนและความแปรปรวนเชิงโครงสร้าง',
    pieTableSubtitle: 'การเปรียบเทียบส่วนต่างจุดเปอร์เซ็นต์ (Percentage Point Delta) ระหว่างสองเศรษฐกิจ',
    pieColCategory: 'หมวดหมู่ส่วนประกอบ',
    pieColDelta: 'ความต่างเดลต้า (A เทียบ B)',
    pieEquivalentShare: 'สัดส่วนเท่ากัน (0.0%)',
    pieHigher: 'สูงกว่า',
    pieTooltipShare: 'สัดส่วนเปอร์เซ็นต์:',
    pieTooltipAbs: 'มูลค่าสัมบูรณ์:',
    pieTooltipDelta: 'ส่วนต่างเมื่อเทียบกับ',

    barCohortTop10: '10 อันดับแรกของโลก',
    barCohortG7: 'กลุ่มประเทศ G7',
    barCohortAsiaPacific: 'เอเชียแปซิฟิก',
    barCohortEurope: 'ยุโรป',
    barCohortAmericas: 'ทวีปอเมริกา',
    barCohortSubnational: 'รัฐและภูมิภาคย่อย',
    barCohortCustom: 'เลือกแบบกำหนดเอง',
    barSortDesc: 'จากมากไปน้อย',
    barSortAsc: 'จากน้อยไปมาก',
    barSortDefault: 'ลำดับเริ่มต้น',
    barHorizontal: 'แท่งแนวนอน',
    barVertical: 'คอลัมน์แนวตั้ง',
    barCohortAvg: 'ค่าเฉลี่ยกลุ่ม',
    barCohortMedian: 'ค่ามัธยฐานกลุ่ม',
    barHoverInstruction: 'เลื่อนเมาส์เหนือแท่งเพื่อดูรายละเอียดข้อมูลจุด',

    vs: 'เทียบกับ',
    swapEntities: 'สลับตำแหน่ง',
    compareButton: 'เปรียบเทียบ',
    nominalGdp: 'GDP มูลค่าที่แท้จริง',
    gdpPerCapita: 'GDP ต่อหัว',
    growthRate: 'อัตราการเติบโตต่อปี',
    inflation: 'อัตราเงินเฟ้อ (CPI)',
    unemployment: 'อัตราการว่างงาน',
    publicDebt: 'หนี้สาธารณะ / GDP',
    population: 'ประชากร',
    hdi: 'ดัชนีการพัฒนามนุษย์ (HDI)',
    rank: 'อันดับโลก',
    sovereignCountry: 'ประเทศอธิปไตย',
    subnationalRegion: 'ภูมิภาคท้องถิ่น',
  },

  // ==========================================
  // INDIAN (HINDI - hi)
  // ==========================================
  hi: {
    appTitle: 'जीडीपी एवं व्यापक आर्थिक तुलना प्रणाली',
    appSubtitle: 'संप्रभु राष्ट्रों और उप-राष्ट्रीय क्षेत्रीय अर्थव्यवस्थाओं का तुलनात्मक विश्लेषण',
    tagNationsAndRegions: 'राष्ट्र और क्षेत्र',
    searchPlaceholder: 'देश या क्षेत्र खोजें (उदा. जर्मनी, कैलिफ़ोर्निया)...',
    liveFxButton: 'लाइव विनिमय दर',
    darkMode: 'डार्क मोड',
    lightMode: 'लाइट मोड',
    indicatorsButton: 'आर्थिक संकेतक',
    fiveWayLab: '5-पक्षीय प्रयोगशाला',
    recentSessions: 'हाल के सत्र',
    exportReport: 'रिपोर्ट निर्यात',
    googleSheets: 'गूगल शीट्स',
    languageSelect: 'भाषा बदलें',

    tabOverview: 'संकेतक एवं विवरण',
    tabWorldMap: 'आर्थिक विश्व मानचित्र',
    tabCharts: 'इंटरैक्टिव चार्ट',
    tabTrends: 'व्यापक आर्थिक रुझान',
    tabFiscal: 'राजकोषीय नीति एआई',
    tabCopilot: 'एआई सह-विश्लेषक',
    tabWhatIf: 'परिदृश्य प्रयोगशाला',
    tabHeatmap: 'विचरण हीटमैप',
    tabHistory: '20 वर्षों का इतिहास',
    tabProjection: 'विकास पूर्वानुमान 2035',
    tabSectors: 'क्षेत्रीय संरचना (GVA)',
    tabRadar: 'रडार प्रोफ़ाइल',
    tabEquivalence: 'समतुल्यता कैलकुलेटर',

    chartVisualizationBadge: 'आर्थिक डेटा विज़ुअलाइज़ेशन',
    chartInteractiveSubtitle: 'बहुआयामी इंटरैक्टिव डेटा बिंदु विश्लेषण',
    chartMainTitle: 'जीडीपी एवं वृहद आर्थिक संकेतकों का तुलनात्मक चार्ट',
    chartMainDesc: '{entityA} और {entityB} के बीच दीर्घकालिक रुझान रेखा चार्ट, प्रतिस्पर्धी रैंकिंग बार चार्ट और संरचनात्मक अनुपात पाई चार्ट का अन्वेषण करें।',
    chartModeAll: 'सभी देखें (संयुक्त)',
    chartModeLine: 'रेखा चार्ट (Line)',
    chartModeBar: 'बार चार्ट (Bar)',
    chartModePie: 'पाई चार्ट (Pie)',
    chartGdpDifference: 'जीडीपी आकार में अंतर',
    chartLeadBadge: 'आगे है',

    pieBadge: 'पाई और डोनट चार्ट',
    pieTagline: 'संरचनात्मक हिस्सेदारी एवं आर्थिक संरचना',
    pieModeDonut: 'डोनट चार्ट',
    pieModeSolid: 'ठोस पाई चार्ट',
    pieExportPng: 'पीएनजी डाउनलोड करें',
    pieExporting: 'निर्यात हो रहा है...',
    pieMetricSector: 'सकल मूल्य वर्धित संरचना (GVA)',
    pieMetricBilateralGdp: 'वैश्विक जीडीपी हिस्सेदारी',
    pieMetricTrade: 'व्यापार संतुलन (आयात/निर्यात)',
    pieMetricFiscalDebt: 'सार्वजनिक ऋण एवं राजकोषीय गुंजाइश',
    pieTitleSector: 'क्षेत्रवार सकल मूल्य वर्धित (GVA) संरचना',
    pieSubtitleSector: 'जीडीपी उत्पादन में सेवा, उद्योग एवं विनिर्माण और कृषि क्षेत्र का सापेक्ष योगदान',
    pieTitleBilateral: 'द्विपक्षीय एवं वैश्विक जीडीपी उत्पादन हिस्सेदारी',
    pieSubtitleBilateral: 'वैश्विक उत्पादन (~$105T USD) के सापेक्ष दोनों अर्थव्यवस्थाओं की तुलनात्मक हिस्सेदारी',
    pieTitleTrade: 'विदेशी व्यापार संरचना एवं आयात-निर्यात प्रवाह',
    pieSubtitleTrade: 'कुल अंतरराष्ट्रीय व्यापार में निर्यात और आयात का प्रतिशत वितरण',
    pieTitleFiscal: 'सार्वजनिक ऋण संरचना एवं राजकोषीय सुरक्षा गुंजाइश',
    pieSubtitleFiscal: 'जीडीपी के अनुपात में सरकारी ऋण भार बनाम संप्रभु ऋण लेने की सुरक्षित सीमा',
    piePartyA: 'पक्ष A',
    piePartyB: 'पक्ष B',
    pieTableTitle: 'संरचनात्मक हिस्सेदारी एवं विचरण विश्लेषण तालिका',
    pieTableSubtitle: 'दोनों अर्थव्यवस्थाओं के बीच प्रतिशत अंक अंतर (Percentage Point Delta) का तुलनात्मक विवरण',
    pieColCategory: 'घटक श्रेणी',
    pieColDelta: 'डेल्टा अंतर (A बनाम B)',
    pieEquivalentShare: 'समान हिस्सेदारी (0.0%)',
    pieHigher: 'अधिक',
    pieTooltipShare: 'प्रतिशत हिस्सेदारी:',
    pieTooltipAbs: 'निरपेक्ष मूल्य:',
    pieTooltipDelta: 'तुलनात्मक अंतर:',

    barCohortTop10: 'विश्व के शीर्ष 10',
    barCohortG7: 'G7 समूह',
    barCohortAsiaPacific: 'एशिया-प्रशांत',
    barCohortEurope: 'यूरोप',
    barCohortAmericas: 'अमेरिका महाद्वीप',
    barCohortSubnational: 'राज्य एवं प्रांत',
    barCohortCustom: 'कस्टम चयन',
    barSortDesc: 'उच्चतम से निम्नतम',
    barSortAsc: 'निम्नतम से उच्चतम',
    barSortDefault: 'डिफ़ॉल्ट क्रम',
    barHorizontal: 'क्षैतिज बार (Horizontal)',
    barVertical: 'ऊर्ध्वाधर स्तंभ (Vertical)',
    barCohortAvg: 'समूह औसत',
    barCohortMedian: 'समूह माध्यिका',
    barHoverInstruction: 'विस्तृत डेटा बिंदु देखने के लिए बार पर कर्सर ले जाएं',

    vs: 'बनाम',
    swapEntities: 'स्थान बदलें',
    compareButton: 'तुलना करें',
    nominalGdp: 'नाममात्र जीडीपी',
    gdpPerCapita: 'प्रति व्यक्ति जीडीपी',
    growthRate: 'वार्षिक विकास दर',
    inflation: 'मुद्रास्फीति दर (CPI)',
    unemployment: 'बेरोजगारी दर',
    publicDebt: 'सार्वजनिक ऋण / जीडीपी',
    population: 'कुल जनसंख्या',
    hdi: 'मानव विकास सूचकांक (HDI)',
    rank: 'वैश्विक रैंक',
    sovereignCountry: 'संप्रभु राष्ट्र',
    subnationalRegion: 'स्थानीय राज्य/क्षेत्र',
  },
};
