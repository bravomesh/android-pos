import currency from "currency.js";

// The shop's currency, used on every screen and on the daily PDF report.
export const CURRENCY = "KES";

export const money = (value: number | string | null | undefined): string =>
  currency(value || 0, { symbol: `${CURRENCY} `, precision: 2 }).format(true);

/** For tiles and headlines: drops ".00" from whole amounts (KES 35,930). Tills keep exact cents. */
export const moneyShort = (value: number | string | null | undefined): string => money(value).replace(/\.00$/, "");
