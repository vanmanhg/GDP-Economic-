/**
 * Currency conversion and formatting utilities for macroeconomic comparisons.
 * Provides benchmark market exchange rates relative to USD (1.0 USD baseline)
 * and formats large economic quantities (Trillions, Billions, Per Capita) into
 * localized or standardized notation.
 */

export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
  rateVsUsd: number; // 1 USD = rateVsUsd in target currency
}

export const CURRENCY_REGISTRY: Record<string, CurrencyInfo> = {
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', rateVsUsd: 1.0 },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', rateVsUsd: 0.92 },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', rateVsUsd: 0.79 },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', rateVsUsd: 152.0 },
  CNY: { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', rateVsUsd: 7.24 },
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', rateVsUsd: 83.5 },
  CAD: { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', rateVsUsd: 1.38 },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', rateVsUsd: 1.52 },
  KRW: { code: 'KRW', symbol: '₩', name: 'South Korean Won', rateVsUsd: 1380.0 },
  BRL: { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', rateVsUsd: 5.65 },
  CHF: { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', rateVsUsd: 0.88 },
  RUB: { code: 'RUB', symbol: '₽', name: 'Russian Ruble', rateVsUsd: 96.0 },
  MXN: { code: 'MXN', symbol: 'MX$', name: 'Mexican Peso', rateVsUsd: 19.8 },
  IDR: { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah', rateVsUsd: 15600.0 },
  SAR: { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal', rateVsUsd: 3.75 },
  TRY: { code: 'TRY', symbol: '₺', name: 'Turkish Lira', rateVsUsd: 34.2 },
  TWD: { code: 'TWD', symbol: 'NT$', name: 'New Taiwan Dollar', rateVsUsd: 32.1 },
  PLN: { code: 'PLN', symbol: 'zł', name: 'Polish Złoty', rateVsUsd: 4.02 },
  SEK: { code: 'SEK', symbol: 'kr', name: 'Swedish Krona', rateVsUsd: 10.6 },
  ARS: { code: 'ARS', symbol: 'AR$', name: 'Argentine Peso', rateVsUsd: 985.0 },
  NOK: { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone', rateVsUsd: 10.9 },
  ILS: { code: 'ILS', symbol: '₪', name: 'Israeli New Shekel', rateVsUsd: 3.74 },
  SGD: { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', rateVsUsd: 1.32 },
  AED: { code: 'AED', symbol: 'AED', name: 'UAE Dirham', rateVsUsd: 3.67 },
  ZAR: { code: 'ZAR', symbol: 'R', name: 'South African Rand', rateVsUsd: 17.6 },
};

/**
 * Returns currency info, falling back gracefully to USD if unrecognized.
 */
export function getCurrencyInfo(currencyCode?: string): CurrencyInfo {
  if (!currencyCode) return CURRENCY_REGISTRY.USD;
  const upper = currencyCode.toUpperCase();
  return CURRENCY_REGISTRY[upper] || {
    code: upper,
    symbol: upper,
    name: upper,
    rateVsUsd: 1.0,
  };
}

/**
 * Converts a USD value to the target currency based on benchmark rates.
 */
export function convertFromUsd(amountUsd: number, targetCurrencyCode: string): number {
  const info = getCurrencyInfo(targetCurrencyCode);
  return amountUsd * info.rateVsUsd;
}

/**
 * Formats a large macro GDP amount (input in Billions USD) into either:
 * - Standardized Global USD (e.g. "$3.50 Trillion" or "$490 Billion")
 * - Native Currency (e.g. "£2.77 Trillion GBP" or "¥624.7 Trillion JPY")
 */
export function formatLargeAmount(
  amountUsdBillions: number,
  currencyCode: string = 'USD',
  options?: { isPpp?: boolean; showCode?: boolean }
): string {
  const { isPpp = false, showCode = false } = options || {};
  const isUsd = currencyCode.toUpperCase() === 'USD';
  const info = getCurrencyInfo(currencyCode);

  if (isUsd) {
    const prefix = isPpp ? 'Int$ ' : '$';
    if (amountUsdBillions >= 1000) {
      return `${prefix}${(amountUsdBillions / 1000).toFixed(2)} Trillion`;
    }
    return `${prefix}${amountUsdBillions.toLocaleString()} Billion`;
  }

  // Converted value in local currency units (Billions of local currency)
  const convertedBillions = amountUsdBillions * info.rateVsUsd;
  const sym = info.symbol;
  const codeSuffix = showCode ? ` ${info.code}` : '';

  // Extremely large denominated currencies (like JPY, KRW, IDR)
  if (convertedBillions >= 1000000) {
    // Quadrillion (1,000 Trillion)
    return `${sym}${(convertedBillions / 1000000).toFixed(2)} Quadrillion${codeSuffix}`;
  }
  if (convertedBillions >= 1000) {
    return `${sym}${(convertedBillions / 1000).toFixed(2)} Trillion${codeSuffix}`;
  }
  if (convertedBillions >= 1) {
    return `${sym}${Math.round(convertedBillions).toLocaleString()} Billion${codeSuffix}`;
  }
  return `${sym}${convertedBillions.toFixed(1)} Billion${codeSuffix}`;
}

/**
 * Formats per capita income / wealth (input in USD)
 */
export function formatPerCapitaAmount(
  amountUsd: number,
  currencyCode: string = 'USD',
  options?: { isPpp?: boolean; showCode?: boolean }
): string {
  const { isPpp = false, showCode = false } = options || {};
  const isUsd = currencyCode.toUpperCase() === 'USD';
  const info = getCurrencyInfo(currencyCode);

  if (isUsd) {
    const prefix = isPpp ? 'Int$ ' : '$';
    return `${prefix}${Math.round(amountUsd).toLocaleString()}`;
  }

  const converted = Math.round(amountUsd * info.rateVsUsd);
  const codeSuffix = showCode ? ` ${info.code}` : '';
  return `${info.symbol}${converted.toLocaleString()}${codeSuffix}`;
}

/**
 * Formats Trade Balance (input in Billions USD)
 */
export function formatTradeBalanceAmount(
  amountUsdBillions: number | undefined,
  currencyCode: string = 'USD'
): string {
  if (amountUsdBillions === undefined) return 'N/A';
  const isUsd = currencyCode.toUpperCase() === 'USD';
  const info = getCurrencyInfo(currencyCode);

  if (isUsd) {
    const sign = amountUsdBillions >= 0 ? '+$' : '-$';
    return `${sign}${Math.abs(amountUsdBillions)}B`;
  }

  const converted = amountUsdBillions * info.rateVsUsd;
  const sign = converted >= 0 ? '+' : '-';
  const abs = Math.abs(converted);

  if (abs >= 1000) {
    return `${sign}${info.symbol}${(abs / 1000).toFixed(2)}T ${info.code}`;
  }
  return `${sign}${info.symbol}${abs >= 10 ? Math.round(abs) : abs.toFixed(1)}B ${info.code}`;
}
