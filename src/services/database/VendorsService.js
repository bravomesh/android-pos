/**
 * Vendors Service - Handles all vendor/supplier operations
 */

import db from './DatabaseService';

class VendorsService {
  /**
   * Get all vendors with optional pagination and search
   */
  async getAllVendors(options = {}) {
    const { page = 1, limit = 50, search = '' } = options;
    const offset = (page - 1) * limit;

    let sql = 'SELECT * FROM vendors';
    const params = [];

    if (search) {
      sql += ' WHERE name LIKE ? OR mobile LIKE ? OR email LIKE ?';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY name';
    sql += ` LIMIT ${limit} OFFSET ${offset}`;

    const vendors = await db.query(sql, params);

    // Get total count
    let countSql = 'SELECT COUNT(*) as total FROM vendors';
    if (search) {
      countSql += ' WHERE name LIKE ? OR mobile LIKE ? OR email LIKE ?';
    }
    const countResult = await db.query(countSql, search ? [`%${search}%`, `%${search}%`, `%${search}%`] : []);
    const total = countResult[0]?.total || 0;

    return {
      list: vendors,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get vendor by ID
   */
  async getVendorById(id) {
    const vendors = await db.query('SELECT * FROM vendors WHERE id = ?', [id]);
    return vendors[0] || null;
  }

  /**
   * Create a new vendor
   */
  async createVendor(data) {
    const now = new Date().toISOString();

    const result = await db.run(
      `INSERT INTO vendors (name, description, address, mobile, email, created_at, updated_at)
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

    return this.getVendorById(result.changes.lastId);
  }

  /**
   * Update a vendor
   */
  async updateVendor(id, data) {
    const now = new Date().toISOString();

    await db.run(
      `UPDATE vendors SET
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

    return this.getVendorById(id);
  }

  /**
   * Delete a vendor
   */
  async deleteVendor(id) {
    await db.run('DELETE FROM vendors WHERE id = ?', [id]);
    return { success: true };
  }
}

export default new VendorsService();
