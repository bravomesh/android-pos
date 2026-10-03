import { useCallback, useEffect, useState } from "react";
import api from "../../api";
import { toast } from "../../toast/useToast";

export interface DashboardRange {
  start: string;
  end: string;
}

export interface DashboardMetrics {
  totalTransactions: number;
  totalSales: number;
  creditOutstanding: number;
  itemsSold: number;
  totalExpenses: number;
  lowStockCount: number;
}

export interface TrendDay {
  date: string;
  sales: number;
  profit: number;
}

export interface TopProduct {
  id?: string;
  name: string;
  qty_sold: number;
  revenue?: number;
  [key: string]: unknown;
}

export interface ProfitLoss {
  revenue: number;
  costOfGoodsSold: number;
  grossProfit: number;
  expenses: number;
  netProfit: number;
  profitMargin: number;
}

export interface ExpenseByType {
  type: string;
  count: number;
  total: number;
}

export interface LowStockItem {
  id: number;
  name: string;
  unit?: string;
  stock_qty: number;
  reorder_level: number | null;
}

export interface UseDashboardDataResult {
  loading: boolean;
  error: string | null;
  metrics: DashboardMetrics | null;
  trend: TrendDay[];
  topProducts: TopProduct[];
  profitLoss: ProfitLoss | null;
  expenseByType: ExpenseByType[];
  lowStock: LowStockItem[];
  todaySales: number;
  reload: () => Promise<void>;
}

const FALLBACK_ERROR = "Failed to load dashboard data";

const pad = (n: number) => String(n).padStart(2, "0");
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/**
 * Every day in the range, with the days nothing was sold filled in as zero,
 * so a quiet Tuesday shows as a dip rather than disappearing from the chart.
 */
export const fillDays = (days: TrendDay[], start: string, end: string): TrendDay[] => {
  const byDate = new Map(days.map((d) => [d.date, d]));
  const out: TrendDay[] = [];
  const [y, m, d] = start.split("-").map(Number);
  const cursor = new Date(y, m - 1, d);
  // ponytail: capped at a year of days; a longer custom range shows its first year.
  for (let i = 0; i < 366 && iso(cursor) <= end; i += 1) {
    const key = iso(cursor);
    out.push(byDate.get(key) ?? { date: key, sales: 0, profit: 0 });
    cursor.setDate(cursor.getDate() + 1);
  }
  return out;
};

export function useDashboardData(range: DashboardRange): UseDashboardDataResult {
  const { start, end } = range;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [trend, setTrend] = useState<TrendDay[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [profitLoss, setProfitLoss] = useState<ProfitLoss | null>(null);
  const [expenseByType, setExpenseByType] = useState<ExpenseByType[]>([]);
  const [lowStock, setLowStock] = useState<LowStockItem[]>([]);
  const [todaySales, setTodaySales] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const today = iso(new Date());
      const [dashboardRes, trendRes, productsRes, profitLossRes, expensesRes, lowRes, todayRes] = await Promise.all([
        api.reports.getDashboard(start, end),
        api.reports.getSalesTrend(start, end),
        api.reports.getSalesByProduct(start, end),
        api.reports.getProfitLoss(start, end),
        api.reports.getExpenses(start, end),
        api.product.getLowStock(),
        api.reports.getDashboard(today, today),
      ]);

      setMetrics(dashboardRes.data);
      setTrend(fillDays(trendRes.data.days || [], start, end));
      setTopProducts(productsRes.data.products || []);
      setProfitLoss(profitLossRes.data);
      setExpenseByType(expensesRes.data.byType || []);
      setLowStock(lowRes.data || []);
      setTodaySales(todayRes.data?.totalSales || 0);
    } catch (err) {
      const message = err instanceof Error ? err.message : FALLBACK_ERROR;
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [start, end]);

  useEffect(() => {
    load();
  }, [load]);

  return { loading, error, metrics, trend, topProducts, profitLoss, expenseByType, lowStock, todaySales, reload: load };
}
