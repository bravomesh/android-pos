import currency from "currency.js";

// The shop's currency, used on every screen and on the daily PDF report.
export const CURRENCY = "KES";

export const money = (value: number | string | null | undefined): string =>
  currency(value || 0, { symbol: `${CURRENCY} `, precision: 2 }).format(true);
