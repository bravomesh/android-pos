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
    const qty = Number(data.qty) || 0;

    if (qty <= 0) {
      throw new Error('Enter how many were received');
    }

    const product = await ProductsService.getProductById(data.productId);
    if (!product) {
      throw new Error('Product not found');
    }

    return db.withTransaction(async () => {
      const result = await db.run(
        `INSERT INTO receivings (product_id, vendor_id, qty, price, payed_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [data.productId, data.vendorId || null, qty, data.price || 0, payedAt, now, now]
      );

      await ProductsService.incrementStock(data.productId, qty);

      return this.getReceivingById(result.changes.lastId);
    });
  }

  /**
   * Take goods that were booked in back off the shelf. Refused when they
   * have already been sold, because the stock is no longer there to remove.
   */
  async takeBack(productId, qty) {
    try {
      await ProductsService.decrementStock(productId, qty);
    } catch (error) {
      throw new Error('Some of the goods on this receiving have already been sold, so it cannot be reduced or removed');
    }
  }

  /**
   * Update a receiving, moving stock to match.
   *
   * If the receiving is switched to another product (booked against the
   * wrong one), its whole quantity moves from the old product to the new.
   */
  async updateReceiving(id, data) {
    const now = new Date().toISOString();

    const original = await this.getReceivingById(id);
    if (!original) {
      throw new Error('Receiving not found');
    }

    const productId = data.productId || original.product_id;
    const qty = Number(data.qty) || 0;

    if (qty <= 0) {
      throw new Error('Enter how many were received');
    }

    return db.withTransaction(async () => {
      if (String(productId) === String(original.product_id)) {
        const difference = qty - original.qty;
        if (difference > 0) await ProductsService.incrementStock(productId, difference);
        if (difference < 0) await this.takeBack(productId, -difference);
      } else {
        await this.takeBack(original.product_id, original.qty);
        await ProductsService.incrementStock(productId, qty);
      }

      await db.run(
        `UPDATE receivings SET
          product_id = ?,
          vendor_id = ?,
          qty = ?,
          price = ?,
          payed_at = ?,
          updated_at = ?
        WHERE id = ?`,
        [productId, data.vendorId || null, qty, data.price || 0, data.payedAt || original.payed_at, now, id]
      );

      return this.getReceivingById(id);
    });
  }

  /**
   * Delete a receiving and decrement stock
   */
  async deleteReceiving(id) {
    const receiving = await this.getReceivingById(id);
    if (!receiving) {
      throw new Error('Receiving not found');
    }

    return db.withTransaction(async () => {
      await this.takeBack(receiving.product_id, receiving.qty);
      await db.run('DELETE FROM receivings WHERE id = ?', [id]);
      return { success: true };
    });
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
