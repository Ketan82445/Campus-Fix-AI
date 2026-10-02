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

  // Handle CORS rejection
  if (err.message && err.message.includes('not allowed by CORS')) {
    return sendError(res, 'Access denied by CORS policy', 403, 'CORS_FORBIDDEN');
  }

  // Handle Prisma Database Errors without leaking schema internals
  if (err.code === 'P2002') {
    return sendError(res, 'A record with this unique identifier already exists', 409, 'DUPLICATE_RECORD');
  }
  if (err.code === 'P2025') {
    return sendError(res, 'The requested resource was not found', 404, 'NOT_FOUND');
  }
  if (err.code === 'P2003') {
    return sendError(res, 'Invalid referenced resource', 400, 'FOREIGN_KEY_VIOLATION');
  }

  // Preserve upstream API service unavailability messages (e.g. Gemini 503 High Demand)
  if (err.status === 503 || (err.message && err.message.includes('503 Service Unavailable'))) {
    return sendError(res, err.message, 503, 'SERVICE_UNAVAILABLE');
  }

  return sendError(
    res,
    process.env.NODE_ENV === 'production'
      ? 'An internal server error occurred'
      : err.message || 'Internal Server Error',
    500,
    'INTERNAL_SERVER_ERROR'
  );
};
