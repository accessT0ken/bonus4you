import { Router } from 'express';
import { param, query, body } from 'express-validator';
import { asyncHandler } from '../middleware/asyncHandler';
import { validate } from '../middleware/validation';
import { requireAuth } from '../middleware/auth';
import { NotFoundError, BadRequestError } from '../types/errors';
import pool from '../config/database';

const router = Router();

/**
 * GET /blogs - List all blogs with filtering
 * @route GET /blogs
 * @param {string} [query.status] - Filter by status (draft, published)
 * @param {string} [query.category] - Filter by category (max 100 chars)
 * @param {string} [query.page] - Page number (default: 1)
 * @param {string} [query.limit] - Items per page (default: 10, max: 100)
 * @returns {Object} Paginated list of blogs
 */
router.get(
  '/',
  validate([
    query('status').optional().isIn(['draft', 'published']).withMessage('status must be either "draft" or "published"'),
    query('category').optional().trim().isLength({ max: 100 }).withMessage('category must be shorter than or equal to 100 characters'),
  ]),
  asyncHandler(async (req, res) => {
    const { status, category, page: pageParam = '1', limit: limitParam } = req.query;
    
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

    if (status) {
      whereConditions.push('status = ?');
      queryParams.push(status);
    }

    if (category) {
      whereConditions.push('category = ?');
      queryParams.push(category);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    const [rows] = await pool.execute(
      `SELECT * FROM blogs ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...queryParams, limitNum, offset]
    );

    const [countRows] = await pool.execute(
      `SELECT COUNT(*) as total FROM blogs ${whereClause}`,
      queryParams
    );
    const total = (countRows as any[])[0].total;

    const blogs = (rows as any[]).map(blog => ({
      ...blog,
      tags: blog.tags ? JSON.parse(blog.tags) : [],
    }));

    res.json({
      code: 200,
      data: blogs,
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
 * GET /blogs/:slug - Get blog by slug
 * @route GET /blogs/:slug
 * @param {string} param.slug - Blog slug
 * @returns {Object} Blog details
 */
router.get(
  '/:slug',
  validate([
    param('slug').trim().notEmpty().withMessage('slug is required'),
  ]),
  asyncHandler(async (req, res) => {
    const { slug } = req.params;

    const [rows] = await pool.execute(
      'SELECT * FROM blogs WHERE slug = ?',
      [slug]
    );

    const blogs = rows as any[];

    if (blogs.length === 0) {
      throw new NotFoundError('BLOG_NOT_FOUND');
    }

    const blog = blogs[0];
    const result = {
      ...blog,
      tags: blog.tags ? JSON.parse(blog.tags) : [],
    };

    res.json({
      code: 200,
      data: result,
    });
  })
);

/**
 * POST /blogs - Create new blog (moderator/admin/owner only)
 * @route POST /blogs
 * @requires {string[]} auth - ['moderator', 'admin', 'owner']
 * @param {string} body.title - Blog title (1-200 chars)
 * @param {string} body.slug - Blog slug (1-200 chars)
 * @param {string} body.excerpt - Blog excerpt (1-500 chars)
 * @param {string} body.content - Blog content
 * @param {string} [body.status] - Status (draft, published)
 * @param {string} [body.author] - Author name (max 100 chars)
 * @param {string} [body.category] - Category (max 100 chars)
 * @param {string[]} [body.tags] - Tags array
 * @returns {Object} Created blog
 */
router.post(
  '/',
  requireAuth(['moderator', 'admin', 'owner']),
  validate([
    body('title').trim().isLength({ min: 1, max: 200 }).withMessage('title must be between 1 and 200 characters'),
    body('slug').trim().isLength({ min: 1, max: 200 }).withMessage('slug must be between 1 and 200 characters'),
    body('excerpt').trim().isLength({ min: 1, max: 500 }).withMessage('excerpt must be between 1 and 500 characters'),
    body('content').trim().isLength({ min: 1 }).withMessage('content is required'),
    body('status').optional().isIn(['draft', 'published']).withMessage('status must be either "draft" or "published"'),
    body('author').optional().trim().isLength({ max: 100 }).withMessage('author must be shorter than or equal to 100 characters'),
    body('category').optional().trim().isLength({ max: 100 }).withMessage('category must be shorter than or equal to 100 characters'),
    body('tags').optional().isArray().withMessage('tags must be an array'),
  ]),
  asyncHandler(async (req, res) => {
    const {
      title,
      slug,
      excerpt,
      content,
      status = 'draft',
      author,
      category,
      featuredImage,
      readTime,
      tags = [],
    } = req.body;

    const [existing] = await pool.execute(
      'SELECT id FROM blogs WHERE slug = ?',
      [slug]
    );

    if ((existing as any[]).length > 0) {
      throw new BadRequestError('Blog with this slug already exists');
    }

    const [result] = await pool.execute(
      `INSERT INTO blogs (
        title, slug, excerpt, content, status, author, category, featured_image, read_time, tags
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        slug,
        excerpt,
        content,
        status,
        author || null,
        category || null,
        featuredImage || null,
        readTime || null,
        JSON.stringify(tags),
      ]
    );

    const insertResult = result as any;
    const [newBlog] = await pool.execute(
      'SELECT * FROM blogs WHERE id = ?',
      [insertResult.insertId]
    );

    const blog = (newBlog as any[])[0];
    const response = {
      ...blog,
      tags: blog.tags ? JSON.parse(blog.tags) : [],
    };

    res.status(201).json({
      code: 201,
      data: response,
      message: 'Blog created successfully',
    });
  })
);

/**
 * PUT /blogs/:id - Update blog (moderator/admin/owner only)
 * @route PUT /blogs/:id
 * @requires {string[]} auth - ['moderator', 'admin', 'owner']
 * @param {string} param.id - Blog ID
 * @param {string} [body.title] - Blog title (1-200 chars)
 * @param {string} [body.slug] - Blog slug (1-200 chars)
 * @param {string} [body.excerpt] - Blog excerpt (1-500 chars)
 * @param {string} [body.content] - Blog content
 * @returns {Object} Updated blog
 */
router.put(
  '/:id',
  requireAuth(['moderator', 'admin', 'owner']),
  validate([
    param('id').matches(/^\d+$/).withMessage('Validation failed (numeric string is expected)'),
    body('title').optional().trim().isLength({ min: 1, max: 200 }).withMessage('title must be between 1 and 200 characters'),
    body('slug').optional().trim().isLength({ min: 1, max: 200 }).withMessage('slug must be between 1 and 200 characters'),
    body('excerpt').optional().trim().isLength({ min: 1, max: 500 }).withMessage('excerpt must be between 1 and 500 characters'),
    body('content').optional().trim().isLength({ min: 1 }).withMessage('content cannot be empty'),
  ]),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const blogId = parseInt(id);
    const updates = req.body;

    const [existing] = await pool.execute(
      'SELECT * FROM blogs WHERE id = ?',
      [blogId]
    );

    if ((existing as any[]).length === 0) {
      throw new NotFoundError('BLOG_NOT_FOUND');
    }

    if (updates.slug) {
      const [slugCheck] = await pool.execute(
        'SELECT id FROM blogs WHERE slug = ? AND id != ?',
        [updates.slug, blogId]
      );
      if ((slugCheck as any[]).length > 0) {
        throw new BadRequestError('Blog with this slug already exists');
      }
    }

    const updateFields: string[] = [];
    const updateValues: any[] = [];

    const allowedFields = [
      'title', 'slug', 'excerpt', 'content', 'status', 'author', 'category',
      'featured_image', 'read_time', 'tags'
    ];

    Object.keys(updates).forEach((key) => {
      if (updates[key] !== undefined) {
        if (key === 'tags') {
          updateFields.push('tags = ?');
          updateValues.push(JSON.stringify(updates[key]));
        } else if (key === 'featuredImage') {
          updateFields.push('featured_image = ?');
          updateValues.push(updates[key]);
        } else if (key === 'readTime') {
          updateFields.push('read_time = ?');
          updateValues.push(updates[key]);
        } else {
          const dbField = key;
          if (allowedFields.includes(dbField)) {
            updateFields.push(`${dbField} = ?`);
            updateValues.push(updates[key]);
          }
        }
      }
    });

    if (updateFields.length === 0) {
      throw new BadRequestError('No fields to update');
    }

    updateFields.push('updated_at = NOW()');
    updateValues.push(blogId);

    await pool.execute(
      `UPDATE blogs SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    const [updated] = await pool.execute(
      'SELECT * FROM blogs WHERE id = ?',
      [blogId]
    );

    const blog = (updated as any[])[0];
    const response = {
      ...blog,
      tags: blog.tags ? JSON.parse(blog.tags) : [],
    };

    res.json({
      code: 200,
      data: response,
      message: 'Blog updated successfully',
    });
  })
);

/**
 * DELETE /blogs/:id - Delete blog (admin/owner only)
 * @route DELETE /blogs/:id
 * @requires {string[]} auth - ['admin', 'owner']
 * @param {string} param.id - Blog ID
 * @returns {Object} Success message
 */
router.delete(
  '/:id',
  requireAuth(['admin', 'owner']),
  validate([
    param('id').matches(/^\d+$/).withMessage('Validation failed (numeric string is expected)'),
  ]),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const blogId = parseInt(id);

    const [existing] = await pool.execute(
      'SELECT * FROM blogs WHERE id = ?',
      [blogId]
    );

    if ((existing as any[]).length === 0) {
      throw new NotFoundError('BLOG_NOT_FOUND');
    }

    await pool.execute('DELETE FROM blogs WHERE id = ?', [blogId]);

    res.json({
      code: 200,
      message: 'Blog deleted successfully',
    });
  })
);

export default router;

