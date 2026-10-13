import type { Request, Response, NextFunction } from 'express';
import { createLogger } from '../lib/logger.js';

const logger = createLogger('error-handler');

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  logger.error('Unhandled error occurred', {
    message: err?.message,
    stack: err?.stack,
  });

  const statusCode = err?.status || err?.statusCode || 500;
  res.status(statusCode).json({
    error: err?.message || 'Internal Server Error',
    status: statusCode,
  });
}
