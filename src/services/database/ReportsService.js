/**
 * Reports Service - Handles all reporting and analytics
 */

import db from './DatabaseService';
import { localDay, localDayOf } from './businessDay';

class ReportsService {
  /**
   * Get dashboard metrics
   */
  async getDashboardMetrics(startDate = null, endDate = null) {
    const today = localDay();
    const start = startDate || today;
    const end = endDate || today;

    // Total transactions
    const transactionsResult = await db.query(
      `SELECT
        COUNT(*) as total_transactions,
        COALESCE(SUM(net_amount), 0) as total_sales,
        COALESCE(SUM(CASE WHEN sales_type = 'Credit' THEN net_amount - amount_paid ELSE 0 END), 0) as credit_outstanding
      FROM transaction_headers
      WHERE ${localDayOf('created_at')} BETWEEN ? AND ?
        AND transaction_status = 'Done'
        AND is_active = 1`,
      [start, end]
    );

    // Total items sold
    const itemsResult = await db.query(
      `SELECT COALESCE(SUM(td.qty), 0) as items_sold
       FROM transaction_details td
       JOIN transaction_headers th ON td.transaction_id = th.id
       WHERE ${localDayOf('th.created_at')} BETWEEN ? AND ?
         AND th.transaction_status = 'Done'
         AND th.is_active = 1`,
      [start, end]
    );

    // Today's expenses
    const expensesResult = await db.query(
      `SELECT COALESCE(SUM(amount), 0) as total_expenses
       FROM expenses
       WHERE DATE(spent_at) BETWEEN ? AND ?`,
      [start, end]
    );

    // Low stock count
    const lowStockResult = await db.query(
      `SELECT COUNT(*) as low_stock_count
       FROM products p
       JOIN stock s ON p.id = s.product_id
       WHERE p.track_stock = 1
         AND p.reorder_level IS NOT NULL
         AND s.qty <= p.reorder_level`
    );

    const metrics = transactionsResult[0] || {};
    const items = itemsResult[0] || {};
    const expenses = expensesResult[0] || {};
    const lowStock = lowStockResult[0] || {};

    return {
      totalTransactions: metrics.total_transactions || 0,
      totalSales: metrics.total_sales || 0,
      creditOutstanding: metrics.credit_outstanding || 0,
      itemsSold: items.items_sold || 0,
      totalExpenses: expenses.total_expenses || 0,
      lowStockCount: lowStock.low_stock_count || 0,
      dateRange: { start, end }
    };
  }

  /**
   * Get today's sales report
   */
  async getTodaySales() {
    const today = localDay();

    const transactions = await db.query(
      `SELECT
        th.*,
        c.name as customer_name
      FROM transaction_headers th
      LEFT JOIN customers c ON th.customer_id = c.id
      WHERE ${localDayOf('th.created_at')} = ?
        AND th.transaction_status = 'Done'
        AND th.is_active = 1
      ORDER BY th.created_at DESC`,
      [today]
    );

    const summary = await db.query(
      `SELECT
        COUNT(*) as count,
        COALESCE(SUM(net_amount), 0) as total,
        COALESCE(SUM(amount_paid), 0) as paid
      FROM transaction_headers
      WHERE ${localDayOf('created_at')} = ?
        AND transaction_status = 'Done'
        AND is_active = 1`,
      [today]
    );

    return {
      date: today,
      transactions,
      summary: summary[0] || { count: 0, total: 0, paid: 0 }
    };
  }

  /**
   * Get credit sales report
   */
  async getCreditSales(startDate = null, endDate = null) {
    const today = localDay();
    const start = startDate || '1970-01-01';
    const end = endDate || today;

    const creditSales = await db.query(
      `SELECT
        th.*,
        c.name as customer_name,
        c.mobile as customer_mobile,
        (th.net_amount - th.amount_paid) as outstanding
      FROM transaction_headers th
      JOIN customers c ON th.customer_id = c.id
      WHERE th.sales_type = 'Credit'
        AND ${localDayOf('th.created_at')} BETWEEN ? AND ?
        AND th.transaction_status = 'Done'
        AND th.is_active = 1
      ORDER BY th.created_at DESC`,
      [start, end]
    );

    const summary = await db.query(
      `SELECT
        COUNT(*) as count,
        COALESCE(SUM(net_amount), 0) as total,
        COALESCE(SUM(amount_paid), 0) as paid,
        COALESCE(SUM(net_amount - amount_paid), 0) as outstanding
      FROM transaction_headers
      WHERE sales_type = 'Credit'
        AND ${localDayOf('created_at')} BETWEEN ? AND ?
        AND transaction_status = 'Done'
        AND is_active = 1`,
      [start, end]
    );

    return {
      sales: creditSales,
      summary: summary[0] || { count: 0, total: 0, paid: 0, outstanding: 0 },
      dateRange: { start, end }
    };
  }

  /**
   * Get expense report
   */
  async getExpenseReport(startDate = null, endDate = null) {
    const today = localDay();
    const start = startDate || today;
    const end = endDate || today;

    const expenses = await db.query(
      `SELECT
        e.*,
        et.description as expense_type_name
      FROM expenses e
      LEFT JOIN expense_types et ON e.expense_type_id = et.id
      WHERE DATE(e.spent_at) BETWEEN ? AND ?
      ORDER BY e.spent_at DESC`,
      [start, end]
    );

    // Group by expense type
    const byType = await db.query(
      `SELECT
        et.description as type,
        COUNT(*) as count,
        COALESCE(SUM(e.amount), 0) as total
      FROM expenses e
      LEFT JOIN expense_types et ON e.expense_type_id = et.id
      WHERE DATE(e.spent_at) BETWEEN ? AND ?
      GROUP BY e.expense_type_id
      ORDER BY total DESC`,
      [start, end]
    );

    const totalResult = await db.query(
      `SELECT COALESCE(SUM(amount), 0) as total
       FROM expenses
       WHERE DATE(spent_at) BETWEEN ? AND ?`,
      [start, end]
    );

    return {
      expenses,
      byType,
      total: totalResult[0]?.total || 0,
      dateRange: { start, end }
    };
  }

  /**
   * Get sales by product report
   */
  async getSalesByProduct(startDate = null, endDate = null) {
    const today = localDay();
    const start = startDate || '1970-01-01';
    const end = endDate || today;

    const productSales = await db.query(
      // The sold lines are filtered in a subquery rather than in the ON
      // clause of a LEFT JOIN. Conditions on the right-hand table of a LEFT
      // JOIN do not remove left-hand rows, so the previous form counted every
      // line ever added to a cart — abandoned carts, open transactions and
      // reversed sales included — as if it had been sold.
      `SELECT
        p.id,
        p.name,
        p.sku,
        p.unit,
        p.cost_price,
        p.selling_price,
        COALESCE(sold.qty_sold, 0) as qty_sold,
        COALESCE(sold.revenue, 0) as revenue,
        COALESCE(sold.cost, 0) as cost,
        COALESCE(sold.revenue - sold.cost, 0) as profit,
        COALESCE(s.qty, 0) as current_stock
      FROM products p
      LEFT JOIN (
        SELECT
          td.product_id,
          SUM(td.qty) as qty_sold,
          SUM(td.price) as revenue,
          SUM(td.qty * td.cost_price) as cost
        FROM transaction_details td
        JOIN transaction_headers th ON td.transaction_id = th.id
        WHERE ${localDayOf('th.created_at')} BETWEEN ? AND ?
          AND th.transaction_status = 'Done'
          AND th.is_active = 1
        GROUP BY td.product_id
      ) sold ON sold.product_id = p.id
      LEFT JOIN stock s ON p.id = s.product_id
      GROUP BY p.id
      ORDER BY qty_sold DESC`,
      [start, end]
    );

    return {
      products: productSales,
      dateRange: { start, end }
    };
  }

  /**
   * Get low stock items
   */
  async getLowStockItems(threshold = null) {
    const items = await db.query(
      `SELECT
        p.id,
        p.name,
        p.sku,
        p.unit,
        p.selling_price,
        p.cost_price,
        COALESCE(p.reorder_level, ?) as reorder_level,
        s.qty as stock_qty,
        pt.description as category
      FROM products p
      JOIN stock s ON p.id = s.product_id
      LEFT JOIN product_types pt ON p.product_type_id = pt.id
      WHERE p.track_stock = 1 AND s.qty <= COALESCE(p.reorder_level, ?)
      ORDER BY s.qty ASC`,
      [threshold, threshold]
    );

    return {
      items,
      threshold,
      count: items.length
    };
  }

  /**
   * Get profit/loss report
   */
  async getProfitLossReport(startDate = null, endDate = null) {
    const today = localDay();
    const start = startDate || today;
    const end = endDate || today;

    // Revenue from sales. Tax is collected on the government's behalf, so it
    // is not part of what the shop earned.
    const revenueResult = await db.query(
      `SELECT COALESCE(SUM(net_amount - tax_amount), 0) as revenue
       FROM transaction_headers
       WHERE ${localDayOf('created_at')} BETWEEN ? AND ?
         AND transaction_status = 'Done'
         AND is_active = 1`,
      [start, end]
    );

    // Cost of goods sold
    const cogsResult = await db.query(
      `SELECT COALESCE(SUM(td.qty * td.cost_price), 0) as cogs
       FROM transaction_details td
       JOIN transaction_headers th ON td.transaction_id = th.id
       WHERE ${localDayOf('th.created_at')} BETWEEN ? AND ?
         AND th.transaction_status = 'Done'
         AND th.is_active = 1`,
      [start, end]
    );

    // Total expenses
    const expensesResult = await db.query(
      `SELECT COALESCE(SUM(amount), 0) as expenses
       FROM expenses
       WHERE DATE(spent_at) BETWEEN ? AND ?`,
      [start, end]
    );

    const revenue = revenueResult[0]?.revenue || 0;
    const cogs = cogsResult[0]?.cogs || 0;
    const expenses = expensesResult[0]?.expenses || 0;
    const grossProfit = revenue - cogs;
    const netProfit = grossProfit - expenses;
    const profitMargin = revenue > 0 ? ((netProfit / revenue) * 100).toFixed(2) : 0;

    return {
      revenue,
      costOfGoodsSold: cogs,
      grossProfit,
      expenses,
      netProfit,
      profitMargin: parseFloat(profitMargin),
      dateRange: { start, end }
    };
  }

  /**
   * Per-day sales & gross profit series for charting (dashboard trend).
   * Two queries (sales, then cogs) merged by day in JS to avoid the
   * fan-out from joining transaction_headers to transaction_details,
   * which would multiply net_amount by the line count per transaction.
   * @param {string|null} [startDate]
   * @param {string|null} [endDate]
   */
  async getSalesTrend(startDate = null, endDate = null) {
    const today = localDay();
    const start = startDate || today;
    const end = endDate || today;

    // Sales per day — headers only (no join → no multiplication). Profit is
    // worked out on takings less tax, which belongs to the government.
    const salesRows = await db.query(
      `SELECT ${localDayOf('created_at')} as day,
              COALESCE(SUM(net_amount), 0) as sales,
              COALESCE(SUM(net_amount - tax_amount), 0) as revenue
       FROM transaction_headers
       WHERE ${localDayOf('created_at')} BETWEEN ? AND ?
         AND transaction_status = 'Done'
         AND is_active = 1
       GROUP BY ${localDayOf('created_at')}
       ORDER BY day ASC`,
      [start, end]
    );

    // COGS per day — details joined to their (Done) headers.
    const cogsRows = await db.query(
      `SELECT ${localDayOf('th.created_at')} as day, COALESCE(SUM(td.qty * td.cost_price), 0) as cogs
       FROM transaction_details td
       JOIN transaction_headers th ON td.transaction_id = th.id
       WHERE ${localDayOf('th.created_at')} BETWEEN ? AND ?
         AND th.transaction_status = 'Done'
         AND th.is_active = 1
       GROUP BY ${localDayOf('th.created_at')}`,
      [start, end]
    );

    const cogsByDay = new Map(cogsRows.map(r => [r.day, r.cogs]));
    const days = salesRows.map(r => ({
      date: r.day,
      sales: r.sales,
      profit: r.revenue - (cogsByDay.get(r.day) || 0)
    }));

    return {
      days,
      dateRange: { start, end }
    };
  }

  /**
   * Aggregate everything the daily PDF report needs for a given date.
   * @param {string} date - 'YYYY-MM-DD' local date
   */
  async getDailyExportData(date) {
    const summaryRows = await db.query(
      `SELECT
         COUNT(*) AS total_count,
         SUM(CASE WHEN sales_type = 'Counter' THEN 1 ELSE 0 END) AS counter_count,
         SUM(CASE WHEN sales_type = 'Counter' THEN net_amount ELSE 0 END) AS counter_total,
         SUM(CASE WHEN sales_type = 'Credit'  THEN 1 ELSE 0 END) AS credit_count,
         SUM(CASE WHEN sales_type = 'Credit'  THEN net_amount ELSE 0 END) AS credit_total,
         COALESCE(SUM(net_amount), 0) AS total_revenue,
         COALESCE(SUM(tax_amount), 0) AS total_tax,
         COALESCE(SUM(discount_on_total + discount_on_items), 0) AS total_discount
       FROM transaction_headers
       WHERE ${localDayOf('created_at')} = ?
         AND transaction_status = 'Done'
         AND is_active = 1`,
      [date]
    );

    const transactions = await db.query(
      `SELECT
         th.id,
         th.created_at,
         th.sales_type,
         th.net_amount,
         c.name AS customer_name,
         (SELECT COALESCE(SUM(qty), 0)
            FROM transaction_details
            WHERE transaction_id = th.id) AS items_count
       FROM transaction_headers th
       LEFT JOIN customers c ON th.customer_id = c.id
       WHERE ${localDayOf('th.created_at')} = ?
         AND th.transaction_status = 'Done'
         AND th.is_active = 1
       ORDER BY th.created_at ASC`,
      [date]
    );

    const topProducts = await db.query(
      `SELECT
         p.name,
         SUM(td.qty) AS qty_sold,
         SUM(td.price) AS revenue
       FROM transaction_details td
       JOIN transaction_headers th ON td.transaction_id = th.id
       JOIN products p ON td.product_id = p.id
       WHERE ${localDayOf('th.created_at')} = ?
         AND th.transaction_status = 'Done'
         AND th.is_active = 1
       GROUP BY p.id
       ORDER BY qty_sold DESC
       LIMIT 10`,
      [date]
    );

    const expenses = await db.query(
      `SELECT
         e.amount,
         COALESCE(et.description, 'Uncategorised') AS type
       FROM expenses e
       LEFT JOIN expense_types et ON e.expense_type_id = et.id
       WHERE DATE(e.spent_at) = ?
       ORDER BY e.spent_at ASC`,
      [date]
    );

    // Money customers paid off their accounts that day, which is cash in
    // the drawer that no sale of the day explains.
    const paymentRows = await db.query(
      `SELECT COALESCE(SUM(amount_paid), 0) AS total
       FROM credit_transactions
       WHERE type = 'Payment' AND ${localDayOf('created_at')} = ?`,
      [date]
    );

    const expensesTotal = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const summary = summaryRows[0] || {};
    const totalRevenue = summary.total_revenue || 0;

    return {
      date,
      summary: {
        totalTransactions: summary.total_count || 0,
        counterCount: summary.counter_count || 0,
        counterTotal: summary.counter_total || 0,
        creditCount: summary.credit_count || 0,
        creditTotal: summary.credit_total || 0,
        totalRevenue,
        totalTax: summary.total_tax || 0,
        totalDiscount: summary.total_discount || 0,
        accountPayments: paymentRows[0]?.total || 0
      },
      transactions,
      topProducts,
      expenses,
      expensesTotal,
      netForDay: totalRevenue - expensesTotal
    };
  }
}

export default new ReportsService();
