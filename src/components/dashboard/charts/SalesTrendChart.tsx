import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { TrendDay } from "../useDashboardData";
import { axisTick, compact, seriesFor, shortDay, tooltipProps } from "./chartStyle";
import { money } from "../../../money";

export interface SalesTrendChartProps {
  days: TrendDay[];
}

/** Sales and profit per day, on one money axis. */
export default function SalesTrendChart({ days }: SalesTrendChartProps) {
  const theme = useTheme();
  const colors = seriesFor(theme);

  if (!days.some((d) => d.sales !== 0)) {
    return (
      <Box sx={{ height: 260, display: "grid", placeItems: "center" }}>
        <Typography color="text.secondary">No sales in this period yet</Typography>
      </Box>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={days} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
        <defs>
          <linearGradient id="fill-sales" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colors.sales} stopOpacity={0.32} />
            <stop offset="100%" stopColor={colors.sales} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="fill-profit" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colors.profit} stopOpacity={0.22} />
            <stop offset="100%" stopColor={colors.profit} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke={theme.palette.divider} />
        <XAxis dataKey="date" tickFormatter={shortDay} tick={axisTick(theme)} axisLine={false} tickLine={false} minTickGap={16} />
        <YAxis tickFormatter={compact} tick={axisTick(theme)} axisLine={false} tickLine={false} width={48} />
        <Tooltip
          {...tooltipProps(theme)}
          labelFormatter={(label) => shortDay(String(label))}
          formatter={(value) => money(Number(value))}
          cursor={{ stroke: theme.palette.text.secondary, strokeDasharray: "4 4" }}
        />
        <Legend iconType="circle" wrapperStyle={{ color: theme.palette.text.secondary, fontWeight: 600, fontSize: 13 }} />
        <Area
          type="monotone"
          dataKey="sales"
          name="Sales"
          stroke={colors.sales}
          strokeWidth={2}
          fill="url(#fill-sales)"
          activeDot={{ r: 5, strokeWidth: 2, stroke: theme.palette.background.paper }}
          animationDuration={700}
        />
        <Area
          type="monotone"
          dataKey="profit"
          name="Profit"
          stroke={colors.profit}
          strokeWidth={2}
          fill="url(#fill-profit)"
          activeDot={{ r: 5, strokeWidth: 2, stroke: theme.palette.background.paper }}
          animationDuration={700}
          animationBegin={150}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
