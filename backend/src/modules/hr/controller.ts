import { Request, Response, NextFunction } from 'express';
import { hrService } from './service';
import { AuthRequest } from '../../middleware/authGuard';
import { sendSuccess } from '../../utils/apiResponse';
import { AppError } from '../../middleware/errorHandler';

export class HRController {
  // Attendance
  async getAttendance(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, date, page = '1', limit = '30' } = req.query;
      const filter: any = {};
      if (userId) filter.userId = userId;
      if (date) {
        const d = new Date(date as string);
        d.setHours(0, 0, 0, 0);
        const next = new Date(d);
        next.setDate(next.getDate() + 1);
        filter.date = { $gte: d, $lt: next };
      }
      const result = await hrService.getAttendance(filter, parseInt(page as string), parseInt(limit as string));
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async checkIn(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const record = await hrService.checkIn(req.user!._id);
      sendSuccess(res, record, 'Checked in', 201);
    } catch (error) {
      next(error);
    }
  }

  async checkOut(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const record = await hrService.checkOut(req.user!._id);
      sendSuccess(res, record, 'Checked out');
    } catch (error) {
      next(error);
    }
  }

  // Leave
  async getLeaves(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { status, userId, page = '1', limit = '20' } = req.query;
      const filter: any = {};
      if (req.user!.role === 'team') filter.userId = req.user!._id;
      if (status) filter.status = status;
      if (userId && req.user!.role !== 'team') filter.userId = userId;
      const result = await hrService.getLeaves(filter, parseInt(page as string), parseInt(limit as string));
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async createLeave(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = { ...req.body, userId: req.body.userId || req.user!._id };
      const leave = await hrService.createLeave(data);
      sendSuccess(res, leave, 'Leave request created', 201);
    } catch (error) {
      next(error);
    }
  }

  async approveLeave(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { status, notes } = req.body;
      if (!['approved', 'rejected'].includes(status)) throw new AppError('Status must be approved or rejected', 400);
      const leave = await hrService.approveLeave(req.params.id, req.user!._id, status, notes);
      sendSuccess(res, leave, `Leave ${status}`);
    } catch (error) {
      next(error);
    }
  }

  // Recruitment
  async getApplications(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, position, page = '1', limit = '20' } = req.query;
      const filter: any = {};
      if (status) filter.status = status;
      if (position) filter.position = position;
      const result = await hrService.getApplications(filter, parseInt(page as string), parseInt(limit as string));
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async createApplication(req: Request, res: Response, next: NextFunction) {
    try {
      const app = await hrService.createApplication(req.body);
      sendSuccess(res, app, 'Application submitted', 201);
    } catch (error) {
      next(error);
    }
  }

  async updateApplication(req: Request, res: Response, next: NextFunction) {
    try {
      const app = await hrService.updateApplication(req.params.id, req.body);
      sendSuccess(res, app, 'Application updated');
    } catch (error) {
      next(error);
    }
  }

  async deleteApplication(req: Request, res: Response, next: NextFunction) {
    try {
      await hrService.deleteApplication(req.params.id);
      sendSuccess(res, null, 'Application deleted');
    } catch (error) {
      next(error);
    }
  }

  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await hrService.getHRStats();
      sendSuccess(res, stats);
    } catch (error) {
      next(error);
    }
  }
}

export const hrController = new HRController();
