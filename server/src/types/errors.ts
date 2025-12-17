export interface ApiError {
  code: number;
  timestamp: string;
  path: string;
  method: string;
  message: string;
  service?: string;
  errors?: Record<string, string> | string;
}

export interface ValidationErrors {
  [key: string]: string;
}

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public errors?: Record<string, string> | string;

  constructor(
    statusCode: number,
    message: string,
    errors?: Record<string, string> | string,
    isOperational = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = isOperational;
    if ((Error as any).captureStackTrace) {
      (Error as any).captureStackTrace(this, this.constructor);
    }
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(404, message);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string, errors?: Record<string, string> | string) {
    super(400, message, errors);
  }
}

export class ValidationError extends AppError {
  constructor(errors: Record<string, string>) {
    super(400, 'Validation failed', errors);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(401, message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(403, message);
  }
}
