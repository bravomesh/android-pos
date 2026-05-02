/**
 * Products Service - Handles all product and product type operations
 */

import db from './DatabaseService';

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

    if (search) {
      sql += ' WHERE p.name LIKE ?';
      params.push(`%${search}%`);
    }

    sql += ' ORDER BY p.name';
    sql += ` LIMIT ${limit} OFFSET ${offset}`;

    const products = await db.query(sql, params);

    // Get total count
    let countSql = 'SELECT COUNT(*) as total FROM products';
    if (search) {
      countSql += ' WHERE name LIKE ?';
    }
    const countResult = await db.query(countSql, search ? [`%${search}%`] : []);
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

    // Insert product
    const result = await db.run(
      `INSERT INTO products (name, description, cost_price, selling_price, product_type_id, created_at, updated_at, created_by, updated_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.name,
        data.description || '',
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

    // Create stock record with qty = 0
    await db.run(
      'INSERT INTO stock (product_id, qty, updated_at) VALUES (?, 0, ?)',
      [productId, now]
    );

    return this.getProductById(productId);
  }

  /**
   * Update a product
   */
  async updateProduct(id, data, userId = null) {
    const now = new Date().toISOString();

    await db.run(
      `UPDATE products SET
        name = ?,
        description = ?,
        cost_price = ?,
        selling_price = ?,
        product_type_id = ?,
        updated_at = ?,
        updated_by = ?
      WHERE id = ?`,
      [
        data.name,
        data.description || '',
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
    // Stock will be deleted via CASCADE
    await db.run('DELETE FROM products WHERE id = ?', [id]);
    return { success: true };
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
   * Update stock quantity
   */
  async updateStock(productId, qty) {
    const now = new Date().toISOString();
    await db.run(
      'UPDATE stock SET qty = ?, updated_at = ? WHERE product_id = ?',
      [qty, now, productId]
    );
    return this.getStock(productId);
  }

  /**
   * Increment stock quantity
   */
  async incrementStock(productId, amount) {
    const now = new Date().toISOString();
    await db.run(
      'UPDATE stock SET qty = qty + ?, updated_at = ? WHERE product_id = ?',
      [amount, now, productId]
    );
    return this.getStock(productId);
  }

  /**
   * Decrement stock quantity (with validation)
   */
  async decrementStock(productId, amount) {
    const stock = await this.getStock(productId);

    if (stock.qty < amount) {
      const product = await this.getProductById(productId);
      throw new Error(`Insufficient stock for ${product?.name || 'product'}. Available: ${stock.qty}, Requested: ${amount}`);
    }

    const now = new Date().toISOString();
    await db.run(
      'UPDATE stock SET qty = qty - ?, updated_at = ? WHERE product_id = ?',
      [amount, now, productId]
    );
    return this.getStock(productId);
  }

  /**
   * Get low stock items
   */
  async getLowStockItems(threshold = 10) {
    const items = await db.query(
      `SELECT
        p.id, p.name, p.selling_price,
        s.qty as stock_qty,
        pt.description as category
      FROM products p
      JOIN stock s ON p.id = s.product_id
      LEFT JOIN product_types pt ON p.product_type_id = pt.id
      WHERE s.qty <= ?
      ORDER BY s.qty ASC`,
      [threshold]
    );
    return items;
  }
}

export default new ProductsService();
