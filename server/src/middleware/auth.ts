import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '../types/errors';
import pool from '../config/database';

/**
 * Extend Express Request to include user info
 */
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
        email: string;
        role: string;
      };
    }
  }
}

/**
 * Middleware to verify JWT token
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 * @throws {UnauthorizedError} If token is missing, invalid, or user is inactive
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or invalid authorization header');
    }

    const token = authHeader.split(' ')[1];

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET environment variable is not set');
    }

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET);

    const [rows] = await pool.execute(
      'SELECT id, email, role, is_active FROM users WHERE id = ?',
      [decoded.userId]
    );

    const users = rows as any[];
    if (users.length === 0 || users[0].is_active !== 1) {
      throw new UnauthorizedError('User not found or inactive');
    }

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError('Invalid or expired token');
    }
    throw error;
  }
};

/**
 * Middleware to check if user has required role
 * @param {...string} allowedRoles - Allowed user roles
 * @returns {Function} Express middleware function
 * @throws {UnauthorizedError} If user doesn't have required role
 */
export const authorize = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new UnauthorizedError('Insufficient permissions');
    }

    next();
  };
};

/**
 * Combined middleware: authenticate then authorize
 * @param {string[]} [allowedRoles] - Optional array of allowed roles
 * @returns {Function} Express middleware function
 */
export const requireAuth = (allowedRoles?: string[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await authenticate(req, res, () => {
      if (allowedRoles && allowedRoles.length > 0) {
        authorize(...allowedRoles)(req, res, next);
      } else {
        next();
      }
    });
  };
};

