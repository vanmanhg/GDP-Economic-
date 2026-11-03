import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  X,
  Coins,
  ArrowRightLeft,
  RefreshCw,
  TrendingUp,
  DollarSign,
  Globe2,
  Check,
  Copy,
  Info,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { EconomicEntity } from '../types';
import { CURRENCY_REGISTRY, getCurrencyInfo, formatLargeAmount } from '../utils/currency';

interface CurrencyConverterModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityA: EconomicEntity;
  entityB: EconomicEntity;
}

const POPULAR_CURRENCIES = [
  'USD',
  'EUR',
  'GBP',
  'JPY',
  'CNY',
  'INR',
  'CAD',
  'AUD',
  'CHF',
  'KRW',
  'BRL',
  'SGD',
];

export function CurrencyConverterModal({
  isOpen,
  onClose,
  entityA,
  entityB,
}: CurrencyConverterModalProps) {
  const [rates, setRates] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    for (const [code, info] of Object.entries(CURRENCY_REGISTRY)) {
      initial[code] = info.rateVsUsd;
    }
    return initial;
  });

  const [fromCode, setFromCode] = useState<string>(() => entityA.currency || 'USD');
  const [toCode, setToCode] = useState<string>(() => entityB.currency || 'EUR');
  const [amountStr, setAmountStr] = useState<string>('1000');
  const [isLoadingRates, setIsLoadingRates] = useState<boolean>(false);
  const [ratesSource, setRatesSource] = useState<string>('live_api');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Sync default currencies when entities change or modal opens
  useEffect(() => {
    if (isOpen) {
      if (entityA.currency) setFromCode(entityA.currency);
      if (entityB.currency && entityB.currency !== entityA.currency) {
        setToCode(entityB.currency);
      } else if (entityA.currency === 'USD') {
        setToCode('EUR');
      } else {
        setToCode('USD');
      }
    }
  }, [isOpen, entityA.currency, entityB.currency]);

  // Fetch live exchange rates from the API
  const fetchLiveRates = useCallback(async () => {
    setIsLoadingRates(true);
    try {
      const res = await fetch('/api/forex/rates');
      if (res.ok) {
        const data = await res.json();
        if (data && data.rates) {
          setRates((prev) => ({ ...prev, ...data.rates }));
          setRatesSource(data.source || 'live_api');
          setLastUpdated(
            new Date(data.timestamp || Date.now()).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })
          );
        }
      }
    } catch (err) {
      console.warn('Failed to fetch live FX rates, using benchmark registry:', err);
    } finally {
      setIsLoadingRates(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchLiveRates();
    }
  }, [isOpen, fetchLiveRates]);

  if (!isOpen) return null;

  const numericAmount = parseFloat(amountStr) || 0;

  // Rate calculation (via USD cross-rate: rateFromUSD_to / rateFromUSD_from)
  const rateFrom = rates[fromCode] || 1.0;
  const rateTo = rates[toCode] || 1.0;
  const directExchangeRate = rateTo / rateFrom;
  const inverseExchangeRate = rateFrom / rateTo;
  const convertedAmount = numericAmount * directExchangeRate;

  const infoFrom = getCurrencyInfo(fromCode);
  const infoTo = getCurrencyInfo(toCode);

  const handleSwap = () => {
    setFromCode(toCode);
    setToCode(fromCode);
  };

  const handleCopy = async () => {
    try {
      const text = `${numericAmount.toLocaleString()} ${fromCode} = ${convertedAmount.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} ${toCode} (Rate: 1 ${fromCode} = ${directExchangeRate.toFixed(4)} ${toCode})`;
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (_e) {
      // ignore
    }
  };

  return (
    <div
      id="currency-converter-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        id="currency-converter-modal"
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150 transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20 shadow-2xs">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Real-Time Currency Converter
                </h3>
                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>{ratesSource === 'open_er_api_live' ? 'Live API Feed' : 'Real-Time FX'}</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Convert on the fly between {entityA.shortName} ({entityA.currency}), {entityB.shortName} ({entityB.currency}), and global legal tender.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              id="refresh-rates-btn"
              onClick={fetchLiveRates}
              disabled={isLoadingRates}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Refresh live foreign exchange rates"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingRates ? 'animate-spin text-indigo-600 dark:text-indigo-400' : ''}`} />
            </button>
            <button
              id="close-currency-converter-btn"
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* Main Converter Form */}
          <div className="bg-slate-50 dark:bg-slate-850/80 rounded-xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-7 gap-3 items-center">
              {/* From Input & Currency */}
              <div className="md:col-span-3 space-y-1.5">
                <label className="text-2xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Amount & Origin Currency
                </label>
                <div className="flex rounded-lg shadow-2xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500">
                  <span className="px-3 py-2 text-xs font-mono font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 flex items-center border-r border-slate-200 dark:border-slate-700">
                    {infoFrom.symbol}
                  </span>
                  <input
                    type="number"
                    value={amountStr}
                    onChange={(e) => setAmountStr(e.target.value)}
                    placeholder="Enter amount"
                    min="0"
                    step="any"
                    className="w-full px-3 py-2 text-sm font-semibold text-slate-900 dark:text-slate-100 bg-transparent focus:outline-hidden"
                  />
                  <select
                    value={fromCode}
                    onChange={(e) => setFromCode(e.target.value)}
                    className="px-2 py-2 text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-slate-100 dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 cursor-pointer focus:outline-hidden"
                  >
                    {Object.keys(CURRENCY_REGISTRY).map((code) => {
                      const c = CURRENCY_REGISTRY[code];
                      return (
                        <option key={code} value={code}>
                          {c.code} - {c.name} ({c.symbol})
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {/* Swap Button */}
              <div className="md:col-span-1 flex justify-center py-1 md:py-0">
                <button
                  type="button"
                  id="swap-currencies-btn"
                  onClick={handleSwap}
                  className="w-9 h-9 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-indigo-600 dark:text-indigo-400 flex items-center justify-center transition-transform hover:scale-110 active:scale-95 shadow-2xs cursor-pointer"
                  title="Swap origin and target currencies"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                </button>
              </div>

              {/* To Currency */}
              <div className="md:col-span-3 space-y-1.5">
                <label className="text-2xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Converted Currency
                </label>
                <div className="flex rounded-lg shadow-2xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
                  <span className="px-3 py-2 text-xs font-mono font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 flex items-center border-r border-slate-200 dark:border-slate-700">
                    {infoTo.symbol}
                  </span>
                  <div className="w-full px-3 py-2 text-sm font-bold text-emerald-600 dark:text-emerald-400 bg-transparent truncate">
                    {convertedAmount.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                  <select
                    value={toCode}
                    onChange={(e) => setToCode(e.target.value)}
                    className="px-2 py-2 text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-slate-100 dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 cursor-pointer focus:outline-hidden"
                  >
                    {Object.keys(CURRENCY_REGISTRY).map((code) => {
                      const c = CURRENCY_REGISTRY[code];
                      return (
                        <option key={code} value={code}>
                          {c.code} - {c.name} ({c.symbol})
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>
            </div>

            {/* Quick Macro Conversion Presets */}
            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 flex flex-wrap items-center gap-1.5 text-2xs">
              <span className="text-slate-400 dark:text-slate-500 font-semibold mr-1">
                Quick Macro Presets:
              </span>
              <button
                type="button"
                onClick={() => setAmountStr('1')}
                className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-300 font-mono transition-colors cursor-pointer"
              >
                1 Unit
              </button>
              <button
                type="button"
                onClick={() => setAmountStr('1000000')}
                className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-300 font-mono transition-colors cursor-pointer"
              >
                1 Million
              </button>
              <button
                type="button"
                onClick={() => {
                  setFromCode(entityA.currency);
                  setToCode(entityB.currency);
                  setAmountStr(String(entityA.gdpPerCapitaNominal));
                }}
                className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 font-medium transition-colors cursor-pointer"
              >
                {entityA.shortName} Per Capita (${entityA.gdpPerCapitaNominal.toLocaleString()})
              </button>
              <button
                type="button"
                onClick={() => {
                  setFromCode(entityB.currency);
                  setToCode(entityA.currency);
                  setAmountStr(String(entityB.gdpPerCapitaNominal));
                }}
                className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 font-medium transition-colors cursor-pointer"
              >
                {entityB.shortName} Per Capita (${entityB.gdpPerCapitaNominal.toLocaleString()})
              </button>
              <button
                type="button"
                onClick={() => {
                  setFromCode('USD');
                  setToCode(entityB.currency);
                  setAmountStr(String(entityA.nominalGdp * 1000000000));
                }}
                className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-300 font-medium transition-colors cursor-pointer"
              >
                {entityA.shortName} GDP (${entityA.nominalGdp}B)
              </button>
            </div>
          </div>

          {/* Prominent Real-Time Rate Card */}
          <div className="p-4 rounded-xl bg-linear-to-r from-indigo-50 via-white to-emerald-50 dark:from-slate-900 dark:via-slate-850 dark:to-slate-900 border border-indigo-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {numericAmount.toLocaleString()} {fromCode} ={' '}
                  <span className="text-emerald-600 dark:text-emerald-400">
                    {infoTo.symbol}
                    {convertedAmount.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{' '}
                    {toCode}
                  </span>
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">
                1 {fromCode} = {directExchangeRate.toFixed(4)} {toCode} • 1 {toCode} ={' '}
                {inverseExchangeRate.toFixed(4)} {fromCode}
              </p>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <button
                type="button"
                onClick={handleCopy}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-2xs cursor-pointer ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Result'}</span>
              </button>
            </div>
          </div>

          {/* Cross-Currency Multi-Converter Grid */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Globe2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Global Reserve & Peer Currency Conversions</span>
              </span>
              <span className="text-2xs text-slate-400 dark:text-slate-500">
                Converting {numericAmount.toLocaleString()} {fromCode}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {POPULAR_CURRENCIES.map((code) => {
                const info = getCurrencyInfo(code);
                const targetRate = rates[code] || 1.0;
                const converted = numericAmount * (targetRate / rateFrom);
                const isSelected = code === toCode;

                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setToCode(code)}
                    className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50/80 dark:bg-indigo-950/70 border-indigo-300 dark:border-indigo-700 ring-1 ring-indigo-500 shadow-2xs'
                        : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-2xs font-bold mb-1">
                      <span className="text-slate-800 dark:text-slate-200 font-mono">
                        {code}
                      </span>
                      <span className="text-slate-400 dark:text-slate-500 font-normal">
                        {info.symbol}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                      {info.symbol}
                      {converted >= 1000000
                        ? `${(converted / 1000000).toFixed(2)}M`
                        : converted.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                    </p>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block truncate">
                      {info.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-850 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-2xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center space-x-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>
              {lastUpdated ? `Live rate synced at ${lastUpdated}` : 'Benchmark exchange rates active'}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-2xs cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
