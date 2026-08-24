import { Request, Response, NextFunction } from 'express';
import { salesService } from './service';
import { sendSuccess } from '../../utils/apiResponse';

export class SalesController {
  // Pipeline
  async getPipelines(req: Request, res: Response, next: NextFunction) {
    try {
      const pipelines = await salesService.getPipelines();
      sendSuccess(res, pipelines);
    } catch (error) {
      next(error);
    }
  }

  async createPipeline(req: Request, res: Response, next: NextFunction) {
    try {
      const pipeline = await salesService.createPipeline(req.body);
      sendSuccess(res, pipeline, 'Pipeline created', 201);
    } catch (error) {
      next(error);
    }
  }

  async updatePipeline(req: Request, res: Response, next: NextFunction) {
    try {
      const pipeline = await salesService.updatePipeline(req.params.id, req.body);
      sendSuccess(res, pipeline, 'Pipeline updated');
    } catch (error) {
      next(error);
    }
  }

  async deletePipeline(req: Request, res: Response, next: NextFunction) {
    try {
      await salesService.deletePipeline(req.params.id);
      sendSuccess(res, null, 'Pipeline deleted');
    } catch (error) {
      next(error);
    }
  }

  // Targets
  async getTargets(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, period, page = '1', limit = '20' } = req.query;
      const filter: any = {};
      if (userId) filter.userId = userId;
      if (period) filter.period = period;
      const result = await salesService.getTargets(filter, parseInt(page as string), parseInt(limit as string));
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async createTarget(req: Request, res: Response, next: NextFunction) {
    try {
      const target = await salesService.createTarget(req.body);
      sendSuccess(res, target, 'Target created', 201);
    } catch (error) {
      next(error);
    }
  }

  async updateTarget(req: Request, res: Response, next: NextFunction) {
    try {
      const target = await salesService.updateTarget(req.params.id, req.body);
      sendSuccess(res, target, 'Target updated');
    } catch (error) {
      next(error);
    }
  }

  async deleteTarget(req: Request, res: Response, next: NextFunction) {
    try {
      await salesService.deleteTarget(req.params.id);
      sendSuccess(res, null, 'Target deleted');
    } catch (error) {
      next(error);
    }
  }

  // Commissions
  async getCommissions(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, status, page = '1', limit = '20' } = req.query;
      const filter: any = {};
      if (userId) filter.userId = userId;
      if (status) filter.status = status;
      const result = await salesService.getCommissions(filter, parseInt(page as string), parseInt(limit as string));
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async createCommission(req: Request, res: Response, next: NextFunction) {
    try {
      const commission = await salesService.createCommission(req.body);
      sendSuccess(res, commission, 'Commission created', 201);
    } catch (error) {
      next(error);
    }
  }

  async approveCommission(req: Request, res: Response, next: NextFunction) {
    try {
      const commission = await salesService.approveCommission(req.params.id);
      sendSuccess(res, commission, 'Commission approved');
    } catch (error) {
      next(error);
    }
  }

  async markPaid(req: Request, res: Response, next: NextFunction) {
    try {
      const commission = await salesService.markPaid(req.params.id);
      sendSuccess(res, commission, 'Commission marked as paid');
    } catch (error) {
      next(error);
    }
  }

  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await salesService.getSalesStats();
      sendSuccess(res, stats);
    } catch (error) {
      next(error);
    }
  }
}

export const salesController = new SalesController();
