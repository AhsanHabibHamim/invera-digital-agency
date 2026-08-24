import { Request, Response, NextFunction } from 'express';
import CaseStudy from './model';
import { AuthRequest } from '../../middleware/authGuard';
import { sendSuccess } from '../../utils/apiResponse';
import { AppError } from '../../middleware/errorHandler';

export class CaseStudyController {
  async getAllPublic(req: Request, res: Response, next: NextFunction) {
    try {
      const studies = await CaseStudy.find({ published: true }).sort({ publishedAt: -1 });
      sendSuccess(res, studies);
    } catch (error) {
      next(error);
    }
  }

  async getBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const study = await CaseStudy.findOne({ slug: req.params.slug, published: true });
      if (!study) throw new AppError('Case study not found', 404);
      sendSuccess(res, study);
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const studies = await CaseStudy.find().sort({ createdAt: -1 });
      sendSuccess(res, studies);
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const study = await CaseStudy.create({
        ...req.body,
        publishedAt: req.body.published ? new Date() : undefined,
      });
      sendSuccess(res, study, 'Case study created', 201);
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = { ...req.body };
      if (data.published && !data.publishedAt) {
        data.publishedAt = new Date();
      }
      const study = await CaseStudy.findByIdAndUpdate(req.params.id, data, { new: true });
      if (!study) throw new AppError('Case study not found', 404);
      sendSuccess(res, study, 'Case study updated');
    } catch (error) {
      next(error);
    }
  }

  async remove(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const study = await CaseStudy.findByIdAndDelete(req.params.id);
      if (!study) throw new AppError('Case study not found', 404);
      sendSuccess(res, null, 'Case study deleted');
    } catch (error) {
      next(error);
    }
  }
}

export const caseStudyController = new CaseStudyController();
