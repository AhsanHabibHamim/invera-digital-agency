import { Response, NextFunction } from 'express';
import Notification from './model';
import { AuthRequest } from '../../middleware/authGuard';
import { sendSuccess } from '../../utils/apiResponse';

export class NotificationController {
  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
      const filter = { userId: req.user!._id };

      const [notifications, total, unreadCount] = await Promise.all([
        Notification.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
        Notification.countDocuments(filter),
        Notification.countDocuments({ ...filter, isRead: false }),
      ]);
      sendSuccess(res, {
        notifications,
        unreadCount,
        page,
        totalPages: Math.max(1, Math.ceil(total / limit)),
        total,
      });
    } catch (error) {
      next(error);
    }
  }

  async markRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await Notification.findOneAndUpdate(
        { _id: req.params.id, userId: req.user!._id },
        { isRead: true }
      );
      sendSuccess(res, null, 'Marked as read');
    } catch (error) {
      next(error);
    }
  }

  async markAllRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await Notification.updateMany({ userId: req.user!._id, isRead: false }, { isRead: true });
      sendSuccess(res, null, 'All marked as read');
    } catch (error) {
      next(error);
    }
  }
}

export const notificationController = new NotificationController();
