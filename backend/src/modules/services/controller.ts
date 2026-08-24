import { Request, Response, NextFunction } from 'express';
import Service from './model';
import ActivityLog from '../activity_log/model';
import { AuthRequest } from '../../middleware/authGuard';
import { sendSuccess } from '../../utils/apiResponse';
import { AppError } from '../../middleware/errorHandler';

export class ServiceController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { category, isActive } = req.query;
      const filter: any = {};
      if (category) filter.category = category;
      if (isActive !== undefined) filter.isActive = isActive === 'true';
      const services = await Service.find(filter).sort({ createdAt: -1 });
      sendSuccess(res, services);
    } catch (error) {
      next(error);
    }
  }

  async getBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const service = await Service.findOne({ slug: req.params.slug });
      if (!service) throw new AppError('Service not found', 404);
      sendSuccess(res, service);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const service = await Service.findById(req.params.id);
      if (!service) throw new AppError('Service not found', 404);
      sendSuccess(res, service);
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const service = await Service.create(req.body);
      await ActivityLog.create({
        userId: req.user!._id,
        action: 'create_service',
        targetType: 'Service',
        targetId: service._id.toString(),
      });
      sendSuccess(res, service, 'Service created', 201);
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const service = await Service.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!service) throw new AppError('Service not found', 404);
      await ActivityLog.create({
        userId: req.user!._id,
        action: 'update_service',
        targetType: 'Service',
        targetId: service._id.toString(),
      });
      sendSuccess(res, service, 'Service updated');
    } catch (error) {
      next(error);
    }
  }

  async remove(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const service = await Service.findByIdAndDelete(req.params.id);
      if (!service) throw new AppError('Service not found', 404);
      await ActivityLog.create({
        userId: req.user!._id,
        action: 'delete_service',
        targetType: 'Service',
        targetId: req.params.id,
      });
      sendSuccess(res, null, 'Service deleted');
    } catch (error) {
      next(error);
    }
  }
}

export const serviceController = new ServiceController();
