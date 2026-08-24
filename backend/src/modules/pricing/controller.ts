import { Request, Response, NextFunction } from 'express';
import PricingPlan from './model';
import ActivityLog from '../activity_log/model';
import { AuthRequest } from '../../middleware/authGuard';
import { sendSuccess } from '../../utils/apiResponse';
import { AppError } from '../../middleware/errorHandler';

export class PricingController {
  async getAllPublic(req: Request, res: Response, next: NextFunction) {
    try {
      const plans = await PricingPlan.find({ isActive: true }).sort({ order: 1, createdAt: 1 });
      sendSuccess(res, plans);
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { includeInactive } = req.query;
      const filter: any = {};
      if (includeInactive !== 'true') filter.isActive = true;
      const plans = await PricingPlan.find(filter).sort({ order: 1, createdAt: 1 });
      sendSuccess(res, plans);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const plan = await PricingPlan.findById(req.params.id);
      if (!plan) throw new AppError('Pricing plan not found', 404);
      sendSuccess(res, plan);
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const count = await PricingPlan.countDocuments();
      const plan = await PricingPlan.create({ ...req.body, order: count });
      await ActivityLog.create({
        userId: req.user!._id,
        action: 'create_pricing_plan',
        targetType: 'PricingPlan',
        targetId: plan._id.toString(),
        details: `Created pricing plan "${plan.name}"`,
      });
      sendSuccess(res, plan, 'Pricing plan created', 201);
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const plan = await PricingPlan.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!plan) throw new AppError('Pricing plan not found', 404);
      await ActivityLog.create({
        userId: req.user!._id,
        action: 'update_pricing_plan',
        targetType: 'PricingPlan',
        targetId: plan._id.toString(),
        details: `Updated pricing plan "${plan.name}"`,
      });
      sendSuccess(res, plan, 'Pricing plan updated');
    } catch (error) {
      next(error);
    }
  }

  async remove(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const plan = await PricingPlan.findByIdAndDelete(req.params.id);
      if (!plan) throw new AppError('Pricing plan not found', 404);
      await ActivityLog.create({
        userId: req.user!._id,
        action: 'delete_pricing_plan',
        targetType: 'PricingPlan',
        targetId: req.params.id,
        details: `Deleted pricing plan "${plan.name}"`,
      });
      sendSuccess(res, null, 'Pricing plan deleted');
    } catch (error) {
      next(error);
    }
  }

  async toggleActive(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const plan = await PricingPlan.findById(req.params.id);
      if (!plan) throw new AppError('Pricing plan not found', 404);
      plan.isActive = !plan.isActive;
      await plan.save();
      sendSuccess(res, plan, plan.isActive ? 'Pricing plan enabled' : 'Pricing plan disabled');
    } catch (error) {
      next(error);
    }
  }

  async reorder(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { ids } = req.body;
      const operations = ids.map((id: string, index: number) => ({
        updateOne: { filter: { _id: id }, update: { $set: { order: index } } },
      }));
      await PricingPlan.bulkWrite(operations);
      const plans = await PricingPlan.find().sort({ order: 1, createdAt: 1 });
      await ActivityLog.create({
        userId: req.user!._id,
        action: 'reorder_pricing_plans',
        targetType: 'PricingPlan',
        details: 'Reordered pricing plans',
      });
      sendSuccess(res, plans, 'Pricing plans reordered');
    } catch (error) {
      next(error);
    }
  }
}

export const pricingController = new PricingController();
