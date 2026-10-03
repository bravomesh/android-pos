/**
 * Products Service - Handles all product and product type operations
 */

import db from './DatabaseService';

// Empty form fields arrive as '' but must be stored as NULL, so that the
// unique indexes on sku/barcode do not treat two blank codes as a clash.
const blankToNull = (value) => {
  if (value === undefined || value === null) return null;
  const trimmed = String(value).trim();
  return trimmed === '' ? null : trimmed;
};

class ProductsService {
  // ==================== PRODUCT TYPES ====================

  /**
   * Get all product types
   */
  async getAllProductTypes() {
    const types = await db.query('SELECT * FROM product_types ORDER BY description');
    return types;
  }

  /**
   * Get product type by ID
   */
  async getProductTypeById(id) {
    const types = await db.query('SELECT * FROM product_types WHERE id = ?', [id]);
    return types[0] || null;
  }

  /**
   * Create a new product type
   */
  async createProductType(data) {
    const result = await db.run(
      'INSERT INTO product_types (description) VALUES (?)',
      [data.description]
    );
    return {
      id: result.changes.lastId,
      description: data.description
    };
  }

  /**
   * Update a product type
   */
  async updateProductType(id, data) {
    await db.run(
      'UPDATE product_types SET description = ? WHERE id = ?',
      [data.description, id]
    );
    return this.getProductTypeById(id);
  }

  /**
   * Delete a product type
   */
  async deleteProductType(id) {
    const used = await db.query('SELECT COUNT(*) as count FROM products WHERE product_type_id = ?', [id]);
    if (used[0]?.count > 0) {
      throw new Error(`This type still has ${used[0].count} products. Move them to another type first`);
    }

    await db.run('DELETE FROM product_types WHERE id = ?', [id]);
    return { success: true };
  }

  // ==================== PRODUCTS ====================

  /**
   * Get all products with optional pagination and search
   */
  async getAllProducts(options = {}) {
    const { page = 1, limit = 50, search = '' } = options;
    const offset = (page - 1) * limit;

    let sql = `
      SELECT
        p.*,
        pt.description as product_type_name,
        COALESCE(s.qty, 0) as stock_qty
      FROM products p
      LEFT JOIN product_types pt ON p.product_type_id = pt.id
      LEFT JOIN stock s ON p.id = s.product_id
    `;

    const params = [];

    // A cashier searches by whatever is to hand: the name, the shelf code,
    // or the barcode they just scanned.
    const searchClause = ' WHERE p.name LIKE ? OR p.sku LIKE ? OR p.barcode LIKE ?';
    if (search) {
      sql += searchClause;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY p.name';
    sql += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const products = await db.query(sql, params);

    // Get total count
    let countSql = 'SELECT COUNT(*) as total FROM products p';
    if (search) {
      countSql += searchClause;
    }
    const countResult = await db.query(
      countSql,
      search ? [`%${search}%`, `%${search}%`, `%${search}%`] : []
    );
    const total = countResult[0]?.total || 0;

    return {
      list: products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get product by ID
   */
  async getProductById(id) {
    const products = await db.query(
      `SELECT
        p.*,
        pt.description as product_type_name,
        COALESCE(s.qty, 0) as stock_qty
      FROM products p
      LEFT JOIN product_types pt ON p.product_type_id = pt.id
      LEFT JOIN stock s ON p.id = s.product_id
      WHERE p.id = ?`,
      [id]
    );
    return products[0] || null;
  }

  /**
   * Create a new product with stock record
   */
  async createProduct(data, userId = null) {
    const now = new Date().toISOString();

    await this.assertCodesAreFree(data);

    return db.withTransaction(async () => {
      const result = await db.run(
        `INSERT INTO products
          (name, description, sku, barcode, unit, reorder_level, track_stock,
           cost_price, selling_price, product_type_id,
           created_at, updated_at, created_by, updated_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.name,
          data.description || '',
          blankToNull(data.sku),
          blankToNull(data.barcode),
          data.unit || 'pcs',
          data.reorderLevel === '' || data.reorderLevel === undefined || data.reorderLevel === null
            ? null
            : Number(data.reorderLevel),
          data.trackStock === false || data.trackStock === 0 || data.trackStock === '0' ? 0 : 1,
          data.costPrice || 0,
          data.sellingPrice || 0,
          data.productTypeId || null,
          now,
          now,
          userId,
          userId
        ]
      );

      const productId = result.changes.lastId;

      await db.run(
        'INSERT INTO stock (product_id, qty, updated_at) VALUES (?, ?, ?)',
        [productId, Number(data.openingStock) || 0, now]
      );

      // An opening balance is a stock movement like any other, so it is
      // recorded rather than appearing from nowhere in the ledger.
      if (Number(data.openingStock) > 0) {
        await db.run(
          `INSERT INTO stock_adjustments
            (product_id, qty_before, qty_change, qty_after, reason, notes, created_at, created_by)
           VALUES (?, 0, ?, ?, 'Opening stock', ?, ?, ?)`,
          [
            productId,
            Number(data.openingStock),
            Number(data.openingStock),
            'Set when the product was created',
            now,
            userId
          ]
        );
      }

      return this.getProductById(productId);
    });
  }

  /**
   * Update a product
   */
  async updateProduct(id, data, userId = null) {
    const now = new Date().toISOString();

    await this.assertCodesAreFree(data, id);

    await db.run(
      `UPDATE products SET
        name = ?,
        description = ?,
        sku = ?,
        barcode = ?,
        unit = ?,
        reorder_level = ?,
        track_stock = ?,
        cost_price = ?,
        selling_price = ?,
        product_type_id = ?,
        updated_at = ?,
        updated_by = ?
      WHERE id = ?`,
      [
        data.name,
        data.description || '',
        blankToNull(data.sku),
        blankToNull(data.barcode),
        data.unit || 'pcs',
        data.reorderLevel === '' || data.reorderLevel === undefined || data.reorderLevel === null
          ? null
          : Number(data.reorderLevel),
        data.trackStock === false || data.trackStock === 0 || data.trackStock === '0' ? 0 : 1,
        data.costPrice || 0,
        data.sellingPrice || 0,
        data.productTypeId || null,
        now,
        userId,
        id
      ]
    );

    return this.getProductById(id);
  }

  /**
   * Delete a product and its stock record
   */
  async deleteProduct(id) {
    // Sales and receivings keep pointing at the product, so it has to stay
    // for the records (and the reports built on them) to make sense.
    const used = await db.query(
      `SELECT
        (SELECT COUNT(*) FROM transaction_details WHERE product_id = ?) +
        (SELECT COUNT(*) FROM receivings WHERE product_id = ?) as count`,
      [id, id]
    );
    if (used[0]?.count > 0) {
      const product = await this.getProductById(id);
      throw new Error(`${product?.name || 'This product'} has been sold or received, so it cannot be deleted`);
    }

    // Stock will be deleted via CASCADE
    await db.run('DELETE FROM products WHERE id = ?', [id]);
    return { success: true };
  }

  /**
   * Refuse a duplicate shelf code or barcode up front, so the cashier gets
   * "SKU already used by X" instead of a raw unique-index error.
   */
  async assertCodesAreFree(data, excludeId = null) {
    for (const field of ['sku', 'barcode']) {
      const value = blankToNull(data[field]);
      if (!value) continue;

      const clash = await db.query(
        `SELECT id, name FROM products WHERE ${field} = ? AND id != ?`,
        [value, excludeId === null ? -1 : excludeId]
      );

      if (clash.length > 0) {
        const label = field === 'sku' ? 'SKU' : 'Barcode';
        throw new Error(`${label} "${value}" is already used by ${clash[0].name}`);
      }
    }
  }

  /**
   * Exact lookup for a scanned barcode or a typed shelf code.
   * Used by the register so scanning adds straight to the cart.
   */
  async findByCode(code) {
    const value = blankToNull(code);
    if (!value) return null;

    const products = await db.query(
      `SELECT
        p.*,
        pt.description as product_type_name,
        COALESCE(s.qty, 0) as stock_qty
      FROM products p
      LEFT JOIN product_types pt ON p.product_type_id = pt.id
      LEFT JOIN stock s ON p.id = s.product_id
      WHERE p.barcode = ? OR p.sku = ?
      LIMIT 1`,
      [value, value]
    );

    return products[0] || null;
  }

  // ==================== STOCK ====================

  /**
   * Get stock for a product
   */
  async getStock(productId) {
    const stock = await db.query(
      'SELECT * FROM stock WHERE product_id = ?',
      [productId]
    );
    return stock[0] || { product_id: productId, qty: 0 };
  }

  /**
   * Set stock to an absolute quantity.
   *
   * Upserts, because products created before the stock row existed (or
   * imported from a backup) would otherwise silently keep a zero balance:
   * an UPDATE against a missing row succeeds while changing nothing.
   */
  async updateStock(productId, qty) {
    const now = new Date().toISOString();
    await db.run(
      `INSERT INTO stock (product_id, qty, updated_at) VALUES (?, ?, ?)
       ON CONFLICT(product_id) DO UPDATE SET qty = excluded.qty, updated_at = excluded.updated_at`,
      [productId, qty, now]
    );
    return this.getStock(productId);
  }

  /**
   * Add to stock (receiving, sale reversal, positive adjustment).
   */
  async incrementStock(productId, amount) {
    const now = new Date().toISOString();
    await db.run(
      `INSERT INTO stock (product_id, qty, updated_at) VALUES (?, ?, ?)
       ON CONFLICT(product_id) DO UPDATE SET qty = qty + excluded.qty, updated_at = excluded.updated_at`,
      [productId, amount, now]
    );
    return this.getStock(productId);
  }

  /**
   * Take from stock, refusing to go negative.
   *
   * The `qty >= ?` guard lives in the UPDATE rather than in a preceding
   * SELECT so the check and the write are one statement, a read-then-write
   * pair can be overtaken by a concurrent sale on the same product.
   */
  async decrementStock(productId, amount) {
    const now = new Date().toISOString();
    const result = await db.run(
      `UPDATE stock SET qty = qty - ?, updated_at = ?
       WHERE product_id = ? AND qty >= ?`,
      [amount, now, productId, amount]
    );

    if (!result?.changes?.changes) {
      const stock = await this.getStock(productId);
      const product = await this.getProductById(productId);
      throw new Error(
        `Insufficient stock for ${product?.name || 'product'}. Available: ${stock.qty}, Requested: ${amount}`
      );
    }

    return this.getStock(productId);
  }

  /**
   * Record a stock movement that is neither a sale nor a receiving.
   *
   * `mode: 'delta'` adds or removes an amount (breakage, spoilage, theft,
   * a returned item put back on the shelf). `mode: 'count'` sets the shelf
   * count from a physical stock-take and stores the difference it implied.
   * Either way the movement is written to stock_adjustments, so a shortfall
   * can be traced later instead of just appearing in the numbers.
   */
  async adjustStock({ productId, mode = 'delta', qty, reason, notes = '' }, userId = null) {
    const amount = Number(qty);

    if (!Number.isFinite(amount)) {
      throw new Error('Enter a valid quantity');
    }

    if (!reason) {
      throw new Error('Choose a reason for the adjustment');
    }

    return db.withTransaction(async () => {
      const product = await this.getProductById(productId);
      if (!product) {
        throw new Error('Product not found');
      }

      const before = Number((await this.getStock(productId)).qty) || 0;
      const after = mode === 'count' ? amount : before + amount;

      if (after < 0) {
        throw new Error(
          `That would take ${product.name} below zero. On hand: ${before}, change: ${amount}`
        );
      }

      const now = new Date().toISOString();
      await this.updateStock(productId, after);

      await db.run(
        `INSERT INTO stock_adjustments
          (product_id, qty_before, qty_change, qty_after, reason, notes, created_at, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [productId, before, after - before, after, reason, notes || '', now, userId]
      );

      return { productId, before, after, change: after - before };
    });
  }

  /**
   * Adjustment history, newest first, optionally for one product.
   */
  async getStockAdjustments({ productId = null, limit = 200 } = {}) {
    const where = productId ? 'WHERE a.product_id = ?' : '';
    const params = productId ? [productId, limit] : [limit];

    return db.query(
      `SELECT a.*, p.name as product_name, p.unit, u.name as user_name
       FROM stock_adjustments a
       JOIN products p ON a.product_id = p.id
       LEFT JOIN users u ON a.created_by = u.id
       ${where}
       ORDER BY a.created_at DESC, a.id DESC
       LIMIT ?`,
      params
    );
  }

  /**
   * Everything a stock-take needs on one screen: what each product should
   * have, valued at cost and at retail.
   */
  async getStockValuation() {
    const rows = await db.query(
      `SELECT
        p.id, p.name, p.sku, p.unit, p.reorder_level, p.track_stock,
        pt.description as category,
        COALESCE(s.qty, 0) as stock_qty,
        p.cost_price, p.selling_price,
        COALESCE(s.qty, 0) * p.cost_price as stock_cost_value,
        COALESCE(s.qty, 0) * p.selling_price as stock_retail_value
      FROM products p
      LEFT JOIN stock s ON p.id = s.product_id
      LEFT JOIN product_types pt ON p.product_type_id = pt.id
      WHERE p.track_stock = 1
      ORDER BY p.name`
    );

    const totals = rows.reduce(
      (acc, row) => ({
        cost: acc.cost + (Number(row.stock_cost_value) || 0),
        retail: acc.retail + (Number(row.stock_retail_value) || 0),
        units: acc.units + (Number(row.stock_qty) || 0)
      }),
      { cost: 0, retail: 0, units: 0 }
    );

    return { products: rows, totals };
  }

  /**
   * Products at or below their reorder level.
   *
   * Each product carries its own level, because "low" means something
   * different for a rack of coats and for a box of sachets. `threshold`
   * is only the fallback for products that have not set one.
   */
  async getLowStockItems(threshold = null) {
    const items = await db.query(
      `SELECT
        p.id, p.name, p.selling_price, p.unit,
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
    return items;
  }
}

export default new ProductsService();
