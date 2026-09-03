/**
 * Receivings Service - Handles inventory purchases/receiving
 */

import db from './DatabaseService';
import { localDay } from './businessDay';
import ProductsService from './ProductsService';

class ReceivingsService {
  /**
   * Get all receivings with optional pagination
   */
  async getAllReceivings(options = {}) {
    const { page = 1, limit = 50 } = options;
    const offset = (page - 1) * limit;

    const receivings = await db.query(
      `SELECT
        r.*,
        p.name as product_name,
        v.name as vendor_name
      FROM receivings r
      LEFT JOIN products p ON r.product_id = p.id
      LEFT JOIN vendors v ON r.vendor_id = v.id
      ORDER BY r.payed_at DESC
      LIMIT ${limit} OFFSET ${offset}`
    );

    const countResult = await db.query('SELECT COUNT(*) as total FROM receivings');
    const total = countResult[0]?.total || 0;

    return {
      list: receivings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get receiving by ID
   */
  async getReceivingById(id) {
    const receivings = await db.query(
      `SELECT
        r.*,
        p.name as product_name,
        v.name as vendor_name
      FROM receivings r
      LEFT JOIN products p ON r.product_id = p.id
      LEFT JOIN vendors v ON r.vendor_id = v.id
      WHERE r.id = ?`,
      [id]
    );
    return receivings[0] || null;
  }

  /**
   * Create a new receiving and increment stock
   */
  async createReceiving(data) {
    const now = new Date().toISOString();
    // payed_at is filtered as a plain calendar date (see businessDay.js),
    // so it defaults to the local day rather than the UTC instant.
    const payedAt = data.payedAt || localDay();

    // Validate product exists
    const product = await ProductsService.getProductById(data.productId);
    if (!product) {
      throw new Error('Product not found');
    }

    // Insert receiving record
    const result = await db.run(
      `INSERT INTO receivings (product_id, vendor_id, qty, price, payed_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        data.productId,
        data.vendorId || null,
        data.qty || 0,
        data.price || 0,
        payedAt,
        now,
        now
      ]
    );

    // Increment stock
    await ProductsService.incrementStock(data.productId, data.qty || 0);

    return this.getReceivingById(result.changes.lastId);
  }

  /**
   * Update a receiving
   * Note: This is complex as it needs to adjust stock
   */
  async updateReceiving(id, data) {
    const now = new Date().toISOString();

    // Get original receiving to calculate stock adjustment
    const original = await this.getReceivingById(id);
    if (!original) {
      throw new Error('Receiving not found');
    }

    // Calculate stock difference
    const qtyDifference = (data.qty || 0) - original.qty;

    // Update receiving record
    await db.run(
      `UPDATE receivings SET
        product_id = ?,
        vendor_id = ?,
        qty = ?,
        price = ?,
        payed_at = ?,
        updated_at = ?
      WHERE id = ?`,
      [
        data.productId || original.product_id,
        data.vendorId || null,
        data.qty || 0,
        data.price || 0,
        data.payedAt || original.payed_at,
        now,
        id
      ]
    );

    // Adjust stock if quantity changed
    if (qtyDifference !== 0) {
      if (qtyDifference > 0) {
        await ProductsService.incrementStock(original.product_id, qtyDifference);
      } else {
        // Decrement stock - need to validate
        const stock = await ProductsService.getStock(original.product_id);
        if (stock.qty < Math.abs(qtyDifference)) {
          throw new Error('Cannot reduce receiving qty below sold quantity');
        }
        await ProductsService.decrementStock(original.product_id, Math.abs(qtyDifference));
      }
    }

    return this.getReceivingById(id);
  }

  /**
   * Delete a receiving and decrement stock
   */
  async deleteReceiving(id) {
    const receiving = await this.getReceivingById(id);
    if (!receiving) {
      throw new Error('Receiving not found');
    }

    // Check if we can decrement stock
    const stock = await ProductsService.getStock(receiving.product_id);
    if (stock.qty < receiving.qty) {
      throw new Error('Cannot delete receiving: stock has been sold');
    }

    // Decrement stock
    await ProductsService.decrementStock(receiving.product_id, receiving.qty);

    // Delete receiving
    await db.run('DELETE FROM receivings WHERE id = ?', [id]);

    return { success: true };
  }

  /**
   * Get receivings by date range
   */
  async getReceivingsByDateRange(startDate, endDate) {
    const receivings = await db.query(
      `SELECT
        r.*,
        p.name as product_name,
        v.name as vendor_name
      FROM receivings r
      LEFT JOIN products p ON r.product_id = p.id
      LEFT JOIN vendors v ON r.vendor_id = v.id
      WHERE DATE(r.payed_at) BETWEEN ? AND ?
      ORDER BY r.payed_at DESC`,
      [startDate, endDate]
    );
    return receivings;
  }

  /**
   * Get total purchases for a date range
   */
  async getTotalPurchases(startDate, endDate) {
    const result = await db.query(
      `SELECT COALESCE(SUM(qty * price), 0) as total
       FROM receivings
       WHERE DATE(payed_at) BETWEEN ? AND ?`,
      [startDate, endDate]
    );
    return result[0]?.total || 0;
  }
}

export default new ReceivingsService();
