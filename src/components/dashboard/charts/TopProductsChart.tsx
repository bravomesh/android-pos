import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { TopProduct } from "../useDashboardData";

export interface TopProductsChartProps {
  products: TopProduct[];
}

export default function TopProductsChart({ products }: TopProductsChartProps) {
  const theme = useTheme();

  const top = [...products]
    .filter((p) => (p.qty_sold ?? 0) > 0)
    .sort((a, b) => (b.qty_sold ?? 0) - (a.qty_sold ?? 0))
    .slice(0, 8);

  if (!top.length) {
    return (
      <Box sx={{ height: 260, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Typography color="text.secondary">No data for this period</Typography>
      </Box>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={top} layout="vertical" margin={{ left: 16, right: 16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
        <XAxis type="number" tick={{ fontSize: 12, fill: theme.palette.text.secondary }} />
        <YAxis
          type="category"
          dataKey="name"
          width={96}
          tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
        />
        <Tooltip
          contentStyle={{
            background: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 8,
            color: theme.palette.text.primary,
          }}
          itemStyle={{ color: theme.palette.text.primary }}
          labelStyle={{ color: theme.palette.text.secondary }}
        />
        <Bar dataKey="qty_sold" name="Qty sold" fill={theme.palette.primary.main} />
      </BarChart>
    </ResponsiveContainer>
  );
}
