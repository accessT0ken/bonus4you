import { Router, Request } from 'express';
import { param, query, body } from 'express-validator';
import { asyncHandler } from '../middleware/asyncHandler';
import { validate } from '../middleware/validation';
import { requireAuth } from '../middleware/auth';
import { loginRateLimit } from '../middleware/rateLimit';
import { NotFoundError, BadRequestError, UnauthorizedError, ForbiddenError } from '../types/errors';
import pool from '../config/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router: Router = Router();

/**
 * POST /users/login - User login
 * @route POST /users/login
 * @param {string} body.email - User email
 * @param {string} body.password - User password
 * @returns {Object} User data and JWT token
 */
router.post(
  '/login',
  loginRateLimit,
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

    await pool.execute(
      'UPDATE users SET last_login = NOW() WHERE id = ?',
      [user.id]
    );

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET environment variable is not set');
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

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

/**
 * GET /users - List all users (admin/owner only)
 * @route GET /users
 * @requires {string[]} auth - ['admin', 'owner']
 * @param {string} [query.role] - Filter by role (moderator, admin, owner)
 * @param {string} [query.page] - Page number (default: 1)
 * @param {string} [query.limit] - Items per page (default: 10, max: 100)
 * @returns {Object} Paginated list of users
 */
router.get(
  '/',
  requireAuth(['admin', 'owner']),
  validate([
    query('role').optional().isIn(['moderator', 'admin', 'owner']).withMessage('role must be one of: moderator, admin, owner'),
  ]),
  asyncHandler(async (req, res) => {
    const { role, page: pageParam = '1', limit: limitParam } = req.query;
    
    const pageNum = Math.max(parseInt(String(pageParam)) || 1, 1);
    
    let limitNum = 10;
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

/**
 * GET /users/:id - Get user by ID (admin/owner only)
 * @route GET /users/:id
 * @requires {string[]} auth - ['admin', 'owner']
 * @param {string} param.id - User ID
 * @returns {Object} User details
 */
router.get(
  '/:id',
  requireAuth(['admin', 'owner']),
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

/**
 * POST /users - Create new user (admin/owner only)
 * @route POST /users
 * @requires {string[]} auth - ['admin', 'owner']
 * @param {string} body.email - User email
 * @param {string} body.name - User name (1-100 chars)
 * @param {string} body.password - User password (min 8 chars)
 * @param {string} body.role - User role (moderator, admin, owner)
 * @returns {Object} Created user
 */
router.post(
  '/',
  requireAuth(['admin', 'owner']),
  validate([
    body('email').isEmail().withMessage('email must be a valid email address'),
    body('name').trim().isLength({ min: 1, max: 100 }).withMessage('name must be between 1 and 100 characters'),
    body('password').trim().isLength({ min: 8 }).withMessage('password must be at least 8 characters'),
    body('role').isIn(['moderator', 'admin', 'owner']).withMessage('role must be one of: moderator, admin, owner'),
  ]),
  asyncHandler(async (req, res) => {
    const { email, name, password, role } = req.body;

    const [existing] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if ((existing as any[]).length > 0) {
      throw new BadRequestError('User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(password, 10);

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

/**
 * PUT /users/:id - Update user (admin/owner only)
 * @route PUT /users/:id
 * @requires {string[]} auth - ['admin', 'owner']
 * @param {string} param.id - User ID
 * @param {string} [body.name] - User name (1-100 chars)
 * @param {string} [body.role] - User role (moderator, admin, owner)
 * @param {boolean} [body.isActive] - User active status
 * @param {string} [body.password] - New password (min 8 chars)
 * @returns {Object} Updated user
 */
router.put(
  '/:id',
  requireAuth(['admin', 'owner']),
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

    const [existing] = await pool.execute(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    );

    if ((existing as any[]).length === 0) {
      throw new NotFoundError('USER_NOT_FOUND');
    }

    const updateFields: string[] = [];
    const updateValues: any[] = [];

    if (updates.name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(updates.name);
    }

    if (updates.role !== undefined) {
      updateFields.push('role = ?');
      updateValues.push(updates.role);

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
      if (updates.password.length < 8) {
        throw new BadRequestError('password must be at least 8 characters');
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

/**
 * PUT /users/me/password - Update current user's password using JWT
 * @route PUT /users/me/password
 * @requires {string[]} auth - Any authenticated user (any role is fine)
 * @param {string} body.password - New password (min 8 chars)
 * @returns {Object} Success message
 */
router.put(
  '/me/password',
  requireAuth(),
  validate([
    body('password').trim().isLength({ min: 8 }).withMessage('password must be at least 8 characters'),
  ]),
  asyncHandler(async (req: Request, res) => {
    const { password } = req.body;
    const userId = req.user!.userId;

    const passwordHash = await bcrypt.hash(password, 10);

    const [result] = await pool.execute(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [passwordHash, userId]
    );

    const updateResult = result as any;
    if (updateResult.affectedRows === 0) {
      throw new NotFoundError('USER_NOT_FOUND');
    }

    res.json({
      code: 200,
      message: 'Password updated successfully',
    });
  })
);

/**
 * DELETE /users/:id - Delete user (owner only)
 * @route DELETE /users/:id
 * @requires {string[]} auth - ['owner']
 * @param {string} param.id - User ID
 * @returns {Object} Success message
 */
router.delete(
  '/:id',
  requireAuth(['owner']),
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

