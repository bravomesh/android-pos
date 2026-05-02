/**
 * Reports Service - Handles all reporting and analytics
 */

import db from './DatabaseService';

class ReportsService {
  /**
   * Get dashboard metrics
   */
  async getDashboardMetrics(startDate = null, endDate = null) {
    const today = new Date().toISOString().split('T')[0];
    const start = startDate || today;
    const end = endDate || today;

    // Total transactions
    const transactionsResult = await db.query(
      `SELECT
        COUNT(*) as total_transactions,
        COALESCE(SUM(net_amount), 0) as total_sales,
        COALESCE(SUM(CASE WHEN sales_type = 'Credit' THEN net_amount - amount_paid ELSE 0 END), 0) as credit_outstanding
      FROM transaction_headers
      WHERE DATE(created_at) BETWEEN ? AND ?
        AND transaction_status = 'Done'
        AND is_active = 1`,
      [start, end]
    );

    // Total items sold
    const itemsResult = await db.query(
      `SELECT COALESCE(SUM(td.qty), 0) as items_sold
       FROM transaction_details td
       JOIN transaction_headers th ON td.transaction_id = th.id
       WHERE DATE(th.created_at) BETWEEN ? AND ?
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
       FROM stock
       WHERE qty <= 10`
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
    const today = new Date().toISOString().split('T')[0];

    const transactions = await db.query(
      `SELECT
        th.*,
        c.name as customer_name
      FROM transaction_headers th
      LEFT JOIN customers c ON th.customer_id = c.id
      WHERE DATE(th.created_at) = ?
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
      WHERE DATE(created_at) = ?
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
    const today = new Date().toISOString().split('T')[0];
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
        AND DATE(th.created_at) BETWEEN ? AND ?
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
        AND DATE(created_at) BETWEEN ? AND ?
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
    const today = new Date().toISOString().split('T')[0];
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
    const today = new Date().toISOString().split('T')[0];
    const start = startDate || '1970-01-01';
    const end = endDate || today;

    const productSales = await db.query(
      `SELECT
        p.id,
        p.name,
        p.cost_price,
        p.selling_price,
        COALESCE(SUM(td.qty), 0) as qty_sold,
        COALESCE(SUM(td.price), 0) as revenue,
        COALESCE(SUM(td.qty * td.cost_price), 0) as cost,
        COALESCE(SUM(td.price) - SUM(td.qty * td.cost_price), 0) as profit,
        s.qty as current_stock
      FROM products p
      LEFT JOIN transaction_details td ON p.id = td.product_id
      LEFT JOIN transaction_headers th ON td.transaction_id = th.id
        AND DATE(th.created_at) BETWEEN ? AND ?
        AND th.transaction_status = 'Done'
        AND th.is_active = 1
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
  async getLowStockItems(threshold = 10) {
    const items = await db.query(
      `SELECT
        p.id,
        p.name,
        p.selling_price,
        p.cost_price,
        s.qty as stock_qty,
        pt.description as category
      FROM products p
      JOIN stock s ON p.id = s.product_id
      LEFT JOIN product_types pt ON p.product_type_id = pt.id
      WHERE s.qty <= ?
      ORDER BY s.qty ASC`,
      [threshold]
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
    const today = new Date().toISOString().split('T')[0];
    const start = startDate || today;
    const end = endDate || today;

    // Revenue from sales
    const revenueResult = await db.query(
      `SELECT COALESCE(SUM(net_amount), 0) as revenue
       FROM transaction_headers
       WHERE DATE(created_at) BETWEEN ? AND ?
         AND transaction_status = 'Done'
         AND is_active = 1`,
      [start, end]
    );

    // Cost of goods sold
    const cogsResult = await db.query(
      `SELECT COALESCE(SUM(td.qty * td.cost_price), 0) as cogs
       FROM transaction_details td
       JOIN transaction_headers th ON td.transaction_id = th.id
       WHERE DATE(th.created_at) BETWEEN ? AND ?
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
}

export default new ReportsService();
