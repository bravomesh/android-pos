/**
 * Users Service - Handles user authentication and management
 */

import db from './DatabaseService';
import { hashPassword, verifyPassword, isUnusableHash } from './passwords';

class UsersService {
  /**
   * Authenticate a user against the stored password hash.
   *
   * There is deliberately no special case for the admin account: the previous
   * version accepted admin/admin unconditionally, which meant changing the
   * admin password did nothing and anyone who picked up the tablet could open
   * the till.
   */
  async authenticate(username, password) {
    const users = await db.query(
      'SELECT * FROM users WHERE name = ?',
      [username]
    );

    if (users.length === 0) {
      return null;
    }

    const user = users[0];

    if (!(await verifyPassword(password, user.password))) {
      return null;
    }

    return {
      id: user.id,
      name: user.name,
      role: user.role
    };
  }

  /**
   * True when an account still carries a pre-PBKDF2 value that nothing can
   * authenticate against, so the UI can prompt for a reset instead of
   * repeating "wrong password".
   */
  async needsPasswordReset(username) {
    const users = await db.query('SELECT password FROM users WHERE name = ?', [username]);
    return users.length > 0 && isUnusableHash(users[0].password);
  }

  /**
   * Get all users
   */
  async getAllUsers() {
    const users = await db.query(
      'SELECT id, name, role, created_at, updated_at FROM users ORDER BY name'
    );
    return users;
  }

  /**
   * Get user by ID
   */
  async getUserById(id) {
    const users = await db.query(
      'SELECT id, name, role, created_at, updated_at FROM users WHERE id = ?',
      [id]
    );
    return users[0] || null;
  }

  /**
   * Create a new user
   */
  async createUser(data) {
    const now = new Date().toISOString();

    // Check if username exists
    const existing = await db.query(
      'SELECT id FROM users WHERE name = ?',
      [data.name]
    );

    if (existing.length > 0) {
      throw new Error('Username already exists');
    }

    const hashedPassword = await hashPassword(data.password);

    const result = await db.run(
      `INSERT INTO users (name, password, role, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)`,
      [
        data.name,
        hashedPassword,
        data.role || 'NonAdmin',
        now,
        now
      ]
    );

    return this.getUserById(result.changes.lastId);
  }

  /**
   * Update a user
   */
  async updateUser(id, data) {
    const now = new Date().toISOString();

    // Check if new username conflicts
    if (data.name) {
      const existing = await db.query(
        'SELECT id FROM users WHERE name = ? AND id != ?',
        [data.name, id]
      );

      if (existing.length > 0) {
        throw new Error('Username already exists');
      }
    }

    // Build update query dynamically
    const updates = [];
    const params = [];

    if (data.name) {
      updates.push('name = ?');
      params.push(data.name);
    }

    if (data.password) {
      updates.push('password = ?');
      params.push(await hashPassword(data.password));
    }

    if (data.role) {
      updates.push('role = ?');
      params.push(data.role);
    }

    updates.push('updated_at = ?');
    params.push(now);
    params.push(id);

    await db.run(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    return this.getUserById(id);
  }

  /**
   * Delete a user
   */
  async deleteUser(id) {
    // Don't allow deleting admin user
    const user = await this.getUserById(id);
    if (user?.name === 'admin') {
      throw new Error('Cannot delete admin user');
    }

    await db.run('DELETE FROM users WHERE id = ?', [id]);
    return { success: true };
  }

  /**
   * Set a new password without the old one — for an administrator getting
   * a cashier who forgot theirs back on the till.
   */
  async resetPassword(id, newPassword) {
    const user = await this.getUserById(id);
    if (!user) {
      throw new Error('User not found');
    }

    await db.run(
      'UPDATE users SET password = ?, updated_at = ? WHERE id = ?',
      [await hashPassword(newPassword), new Date().toISOString(), id]
    );

    return { success: true };
  }

  /**
   * Change password
   */
  async changePassword(id, oldPassword, newPassword) {
    const users = await db.query('SELECT * FROM users WHERE id = ?', [id]);

    if (users.length === 0) {
      throw new Error('User not found');
    }

    const user = users[0];

    // The current password is always checked, including for admin.
    if (!(await verifyPassword(oldPassword, user.password))) {
      throw new Error('Current password is incorrect');
    }

    const now = new Date().toISOString();
    const newHash = await hashPassword(newPassword);

    await db.run(
      'UPDATE users SET password = ?, updated_at = ? WHERE id = ?',
      [newHash, now, id]
    );

    return { success: true };
  }
}

export default new UsersService();
