import { ReactNode, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import LinearProgress from "@mui/material/LinearProgress";
import Typography from "@mui/material/Typography";
import { alpha, useTheme } from "@mui/material/styles";
import PaidIcon from "@mui/icons-material/PaidRounded";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLongRounded";
import TrendingUpIcon from "@mui/icons-material/TrendingUpRounded";
import WarningAmberIcon from "@mui/icons-material/WarningAmberRounded";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBagRounded";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWalletRounded";
import PointOfSaleIcon from "@mui/icons-material/PointOfSaleRounded";
import MoveToInboxIcon from "@mui/icons-material/MoveToInboxRounded";
import AddBoxIcon from "@mui/icons-material/AddBoxRounded";
import CheckCircleIcon from "@mui/icons-material/CheckCircleRounded";

import StatCard from "./StatCard";
import RangePicker, { computeRange, DateRange } from "./RangePicker";
import { useDashboardData, LowStockItem } from "./useDashboardData";
import SalesTrendChart from "./charts/SalesTrendChart";
import TopProductsChart from "./charts/TopProductsChart";
import ExpenseBreakdownChart from "./charts/ExpenseBreakdownChart";
import AnimatedNumber from "../motion/AnimatedNumber";
import { money } from "../../money";
import { selectUser } from "../../reducers/auth";
import { stagger } from "../../theme/motion";

const greeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

function Panel({ title, action, children, index }: { title: string; action?: ReactNode; children: ReactNode; index: number }) {
  return (
    <Card className="pos-enter" sx={{ height: "100%", animationDelay: stagger(index + 6, 50) }}>
      <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5, gap: 1 }}>
          <Typography variant="h6" sx={{ fontSize: "1.05rem" }}>
            {title}
          </Typography>
          {action}
        </Box>
        {children}
      </CardContent>
    </Card>
  );
}

function LowStockList({ items }: { items: LowStockItem[] }) {
  if (items.length === 0) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 3, color: "text.secondary" }}>
        <CheckCircleIcon color="primary" aria-hidden />
        <Typography sx={{ fontWeight: 600 }}>Everything is above its reorder level</Typography>
      </Box>
    );
  }

  return (
    <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0, display: "grid", gap: 1.5 }}>
      {items.slice(0, 6).map((item) => {
        const level = Number(item.reorder_level) || 1;
        const share = Math.max(0, Math.min(100, (Number(item.stock_qty) / level) * 100));
        const out = Number(item.stock_qty) <= 0;
        return (
          <Box component="li" key={item.id}>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5, gap: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
                {item.name}
              </Typography>
              <Typography variant="body2" color={out ? "error" : "text.secondary"} sx={{ fontWeight: 700, flexShrink: 0 }}>
                {out ? "Out" : `${item.stock_qty} of ${item.reorder_level}`} {item.unit && item.unit !== "pcs" ? item.unit : ""}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={share}
              color={out ? "error" : "warning"}
              aria-label={`${item.name} stock against reorder level`}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>
        );
      })}
    </Box>
  );
}

export default function Dashboard() {
  const theme = useTheme();
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const [range, setRange] = useState<DateRange>(() => computeRange("7d"));
  const { loading, metrics, trend, topProducts, profitLoss, expenseByType, lowStock, todaySales } = useDashboardData(range);

  const sales = metrics?.totalSales ?? 0;
  const count = metrics?.totalTransactions ?? 0;
  const netProfit = profitLoss?.netProfit ?? 0;
  const lowStockCount = metrics?.lowStockCount ?? 0;
  const owed = metrics?.creditOutstanding ?? 0;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      {/* Greeting banner: today's takings and the three things done most. */}
      <Box
        className="pos-enter"
        sx={{
          position: "relative",
          overflow: "hidden",
          borderRadius: "24px",
          p: { xs: 2.5, sm: 3.5 },
          color: "#fff",
          background: `linear-gradient(125deg, ${theme.palette.mode === "light" ? "#065F46" : "#064E3B"} 0%, #047857 45%, #0F766E 100%)`,
          boxShadow: `0 18px 40px ${alpha("#047857", 0.35)}`,
        }}
      >
        {/* Two soft lights drifting behind the text. */}
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            width: 280,
            height: 280,
            borderRadius: "50%",
            right: -60,
            top: -120,
            background: `radial-gradient(circle, ${alpha("#FB923C", 0.55)}, transparent 70%)`,
            animation: "pos-float 9s ease-in-out infinite",
          }}
        />
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            width: 220,
            height: 220,
            borderRadius: "50%",
            left: "40%",
            bottom: -140,
            background: `radial-gradient(circle, ${alpha("#6EE7B7", 0.45)}, transparent 70%)`,
            animation: "pos-float 11s ease-in-out -3s infinite",
          }}
        />
        <Box sx={{ position: "relative", display: "flex", flexWrap: "wrap", gap: 3, alignItems: "flex-end", justifyContent: "space-between" }}>
          <Box>
            <Typography sx={{ opacity: 0.85, fontWeight: 600 }}>
              {greeting()}, {user?.name ?? "there"}
            </Typography>
            <Typography variant="overline" sx={{ opacity: 0.75, display: "block", mt: 1.5 }}>
              Taken today
            </Typography>
            <Typography variant="h3" sx={{ color: "#fff", fontSize: { xs: "2.2rem", sm: "2.8rem" }, lineHeight: 1.1 }}>
              <AnimatedNumber value={todaySales} format={money} duration={900} />
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Button
              variant="contained"
              color="secondary"
              startIcon={<PointOfSaleIcon />}
              onClick={() => navigate("/sale")}
              sx={{ minHeight: 48 }}
            >
              New sale
            </Button>
            {[
              { label: "Receive stock", icon: <MoveToInboxIcon />, path: "/receivings/new" },
              { label: "Add product", icon: <AddBoxIcon />, path: "/products/new" },
            ].map((action) => (
              <Button
                key={action.path}
                startIcon={action.icon}
                onClick={() => navigate(action.path)}
                sx={{
                  minHeight: 48,
                  color: "#fff",
                  bgcolor: "rgba(255,255,255,.14)",
                  backdropFilter: "blur(6px)",
                  "&:hover": { bgcolor: "rgba(255,255,255,.24)" },
                }}
              >
                {action.label}
              </Button>
            ))}
          </Box>
        </Box>
      </Box>

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1.5 }}>
        <Typography variant="h6">How the shop is doing</Typography>
        <RangePicker value={range} onChange={setRange} />
      </Box>

      {loading && <LinearProgress />}

      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", md: "repeat(3, minmax(0, 1fr))" } }}>
        <StatCard index={0} label="Sales" value={sales} format={money} icon={<PaidIcon />} color={theme.palette.primary.main} hint={`${metrics?.itemsSold ?? 0} items sold`} />
        <StatCard
          index={1}
          label="Profit after expenses"
          value={netProfit}
          format={money}
          icon={<TrendingUpIcon />}
          color={netProfit >= 0 ? theme.palette.primary.main : theme.palette.error.main}
          hint={profitLoss ? `${profitLoss.profitMargin}% of sales` : undefined}
        />
        <StatCard index={2} label="Transactions" value={count} icon={<ReceiptLongIcon />} color={theme.palette.secondary.main} onClick={() => navigate("/sales")} />
        <StatCard
          index={3}
          label="Average basket"
          value={count > 0 ? sales / count : 0}
          format={money}
          icon={<ShoppingBagIcon />}
          color={theme.palette.info.main}
        />
        <StatCard
          index={4}
          label="Owed by customers"
          value={owed}
          format={money}
          icon={<AccountBalanceWalletIcon />}
          color={owed > 0 ? theme.palette.secondary.main : theme.palette.text.secondary}
          onClick={() => navigate("/customers")}
        />
        <StatCard
          index={5}
          label="Low stock"
          value={lowStockCount}
          icon={<WarningAmberIcon />}
          color={lowStockCount > 0 ? theme.palette.warning.main : theme.palette.text.secondary}
          hint={lowStockCount > 0 ? "Need reordering" : "All stocked up"}
          onClick={() => navigate("/stock")}
        />
      </Box>

      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1.6fr) minmax(0, 1fr)" } }}>
        <Panel title="Sales & profit" index={0}>
          <SalesTrendChart days={trend} />
        </Panel>
        <Panel title="Best sellers" index={1}>
          <TopProductsChart products={topProducts} />
        </Panel>
        <Panel
          title="Running low"
          index={2}
          action={
            lowStock.length > 0 ? (
              <Button size="small" onClick={() => navigate("/receivings/new")}>
                Receive stock
              </Button>
            ) : undefined
          }
        >
          <LowStockList items={lowStock} />
        </Panel>
        <Panel title="Spending" index={3}>
          <ExpenseBreakdownChart expenseByType={expenseByType} />
        </Panel>
      </Box>
    </Box>
  );
}
