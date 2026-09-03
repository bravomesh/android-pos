import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TrendDay } from "../useDashboardData";

export interface SalesTrendChartProps {
  days: TrendDay[];
}

export default function SalesTrendChart({ days }: SalesTrendChartProps) {
  const theme = useTheme();

  if (!days.length) {
    return (
      <Box sx={{ height: 260, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Typography color="text.secondary">No data for this period</Typography>
      </Box>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={days}>
        <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
        <XAxis dataKey="date" tick={{ fontSize: 12, fill: theme.palette.text.secondary }} />
        <YAxis tick={{ fontSize: 12, fill: theme.palette.text.secondary }} />
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
        <Legend />
        <Line
          type="monotone"
          dataKey="sales"
          name="Sales"
          stroke={theme.palette.primary.main}
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="profit"
          name="Profit"
          stroke={theme.palette.secondary.main}
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
