import { Router } from 'express';
import { param, query, body } from 'express-validator';
import { asyncHandler } from '../middleware/asyncHandler';
import { validate } from '../middleware/validation';
import { NotFoundError, BadRequestError } from '../types/errors';
import pool from '../config/database';

const router = Router();

// GET /casinos - List all casinos with filtering
router.get(
  '/',
  validate([
    query('category').optional().isIn(['cs2', 'general']).withMessage('category must be either "cs2" or "general"'),
    query('status').optional().custom((value) => {
      // Allow undefined, null, empty string, or valid status values
      if (value === undefined || value === null || value === '') {
        return true; // No filter - return all casinos
      }
      if (value === 'draft' || value === 'published') {
        return true;
      }
      throw new Error('status must be either "draft" or "published"');
    }),
    // Page and limit are sanitized in the route handler, no validation needed
  ]),
  asyncHandler(async (req, res) => {
    const { category, status, page: pageParam = '1', limit: limitParam } = req.query;
    
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

    if (category) {
      whereConditions.push('category = ?');
      queryParams.push(category);
    }

    if (status) {
      whereConditions.push('status = ?');
      queryParams.push(status);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    const [rows] = await pool.execute(
      `SELECT * FROM casinos ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...queryParams, limitNum, offset]
    );

    const [countRows] = await pool.execute(
      `SELECT COUNT(*) as total FROM casinos ${whereClause}`,
      queryParams
    );
    const total = (countRows as any[])[0].total;

    // Parse JSON fields
    const casinos = (rows as any[]).map(casino => ({
      ...casino,
      paymentMethodIds: casino.payment_method_ids ? JSON.parse(casino.payment_method_ids) : [],
      tagIds: casino.tag_ids ? JSON.parse(casino.tag_ids) : [],
      gameModeIds: casino.game_mode_ids ? JSON.parse(casino.game_mode_ids) : [],
      reviewContent: casino.review_content ? JSON.parse(casino.review_content) : null,
      stats: {
        landingPageViews: casino.landing_page_views || 0,
        claimBonusClicks: casino.claim_bonus_clicks || 0,
        reviewReads: casino.review_reads || 0,
      },
    }));

    res.json({
      code: 200,
      data: casinos,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  })
);

// GET /casinos/:slug - Get casino by slug
router.get(
  '/:slug',
  validate([
    param('slug').trim().notEmpty().withMessage('slug is required'),
  ]),
  asyncHandler(async (req, res) => {
    const { slug } = req.params;

    const [rows] = await pool.execute(
      'SELECT * FROM casinos WHERE slug = ?',
      [slug]
    );

    const casinos = rows as any[];

    if (casinos.length === 0) {
      throw new NotFoundError('CASINO_NOT_FOUND');
    }

    const casino = casinos[0];
    const result = {
      ...casino,
      paymentMethodIds: casino.payment_method_ids ? JSON.parse(casino.payment_method_ids) : [],
      tagIds: casino.tag_ids ? JSON.parse(casino.tag_ids) : [],
      gameModeIds: casino.game_mode_ids ? JSON.parse(casino.game_mode_ids) : [],
      reviewContent: casino.review_content ? JSON.parse(casino.review_content) : null,
      stats: {
        landingPageViews: casino.landing_page_views || 0,
        claimBonusClicks: casino.claim_bonus_clicks || 0,
        reviewReads: casino.review_reads || 0,
      },
    };

    res.json({
      code: 200,
      data: result,
    });
  })
);

// POST /casinos - Create new casino
router.post(
  '/',
  validate([
    body('name').trim().isLength({ min: 1, max: 100 }).withMessage('name must be between 1 and 100 characters'),
    body('slug').trim().isLength({ min: 1, max: 100 }).withMessage('slug must be between 1 and 100 characters'),
    body('logo').trim().optional().isLength({ max: 500 }).withMessage('logo must be shorter than or equal to 500 characters'),
    body('tagType').optional().isIn(['free', 'deposit']).withMessage('tagType must be either "free" or "deposit"'),
    body('tagText').optional().trim().isLength({ max: 50 }).withMessage('tagText must be shorter than or equal to 50 characters'),
    body('rating').optional().isFloat({ min: 0, max: 5 }).withMessage('rating must be between 0 and 5'),
    body('bonusText').optional().trim().isLength({ max: 100 }).withMessage('bonusText must be shorter than or equal to 100 characters'),
    body('category').optional().isIn(['cs2', 'general']).withMessage('category must be either "cs2" or "general"'),
    body('status').optional().isIn(['draft', 'published']).withMessage('status must be either "draft" or "published"'),
    body('description').optional().trim().isLength({ max: 1000 }).withMessage('description must be shorter than or equal to 1000 characters'),
    body('paymentMethodIds').optional().isArray().withMessage('paymentMethodIds must be an array'),
    body('tagIds').optional().isArray().withMessage('tagIds must be an array'),
    body('gameModeIds').optional().isArray().withMessage('gameModeIds must be an array'),
  ]),
  asyncHandler(async (req, res) => {
    const {
      name,
      slug,
      logo,
      tagType = 'free',
      tagText = '',
      rating = 0,
      bonusText = '',
      rewardsCount = 0,
      category = 'cs2',
      status = 'draft',
      description,
      founded,
      license,
      minDeposit,
      promoCode,
      paymentMethodIds = [],
      tagIds = [],
      gameModeIds = [],
      isFeatured = false,
      hasReview = false,
      reviewContent,
    } = req.body;

    // Check if slug already exists
    const [existing] = await pool.execute(
      'SELECT id FROM casinos WHERE slug = ?',
      [slug]
    );

    if ((existing as any[]).length > 0) {
      throw new BadRequestError('Casino with this slug already exists');
    }

    const [result] = await pool.execute(
      `INSERT INTO casinos (
        name, slug, logo, tag_type, tag_text, rating, bonus_text, rewards_count,
        category, status, description, founded, license, min_deposit, promo_code,
        payment_method_ids, tag_ids, game_mode_ids, is_featured, has_review, review_content
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        slug,
        logo || null,
        tagType,
        tagText,
        rating,
        bonusText,
        rewardsCount,
        category,
        status,
        description || null,
        founded || null,
        license || null,
        minDeposit || null,
        promoCode || null,
        JSON.stringify(paymentMethodIds),
        JSON.stringify(tagIds),
        JSON.stringify(gameModeIds),
        isFeatured ? 1 : 0,
        hasReview ? 1 : 0,
        reviewContent ? JSON.stringify(reviewContent) : null,
      ]
    );

    const insertResult = result as any;
    const [newCasino] = await pool.execute(
      'SELECT * FROM casinos WHERE id = ?',
      [insertResult.insertId]
    );

    const casino = (newCasino as any[])[0];
    const response = {
      ...casino,
      paymentMethodIds: casino.payment_method_ids ? JSON.parse(casino.payment_method_ids) : [],
      tagIds: casino.tag_ids ? JSON.parse(casino.tag_ids) : [],
      gameModeIds: casino.game_mode_ids ? JSON.parse(casino.game_mode_ids) : [],
      reviewContent: casino.review_content ? JSON.parse(casino.review_content) : null,
      stats: {
        landingPageViews: casino.landing_page_views || 0,
        claimBonusClicks: casino.claim_bonus_clicks || 0,
        reviewReads: casino.review_reads || 0,
      },
    };

    res.status(201).json({
      code: 201,
      data: response,
      message: 'Casino created successfully',
    });
  })
);

// PUT /casinos/:id - Update casino
router.put(
  '/:id',
  validate([
    param('id').matches(/^\d+$/).withMessage('Validation failed (numeric string is expected)'),
    body('name').optional().trim().isLength({ min: 1, max: 100 }).withMessage('name must be between 1 and 100 characters'),
    body('slug').optional().trim().isLength({ min: 1, max: 100 }).withMessage('slug must be between 1 and 100 characters'),
    body('description').optional().trim().isLength({ max: 1000 }).withMessage('description must be shorter than or equal to 1000 characters'),
    body('rating').optional().isFloat({ min: 0, max: 5 }).withMessage('rating must be between 0 and 5'),
  ]),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const casinoId = parseInt(id);
    const updates = req.body;

    // Check if casino exists
    const [existing] = await pool.execute(
      'SELECT * FROM casinos WHERE id = ?',
      [casinoId]
    );

    if ((existing as any[]).length === 0) {
      throw new NotFoundError('CASINO_NOT_FOUND');
    }

    // Check if slug is being updated and if it conflicts
    if (updates.slug) {
      const [slugCheck] = await pool.execute(
        'SELECT id FROM casinos WHERE slug = ? AND id != ?',
        [updates.slug, casinoId]
      );
      if ((slugCheck as any[]).length > 0) {
        throw new BadRequestError('Casino with this slug already exists');
      }
    }

    // Build update query dynamically
    const updateFields: string[] = [];
    const updateValues: any[] = [];

    const allowedFields = [
      'name', 'slug', 'logo', 'tag_type', 'tag_text', 'rating', 'bonus_text',
      'rewards_count', 'category', 'status', 'description', 'founded', 'license',
      'min_deposit', 'promo_code', 'payment_method_ids', 'tag_ids', 'game_mode_ids',
      'is_featured', 'has_review', 'review_content'
    ];

    Object.keys(updates).forEach((key) => {
      if (updates[key] !== undefined) {
        if (key === 'paymentMethodIds' || key === 'tagIds' || key === 'gameModeIds') {
          updateFields.push(`${key.replace(/([A-Z])/g, '_$1').toLowerCase()} = ?`);
          updateValues.push(JSON.stringify(updates[key]));
        } else if (key === 'reviewContent') {
          updateFields.push('review_content = ?');
          updateValues.push(JSON.stringify(updates[key]));
        } else if (key === 'isFeatured') {
          updateFields.push('is_featured = ?');
          updateValues.push(updates[key] ? 1 : 0);
        } else if (key === 'hasReview') {
          updateFields.push('has_review = ?');
          updateValues.push(updates[key] ? 1 : 0);
        } else {
          const dbField = key.replace(/([A-Z])/g, '_$1').toLowerCase();
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
    updateValues.push(casinoId);

    await pool.execute(
      `UPDATE casinos SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    const [updated] = await pool.execute(
      'SELECT * FROM casinos WHERE id = ?',
      [casinoId]
    );

    const casino = (updated as any[])[0];
    const response = {
      ...casino,
      paymentMethodIds: casino.payment_method_ids ? JSON.parse(casino.payment_method_ids) : [],
      tagIds: casino.tag_ids ? JSON.parse(casino.tag_ids) : [],
      gameModeIds: casino.game_mode_ids ? JSON.parse(casino.game_mode_ids) : [],
      reviewContent: casino.review_content ? JSON.parse(casino.review_content) : null,
      stats: {
        landingPageViews: casino.landing_page_views || 0,
        claimBonusClicks: casino.claim_bonus_clicks || 0,
        reviewReads: casino.review_reads || 0,
      },
    };

    res.json({
      code: 200,
      data: response,
      message: 'Casino updated successfully',
    });
  })
);

// DELETE /casinos/:id - Delete casino
router.delete(
  '/:id',
  validate([
    param('id').matches(/^\d+$/).withMessage('Validation failed (numeric string is expected)'),
  ]),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const casinoId = parseInt(id);

    const [existing] = await pool.execute(
      'SELECT * FROM casinos WHERE id = ?',
      [casinoId]
    );

    if ((existing as any[]).length === 0) {
      throw new NotFoundError('CASINO_NOT_FOUND');
    }

    await pool.execute('DELETE FROM casinos WHERE id = ?', [casinoId]);

    res.json({
      code: 200,
      message: 'Casino deleted successfully',
    });
  })
);

// POST /casinos/:id/stats/landing-page-view - Track landing page view
router.post(
  '/:id/stats/landing-page-view',
  validate([
    param('id').matches(/^\d+$/).withMessage('Validation failed (numeric string is expected)'),
  ]),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const casinoId = parseInt(id);

    await pool.execute(
      'UPDATE casinos SET landing_page_views = landing_page_views + 1 WHERE id = ?',
      [casinoId]
    );

    res.json({
      code: 200,
      message: 'Stats updated successfully',
    });
  })
);

// POST /casinos/:id/stats/claim-bonus-click - Track claim bonus click
router.post(
  '/:id/stats/claim-bonus-click',
  validate([
    param('id').matches(/^\d+$/).withMessage('Validation failed (numeric string is expected)'),
  ]),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const casinoId = parseInt(id);

    await pool.execute(
      'UPDATE casinos SET claim_bonus_clicks = claim_bonus_clicks + 1 WHERE id = ?',
      [casinoId]
    );

    res.json({
      code: 200,
      message: 'Stats updated successfully',
    });
  })
);

// POST /casinos/:id/stats/review-read - Track review read
router.post(
  '/:id/stats/review-read',
  validate([
    param('id').matches(/^\d+$/).withMessage('Validation failed (numeric string is expected)'),
  ]),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const casinoId = parseInt(id);

    await pool.execute(
      'UPDATE casinos SET review_reads = review_reads + 1 WHERE id = ?',
      [casinoId]
    );

    res.json({
      code: 200,
      message: 'Stats updated successfully',
    });
  })
);

// GET /casinos/filters/options - Get filter options from database
router.get(
  '/filters/options',
  asyncHandler(async (req, res) => {
    // Get unique categories
    const [categoryRows] = await pool.execute(
      'SELECT DISTINCT category FROM casinos WHERE category IS NOT NULL ORDER BY category'
    );
    const categories = (categoryRows as any[]).map(row => row.category);

    // Get unique statuses
    const [statusRows] = await pool.execute(
      'SELECT DISTINCT status FROM casinos WHERE status IS NOT NULL ORDER BY status'
    );
    const statuses = (statusRows as any[]).map(row => row.status);

    // Get unique countries
    const [countryRows] = await pool.execute(
      'SELECT DISTINCT country FROM casinos WHERE country IS NOT NULL ORDER BY country'
    );
    const countries = (countryRows as any[]).map(row => row.country);

    res.json({
      code: 200,
      data: {
        categories,
        statuses,
        countries,
      },
    });
  })
);

export default router;

