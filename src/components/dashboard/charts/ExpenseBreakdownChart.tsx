import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { ExpenseByType } from "../useDashboardData";

export interface ExpenseBreakdownChartProps {
  expenseByType: ExpenseByType[];
}

export default function ExpenseBreakdownChart({ expenseByType }: ExpenseBreakdownChartProps) {
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up("md"));

  const data = expenseByType.filter((e) => (e.total ?? 0) > 0);

  if (!data.length) {
    return (
      <Box sx={{ height: 260, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Typography color="text.secondary">No data for this period</Typography>
      </Box>
    );
  }

  // Rotation palette — the only hardcoded hex values allowed by the design spec.
  const palette = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    "#F59E0B",
    "#EF4444",
    "#8B5CF6",
    "#64748B",
  ];

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          dataKey="total"
          nameKey="type"
          innerRadius={50}
          outerRadius={80}
          paddingAngle={2}
        >
          {data.map((entry, index) => (
            <Cell key={entry.type} fill={palette[index % palette.length]} />
          ))}
        </Pie>
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
        <Legend
          layout={isMdUp ? "vertical" : "horizontal"}
          align={isMdUp ? "right" : "center"}
          verticalAlign={isMdUp ? "middle" : "bottom"}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
