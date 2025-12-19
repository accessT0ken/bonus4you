import { Request, Response, NextFunction } from 'express';
import { BadRequestError } from '../types/errors';

/**
 * Rate limit entry type
 */
type RateLimitEntry = {
  count: number;
  windowStart: number;
};

const rateLimitStore = new Map<string, RateLimitEntry>();

const CLEANUP_INTERVAL = 5 * 60 * 1000;
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now - entry.windowStart > CLEANUP_INTERVAL) {
      rateLimitStore.delete(key);
    }
  }
}, CLEANUP_INTERVAL);

/**
 * Get client identifier from request
 * @param {Request} req - Express request object
 * @returns {string} Client IP address
 */
function getClientId(req: Request): string {
  const ip =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    req.ip ||
    'unknown';
  return ip;
}

/**
 * Generic rate limiting middleware
 * @param {number} windowMs - Time window in milliseconds
 * @param {number} maxRequests - Maximum requests per window
 * @param {(req: Request) => string} [identifier] - Optional function to generate client identifier
 * @returns {Function} Express middleware function
 */
export const rateLimit = (
  windowMs: number,
  maxRequests: number,
  identifier?: (req: Request) => string
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const clientId = identifier ? identifier(req) : getClientId(req);
    const now = Date.now();
    const entry = rateLimitStore.get(clientId);

    if (!entry || now - entry.windowStart > windowMs) {
      rateLimitStore.set(clientId, { count: 1, windowStart: now });
      next();
    } else {
      if (entry.count >= maxRequests) {
        throw new BadRequestError(
          'Too many requests. Please try again later.'
        );
      }
      entry.count += 1;
      rateLimitStore.set(clientId, entry);
      next();
    }
  };
};

/**
 * Rate limit for login attempts (5 attempts per 15 minutes per IP)
 */
export const loginRateLimit = rateLimit(15 * 60 * 1000, 5);

