import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import mongoose from 'mongoose';
import { sendError } from '../utils/apiResponse';
import { logger } from '../utils/logger';

export class AppError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

function getRequestDebug(req: Request) {
  return {
    method: req.method,
    path: req.originalUrl || req.url,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  };
}

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  const anyErr = err as any;
  logger.error('Request error:', {
    name: anyErr?.name,
    message: anyErr?.message,
    statusCode: anyErr?.statusCode,
    stack: anyErr?.stack,
    mongo: anyErr?.code,
    mongoKey: anyErr?.keyValue,
    request: getRequestDebug(req),
  });

  if (err instanceof AppError) {
    return sendError(res, err.message, err.statusCode);
  }

  if (err instanceof multer.MulterError) {
    return sendError(res, err.message, 400);
  }

  if (err.message === 'File type not allowed') {
    return sendError(res, err.message, 400);
  }

  if (err instanceof mongoose.Error.ValidationError) {
    return sendError(res, 'Validation failed', 400, (err as any).errors);
  }

  if (err instanceof mongoose.Error.CastError) {
    return sendError(res, 'Resource not found', 404);
  }

  if (anyErr?.code === 11000) {
    const key = anyErr?.keyValue ? Object.keys(anyErr.keyValue)[0] : 'field';
    const value = anyErr?.keyValue ? anyErr.keyValue[key] : undefined;
    const msg = value !== undefined ? `${key} already exists` : 'Duplicate value';
    return sendError(res, msg, 400, { key, value });
  }

  return sendError(res, 'Internal server error', 500);
}
