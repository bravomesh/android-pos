/**
 * Customers Service - Handles all customer operations
 */

import db from './DatabaseService';

class CustomersService {
  /**
   * Get all customers with optional pagination and search
   */
  async getAllCustomers(options = {}) {
    const { page = 1, limit = 50, search = '' } = options;
    const offset = (page - 1) * limit;

    let sql = 'SELECT * FROM customers';
    const params = [];

    if (search) {
      sql += ' WHERE name LIKE ? OR mobile LIKE ? OR email LIKE ?';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY name';
    sql += ` LIMIT ${limit} OFFSET ${offset}`;

    const customers = await db.query(sql, params);

    // Get total count
    let countSql = 'SELECT COUNT(*) as total FROM customers';
    if (search) {
      countSql += ' WHERE name LIKE ? OR mobile LIKE ? OR email LIKE ?';
    }
    const countResult = await db.query(countSql, search ? [`%${search}%`, `%${search}%`, `%${search}%`] : []);
    const total = countResult[0]?.total || 0;

    return {
      list: customers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get customer by ID
   */
  async getCustomerById(id) {
    const customers = await db.query('SELECT * FROM customers WHERE id = ?', [id]);
    return customers[0] || null;
  }

  /**
   * Create a new customer
   */
  async createCustomer(data) {
    const now = new Date().toISOString();

    const result = await db.run(
      `INSERT INTO customers (name, description, address, mobile, email, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        data.name,
        data.description || '',
        data.address || '',
        data.mobile || '',
        data.email || '',
        now,
        now
      ]
    );

    return this.getCustomerById(result.changes.lastId);
  }

  /**
   * Update a customer
   */
  async updateCustomer(id, data) {
    const now = new Date().toISOString();

    await db.run(
      `UPDATE customers SET
        name = ?,
        description = ?,
        address = ?,
        mobile = ?,
        email = ?,
        updated_at = ?
      WHERE id = ?`,
      [
        data.name,
        data.description || '',
        data.address || '',
        data.mobile || '',
        data.email || '',
        now,
        id
      ]
    );

    return this.getCustomerById(id);
  }

  /**
   * Delete a customer
   */
  async deleteCustomer(id) {
    // Check if customer has credit transactions
    const creditCheck = await db.query(
      'SELECT COUNT(*) as count FROM credit_transactions WHERE customer_id = ?',
      [id]
    );

    if (creditCheck[0]?.count > 0) {
      throw new Error('Cannot delete customer with existing credit transactions');
    }

    await db.run('DELETE FROM customers WHERE id = ?', [id]);
    return { success: true };
  }

  /**
   * Get customer balance (credit outstanding)
   */
  async getCustomerBalance(customerId) {
    const pointer = await db.query(
      'SELECT * FROM credit_transactions_pointer WHERE customer_id = ?',
      [customerId]
    );

    if (pointer.length === 0) {
      return { customerId, balance: 0 };
    }

    return {
      customerId,
      balance: pointer[0].balance_amount || 0
    };
  }

  /**
   * Get customers with outstanding balances
   */
  async getCustomersWithBalance() {
    const customers = await db.query(`
      SELECT
        c.*,
        COALESCE(ctp.balance_amount, 0) as outstanding_balance
      FROM customers c
      LEFT JOIN credit_transactions_pointer ctp ON c.id = ctp.customer_id
      WHERE ctp.balance_amount > 0
      ORDER BY ctp.balance_amount DESC
    `);
    return customers;
  }
}

export default new CustomersService();
