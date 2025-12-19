import type { Request, Response } from 'express';
import { Router } from 'express';
import { body, query, param } from 'express-validator';
import { asyncHandler } from '../middleware/asyncHandler';
import { validate } from '../middleware/validation';
import { requireAuth } from '../middleware/auth';
import { rateLimit } from '../middleware/rateLimit';
import { BadRequestError, NotFoundError } from '../types/errors';
import pool from '../config/database';

const router: import('express').Router = Router();

/**
 * Check if support is enabled
 * @returns {Promise<boolean>} True if support is enabled
 */
async function isSupportEnabled(): Promise<boolean> {
  const [rows] = await pool.execute(
    'SELECT support_enabled FROM site_settings WHERE id = 1'
  );
  const settings = rows as any[];
  if (!settings.length) return true;
  return settings[0].support_enabled === 1;
}

/**
 * Get guest metadata from request
 * @param {any} req - Express request object
 * @returns {Object} Guest IP and user agent
 */
function getGuestMeta(req: any) {
  const ip =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    req.ip ||
    null;
  const userAgent = req.headers['user-agent'] || null;
  return { ip, userAgent };
}

/**
 * GET /support/conversations - List conversations for admin (admin/owner only)
 * @route GET /support/conversations
 * @requires {string[]} auth - ['admin', 'owner']
 * @param {string} [query.status] - Filter by status (open, closed)
 * @returns {Object} List of conversations
 */
router.get(
  '/conversations',
  requireAuth(['admin', 'owner']),
  validate([
    query('status').optional().isIn(['open', 'closed']).withMessage('status must be open or closed'),
  ]),
  asyncHandler(async (req, res) => {
    const enabled = await isSupportEnabled();
    if (!enabled) {
      throw new BadRequestError('Support is currently disabled');
    }

    const { status } = req.query;

    const where: string[] = [];
    const params: any[] = [];

    if (status) {
      where.push('status = ?');
      params.push(status);
    }

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const [rows] = await pool.execute(
      `SELECT id, guest_id, name, email, ip_address, last_page, status, last_activity_at, created_at
       FROM support_conversations
       ${whereClause}
       ORDER BY last_activity_at DESC
       LIMIT 100`,
      params
    );

    res.json({
      code: 200,
      data: rows,
    });
  })
);

/**
 * GET /support/conversations/:id/messages - List messages for a conversation (admin/owner only)
 * @route GET /support/conversations/:id/messages
 * @requires {string[]} auth - ['admin', 'owner']
 * @param {string} param.id - Conversation ID
 * @returns {Object} Conversation and messages
 */
router.get(
  '/conversations/:id/messages',
  requireAuth(['admin', 'owner']),
  validate([
    param('id').matches(/^\d+$/).withMessage('Validation failed (numeric string is expected)'),
  ]),
  asyncHandler(async (req, res) => {
    const enabled = await isSupportEnabled();
    if (!enabled) {
      throw new BadRequestError('Support is currently disabled');
    }
    const { id } = req.params;
    const conversationId = parseInt(id);

    const [convRows] = await pool.execute(
      'SELECT * FROM support_conversations WHERE id = ?',
      [conversationId]
    );

    if ((convRows as any[]).length === 0) {
      throw new NotFoundError('CONVERSATION_NOT_FOUND');
    }

    const [messages] = await pool.execute(
      `SELECT id, sender_type, sender_id, message, page_url, created_at
       FROM support_messages
       WHERE conversation_id = ?
       ORDER BY created_at ASC`,
      [conversationId]
    );

    res.json({
      code: 200,
      data: {
        conversation: (convRows as any[])[0],
        messages,
      },
    });
  })
);

/**
 * POST /support/messages - Guest sends message (creates conversation if needed)
 * @route POST /support/messages
 * @param {string} body.guestId - Guest identifier (1-64 chars)
 * @param {string} [body.name] - Guest name (max 100 chars)
 * @param {string} [body.email] - Guest email
 * @param {string} body.message - Message content (3-1000 chars)
 * @param {string} [body.pageUrl] - Current page URL (max 500 chars)
 * @returns {Object} Conversation ID
 */
router.post(
  '/messages',
  rateLimit(60_000, 5, (req) => {
    const { guestId } = req.body;
    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket?.remoteAddress ||
      req.ip ||
      'unknown';
    return `${guestId}|${ip}`;
  }),
  validate([
    body('guestId').trim().isLength({ min: 1, max: 64 }).withMessage('guestId is required'),
    body('name').optional().trim().isLength({ max: 100 }).withMessage('name must be <= 100 chars'),
    body('email').optional().isEmail().withMessage('email must be valid'),
    body('message')
      .trim()
      .isLength({ min: 3, max: 1000 })
      .withMessage('message must be between 3 and 1000 characters'),
    body('pageUrl').optional().trim().isLength({ max: 500 }).withMessage('pageUrl too long'),
  ]),
  asyncHandler(async (req, res) => {
    const enabled = await isSupportEnabled();
    if (!enabled) {
      throw new BadRequestError('Support is currently disabled');
    }
    const { guestId, name, email, message, pageUrl } = req.body;
    const { ip, userAgent } = getGuestMeta(req);

    const [existingRows] = await pool.execute(
      'SELECT * FROM support_conversations WHERE guest_id = ? AND status = "open" ORDER BY last_activity_at DESC LIMIT 1',
      [guestId]
    );

    let conversationId: number;

    if ((existingRows as any[]).length > 0) {
      const conv = (existingRows as any[])[0];
      conversationId = conv.id;

      const updates: string[] = [];
      const params: any[] = [];

      if (name && name !== conv.name) {
        updates.push('name = ?');
        params.push(name);
      }
      if (email && email !== conv.email) {
        updates.push('email = ?');
        params.push(email);
      }
      if (pageUrl && pageUrl !== conv.last_page) {
        updates.push('last_page = ?');
        params.push(pageUrl);
      }

      if (updates.length) {
        params.push(conversationId);
        await pool.execute(
          `UPDATE support_conversations SET ${updates.join(', ')} WHERE id = ?`,
          params
        );
      }
    } else {
      const [insert] = await pool.execute(
        `INSERT INTO support_conversations (guest_id, name, email, ip_address, user_agent, last_page, status)
         VALUES (?, ?, ?, ?, ?, ?, 'open')`,
        [guestId, name || null, email || null, ip, userAgent, pageUrl || null]
      );
      const result = insert as any;
      conversationId = result.insertId;
    }

    await pool.execute(
      `INSERT INTO support_messages (conversation_id, sender_type, sender_id, message, page_url)
       VALUES (?, 'guest', NULL, ?, ?)`,
      [conversationId, message, pageUrl || null]
    );

    await pool.execute(
      'UPDATE support_conversations SET last_activity_at = NOW(), last_page = COALESCE(?, last_page) WHERE id = ?',
      [pageUrl || null, conversationId]
    );

    res.status(201).json({
      code: 201,
      data: { conversationId },
      message: 'Message sent',
    });
  })
);

/**
 * POST /support/conversations/:id/reply - Admin replies to a conversation (admin/owner only)
 * @route POST /support/conversations/:id/reply
 * @requires {string[]} auth - ['admin', 'owner']
 * @param {string} param.id - Conversation ID
 * @param {string} body.message - Reply message
 * @returns {Object} Success message
 */
router.post(
  '/conversations/:id/reply',
  requireAuth(['admin', 'owner']),
  validate([
    param('id').matches(/^\d+$/).withMessage('Validation failed (numeric string is expected)'),
    body('message').trim().isLength({ min: 1 }).withMessage('message is required'),
  ]),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { message } = req.body;
    const conversationId = parseInt(id);

    const [convRows] = await pool.execute(
      'SELECT * FROM support_conversations WHERE id = ?',
      [conversationId]
    );

    if ((convRows as any[]).length === 0) {
      throw new NotFoundError('CONVERSATION_NOT_FOUND');
    }

    await pool.execute(
      `INSERT INTO support_messages (conversation_id, sender_type, sender_id, message, page_url)
       VALUES (?, 'admin', NULL, ?, NULL)`,
      [conversationId, message]
    );

    await pool.execute(
      'UPDATE support_conversations SET last_activity_at = NOW() WHERE id = ?',
      [conversationId]
    );

    res.status(201).json({
      code: 201,
      message: 'Reply sent',
    });
  })
);

/**
 * PATCH /support/conversations/:id/status - Close or reopen a conversation (admin/owner only)
 * @route PATCH /support/conversations/:id/status
 * @requires {string[]} auth - ['admin', 'owner']
 * @param {string} param.id - Conversation ID
 * @param {string} body.status - New status (open, closed)
 * @returns {Object} Success message
 */
router.patch(
  '/conversations/:id/status',
  requireAuth(['admin', 'owner']),
  validate([
    param('id').matches(/^\d+$/).withMessage('Validation failed (numeric string is expected)'),
    body('status').isIn(['open', 'closed']).withMessage('status must be open or closed'),
  ]),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const conversationId = parseInt(id);

    const [convRows] = await pool.execute(
      'SELECT * FROM support_conversations WHERE id = ?',
      [conversationId]
    );

    if ((convRows as any[]).length === 0) {
      throw new NotFoundError('CONVERSATION_NOT_FOUND');
    }

    await pool.execute(
      'UPDATE support_conversations SET status = ? WHERE id = ?',
      [status, conversationId]
    );

    res.json({
      code: 200,
      message: 'Status updated',
    });
  })
);

/**
 * GET /support/config - Get support settings
 * @route GET /support/config
 * @returns {Object} Support configuration
 */
router.get(
  '/config',
  asyncHandler(async (req, res) => {
    const enabled = await isSupportEnabled();
    res.json({
      code: 200,
      data: { supportEnabled: enabled },
    });
  })
);

/**
 * PATCH /support/config - Update support settings (enable/disable) (admin/owner only)
 * @route PATCH /support/config
 * @requires {string[]} auth - ['admin', 'owner']
 * @param {boolean} body.supportEnabled - Support enabled status
 * @returns {Object} Updated support configuration
 */
router.patch(
  '/config',
  requireAuth(['admin', 'owner']),
  validate([
    body('supportEnabled').isBoolean().withMessage('supportEnabled must be a boolean'),
  ]),
  asyncHandler(async (req, res) => {
    const { supportEnabled } = req.body;
    const flag = supportEnabled ? 1 : 0;

    await pool.execute(
      `INSERT INTO site_settings (id, support_enabled)
       VALUES (1, ?)
       ON DUPLICATE KEY UPDATE support_enabled = VALUES(support_enabled)`,
      [flag]
    );

    res.json({
      code: 200,
      data: { supportEnabled },
      message: 'Support settings updated',
    });
  })
);

export default router;


