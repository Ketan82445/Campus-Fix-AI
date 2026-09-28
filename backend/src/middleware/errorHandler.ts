import { Request, Response, NextFunction } from 'express';
import { AppError } from '../types';
import { sendError } from '../utils/response';
import { ZodError } from 'zod';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('❌ Global Error Caught:', err);

  if (err instanceof AppError) {
    return sendError(res, err.message, err.statusCode, err.code);
  }

  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
    return sendError(res, `Validation Error: ${formattedErrors}`, 400, 'VALIDATION_ERROR', err.errors);
  }

  if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError') {
    return sendError(res, 'Invalid or expired token', 401, 'UNAUTHORIZED');
  }

  return sendError(
    res,
    process.env.NODE_ENV === 'production' ? 'An internal server error occurred' : err.message || 'Internal Server Error',
    500,
    'INTERNAL_SERVER_ERROR'
  );
};
