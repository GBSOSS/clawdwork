import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('Error:', err);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message
      }
    });
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const firstError = err.errors[0];
    const field = firstError.path.join('.');
    const message = firstError.message;

    return res.status(400).json({
      success: false,
      error: {
        code: 'validation_error',
        message: field ? `${field}: ${message}` : message,
        details: err.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      }
    });
  }

  // Include error details in development/debug mode
  const isDev = process.env.NODE_ENV !== 'production';
  res.status(500).json({
    success: false,
    error: {
      code: 'server_error',
      message: isDev ? `${err.message} (${err.name})` : 'An unexpected error occurred',
      ...(isDev && { stack: err.stack?.split('\n').slice(0, 5) })
    }
  });
}
