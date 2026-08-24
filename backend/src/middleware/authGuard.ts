import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { sendError } from '../utils/apiResponse';
import User from '../modules/users/model';

export interface AuthRequest extends Request {
  user?: {
    _id: string;
    name: string;
    email: string;
    role: 'super_admin' | 'admin' | 'team' | 'client';
  };
}

export async function authGuard(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return sendError(res, 'Authentication required', 401);
    }

    const decoded = jwt.verify(token, env.jwtSecret) as { userId: string };
    const user = await User.findById(decoded.userId).select('_id name email role');
    if (!user) {
      return sendError(res, 'User not found', 401);
    }

    req.user = { _id: user._id.toString(), name: user.name, email: user.email, role: user.role };
    next();
  } catch (error) {
    return sendError(res, 'Invalid or expired token', 401);
  }
}
