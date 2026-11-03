export function formatCurrency(amountBillions: number): string {
  if (amountBillions >= 1000) {
    return `$${(amountBillions / 1000).toFixed(2)} Trillion`;
  }
  return `$${amountBillions.toLocaleString()} Billion`;
}

export function formatShortGdp(amountBillions: number): string {
  if (amountBillions >= 1000) {
    return `$${(amountBillions / 1000).toFixed(2)}T`;
  }
  return `$${amountBillions}B`;
}

export function formatNumber(num: number, decimals: number = 1): string {
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function calculateDelta(valA: number, valB: number): {
  diff: number;
  percentDiff: number;
  ratio: number;
} {
  const diff = valA - valB;
  const percentDiff = valB !== 0 ? ((valA - valB) / Math.abs(valB)) * 100 : 0;
  const ratio = valB !== 0 ? valA / valB : 1;
  return { diff, percentDiff, ratio };
}
