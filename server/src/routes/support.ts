import type { Request, Response } from 'express';
import { Router } from 'express';
import { body, query, param } from 'express-validator';
import { asyncHandler } from '../middleware/asyncHandler';
import { validate } from '../middleware/validation';
import { BadRequestError, NotFoundError } from '../types/errors';
import pool from '../config/database';

const router: import('express').Router = Router();

// Simple in-memory rate limiting for support messages
type RateEntry = {
  count: number;
  windowStart: number;
};

const rateLimitMap = new Map<string, RateEntry>();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX_MESSAGES = 5; // per window per guest+ip

async function isSupportEnabled(): Promise<boolean> {
  const [rows] = await pool.execute(
    'SELECT support_enabled FROM site_settings WHERE id = 1'
  );
  const settings = rows as any[];
  if (!settings.length) return true;
  return settings[0].support_enabled === 1;
}

// Helper to get guest info
function getGuestMeta(req: any) {
  const ip =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    req.ip ||
    null;
  const userAgent = req.headers['user-agent'] || null;
  return { ip, userAgent };
}

// GET /support/conversations - list conversations for admin
router.get(
  '/conversations',
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

// GET /support/conversations/:id/messages - list messages for a conversation
router.get(
  '/conversations/:id/messages',
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

// POST /support/messages - guest sends message (creates conversation if needed)
router.post(
  '/messages',
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

    // Rate limiting per guest + IP
    const key = `${guestId}|${ip || 'unknown'}`;
    const now = Date.now();
    const existing = rateLimitMap.get(key);

    if (!existing || now - existing.windowStart > RATE_LIMIT_WINDOW_MS) {
      rateLimitMap.set(key, { count: 1, windowStart: now });
    } else {
      if (existing.count >= RATE_LIMIT_MAX_MESSAGES) {
        throw new BadRequestError('Too many messages. Please wait a moment before trying again.');
      }
      existing.count += 1;
      rateLimitMap.set(key, existing);
    }

    // Find open conversation for this guest
    const [existingRows] = await pool.execute(
      'SELECT * FROM support_conversations WHERE guest_id = ? AND status = "open" ORDER BY last_activity_at DESC LIMIT 1',
      [guestId]
    );

    let conversationId: number;

    if ((existingRows as any[]).length > 0) {
      const conv = (existingRows as any[])[0];
      conversationId = conv.id;

      // Optionally update name/email/last_page if provided
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
      // Create new conversation
      const [insert] = await pool.execute(
        `INSERT INTO support_conversations (guest_id, name, email, ip_address, user_agent, last_page, status)
         VALUES (?, ?, ?, ?, ?, ?, 'open')`,
        [guestId, name || null, email || null, ip, userAgent, pageUrl || null]
      );
      const result = insert as any;
      conversationId = result.insertId;
    }

    // Insert message
    await pool.execute(
      `INSERT INTO support_messages (conversation_id, sender_type, sender_id, message, page_url)
       VALUES (?, 'guest', NULL, ?, ?)`,
      [conversationId, message, pageUrl || null]
    );

    // Update last activity
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

// POST /support/conversations/:id/reply - admin replies to a conversation
router.post(
  '/conversations/:id/reply',
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

    // For now, we don't track which admin, just mark sender_type as admin
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

// PATCH /support/conversations/:id/status - close or reopen a conversation
router.patch(
  '/conversations/:id/status',
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

// GET /support/config - support settings
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

// PATCH /support/config - update support settings (enable/disable)
router.patch(
  '/config',
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


