import { Theme } from "@mui/material/styles";

// Validated with the dataviz palette checker against each theme's card
// surface (#FFFFFF light, #13221D dark). Sales/profit are the brand pair;
// dark mode uses its own steps, not a flip of the light ones.
export const SERIES = {
  light: { sales: "#047857", profit: "#C2410C" },
  dark: { sales: "#199e70", profit: "#d95926" },
} as const;

// Fixed order, never cycled: expense type N always gets slot N. Some light
// slots sit under 3:1 against white, so every slice is also labelled with
// its name and amount beside the chart.
export const CATEGORICAL = {
  light: ["#1baf7a", "#eb6834", "#2a78d6", "#eda100", "#e87ba4", "#4a3aa7"],
  dark: ["#199e70", "#d95926", "#3987e5", "#c98500", "#d55181", "#9085e9"],
} as const;

export const seriesFor = (theme: Theme) => SERIES[theme.palette.mode];
export const categoricalFor = (theme: Theme) => CATEGORICAL[theme.palette.mode];

/** Tooltip box in the app's own surface and text colours. */
export const tooltipProps = (theme: Theme) => ({
  contentStyle: {
    background: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 12,
    boxShadow: "0 8px 24px rgba(0,0,0,.12)",
    color: theme.palette.text.primary,
    fontWeight: 600,
  },
  itemStyle: { color: theme.palette.text.primary },
  labelStyle: { color: theme.palette.text.secondary, marginBottom: 4 },
});

export const axisTick = (theme: Theme) => ({ fontSize: 12, fill: theme.palette.text.secondary });

/** 12,500 → 12.5k, so axis labels stay short on a phone. */
export const compact = (value: number) =>
  Math.abs(value) >= 1000 ? `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k` : String(value);

/** "2026-10-03" → "3 Oct". */
export const shortDay = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { day: "numeric", month: "short" });
};
