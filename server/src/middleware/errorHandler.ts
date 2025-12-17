import { Request, Response, NextFunction } from 'express';
import { AppError, ApiError, ValidationError as CustomValidationError } from '../types/errors';

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let errors: Record<string, string> | string | undefined;

  // Handle known AppError instances (including ValidationError which extends AppError)
  // Check for ValidationError first since it extends AppError
  if (err instanceof CustomValidationError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.errors;
  } else if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.errors;
  } else if (err.name === 'ValidationError' || err.constructor.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    // Try to extract errors from the error object
    if ((err as any).errors) {
      errors = (err as any).errors;
    }
  } else if (err.name === 'CastError' || err.message.includes('Cast to')) {
    statusCode = 400;
    message = 'Invalid data format';
  } else if (err.message.includes('ECONNREFUSED')) {
    statusCode = 503;
    message = 'Database connection failed';
  } else if (err.message) {
    message = err.message;
  }

  // Format timestamp
  const timestamp = new Date().toLocaleString('en-US', {
    timeZone: 'UTC',
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short',
  });

  const errorResponse: ApiError = {
    code: statusCode,
    timestamp,
    path: req.originalUrl || req.url,
    method: req.method,
    message,
    service: process.env.SERVICE_NAME || 'api-gateway',
  };

  // Add errors object if validation errors exist
  if (errors) {
    errorResponse.errors = errors;
  }

  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', {
      statusCode,
      message,
      errors,
      stack: err.stack,
      path: req.originalUrl,
      method: req.method,
      errorType: err.constructor.name,
      isAppError: err instanceof AppError,
      isValidationError: err instanceof CustomValidationError,
    });
  }

  // Ensure we always send JSON response with proper content type
  // Check if headers are already sent to avoid "Cannot set headers after they are sent" error
  if (!res.headersSent) {
    res.status(statusCode).setHeader('Content-Type', 'application/json').json(errorResponse);
  } else {
    // If headers already sent, log the error (shouldn't happen but just in case)
    console.error('Cannot send error response - headers already sent', { statusCode, message });
  }
};

// 404 handler for undefined routes
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const timestamp = new Date().toLocaleString('en-US', {
    timeZone: 'UTC',
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short',
  });

  const errorResponse: ApiError = {
    code: 404,
    timestamp,
    path: req.originalUrl || req.url,
    method: req.method,
    message: 'Route not found',
    service: process.env.SERVICE_NAME || 'api-gateway',
  };

  res.status(404).json(errorResponse);
};
