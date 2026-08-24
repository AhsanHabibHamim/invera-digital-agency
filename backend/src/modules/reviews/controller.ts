import { Response, NextFunction } from 'express';
import Review from './model';
import Project from '../projects/model';
import { AuthRequest } from '../../middleware/authGuard';
import { sendSuccess } from '../../utils/apiResponse';
import { AppError } from '../../middleware/errorHandler';

export class ReviewController {
  async getAllPublic(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const reviews = await Review.find({ approved: true })
        .populate('clientId', 'name avatarUrl')
        .sort({ createdAt: -1 });
      sendSuccess(res, reviews);
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const filter: any = {};
      if (req.query.approved !== undefined) filter.approved = req.query.approved === 'true';
      const reviews = await Review.find(filter)
        .populate('clientId', 'name email avatarUrl')
        .populate('projectId', 'title')
        .sort({ createdAt: -1 });
      sendSuccess(res, reviews);
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const project = await Project.findById(req.body.projectId);
      if (!project) throw new AppError('Project not found', 404);
      if (project.clientId.toString() !== req.user!._id) {
        throw new AppError('Access denied', 403);
      }
      if (project.status !== 'completed' && project.status !== 'closed') {
        throw new AppError('Project must be completed to review', 400);
      }

      const existing = await Review.findOne({ clientId: req.user!._id, projectId: req.body.projectId });
      if (existing) throw new AppError('You have already reviewed this project', 400);

      const review = await Review.create({
        ...req.body,
        clientId: req.user!._id,
      });

      sendSuccess(res, review, 'Review submitted', 201);
    } catch (error) {
      next(error);
    }
  }

  async approve(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const review = await Review.findByIdAndUpdate(req.params.id, { approved: true }, { new: true });
      if (!review) throw new AppError('Review not found', 404);
      sendSuccess(res, review, 'Review approved');
    } catch (error) {
      next(error);
    }
  }
}

export const reviewController = new ReviewController();
