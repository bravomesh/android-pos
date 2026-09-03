import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { alpha, useTheme } from "@mui/material/styles";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { TrendDay } from "../useDashboardData";

export interface ProfitMarginChartProps {
  days: TrendDay[];
}

export default function ProfitMarginChart({ days }: ProfitMarginChartProps) {
  const theme = useTheme();

  if (!days.length) {
    return (
      <Box sx={{ height: 260, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Typography color="text.secondary">No data for this period</Typography>
      </Box>
    );
  }

  const data = days.map((d) => ({
    date: d.date,
    margin: d.sales > 0 ? (d.profit / d.sales) * 100 : 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
        <XAxis dataKey="date" tick={{ fontSize: 12, fill: theme.palette.text.secondary }} />
        <YAxis
          tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
          unit="%"
          domain={["auto", "auto"]}
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
        <Area
          type="monotone"
          dataKey="margin"
          name="Margin %"
          stroke={theme.palette.secondary.main}
          fill={alpha(theme.palette.secondary.main, 0.24)}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
