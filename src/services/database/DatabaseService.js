/**
 * Mobile POS - SQLite Database Service
 *
 * This service handles all database operations using Capacitor SQLite plugin.
 * It replaces the backend Node.js/Express API with direct SQLite access.
 */

import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';
import { hashPassword } from './passwords';

class DatabaseService {
  constructor() {
    this.sqlite = null;
    this.db = null;
    this.dbName = 'pos_database';
    this.initialized = false;
    this.transactionDepth = 0;
    this.platform = Capacitor.getPlatform();
  }

  /**
   * Initialize the database connection and create tables
   */
  async initialize() {
    if (this.initialized) {
      return true;
    }

    try {
      this.sqlite = new SQLiteConnection(CapacitorSQLite);

      // For web platform, we need to use jeep-sqlite
      if (this.platform === 'web') {
        await this.initializeWeb();
      }

      // Check connection consistency
      const retCC = (await this.sqlite.checkConnectionsConsistency()).result;
      const isConn = (await this.sqlite.isConnection(this.dbName, false)).result;

      if (retCC && isConn) {
        this.db = await this.sqlite.retrieveConnection(this.dbName, false);
      } else {
        this.db = await this.sqlite.createConnection(
          this.dbName,
          false,
          'no-encryption',
          1,
          false
        );
      }

      await this.db.open();
      await this.createTables();
      await this.runMigrations();
      await this.seedDefaultData();

      this.initialized = true;
      console.log('Database initialized successfully');
      return true;
    } catch (error) {
      console.error('Database initialization error:', error);
      throw error;
    }
  }

  /**
   * Initialize web platform with jeep-sqlite
   */
  async initializeWeb() {
    const jeepSqlite = document.querySelector('jeep-sqlite');
    if (jeepSqlite) {
      await this.sqlite.initWebStore();
    }
  }

  /**
   * Create all database tables
   */
  async createTables() {
    const createTableStatements = `
      -- Users table
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'NonAdmin',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      -- Product Types (Categories)
      CREATE TABLE IF NOT EXISTS product_types (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        description TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      -- Products
      --
      -- sku is the shop's own code (a clothing line uses one per
      -- size/colour variant), barcode is what a scanner reads off the
      -- packaging, unit labels what a quantity of 1 means (pcs, kg, L),
      -- reorder_level is the per-product low-stock trigger, and
      -- track_stock = 0 marks something sold without inventory, such as
      -- alterations or a delivery fee.
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        sku TEXT,
        barcode TEXT,
        unit TEXT NOT NULL DEFAULT 'pcs',
        reorder_level REAL,
        track_stock INTEGER NOT NULL DEFAULT 1,
        cost_price REAL NOT NULL DEFAULT 0,
        selling_price REAL NOT NULL DEFAULT 0,
        product_type_id INTEGER,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        created_by INTEGER,
        updated_by INTEGER,
        FOREIGN KEY (product_type_id) REFERENCES product_types(id)
      );

      -- Stock adjustments: every change to stock that is not a sale or a
      -- receiving. Breakages, spoilage, theft and physical stock-takes all
      -- land here so the movement is auditable instead of a silent edit.
      CREATE TABLE IF NOT EXISTS stock_adjustments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        qty_before REAL NOT NULL DEFAULT 0,
        qty_change REAL NOT NULL DEFAULT 0,
        qty_after REAL NOT NULL DEFAULT 0,
        reason TEXT NOT NULL DEFAULT 'Adjustment',
        notes TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        created_by INTEGER,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      );

      -- Stock (one-to-one with Products)
      CREATE TABLE IF NOT EXISTS stock (
        product_id INTEGER PRIMARY KEY,
        qty REAL NOT NULL DEFAULT 0,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      );

      -- Customers
      CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        address TEXT,
        mobile TEXT,
        email TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      -- Vendors
      CREATE TABLE IF NOT EXISTS vendors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        address TEXT,
        mobile TEXT,
        email TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      -- Transaction ID Generator
      CREATE TABLE IF NOT EXISTS transaction_id (
        id INTEGER PRIMARY KEY,
        count INTEGER NOT NULL DEFAULT 0
      );

      -- Transaction Headers
      CREATE TABLE IF NOT EXISTS transaction_headers (
        id INTEGER PRIMARY KEY,
        bill_amount REAL DEFAULT 0,
        net_amount REAL DEFAULT 0,
        amount_paid REAL DEFAULT 0,
        tax TEXT DEFAULT '0',
        tax_amount REAL DEFAULT 0,
        discount_on_items REAL DEFAULT 0,
        discount_on_total REAL DEFAULT 0,
        sales_type TEXT DEFAULT 'Counter',
        transaction_status TEXT DEFAULT 'Init',
        customer_id INTEGER,
        is_active INTEGER DEFAULT 1,
        comments TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        created_by INTEGER,
        FOREIGN KEY (customer_id) REFERENCES customers(id)
      );

      -- Transaction Details (line items)
      CREATE TABLE IF NOT EXISTS transaction_details (
        transaction_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        qty REAL NOT NULL DEFAULT 0,
        cost_price REAL NOT NULL DEFAULT 0,
        selling_price REAL NOT NULL DEFAULT 0,
        discount REAL DEFAULT 0,
        price REAL NOT NULL DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (transaction_id, product_id),
        FOREIGN KEY (transaction_id) REFERENCES transaction_headers(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id)
      );

      -- Credit Transactions
      CREATE TABLE IF NOT EXISTS credit_transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER NOT NULL,
        transaction_id INTEGER NOT NULL,
        amount_paid REAL DEFAULT 0,
        bill_amount REAL DEFAULT 0,
        balance REAL DEFAULT 0,
        total_debt REAL DEFAULT 0,
        type TEXT DEFAULT 'Sale',
        is_reverted INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id),
        FOREIGN KEY (transaction_id) REFERENCES transaction_headers(id)
      );

      -- Credit Transactions Pointer (for balance optimization)
      CREATE TABLE IF NOT EXISTS credit_transactions_pointer (
        customer_id INTEGER PRIMARY KEY,
        seq_pointer INTEGER DEFAULT 0,
        balance_amount REAL DEFAULT 0,
        FOREIGN KEY (customer_id) REFERENCES customers(id)
      );

      -- Expense Types
      CREATE TABLE IF NOT EXISTS expense_types (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        description TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      -- Expenses
      CREATE TABLE IF NOT EXISTS expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        description TEXT,
        amount REAL NOT NULL DEFAULT 0,
        spent_at TEXT DEFAULT CURRENT_TIMESTAMP,
        expense_type_id INTEGER,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (expense_type_id) REFERENCES expense_types(id)
      );

      -- Receivings (Inventory Purchases)
      CREATE TABLE IF NOT EXISTS receivings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        vendor_id INTEGER,
        qty REAL NOT NULL DEFAULT 0,
        price REAL NOT NULL DEFAULT 0,
        payed_at TEXT DEFAULT CURRENT_TIMESTAMP,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id),
        FOREIGN KEY (vendor_id) REFERENCES vendors(id)
      );

      -- Daily export tracking (backup feature)
      CREATE TABLE IF NOT EXISTS daily_exports (
        date TEXT PRIMARY KEY,
        exported_at TEXT NOT NULL,
        pdf_path TEXT NOT NULL,
        db_path TEXT NOT NULL,
        status TEXT NOT NULL,
        error_message TEXT
      );

      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_products_type ON products(product_type_id);
      CREATE INDEX IF NOT EXISTS idx_stock_qty ON stock(qty);
      CREATE INDEX IF NOT EXISTS idx_transactions_status ON transaction_headers(transaction_status);
      CREATE INDEX IF NOT EXISTS idx_transactions_type ON transaction_headers(sales_type);
      CREATE INDEX IF NOT EXISTS idx_transactions_date ON transaction_headers(created_at);
      CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(spent_at);
      CREATE INDEX IF NOT EXISTS idx_credit_customer ON credit_transactions(customer_id);
      CREATE INDEX IF NOT EXISTS idx_adjustments_product ON stock_adjustments(product_id);
      CREATE INDEX IF NOT EXISTS idx_adjustments_date ON stock_adjustments(created_at);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_products_sku ON products(sku) WHERE sku IS NOT NULL AND sku <> '';
      CREATE UNIQUE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode) WHERE barcode IS NOT NULL AND barcode <> '';
    `;

    await this.db.execute(createTableStatements);
    console.log('Tables created successfully');
  }

  /**
   * Bring an existing database up to the current schema.
   *
   * `CREATE TABLE IF NOT EXISTS` is a no-op once a table exists, so columns
   * added after a shop is already trading have to be applied by hand. Each
   * step is guarded by what the database actually has, making the whole
   * routine safe to re-run on every launch.
   */
  async runMigrations() {
    const columnsOf = async (table) => {
      const info = await this.db.query(`PRAGMA table_info(${table})`);
      return (info.values || []).map((column) => column.name);
    };

    const addColumn = async (table, column, definition) => {
      const existing = await columnsOf(table);
      if (!existing.includes(column)) {
        await this.db.execute(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
        console.log(`[migration] ${table}.${column} added`);
      }
    };

    await addColumn('products', 'sku', 'TEXT');
    await addColumn('products', 'barcode', 'TEXT');
    await addColumn('products', 'unit', "TEXT NOT NULL DEFAULT 'pcs'");
    await addColumn('products', 'reorder_level', 'REAL');
    await addColumn('products', 'track_stock', 'INTEGER NOT NULL DEFAULT 1');

    // Older installs stored no stock row for products created before the
    // stock table was populated on insert; backfill so they are countable.
    await this.db.execute(`
      INSERT INTO stock (product_id, qty, updated_at)
      SELECT p.id, 0, CURRENT_TIMESTAMP FROM products p
      WHERE NOT EXISTS (SELECT 1 FROM stock s WHERE s.product_id = p.id)
    `);

    await this.persistWebStore();
  }

  /**
   * Seed default data (admin user, transaction counter)
   */
  async seedDefaultData() {
    // Check if admin user exists
    const adminCheck = await this.db.query("SELECT * FROM users WHERE name = 'admin'");

    if (adminCheck.values.length === 0) {
      // First run: admin / admin, hashed the same way as any other password.
      // The shop is told to change it before trading (see BUILDING.md); the
      // app no longer accepts this pair once the password has been changed.
      await this.db.run(
        'INSERT INTO users (name, password, role) VALUES (?, ?, ?)',
        ['admin', await hashPassword('admin'), 'Admin']
      );
      console.log('Default admin user created');
    }

    // Initialize transaction counter if not exists
    const counterCheck = await this.db.query("SELECT * FROM transaction_id WHERE id = 1");
    if (counterCheck.values.length === 0) {
      await this.db.run("INSERT INTO transaction_id (id, count) VALUES (1, 0)");
      console.log('Transaction counter initialized');
    }
  }

  /**
   * Execute a query and return results
   */
  async query(sql, params = []) {
    try {
      const result = await this.db.query(sql, params);
      return result.values || [];
    } catch (error) {
      console.error('Query error:', sql, error);
      throw error;
    }
  }

  /**
   * Execute a statement (INSERT, UPDATE, DELETE)
   */
  async run(sql, params = []) {
    try {
      // Inside withTransaction the statement must not open a transaction of
      // its own: on Android that is "Already in transaction", and on the web
      // it would commit the outer transaction half-way through.
      const inTransaction = this.transactionDepth > 0;
      const result = await this.db.run(sql, params, !inTransaction);
      // Inside a transaction the store is flushed once at commit, so a
      // rolled-back write is never snapshotted to IndexedDB.
      if (!inTransaction) {
        await this.persistWebStore();
      }
      return result;
    } catch (error) {
      console.error('Run error:', sql, error);
      throw error;
    }
  }

  /**
   * On web, jeep-sqlite keeps the database in memory; writes are lost on
   * page reload unless flushed to IndexedDB. Native platforms write to a
   * real file, so this is a no-op there.
   */
  async persistWebStore() {
    if (this.platform !== 'web') return;
    try {
      await this.sqlite.saveToStore(this.dbName);
    } catch (error) {
      console.error('saveToStore error:', error);
    }
  }

  /**
   * Run `work` inside a single SQLite transaction, so a failure part-way
   * through leaves no half-applied writes (a sale that deducted stock but
   * never recorded the sale, for example).
   *
   * This uses the plugin's own transaction calls. Raw BEGIN/COMMIT through
   * execute() does not work: execute() wraps itself in a transaction, so on
   * the web the BEGIN is rejected outright, and on Android the BEGIN is
   * undone straight away and the COMMIT then fails after every write has
   * already been saved one by one.
   *
   * Nested calls join the outermost transaction rather than starting a new
   * one, because SQLite does not support nested BEGIN.
   *
   * ponytail: no lock — a write issued from elsewhere while a transaction is
   * open joins it. Fine for one till driven by one cashier; add a queue here
   * if background writers beyond the nightly backup appear.
   */
  async withTransaction(work) {
    if (this.transactionDepth > 0) {
      this.transactionDepth += 1;
      try {
        return await work();
      } finally {
        this.transactionDepth -= 1;
      }
    }

    await this.db.beginTransaction();
    this.transactionDepth = 1;

    try {
      const result = await work();
      await this.db.commitTransaction();
      this.transactionDepth = 0;
      await this.persistWebStore();
      return result;
    } catch (error) {
      this.transactionDepth = 0;
      try {
        await this.db.rollbackTransaction();
      } catch (rollbackError) {
        console.error('Rollback failed:', rollbackError);
      }
      throw error;
    }
  }

  /**
   * Get the next transaction ID
   */
  async getNextTransactionId() {
    // Incremented in SQL so two callers can never be handed the same id.
    await this.run('UPDATE transaction_id SET count = count + 1 WHERE id = 1');
    const result = await this.query('SELECT count FROM transaction_id WHERE id = 1');
    return result[0].count;
  }

  /**
   * Close the database connection
   */
  async close() {
    if (this.db) {
      await this.sqlite.closeConnection(this.dbName, false);
      this.initialized = false;
    }
  }

  /**
   * Every table the app owns, in an order that can be restored top-down
   * without tripping a foreign key.
   */
  static get TABLES() {
    return [
      'users',
      'product_types',
      'products',
      'stock',
      'customers',
      'vendors',
      'transaction_id',
      'transaction_headers',
      'transaction_details',
      'credit_transactions',
      'credit_transactions_pointer',
      'expense_types',
      'expenses',
      'receivings',
      'stock_adjustments',
      'daily_exports'
    ];
  }

  /**
   * Dump the whole database as JSON.
   *
   * The backup used to copy the SQLite file straight off the filesystem,
   * using a path with the package name baked into it — which only held for
   * one build of one app, could catch the file mid-write, and needed
   * storage permissions to read. Reading the tables through the normal
   * connection works on every platform the app runs on, including the web
   * build, and is a format that can be inspected without SQLite to hand.
   */
  async exportAllTables() {
    const tables = {};

    for (const table of DatabaseService.TABLES) {
      try {
        tables[table] = await this.query(`SELECT * FROM ${table}`);
      } catch (error) {
        // A table added in a later version simply has nothing to export
        // from an older database.
        console.warn(`[backup] skipping ${table}:`, error?.message);
        tables[table] = [];
      }
    }

    return {
      format: 'mobile-pos-backup',
      version: 1,
      exportedAt: new Date().toISOString(),
      database: this.dbName,
      platform: this.platform,
      tables
    };
  }
}

// Export singleton instance
const databaseService = new DatabaseService();
export default databaseService;
