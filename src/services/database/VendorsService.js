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

    // What the shop still owes each supplier for deliveries bought on credit.
    let sql = `SELECT v.*,
        COALESCE((SELECT SUM(r.qty * r.price - COALESCE(r.amount_paid, r.qty * r.price))
                  FROM receivings r WHERE r.vendor_id = v.id), 0) as owed
      FROM vendors v`;
    const params = [];

    if (search) {
      sql += ' WHERE v.name LIKE ? OR v.mobile LIKE ? OR v.email LIKE ?';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY v.name';
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
   * Record paying a supplier what the shop owes them. The payment is put
   * against their unpaid deliveries oldest first, so each receiving shows
   * what is still owed on it.
   *
   * ponytail: no separate payment ledger, so the date of each supplier
   * payment is not kept; add a vendor_payments table if that is needed.
   */
  async payVendor(vendorId, amount) {
    const payment = Math.round(Number(amount) * 100) / 100;
    if (!Number.isFinite(payment) || payment <= 0) {
      throw new Error('Enter the amount paid');
    }

    return db.withTransaction(async () => {
      const unpaid = await db.query(
        `SELECT id, qty * price - COALESCE(amount_paid, qty * price) as owed, amount_paid
         FROM receivings
         WHERE vendor_id = ? AND qty * price - COALESCE(amount_paid, qty * price) > 0.005
         ORDER BY payed_at ASC, id ASC`,
        [vendorId]
      );
      const owed = unpaid.reduce((sum, r) => sum + r.owed, 0);
      if (payment > owed + 0.005) {
        throw new Error(`That is more than the ${owed} owed to this supplier`);
      }

      let remaining = payment;
      const now = new Date().toISOString();
      for (const row of unpaid) {
        if (remaining <= 0.005) break;
        const applied = Math.min(remaining, row.owed);
        await db.run('UPDATE receivings SET amount_paid = amount_paid + ?, updated_at = ? WHERE id = ?', [applied, now, row.id]);
        remaining -= applied;
      }

      return { vendorId, owed: Math.round((owed - payment) * 100) / 100 };
    });
  }

  /**
   * Delete a vendor
   */
  async deleteVendor(id) {
    const used = await db.query('SELECT COUNT(*) as count FROM receivings WHERE vendor_id = ?', [id]);
    if (used[0]?.count > 0) {
      throw new Error('This vendor has receivings on record, so it cannot be deleted');
    }

    await db.run('DELETE FROM vendors WHERE id = ?', [id]);
    return { success: true };
  }
}

export default new VendorsService();
