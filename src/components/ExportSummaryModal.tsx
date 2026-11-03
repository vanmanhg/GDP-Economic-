import { useState, useCallback, useMemo } from 'react';
import {
  X,
  Copy,
  Check,
  FileText,
  Table,
  FileSpreadsheet,
  FileDown,
  Printer,
  Sparkles,
  Layers,
  CheckCircle2,
  Loader2,
  Download,
  Code,
  FileCode,
} from 'lucide-react';
import { EconomicEntity } from '../types';
import { formatCurrency } from '../utils/formatters';
import { generatePdfComparisonReport } from '../utils/pdfGenerator';

interface ExportSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityA: EconomicEntity;
  entityB: EconomicEntity;
  onOpenGoogleSheets?: () => void;
  selectedIndicatorIds?: string[];
}

export function ExportSummaryModal({
  isOpen,
  onClose,
  entityA,
  entityB,
  onOpenGoogleSheets,
  selectedIndicatorIds,
}: ExportSummaryModalProps) {
  const [format, setFormat] = useState<'pdf' | 'csv' | 'markdown' | 'tsv'>('pdf');
  const [csvViewMode, setCsvViewMode] = useState<'table' | 'raw'>('table');
  const [copied, setCopied] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfDownloaded, setPdfDownloaded] = useState(false);
  const [csvDownloaded, setCsvDownloaded] = useState(false);

  const isSelected = useCallback(
    (id: string) => !selectedIndicatorIds || selectedIndicatorIds.includes(id),
    [selectedIndicatorIds]
  );

  const rawRows: Array<{
    id: string;
    name: string;
    valA: string;
    valB: string;
    advantage: string;
    tsvValA: string | number;
    tsvValB: string | number;
    isLeadA: boolean;
    isLeadB: boolean;
  }> = [
    {
      id: 'nominal-gdp',
      name: 'Nominal GDP',
      valA: formatCurrency(entityA.nominalGdp),
      valB: formatCurrency(entityB.nominalGdp),
      advantage:
        entityA.nominalGdp >= entityB.nominalGdp
          ? `${entityA.shortName} (+${(entityA.nominalGdp - entityB.nominalGdp).toLocaleString()}B)`
          : `${entityB.shortName} (+${(entityB.nominalGdp - entityA.nominalGdp).toLocaleString()}B)`,
      tsvValA: entityA.nominalGdp,
      tsvValB: entityB.nominalGdp,
      isLeadA: entityA.nominalGdp > entityB.nominalGdp,
      isLeadB: entityB.nominalGdp > entityA.nominalGdp,
    },
    {
      id: 'ppp-gdp',
      name: 'GDP (PPP)',
      valA: `$${entityA.gdpPpp.toLocaleString()}B`,
      valB: `$${entityB.gdpPpp.toLocaleString()}B`,
      advantage: entityA.gdpPpp >= entityB.gdpPpp ? `${entityA.shortName}` : `${entityB.shortName}`,
      tsvValA: entityA.gdpPpp,
      tsvValB: entityB.gdpPpp,
      isLeadA: entityA.gdpPpp > entityB.gdpPpp,
      isLeadB: entityB.gdpPpp > entityA.gdpPpp,
    },
    {
      id: 'global-rank',
      name: 'Global Rank (Equiv.)',
      valA: `#${entityA.globalGdpRank}`,
      valB: `#${entityB.globalGdpRank}`,
      advantage: entityA.globalGdpRank <= entityB.globalGdpRank ? `${entityA.shortName}` : `${entityB.shortName}`,
      tsvValA: `#${entityA.globalGdpRank}`,
      tsvValB: `#${entityB.globalGdpRank}`,
      isLeadA: entityA.globalGdpRank < entityB.globalGdpRank,
      isLeadB: entityB.globalGdpRank < entityA.globalGdpRank,
    },
    {
      id: 'gdp-per-capita-nominal',
      name: 'GDP Per Capita (Nominal)',
      valA: `$${entityA.gdpPerCapitaNominal.toLocaleString()}`,
      valB: `$${entityB.gdpPerCapitaNominal.toLocaleString()}`,
      advantage:
        entityA.gdpPerCapitaNominal >= entityB.gdpPerCapitaNominal
          ? `${entityA.shortName} (+$${(entityA.gdpPerCapitaNominal - entityB.gdpPerCapitaNominal).toLocaleString()})`
          : `${entityB.shortName} (+$${(entityB.gdpPerCapitaNominal - entityA.gdpPerCapitaNominal).toLocaleString()})`,
      tsvValA: entityA.gdpPerCapitaNominal,
      tsvValB: entityB.gdpPerCapitaNominal,
      isLeadA: entityA.gdpPerCapitaNominal > entityB.gdpPerCapitaNominal,
      isLeadB: entityB.gdpPerCapitaNominal > entityA.gdpPerCapitaNominal,
    },
    {
      id: 'gdp-per-capita-ppp',
      name: 'GDP Per Capita (PPP)',
      valA: `$${entityA.gdpPerCapitaPpp.toLocaleString()}`,
      valB: `$${entityB.gdpPerCapitaPpp.toLocaleString()}`,
      advantage: entityA.gdpPerCapitaPpp >= entityB.gdpPerCapitaPpp ? `${entityA.shortName}` : `${entityB.shortName}`,
      tsvValA: entityA.gdpPerCapitaPpp,
      tsvValB: entityB.gdpPerCapitaPpp,
      isLeadA: entityA.gdpPerCapitaPpp > entityB.gdpPerCapitaPpp,
      isLeadB: entityB.gdpPerCapitaPpp > entityA.gdpPerCapitaPpp,
    },
    {
      id: 'population',
      name: 'Population',
      valA: `${entityA.population}M`,
      valB: `${entityB.population}M`,
      advantage: entityA.population >= entityB.population ? `${entityA.shortName}` : `${entityB.shortName}`,
      tsvValA: entityA.population,
      tsvValB: entityB.population,
      isLeadA: entityA.population > entityB.population,
      isLeadB: entityB.population > entityA.population,
    },
    {
      id: 'growth-rate',
      name: 'Real GDP Growth Rate',
      valA: `+${entityA.gdpGrowthRate}%`,
      valB: `+${entityB.gdpGrowthRate}%`,
      advantage: `${(entityA.gdpGrowthRate - entityB.gdpGrowthRate).toFixed(1)}%`,
      tsvValA: entityA.gdpGrowthRate,
      tsvValB: entityB.gdpGrowthRate,
      isLeadA: entityA.gdpGrowthRate > entityB.gdpGrowthRate,
      isLeadB: entityB.gdpGrowthRate > entityA.gdpGrowthRate,
    },
    {
      id: 'inflation-rate',
      name: 'Inflation Rate (CPI YoY)',
      valA: `${entityA.inflationRate}%`,
      valB: `${entityB.inflationRate}%`,
      advantage: entityA.inflationRate <= entityB.inflationRate ? `${entityA.shortName}` : `${entityB.shortName}`,
      tsvValA: entityA.inflationRate,
      tsvValB: entityB.inflationRate,
      isLeadA: entityA.inflationRate < entityB.inflationRate,
      isLeadB: entityB.inflationRate < entityA.inflationRate,
    },
    {
      id: 'unemployment-rate',
      name: 'Unemployment Rate',
      valA: `${entityA.unemploymentRate}%`,
      valB: `${entityB.unemploymentRate}%`,
      advantage: entityA.unemploymentRate <= entityB.unemploymentRate ? `${entityA.shortName}` : `${entityB.shortName}`,
      tsvValA: entityA.unemploymentRate,
      tsvValB: entityB.unemploymentRate,
      isLeadA: entityA.unemploymentRate < entityB.unemploymentRate,
      isLeadB: entityB.unemploymentRate < entityA.unemploymentRate,
    },
    {
      id: 'public-debt',
      name: 'Public Debt-to-GDP',
      valA: `${entityA.publicDebtToGdp}%`,
      valB: `${entityB.publicDebtToGdp}%`,
      advantage: entityA.publicDebtToGdp <= entityB.publicDebtToGdp ? `${entityA.shortName}` : `${entityB.shortName}`,
      tsvValA: entityA.publicDebtToGdp,
      tsvValB: entityB.publicDebtToGdp,
      isLeadA: entityA.publicDebtToGdp < entityB.publicDebtToGdp,
      isLeadB: entityB.publicDebtToGdp < entityA.publicDebtToGdp,
    },
    {
      id: 'trade-balance',
      name: 'Trade Balance',
      valA: entityA.tradeBalance !== undefined ? `${entityA.tradeBalance >= 0 ? '+' : ''}$${entityA.tradeBalance}B` : 'N/A',
      valB: entityB.tradeBalance !== undefined ? `${entityB.tradeBalance >= 0 ? '+' : ''}$${entityB.tradeBalance}B` : 'N/A',
      advantage: (entityA.tradeBalance ?? 0) >= (entityB.tradeBalance ?? 0) ? `${entityA.shortName}` : `${entityB.shortName}`,
      tsvValA: entityA.tradeBalance ?? 0,
      tsvValB: entityB.tradeBalance ?? 0,
      isLeadA: (entityA.tradeBalance ?? 0) > (entityB.tradeBalance ?? 0),
      isLeadB: (entityB.tradeBalance ?? 0) > (entityA.tradeBalance ?? 0),
    },
    {
      id: 'exports',
      name: 'Gross Exports',
      valA: entityA.exports !== undefined ? `$${entityA.exports}B` : 'N/A',
      valB: entityB.exports !== undefined ? `$${entityB.exports}B` : 'N/A',
      advantage: (entityA.exports ?? 0) >= (entityB.exports ?? 0) ? `${entityA.shortName}` : `${entityB.shortName}`,
      tsvValA: entityA.exports ?? 0,
      tsvValB: entityB.exports ?? 0,
      isLeadA: (entityA.exports ?? 0) > (entityB.exports ?? 0),
      isLeadB: (entityB.exports ?? 0) > (entityA.exports ?? 0),
    },
    {
      id: 'imports',
      name: 'Gross Imports',
      valA: entityA.imports !== undefined ? `$${entityA.imports}B` : 'N/A',
      valB: entityB.imports !== undefined ? `$${entityB.imports}B` : 'N/A',
      advantage: (entityA.imports ?? 0) >= (entityB.imports ?? 0) ? `${entityA.shortName}` : `${entityB.shortName}`,
      tsvValA: entityA.imports ?? 0,
      tsvValB: entityB.imports ?? 0,
      isLeadA: (entityA.imports ?? 0) > (entityB.imports ?? 0),
      isLeadB: (entityB.imports ?? 0) > (entityA.imports ?? 0),
    },
    {
      id: 'services-share',
      name: 'Services Share (%)',
      valA: `${entityA.sectorShare.services.toFixed(1)}%`,
      valB: `${entityB.sectorShare.services.toFixed(1)}%`,
      advantage: entityA.sectorShare.services >= entityB.sectorShare.services ? `${entityA.shortName}` : `${entityB.shortName}`,
      tsvValA: entityA.sectorShare.services,
      tsvValB: entityB.sectorShare.services,
      isLeadA: entityA.sectorShare.services > entityB.sectorShare.services,
      isLeadB: entityB.sectorShare.services > entityA.sectorShare.services,
    },
    {
      id: 'industry-share',
      name: 'Industry Share (%)',
      valA: `${entityA.sectorShare.industry.toFixed(1)}%`,
      valB: `${entityB.sectorShare.industry.toFixed(1)}%`,
      advantage: entityA.sectorShare.industry >= entityB.sectorShare.industry ? `${entityA.shortName}` : `${entityB.shortName}`,
      tsvValA: entityA.sectorShare.industry,
      tsvValB: entityB.sectorShare.industry,
      isLeadA: entityA.sectorShare.industry > entityB.sectorShare.industry,
      isLeadB: entityB.sectorShare.industry > entityA.sectorShare.industry,
    },
    {
      id: 'agriculture-share',
      name: 'Agriculture Share (%)',
      valA: `${entityA.sectorShare.agriculture.toFixed(1)}%`,
      valB: `${entityB.sectorShare.agriculture.toFixed(1)}%`,
      advantage: entityA.sectorShare.agriculture >= entityB.sectorShare.agriculture ? `${entityA.shortName}` : `${entityB.shortName}`,
      tsvValA: entityA.sectorShare.agriculture,
      tsvValB: entityB.sectorShare.agriculture,
      isLeadA: entityA.sectorShare.agriculture > entityB.sectorShare.agriculture,
      isLeadB: entityB.sectorShare.agriculture > entityA.sectorShare.agriculture,
    },
    {
      id: 'tech-finance-share',
      name: 'Tech & Finance Intensity (%)',
      valA: entityA.sectorShare.techAndFinance !== undefined ? `${entityA.sectorShare.techAndFinance.toFixed(1)}%` : 'N/A',
      valB: entityB.sectorShare.techAndFinance !== undefined ? `${entityB.sectorShare.techAndFinance.toFixed(1)}%` : 'N/A',
      advantage: (entityA.sectorShare.techAndFinance ?? 0) >= (entityB.sectorShare.techAndFinance ?? 0) ? `${entityA.shortName}` : `${entityB.shortName}`,
      tsvValA: entityA.sectorShare.techAndFinance ?? 0,
      tsvValB: entityB.sectorShare.techAndFinance ?? 0,
      isLeadA: (entityA.sectorShare.techAndFinance ?? 0) > (entityB.sectorShare.techAndFinance ?? 0),
      isLeadB: (entityB.sectorShare.techAndFinance ?? 0) > (entityA.sectorShare.techAndFinance ?? 0),
    },
    {
      id: 'hdi',
      name: 'Human Development (HDI)',
      valA: entityA.hdi.toFixed(3),
      valB: entityB.hdi.toFixed(3),
      advantage: entityA.hdi >= entityB.hdi ? `${entityA.shortName}` : `${entityB.shortName}`,
      tsvValA: entityA.hdi,
      tsvValB: entityB.hdi,
      isLeadA: entityA.hdi > entityB.hdi,
      isLeadB: entityB.hdi > entityA.hdi,
    },
  ];

  const filteredRows = rawRows.filter((r) => isSelected(r.id));

  const handleExportPdf = () => {
    try {
      setIsGeneratingPdf(true);
      setTimeout(() => {
        generatePdfComparisonReport({
          entityA,
          entityB,
          rows: filteredRows.map((r) => ({
            id: r.id,
            name: r.name,
            valA: r.valA,
            valB: r.valB,
            advantage: r.advantage,
            isLeadA: r.isLeadA,
            isLeadB: r.isLeadB,
          })),
          selectedCount: filteredRows.length,
          totalCount: rawRows.length,
        });
        setIsGeneratingPdf(false);
        setPdfDownloaded(true);
        setTimeout(() => setPdfDownloaded(false), 3000);
      }, 150);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      setIsGeneratingPdf(false);
    }
  };

  const csvContent = useMemo(() => {
    const escapeCsv = (val: string | number | undefined) => {
      const s = String(val ?? '');
      if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };

    const headers = [
      'Indicator ID',
      'Indicator Name',
      `${entityA.name} (${entityA.type === 'region' ? 'Region' : 'Nation'})`,
      `${entityB.name} (${entityB.type === 'region' ? 'Region' : 'Nation'})`,
      `${entityA.shortName} Raw Numeric`,
      `${entityB.shortName} Raw Numeric`,
      'Advantage / Leader',
      'Comparative Lead State',
    ];

    const dataRows = filteredRows.map((r) => [
      escapeCsv(r.id),
      escapeCsv(r.name),
      escapeCsv(r.valA),
      escapeCsv(r.valB),
      escapeCsv(r.tsvValA),
      escapeCsv(r.tsvValB),
      escapeCsv(r.advantage),
      escapeCsv(r.isLeadA ? `${entityA.shortName} Lead` : r.isLeadB ? `${entityB.shortName} Lead` : 'Parity / Equal'),
    ].join(','));

    const metadataRows = [
      `# Macroeconomic Comparison Report: ${entityA.name} vs. ${entityB.name}`,
      `# Export Date: ${new Date().toISOString().split('T')[0]}`,
      `# Denomination Baseline: Standardized Global USD (USD)`,
      `# Filtered Active Indicators: ${filteredRows.length} of ${rawRows.length}`,
      `# Data Sources: World Bank, IMF World Economic Outlook, OECD, National Statistical Bureaus`,
      '',
    ];

    return '\uFEFF' + [...metadataRows, headers.map(escapeCsv).join(','), ...dataRows].join('\r\n');
  }, [filteredRows, rawRows.length, entityA, entityB]);

  const handleExportCsv = () => {
    try {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const cleanA = entityA.shortName.replace(/[^a-zA-Z0-9]/g, '_');
      const cleanB = entityB.shortName.replace(/[^a-zA-Z0-9]/g, '_');
      const dateStr = new Date().toISOString().split('T')[0];
      link.setAttribute('href', url);
      link.setAttribute('download', `Comparison_${cleanA}_vs_${cleanB}_${dateStr}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setCsvDownloaded(true);
      setTimeout(() => setCsvDownloaded(false), 3000);
    } catch (err) {
      console.error('Failed to export CSV:', err);
    }
  };

  const markdownContent = `# Macroeconomic Comparison: ${entityA.name} vs. ${entityB.name}
Generated: ${new Date().toISOString().split('T')[0]}

| Indicator | ${entityA.name} (${entityA.type === 'region' ? 'Region' : 'Nation'}) | ${entityB.name} (${entityB.type === 'region' ? 'Region' : 'Nation'}) | Difference / Advantage |
|---|---|---|---|
${filteredRows.map((r) => `| **${r.name}** | ${r.valA} | ${r.valB} | ${r.advantage} |`).join('\n')}
| **Core Industries** | ${entityA.topIndustries.join(', ')} | ${entityB.topIndustries.join(', ')} | - |

### Executive Summary:
${entityA.name} has a nominal GDP of ${formatCurrency(entityA.nominalGdp)}, while ${entityB.name} recorded ${formatCurrency(entityB.nominalGdp)}. The GDP per capita of ${entityA.name} is $${entityA.gdpPerCapitaNominal.toLocaleString()} versus $${entityB.gdpPerCapitaNominal.toLocaleString()} for ${entityB.name}.
`;

  const tsvContent = `Indicator\t${entityA.name}\t${entityB.name}
${filteredRows.map((r) => `${r.name}\t${r.tsvValA}\t${r.tsvValB}`).join('\n')}
`;

  const activeText =
    format === 'markdown' ? markdownContent : format === 'tsv' ? tsvContent : csvContent;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(activeText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div
      id="export-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <div
        id="export-summary-modal"
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[88vh] animate-in fade-in zoom-in-95 duration-150 transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <FileDown className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Export Macroeconomic Comparison Report
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Toggle between executive printable PDF report and calculation-ready CSV spreadsheet data for {entityA.shortName} vs. {entityB.shortName}.
              </p>
            </div>
          </div>
          <button
            id="close-export-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Format Selector Bar: Prominent PDF vs CSV Toggle */}
        <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5 bg-white dark:bg-slate-900 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Primary Toggle: PDF vs CSV */}
            <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
              {/* PDF Document Tab */}
              <button
                id="format-pdf-tab"
                onClick={() => setFormat('pdf')}
                className={`px-3 py-1.5 rounded-md font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                  format === 'pdf'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-700/50'
                }`}
                title="Executive printable PDF report with badges and layout styling"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>PDF Document (.pdf)</span>
              </button>

              {/* CSV Spreadsheet Tab */}
              <button
                id="format-csv-tab"
                onClick={() => setFormat('csv')}
                className={`px-3 py-1.5 rounded-md font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                  format === 'csv'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-700/50'
                }`}
                title="Spreadsheet data with raw numeric values for Excel, Sheets, & Python"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>CSV Spreadsheet (.csv)</span>
              </button>
            </div>

            {/* Secondary Text Formats Divider & Tabs */}
            <div className="flex items-center space-x-1 text-slate-400 dark:text-slate-600">
              <span className="text-xs px-1 text-slate-300 dark:text-slate-700">|</span>
              {/* Markdown Tab */}
              <button
                id="format-markdown-tab"
                onClick={() => setFormat('markdown')}
                className={`px-2.5 py-1.5 rounded-md font-medium text-xs flex items-center space-x-1 transition-colors cursor-pointer ${
                  format === 'markdown'
                    ? 'bg-slate-800 dark:bg-slate-700 text-white font-semibold'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <FileText className="w-3 h-3" />
                <span>Markdown</span>
              </button>

              {/* TSV Tab */}
              <button
                id="format-tsv-tab"
                onClick={() => setFormat('tsv')}
                className={`px-2.5 py-1.5 rounded-md font-medium text-xs flex items-center space-x-1 transition-colors cursor-pointer ${
                  format === 'tsv'
                    ? 'bg-slate-800 dark:bg-slate-700 text-white font-semibold'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Table className="w-3 h-3" />
                <span>TSV</span>
              </button>
            </div>
          </div>

          {/* Quick Download / Action Button corresponding to active format */}
          <div className="flex items-center space-x-2">
            {format === 'pdf' ? (
              <button
                id="export-pdf-toolbar-btn"
                onClick={handleExportPdf}
                disabled={isGeneratingPdf}
                className={`px-3 py-1.5 rounded-md font-semibold text-xs flex items-center space-x-1.5 transition-all cursor-pointer ${
                  pdfDownloaded
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-xs'
                }`}
              >
                {isGeneratingPdf ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Rendering PDF...</span>
                  </>
                ) : pdfDownloaded ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>PDF Downloaded!</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF (.pdf)</span>
                  </>
                )}
              </button>
            ) : format === 'csv' ? (
              <button
                id="export-csv-toolbar-btn"
                onClick={handleExportCsv}
                className={`px-3 py-1.5 rounded-md font-semibold text-xs flex items-center space-x-1.5 transition-all cursor-pointer ${
                  csvDownloaded
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs'
                }`}
              >
                {csvDownloaded ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>CSV Downloaded!</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>Download CSV (.csv)</span>
                  </>
                )}
              </button>
            ) : (
              <button
                id="copy-export-text-btn"
                onClick={handleCopy}
                className={`px-3 py-1.5 rounded-md font-semibold text-xs flex items-center space-x-1.5 transition-all cursor-pointer ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-900 dark:bg-indigo-600 text-white hover:bg-slate-800 dark:hover:bg-indigo-500'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Content</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Main Body */}
        {format === 'pdf' ? (
          /* PDF Executive Document Layout & Preview */
          <div className="p-5 bg-slate-50 dark:bg-slate-950 overflow-y-auto flex-1 text-slate-800 dark:text-slate-200">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 space-y-5">
              {/* Report Header Preview */}
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 mb-1">
                  <span className="font-mono uppercase tracking-wider text-[11px] text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1.5">
                    <FileDown className="w-3.5 h-3.5" />
                    A4 PDF Document • Executive Publication Report
                  </span>
                  <span>{new Date().toISOString().split('T')[0]}</span>
                </div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span>{entityA.name}</span>
                  <span className="text-slate-400 dark:text-slate-500 font-normal">vs.</span>
                  <span>{entityB.name}</span>
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Baseline Currency: Standardized Global USD (USD) • Sources: World Bank, IMF WEO, OECD & National Statistical Offices
                </p>
              </div>

              {/* Side-by-Side Executive Summary Preview */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-150 dark:border-slate-700/60">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 block mb-1">
                    Nominal GDP
                  </span>
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    {entityA.shortName}: <span className="text-indigo-600 dark:text-indigo-400 font-bold">{formatCurrency(entityA.nominalGdp)}</span>
                  </p>
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                    {entityB.shortName}: <span className="text-emerald-600 dark:text-emerald-400 font-bold">{formatCurrency(entityB.nominalGdp)}</span>
                  </p>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-150 dark:border-slate-700/60">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 block mb-1">
                    Per Capita
                  </span>
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    {entityA.shortName}: ${Math.round(entityA.gdpPerCapitaNominal).toLocaleString()}
                  </p>
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                    {entityB.shortName}: ${Math.round(entityB.gdpPerCapitaNominal).toLocaleString()}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-150 dark:border-slate-700/60">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 block mb-1">
                    Real Growth
                  </span>
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    {entityA.shortName}: +{entityA.gdpGrowthRate}%
                  </p>
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                    {entityB.shortName}: +{entityB.gdpGrowthRate}%
                  </p>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-150 dark:border-slate-700/60">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 block mb-1">
                    Population & Debt
                  </span>
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    {entityA.shortName}: {entityA.population}M ({entityA.publicDebtToGdp}%)
                  </p>
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                    {entityB.shortName}: {entityB.population}M ({entityB.publicDebtToGdp}%)
                  </p>
                </div>
              </div>

              {/* Active Indicators Filter Notice */}
              <div className="flex items-center justify-between bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 rounded-lg p-3 text-xs">
                <div className="flex items-center space-x-2 text-indigo-900 dark:text-indigo-200">
                  <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span>
                    Report will include <strong>{filteredRows.length}</strong> active indicators out of {rawRows.length} total benchmarks.
                  </span>
                </div>
                <span className="text-[11px] text-indigo-700 dark:text-indigo-300 font-semibold bg-indigo-100 dark:bg-indigo-900/80 px-2 py-0.5 rounded">
                  Leader Highlights Included
                </span>
              </div>

              {/* Sample Table Snapshot */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                    <tr>
                      <th className="py-2 px-3">Indicator</th>
                      <th className="py-2 px-3">{entityA.shortName}</th>
                      <th className="py-2 px-3">{entityB.shortName}</th>
                      <th className="py-2 px-3">Advantage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                    {filteredRows.slice(0, 5).map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-1.5 px-3 font-sans font-medium text-slate-800 dark:text-slate-200">
                          {r.name}
                        </td>
                        <td className={`py-1.5 px-3 ${r.isLeadA ? 'text-indigo-600 dark:text-indigo-400 font-bold' : ''}`}>
                          {r.valA}
                        </td>
                        <td className={`py-1.5 px-3 ${r.isLeadB ? 'text-emerald-600 dark:text-emerald-400 font-bold' : ''}`}>
                          {r.valB}
                        </td>
                        <td className="py-1.5 px-3 text-slate-500 dark:text-slate-400 font-sans text-[10px]">
                          {r.advantage}
                        </td>
                      </tr>
                    ))}
                    {filteredRows.length > 5 && (
                      <tr className="bg-slate-50/50 dark:bg-slate-850/50">
                        <td colSpan={4} className="py-1.5 px-3 text-center text-slate-400 dark:text-slate-500 font-sans italic">
                          + {filteredRows.length - 5} more active indicators rendered in the full PDF report
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Action Banner inside PDF Preview */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
                  <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>Formatted for executive briefings, board presentations, and printed handouts.</span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    id="print-browser-btn"
                    onClick={handlePrint}
                    className="px-3 py-2 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center space-x-1.5 transition-colors cursor-pointer"
                    title="Print directly using browser print dialog"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print</span>
                  </button>

                  <button
                    id="export-pdf-main-btn"
                    onClick={handleExportPdf}
                    disabled={isGeneratingPdf}
                    className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center space-x-2 transition-all shadow-xs cursor-pointer ${
                      pdfDownloaded
                        ? 'bg-emerald-600 text-white'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-98'
                    }`}
                  >
                    {isGeneratingPdf ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Generating PDF...</span>
                      </>
                    ) : pdfDownloaded ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Report Saved!</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        <span>Export to PDF</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : format === 'csv' ? (
          /* CSV Spreadsheet Utility View */
          <div className="p-5 bg-slate-50 dark:bg-slate-950 overflow-y-auto flex-1 text-slate-800 dark:text-slate-200 space-y-4">
            {/* CSV Specification and Utility Controls */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs p-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono uppercase tracking-wider text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      RFC 4180 CSV Spreadsheet • Calculation-Ready
                    </span>
                    <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded font-mono font-medium">
                      UTF-8 BOM
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Standard comma-separated format compatible with Microsoft Excel, Google Sheets, LibreOffice, Pandas, and R.
                  </p>
                </div>

                {/* Sub-view toggle: Table Preview vs Raw CSV Code */}
                <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
                  <button
                    id="csv-view-mode-table-btn"
                    onClick={() => setCsvViewMode('table')}
                    className={`px-3 py-1.5 rounded-md font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
                      csvViewMode === 'table'
                        ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <Table className="w-3.5 h-3.5" />
                    <span>Table Grid Preview</span>
                  </button>
                  <button
                    id="csv-view-mode-raw-btn"
                    onClick={() => setCsvViewMode('raw')}
                    className={`px-3 py-1.5 rounded-md font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
                      csvViewMode === 'raw'
                        ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <Code className="w-3.5 h-3.5" />
                    <span>Raw CSV Text</span>
                  </button>
                </div>
              </div>

              {/* Utility Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-3">
                <div className="p-2.5 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-lg border border-emerald-100 dark:border-emerald-900/50">
                  <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 block mb-0.5">
                    Data Records
                  </span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {filteredRows.length} Indicators
                  </span>
                </div>
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700/60">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                    Columns Included
                  </span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    8 Data Fields
                  </span>
                </div>
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700/60">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                    Numeric Precision
                  </span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Raw Unrounded Numbers
                  </span>
                </div>
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700/60">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                    Encoding
                  </span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    UTF-8 + Excel BOM
                  </span>
                </div>
              </div>
            </div>

            {/* Content Display: Table Preview or Monospace Raw CSV */}
            {csvViewMode === 'table' ? (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
                <div className="p-3 bg-slate-100/70 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Spreadsheet Preview ({filteredRows.length} rows)
                  </span>
                  <span className="text-slate-400 dark:text-slate-500 text-[11px]">
                    Includes both formatted display and raw numeric calculation columns
                  </span>
                </div>
                <div className="max-h-[380px] overflow-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 sticky top-0 border-b border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                      <tr>
                        <th className="py-2.5 px-3">Indicator ID</th>
                        <th className="py-2.5 px-3">Name</th>
                        <th className="py-2.5 px-3">{entityA.shortName} (Display)</th>
                        <th className="py-2.5 px-3 font-mono">{entityA.shortName} (Raw)</th>
                        <th className="py-2.5 px-3">{entityB.shortName} (Display)</th>
                        <th className="py-2.5 px-3 font-mono">{entityB.shortName} (Raw)</th>
                        <th className="py-2.5 px-3">Advantage</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[11px]">
                      {filteredRows.map((r, idx) => (
                        <tr
                          key={r.id}
                          className={idx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/50 dark:bg-slate-850/50'}
                        >
                          <td className="py-2 px-3 font-mono text-slate-500 dark:text-slate-400">
                            {r.id}
                          </td>
                          <td className="py-2 px-3 font-medium text-slate-800 dark:text-slate-200">
                            {r.name}
                          </td>
                          <td className={`py-2 px-3 font-medium ${r.isLeadA ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-700 dark:text-slate-300'}`}>
                            {r.valA}
                          </td>
                          <td className="py-2 px-3 font-mono text-slate-500 dark:text-slate-400">
                            {r.tsvValA}
                          </td>
                          <td className={`py-2 px-3 font-medium ${r.isLeadB ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-700 dark:text-slate-300'}`}>
                            {r.valB}
                          </td>
                          <td className="py-2 px-3 font-mono text-slate-500 dark:text-slate-400">
                            {r.tsvValB}
                          </td>
                          <td className="py-2 px-3 text-slate-600 dark:text-slate-400">
                            {r.advantage}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 font-mono text-xs text-slate-200 leading-relaxed overflow-x-auto max-h-[380px] select-all">
                <pre>{csvContent}</pre>
              </div>
            )}

            {/* CSV Utility Card & Action Bar */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center space-x-2 text-xs text-slate-600 dark:text-slate-400">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>
                  Immediate ingestion in Excel, Google Sheets, PowerBI, Tableau, and Jupyter Notebooks.
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  id="copy-csv-content-btn"
                  onClick={handleCopy}
                  className="px-3 py-2 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center space-x-1.5 transition-colors cursor-pointer"
                  title="Copy CSV content to clipboard"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy CSV</span>
                    </>
                  )}
                </button>

                <button
                  id="download-csv-main-btn"
                  onClick={handleExportCsv}
                  className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center space-x-2 transition-all shadow-xs cursor-pointer ${
                    csvDownloaded
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-98'
                  }`}
                >
                  {csvDownloaded ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>CSV Saved!</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Download CSV (.csv)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Text / Code Preview for Markdown and TSV */
          <div className="p-4 bg-slate-900 dark:bg-slate-950 overflow-y-auto flex-1 font-mono text-xs text-slate-200 leading-relaxed whitespace-pre select-all">
            {activeText}
          </div>
        )}

        {/* Footer: Multi-Utility Download Center */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-850 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {onOpenGoogleSheets && (
              <button
                id="export-to-google-sheets-btn"
                onClick={() => {
                  onClose();
                  onOpenGoogleSheets();
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center space-x-1.5 transition-colors shadow-2xs cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Google Sheets...</span>
              </button>
            )}

            {/* Direct CSV Download Utility in Footer */}
            <button
              id="export-csv-footer-btn"
              onClick={handleExportCsv}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-2xs cursor-pointer ${
                csvDownloaded
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 dark:bg-emerald-950/70 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              }`}
              title="Download CSV spreadsheet file with raw numeric data"
            >
              {csvDownloaded ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>CSV Downloaded</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Download CSV (.csv)</span>
                </>
              )}
            </button>

            {/* Direct PDF Download Utility in Footer */}
            <button
              id="export-pdf-footer-btn"
              onClick={handleExportPdf}
              disabled={isGeneratingPdf}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-2xs cursor-pointer ${
                pdfDownloaded
                  ? 'bg-emerald-600 text-white'
                  : 'bg-indigo-50 dark:bg-indigo-950/70 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
              }`}
              title="Generate and download A4 executive publication PDF"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600 dark:text-indigo-400" />
                  <span>Generating PDF...</span>
                </>
              ) : pdfDownloaded ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>PDF Downloaded</span>
                </>
              ) : (
                <>
                  <FileDown className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Export to PDF</span>
                </>
              )}
            </button>
          </div>

          <button
            id="done-export-modal-btn"
            onClick={onClose}
            className="px-4 py-1.5 rounded-md text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-2xs ml-auto cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
