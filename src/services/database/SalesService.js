/**
 * Sales Service - Handles all sales/transaction operations
 *
 * This is the core POS service handling:
 * - Transaction initialization
 * - Cart management
 * - Counter sales (cash)
 * - Credit sales (deferred payment)
 * - Stock deduction/restoration
 */

import db from './DatabaseService';
import ProductsService from './ProductsService';

class SalesService {
  // ==================== TRANSACTION INITIALIZATION ====================

  /**
   * Initialize a new transaction and return the transaction ID
   */
  async initTransaction(userId = null) {
    const transactionId = await db.getNextTransactionId();
    const now = new Date().toISOString();

    await db.run(
      `INSERT INTO transaction_headers
        (id, transaction_status, sales_type, is_active, created_at, updated_at, created_by)
       VALUES (?, 'Init', 'Counter', 1, ?, ?, ?)`,
      [transactionId, now, now, userId]
    );

    return transactionId;
  }

  /**
   * Get transaction by ID
   */
  async getTransaction(transactionId) {
    const transactions = await db.query(
      `SELECT
        th.*,
        c.name as customer_name
      FROM transaction_headers th
      LEFT JOIN customers c ON th.customer_id = c.id
      WHERE th.id = ?`,
      [transactionId]
    );
    return transactions[0] || null;
  }

  /**
   * Get transaction with details
   */
  async getTransactionWithDetails(transactionId) {
    const transaction = await this.getTransaction(transactionId);

    if (!transaction) {
      return null;
    }

    const details = await db.query(
      `SELECT
        td.*,
        p.name as product_name,
        p.description as product_description
      FROM transaction_details td
      JOIN products p ON td.product_id = p.id
      WHERE td.transaction_id = ?`,
      [transactionId]
    );

    return {
      ...transaction,
      items: details
    };
  }

  // ==================== CART OPERATIONS ====================

  /**
   * Add or update item in cart
   */
  async updateCart(transactionId, item) {
    const now = new Date().toISOString();

    // Check if item exists in cart
    const existing = await db.query(
      'SELECT * FROM transaction_details WHERE transaction_id = ? AND product_id = ?',
      [transactionId, item.productId]
    );

    // Get product details
    const product = await ProductsService.getProductById(item.productId);

    if (!product) {
      throw new Error('Product not found');
    }

    const qty = item.qty || 1;
    const discount = item.discount || 0;
    const sellingPrice = product.selling_price - discount;
    const price = sellingPrice * qty;

    if (existing.length > 0) {
      // Update existing cart item
      await db.run(
        `UPDATE transaction_details SET
          qty = ?,
          discount = ?,
          selling_price = ?,
          price = ?
        WHERE transaction_id = ? AND product_id = ?`,
        [qty, discount, sellingPrice, price, transactionId, item.productId]
      );
    } else {
      // Insert new cart item
      await db.run(
        `INSERT INTO transaction_details
          (transaction_id, product_id, qty, cost_price, selling_price, discount, price, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          transactionId,
          item.productId,
          qty,
          product.cost_price,
          sellingPrice,
          discount,
          price,
          now
        ]
      );
    }

    // Update transaction status to Pending
    await db.run(
      "UPDATE transaction_headers SET transaction_status = 'Pending', updated_at = ? WHERE id = ?",
      [now, transactionId]
    );

    return this.getTransactionWithDetails(transactionId);
  }

  /**
   * Remove item from cart
   */
  async removeFromCart(transactionId, productId) {
    await db.run(
      'DELETE FROM transaction_details WHERE transaction_id = ? AND product_id = ?',
      [transactionId, productId]
    );

    return this.getTransactionWithDetails(transactionId);
  }

  /**
   * Clear cart (delete all items)
   */
  async clearCart(transactionId) {
    await db.run('DELETE FROM transaction_details WHERE transaction_id = ?', [transactionId]);
    return { success: true };
  }

  // ==================== COUNTER SALE (CASH) ====================

  /**
   * Complete a counter sale (cash payment)
   */
  async checkoutCounterSale(transactionId, saleData) {
    const now = new Date().toISOString();

    // Get all items in the transaction
    const items = await db.query(
      'SELECT * FROM transaction_details WHERE transaction_id = ?',
      [transactionId]
    );

    if (items.length === 0) {
      throw new Error('No items in cart');
    }

    // Validate stock availability for all items
    await this.validateStock(items);

    // Deduct stock for all items
    await this.deductStock(items);

    // Calculate totals
    const billAmount = items.reduce((sum, item) => sum + item.price, 0);
    const discountOnItems = items.reduce((sum, item) => sum + (item.discount * item.qty), 0);
    const discountOnTotal = saleData.discountOnTotal || 0;
    const taxPercent = parseFloat(saleData.tax || '0');
    const subtotal = billAmount - discountOnTotal;
    const taxAmount = subtotal * (taxPercent / 100);
    const netAmount = subtotal + taxAmount;

    // Update transaction header
    await db.run(
      `UPDATE transaction_headers SET
        bill_amount = ?,
        net_amount = ?,
        amount_paid = ?,
        tax = ?,
        tax_amount = ?,
        discount_on_items = ?,
        discount_on_total = ?,
        sales_type = 'Counter',
        transaction_status = 'Done',
        is_active = 1,
        updated_at = ?
      WHERE id = ?`,
      [
        billAmount,
        netAmount,
        saleData.amountPaid || netAmount,
        saleData.tax || '0',
        taxAmount,
        discountOnItems,
        discountOnTotal,
        now,
        transactionId
      ]
    );

    return this.getTransactionWithDetails(transactionId);
  }

  // ==================== CREDIT SALE ====================

  /**
   * Complete a credit sale (deferred payment)
   */
  async checkoutCreditSale(transactionId, saleData) {
    const now = new Date().toISOString();

    if (!saleData.customerId) {
      throw new Error('Customer is required for credit sales');
    }

    // Get all items in the transaction
    const items = await db.query(
      'SELECT * FROM transaction_details WHERE transaction_id = ?',
      [transactionId]
    );

    if (items.length === 0) {
      throw new Error('No items in cart');
    }

    // Validate stock availability for all items
    await this.validateStock(items);

    // Deduct stock for all items
    await this.deductStock(items);

    // Calculate totals
    const billAmount = items.reduce((sum, item) => sum + item.price, 0);
    const discountOnItems = items.reduce((sum, item) => sum + (item.discount * item.qty), 0);
    const discountOnTotal = saleData.discountOnTotal || 0;
    const taxPercent = parseFloat(saleData.tax || '0');
    const subtotal = billAmount - discountOnTotal;
    const taxAmount = subtotal * (taxPercent / 100);
    const netAmount = subtotal + taxAmount;
    const amountPaid = saleData.amountPaid || 0;
    const balance = netAmount - amountPaid;

    // Update transaction header
    await db.run(
      `UPDATE transaction_headers SET
        bill_amount = ?,
        net_amount = ?,
        amount_paid = ?,
        tax = ?,
        tax_amount = ?,
        discount_on_items = ?,
        discount_on_total = ?,
        sales_type = 'Credit',
        transaction_status = 'Done',
        customer_id = ?,
        is_active = 1,
        updated_at = ?
      WHERE id = ?`,
      [
        billAmount,
        netAmount,
        amountPaid,
        saleData.tax || '0',
        taxAmount,
        discountOnItems,
        discountOnTotal,
        saleData.customerId,
        now,
        transactionId
      ]
    );

    // Record credit transaction
    await this.recordCreditTransaction(
      saleData.customerId,
      transactionId,
      netAmount,
      amountPaid,
      'Sale'
    );

    return this.getTransactionWithDetails(transactionId);
  }

  // ==================== STOCK MANAGEMENT ====================

  /**
   * Validate that all items have sufficient stock
   */
  async validateStock(items) {
    for (const item of items) {
      const stock = await ProductsService.getStock(item.product_id);

      if (stock.qty < item.qty) {
        const product = await ProductsService.getProductById(item.product_id);
        throw new Error(
          `Insufficient stock for "${product?.name || 'product'}". Available: ${stock.qty}, Requested: ${item.qty}`
        );
      }
    }
    return true;
  }

  /**
   * Deduct stock for all items in a transaction
   */
  async deductStock(items) {
    for (const item of items) {
      await ProductsService.decrementStock(item.product_id, item.qty);
    }
  }

  /**
   * Restore stock for all items in a transaction (for returns/deletions)
   */
  async restoreStock(items) {
    for (const item of items) {
      await ProductsService.incrementStock(item.product_id, item.qty);
    }
  }

  // ==================== CREDIT TRANSACTIONS ====================

  /**
   * Record a credit transaction
   */
  async recordCreditTransaction(customerId, transactionId, billAmount, amountPaid, type = 'Sale') {
    const now = new Date().toISOString();

    // Get current balance for customer
    const pointer = await db.query(
      'SELECT * FROM credit_transactions_pointer WHERE customer_id = ?',
      [customerId]
    );

    let currentBalance = 0;
    let seqPointer = 0;

    if (pointer.length > 0) {
      currentBalance = pointer[0].balance_amount || 0;
      seqPointer = pointer[0].seq_pointer || 0;
    }

    // Calculate new balance
    let newBalance;
    let totalDebt;

    if (type === 'Sale') {
      newBalance = currentBalance + (billAmount - amountPaid);
      totalDebt = currentBalance + billAmount;
    } else if (type === 'Payment') {
      newBalance = currentBalance - amountPaid;
      totalDebt = currentBalance;
    } else {
      newBalance = currentBalance;
      totalDebt = currentBalance;
    }

    // Insert credit transaction record
    await db.run(
      `INSERT INTO credit_transactions
        (customer_id, transaction_id, amount_paid, bill_amount, balance, total_debt, type, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [customerId, transactionId, amountPaid, billAmount, newBalance, totalDebt, type, now]
    );

    // Update or insert pointer
    if (pointer.length > 0) {
      await db.run(
        'UPDATE credit_transactions_pointer SET balance_amount = ?, seq_pointer = seq_pointer + 1 WHERE customer_id = ?',
        [newBalance, customerId]
      );
    } else {
      await db.run(
        'INSERT INTO credit_transactions_pointer (customer_id, seq_pointer, balance_amount) VALUES (?, 1, ?)',
        [customerId, newBalance]
      );
    }

    return { customerId, balance: newBalance };
  }

  // ==================== SALE DELETION (RETURNS) ====================

  /**
   * Delete/revert a sale (restores stock)
   */
  async deleteSale(transactionId) {
    const transaction = await this.getTransaction(transactionId);

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    // Get items to restore stock
    const items = await db.query(
      'SELECT * FROM transaction_details WHERE transaction_id = ?',
      [transactionId]
    );

    // Restore stock for all items
    await this.restoreStock(items);

    const now = new Date().toISOString();

    // Mark transaction as inactive
    await db.run(
      'UPDATE transaction_headers SET is_active = 0, updated_at = ? WHERE id = ?',
      [now, transactionId]
    );

    // If credit sale, revert the credit transaction
    if (transaction.sales_type === 'Credit' && transaction.customer_id) {
      await this.recordCreditTransaction(
        transaction.customer_id,
        transactionId,
        -transaction.net_amount,
        -transaction.amount_paid,
        'SaleRevertPayment'
      );

      // Mark credit transaction as reverted
      await db.run(
        'UPDATE credit_transactions SET is_reverted = 1 WHERE transaction_id = ?',
        [transactionId]
      );
    }

    return { success: true };
  }

  // ==================== TRANSACTION QUERIES ====================

  /**
   * Get today's transactions
   */
  async getTodayTransactions() {
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

    return transactions;
  }

  /**
   * Get transactions by date range
   */
  async getTransactionsByDateRange(startDate, endDate) {
    const transactions = await db.query(
      `SELECT
        th.*,
        c.name as customer_name
      FROM transaction_headers th
      LEFT JOIN customers c ON th.customer_id = c.id
      WHERE DATE(th.created_at) BETWEEN ? AND ?
        AND th.transaction_status = 'Done'
        AND th.is_active = 1
      ORDER BY th.created_at DESC`,
      [startDate, endDate]
    );

    return transactions;
  }

  /**
   * Get credit transactions for a customer
   */
  async getCustomerCreditHistory(customerId) {
    const history = await db.query(
      `SELECT * FROM credit_transactions
       WHERE customer_id = ? AND is_reverted = 0
       ORDER BY created_at DESC`,
      [customerId]
    );

    return history;
  }
}

export default new SalesService();
