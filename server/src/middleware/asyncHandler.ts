import { Request, Response, NextFunction } from 'express';

type AsyncFunction = (req: Request, res: Response, next: NextFunction) => Promise<any>;

/**
 * Wraps async route handlers to catch errors and pass them to error handler
 * @param {AsyncFunction} fn - Async route handler function
 * @returns {Function} Express middleware function
 */
export const asyncHandler = (fn: AsyncFunction) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
