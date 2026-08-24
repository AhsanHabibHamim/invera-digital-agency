import { Response } from 'express';

export function sendSuccess(res: Response, data: unknown, message = 'Success', statusCode = 200) {
  return res.status(statusCode).json({ success: true, data, message });
}

export function sendError(res: Response, message: string, statusCode = 500, data?: unknown) {
  return res.status(statusCode).json({ success: false, data: data || null, message });
}
