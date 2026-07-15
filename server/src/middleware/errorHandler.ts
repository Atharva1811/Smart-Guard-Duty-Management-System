// server/src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { sendError } from '../utils/response.js';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('💥 Server Error:', err);

  // 1. Zod Input Validation Errors
  if (err instanceof ZodError) {
    const customMessage = err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
    return sendError(res, customMessage, 400, 'Validation failed');
  }

  // 2. Prisma Database Errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // Unique constraint violations
    if (err.code === 'P2002') {
      const target = (err.meta?.target as string[])?.join(', ') || 'field';
      return sendError(res, `A record with this ${target} already exists.`, 409, 'Conflict error');
    }
    // Record not found
    if (err.code === 'P2025') {
      return sendError(res, 'Requested record was not found.', 404, 'Not Found');
    }
  }

  // 3. Default fallback
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server execution failure';
  sendError(res, err.stack || message, statusCode, message);
};
