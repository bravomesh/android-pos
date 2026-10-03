import { useState } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";
import LinearProgress from "@mui/material/LinearProgress";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import PaidIcon from "@mui/icons-material/Paid";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

import StatCard from "./StatCard";
import RangePicker, { computeRange, DateRange } from "./RangePicker";
import { useDashboardData } from "./useDashboardData";
import SalesTrendChart from "./charts/SalesTrendChart";
import TopProductsChart from "./charts/TopProductsChart";
import ProfitMarginChart from "./charts/ProfitMarginChart";
import ExpenseBreakdownChart from "./charts/ExpenseBreakdownChart";
import { money } from "../../money";

export default function Dashboard() {
  const theme = useTheme();
  const [range, setRange] = useState<DateRange>(() => computeRange("7d"));
  const { loading, metrics, trend, topProducts, profitLoss, expenseByType } = useDashboardData(range);

  const netProfit = profitLoss?.netProfit ?? 0;
  const lowStockCount = metrics?.lowStockCount ?? 0;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 1.5,
        }}
      >
        <RangePicker value={range} onChange={setRange} />
      </Box>

      {loading && <LinearProgress />}

      <Grid container spacing={2}>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatCard
            label="Sales"
            value={money(metrics?.totalSales)}
            icon={<PaidIcon />}
            color={theme.palette.primary.main}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatCard
            label="Profit"
            value={money(netProfit)}
            icon={<TrendingUpIcon />}
            color={netProfit >= 0 ? theme.palette.success.main : theme.palette.error.main}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatCard
            label="Transactions"
            value={(metrics?.totalTransactions ?? 0).toLocaleString()}
            icon={<ReceiptLongIcon />}
            color={theme.palette.secondary.main}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatCard
            label="Low stock"
            value={lowStockCount.toLocaleString()}
            icon={<WarningAmberIcon />}
            color={lowStockCount > 0 ? theme.palette.warning.main : theme.palette.text.secondary}
          />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Sales trend
              </Typography>
              <SalesTrendChart days={trend} />
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Top products
              </Typography>
              <TopProductsChart products={topProducts} />
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Profit / loss margin
              </Typography>
              <ProfitMarginChart days={trend} />
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Expense breakdown
              </Typography>
              <ExpenseBreakdownChart expenseByType={expenseByType} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
