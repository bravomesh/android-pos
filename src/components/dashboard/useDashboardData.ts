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

export interface UseDashboardDataResult {
  loading: boolean;
  error: string | null;
  metrics: DashboardMetrics | null;
  trend: TrendDay[];
  topProducts: TopProduct[];
  profitLoss: ProfitLoss | null;
  expenseByType: ExpenseByType[];
  reload: () => Promise<void>;
}

const FALLBACK_ERROR = "Failed to load dashboard data";

export function useDashboardData(range: DashboardRange): UseDashboardDataResult {
  const { start, end } = range;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [trend, setTrend] = useState<TrendDay[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [profitLoss, setProfitLoss] = useState<ProfitLoss | null>(null);
  const [expenseByType, setExpenseByType] = useState<ExpenseByType[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashboardRes, trendRes, productsRes, profitLossRes, expensesRes] = await Promise.all([
        api.reports.getDashboard(start, end),
        api.reports.getSalesTrend(start, end),
        api.reports.getSalesByProduct(start, end),
        api.reports.getProfitLoss(start, end),
        api.reports.getExpenses(start, end),
      ]);

      setMetrics(dashboardRes.data);
      setTrend(trendRes.data.days || []);
      setTopProducts(productsRes.data.products || []);
      setProfitLoss(profitLossRes.data);
      setExpenseByType(expensesRes.data.byType || []);
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

  return { loading, error, metrics, trend, topProducts, profitLoss, expenseByType, reload: load };
}
