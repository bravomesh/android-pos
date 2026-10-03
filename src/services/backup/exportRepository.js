import db from '../database/DatabaseService';

const exportRepository = {
  async getLatest() {
    const rows = await db.query(
      'SELECT * FROM daily_exports ORDER BY date DESC LIMIT 1'
    );
    return rows[0] || null;
  },

  async getLatestSuccess() {
    const rows = await db.query(
      "SELECT * FROM daily_exports WHERE status = 'success' ORDER BY date DESC LIMIT 1"
    );
    return rows[0] || null;
  },

  async getByDate(date) {
    const rows = await db.query(
      'SELECT * FROM daily_exports WHERE date = ?',
      [date]
    );
    return rows[0] || null;
  },

  async upsertSuccess({ date, exportedAt, pdfPath, dbPath }) {
    await db.run(
      `INSERT OR REPLACE INTO daily_exports
       (date, exported_at, pdf_path, db_path, status, error_message)
       VALUES (?, ?, ?, ?, 'success', NULL)`,
      [date, exportedAt, pdfPath, dbPath]
    );
  },

  async upsertError({ date, exportedAt, message }) {
    await db.run(
      `INSERT OR REPLACE INTO daily_exports
       (date, exported_at, pdf_path, db_path, status, error_message)
       VALUES (?, ?, '', '', 'error', ?)`,
      [date, exportedAt, message]
    );
  }
};

export default exportRepository;
