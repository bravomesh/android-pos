import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import type { TopProduct } from "../useDashboardData";
import { seriesFor } from "./chartStyle";

export interface TopProductsChartProps {
  products: TopProduct[];
}

/** The best sellers by quantity. Plain rows, so a long product name wraps on a phone instead of being cut. */
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

  const most = top[0].qty_sold ?? 1;

  return (
    <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0, display: "grid", gap: 1.5 }}>
      {top.map((p) => (
        <Box component="li" key={p.name}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", mb: 0.5, gap: 1.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 700, overflowWrap: "anywhere" }}>
              {p.name}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700, flexShrink: 0 }}>
              {p.qty_sold} sold
            </Typography>
          </Box>
          <Box aria-hidden sx={{ height: 8, borderRadius: "4px", bgcolor: "action.hover" }}>
            <Box
              sx={{
                height: "100%",
                width: `${((p.qty_sold ?? 0) / most) * 100}%`,
                borderRadius: "4px",
                bgcolor: seriesFor(theme).sales,
              }}
            />
          </Box>
        </Box>
      ))}
    </Box>
  );
}
