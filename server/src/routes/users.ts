import { Router } from 'express';
import { param, query, body } from 'express-validator';
import { asyncHandler } from '../middleware/asyncHandler';
import { validate } from '../middleware/validation';
import { NotFoundError, BadRequestError, UnauthorizedError } from '../types/errors';
import pool from '../config/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = Router();

// POST /users/login - User login
router.post(
  '/login',
  validate([
    body('email').isEmail().withMessage('email must be a valid email address'),
    body('password').trim().isLength({ min: 1 }).withMessage('password is required'),
  ]),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE email = ? AND is_active = 1',
      [email]
    );

    const users = rows as any[];

    if (users.length === 0) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const user = users[0];
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Update last login
    await pool.execute(
      'UPDATE users SET last_login = NOW() WHERE id = ?',
      [user.id]
    );

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    // Parse permissions
    const permissions = user.permissions ? JSON.parse(user.permissions) : [];

    res.json({
      code: 200,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          permissions,
          isActive: user.is_active === 1,
          lastLogin: user.last_login,
        },
        token,
      },
      message: 'Login successful',
    });
  })
);

// GET /users - List all users
router.get(
  '/',
  validate([
    query('role').optional().isIn(['moderator', 'admin', 'owner']).withMessage('role must be one of: moderator, admin, owner'),
    // Page and limit are sanitized in the route handler, no validation needed to avoid errors
  ]),
  asyncHandler(async (req, res) => {
    const { role, page: pageParam = '1', limit: limitParam } = req.query;
    
    // Sanitize and validate page
    const pageNum = Math.max(parseInt(String(pageParam)) || 1, 1);
    
    // Sanitize and validate limit (default to 10 if not provided, clamp to 1-100)
    let limitNum = 10; // Default
    if (limitParam !== undefined && limitParam !== null && limitParam !== '') {
      const parsed = parseInt(String(limitParam));
      if (!isNaN(parsed) && parsed > 0) {
        limitNum = Math.min(Math.max(parsed, 1), 100);
      }
    }
    const offset = (pageNum - 1) * limitNum;

    let whereConditions: string[] = [];
    let queryParams: any[] = [];

    if (role) {
      whereConditions.push('role = ?');
      queryParams.push(role);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    const [rows] = await pool.execute(
      `SELECT id, email, name, role, permissions, is_active, created_at, last_login FROM users ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...queryParams, limitNum, offset]
    );

    const [countRows] = await pool.execute(
      `SELECT COUNT(*) as total FROM users ${whereClause}`,
      queryParams
    );
    const total = (countRows as any[])[0].total;

    // Parse JSON fields
    const users = (rows as any[]).map(user => {
      let permissions = []
      try {
        permissions = user.permissions ? JSON.parse(user.permissions) : []
      } catch (e) {
        console.error('Failed to parse permissions for user:', user.id, e)
        permissions = []
      }
      return {
        ...user,
        permissions,
        isActive: user.is_active === 1,
      }
    });

    res.json({
      code: 200,
      data: users,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  })
);

// GET /users/:id - Get user by ID
router.get(
  '/:id',
  validate([
    param('id').matches(/^\d+$/).withMessage('Validation failed (numeric string is expected)'),
  ]),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = parseInt(id);

    const [rows] = await pool.execute(
      'SELECT id, email, name, role, permissions, is_active, created_at, last_login FROM users WHERE id = ?',
      [userId]
    );

    const users = rows as any[];

    if (users.length === 0) {
      throw new NotFoundError('USER_NOT_FOUND');
    }

    const user = users[0];
    const result = {
      ...user,
      permissions: user.permissions ? JSON.parse(user.permissions) : [],
      isActive: user.is_active === 1,
    };

    res.json({
      code: 200,
      data: result,
    });
  })
);

// POST /users - Create new user
router.post(
  '/',
  validate([
    body('email').isEmail().withMessage('email must be a valid email address'),
    body('name').trim().isLength({ min: 1, max: 100 }).withMessage('name must be between 1 and 100 characters'),
    body('password').trim().isLength({ min: 6 }).withMessage('password must be at least 6 characters'),
    body('role').isIn(['moderator', 'admin', 'owner']).withMessage('role must be one of: moderator, admin, owner'),
  ]),
  asyncHandler(async (req, res) => {
    const { email, name, password, role } = req.body;

    // Check if email already exists
    const [existing] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if ((existing as any[]).length > 0) {
      throw new BadRequestError('User with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Get permissions based on role
    const rolePermissions: Record<string, string[]> = {
      moderator: ['manage_casinos', 'edit_reviews', 'view_stats', 'publish_content'],
      admin: ['manage_users', 'manage_casinos', 'edit_reviews', 'view_stats', 'publish_content'],
      owner: ['manage_users', 'manage_casinos', 'edit_reviews', 'view_stats', 'publish_content', 'manage_system'],
    };

    const permissions = rolePermissions[role] || [];

    const [result] = await pool.execute(
      `INSERT INTO users (email, name, password_hash, role, permissions, is_active)
       VALUES (?, ?, ?, ?, ?, 1)`,
      [email, name, passwordHash, role, JSON.stringify(permissions)]
    );

    const insertResult = result as any;
    const [newUser] = await pool.execute(
      'SELECT id, email, name, role, permissions, is_active, created_at, last_login FROM users WHERE id = ?',
      [insertResult.insertId]
    );

    const user = (newUser as any[])[0];
    const response = {
      ...user,
      permissions: user.permissions ? JSON.parse(user.permissions) : [],
      isActive: user.is_active === 1,
    };

    res.status(201).json({
      code: 201,
      data: response,
      message: 'User created successfully',
    });
  })
);

// PUT /users/:id - Update user
router.put(
  '/:id',
  validate([
    param('id').matches(/^\d+$/).withMessage('Validation failed (numeric string is expected)'),
    body('name').optional().trim().isLength({ min: 1, max: 100 }).withMessage('name must be between 1 and 100 characters'),
    body('role').optional().isIn(['moderator', 'admin', 'owner']).withMessage('role must be one of: moderator, admin, owner'),
    body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
  ]),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = parseInt(id);
    const updates = req.body;

    // Check if user exists
    const [existing] = await pool.execute(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    );

    if ((existing as any[]).length === 0) {
      throw new NotFoundError('USER_NOT_FOUND');
    }

    // Build update query dynamically
    const updateFields: string[] = [];
    const updateValues: any[] = [];

    if (updates.name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(updates.name);
    }

    if (updates.role !== undefined) {
      updateFields.push('role = ?');
      updateValues.push(updates.role);

      // Update permissions based on role
      const rolePermissions: Record<string, string[]> = {
        moderator: ['manage_casinos', 'edit_reviews', 'view_stats', 'publish_content'],
        admin: ['manage_users', 'manage_casinos', 'edit_reviews', 'view_stats', 'publish_content'],
        owner: ['manage_users', 'manage_casinos', 'edit_reviews', 'view_stats', 'publish_content', 'manage_system'],
      };
      const permissions = rolePermissions[updates.role] || [];
      updateFields.push('permissions = ?');
      updateValues.push(JSON.stringify(permissions));
    }

    if (updates.isActive !== undefined) {
      updateFields.push('is_active = ?');
      updateValues.push(updates.isActive ? 1 : 0);
    }

    if (updates.password !== undefined) {
      if (updates.password.length < 6) {
        throw new BadRequestError('password must be at least 6 characters');
      }
      const passwordHash = await bcrypt.hash(updates.password, 10);
      updateFields.push('password_hash = ?');
      updateValues.push(passwordHash);
    }

    if (updateFields.length === 0) {
      throw new BadRequestError('No fields to update');
    }

    updateValues.push(userId);

    await pool.execute(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    const [updated] = await pool.execute(
      'SELECT id, email, name, role, permissions, is_active, created_at, last_login FROM users WHERE id = ?',
      [userId]
    );

    const user = (updated as any[])[0];
    const response = {
      ...user,
      permissions: user.permissions ? JSON.parse(user.permissions) : [],
      isActive: user.is_active === 1,
    };

    res.json({
      code: 200,
      data: response,
      message: 'User updated successfully',
    });
  })
);

// DELETE /users/:id - Delete user
router.delete(
  '/:id',
  validate([
    param('id').matches(/^\d+$/).withMessage('Validation failed (numeric string is expected)'),
  ]),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = parseInt(id);

    const [existing] = await pool.execute(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    );

    if ((existing as any[]).length === 0) {
      throw new NotFoundError('USER_NOT_FOUND');
    }

    await pool.execute('DELETE FROM users WHERE id = ?', [userId]);

    res.json({
      code: 200,
      message: 'User deleted successfully',
    });
  })
);

export default router;

