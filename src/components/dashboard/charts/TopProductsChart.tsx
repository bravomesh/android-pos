import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { Bar, BarChart, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { TopProduct } from "../useDashboardData";
import { axisTick, seriesFor, tooltipProps } from "./chartStyle";

export interface TopProductsChartProps {
  products: TopProduct[];
}

/** The best sellers by quantity: one series, so no legend; each bar is labelled. */
export default function TopProductsChart({ products }: TopProductsChartProps) {
  const theme = useTheme();

  const top = [...products]
    .filter((p) => (p.qty_sold ?? 0) > 0)
    .sort((a, b) => (b.qty_sold ?? 0) - (a.qty_sold ?? 0))
    .slice(0, 6);

  if (!top.length) {
    return (
      <Box sx={{ height: 260, display: "grid", placeItems: "center" }}>
        <Typography color="text.secondary">Nothing sold in this period yet</Typography>
      </Box>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={Math.max(160, top.length * 42)}>
      <BarChart data={top} layout="vertical" margin={{ left: 0, right: 36, top: 4, bottom: 4 }} barCategoryGap={8}>
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="name"
          width={132}
          tick={axisTick(theme)}
          // Long product names would wrap into each other on the axis.
          tickFormatter={(name: string) => (name.length > 15 ? `${name.slice(0, 14).trimEnd()}…` : name)}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip {...tooltipProps(theme)} cursor={{ fill: theme.palette.action.hover }} labelFormatter={(name) => String(name)} />
        <Bar dataKey="qty_sold" name="Sold" fill={seriesFor(theme).sales} radius={[0, 6, 6, 0]} barSize={22} animationDuration={700}>
          <LabelList dataKey="qty_sold" position="right" style={{ fill: theme.palette.text.primary, fontWeight: 700, fontSize: 13 }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
