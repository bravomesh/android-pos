/**
 * Expenses Service - Handles all expense operations
 */

import db from './DatabaseService';
import { localDay } from './businessDay';

class ExpensesService {
  // ==================== EXPENSE TYPES ====================

  /**
   * Get all expense types
   */
  async getAllExpenseTypes() {
    const types = await db.query('SELECT * FROM expense_types ORDER BY description');
    return types;
  }

  /**
   * Get expense type by ID
   */
  async getExpenseTypeById(id) {
    const types = await db.query('SELECT * FROM expense_types WHERE id = ?', [id]);
    return types[0] || null;
  }

  /**
   * Create a new expense type
   */
  async createExpenseType(data) {
    const now = new Date().toISOString();
    const result = await db.run(
      'INSERT INTO expense_types (description, created_at) VALUES (?, ?)',
      [data.description, now]
    );
    return {
      id: result.changes.lastId,
      description: data.description
    };
  }

  /**
   * Update an expense type
   */
  async updateExpenseType(id, data) {
    await db.run(
      'UPDATE expense_types SET description = ? WHERE id = ?',
      [data.description, id]
    );
    return this.getExpenseTypeById(id);
  }

  /**
   * Delete an expense type
   */
  async deleteExpenseType(id) {
    // Check if any expenses use this type
    const check = await db.query(
      'SELECT COUNT(*) as count FROM expenses WHERE expense_type_id = ?',
      [id]
    );

    if (check[0]?.count > 0) {
      throw new Error('Cannot delete expense type that has associated expenses');
    }

    await db.run('DELETE FROM expense_types WHERE id = ?', [id]);
    return { success: true };
  }

  // ==================== EXPENSES ====================

  /**
   * Get all expenses with optional pagination
   */
  async getAllExpenses(options = {}) {
    const { page = 1, limit = 50 } = options;
    const offset = (page - 1) * limit;

    const expenses = await db.query(
      `SELECT
        e.*,
        et.description as expense_type_name
      FROM expenses e
      LEFT JOIN expense_types et ON e.expense_type_id = et.id
      ORDER BY e.spent_at DESC
      LIMIT ${limit} OFFSET ${offset}`
    );

    const countResult = await db.query('SELECT COUNT(*) as total FROM expenses');
    const total = countResult[0]?.total || 0;

    return {
      list: expenses,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get expense by ID
   */
  async getExpenseById(id) {
    const expenses = await db.query(
      `SELECT
        e.*,
        et.description as expense_type_name
      FROM expenses e
      LEFT JOIN expense_types et ON e.expense_type_id = et.id
      WHERE e.id = ?`,
      [id]
    );
    return expenses[0] || null;
  }

  /**
   * Create a new expense
   */
  async createExpense(data) {
    const now = new Date().toISOString();
    // spent_at is compared as a plain calendar date, so an unspecified date
    // defaults to the local day rather than the UTC instant — otherwise an
    // evening expense in a western timezone books itself to tomorrow.
    const spentAt = data.spentAt || localDay();

    const result = await db.run(
      `INSERT INTO expenses (description, amount, spent_at, expense_type_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        data.description || '',
        data.amount || 0,
        spentAt,
        data.expenseTypeId || null,
        now,
        now
      ]
    );

    return this.getExpenseById(result.changes.lastId);
  }

  /**
   * Update an expense
   */
  async updateExpense(id, data) {
    const now = new Date().toISOString();

    await db.run(
      `UPDATE expenses SET
        description = ?,
        amount = ?,
        spent_at = ?,
        expense_type_id = ?,
        updated_at = ?
      WHERE id = ?`,
      [
        data.description || '',
        data.amount || 0,
        data.spentAt || now,
        data.expenseTypeId || null,
        now,
        id
      ]
    );

    return this.getExpenseById(id);
  }

  /**
   * Delete an expense
   */
  async deleteExpense(id) {
    await db.run('DELETE FROM expenses WHERE id = ?', [id]);
    return { success: true };
  }

  /**
   * Get expenses by date range
   */
  async getExpensesByDateRange(startDate, endDate) {
    const expenses = await db.query(
      `SELECT
        e.*,
        et.description as expense_type_name
      FROM expenses e
      LEFT JOIN expense_types et ON e.expense_type_id = et.id
      WHERE DATE(e.spent_at) BETWEEN ? AND ?
      ORDER BY e.spent_at DESC`,
      [startDate, endDate]
    );
    return expenses;
  }

  /**
   * Get total expenses for a date range
   */
  async getTotalExpenses(startDate, endDate) {
    const result = await db.query(
      `SELECT COALESCE(SUM(amount), 0) as total
       FROM expenses
       WHERE DATE(spent_at) BETWEEN ? AND ?`,
      [startDate, endDate]
    );
    return result[0]?.total || 0;
  }
}

export default new ExpensesService();
