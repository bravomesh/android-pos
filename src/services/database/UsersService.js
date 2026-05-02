/**
 * Users Service - Handles user authentication and management
 *
 * Note: For mobile offline use, we use a simplified auth without bcrypt.
 * In production, consider using a proper crypto library.
 */

import db from './DatabaseService';

class UsersService {
  /**
   * Simple hash function for offline use
   * In production, use proper crypto/bcrypt
   */
  simpleHash(password) {
    // Simple hash for demo - replace with proper implementation
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `simple_${Math.abs(hash).toString(16)}`;
  }

  /**
   * Authenticate user
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

    // Check password
    // For demo, accept 'admin' password for admin user
    // In production, use proper password comparison
    if (username === 'admin' && password === 'admin') {
      return {
        id: user.id,
        name: user.name,
        role: user.role
      };
    }

    // Check hashed password
    const hashedPassword = this.simpleHash(password);
    if (user.password === hashedPassword) {
      return {
        id: user.id,
        name: user.name,
        role: user.role
      };
    }

    return null;
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

    // Hash password
    const hashedPassword = this.simpleHash(data.password);

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
      params.push(this.simpleHash(data.password));
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
   * Change password
   */
  async changePassword(id, oldPassword, newPassword) {
    const users = await db.query('SELECT * FROM users WHERE id = ?', [id]);

    if (users.length === 0) {
      throw new Error('User not found');
    }

    const user = users[0];

    // Verify old password
    // For admin, accept 'admin' as old password
    if (user.name === 'admin' && oldPassword !== 'admin') {
      const oldHash = this.simpleHash(oldPassword);
      if (user.password !== oldHash) {
        throw new Error('Current password is incorrect');
      }
    }

    // Update password
    const now = new Date().toISOString();
    const newHash = this.simpleHash(newPassword);

    await db.run(
      'UPDATE users SET password = ?, updated_at = ? WHERE id = ?',
      [newHash, now, id]
    );

    return { success: true };
  }
}

export default new UsersService();
