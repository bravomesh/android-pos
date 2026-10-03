import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { ExpenseByType } from "../useDashboardData";
import { categoricalFor, tooltipProps } from "./chartStyle";
import { money } from "../../../money";

export interface ExpenseBreakdownChartProps {
  expenseByType: ExpenseByType[];
}

// Six categorical slots; anything beyond folds into "Other" rather than
// inventing a seventh colour.
const MAX_SLICES = 6;

/** Where the money went: a donut with the total in the middle, every slice named. */
export default function ExpenseBreakdownChart({ expenseByType }: ExpenseBreakdownChartProps) {
  const theme = useTheme();
  const palette = categoricalFor(theme);

  const sorted = expenseByType
    .filter((e) => (e.total ?? 0) > 0)
    .map((e) => ({ ...e, type: e.type || "Uncategorised" }))
    .sort((a, b) => b.total - a.total);
  const data =
    sorted.length > MAX_SLICES
      ? [
          ...sorted.slice(0, MAX_SLICES - 1),
          { type: "Other", count: 0, total: sorted.slice(MAX_SLICES - 1).reduce((s, e) => s + e.total, 0) },
        ]
      : sorted;
  const total = data.reduce((s, e) => s + e.total, 0);

  if (!data.length) {
    return (
      <Box sx={{ height: 220, display: "grid", placeItems: "center" }}>
        <Typography color="text.secondary">No expenses in this period</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
      <Box sx={{ position: "relative", width: 200, height: 200, mx: "auto" }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="total"
              nameKey="type"
              innerRadius={64}
              outerRadius={92}
              paddingAngle={2}
              cornerRadius={4}
              stroke={theme.palette.background.paper}
              strokeWidth={2}
              animationDuration={700}
            >
              {data.map((entry, index) => (
                <Cell key={entry.type} fill={palette[index]} />
              ))}
            </Pie>
            <Tooltip {...tooltipProps(theme)} formatter={(value) => money(Number(value))} />
          </PieChart>
        </ResponsiveContainer>
        <Box sx={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", pointerEvents: "none", textAlign: "center" }}>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
              Spent
            </Typography>
            <Typography variant="h6" sx={{ lineHeight: 1.1 }}>
              {money(total).replace(/\.00$/, "")}
            </Typography>
          </Box>
        </Box>
      </Box>
      <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0, flex: 1, minWidth: 160 }}>
        {data.map((entry, index) => (
          <Box component="li" key={entry.type} sx={{ display: "flex", alignItems: "center", gap: 1, py: 0.5 }}>
            <Box aria-hidden sx={{ width: 10, height: 10, borderRadius: "3px", bgcolor: palette[index], flexShrink: 0 }} />
            <Typography variant="body2" sx={{ flex: 1, fontWeight: 600 }} noWrap>
              {entry.type}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {money(entry.total)}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
