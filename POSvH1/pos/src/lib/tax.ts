export const PH_VAT_RATE = 0.12;

function round2(value: number): number {
  return Math.round((Number.isFinite(value) ? value : 0) * 100) / 100;
}

export function splitVatInclusive(grossAmount: number, vatRate: number = PH_VAT_RATE) {
  const safeGross = Number.isFinite(grossAmount) ? grossAmount : 0;
  const safeRate = vatRate > 0 ? vatRate : PH_VAT_RATE;
  const vatableSales = safeGross / (1 + safeRate);
  const vatAmount = safeGross - vatableSales;

  return {
    grossAmount: round2(safeGross),
    vatableSales: round2(vatableSales),
    vatAmount: round2(vatAmount),
    vatRate: safeRate,
  };
}
