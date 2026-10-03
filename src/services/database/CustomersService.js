/**
 * Customers Service - Handles all customer operations
 */

import db from './DatabaseService';
import SalesService from './SalesService';

class CustomersService {
  /**
   * Get all customers with optional pagination and search
   */
  async getAllCustomers(options = {}) {
    const { page = 1, limit = 50, search = '' } = options;
    const offset = (page - 1) * limit;

    // What each customer owes is shown next to their name, so the shop can
    // see at a glance who to chase.
    let sql = `SELECT c.*, COALESCE(ctp.balance_amount, 0) as outstanding_balance
      FROM customers c
      LEFT JOIN credit_transactions_pointer ctp ON c.id = ctp.customer_id`;
    const params = [];

    if (search) {
      sql += ' WHERE c.name LIKE ? OR c.mobile LIKE ? OR c.email LIKE ?';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY c.name';
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
   * Take money from a customer against what they owe.
   *
   * The payment is applied to their unpaid credit sales oldest first, so
   * each sale's amount_paid stays true and the credit reports, which read
   * the sales, agree with the account balance.
   */
  async receivePayment(customerId, amount) {
    const payment = Math.round(Number(amount) * 100) / 100;

    if (!Number.isFinite(payment) || payment <= 0) {
      throw new Error('Enter the amount received');
    }

    return db.withTransaction(async () => {
      const { balance } = await this.getCustomerBalance(customerId);
      if (payment > balance + 0.005) {
        throw new Error(`That is more than the ${balance} this customer owes`);
      }

      const unpaid = await db.query(
        `SELECT id, net_amount, amount_paid FROM transaction_headers
         WHERE customer_id = ? AND sales_type = 'Credit'
           AND transaction_status = 'Done' AND is_active = 1
           AND net_amount - amount_paid > 0.005
         ORDER BY created_at ASC, id ASC`,
        [customerId]
      );

      let remaining = payment;
      const now = new Date().toISOString();

      for (const sale of unpaid) {
        if (remaining <= 0.005) break;
        const applied = Math.min(remaining, sale.net_amount - sale.amount_paid);

        await db.run(
          'UPDATE transaction_headers SET amount_paid = amount_paid + ?, updated_at = ? WHERE id = ?',
          [applied, now, sale.id]
        );
        await SalesService.recordCreditTransaction(customerId, sale.id, 0, applied, 'Payment');
        remaining -= applied;
      }

      return this.getCustomerBalance(customerId);
    });
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
