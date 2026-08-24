import { Response, NextFunction } from 'express';
import ActivityLog from './model';
import { AuthRequest } from '../../middleware/authGuard';
import { sendSuccess } from '../../utils/apiResponse';

export class ActivityLogController {
  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { page = '1', limit = '50', userId, action, targetType } = req.query;
      const filter: any = {};
      if (userId) filter.userId = userId;
      if (action) filter.action = action;
      if (targetType) filter.targetType = targetType;

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const skip = (pageNum - 1) * limitNum;

      const [logs, total] = await Promise.all([
        ActivityLog.find(filter)
          .populate('userId', 'name email role')
          .skip(skip)
          .limit(limitNum)
          .sort({ timestamp: -1 }),
        ActivityLog.countDocuments(filter),
      ]);

      sendSuccess(res, { logs, total, page: pageNum, totalPages: Math.ceil(total / limitNum) });
    } catch (error) {
      next(error);
    }
  }
}

export const activityLogController = new ActivityLogController();
