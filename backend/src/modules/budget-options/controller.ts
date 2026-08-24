import { Request, Response, NextFunction } from 'express';
import BudgetOption from './model';
import ActivityLog from '../activity_log/model';
import { AuthRequest } from '../../middleware/authGuard';
import { sendSuccess } from '../../utils/apiResponse';
import { AppError } from '../../middleware/errorHandler';

export class BudgetOptionController {
  async getAllPublic(req: Request, res: Response, next: NextFunction) {
    try {
      const options = await BudgetOption.find({ isActive: true }).sort({ order: 1, createdAt: 1 });
      sendSuccess(res, options);
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { includeInactive } = req.query;
      const filter: any = {};
      if (includeInactive !== 'true') filter.isActive = true;
      const options = await BudgetOption.find(filter).sort({ order: 1, createdAt: 1 });
      sendSuccess(res, options);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const option = await BudgetOption.findById(req.params.id);
      if (!option) throw new AppError('Budget option not found', 404);
      sendSuccess(res, option);
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const count = await BudgetOption.countDocuments();
      const option = await BudgetOption.create({ ...req.body, order: count });
      await ActivityLog.create({
        userId: req.user!._id,
        action: 'create_budget_option',
        targetType: 'BudgetOption',
        targetId: option._id.toString(),
        details: `Created budget option "${option.label}"`,
      });
      sendSuccess(res, option, 'Budget option created', 201);
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const option = await BudgetOption.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!option) throw new AppError('Budget option not found', 404);
      await ActivityLog.create({
        userId: req.user!._id,
        action: 'update_budget_option',
        targetType: 'BudgetOption',
        targetId: option._id.toString(),
        details: `Updated budget option "${option.label}"`,
      });
      sendSuccess(res, option, 'Budget option updated');
    } catch (error) {
      next(error);
    }
  }

  async remove(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const option = await BudgetOption.findByIdAndDelete(req.params.id);
      if (!option) throw new AppError('Budget option not found', 404);
      await ActivityLog.create({
        userId: req.user!._id,
        action: 'delete_budget_option',
        targetType: 'BudgetOption',
        targetId: req.params.id,
        details: `Deleted budget option "${option.label}"`,
      });
      sendSuccess(res, null, 'Budget option deleted');
    } catch (error) {
      next(error);
    }
  }

  async toggleActive(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const option = await BudgetOption.findById(req.params.id);
      if (!option) throw new AppError('Budget option not found', 404);
      option.isActive = !option.isActive;
      await option.save();
      sendSuccess(res, option, option.isActive ? 'Budget option enabled' : 'Budget option disabled');
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
      await BudgetOption.bulkWrite(operations);
      const options = await BudgetOption.find().sort({ order: 1, createdAt: 1 });
      await ActivityLog.create({
        userId: req.user!._id,
        action: 'reorder_budget_options',
        targetType: 'BudgetOption',
        details: 'Reordered budget options',
      });
      sendSuccess(res, options, 'Budget options reordered');
    } catch (error) {
      next(error);
    }
  }
}

export const budgetOptionController = new BudgetOptionController();
