import { Router } from 'express';
import { param, query, body } from 'express-validator';
import { asyncHandler } from '../middleware/asyncHandler';
import { validate } from '../middleware/validation';
import { NotFoundError, BadRequestError } from '../types/errors';
import pool from '../config/database';

const router = Router();

// GET /blogs - List all blogs with filtering
router.get(
  '/',
  validate([
    query('status').optional().isIn(['draft', 'published']).withMessage('status must be either "draft" or "published"'),
    query('category').optional().trim().isLength({ max: 100 }).withMessage('category must be shorter than or equal to 100 characters'),
    // Page and limit are sanitized in the route handler, no validation needed
  ]),
  asyncHandler(async (req, res) => {
    const { status, category, page: pageParam = '1', limit: limitParam } = req.query;
    
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

    // Parse JSON fields
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

// GET /blogs/:slug - Get blog by slug
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

// POST /blogs - Create new blog
router.post(
  '/',
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

    // Check if slug already exists
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

// PUT /blogs/:id - Update blog
router.put(
  '/:id',
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

    // Check if blog exists
    const [existing] = await pool.execute(
      'SELECT * FROM blogs WHERE id = ?',
      [blogId]
    );

    if ((existing as any[]).length === 0) {
      throw new NotFoundError('BLOG_NOT_FOUND');
    }

    // Check if slug is being updated and if it conflicts
    if (updates.slug) {
      const [slugCheck] = await pool.execute(
        'SELECT id FROM blogs WHERE slug = ? AND id != ?',
        [updates.slug, blogId]
      );
      if ((slugCheck as any[]).length > 0) {
        throw new BadRequestError('Blog with this slug already exists');
      }
    }

    // Build update query dynamically
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

// DELETE /blogs/:id - Delete blog
router.delete(
  '/:id',
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

